// app/api/cron/grace-check/route.ts
//
// Vercel Cron — runs daily at 01:00 UTC.
// vercel.json: { "path": "/api/cron/grace-check", "schedule": "0 1 * * *" }
//
// Lifecycle:
//   Pending  → Overdue   (overdue_at passed)
//   Overdue  → Suspended (grace_ends_at passed → suspend tenant)
//   Suspended → Terminated (suspension_expires_at passed → auto-terminate)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOverdueNotificationEmail } from "@/lib/mailer";
import { logAudit, AuditEvent } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function sendGraceStartEmail(email: string, businessName: string, graceEndsAt: Date) {
  console.log(`[email] Grace period started for ${businessName}, ends ${graceEndsAt.toISOString()}`);
}

async function sendAutoSuspendEmail(email: string, businessName: string, suspensionEndsAt: Date) {
  console.log(`[email] Auto-suspended ${businessName}, until ${suspensionEndsAt.toISOString()}`);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── Load settings ──────────────────────────────────────────────────────────
  const { data: settings, error: settingsError } = await supabase
    .from("billing_settings")
    .select("grace_period_days, suspension_days, monthly_price")
    .single();

  if (settingsError || !settings) {
    return NextResponse.json({ error: "Could not load billing settings." }, { status: 500 });
  }

  const results = {
    moved_to_grace: [] as string[],
    suspended:      [] as string[],
    terminated:     [] as string[],
    errors:         [] as string[],
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Pending records past overdue_at → mark Overdue + open Grace
  // ─────────────────────────────────────────────────────────────────────────
  const { data: nowOverdue } = await supabase
    .from("subscription_records")
    .select(`
      subscription_id,
      tenant_id,
      billing_period,
      overdue_at,
      grace_ends_at,
      notification_sent_at,
      tenants ( business_name, owner_email )
    `)
    .eq("payment_status", "Pending")
    .lt("overdue_at", now.toISOString());

  for (const record of nowOverdue ?? []) {
    const t = (Array.isArray(record.tenants) ? record.tenants[0] : record.tenants) as {
      business_name: string;
      owner_email:   string;
    };

    // Compute grace_ends_at if not already set
    let graceEndsAt: Date;
    if (record.grace_ends_at) {
      graceEndsAt = new Date(record.grace_ends_at);
    } else {
      graceEndsAt = new Date(record.overdue_at!);
      graceEndsAt.setDate(graceEndsAt.getDate() + settings.grace_period_days);
    }

    const { error: updateError } = await supabase
      .from("subscription_records")
      .update({
        payment_status: "Overdue",
        grace_ends_at:  graceEndsAt.toISOString(),
      })
      .eq("subscription_id", record.subscription_id);

    if (updateError) {
      results.errors.push(`Overdue update failed for ${record.subscription_id}: ${updateError.message}`);
      continue;
    }

    results.moved_to_grace.push(record.subscription_id);

    // Send overdue + grace start email (once)
    if (!record.notification_sent_at) {
      try {
        await sendOverdueNotificationEmail(t.owner_email, t.business_name, record.billing_period);
        await sendGraceStartEmail(t.owner_email, t.business_name, graceEndsAt);
        await supabase
          .from("subscription_records")
          .update({ notification_sent_at: now.toISOString() })
          .eq("subscription_id", record.subscription_id);
        await supabase.from("billing_notifications").insert({
          tenant_id:         record.tenant_id,
          notification_type: "grace_period_started",
          recipient_email:   t.owner_email,
          subject:           `⚠️ Grace period started — ${t.business_name}`,
        });

        // Audit: grace period started
        await logAudit({
          performedBy:  "Cron: grace-check",
          eventType:    AuditEvent.GRACE_PERIOD_STARTED,
          tenantId:     record.tenant_id,
          businessName: t.business_name,
          description:  `Grace period started for billing period ${record.billing_period}. Grace window closes ${graceEndsAt.toISOString().split("T")[0]}. Overdue notification dispatched.`,
          metadata: {
            subscriptionId: record.subscription_id,
            billingPeriod:  record.billing_period,
            graceEndsAt:    graceEndsAt.toISOString(),
          },
        });
      } catch (e) {
        results.errors.push(`Grace email failed for ${record.subscription_id}: ${e}`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Overdue records past grace_ends_at → auto-suspend tenant
  // ─────────────────────────────────────────────────────────────────────────
  const { data: pastGrace } = await supabase
    .from("subscription_records")
    .select(`
      subscription_id,
      tenant_id,
      billing_period,
      grace_ends_at,
      tenants ( business_name, owner_email, owner_full_name, is_suspended )
    `)
    .eq("payment_status", "Overdue")
    .lt("grace_ends_at", now.toISOString());

  for (const record of pastGrace ?? []) {
    const t = (Array.isArray(record.tenants) ? record.tenants[0] : record.tenants) as {
      business_name:  string;
      owner_email:    string;
      owner_full_name: string;
      is_suspended:   boolean;
    };

    // Skip if already suspended
    if (t.is_suspended) continue;

    const suspensionEndsAt = new Date(now);
    suspensionEndsAt.setDate(suspensionEndsAt.getDate() + settings.suspension_days);

    // 1. Insert into suspended_tenants
    const { error: suspendInsertError } = await supabase
      .from("suspended_tenants")
      .insert({
        tenant_id:             record.tenant_id,
        business_name:         t.business_name,
        owner_name:            t.owner_full_name,
        owner_email:           t.owner_email,
        reason:                "Non-payment after grace period expired.",
        suspension_expires_at: suspensionEndsAt.toISOString(),
      });

    if (suspendInsertError) {
      results.errors.push(`Suspend insert failed for ${record.tenant_id}: ${suspendInsertError.message}`);
      continue;
    }

    // 2. Update tenant flags
    await supabase
      .from("tenants")
      .update({
        is_suspended:        true,
        suspended_until:     suspensionEndsAt.toISOString(),
        subscription_status: "Suspended",
        is_active:           false,
      })
      .eq("tenant_id", record.tenant_id);

    // 3. Deactivate users
    await supabase
      .from("users")
      .update({ is_active: false })
      .eq("tenant_id", record.tenant_id);

    // 4. Keep billing record as Overdue (still unpaid)
    await supabase
      .from("subscription_records")
      .update({ payment_status: "Overdue" })
      .eq("subscription_id", record.subscription_id);

    results.suspended.push(record.tenant_id);

    // Audit: tenant suspended
    await logAudit({
      performedBy:  "Automated System",
      eventType:    AuditEvent.TENANT_SUSPENDED,
      tenantId:     record.tenant_id,
      businessName: t.business_name,
      description:  `Automatic suspension triggered. Grace period expired without payment for billing period ${record.billing_period}. Account access disabled.`,
      metadata: {
        subscriptionId:   record.subscription_id,
        billingPeriod:    record.billing_period,
        suspensionEndsAt: suspensionEndsAt.toISOString(),
      },
    });

    try {
      await sendAutoSuspendEmail(t.owner_email, t.business_name, suspensionEndsAt);
      await supabase.from("billing_notifications").insert({
        tenant_id:         record.tenant_id,
        notification_type: "auto_suspended",
        recipient_email:   t.owner_email,
        subject:           `🚫 Account suspended — ${t.business_name}`,
      });

      // Audit: suspension notice sent
      await logAudit({
        performedBy:  "Automated System",
        eventType:    AuditEvent.SUSPENSION_NOTICE_SENT,
        tenantId:     record.tenant_id,
        businessName: t.business_name,
        description:  "Suspension notification dispatched to owner's email.",
      });
    } catch (e) {
      results.errors.push(`Suspend email failed for ${record.tenant_id}: ${e}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Suspension window expired → auto-terminate
  // ─────────────────────────────────────────────────────────────────────────
  const { data: expiredSuspensions } = await supabase
    .from("suspended_tenants")
    .select("id, tenant_id, business_name, owner_name, owner_email")
    .lt("suspension_expires_at", now.toISOString());

  for (const row of expiredSuspensions ?? []) {
    // 1. Audit BEFORE deletion (tenant_id FK will be set null after cascade)
    await logAudit({
      performedBy:  "Automated System",
      eventType:    AuditEvent.TENANT_TERMINATED,
      tenantId:     row.tenant_id,
      businessName: row.business_name,
      description:  "Automatic termination triggered. Suspension window expired without payment. Account and all associated data permanently removed.",
      metadata: {
        ownerName:  row.owner_name,
        ownerEmail: row.owner_email,
      },
    });

    // 2. Archive to terminated_business
    await supabase.from("terminated_business").insert({
      business_name: row.business_name,
      owner_name:    row.owner_name,
      owner_email:   row.owner_email,
      remarks:       "Auto-terminated: suspension window expired without payment.",
    });

    // 3. Get user_id for auth deletion
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("tenant_id", row.tenant_id)
      .single();

    if (user) {
      await supabase.auth.admin.deleteUser(user.user_id);
    }

    // 4. Delete tenant (cascades users, billing records)
    await supabase.from("tenants").delete().eq("tenant_id", row.tenant_id);

    // 5. Remove from suspended_tenants
    await supabase.from("suspended_tenants").delete().eq("id", row.id);

    results.terminated.push(row.tenant_id);
  }

  console.log("[cron/grace-check] Completed:", results);
  return NextResponse.json({ success: true, results });
}
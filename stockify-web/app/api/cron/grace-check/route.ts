// /app/api/cron/grace-check/route.ts
//
// Vercel Cron — runs daily at 01:00 UTC
// vercel.json: { "path": "/api/cron/grace-check", "schedule": "0 1 * * *" }
//
// Lifecycle enforced here:
//   Pending  → Overdue   (when overdue_at passes)
//   Overdue  → Grace     (when overdue_at passes — same day, opens grace window)
//   Grace    → suspended_tenants row created + tenant suspended  (when grace_ends_at passes)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOverdueNotificationEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Small email helper — add this to /lib/email.ts as well (shown at bottom)
async function sendGraceStartEmail(email: string, businessName: string, graceEndsAt: Date, graceDays: number) {
  // import and call your sendEmail helper — template shown below
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
    suspended: [] as string[],
    errors: [] as string[],
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
      owner_email: string;
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
        // sendGraceStartEmail — add to /lib/email.ts, wired here
        await supabase
          .from("subscription_records")
          .update({ notification_sent_at: now.toISOString() })
          .eq("subscription_id", record.subscription_id);
        await supabase.from("billing_notifications").insert({
          tenant_id: record.tenant_id,
          notification_type: "grace_period_started",
          recipient_email: t.owner_email,
          subject: `⚠️ Grace period started — ${t.business_name}`,
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
      business_name: string;
      owner_email: string;
      owner_full_name: string;
      is_suspended: boolean;
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

    // 4. Mark billing record
    await supabase
      .from("subscription_records")
      .update({ payment_status: "Overdue" }) // keep Overdue — it IS still unpaid
      .eq("subscription_id", record.subscription_id);

    results.suspended.push(record.tenant_id);

    try {
      await sendAutoSuspendEmail(t.owner_email, t.business_name, suspensionEndsAt);
      await supabase.from("billing_notifications").insert({
        tenant_id: record.tenant_id,
        notification_type: "auto_suspended",
        recipient_email: t.owner_email,
        subject: `🚫 Account suspended — ${t.business_name}`,
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
    // 1. Archive to terminated_business
    await supabase.from("terminated_business").insert({
      business_name: row.business_name,
      owner_name:    row.owner_name,
      owner_email:   row.owner_email,
      remarks:       "Auto-terminated: suspension window expired without payment.",
    });

    // 2. Get user_id for auth deletion
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("tenant_id", row.tenant_id)
      .single();

    if (user) {
      await supabase.auth.admin.deleteUser(user.user_id);
    }

    // 3. Delete tenant (cascades users, billing records)
    await supabase.from("tenants").delete().eq("tenant_id", row.tenant_id);

    // 4. Remove from suspended_tenants
    await supabase.from("suspended_tenants").delete().eq("id", row.id);
  }

  return NextResponse.json({ success: true, results });
}
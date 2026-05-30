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
import { sendOverdueNotificationEmail, sendGracePeriodEmail, sendAutoSuspendEmail, sendTerminationEmail } from "@/lib/mailer";
import { logAudit, AuditEvent } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function terminateTenant(
  tenantId: string,
  businessName: string,
  ownerName: string,
  ownerEmail: string,
  remarks: string
) {
  // 1. Fetch all user IDs for this tenant
  const { data: users } = await supabase
    .from("users")
    .select("user_id")
    .eq("tenant_id", tenantId);

  // 2. Send termination email BEFORE deleting data
  try {
    await sendTerminationEmail(
      ownerEmail,
      businessName,
      ownerName,
      remarks
    );
  } catch (e) {
    console.error(`[cron/grace-check] Email failed for tenant ${tenantId}:`, e);
  }

  // 3. Archive into terminated_business
  await supabase.from("terminated_business").insert({
    business_name: businessName,
    owner_name:    ownerName,
    owner_email:   ownerEmail,
    remarks,
  });

  // 4. Audit: tenant terminated
  await logAudit({
    performedBy:  "Automated System",
    eventType:    AuditEvent.TENANT_TERMINATED,
    tenantId,
    businessName,
    description:  `Automatic termination triggered. Remarks: "${remarks}"`,
    metadata: {
      ownerEmail,
      remarks,
      userCount:   users?.length ?? 0,
    },
  });

  // 5. Delete from auth.users
  if (users && users.length > 0) {
    const results = await Promise.allSettled(
      users.map((u) => supabase.auth.admin.deleteUser(u.user_id))
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(
        `[cron/grace-check] Some auth.users deletions failed for tenant ${tenantId}:`,
        failed.map((f) => (f as PromiseRejectedResult).reason)
      );
    }
  }

  // 6. Delete tenant row (cascades → users + subscription_records)
  await supabase.from("tenants").delete().eq("tenant_id", tenantId);

  // 7. Clean up from suspended_tenants if present
  await supabase.from("suspended_tenants").delete().eq("tenant_id", tenantId);
}


function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Real email functions are imported from @/lib/mailer above.

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
  const { data: nowOverdue, error: nowOverdueError } = await supabase
    .from("subscription_records")
    .select("subscription_id, tenant_id, billing_period, overdue_at, grace_ends_at, notification_sent_at")
    .eq("payment_status", "Pending")
    .lt("overdue_at", now.toISOString());

  if (nowOverdueError) {
    results.errors.push(`Step 1 query failed: ${nowOverdueError.message}`);
  }

  if ((nowOverdue ?? []).length > 0) {
    // Fetch tenant info for all affected tenants in one query
    const step1TenantIds = [...new Set((nowOverdue ?? []).map(r => r.tenant_id))];
    const { data: step1Tenants } = await supabase
      .from("tenants")
      .select("tenant_id, business_name, owner_email")
      .in("tenant_id", step1TenantIds);
    const step1Map = new Map<string, { business_name: string; owner_email: string }>();
    (step1Tenants || []).forEach((t: any) => step1Map.set(t.tenant_id, t));

    for (const record of nowOverdue ?? []) {
      const t = step1Map.get(record.tenant_id) ?? { business_name: "Unknown", owner_email: "" };

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
          await sendGracePeriodEmail(t.owner_email, t.business_name, graceEndsAt, settings.grace_period_days);
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
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Overdue records past grace_ends_at → auto-suspend tenant
  // ─────────────────────────────────────────────────────────────────────────
  const { data: pastGrace, error: pastGraceError } = await supabase
    .from("subscription_records")
    .select("subscription_id, tenant_id, billing_period, grace_ends_at")
    .eq("payment_status", "Overdue")
    .lt("grace_ends_at", now.toISOString());

  if (pastGraceError) {
    results.errors.push(`Step 2 query failed: ${pastGraceError.message}`);
  }

  if ((pastGrace ?? []).length > 0) {
    const step2TenantIds = [...new Set((pastGrace ?? []).map(r => r.tenant_id))];
    const { data: step2Tenants } = await supabase
      .from("tenants")
      .select("tenant_id, business_name, owner_email, owner_full_name, is_suspended")
      .in("tenant_id", step2TenantIds);
    const step2Map = new Map<string, { business_name: string; owner_email: string; owner_full_name: string; is_suspended: boolean }>();
    (step2Tenants || []).forEach((t: any) => step2Map.set(t.tenant_id, t));

    for (const record of pastGrace ?? []) {
      const t = step2Map.get(record.tenant_id);
      if (!t || t.is_suspended) continue; // Skip if already suspended or tenant not found

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

      // 4. Mark billing record as "Missed"
      await supabase
        .from("subscription_records")
        .update({ payment_status: "Missed" })
        .eq("subscription_id", record.subscription_id);

      results.suspended.push(record.tenant_id);

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
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Auto-terminate past due / expired suspensions
  // ─────────────────────────────────────────────────────────────────────────
  const tenantsToTerminate = new Map<string, {
    tenant_id: string;
    business_name: string;
    owner_name: string;
    owner_email: string;
    remarks: string;
  }>();

  // A. Check based on "Missed" subscription records where overdue_at + suspensionDays <= now
  const { data: missedRecords, error: missedRecordsError } = await supabase
    .from("subscription_records")
    .select("subscription_id, tenant_id, overdue_at, billing_period")
    .eq("payment_status", "Missed");

  if (missedRecordsError) {
    results.errors.push(`Step 3 missed records query failed: ${missedRecordsError.message}`);
  }

  if (missedRecords && missedRecords.length > 0) {
    // Resolve tenant info
    const missedTenantIds = [...new Set(missedRecords.map(r => r.tenant_id))];
    const { data: missedTenants } = await supabase
      .from("tenants")
      .select("tenant_id, business_name, owner_full_name, owner_email")
      .in("tenant_id", missedTenantIds);

    const missedTenantMap = new Map<string, { business_name: string; owner_full_name: string; owner_email: string }>();
    (missedTenants || []).forEach((t: any) => missedTenantMap.set(t.tenant_id, t));

    for (const record of missedRecords) {
      if (!record.overdue_at) continue;
      const t = missedTenantMap.get(record.tenant_id);
      if (!t) continue;

      const termDate = new Date(record.overdue_at);
      termDate.setDate(termDate.getDate() + settings.suspension_days);

      if (now >= termDate) {
        tenantsToTerminate.set(record.tenant_id, {
          tenant_id: record.tenant_id,
          business_name: t.business_name,
          owner_name: t.owner_full_name,
          owner_email: t.owner_email,
          remarks: `Auto-terminated: unpaid subscription for period ${record.billing_period} passed suspension window.`,
        });
      }
    }
  }

  // B. Check based on suspended_tenants where suspension_expires_at <= now
  const { data: expiredSuspensions, error: expiredSuspensionsError } = await supabase
    .from("suspended_tenants")
    .select("id, tenant_id, business_name, owner_name, owner_email, suspension_expires_at")
    .lt("suspension_expires_at", now.toISOString());

  if (expiredSuspensionsError) {
    results.errors.push(`Step 3 expired suspensions query failed: ${expiredSuspensionsError.message}`);
  }

  for (const row of expiredSuspensions ?? []) {
    if (!row.tenant_id) continue;
    tenantsToTerminate.set(row.tenant_id, {
      tenant_id: row.tenant_id,
      business_name: row.business_name,
      owner_name: row.owner_name,
      owner_email: row.owner_email,
      remarks: tenantsToTerminate.get(row.tenant_id)?.remarks ?? "Auto-terminated: suspension window expired without payment.",
    });
  }

  // C. Execute terminations
  for (const tenantInfo of tenantsToTerminate.values()) {
    try {
      await terminateTenant(
        tenantInfo.tenant_id,
        tenantInfo.business_name,
        tenantInfo.owner_name,
        tenantInfo.owner_email,
        tenantInfo.remarks
      );
      results.terminated.push(tenantInfo.tenant_id);
    } catch (e: any) {
      results.errors.push(`Termination failed for tenant ${tenantInfo.tenant_id}: ${e.message || e}`);
    }
  }

  console.log("[cron/grace-check] Completed:", results);
  return NextResponse.json({ success: true, results });
}
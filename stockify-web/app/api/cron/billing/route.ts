// app/api/cron/billing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAudit, AuditEvent } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextBillingPeriod(billingPeriod: string): string {
  const d = new Date(billingPeriod + "T00:00:00");
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function calcOverdueAt(billingPeriod: string, billingDueDays: number): string {
  const d = new Date(billingPeriod + "T00:00:00");
  d.setDate(d.getDate() + billingDueDays);
  return d.toISOString();
}

function calcGraceEndsAt(overdueAt: string, gracePeriodDays: number): string {
  const d = new Date(overdueAt);
  d.setDate(d.getDate() + gracePeriodDays);
  return d.toISOString();
}

// ── GET ───────────────────────────────────────────────────────────────────────
// Feeds the data and stats to the Superadmin Billing Dashboard

export async function GET(req: NextRequest) {
  try {
    const { data: settings } = await supabase
      .from("billing_settings")
      .select("suspension_days")
      .single();

    const suspensionDays = settings?.suspension_days ?? 14;

    // 1. Fetch subscription records (no FK join — resolved separately below)
    const { data: records, error } = await supabase
      .from("subscription_records")
      .select(
        "subscription_id, tenant_id, billing_period, payment_status, amount, amount_paid, paid_at, overdue_at, grace_ends_at"
      )
      .order("billing_period", { ascending: false });

    if (error) throw error;

    // 2. Resolve tenant info for all records in one query
    const tenantIds = [...new Set((records || []).map((r: any) => r.tenant_id).filter(Boolean))];
    let tenantMap = new Map<string, { business_name: string; owner_full_name: string; owner_email: string; subscription_status: string; is_suspended: boolean }>();

    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("tenant_id, business_name, owner_full_name, owner_email, subscription_status, is_suspended")
        .in("tenant_id", tenantIds);
      (tenants || []).forEach((t: any) => tenantMap.set(t.tenant_id, t));
    }

    let totalPaid = 0;
    let overdueCount = 0;
    let missedCount = 0;
    let suspendedCount = 0;

    // 3. Format the data to match your frontend's `BillingRow` interface
    const rows = (records || []).map((r: any) => {
      const billed = Number(r.amount || 0);
      const paid = Number(r.amount_paid || 0);
      const balance = Math.max(0, billed - paid);

      const tenant = tenantMap.get(r.tenant_id) ?? {
        business_name: "Unknown Business",
        owner_full_name: "Unknown Owner",
        owner_email: "",
        subscription_status: "Active",
        is_suspended: false,
      };

      let displayStatus = r.payment_status;

      // Determine display status:
      // - "Missed" only when the subscription record itself is tagged "Missed"
      //   (auto-set by grace-check cron when grace period expires unpaid)
      // - "Suspended" when the tenant was manually suspended from Tenant Management
      //   but the billing record is NOT yet "Missed"
      if (
        tenant.subscription_status === "Suspended" &&
        tenant.is_suspended === true &&
        r.payment_status !== "Missed"
      ) {
        displayStatus = "Suspended";
      }

      // Tally stats
      if (displayStatus === "Paid") {
        if (r.paid_at && new Date(r.paid_at).getFullYear() === new Date().getFullYear()) {
          totalPaid += paid;
        }
      } else if (displayStatus === "Overdue") {
        overdueCount++;
      } else if (displayStatus === "Missed") {
        missedCount++;
      } else if (displayStatus === "Suspended") {
        suspendedCount++;
      }

      let terminationDate = null;
      if (r.overdue_at) {
        const d = new Date(r.overdue_at);
        d.setDate(d.getDate() + suspensionDays);
        terminationDate = d.toISOString();
      }

      return {
        tenant_id: r.tenant_id,
        business_name: tenant.business_name,
        owner_full_name: tenant.owner_full_name,
        owner_email: tenant.owner_email,
        subscription_status: tenant.subscription_status,
        display_status: displayStatus,
        // Show the month/year of the due date (overdue_at) as the billing period label
        billing_period: r.overdue_at
          ? r.overdue_at.slice(0, 7)
          : r.billing_period,
        due_date: r.overdue_at,
        grace_ends_at: r.grace_ends_at,
        last_paid_at: r.paid_at,
        termination_date: terminationDate,
        balance,
        subscription_id: r.subscription_id,
        next_billing_date: null,
      };
    });

    // 4. Stats for StatCards
    const stats = {
      total_paid:    totalPaid,
      overdue_count: overdueCount,
      missed_count:  missedCount,
      avg_days_late: 0,
    };

    return NextResponse.json({ success: true, data: rows, stats });

  } catch (err: any) {
    console.error("[Billing GET Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
// Superadmin manually records a cash payment.

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { subscriptionId, tenantId, recordedBy, amountOverride } = body as {
    subscriptionId:  string;
    tenantId:        string;
    recordedBy?:     string;
    amountOverride?: number;
  };

  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId is required." }, { status: 400 });
  }

  // ── 1. Fetch current record ────────────────────────────────────────────────
  const { data: subRecord, error: srErr } = await supabase
    .from("subscription_records")
    .select("subscription_id, tenant_id, billing_period, amount, amount_paid, payment_status")
    .eq("subscription_id", subscriptionId)
    .single();

  if (srErr || !subRecord) {
    return NextResponse.json({ error: "Subscription record not found." }, { status: 404 });
  }

  if (subRecord.payment_status === "Paid") {
    return NextResponse.json({ error: "This record is already marked as Paid." }, { status: 409 });
  }

  // ── 2. Calculate new amount_paid ──────────────────────────────────────────
  const billedAmount   = Number(subRecord.amount);
  const prevAmountPaid = Number(subRecord.amount_paid ?? 0);
  const paymentAmount  =
    amountOverride !== undefined && amountOverride > 0
      ? amountOverride
      : billedAmount - prevAmountPaid; // default: pay the full remaining balance

  const newAmountPaid = prevAmountPaid + paymentAmount;
  const isFullyPaid   = newAmountPaid >= billedAmount;
  const now           = new Date().toISOString();

  // ── 3. Update subscription_record ─────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("subscription_records")
    .update({
      amount_paid:    newAmountPaid,
      payment_status: isFullyPaid ? "Paid" : subRecord.payment_status,
      paid_at:        isFullyPaid ? now : null,
      recorded_by:    recordedBy ?? null,
    })
    .eq("subscription_id", subscriptionId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── 4. Fetch tenant + billing_settings ────────────────────────────────────
  const { data: tenant } = await supabase
    .from("tenants")
    .select("business_name, subscription_status")
    .eq("tenant_id", subRecord.tenant_id)
    .single();

  const businessName = tenant?.business_name ?? null;

  // ── 5. Create next billing row if fully paid ──────────────────────────────
  if (isFullyPaid) {
    const { data: settings } = await supabase
      .from("billing_settings")
      .select("monthly_price, billing_due_days, grace_period_days")
      .limit(1)
      .single();

    const monthlyPrice    = Number(settings?.monthly_price    ?? 1000);
    const billingDueDays  = Number(settings?.billing_due_days  ?? 30);
    const gracePeriodDays = Number(settings?.grace_period_days ?? 7);

    const nextPeriod    = nextBillingPeriod(subRecord.billing_period);
    const nextOverdueAt = calcOverdueAt(nextPeriod, billingDueDays);
    const nextGraceAt   = calcGraceEndsAt(nextOverdueAt, gracePeriodDays);

    const { error: insertErr } = await supabase
      .from("subscription_records")
      .upsert(
        {
          tenant_id:      subRecord.tenant_id,
          billing_period: nextPeriod,
          payment_status: "Pending",
          amount:         monthlyPrice,
          amount_paid:    0,
          overdue_at:     nextOverdueAt,
          grace_ends_at:  nextGraceAt,
        },
        { onConflict: "tenant_id,billing_period", ignoreDuplicates: true }
      );

    if (insertErr) {
      console.error("[billing PATCH] Failed to create next billing row:", insertErr.message);
    }
  }

  // ── 6. Audit log ──────────────────────────────────────────────────────────
  const balance = Math.max(0, billedAmount - newAmountPaid);

  await logAudit({
    performedBy:  recordedBy ?? "Superadmin",
    eventType:    AuditEvent.PAYMENT_RECORDED,
    tenantId:     subRecord.tenant_id,
    businessName,
    description: isFullyPaid
      ? `Manual payment recorded. Record fully paid (₱${newAmountPaid.toFixed(2)}).`
      : `Manual partial payment of ₱${paymentAmount.toFixed(2)} recorded. Remaining balance: ₱${balance.toFixed(2)}.`,
    metadata: {
      subscriptionId,
      paymentAmount,
      newAmountPaid,
      billedAmount,
      balance,
      isFullyPaid,
      billingPeriod: subRecord.billing_period,
    },
  });

  // ── 7. Restore suspended tenant if fully paid + no other unpaid ───────────
  if (isFullyPaid) {
    const { data: unpaid } = await supabase
      .from("subscription_records")
      .select("subscription_id")
      .eq("tenant_id", subRecord.tenant_id)
      .in("payment_status", ["Pending", "Overdue"])
      .neq("subscription_id", subscriptionId)
      .limit(1);

    if ((!unpaid || unpaid.length === 0) && tenant?.subscription_status === "Suspended") {
      await supabase
        .from("tenants")
        .update({
          subscription_status: "Active",
          is_suspended:        false,
          suspended_until:     null,
          is_active:           true,
        })
        .eq("tenant_id", subRecord.tenant_id);

      await supabase
        .from("users")
        .update({ is_active: true })
        .eq("tenant_id", subRecord.tenant_id);

      await supabase
        .from("suspended_tenants")
        .delete()
        .eq("tenant_id", subRecord.tenant_id);

      await logAudit({
        performedBy:  recordedBy ?? "Superadmin",
        eventType:    AuditEvent.TENANT_RESTORED,
        tenantId:     subRecord.tenant_id,
        businessName,
        description:  `Suspension lifted after manual payment cleared the balance.`,
        metadata:     { subscriptionId },
      });
    }
  }

  return NextResponse.json({
    success:      true,
    isFullyPaid,
    newAmountPaid,
    balance:      Math.max(0, billedAmount - newAmountPaid),
  });
}
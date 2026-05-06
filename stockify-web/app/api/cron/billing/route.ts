// app/api/superadmin/billing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAudit, AuditEvent } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: all billing rows + dashboard stats ──────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab    = searchParams.get("tab")    ?? "Overall";
  const search = searchParams.get("search") ?? "";

  // 1. Fetch tenants + their subscription records
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(`
      tenant_id,
      business_name,
      owner_full_name,
      owner_email,
      subscription_status,
      subscription_records (
        subscription_id,
        billing_period,
        payment_status,
        amount,
        paid_at,
        overdue_at,
        grace_ends_at
      )
    `)
    .in("subscription_status", ["Trial", "Active", "Suspended"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Build display rows
  const rows = (tenants ?? []).map((t) => {
    const records = ((t.subscription_records as any[]) ?? []).sort(
      (a, b) => new Date(b.billing_period).getTime() - new Date(a.billing_period).getTime()
    );

    const latest   = records[0] ?? null;
    const lastPaid = records.find((r) => r.payment_status === "Paid") ?? null;

    let displayStatus: string;
    if (t.subscription_status === "Suspended") {
      displayStatus = "Missed";
    } else if (!latest) {
      displayStatus = "Pending";
    } else {
      displayStatus = latest.payment_status;
    }

    const balance =
      latest && latest.payment_status !== "Paid" ? Number(latest.amount) : 0;

    return {
      tenant_id:           t.tenant_id,
      business_name:       t.business_name,
      owner_full_name:     t.owner_full_name,
      owner_email:         t.owner_email,
      subscription_status: t.subscription_status,
      display_status:      displayStatus,
      billing_period:      latest?.billing_period  ?? null,
      due_date:            latest?.overdue_at      ?? null,
      grace_ends_at:       latest?.grace_ends_at   ?? null,
      last_paid_at:        lastPaid?.paid_at        ?? null,
      balance,
      subscription_id:     latest?.subscription_id ?? null,
      next_billing_date:   latest?.overdue_at      ?? null,
    };
  });

  // 3. Tab filter
  const filtered =
    tab === "Overall" ? rows : rows.filter((r) => r.display_status === tab);

  // 4. Search filter
  const searched = search.trim()
    ? filtered.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.business_name?.toLowerCase().includes(q) || 
          r.owner_full_name?.toLowerCase().includes(q)
        );
      })
    : filtered;

  // 5. Stats
  const year = new Date().getFullYear();
  const { data: paidRecs } = await supabase
    .from("subscription_records")
    .select("amount")
    .eq("payment_status", "Paid")
    .gte("paid_at", `${year}-01-01T00:00:00.000Z`);

  const totalPaid = (paidRecs ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const now = new Date();
  const { data: overdueRecs } = await supabase
    .from("subscription_records")
    .select("overdue_at")
    .eq("payment_status", "Overdue");

  let avgDaysLate = 0;
  if (overdueRecs && overdueRecs.length > 0) {
    const sum = overdueRecs.reduce((s, r) => {
      const diff = (now.getTime() - new Date(r.overdue_at).getTime()) / 86_400_000;
      return s + Math.max(0, diff);
    }, 0);
    avgDaysLate = Math.round((sum / overdueRecs.length) * 10) / 10;
  }

  const overdueCount = rows.filter((r) => r.display_status === "Overdue").length;
  const missedCount  = rows.filter((r) => r.display_status === "Missed").length;

  return NextResponse.json({
    data: searched,
    stats: {
      total_paid:    totalPaid,
      overdue_count: overdueCount,
      missed_count:  missedCount,
      avg_days_late: avgDaysLate,
    },
  });
}

// ─── PATCH: record a payment ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { subscriptionId, recordedBy } = await req.json();

  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId is required." }, { status: 400 });
  }

  // 1. Fetch the subscription record with business name for the audit log
  const { data: existingRecord } = await supabase
    .from("subscription_records")
    .select("tenant_id, billing_period, amount, tenants(business_name)")
    .eq("subscription_id", subscriptionId)
    .single();

  const businessName =
    (Array.isArray(existingRecord?.tenants)
      ? existingRecord?.tenants[0]
      : existingRecord?.tenants
    )?.business_name ?? null;

  // 2. Mark the record as Paid
  const { data: record, error } = await supabase
    .from("subscription_records")
    .update({
      payment_status: "Paid",
      paid_at:        new Date().toISOString(),
      recorded_by:    recordedBy ?? null,
    })
    .eq("subscription_id", subscriptionId)
    .select("subscription_id, tenant_id, billing_period, amount")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Audit: payment recorded
  await logAudit({
    performedBy:  recordedBy ?? "Superadmin",
    eventType:    AuditEvent.PAYMENT_RECORDED,
    tenantId:     record.tenant_id,
    businessName: businessName,
    description:  `Logged manual payment for billing period ${record.billing_period}. Status set to Paid.`,
    metadata: {
      subscriptionId: record.subscription_id,
      amount:         record.amount,
      billingPeriod:  record.billing_period,
    },
  });

  // 4. If tenant was Suspended and has no remaining unpaid records → restore
  const { data: unpaid } = await supabase
    .from("subscription_records")
    .select("subscription_id")
    .eq("tenant_id", record.tenant_id)
    .in("payment_status", ["Pending", "Overdue"])
    .limit(1);

  if (!unpaid || unpaid.length === 0) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("subscription_status")
      .eq("tenant_id", record.tenant_id)
      .single();

    if (tenant?.subscription_status === "Suspended") {
      await supabase
        .from("tenants")
        .update({
          subscription_status: "Active",
          is_suspended:        false,
          suspended_until:     null,
          is_active:           true,
        })
        .eq("tenant_id", record.tenant_id);

      await supabase
        .from("users")
        .update({ is_active: true })
        .eq("tenant_id", record.tenant_id);

      await supabase
        .from("suspended_tenants")
        .delete()
        .eq("tenant_id", record.tenant_id);

      // Audit: tenant restored after payment
      await logAudit({
        performedBy:  recordedBy ?? "Superadmin",
        eventType:    AuditEvent.TENANT_RESTORED,
        tenantId:     record.tenant_id,
        businessName: businessName,
        description:  `Suspension lifted after verifying payment for billing period ${record.billing_period}.`,
        metadata: { subscriptionId: record.subscription_id },
      });
    }
  }

  return NextResponse.json({ success: true, data: record });
}
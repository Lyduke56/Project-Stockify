// app/api/superadmin/tenant/[tenantId]/payment-history/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PaymentHistoryStats {
  total_paid_amount: number;
  paid_count:        number;
  total_records:     number;
  late_count:        number;
  missed_count:      number;
  avg_days_late:     number;
}

export interface SubscriptionRow {
  subscription_id:          string;
  billing_period:           string;
  payment_status:           string;
  amount:                   number;
  amount_paid:              number;
  balance:                  number;
  paid_at:                  string | null;
  overdue_at:               string | null;
  grace_ends_at:            string | null;
  days_late:                number | null;
  latest_submission_status: string | null;
  latest_proof_url:         string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId: rawId } = await params;
  const tenantId = rawId?.trim();

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Verify tenant exists ────────────────────────────────────────────────
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, subscription_status")
    .eq("tenant_id", tenantId)
    .single();

  if (tErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── 2. Subscription records (newest first) ─────────────────────────────────
  const { data: records, error: rErr } = await supabase
    .from("subscription_records")
    .select(`
      subscription_id,
      billing_period,
      payment_status,
      amount,
      amount_paid,
      paid_at,
      overdue_at,
      grace_ends_at
    `)
    .eq("tenant_id", tenantId)
    .order("billing_period", { ascending: false });

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  const rows = records ?? [];

  // ── 3. Latest payment_submission per subscription_id ──────────────────────
  const { data: submissions } = await supabase
    .from("payment_submissions")
    .select("subscription_id, status, proof_url, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Map: subscription_id → latest submission (first occurrence = newest due to order)
  const latestSubmission = new Map<
    string,
    { status: string; proof_url: string }
  >();
  for (const sub of submissions ?? []) {
    if (sub.subscription_id && !latestSubmission.has(sub.subscription_id)) {
      latestSubmission.set(sub.subscription_id, {
        status:    sub.status,
        proof_url: sub.proof_url,
      });
    }
  }

  // ── 4. Derive per-row fields + aggregate stats ─────────────────────────────
  let totalPaidAmount = 0;
  let paidCount       = 0;
  let lateCount       = 0;
  let missedCount     = 0;
  let totalDaysLate   = 0;
  let lateWithDays    = 0;

  const formattedRows: SubscriptionRow[] = rows.map((r) => {
    const amount     = Number(r.amount      ?? 0);
    const amountPaid = Number(r.amount_paid ?? 0);
    const balance    = Math.max(0, amount - amountPaid);

    // Days late: positive only if paid AFTER overdue_at
    let daysLate: number | null = null;
    if (r.paid_at && r.overdue_at) {
      const diff = Math.ceil(
        (new Date(r.paid_at).getTime() - new Date(r.overdue_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diff > 0) daysLate = diff;
    }

    // Suspended + still-unpaid records display as Missed
    let displayStatus: string = r.payment_status;
    if (
      tenant.subscription_status === "Suspended" &&
      ["Pending", "Overdue"].includes(displayStatus)
    ) {
      displayStatus = "Missed";
    }

    // Aggregate
    if (displayStatus === "Paid") {
      paidCount++;
      totalPaidAmount += amountPaid;
      if (daysLate !== null) {
        lateCount++;
        totalDaysLate += daysLate;
        lateWithDays++;
      }
    } else if (displayStatus === "Missed") {
      missedCount++;
    }

    const sub = latestSubmission.get(r.subscription_id) ?? null;

    return {
      subscription_id:          r.subscription_id,
      billing_period:           r.billing_period,
      payment_status:           displayStatus,
      amount,
      amount_paid:              amountPaid,
      balance,
      paid_at:                  r.paid_at      ?? null,
      overdue_at:               r.overdue_at   ?? null,
      grace_ends_at:            r.grace_ends_at ?? null,
      days_late:                daysLate,
      latest_submission_status: sub?.status    ?? null,
      latest_proof_url:         sub?.proof_url ?? null,
    };
  });

  const stats: PaymentHistoryStats = {
    total_paid_amount: totalPaidAmount,
    paid_count:        paidCount,
    total_records:     formattedRows.length,
    late_count:        lateCount,
    missed_count:      missedCount,
    avg_days_late:     lateWithDays > 0
      ? Math.round(totalDaysLate / lateWithDays)
      : 0,
  };

  return NextResponse.json({
    success: true,
    tenant,
    stats,
    records: formattedRows,
  });
}
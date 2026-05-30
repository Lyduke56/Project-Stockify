// app/api/dev/force-overdue/route.ts
//
// ⚠️ DEV/TESTING ONLY — Remove before production deployment.
// Forces a subscription record's overdue_at to 1 hour ago so the
// grace-check cron can immediately process it for testing.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  const { subscriptionId, tenantId, step } = await req.json();

  // ── Step 1: Force Pending → ready to become Overdue ───────────────────────
  if (step === "pending_to_overdue") {
    if (!subscriptionId && !tenantId) {
      return NextResponse.json(
        { error: "Provide subscriptionId or tenantId." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("subscription_records")
      .update({
        overdue_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      })
      .eq("payment_status", "Pending");

    if (subscriptionId) query = query.eq("subscription_id", subscriptionId);
    else if (tenantId)   query = query.eq("tenant_id", tenantId);

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "overdue_at set to 1 hour ago. Now hit /api/cron/grace-check." });
  }

  // ── Step 2: Force Overdue → ready to become Suspended (Missed) ───────────
  if (step === "overdue_to_missed") {
    if (!subscriptionId && !tenantId) {
      return NextResponse.json(
        { error: "Provide subscriptionId or tenantId." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("subscription_records")
      .update({
        grace_ends_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      })
      .eq("payment_status", "Overdue");

    if (subscriptionId) query = query.eq("subscription_id", subscriptionId);
    else if (tenantId)   query = query.eq("tenant_id", tenantId);

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "grace_ends_at set to 1 hour ago. Now hit /api/cron/grace-check." });
  }

  // ── Step 3: Force Suspended → ready for Termination ───────────────────────
  if (step === "suspended_to_terminated") {
    if (!tenantId) {
      return NextResponse.json({ error: "Provide tenantId." }, { status: 400 });
    }

    const { error } = await supabase
      .from("suspended_tenants")
      .update({
        suspension_expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      })
      .eq("tenant_id", tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "suspension_expires_at set to 1 hour ago. Now hit /api/cron/grace-check." });
  }

  // ── Utility: fetch current state ──────────────────────────────────────────
  if (step === "status") {
    const { data } = await supabase
      .from("subscription_records")
      .select("subscription_id, tenant_id, payment_status, overdue_at, grace_ends_at, billing_period")
      .in("payment_status", ["Pending", "Overdue", "Missed"])
      .order("created_at", { ascending: false });

    return NextResponse.json({ records: data });
  }

  return NextResponse.json(
    { error: "Invalid step. Use: pending_to_overdue | overdue_to_missed | suspended_to_terminated | status" },
    { status: 400 }
  );
}

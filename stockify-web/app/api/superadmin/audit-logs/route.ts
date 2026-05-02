// app/api/superadmin/audit-logs/route.ts
//
// GET  /api/superadmin/audit-logs
//      ?search=<business name or performer>
//      &eventType=<TenantSuspended|PaymentRecorded|…>
//      &from=<YYYY-MM-DD>
//      &to=<YYYY-MM-DD>
//      &page=<number>       (default 1)
//      &pageSize=<number>   (default 15)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const search    = searchParams.get("search")    ?? "";
  const eventType = searchParams.get("eventType") ?? "";
  const from      = searchParams.get("from")      ?? "";
  const to        = searchParams.get("to")        ?? "";
  const page      = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
  const pageSize  = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "15", 10)));
  const offset    = (page - 1) * pageSize;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search.trim()) {
    query = query.or(
      `business_name.ilike.%${search.trim()}%,performed_by.ilike.%${search.trim()}%`
    );
  }

  if (eventType.trim()) {
    query = query.eq("event_type", eventType.trim());
  }

  if (from.trim()) {
    const fromDate = new Date(from.trim());
    fromDate.setUTCHours(0, 0, 0, 0);
    query = query.gte("created_at", fromDate.toISOString());
  }

  if (to.trim()) {
    const toDate = new Date(to.trim());
    toDate.setUTCHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data:       data ?? [],
    total:      count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
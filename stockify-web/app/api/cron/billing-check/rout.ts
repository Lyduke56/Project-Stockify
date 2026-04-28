import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const MONTHLY_FEE         = 1000; // ₱
const GRACE_PERIOD_DAYS   = 7;    // days after billing_period → mark Overdue
const OVERDUE_SUSPEND_DAYS = 7;   // days after becoming Overdue → auto-suspend

/**
 * GET /api/cron/billing-check
 * Vercel Cron: runs daily at 02:00 PH time (UTC+8 → 18:00 UTC previous day).
 *
 * vercel.json entry:
 * { "crons": [{ "path": "/api/cron/billing-check", "schedule": "0 18 * * *" }] }
 *
 * Secured with Authorization: Bearer <CRON_SECRET> header (set in Vercel env).
 */
export async function GET(req: Request) {
  // ── Security ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    newBillingRecords: 0,
    markedOverdue:     0,
    autoSuspended:     0,
    errors:            [] as string[],
  };

  // ── Fetch all active / overdue tenants with their billing records ──────
  const { data: tenants, error: tenantErr } = await supabase
    .from("tenants")
    .select(
      `tenant_id, business_name, owner_full_name, owner_email, created_at,
       subscription_status,
       subscription_records (
         subscription_id, billing_period, payment_status, amount, overdue_at
       )`
    )
    .eq("is_active", true)
    .in("subscription_status", ["Active", "Overdue"]);

  if (tenantErr) {
    return NextResponse.json({ error: tenantErr.message }, { status: 500 });
  }

  for (const tenant of tenants ?? []) {
    const records: any[] = (tenant as any).subscription_records ?? [];
    const tenantId        = (tenant as any).tenant_id         as string;
    const businessName    = (tenant as any).business_name     as string;
    const ownerName       = (tenant as any).owner_full_name   as string;
    const ownerEmail      = (tenant as any).owner_email       as string;
    const status          = (tenant as any).subscription_status as string;

    try {
      // ── STEP A: Create next billing record if due ─────────────────────

      const sortedDesc = [...records].sort(
        (a, b) => new Date(b.billing_period).getTime() - new Date(a.billing_period).getTime()
      );
      const latestRecord = sortedDesc[0];

      // Compute what the next billing date should be
      const nextBillingDate = latestRecord
        ? (() => {
            const d = new Date(latestRecord.billing_period + "T00:00:00");
            d.setMonth(d.getMonth() + 1);
            return d;
          })()
        : (() => {
            const d = new Date((tenant as any).created_at);
            d.setMonth(d.getMonth() + 1);
            d.setHours(0, 0, 0, 0);
            return d;
          })();

      if (nextBillingDate <= today) {
        const nbStr = nextBillingDate.toISOString().split("T")[0];
        const alreadyExists = records.some((r) => r.billing_period === nbStr);

        if (!alreadyExists) {
          const { error: insErr } = await supabase
            .from("subscription_records")
            .insert({
              tenant_id:      tenantId,
              billing_period: nbStr,
              payment_status: "Pending",
              amount:         MONTHLY_FEE,
            });

          if (insErr) {
            if (!insErr.message.includes("duplicate") && !insErr.message.includes("unique")) {
              stats.errors.push(`create_billing ${tenantId}: ${insErr.message}`);
            }
          } else {
            stats.newBillingRecords++;
          }
        }
      }

      // ── STEP B: Mark Pending → Overdue after grace period ────────────

      const pendingRecords = records.filter((r) => r.payment_status === "Pending");

      for (const rec of pendingRecords) {
        const billingDate = new Date(rec.billing_period + "T00:00:00");
        const graceEnd    = new Date(billingDate);
        graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

        if (today > graceEnd) {
          const { error: updErr } = await supabase
            .from("subscription_records")
            .update({
              payment_status: "Overdue",
              overdue_at:     new Date().toISOString(),
            })
            .eq("subscription_id", rec.subscription_id);

          if (updErr) {
            stats.errors.push(`mark_overdue ${rec.subscription_id}: ${updErr.message}`);
          } else {
            stats.markedOverdue++;
          }
        }
      }

      // Update tenant status → Overdue if it had any pending-now-overdue
      if (status === "Active" && pendingRecords.some((r) => {
        const g = new Date(r.billing_period + "T00:00:00");
        g.setDate(g.getDate() + GRACE_PERIOD_DAYS);
        return today > g;
      })) {
        await supabase
          .from("tenants")
          .update({ subscription_status: "Overdue" })
          .eq("tenant_id", tenantId);
      }

      // ── STEP C: Auto-suspend if Overdue long enough ───────────────────

      if (status === "Overdue") {
        const overdueRecs = records.filter((r) => r.payment_status === "Overdue");

        const shouldSuspend = overdueRecs.some((r) => {
          const billingDate  = new Date(r.billing_period + "T00:00:00");
          const suspendAfter = new Date(billingDate);
          suspendAfter.setDate(suspendAfter.getDate() + GRACE_PERIOD_DAYS + OVERDUE_SUSPEND_DAYS);
          return today > suspendAfter;
        });

        if (shouldSuspend) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          const expiryLabel = expiresAt.toLocaleDateString("en-PH", {
            month: "long", day: "numeric", year: "numeric",
          });

          // Update tenant
          const { error: suspErr } = await supabase
            .from("tenants")
            .update({
              subscription_status: "Suspended",
              is_suspended:        true,
              suspended_until:     expiresAt.toISOString(),
            })
            .eq("tenant_id", tenantId);

          if (suspErr) {
            stats.errors.push(`auto_suspend ${tenantId}: ${suspErr.message}`);
          } else {
            stats.autoSuspended++;

            // Audit log
            await supabase.from("suspended_tenants").insert({
              tenant_id:             tenantId,
              business_name:         businessName,
              owner_name:            ownerName,
              owner_email:           ownerEmail,
              reason:                "Auto-suspended: overdue payment not settled within grace period.",
              suspension_expires_at: expiresAt.toISOString(),
            });

            // Email
            await resend.emails.send({
              from:    "Stockify <onboarding@resend.dev>",
              to:      ownerEmail,
              subject: `[Auto-Suspended] ${businessName} — Pay Within 7 Days to Avoid Termination`,
              html:    buildAutoSuspensionEmail({ ownerName, businessName, expiryLabel }),
            }).catch((e) => console.error("[cron] auto-suspend email failed:", e));
          }
        }
      }
    } catch (err: unknown) {
      stats.errors.push(`tenant ${tenantId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log("[billing-check] cron results:", stats);
  return NextResponse.json({ success: true, ...stats });
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildAutoSuspensionEmail(p: {
  ownerName:    string;
  businessName: string;
  expiryLabel:  string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Account Auto-Suspended</title>
  <style>
    body  { font-family:Inter,Arial,sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px;
            overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .hbar { background:#E91F22; padding:24px 32px; }
    .hbar h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .hbar p  { color:#ffc8c8; margin:4px 0 0; font-size:13px; }
    .body { padding:32px; }
    .alert{ background:#fff0f0; border:1.5px solid #E91F22; border-radius:8px;
            padding:14px 18px; color:#E91F22; font-size:13px; font-weight:600; margin-bottom:20px; }
    .box  { background:#FFFCEB; border:1.5px solid #F7B71D; border-radius:8px;
            padding:16px 20px; margin-bottom:20px; }
    .box .lbl  { color:#385E31; font-size:11px; font-weight:700;
                 text-transform:uppercase; letter-spacing:.06em; }
    .box .date { color:#385E31; font-size:20px; font-weight:700; margin:4px 0 4px; }
    ol    { color:#444; font-size:14px; line-height:1.9; padding-left:20px; margin:12px 0; }
    .btn  { display:inline-block; background:#385E31; color:#FFFCEB !important;
            padding:12px 28px; border-radius:40px; text-decoration:none;
            font-weight:700; font-size:14px; margin:16px 0; }
    .warn { color:#999; font-size:12px; line-height:1.7; border-top:1px solid #eee;
            padding-top:18px; margin-top:24px; }
    .foot { background:#f0f0f0; padding:16px 32px; text-align:center; color:#bbb; font-size:11px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="hbar">
    <h1>Stockify</h1>
    <p>Auto-Suspension Notice</p>
  </div>
  <div class="body">
    <h2 style="color:#E91F22;margin:0 0 14px;font-size:20px;">Your Account Has Been Auto-Suspended</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(p.ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">
      Your Stockify account for <strong>${escHtml(p.businessName)}</strong> has been automatically
      suspended because your subscription payment remained unpaid beyond the allowed grace period.
    </p>
    <div class="alert">⚠ Immediate action required to avoid permanent termination.</div>
    <div class="box">
      <div class="lbl">Pay Before Termination</div>
      <div class="date">${escHtml(p.expiryLabel)}</div>
    </div>
    <p style="color:#333;font-size:14px;font-weight:600;">How to reactivate your account:</p>
    <ol>
      <li>Log in to your Stockify dashboard.</li>
      <li>Go to <strong>Billing &amp; Subscription</strong>.</li>
      <li>Pay your outstanding balance of <strong>₱1,000.00</strong>.</li>
      <li>Reactivation occurs within 24 hours of payment confirmation.</li>
    </ol>
    <a href="#" class="btn">Go to Dashboard</a>
    <p class="warn">
      Failure to pay by <strong>${escHtml(p.expiryLabel)}</strong> will result in
      <strong>permanent termination</strong> of your account and irrecoverable deletion of all data.
      Contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> for help.
    </p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body>
</html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
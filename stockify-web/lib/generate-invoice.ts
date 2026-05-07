import { SubscriptionRecord, TenantData, PaymentSubmission } from "@/types/billing";
import { fmtDate, fmtPHP, toInvoiceId } from "@/lib/billing-utils";

function buildInvoiceHTML(
  records:     SubscriptionRecord[],
  tenant:      TenantData | null,
  submissions: PaymentSubmission[],
): string {

  const invoiceBlocks = records.map((rec) => {
    const invoiceId = toInvoiceId(rec.billing_period);
    const balance   = Number(rec.amount) - Number(rec.amount_paid ?? 0);

    // Only accepted submissions tied to this specific subscription record
    const recPayments = submissions.filter(
      (s) => s.subscription_id === rec.subscription_id && s.status === "Accepted"
    );

    const totalFromSubmissions = recPayments.reduce(
      (sum, s) => sum + Number(s.amount_declared ?? 0), 0
    );

    const paidInOneGo   = recPayments.length === 1 && totalFromSubmissions >= Number(rec.amount);
    const isPartial     = recPayments.length > 0 && totalFromSubmissions < Number(rec.amount);
    const isMultiPayment = recPayments.length > 1;

    const paymentSummaryBadge = recPayments.length === 0
      ? `<span class="badge badge-unpaid">No payments yet</span>`
      : paidInOneGo
      ? `<span class="badge badge-full">Paid in full — single payment</span>`
      : isMultiPayment && !isPartial
      ? `<span class="badge badge-full">Paid in full — ${recPayments.length} payments</span>`
      : `<span class="badge badge-partial">Partially paid — ${recPayments.length} payment${recPayments.length > 1 ? "s" : ""}</span>`;

    const paymentRows = recPayments.length > 0
      ? recPayments.map((s, i) => `
          <tr>
            <td class="td-left">
              <span style="font-size:11px; color:#374151;">Payment ${i + 1}</span>
              <span style="font-size:9px; color:#9ca3af; margin-left:8px;">
                ${fmtDate(s.reviewed_at ?? s.created_at)}
              </span>
              ${s.remarks_admin
                ? `<span style="font-size:9px; color:#9ca3af; margin-left:6px; font-style:italic;">"${s.remarks_admin}"</span>`
                : ""}
            </td>
            <td class="td-right" style="color:#166534;">${fmtPHP(Number(s.amount_declared ?? 0))}</td>
          </tr>
        `).join("")
      : `<tr>
           <td class="td-left" style="font-size:11px; color:#9ca3af; font-style:italic;">
             No accepted payments recorded
           </td>
           <td class="td-right" style="color:#9ca3af;">—</td>
         </tr>`;

    const statusMeta: Record<string, { label: string; color: string }> = {
      Paid:    { label: "PAID",    color: "#166534" },
      Pending: { label: "PENDING", color: "#92400e" },
      Overdue: { label: "OVERDUE", color: "#b45309" },
    };
    const { label: statusLabel, color: statusColor } =
      statusMeta[rec.payment_status] ?? { label: rec.payment_status, color: "#475569" };

    return `
      <div class="invoice-block">

        <div class="header">
          <div>
            <div class="brand-name">Stockify</div>
            <div class="brand-sub">Subscription Invoice</div>
          </div>
          <div class="status-stamp" style="color:${statusColor}; border-color:${statusColor};">
            ${statusLabel}
          </div>
        </div>

        <div class="divider"></div>

        <div class="meta-row">
          <div class="meta-block">
            <div class="meta-label">Invoice ID</div>
            <div class="meta-value">${invoiceId}</div>
          </div>
          <div class="meta-block">
            <div class="meta-label">Billing Period</div>
            <div class="meta-value">${fmtDate(rec.billing_period)}</div>
          </div>
          <div class="meta-block">
            <div class="meta-label">Fully Paid On</div>
            <div class="meta-value">${fmtDate(rec.paid_at)}</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-label">Billed To</div>
        <div class="billed-name">${tenant?.business_name  ?? "—"}</div>
        <div class="billed-line">${tenant?.owner_full_name ?? "—"}</div>
        <div class="billed-line">${tenant?.owner_email     ?? "—"}</div>

        <div class="divider"></div>

        <div class="section-label">Line Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th class="th-left">Description</th>
              <th class="th-right">Billed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-left">Standard Plan — Monthly Subscription</td>
              <td class="td-right">${fmtPHP(Number(rec.amount))}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-label" style="margin-top:18px; display:flex; align-items:center; gap:8px;">
          Payment History &nbsp;${paymentSummaryBadge}
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th class="th-left">Transaction</th>
              <th class="th-right">Amount</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">${fmtPHP(Number(rec.amount))}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Total Paid</span>
            <span class="total-value" style="color:#166534;">${fmtPHP(Number(rec.amount_paid ?? 0))}</span>
          </div>
          <div class="total-row grand">
            <span class="total-label">Balance Due</span>
            <span class="total-value ${balance > 0 ? "balance-due" : "balance-clear"}">
              ${fmtPHP(balance)}
            </span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for using Stockify. For billing inquiries, contact <strong>billing@stockify.com</strong>.</p>
          <p class="footer-sub">Subscription ID: ${rec.subscription_id}</p>
        </div>
      </div>
    `;
  }).join('<div class="page-break"></div>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — Stockify</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2e1a;background:#f8f9f4;padding:32px 16px}
    .invoice-block{background:white;max-width:600px;margin:0 auto 32px;padding:36px 40px;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,0.08)}
    .header{display:flex;justify-content:space-between;align-items:flex-start}
    .brand-name{font-size:22px;font-weight:800;color:#166534;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#6b7280;margin-top:2px}
    .status-stamp{font-size:11px;font-weight:800;letter-spacing:1.5px;border:2px solid;border-radius:6px;padding:4px 10px}
    .divider{height:1px;background:#e7f0e7;margin:20px 0}
    .meta-row{display:flex}
    .meta-block{flex:1}
    .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;margin-bottom:3px}
    .meta-value{font-size:13px;font-weight:600}
    .section-label{font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;margin-bottom:8px}
    .billed-name{font-size:14px;font-weight:700;margin-bottom:3px}
    .billed-line{font-size:12px;color:#4b5563;line-height:1.6}
    .items-table{width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:16px}
    .th-left,.th-right{font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;padding:6px 0;border-bottom:1px solid #e7f0e7}
    .th-right{text-align:right}
    .td-left{font-size:12px;color:#1a2e1a;padding:10px 0}
    .td-right{font-size:12px;font-weight:600;text-align:right;padding:10px 0}
    .badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;letter-spacing:0.4px}
    .badge-full{background:#dcfce7;color:#166534}
    .badge-partial{background:#fef9c3;color:#92400e}
    .badge-unpaid{background:#f3f4f6;color:#6b7280}
    .totals{border-top:1px solid #e7f0e7;padding-top:12px}
    .total-row{display:flex;justify-content:space-between;padding:4px 0}
    .total-label{font-size:12px;color:#6b7280}
    .total-value{font-size:12px;font-weight:600;color:#1a2e1a}
    .total-row.grand{margin-top:8px;padding-top:10px;border-top:1.5px solid #1a2e1a}
    .total-row.grand .total-label{font-size:13px;font-weight:700;color:#1a2e1a}
    .total-row.grand .total-value{font-size:14px;font-weight:800}
    .balance-due{color:#b91c1c}
    .balance-clear{color:#166534}
    .footer{margin-top:28px;padding-top:16px;border-top:1px dashed #d1d5db}
    .footer p{font-size:10px;color:#9ca3af;line-height:1.7}
    .footer-sub{margin-top:4px;font-size:9px;color:#d1d5db}
    .page-break{page-break-after:always}
    @media print{
      body{background:white;padding:0}
      .invoice-block{box-shadow:none;border-radius:0;margin:0;padding:32px 40px}
    }
  </style>
</head>
<body>
  ${invoiceBlocks}
  <script>window.onload=()=>{window.print()}<\/script>
</body>
</html>`;
}

export function downloadInvoice(
  rec:         SubscriptionRecord,
  tenant:      TenantData | null,
  submissions: PaymentSubmission[],
): void {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildInvoiceHTML([rec], tenant, submissions));
  win.document.close();
}

export function downloadAllInvoices(
  records:     SubscriptionRecord[],
  tenant:      TenantData | null,
  submissions: PaymentSubmission[],
): void {
  if (!records.length) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildInvoiceHTML(records, tenant, submissions));
  win.document.close();
}
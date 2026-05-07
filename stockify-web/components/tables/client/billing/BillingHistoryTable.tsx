import { fmtDate, fmtPHP, toInvoiceId, statusColor } from "@/lib/billing-utils";
import { SubscriptionRecord, TenantData, PaymentSubmission } from "@/types/billing";
import { downloadInvoice, downloadAllInvoices } from "@/lib/generate-invoice";

interface Props {
  isLoading:   boolean;
  records:     SubscriptionRecord[];
  tenant:      TenantData | null;
  submissions: PaymentSubmission[];
}

export default function BillingHistoryTable({ isLoading, records, tenant, submissions }: Props) {
  return (
    <section className="w-full bg-white rounded-xl outline outline-[0.81px] outline-offset-[-0.81px] outline-lime-800/20 pb-4">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <div className="text-lime-800 text-xs font-medium font-['Inter'] leading-3 mb-1">Billing History</div>
          <div className="text-gray-500 text-xs font-normal font-['Inter'] leading-5">
            Download and view your past invoices
          </div>
        </div>
        <button
          onClick={() => downloadAllInvoices(records, tenant, submissions)}
          disabled={isLoading || records.length === 0}
          className="w-32 h-7 bg-white rounded-md outline outline-[0.81px] outline-offset-[-0.81px] outline-lime-800/30 flex items-center justify-center gap-1.5 hover:bg-lime-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="#1a2e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span className="text-neutral-950 text-xs font-medium font-['Inter'] leading-4">Download All</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-lime-800/20">
              <th className="text-left px-5 py-2.5 text-lime-800 font-semibold font-['Inter']">Invoice</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Billing Period</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Paid On</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Description</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Billed</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Paid</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Status</th>
              <th className="text-left px-3 py-2.5 text-lime-800 font-semibold font-['Inter']">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10 text-lime-800/40 font-medium">Loading billing history…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-lime-800/40 font-medium">No billing records yet.</td></tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.subscription_id} className="border-b border-lime-800/10 hover:bg-lime-50/30 transition-colors">
                  <td className="px-5 py-3 text-lime-800 font-medium">{toInvoiceId(rec.billing_period)}</td>
                  <td className="px-3 py-3 text-lime-800">{fmtDate(rec.billing_period)}</td>
                  <td className="px-3 py-3 text-lime-800">{fmtDate(rec.paid_at)}</td>
                  <td className="px-3 py-3 text-lime-800">Standard Plan</td>
                  <td className="px-3 py-3 text-lime-800 font-semibold">{fmtPHP(rec.amount)}</td>
                  <td className="px-3 py-3 font-semibold">
                    {rec.amount_paid != null && rec.amount_paid > 0 ? (
                      <span className={rec.amount_paid < rec.amount ? "text-amber-600" : "text-lime-700"}>
                        {fmtPHP(rec.amount_paid)}
                      </span>
                    ) : (
                      <span className="text-lime-800/30">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9.7px] font-medium ${statusColor[rec.payment_status]}`}>
                      {rec.payment_status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => downloadInvoice(rec, tenant, submissions)}
                      className="flex items-center gap-1 text-amber-500 font-medium hover:text-amber-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
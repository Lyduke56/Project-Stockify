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
    <section className="w-full bg-white rounded-[20px] border border-lime-800/10 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lime-950 text-base font-bold tracking-tight">
            Billing History
          </h2>
          <p className="text-lime-800/60 text-xs font-medium mt-0.5">
            Download and view your past invoices
          </p>
        </div>
        
        <button
          onClick={() => downloadAllInvoices(records, tenant, submissions)}
          disabled={isLoading || records.length === 0}
          className="h-8 px-3.5 bg-white border border-lime-800/20 rounded-lg shadow-sm flex items-center justify-center gap-1.5 hover:bg-lime-50 transition-all disabled:opacity-50 disabled:pointer-events-none text-lime-950 text-xs font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download All
        </button>
      </div>

      {/* ── TABLE CONTAINER ── */}
      <div className="w-full rounded-xl border border-lime-800/10 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left whitespace-nowrap">
            <thead className="bg-[#FAFCF5] text-[#86997A] text-[10px] uppercase font-bold tracking-wider border-b border-lime-800/10">
              <tr>
                <th className="px-4 py-3 pl-5">Invoice</th>
                <th className="px-4 py-3">Billing Period</th>
                <th className="px-4 py-3">Paid On</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Billed</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 pr-5 text-right">Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-lime-800/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2 text-lime-800/40">
                      <div className="w-5 h-5 border-2 border-lime-800/20 border-t-lime-800/60 rounded-full animate-spin"></div>
                      <span className="font-medium text-xs">Loading billing history...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-lime-800/40 font-medium text-[13px]">
                    No billing records yet.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.subscription_id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Invoice */}
                    <td className="px-4 py-3.5 pl-5 text-lime-950 font-bold">
                      {toInvoiceId(rec.billing_period)}
                    </td>
                    
                    {/* Billing Period */}
                    <td className="px-4 py-3.5 text-lime-900 font-medium">
                      {fmtDate(rec.billing_period)}
                    </td>
                    
                    {/* Paid On */}
                    <td className="px-4 py-3.5 text-lime-900 font-medium">
                      {fmtDate(rec.paid_at) || <span className="text-lime-800/30">—</span>}
                    </td>
                    
                    {/* Description */}
                    <td className="px-4 py-3.5 text-[#637D55] font-medium">
                      Standard Plan
                    </td>
                    
                    {/* Billed */}
                    <td className="px-4 py-3.5 text-lime-950 font-bold">
                      {fmtPHP(rec.amount)}
                    </td>
                    
                    {/* Paid */}
                    <td className="px-4 py-3.5 font-bold">
                      {rec.amount_paid != null && rec.amount_paid > 0 ? (
                        <span className={rec.amount_paid < rec.amount ? "text-amber-500" : "text-[#009966]"}>
                          {fmtPHP(rec.amount_paid)}
                        </span>
                      ) : (
                        <span className="text-lime-800/30">—</span>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor[rec.payment_status] || "bg-gray-100 text-gray-800"}`}>
                        {rec.payment_status}
                      </span>
                    </td>
                    
                    {/* Action */}
                    <td className="px-4 py-3.5 pr-5 text-right">
                      <button
                        onClick={() => downloadInvoice(rec, tenant, submissions)}
                        className="inline-flex items-center gap-1.5 text-amber-500 hover:text-amber-600 font-semibold text-xs transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </section>
  );
}
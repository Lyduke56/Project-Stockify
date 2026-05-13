import { fmtDate, fmtPHP, statusColor } from "@/lib/billing-utils";
import { PaymentSubmission } from "@/types/billing";

interface Props {
  submissions: PaymentSubmission[];
}

export default function SubmissionHistory({ submissions }: Props) {
  if (submissions.length === 0) return null;

  return (
    <section className="w-full bg-white rounded-3xl border border-lime-800/10 p-6 sm:p-8 shadow-sm">
      
      {/* ── HEADER ── */}
      <header className="mb-6">
        <h2 className="text-lime-950 text-lg font-bold tracking-tight">
          Payment Submission History
        </h2>
        <p className="text-lime-800/60 text-sm font-medium mt-1">
          Track the status of your submitted payment proofs
        </p>
      </header>

      {/* ── LIST ── */}
      <div className="flex flex-col gap-3">
        {submissions.map((sub) => {
          // Determine accent colors based on status for the icon
          const isAccepted = sub.status === "Accepted";
          const isRejected = sub.status === "Rejected";
          const iconColor = isAccepted ? "text-emerald-600" : isRejected ? "text-red-500" : "text-amber-500";
          const iconBg = isAccepted ? "bg-emerald-50" : isRejected ? "bg-red-50" : "bg-amber-50";

          return (
            <div
              key={sub.submission_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-lime-800/10 bg-slate-50/50 hover:bg-lime-50/50 transition-colors"
            >
              
              {/* Left: Info */}
              <div className="flex items-start sm:items-center gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-black/5 shadow-sm ${iconBg} ${iconColor}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                    <path d="M12 17.5v-11"/>
                  </svg>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-0.5 mt-0.5 sm:mt-0">
                  <span className="text-lime-950 text-sm font-bold">
                    Submitted on {fmtDate(sub.created_at)}
                  </span>
                  {sub.amount_declared != null && (
                    <span className="text-lime-800/60 text-xs font-semibold">
                      Declared Amount: {fmtPHP(sub.amount_declared)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Status & Remarks */}
              <div className="flex flex-col sm:items-end gap-2 pl-14 sm:pl-0">
                <span className={`inline-flex w-max items-center px-3 py-1 rounded-md text-xs font-bold tracking-wide ${statusColor[sub.status] || "bg-gray-100 text-gray-800"}`}>
                  {sub.status}
                </span>
                
                {isRejected && sub.remarks_admin && (
                  <div className="mt-1 flex items-start gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg max-w-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-red-600 text-xs font-medium leading-tight text-left sm:text-right">
                      {sub.remarks_admin}
                    </p>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
      
    </section>
  );
}
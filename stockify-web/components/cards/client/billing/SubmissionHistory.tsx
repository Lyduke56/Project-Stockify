import { fmtDate, fmtPHP, statusColor } from "@/lib/billing-utils";
import { PaymentSubmission } from "@/types/billing";

interface Props {
  submissions: PaymentSubmission[];
}

export default function SubmissionHistory({ submissions }: Props) {
  if (submissions.length === 0) return null;

  return (
    <section className="w-full bg-white rounded-xl outline outline-[0.81px] outline-offset-[-0.81px] outline-lime-800/20 p-5">
      <div className="mb-4">
        <h2 className="text-lime-800 text-xs font-medium font-['Inter'] leading-3 mb-1">
          Payment Submission History
        </h2>
        <p className="text-gray-500 text-xs font-normal font-['Inter'] leading-5">
          Track the status of your submitted payment proofs
        </p>
      </div>
      <div className="space-y-2">
        {submissions.map((sub) => (
          <div
            key={sub.submission_id}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-lime-800/10 hover:bg-lime-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                sub.status === "Accepted" ? "bg-green-500" :
                sub.status === "Rejected" ? "bg-red-500"   : "bg-amber-400"
              }`} />
              <div>
                <p className="text-lime-800 text-xs font-medium">
                  Submitted {fmtDate(sub.created_at)}
                </p>
                {sub.amount_declared != null && (
                  <p className="text-gray-400 text-[10px]">
                    Declared: {fmtPHP(sub.amount_declared)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sub.status === "Rejected" && sub.remarks_admin && (
                <p className="text-red-500 text-[10px] max-w-[180px] text-right leading-tight">
                  {sub.remarks_admin}
                </p>
              )}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusColor[sub.status]}`}>
                {sub.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
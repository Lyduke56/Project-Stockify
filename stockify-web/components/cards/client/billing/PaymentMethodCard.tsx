import { fmtDate, statusColor } from "@/lib/billing-utils";
import { PaymentSettings, PaymentSubmission } from "@/types/billing";

interface Props {
  isLoading:       boolean;
  hasPendingSub:   boolean;
  paymentSettings: PaymentSettings;
  submissions:     PaymentSubmission[];
  onUpload:        () => void;
}

export default function PaymentMethodCard({
  isLoading,
  hasPendingSub,
  paymentSettings,
  submissions,
  onUpload,
}: Props) {
  const latest = submissions[0] ?? null;

  return (
    <div className="lg:col-span-1 w-full bg-white rounded-xl outline outline-[0.87px] outline-offset-[-0.87px] outline-lime-800/20 flex flex-col gap-5 p-5">
      <div>
        <div className="text-lime-800 text-sm font-medium font-['Inter'] leading-3 mb-1.5">Payment Method</div>
        <div className="text-gray-500 text-sm font-normal font-['Inter'] leading-5">
          {paymentSettings.payment_instructions ?? "Scan the QR Code to proceed."}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="rounded-lg outline outline-[0.87px] outline-offset-[-0.87px] outline-lime-800/20 flex flex-col justify-center items-center p-3.5 gap-2.5 min-h-[192px]">
          {paymentSettings.payment_qr_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={paymentSettings.payment_qr_url}
              alt="Stockify Payment QR Code"
              className="w-40 h-40 object-contain"
            />
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded flex flex-col items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01"/>
              </svg>
              <span className="text-[10px] text-gray-400 font-medium text-center px-2">
                QR code will appear here once set by admin
              </span>
            </div>
          )}
          {paymentSettings.payment_gcash_name && (
            <div className="text-center">
              <p className="text-lime-800 text-xs font-bold">{paymentSettings.payment_gcash_name}</p>
              {paymentSettings.payment_gcash_number && (
                <p className="text-gray-500 text-[11px]">{paymentSettings.payment_gcash_number}</p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onUpload}
          disabled={isLoading || hasPendingSub}
          className="w-full px-4 py-1.5 bg-white rounded-md outline outline-[0.87px] outline-offset-[-0.87px] outline-lime-800/30 flex justify-center items-center gap-2 hover:bg-lime-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="#1a2e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="text-neutral-950 text-xs font-medium font-['Inter'] leading-4">
            {isLoading ? "Loading…" : hasPendingSub ? "Submission Under Review" : "Upload Proof of Payment"}
          </span>
        </button>
      </div>

      {!isLoading && latest && (
        <div className="border-t border-lime-800/10 pt-3">
          <p className="text-lime-800 text-[10px] font-semibold uppercase tracking-wide mb-2">
            Latest Submission
          </p>
          <div className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${
            latest.status === "Accepted" ? "bg-green-50" :
            latest.status === "Rejected" ? "bg-red-50"   : "bg-amber-50"
          }`}>
            <span className="text-[11px] font-medium text-gray-600">
              {fmtDate(latest.created_at)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[latest.status]}`}>
              {latest.status}
            </span>
          </div>
          {latest.status === "Rejected" && latest.remarks_admin && (
            <p className="text-red-600 text-[10px] mt-1.5 leading-relaxed">
              Reason: {latest.remarks_admin}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
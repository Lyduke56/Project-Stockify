import { fmtDate, fmtPHP } from "@/lib/billing-utils";
import { SubscriptionRecord } from "@/types/billing";

interface Props {
  isLoading:     boolean;
  subStatus:     string;
  memberCount:   number;
  latestRecord:  SubscriptionRecord | null;
  totalUnpaid:   number;
  hasPendingSub: boolean;
  onUpload:      () => void;
  onCancel:      () => void;
}

export default function SubscriptionStatusCard({
  isLoading,
  subStatus,
  memberCount,
  latestRecord,
  totalUnpaid,
  hasPendingSub,
  onUpload,
  onCancel,
}: Props) {
  return (
    <div className="lg:col-span-2 w-full bg-lime-950 rounded-xl outline outline-[0.82px] outline-offset-[-0.82px] outline-lime-800/20 inline-flex flex-col justify-start items-start gap-5 p-5">

      <div className="w-full flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <div className="w-24 h-5 px-1.5 py-[1.64px] bg-amber-400 rounded-md inline-flex justify-center items-center">
            <div className="text-lime-800 text-[9.83px] font-medium font-['Inter'] leading-3">CURRENT STATUS</div>
          </div>
          <div className="text-amber-400 text-2xl font-medium font-['Inter'] leading-7">
            {isLoading ? "—" : subStatus}
          </div>
          <div className="text-yellow-200 text-sm font-normal font-['Inter'] leading-5">
            Perfect for growing businesses
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-amber-400 text-3xl font-bold font-['Inter'] leading-8">
            {isLoading ? "—" : fmtPHP(latestRecord ? Number(latestRecord.amount) : 1000)}
          </div>
          <div className="text-yellow-200 text-xs font-normal font-['Inter'] leading-4">/month</div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-lg p-3.5 flex flex-col gap-1">
          <div className="text-yellow-200 text-xs font-normal font-['Inter'] leading-4">Inventory Items</div>
          <div className="text-white text-xl font-bold font-['Inter'] leading-7">443</div>
          <div className="text-yellow-200 text-[9.83px] font-normal font-['Inter'] leading-3">Unlimited</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3.5 flex flex-col gap-1">
          <div className="text-yellow-200 text-xs font-normal font-['Inter'] leading-4">Team Members</div>
          <div className="text-white text-xl font-bold font-['Inter'] leading-7">
            {isLoading ? "—" : `${memberCount} / 3`}
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3.5 flex flex-col gap-1 col-span-2">
          <div className="text-yellow-200 text-xs font-normal font-['Inter'] leading-4">Next Billing Date</div>
          <div className="text-white text-sm font-bold font-['Inter'] leading-6">
            {isLoading ? "—" : fmtDate(latestRecord?.overdue_at ?? null)}
          </div>
          {!isLoading && totalUnpaid > 0 && (
            <div className="text-red-400 text-[10px] font-bold mt-0.5">
              Outstanding balance: {fmtPHP(totalUnpaid)}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onUpload}
          disabled={isLoading || hasPendingSub}
          className="h-7 px-4 bg-amber-400 rounded-md text-lime-800 text-xs font-medium font-['Inter'] leading-4 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {isLoading ? "Loading…" : hasPendingSub ? "Submission Pending…" : "Upload Proof of Payment"}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="h-7 px-4 bg-red-800/95 rounded-md outline outline-[0.82px] outline-offset-[-0.82px] outline-neutral-600 text-neutral-50 text-xs font-medium font-['Inter'] leading-4 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}
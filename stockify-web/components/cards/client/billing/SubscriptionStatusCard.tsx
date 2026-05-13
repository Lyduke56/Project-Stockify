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
    <div className="lg:col-span-2 w-full h-full bg-lime-950 rounded-[24px] flex flex-col p-6 sm:p-8 shadow-md border border-lime-900">
      
      {/* ── TOP CONTENT (Pushes footer down) ── */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* HEADER SECTION */}
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-max px-2.5 py-1 bg-lime-900/50 border border-lime-800/50 rounded-md">
              <span className="text-amber-400 text-[10px] font-bold tracking-wider uppercase">
                Current Status
              </span>
            </div>
            <div>
              <div className="text-white text-3xl font-black tracking-tight">
                {isLoading ? "—" : subStatus}
              </div>
              <div className="text-lime-200/70 text-sm font-medium mt-1">
                Perfect for growing businesses
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end">
            <div className="text-amber-400 text-4xl font-black tracking-tight drop-shadow-sm">
              {isLoading ? "—" : fmtPHP(latestRecord ? Number(latestRecord.amount) : 1000)}
            </div>
            <div className="text-lime-200/60 text-sm font-medium mt-1">
              per month
            </div>
          </div>
        </div>

        {/* STATS GRID (2x2 Layout) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stat 1: Inventory Items */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex flex-col justify-center gap-2">
            <div className="text-lime-200/70 text-xs font-semibold uppercase tracking-wider">
              Inventory Items
            </div>
            <div className="flex items-end gap-2">
              <div className="text-white text-2xl font-bold leading-none">443</div>
              <div className="text-amber-400 text-[10px] font-bold mb-0.5 px-2 py-0.5 bg-amber-400/10 rounded uppercase tracking-wide">
                Unlimited
              </div>
            </div>
          </div>

          {/* Stat 2: Team Members */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex flex-col justify-center gap-2">
            <div className="text-lime-200/70 text-xs font-semibold uppercase tracking-wider">
              Team Members
            </div>
            <div className="text-white text-2xl font-bold leading-none">
              {isLoading ? "—" : `${memberCount} / 3`}
            </div>
          </div>

          {/* Stat 3: Next Billing Date (Spans full width) */}
          <div className="sm:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-lime-200/70 text-xs font-semibold uppercase tracking-wider">
                Next Billing Date
              </div>
              <div className="text-white text-xl font-bold leading-none">
                {isLoading ? "—" : fmtDate(latestRecord?.overdue_at ?? null)}
              </div>
            </div>
            {!isLoading && totalUnpaid > 0 && (
              <div className="inline-flex w-max items-center px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold">
                Outstanding Balance: {fmtPHP(totalUnpaid)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ACTIONS (Anchored to bottom) ── */}
      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onUpload}
          disabled={isLoading || hasPendingSub}
          className="w-full sm:w-auto h-11 px-6 bg-amber-400 rounded-xl text-lime-950 text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-amber-500 hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-amber-400/20 disabled:opacity-60 disabled:pointer-events-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {isLoading ? "Loading..." : hasPendingSub ? "Submission Pending..." : "Upload Proof of Payment"}
        </button>
        
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto h-11 px-6 bg-transparent border border-red-500/30 rounded-xl text-red-400 text-sm font-bold transition-all hover:bg-red-500/10 hover:border-red-500 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
        >
          Cancel Subscription
        </button>
      </div>
      
    </div>
  );
}
// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface SuspendedTenant {
  id: string;
  tenant_id: string;
  business_name: string;
  owner_name: string;
  owner_email: string | null;
  suspended_at: string;
  suspension_expires_at: string | null;
  reason?: string;
}

export interface BillingRecord {
  amount: number;
  billing_period: string;
  payment_status: "Paid" | "Pending" | "Overdue";
  paid_at: string | null;
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

export const formatMonth = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

export const daysUntilExpiry = (expiresAt: string | null): number | null => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Shared SVG Icons ─────────────────────────────────────────────────────────

export const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const AlertIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ─── Shared Sub-Components ────────────────────────────────────────────────────

export function InfoBlock({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-widest text-[#385E31]/50 font-bold mb-0.5">
        {label}
      </p>
      <p className="text-sm text-[#385E31] font-semibold break-all">{value}</p>
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  headerClass = "bg-[#385E31]",
  borderClass = "border-[#385E31]",
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  headerClass?: string;
  borderClass?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-[#FFFCEB] border ${borderClass} rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden`}
      >
        <div className={`${headerClass} px-6 py-4 flex items-center justify-between`}>
          <div>
            <h2 className="text-[#FFFCEB] font-bold text-lg leading-tight">{title}</h2>
            <p className="text-[#FFFCEB]/60 text-xs mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#FFFCEB]/70 hover:text-[#FFFCEB] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">{children}</div>

        <div className="px-6 pb-5 flex justify-end gap-3">{footer}</div>
      </div>
    </div>
  );
}
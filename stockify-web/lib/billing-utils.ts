export const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

export const fmtPHP = (n: number): string =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

export const toInvoiceId = (billingPeriod: string): string => {
  const d     = new Date(billingPeriod + "T00:00:00");
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `INV-${year}-${month}`;
};

export const statusColor: Record<string, string> = {
  Paid:     "bg-green-100 text-green-700",
  Pending:  "bg-amber-100 text-amber-700",
  Overdue:  "bg-orange-100 text-orange-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};
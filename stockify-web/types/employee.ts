// Shared types for the employee section
export type SectionKey =
  | "dashboard"
  | "audit-logs"
  | "products"
  | "ingredients"
  | "orders"
  | "transactions"
  | "analytics";

export interface SidebarData {
  role:         string;
  businessType: string;
  businessName: string;
}

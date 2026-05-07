export interface SubscriptionRecord {
  subscription_id: string;
  billing_period:  string;
  payment_status:  "Pending" | "Paid" | "Overdue";
  amount:          number;
  amount_paid:     number | null;
  paid_at:         string | null;
  overdue_at:      string | null;
  grace_ends_at:   string | null;
}

export interface TenantData {
  tenant_id:           string;
  business_name:       string;
  owner_full_name:     string;
  owner_email:         string;
  subscription_status: string;
  trial_ends_at:       string | null;
  member_count:        number;
}

export interface PaymentSubmission {
  submission_id:   string;
  subscription_id: string | null;  // ← add this
  status:          "Pending" | "Accepted" | "Rejected";
  amount_declared: number | null;
  remarks_admin:   string | null;
  created_at:      string;
  reviewed_at:     string | null;
}

export interface PaymentSettings {
  payment_qr_url:       string | null;
  payment_gcash_name:   string | null;
  payment_gcash_number: string | null;
  payment_instructions: string | null;
}
// lib/audit.ts
//
// Universal audit-log helper.
// Call logAudit() from any API route, cron job, or server action.
// Fire-and-forget: errors are caught internally so they never break the caller.

import { createClient } from "@supabase/supabase-js";

// ── Event type constants ─────────────────────────────────────────────────────
// Import these wherever you call logAudit() for autocomplete + consistency.
export const AuditEvent = {
  // Tenant lifecycle
  TENANT_CREATED:    "TenantCreated",
  TENANT_SUSPENDED:  "TenantSuspended",
  TENANT_RESTORED:   "TenantRestored",
  TENANT_TERMINATED: "TenantTerminated",

  // Billing
  PAYMENT_RECORDED:  "PaymentRecorded",
  INVOICE_GENERATED: "InvoiceGenerated",
  TRIAL_CONVERTED:   "TrialConverted",

  // Notifications
  NOTIFICATION_SENT:        "NotificationSent",
  TRIAL_REMINDER_SENT:      "TrialReminderSent",
  OVERDUE_NOTICE_SENT:      "OverdueNoticeSent",
  GRACE_PERIOD_STARTED:     "GracePeriodStarted",
  SUSPENSION_NOTICE_SENT:   "SuspensionNoticeSent",
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];

// ── Payload shape ────────────────────────────────────────────────────────────
export interface AuditPayload {
  performedBy:  string;           // "Superadmin (Axziel)" | "Automated System" | "Cron: grace-check"
  eventType:    AuditEventType;
  description:  string;
  tenantId?:    string | null;
  businessName?: string | null;
  metadata?:    Record<string, unknown>; // optional extra data for debugging
}

// ── Core function ────────────────────────────────────────────────────────────
// Uses service-role client so it works in every server context.
// Returns the inserted row id on success, null on failure.
export async function logAudit(payload: AuditPayload): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      performed_by:  payload.performedBy,
      event_type:    payload.eventType,
      description:   payload.description,
      tenant_id:     payload.tenantId    ?? null,
      business_name: payload.businessName ?? null,
      metadata:      payload.metadata    ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // Never throw — audit failures must not break the caller
    console.error("[audit] Failed to write audit log:", error.message, payload);
    return null;
  }

  return data.id;
}
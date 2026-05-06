"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import SidebarClient      from "@/components/navbars/sidebar-client";
import NavbarClient       from "@/components/navbars/navbar-client";
import ProofUploadModal   from "@/components/modals/client/billing/proof-upload-modal";
import CancelConfirmModal from "@/components/modals/client/billing/cancel-confirm-modal";

import SubscriptionStatusCard from "@/components/cards/client/billing/SubscriptionStatusCard";
import PaymentMethodCard      from "@/components/cards/client/billing/PaymentMethodCard";
import SubmissionHistory      from "@/components/cards/client/billing/SubmissionHistory";
import BillingHistoryTable    from "@/components/tables/client/billing/BillingHistoryTable"; 

import type {
  SubscriptionRecord,
  TenantData,
  PaymentSubmission,
  PaymentSettings,
} from "@/types/billing";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientBillingPage() {
  const [tenant,          setTenant]          = useState<TenantData | null>(null);
  const [records,         setRecords]         = useState<SubscriptionRecord[]>([]);
  const [submissions,     setSubmissions]     = useState<PaymentSubmission[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_qr_url:       null,
    payment_gcash_name:   "Stockify",
    payment_gcash_number: "",
    payment_instructions: "Scan the QR code using GCash or any e-wallet, then upload your screenshot.",
  });

  const supabase = createClient();

  const [currentUserId,   setCurrentUserId]   = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [sessionReady,    setSessionReady]    = useState(false);
  const [dataLoading,     setDataLoading]     = useState(false);
  const [sessionError,    setSessionError]    = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  // ── Step 1: resolve session via auth UUID ─────────────────────────────────

  const resolveSession = useCallback(async (authUserId: string) => {
    try {
      const res  = await fetch(`/api/client/billing?userId=${authUserId}`);
      const json = await res.json();

      if (!res.ok || !json.user) {
        setSessionError(json.error ?? "Could not resolve user.");
        return;
      }

      setCurrentUserId(json.user.user_id);
      setCurrentTenantId(json.user.tenant_id);
      if (json.tenant) setTenant(json.tenant);
      setSessionError(null);
    } catch {
      setSessionError("Network error resolving session.");
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        resolveSession(session.user.id);
      } else {
        setSessionError("Not logged in.");
        setSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { if (session?.user?.id) resolveSession(session.user.id); }
    );

    return () => { subscription.unsubscribe(); };
  }, [resolveSession]);

  // ── Step 2: fetch billing data once tenant_id is known ───────────────────

  const fetchAll = useCallback(async () => {
    if (!currentTenantId) return;
    setDataLoading(true);
    try {
      const [recordsRes, subsRes, settingsRes] = await Promise.all([
        fetch(`/api/cron/billing/records?tenantId=${currentTenantId}`),
        fetch(`/api/client/payment-submit?tenantId=${currentTenantId}`),
        fetch("/api/payment-settings"),
      ]);

      const [recordsJson, subsJson, settingsJson] = await Promise.all([
        recordsRes.json(),
        subsRes.json(),
        settingsRes.json(),
      ]);

      if (recordsJson.records)   setRecords(recordsJson.records);
      if (subsJson.submissions)  setSubmissions(subsJson.submissions);
      if (settingsJson.settings) setPaymentSettings((prev) => ({ ...prev, ...settingsJson.settings }));
    } catch (e) {
      console.error("[ClientBilling] fetchAll error:", e);
    } finally {
      setDataLoading(false);
    }
  }, [currentTenantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Step 3: real-time updates ─────────────────────────────────────────────

  useEffect(() => {
    if (!currentTenantId) return;
    const channel = supabase
      .channel("client-billing-rt")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "payment_submissions",
          filter: `tenant_id=eq.${currentTenantId}` },
        () => fetchAll()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "subscription_records",
          filter: `tenant_id=eq.${currentTenantId}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentTenantId, fetchAll]);

  // ── Derived values ────────────────────────────────────────────────────────

  const latestRecord  = records[0] ?? null;
  const hasPendingSub = submissions.some((s) => s.status === "Pending");
  const totalUnpaid   = records
    .filter((r) => r.payment_status !== "Paid")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const isLoading = !sessionReady || dataLoading;

  // ── Session error state ───────────────────────────────────────────────────

  if (sessionReady && sessionError) {
    return (
      <div className="min-h-screen bg-white flex overflow-x-hidden">
        <SidebarClient active="billing" />
        <main className="ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <NavbarClient />
            <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              ⚠ Session error: {sessionError}. Try refreshing the page.
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="billing" />

      <main className="ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">

          <NavbarClient />

          {successMsg && (
            <div className="w-full px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-medium">
              ✓ {successMsg}
            </div>
          )}

          {/* ── Page Title ── */}
          <section className="w-full h-12 inline-flex flex-col justify-start items-start gap-[3.23px]">
            <div className="self-stretch h-7 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter'] leading-7">
                Billing &amp; Subscription
              </div>
            </div>
            <div className="self-stretch h-5 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-5">
                Manage your subscription, payment methods, and billing history
              </div>
            </div>
          </section>

          {/* ── Subscription Status & Payment Method ── */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SubscriptionStatusCard
              isLoading={isLoading}
              subStatus={tenant?.subscription_status ?? "—"}
              memberCount={tenant?.member_count ?? 0}
              latestRecord={latestRecord}
              totalUnpaid={totalUnpaid}
              hasPendingSub={hasPendingSub}
              onUpload={() => setShowUpload(true)}
              onCancel={() => setShowCancel(true)}
            />
            <PaymentMethodCard
              isLoading={isLoading}
              hasPendingSub={hasPendingSub}
              paymentSettings={paymentSettings}
              submissions={submissions}
              onUpload={() => setShowUpload(true)}
            />
          </section>

          {/* ── Submission History ── */}
          {!isLoading && <SubmissionHistory submissions={submissions} />}

          {/* ── Billing History Table ── */}
          <BillingHistoryTable isLoading={isLoading} records={records} />

          {/* ── Help Section ── */}
          <section className="w-full h-10 relative flex items-start gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#1d4ed8" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"
              className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="flex flex-col gap-[3.23px]">
              <span className="text-blue-900 text-xs font-medium font-['Inter'] leading-5">
                Need help with billing?
              </span>
              <span className="text-blue-700 text-xs font-normal font-['Inter'] leading-4">
                Contact our support team at{" "}
                <a href="mailto:billing@stockify.com" className="underline">billing@stockify.com</a>.
              </span>
            </div>
          </section>

        </div>
      </main>

      <ProofUploadModal
        isOpen={showUpload}
        tenantId={currentTenantId}
        userId={currentUserId}
        latestRecord={latestRecord}
        onClose={() => setShowUpload(false)}
        onSubmitted={() => {
          setShowUpload(false);
          flash("Payment proof submitted! Our team will review it shortly.");
          fetchAll();
        }}
      />

      <CancelConfirmModal
        isOpen={showCancel}
        tenantId={currentTenantId}
        onClose={() => setShowCancel(false)}
        onConfirmed={() => {
          setShowCancel(false);
          flash("Cancellation request sent.");
          fetchAll();
        }}
      />
    </div>
  );
}
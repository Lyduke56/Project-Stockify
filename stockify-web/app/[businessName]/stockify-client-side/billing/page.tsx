"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, Variants } from "framer-motion"; // <-- Added imports

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

// ── Animations ────────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each section appearing
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientBillingPage() {
  const supabase = useMemo(() => createClient(), []);

  const [tenant,          setTenant]          = useState<TenantData | null>(null);
  const [records,         setRecords]         = useState<SubscriptionRecord[]>([]);
  const [submissions,     setSubmissions]     = useState<PaymentSubmission[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_qr_url:       null,
    payment_gcash_name:   "Stockify",
    payment_gcash_number: "",
    payment_instructions: "Scan the QR code using GCash or any e-wallet, then upload your screenshot.",
  });

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
  }, [supabase, resolveSession]);

  // ── Step 2: fetch billing data safely ─────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!currentTenantId) return;
    setDataLoading(true);
    try {
      // 1. Fetch all three endpoints simultaneously
      const [recordsRes, subsRes, settingsRes] = await Promise.all([
        fetch(`/api/cron/billing/records?tenantId=${currentTenantId}`),
        fetch(`/api/client/payment-submit?tenantId=${currentTenantId}`),
        fetch("/api/payment-settings"),
      ]);

      // 2. Safe parse helper to prevent entire page crash if one endpoint fails
      const safeParse = async (res: Response) => {
        if (!res.ok) {
          console.warn(`[API Warning] ${res.url} returned status ${res.status}`);
          return {};
        }
        try {
          return await res.json();
        } catch (e) {
          console.error(`[API Error] Could not parse JSON from ${res.url}`);
          return {};
        }
      };

      // 3. Parse safely
      const recordsJson  = await safeParse(recordsRes);
      const subsJson     = await safeParse(subsRes);
      const settingsJson = await safeParse(settingsRes);

      // 4. Update state only with valid data
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

  const fetchAllRef = useRef(fetchAll);
  useEffect(() => { fetchAllRef.current = fetchAll; }, [fetchAll]);

  useEffect(() => {
    if (!currentTenantId) return;

    const channelName = `client-billing-rt:${currentTenantId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_submissions",
          filter: `tenant_id=eq.${currentTenantId}` },
        () => { fetchAllRef.current(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscription_records",
          filter: `tenant_id=eq.${currentTenantId}` },
        () => { fetchAllRef.current(); }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.debug("[ClientBilling] realtime subscribed for tenant", currentTenantId);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[ClientBilling] realtime channel error:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentTenantId]);

  // ── Derived values ────────────────────────────────────────────────────────

  const latestRecord  = records[0] ?? null;
  const hasPendingSub = submissions.some((s) => s.status === "Pending");
  
  // Updated totalUnpaid calculation: amount - amount_paid
  const totalUnpaid   = records
    .filter((r) => r.payment_status !== "Paid")
    .reduce((sum, r) => sum + (Number(r.amount) - Number(r.amount_paid || 0)), 0);

  const isLoading = !sessionReady || dataLoading;

  // ── Session error state ───────────────────────────────────────────────────

  if (sessionReady && sessionError) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex overflow-x-hidden font-['Inter']">
        <SidebarClient active="billing" />
        <main className="ml-0 lg:ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <NavbarClient />
            <div className="w-full flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-600">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span><strong>Session error:</strong> {sessionError}. Please try refreshing the page.</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 flex overflow-x-hidden font-['Inter']">
      <SidebarClient active="billing" />

      <main className="ml-0 lg:ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <motion.div 
          className="mx-auto w-full max-w-6xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          <motion.div variants={itemVariants}>
            <NavbarClient />
          </motion.div>

          {/* Flash Success Message */}
          {successMsg && (
            <motion.div variants={itemVariants} className="w-full flex items-center gap-3 px-5 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {successMsg}
            </motion.div>
          )}

          {/* ── Page Title ── */}
          <motion.header variants={itemVariants} className="flex flex-col gap-1">
            <h1 className="text-lime-900 text-3xl font-extrabold leading-tight tracking-tight pl-2 mt-4">
              Billing & Subscription
            </h1>
            <p className="text-lime-800/70 text-sm font-medium pl-2">
              Manage your subscription, payment methods, and billing history
            </p>
          </motion.header>

          {/* ── Subscription Status & Payment Method ── */}
          <motion.section variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          </motion.section>

          {/* ── Submission History ── */}
          <motion.div variants={itemVariants}>
            {!isLoading && <SubmissionHistory submissions={submissions} />}
          </motion.div>

          {/* ── Billing History Table ── */}
          <motion.div variants={itemVariants}>
            <BillingHistoryTable
              isLoading={isLoading}
              records={records}
              tenant={tenant}
              submissions={submissions}
            />
          </motion.div>

          {/* ── Help Section ── */}
          <motion.section variants={itemVariants} className="w-full mt-4 p-5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3.5 shadow-sm">
            <div className="mt-0.5 shrink-0 bg-blue-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-blue-900 text-sm font-bold tracking-wide">
                Need help with billing?
              </span>
              <span className="text-blue-800/80 text-sm font-medium">
                Contact our support team at{" "}
                <a href="mailto:billing@stockify.com" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-semibold">
                  billing@stockify.com
                </a>.
              </span>
            </div>
          </motion.section>

        </motion.div>
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
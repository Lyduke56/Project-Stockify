import SubscriptionStatus from "@/components/cards/admin/subscription-status";
import PaymentMethod from "@/components/cards/admin/payment-method";
import BillingHistory from "@/components/tables/billing-history";

export default function SubscriptionBilling() {
  return (
    <>
      <header className="mb-8 text-center flex flex-col items-center justify-center">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Subscription Billing
        </h1>
        <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-2 rounded-full opacity-50" /> {/* <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-1 rounded-full"*/}
      </header>

      <div className="flex flex-col gap-8">

        {/* Top cards — centered */}
        <div className="flex justify-center">
          <div className="flex items-start gap-8">
            <SubscriptionStatus
              status="Subscribed"
              pricePerMonth="₱000.00"
              inventoryItems={67}
              inventoryLimit="Unlimited"
              teamUsed={3}
              teamTotal={3}
              nextBilling="April 1, 2026"
              onUnsubscribe={() => console.log("unsubscribe")}
              onPayment={() => console.log("payment")}
            />
            <PaymentMethod
              onProofOfPayment={() => console.log("proof of payment")}
            />
          </div>
        </div>

        {/* Billing history table */}
        <BillingHistory
          records={[
            { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid", onReview: () => console.log("review") },
            { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid", onReview: () => console.log("review") },
            { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid", onReview: () => console.log("review") },
            { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid", onReview: () => console.log("review") },
            { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid", onReview: () => console.log("review") },
          ]}
        />

      </div>
    </>
  );
}
import SubscriptionStatus from "@/components/cards/admin/subscription-status";
import PaymentMethod from "@/components/cards/admin/payment-method";

export default function SubscriptionBilling() {


  return (
    <>
      <header className="mb-8 text-center">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Subscription Billing
        </h1>
        <div className="w-full h-1 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
      </header>

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
    </>
  );
}
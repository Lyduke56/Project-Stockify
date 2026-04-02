"use client";
import { useRouter } from "next/navigation";

type SidebarClientProps = {
  active?: "dashboard" | "analytics" | "billing" | "settings";
};

export default function SidebarClient({ active = "dashboard" }: SidebarClientProps) {
  const router = useRouter();

  const go = (href: string) => router.push(href);

  return (
    <div className="w-64 h-screen sticky top-0 pt-20 pb-2.5 bg-amber-400 shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col justify-start items-center gap-7">
        <div data-showaccounts="true" data-showanalytics="true" data-showaudit="false" data-showdashboard="true" data-showinventory="false" data-showorders="false" data-showrestockalert="false" data-showstockifyhub="false" data-showstorefront="false" data-showstoresettings="false" data-showsubscriptionbilling="true" data-showtenantmanagement="false" data-showuseradmin="false" className="self-stretch h-[563px] flex flex-col justify-start items-center gap-2.5 overflow-hidden">
            <button
              type="button"
              // ROUTING: point this to the route that renders the client dashboard UI.
              onClick={() => go("/stockify-client-side/Dashboard")}
              data-icon="true"
              data-property-1={active === "dashboard" ? "Hover" : "Main"}
              className={
                active === "dashboard"
                  ? "w-64 h-14 pl-5 pr-12 py-6 bg-lime-950 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] inline-flex justify-start items-center gap-2.5"
                  : "w-64 h-14 pl-5 pr-12 py-6 bg-amber-400 inline-flex justify-start items-center gap-2.5"
              }
            >
            <div className="w-10 h-10 relative overflow-hidden">
                <div
                  className={
                    active === "dashboard"
                      ? "w-9 h-7 left-[3.42px] top-[6.83px] absolute bg-amber-400"
                      : "w-9 h-7 left-[3.42px] top-[6.83px] absolute bg-lime-900"
                  }
                />
            </div>
            <div data-property-1="x1" className="w-16 h-9 relative">
                <div
                  className={
                    active === "dashboard"
                      ? "left-0 top-[10px] absolute justify-center text-amber-400 text-base font-bold font-['Inter']"
                      : "left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']"
                  }
                >
                  Dashboard
                </div>
            </div>
            </button>
            <div data-icon="true" data-property-1="Main" className="w-64 h-14 pl-5 pr-12 py-6 bg-amber-400 inline-flex justify-start items-center gap-2.5">
            <div className="w-10 h-10 relative overflow-hidden">
                <div className="w-9 h-8 left-[3.42px] top-[5.13px] absolute bg-lime-900" />
            </div>
            <div data-property-1="x2" className="w-16 h-9 relative">
                <div className="left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']">Analytics &amp; Reports</div>
            </div>
            </div>
            <div data-icon="true" data-property-1="Main" className="w-64 h-14 pl-5 pr-12 py-6 bg-amber-400 inline-flex justify-start items-center gap-2.5">
            <div className="w-10 h-10 relative overflow-hidden">
                <div className="w-9 h-7 left-[3.42px] top-[8.54px] absolute bg-lime-900" />
            </div>
            <div data-property-1="x2" className="w-16 h-9 relative">
                <div className="left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']">Subscription Billing</div>
            </div>
            </div>
        </div>
        <div className="w-60 h-0 outline outline-[3px] outline-offset-[-1.50px] outline-green-950/20" />
        <div className="w-32 flex flex-col justify-center items-center gap-2.5">
            <div data-showicon="true" className="self-stretch h-10 inline-flex justify-start items-start gap-2.5">
            <div className="w-9 h-9 relative">
                <div className="w-8 h-8 left-[3.09px] top-[3.17px] absolute bg-lime-900" />
            </div>
            <div data-property-1="x2" className="w-16 h-9 relative">
                <div className="left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']">Settings</div>
            </div>
            </div>
            <div data-showicon="true" className="self-stretch h-10 inline-flex justify-start items-start gap-2.5">
            <div className="w-9 h-9 relative overflow-hidden">
                <div className="w-7 h-7 left-[4.75px] top-[4.75px] absolute bg-lime-900" />
            </div>
            <div data-property-1="x2" className="w-16 h-9 relative">
                <div className="left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']">Logout</div>
            </div>
            </div>
        </div>
    </div>
  );
}
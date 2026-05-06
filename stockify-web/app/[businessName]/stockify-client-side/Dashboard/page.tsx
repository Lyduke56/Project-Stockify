"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientDashboardPage() {

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="dashboard" />

      <main className="ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <NavbarClient />

          {/* GREETING + SHOP NAME. replace placeholder values with real data */}
          <section className="w-full h-12 inline-flex flex-col justify-start items-start gap-[3.23px]">
            <div className="self-stretch h-7 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800 text-3xl font-bold font-['Inter'] leading-8">Hello, Client! </div>
            </div>
            <div className="self-stretch h-5 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800/70 text-sm font-normal font-['Inter'] leading-6">Shop Name Corporation, Inc.</div>
            </div>
          </section>

          {/* KPI CARDS. summary metrics + time range */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-lime-800/30 p-5 relative overflow-hidden">
              <div className="text-lime-800 text-sm font-bold font-['Inter']">Active New Customers</div>
              <div className="mt-6 rounded-tr-xl rounded-bl-xl rounded-br-xl bg-lime-950 p-5">
                <div className="text-amber-400 text-4xl font-bold font-['Inter'] text-center">58</div>
                <div className="mt-2 text-amber-400 text-xs font-semibold font-['Raleway'] text-center">+ 10% from previous month</div>
              </div>
            </div>

            <div className="rounded-3xl border border-lime-800/30 p-5 relative overflow-hidden">
              <div className="text-lime-800 text-sm font-bold font-['Inter']">Monthly Revenue</div>
              <div className="mt-6 rounded-tr-xl rounded-bl-xl rounded-br-xl bg-lime-950 p-5">
                <div className="text-amber-400 text-4xl font-bold font-['Inter'] text-center">₱48.5k</div>
                <div className="mt-2 text-amber-400 text-xs font-semibold font-['Raleway'] text-center">+ 8.56% from previous month</div>
              </div>
            </div>

            <div className="rounded-3xl border border-lime-800/30 p-5 relative overflow-hidden">
              <div className="text-lime-800 text-sm font-bold font-['Inter']">Total Orders</div>
              <div className="mt-6 rounded-tr-xl rounded-bl-xl rounded-br-xl bg-lime-950 p-5">
                <div className="text-amber-400 text-4xl font-bold font-['Inter'] text-center">124</div>
                <div className="mt-2 text-amber-400 text-xs font-semibold font-['Raleway'] text-center">+ 5% from previous month</div>
              </div>
            </div>
          </section>

          {/* ALERTS + STATUS. subscription state + inventory status */}
          <section className="w-full grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="w-full lg:col-span-3 bg-orange-100 rounded-xl border border-orange-500/50 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-orange-900 text-sm font-medium font-['Inter']">Account Alerts</div>
                <div className="mt-2 text-orange-700 text-base font-normal font-['Inter'] leading-5">10 days left before subscription expires!</div>
              </div>
              <button
                type="button"
                // to billing/renewal page 
                className="h-10 px-8 rounded-2xl bg-amber-400 shadow-[1.4096916913986206px_2.819383382797241px_2.819383382797241px_0.7048458456993103px_rgba(0,0,0,0.16)] text-lime-800 text-base font-semibold font-['Inter']"
              >
                Renew Here
              </button>
            </div>
          </section>
          <section className="w-full grid grid-cols-1 gap-6 lg:col-span-3">
            <div className="bg-white rounded-xl border border-lime-800/20 p-5">
              <div className="text-lime-800 text-sm font-medium font-['Inter']">Shop Status</div>
              <div className="mt-2 text-gray-500 text-sm font-normal font-['Inter'] leading-5">Overview of your shop status</div>

              {/* shop stats preview + inventory KPIs */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lime-800 text-sm font-semibold font-['Inter']">Shop Name</div>
                  <div className="mt-1 text-lime-800/50 text-xs font-normal font-['Inter']">Revenue / Orders</div>
                  <div className="inline-flex items-center gap-2 rounded-md border border-lime-800/30 px-2 py-1">
                      <div className="text-neutral-950 text-xs font-medium font-['Inter']">Coffee Shop</div>
                    </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="text-lime-800/70 text-xs font-normal font-['Inter']">245 items</div>
                    <div className="text-orange-600 text-xs font-normal font-['Inter']">12 low stock</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-lime-800 text-xl font-bold font-['Inter']">$48.5K</div>
                  <div className="text-lime-800 text-xl font-bold font-['Inter']">124</div>
                  <button
                    type="button"
                    // route to shop management (inventory/products/orders) for the selected shop
                    className="h-8 px-4 rounded-xl bg-amber-400 shadow-[1.0396476984024048px_2.0792953968048096px_2.0792953968048096px_0.5198238492012024px_rgba(0,0,0,0.16)] text-lime-800 text-xs font-semibold font-['Inter']"
                  >
                    Manage Shop
                  </button>
                  
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


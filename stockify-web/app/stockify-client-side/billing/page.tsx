"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientDashboardPage() {

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="billing" />

      <main className="ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <NavbarClient />

            {/* Billing & Subscription Title*/}
            <section className="w-[1005.84px] h-12 inline-flex flex-col justify-start items-start gap-[3.23px]">
                <div className="self-stretch h-7 relative">
                <div className="left-0 top-[-1.62px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter'] leading-7">Billing &amp; Subscription</div>
                </div>
                <div className="self-stretch h-5 relative">
                <div className="left-0 top-[-1.62px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-5">Manage your subscription, payment methods, and billing history</div>
                </div>
            </section>

            {/* Subscription Status & Payment Method Card*/}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Subscription Status */}
                <div className="lg:col-span-2 w-full bg-lime-950 rounded-xl outline outline-[0.82px] outline-offset-[-0.82px] outline-lime-800/20 inline-flex flex-col justify-start items-start gap-5">
                    <div className="w-[671.19px] h-28 relative">
                    <div className="w-[631.87px] left-[19.66px] top-[19.66px] absolute inline-flex justify-between items-start">
                        <div className="w-44 h-20 relative">
                        <div className="w-24 h-5 px-1.5 py-[1.64px] left-[-0.09px] top-[1.78px] absolute bg-amber-400 rounded-md outline outline-[0.82px] outline-offset-[-0.82px] outline-black/0 inline-flex justify-center items-center gap-[3.28px] overflow-hidden">
                            <div className="justify-start text-lime-800 text-[9.83px] font-medium font-['Inter'] leading-3">CURRENT STATUS</div>
                        </div>
                        <div className="w-44 h-7 left-0 top-[29.49px] absolute">
                            <div className="left-0 top-[-1.64px] absolute justify-start text-amber-400 text-2xl font-medium font-['Inter'] leading-7">Subscribed</div>
                        </div>
                        <div className="w-44 h-5 left-0 top-[65.54px] absolute">
                            <div className="left-0 top-[-1.64px] absolute justify-start text-yellow-200 text-sm font-normal font-['Inter'] leading-5">Perfect for growing businesses</div>
                        </div>
                        </div>
                        <div className="w-12 h-12 inline-flex flex-col justify-start items-start">
                        <div className="self-stretch h-8 relative">
                            <div className="left-[-14.03px] top-[-1.64px] absolute text-right justify-start text-amber-400 text-3xl font-bold font-['Inter'] leading-8">₱00</div>
                        </div>
                        <div className="self-stretch h-4 inline-flex justify-start items-start">
                            <div className="flex-1 text-right justify-start text-yellow-200 text-xs font-normal font-['Inter'] leading-4">/month</div>
                        </div>
                        </div>
                    </div>
                    </div>
                    <div className="w-[671.19px] flex-1 px-5 flex flex-col justify-start items-start gap-3.5">
                    <div className="self-stretch h-44 relative">
                        <div className="w-80 h-20 px-3.5 pt-3.5 left-[322.48px] top-0 absolute bg-white/10 rounded-lg inline-flex flex-col justify-start items-start gap-[3.28px]">
                        <div className="self-stretch h-4 inline-flex justify-start items-center gap-1.5">
                            <div className="w-3.5 h-3.5 relative overflow-hidden">
                            <div className="w-2 h-[3.28px] left-[1.09px] top-[8.19px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-1 h-1 left-[2.73px] top-[1.64px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-[1.64px] h-[3.21px] left-[10.38px] top-[8.26px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-[1.64px] h-1 left-[8.74px] top-[1.71px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            </div>
                            <div className="w-20 h-4 flex justify-start items-start">
                            <div className="justify-start text-yellow-200 text-xs font-normal font-['Inter'] leading-4">Team Members</div>
                            </div>
                        </div>
                        <div className="w-72 flex-1 justify-start text-white text-xl font-bold font-['Inter'] leading-7">3 / 3</div>
                        </div>
                        <div className="w-80 h-44 left-[-0.16px] top-[0.24px] absolute bg-white/10 rounded-lg">
                        <div className="w-72 left-[13.11px] top-[58.98px] absolute justify-start text-yellow-200 text-[9.83px] font-normal font-['Inter'] leading-3">Unlimited</div>
                        <div className="w-72 left-[13.11px] top-[32.77px] absolute justify-start text-white text-xl font-bold font-['Inter'] leading-7">443</div>
                        <div className="w-3.5 h-3.5 left-[13.11px] top-[14.75px] absolute overflow-hidden">
                            <div className="w-2.5 h-2.5 left-[1.64px] top-[1.09px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-0 h-1.5 left-[6.55px] top-[6.55px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-2.5 h-[2.73px] left-[1.80px] top-[3.82px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-[4.92px] h-[2.81px] left-[4.10px] top-[2.33px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                        </div>
                        <div className="left-[32.77px] top-[13.11px] absolute justify-start text-yellow-200 text-xs font-normal font-['Inter'] leading-4">Inventory Items</div>
                        </div>
                        <div className="w-80 h-20 px-3.5 pt-3.5 left-[322.48px] top-[85.20px] absolute bg-white/10 rounded-lg inline-flex flex-col justify-start items-start gap-[3.28px]">
                        <div className="self-stretch h-4 inline-flex justify-start items-center gap-1.5">
                            <div className="w-3.5 h-3.5 relative overflow-hidden">
                            <div className="w-0 h-0.5 left-[4.37px] top-[1.09px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-0 h-0.5 left-[8.74px] top-[1.09px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-2.5 h-2.5 left-[1.64px] top-[2.18px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            <div className="w-2.5 h-0 left-[1.64px] top-[5.46px] absolute outline outline-1 outline-offset-[-0.55px] outline-amber-400" />
                            </div>
                            <div className="w-14 h-4 flex justify-start items-start">
                            <div className="justify-start text-yellow-200 text-xs font-normal font-['Inter'] leading-4">Next Billing</div>
                            </div>
                        </div>
                        <div className="justify-start text-white text-sm font-bold font-['Inter'] leading-6">Apr 1, 2026</div>
                        </div>
                    </div>
                    <div className="self-stretch h-9 relative">
                        <div className="w-28 h-7 left-0 top-[6.55px] absolute bg-amber-400 rounded-md">
                        <div className="w-3.5 h-3.5 left-[9.83px] top-[8.19px] absolute overflow-hidden">
                            <div className="w-2.5 h-2.5 left-[1.64px] top-[1.09px] absolute outline outline-1 outline-offset-[-0.55px] outline-lime-800" />
                        </div>
                        <div className="left-[35.43px] top-[5.93px] absolute text-center justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-4">Extend Plan</div>
                        </div>
                        <div className="w-32 h-7 left-[126.36px] top-[6.55px] absolute bg-red-800/95 rounded-md outline outline-[0.82px] outline-offset-[-0.82px] outline-neutral-600">
                        <div className="left-[9.94px] top-[6.13px] absolute text-center justify-start text-neutral-50 text-xs font-medium font-['Inter'] leading-4">Cancel Subscription</div>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Payment Method Card*/}
                <div className="lg:col-span-1 w-full bg-white rounded-xl outline outline-[0.87px] outline-offset-[-0.87px] outline-lime-800/20 inline-flex flex-col justify-start items-start gap-5">
                    <div className="self-stretch h-16 relative">
                    <div className="w-72 h-3.5 left-[20.80px] top-[20.80px] absolute">
                        <div className="left-0 top-[-1.73px] absolute justify-start text-lime-800 text-sm font-medium font-['Inter'] leading-3">Payment Method</div>
                    </div>
                    <div className="w-72 h-5 left-[20.80px] top-[39.87px] absolute">
                        <div className="left-0 top-[-1.73px] absolute justify-start text-gray-500 text-sm font-normal font-['Inter'] leading-5">Scan the QR Code to proceed.</div>
                    </div>
                    </div>
                    <div className="self-stretch h-52 px-5 flex flex-col justify-start items-start gap-3.5">
                    <div className="self-stretch h-56 px-3.5 pt-3.5 pb-px rounded-lg outline outline-[0.87px] outline-offset-[-0.87px] outline-lime-800/20 flex flex-col justify-center items-center gap-2.5">
                        <img className="w-40 h-48" src="https://placehold.co/162x192" />
                    </div>
                    <div className="self-stretch px-16 py-1.5 bg-white rounded-md outline outline-[0.87px] outline-offset-[-0.87px] outline-lime-800/30 inline-flex justify-start items-center gap-3">
                        <div className="w-4 h-4 relative overflow-hidden">
                        <div className="w-3 h-3 left-[2.86px] top-[2.86px] absolute bg-black" />
                        </div>
                        <div className="text-center justify-start text-neutral-950 text-xs font-medium font-['Inter'] leading-4">Proof of Payment</div>
                    </div>
                    </div>
            </div>
            </section>

            {/* Billing History Table */}
            <section className="w-full h-80 relative bg-white rounded-xl outline outline-[0.81px] outline-offset-[-0.81px] outline-lime-800/20">
                <div className="w-full h-3 left-[20.21px] top-[20.21px] absolute">
                <div className="left-0 top-[-1.62px] absolute justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-3">Billing History</div>
                </div>
                <div className="w-full h-5 left-[20.21px] top-[33.15px] absolute">
                <div className="left-0 top-[-1.62px] absolute justify-start text-gray-500 text-xs font-normal font-['Inter'] leading-5">Download and view your past invoices</div>
                </div>
                {/* Download All Button */}
                <div className="w-32 h-7 left-[869.74px] top-[21.83px] absolute bg-white rounded-md outline outline-[0.81px] outline-offset-[-0.81px] outline-lime-800/30">
                <div className="w-3 h-3 left-[10.51px] top-[8.09px] absolute overflow-hidden">
                <div className="w-2.5 h-[3.23px] left-[1.62px] top-[8.09px] absolute outline outline-1 outline-offset-[-0.54px] outline-neutral-950" />
                <div className="w-1.5 h-[2.70px] left-[3.77px] top-[5.39px] absolute outline outline-1 outline-offset-[-0.54px] outline-neutral-950" />
                <div className="w-0 h-1.5 left-[6.47px] top-[1.62px] absolute outline outline-1 outline-offset-[-0.54px] outline-neutral-950" />
                </div>
                <div className="left-[35.58px] top-[5.66px] absolute text-center justify-start text-neutral-950 text-xs font-medium font-['Inter'] leading-4">Download All</div>
                </div>

                {/* Table Labels*/}
                <div className="w-full h-56 left-[20.21px] top-[76.81px] absolute overflow-hidden">
                <div className="w-full h-9 left-0 top-0 absolute">
                <div className="w-full h-9 left-0 top-0 absolute border-b-[0.81px] border-lime-800/20">
                    <div className="w-full h-9 px-3 py-2.5 left-0 top-0 absolute inline-flex justify-start items-start">
                    <div className="flex-1 justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">Invoice ID</div>
                    </div>
                    <div className="w-40 h-9 px-3 py-2.5 left-[170.76px] top-0 absolute inline-flex justify-start items-start">
                    <div className="flex-1 justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">Date</div>
                    </div>
                    <div className="w-40 h-9 px-3 py-2.5 left-[328.43px] top-0 absolute inline-flex justify-start items-start">
                    <div className="flex-1 justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">Description</div>
                    </div>
                    <div className="w-32 h-9 px-3 py-2.5 left-[485.50px] top-0 absolute inline-flex justify-start items-start">
                    <div className="flex-1 justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">Amount</div>
                    </div>
                    <div className="w-36 h-9 px-3 py-2.5 left-[610.95px] top-0 absolute inline-flex justify-start items-start">
                    <div className="flex-1 justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">Status</div>
                    </div>
                    <div className="w-52 h-9 px-3 py-2.5 left-[751.02px] top-0 absolute inline-flex justify-start items-start">
                    <div className="flex-1 justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">Actions</div>
                    </div>
                </div>
                </div>

                {/* Dummy Data 1*/}
                <div className="w-[965.42px] h-48 left-0 top-[35.98px] absolute">
                <div className="w-[965.42px] h-12 left-0 top-0 absolute border-b-[0.81px] border-lime-800/10">
                    <div className="w-44 h-12 left-0 top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-4">INV-2026-03</div>
                    </div>
                    <div className="w-40 h-12 left-[170.76px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Mar 1, 2026</div>
                    </div>
                    <div className="w-40 h-12 left-[328.43px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Pro Plan</div>
                    </div>
                    <div className="w-32 h-12 left-[485.50px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">₱ 00.00</div>
                    </div>
                    <div className="w-36 h-12 left-[610.95px] top-0 absolute">
                    <div className="w-12 h-4 left-[12.94px] top-[14.15px] absolute bg-green-100 rounded-md outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 overflow-hidden">
                        <div className="w-2.5 h-2.5 left-[7.28px] top-[4.04px] absolute overflow-hidden">
                        <div className="w-2 h-2 left-[0.81px] top-[0.81px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        <div className="w-[2.43px] h-[1.62px] left-[3.64px] top-[4.04px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        </div>
                        <div className="left-[23.45px] top-[2.43px] absolute justify-start text-green-700 text-[9.70px] font-medium font-['Inter'] leading-3">Paid</div>
                    </div>
                    </div>
                    <div className="w-52 h-12 left-[751.02px] top-0 absolute">
                    <div className="w-24 h-6 left-[12.94px] top-[10.11px] absolute rounded-md">
                        <div className="w-3 h-3 left-[8.09px] top-[6.47px] absolute overflow-hidden">
                        <div className="w-2.5 h-[3.23px] left-[1.62px] top-[8.09px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-1.5 h-[2.70px] left-[3.77px] top-[5.39px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-0 h-1.5 left-[6.47px] top-[1.62px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        </div>
                        <div className="left-[28.30px] top-[4.04px] absolute text-center justify-start text-amber-400 text-xs font-medium font-['Inter'] leading-4">Download</div>
                    </div>
                    </div>
                </div>

                {/* Dummy Data 2*/}
                <div className="w-[965.42px] h-12 left-0 top-[46.09px] absolute border-b-[0.81px] border-lime-800/10">
                    <div className="w-44 h-12 left-0 top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-4">INV-2026-02</div>
                    </div>
                    <div className="w-40 h-12 left-[170.76px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Feb 1, 2026</div>
                    </div>
                    <div className="w-40 h-12 left-[328.43px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Pro Plan</div>
                    </div>
                    <div className="w-32 h-12 left-[485.50px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">₱ 00.00</div>
                    </div>
                    <div className="w-36 h-12 left-[610.95px] top-0 absolute">
                    <div className="w-12 h-4 left-[12.94px] top-[14.15px] absolute bg-green-100 rounded-md outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 overflow-hidden">
                        <div className="w-2.5 h-2.5 left-[7.28px] top-[4.04px] absolute overflow-hidden">
                        <div className="w-2 h-2 left-[0.81px] top-[0.81px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        <div className="w-[2.43px] h-[1.62px] left-[3.64px] top-[4.04px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        </div>
                        <div className="left-[23.45px] top-[2.43px] absolute justify-start text-green-700 text-[9.70px] font-medium font-['Inter'] leading-3">Paid</div>
                    </div>
                    </div>
                    <div className="w-52 h-12 left-[751.02px] top-0 absolute">
                    <div className="w-24 h-6 left-[12.94px] top-[10.11px] absolute rounded-md">
                        <div className="w-3 h-3 left-[8.09px] top-[6.47px] absolute overflow-hidden">
                        <div className="w-2.5 h-[3.23px] left-[1.62px] top-[8.09px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-1.5 h-[2.70px] left-[3.77px] top-[5.39px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-0 h-1.5 left-[6.47px] top-[1.62px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        </div>
                        <div className="left-[28.30px] top-[4.04px] absolute text-center justify-start text-amber-400 text-xs font-medium font-['Inter'] leading-4">Download</div>
                    </div>
                    </div>
                </div>

                {/* Dummy Data 3*/}
                <div className="w-[965.42px] h-12 left-0 top-[92.18px] absolute border-b-[0.81px] border-lime-800/10">
                    <div className="w-44 h-12 left-0 top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-4">INV-2026-01</div>
                    </div>
                    <div className="w-40 h-12 left-[170.76px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Jan 1, 2026</div>
                    </div>
                    <div className="w-40 h-12 left-[328.43px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Pro Plan</div>
                    </div>
                    <div className="w-32 h-12 left-[485.50px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">₱ 00.00</div>
                    </div>
                    <div className="w-36 h-12 left-[610.95px] top-0 absolute">
                    <div className="w-12 h-4 left-[12.94px] top-[14.15px] absolute bg-green-100 rounded-md outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 overflow-hidden">
                        <div className="w-2.5 h-2.5 left-[7.28px] top-[4.04px] absolute overflow-hidden">
                        <div className="w-2 h-2 left-[0.81px] top-[0.81px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        <div className="w-[2.43px] h-[1.62px] left-[3.64px] top-[4.04px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        </div>
                        <div className="left-[23.45px] top-[2.43px] absolute justify-start text-green-700 text-[9.70px] font-medium font-['Inter'] leading-3">Paid</div>
                    </div>
                    </div>
                    <div className="w-52 h-12 left-[751.02px] top-0 absolute">
                    <div className="w-24 h-6 left-[12.94px] top-[10.11px] absolute rounded-md">
                        <div className="w-3 h-3 left-[8.09px] top-[6.47px] absolute overflow-hidden">
                        <div className="w-2.5 h-[3.23px] left-[1.62px] top-[8.09px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-1.5 h-[2.70px] left-[3.77px] top-[5.39px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-0 h-1.5 left-[6.47px] top-[1.62px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        </div>
                        <div className="left-[28.30px] top-[4.04px] absolute text-center justify-start text-amber-400 text-xs font-medium font-['Inter'] leading-4">Download</div>
                    </div>
                    </div>
                </div>

                {/* Dummy Data 4*/}
                <div className="w-[965.42px] h-12 left-0 top-[138.26px] absolute border-b-[0.81px] border-lime-800/10">
                    <div className="w-44 h-12 left-0 top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-4">INV-2025-12</div>
                    </div>
                    <div className="w-40 h-12 left-[170.76px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Dec 1, 2025</div>
                    </div>
                    <div className="w-40 h-12 left-[328.43px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-normal font-['Inter'] leading-4">Pro Plan</div>
                    </div>
                    <div className="w-32 h-12 left-[485.50px] top-0 absolute">
                    <div className="left-[12.94px] top-[14.15px] absolute justify-start text-lime-800 text-xs font-semibold font-['Inter'] leading-4">₱ 00.00</div>
                    </div>
                    <div className="w-36 h-12 left-[610.95px] top-0 absolute">
                    <div className="w-12 h-4 left-[12.94px] top-[14.15px] absolute bg-green-100 rounded-md outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 overflow-hidden">
                        <div className="w-2.5 h-2.5 left-[7.28px] top-[4.04px] absolute overflow-hidden">
                        <div className="w-2 h-2 left-[0.81px] top-[0.81px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        <div className="w-[2.43px] h-[1.62px] left-[3.64px] top-[4.04px] absolute outline outline-[0.81px] outline-offset-[-0.40px] outline-green-700" />
                        </div>
                        <div className="left-[23.45px] top-[2.43px] absolute justify-start text-green-700 text-[9.70px] font-medium font-['Inter'] leading-3">Paid</div>
                    </div>
                    </div>
                    <div className="w-52 h-12 left-[751.02px] top-0 absolute">
                    <div className="w-24 h-6 left-[12.94px] top-[10.11px] absolute rounded-md">
                        <div className="w-3 h-3 left-[8.09px] top-[6.47px] absolute overflow-hidden">
                        <div className="w-2.5 h-[3.23px] left-[1.62px] top-[8.09px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-1.5 h-[2.70px] left-[3.77px] top-[5.39px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        <div className="w-0 h-1.5 left-[6.47px] top-[1.62px] absolute outline outline-1 outline-offset-[-0.54px] outline-amber-400" />
                        </div>
                        <div className="left-[28.30px] top-[4.04px] absolute text-center justify-start text-amber-400 text-xs font-medium font-['Inter'] leading-4">Download</div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </section>

            {/* Help Section */}
            <section className="w-[965.42px] h-10 relative">
            <div className="w-4 h-4 left-0 top-[1.62px] absolute overflow-hidden">
                <div className="w-3.5 h-3.5 left-[1.35px] top-[1.35px] absolute outline outline-[1.35px] outline-offset-[-0.67px] outline-blue-600" />
                <div className="w-0 h-[2.70px] left-[8.09px] top-[5.39px] absolute outline outline-[1.35px] outline-offset-[-0.67px] outline-blue-600" />
                <div className="w-[0.01px] h-0 left-[8.09px] top-[10.78px] absolute outline outline-[1.35px] outline-offset-[-0.67px] outline-blue-600" />
            </div>
            <div className="w-96 h-10 left-[25.88px] top-0 absolute inline-flex flex-col justify-start items-start gap-[3.23px]">
                <div className="self-stretch h-5 relative">
                <div className="left-0 top-[-1.62px] absolute justify-start text-blue-900 text-xs font-medium font-['Inter'] leading-5">Need help with billing?</div>
                </div>
                <div className="self-stretch h-4 inline-flex justify-start items-start">
                <div className="justify-start"><span className="text-blue-700 text-xs font-normal font-['Inter'] leading-4">Contact our support team at </span><span className="text-blue-700 text-xs font-normal font-['Inter'] underline leading-4">billing@stockify.com</span><span className="text-blue-700 text-xs font-normal font-['Inter'] leading-4">.</span></div>
                </div>
            </div>
            </section>
        </div>
      </main>
    </div>
  );
}


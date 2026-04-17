"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientSettings() {

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="dashboard" />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <NavbarClient />

          {/* TAB HEADER */}
          <section className="w-full h-12 inline-flex flex-col justify-start items-start gap-[3.23px]">
            <div className="self-stretch h-7 relative">
              <div className="left-0 top-[-1.62px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter'] leading-7">Settings</div>
            </div>
            <div className="self-stretch h-5 relative">
              <div className="left-0 top-[-1.62px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-5">Manage notification preferences</div>
            </div>
          </section>

          {/* Main Settings */}
          <section className="w-full h-96 bg-white rounded-xl outline outline-[0.81px] outline-offset-[-0.81px] outline-lime-800/20 inline-flex flex-col justify-start items-start gap-5">
            <div className="w-full h-14 px-5 pt-5 inline-flex flex-col justify-start items-start">
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-1.61px] absolute justify-start text-lime-800 text-xs font-medium font-['Inter'] leading-3">Notifications</div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[15px] absolute justify-start text-gray-500 text-xs font-normal font-['Inter'] leading-5">Choose what notifications you want to receive</div>
              </div>
            </div>
            <div className="w-full flex-1 px-5 flex flex-col justify-start items-start gap-5">
              <div className="self-stretch h-10 inline-flex justify-between items-center">
                <div className="w-60 h-10 inline-flex flex-col justify-start items-start gap-[3.23px]">
                  <div className="self-stretch h-5 inline-flex justify-start items-center gap-1.5">
                    <div className="justify-start text-neutral-950 text-xs font-medium font-['Inter'] leading-5">Notifications</div>
                  </div>
                  <div className="self-stretch h-4 inline-flex justify-start items-start">
                    <div className="justify-start text-lime-800/60 text-xs font-normal font-['Inter'] leading-4 whitespace-nowrap">Receive notifications for important updates</div>
                  </div>
                </div>
                <div className="w-6 h-3.5 pl-3 bg-gray-950 rounded-full outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 flex justify-start items-center">
                  <div className="w-3 h-3 relative bg-white rounded-full" />
                </div>
              </div>
              <div className="self-stretch h-[0.81px] relative bg-black/10" />
              <div className="self-stretch h-10 inline-flex justify-between items-center">
                <div className="w-64 h-10 inline-flex flex-col justify-start items-start gap-[3.23px]">
                  <div className="self-stretch h-5 inline-flex justify-start items-center gap-1.5">
                    <div className="justify-start text-neutral-950 text-xs font-medium font-['Inter'] leading-5">Low Stock Alerts</div>
                  </div>
                  <div className="self-stretch h-4 inline-flex justify-start items-start">
                    <div className="justify-start text-lime-800/60 text-xs font-normal font-['Inter'] leading-4 whitespace-nowrap">Get notified when inventory items are running low</div>
                  </div>
                </div>
                <div className="w-6 h-3.5 pl-3 bg-gray-950 rounded-full outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 flex justify-start items-center">
                  <div className="w-3 h-3 relative bg-white rounded-full" />
                </div>
              </div>
              <div className="self-stretch h-[0.81px] relative bg-black/10" />
              <div className="self-stretch h-10 inline-flex justify-between items-center">
                <div className="w-60 h-10 inline-flex flex-col justify-start items-start gap-[3.23px]">
                  <div className="self-stretch h-5 inline-flex justify-start items-center gap-1.5">
                    <div className="justify-start text-neutral-950 text-xs font-medium font-['Inter'] leading-5">Order Notifications</div>
                  </div>
                  <div className="self-stretch h-4 inline-flex justify-start items-start">
                    <div className="justify-start text-lime-800/60 text-xs font-normal font-['Inter'] leading-4 whitespace-nowrap">Receive alerts for new orders and order updates</div>
                  </div>
                </div>
                <div className="w-6 h-3.5 pl-3 bg-gray-950 rounded-full outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 flex justify-start items-center">
                  <div className="w-3 h-3 relative bg-white rounded-full" />
                </div>
              </div>
              <div className="self-stretch h-[0.81px] relative bg-black/10" />
              <div className="self-stretch h-10 inline-flex justify-between items-center">
                <div className="w-64 h-10 inline-flex flex-col justify-start items-start gap-[3.23px]">
                  <div className="self-stretch h-5 inline-flex justify-start items-center gap-1.5">
                    <div className="justify-start text-neutral-950 text-xs font-medium font-['Inter'] leading-5">Weekly Reports</div>
                  </div>
                  <div className="self-stretch h-4 inline-flex justify-start items-start">
                    <div className="justify-start text-lime-800/60 text-xs font-normal font-['Inter'] leading-4 whitespace-nowrap">Get a weekly summary of your business performance</div>
                  </div>
                </div>
                <div className="w-6 h-3.5 pl-3 bg-gray-950 rounded-full outline outline-[0.81px] outline-offset-[-0.81px] outline-black/0 flex justify-start items-center">
                  <div className="w-3 h-3 relative bg-white rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Help Section */}
          <section className="fixed bottom-10 left-95 w-full bg-white">
            <div className="flex items-start gap-3 px-4">

              {/* Icon */}
              <div className="w-4 h-4 relative">
                <div className="w-3.5 h-3.5 absolute left-[1.35px] top-[1.35px] outline outline-[1.35px] outline-blue-600" />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1">
                <p className="text-blue-900 text-xs font-medium">
                  Need help?
                </p>

                <p className="text-blue-700 text-xs">
                  Contact our support team at{" "}
                  <span className="underline">support@stockify.com</span>.
                </p>
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}


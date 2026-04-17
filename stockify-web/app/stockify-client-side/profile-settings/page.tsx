"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientProfileSettings() {

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
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter'] leading-7">Profile </div>
            </div>
            <div className="self-stretch h-5 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-5">Manage and update client and business information</div>
            </div>
          </section>

          {/* Business Owner Information */}
          <section className="w-full h-96 relative">
            <div className="w-full h-96 left-0 top-0 absolute bg-white rounded-2xl shadow-[3.5800905227661133px_3.5800905227661133px_20.585519790649414px_0px_rgba(0,0,0,0.25)] border-1 border-lime-900" />
            <div className="w-full h-10 left-[100.34px] top-[32.95px] absolute justify-start text-lime-950 text-4xl font-semibold font-['Inter']">Business Owner’s Information</div>
            <img className="w-16 h-14 left-[23.72px] top-[26.85px] absolute border-1 border-white/40" src="https://placehold.co/70x55" />
            <div className="w-[886.97px] h-64 left-[30.43px] top-[109.19px] absolute bg-lime-800 rounded-lg border-1 border-white/40" />
            <div className="w-80 h-8 px-4 py-2 left-[60px] top-[141px] absolute bg-white outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-80 h-8 left-0 top-0 absolute bg-neutral-50 rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Last Name *</div>
            </div>
            <div className="w-40 h-8 px-4 py-2 left-[223.63px] top-[196.90px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-40 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Gender *</div>
            </div>
            <div className="w-40 h-8 px-4 py-2 left-[223.63px] top-[255.08px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-40 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Citizenship *</div>
            </div>
            <div className="w-[485.37px] h-8 px-4 py-2 left-[398.97px] top-[255.08px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-[485.37px] h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Permanent Address *</div>
            </div>
            <div className="w-80 h-8 px-4 py-2 left-[401.52px] top-[196.90px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-80 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Email *</div>
            </div>
            <div className="w-56 h-8 px-4 py-2 left-[402.36px] top-[140.52px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-56 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">First Name *</div>
            </div>
            <div className="w-36 h-8 px-4 py-2 left-[643.78px] top-[141.41px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-36 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Middle Name *</div>
            </div>
            <div className="w-20 h-8 px-4 py-2 left-[803.88px] top-[141.41px] absolute bg-white outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-20 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Suffix</div>
            </div>
            <div className="w-40 h-8 px-4 py-2 left-[723.40px] top-[196.90px] absolute bg-amber-200/90 outline outline-1 outline-offset-[-0.90px] outline-white/40 inline-flex justify-start items-center gap-2">
              <div className="w-40 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Contact No. *</div>
            </div>
            <div className="w-32 h-32 left-[78.70px] top-[195.15px] absolute bg-white rounded-full shadow-[2.685067892074585px_2.685067892074585px_8.950225830078125px_0px_rgba(0,0,0,0.25)] border-1 border-white/40" />
            <img className="w-20 h-24 left-[101.34px] top-[214.30px] absolute border-1 border-white/40" src="https://placehold.co/85x90" />
            <img className="w-3 h-3 left-[359.84px] top-[206.03px] absolute border-1 border-white/40" src="https://placehold.co/12x12" />
            <img className="w-3 h-3 left-[359.84px] top-[265.10px] absolute border-1 border-white/40" src="https://placehold.co/12x12" />
          </section>

          {/* Business Details */}
          <section className="w-full h-[509.27px] relative">
            <div className="w-full h-[509.27px] left-0 top-0 absolute bg-white rounded-2xl shadow-[3.5800905227661133px_3.5800905227661133px_20.585519790649414px_0px_rgba(0,0,0,0.25)] border border-lime-800" />
            <div className="w-[767.98px] h-10 left-[100.20px] top-[38.24px] absolute justify-start text-lime-950 text-4xl font-semibold font-['Inter']">Business Details</div>
            <img className="w-14 h-14 left-[28.80px] top-[29.54px] absolute" src="https://placehold.co/58x58" />
            <div className="w-[886.89px] h-96 left-[30.50px] top-[112.77px] absolute bg-lime-800 rounded-lg" />
            <div className="w-[741.19px] px-4 py-2 left-[63.53px] top-[147.68px] absolute bg-lime-800 inline-flex justify-start items-center gap-2">
              <div className="w-[741.19px] h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Business Name *</div>
            </div>
            <div className="w-[823.36px] px-4 py-2 left-[63.53px] top-[204.06px] absolute bg-lime-800 inline-flex justify-start items-center gap-2">
              <div className="w-[823.36px] h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Business/Warehouse Address *</div>
            </div>
            <div className="w-80 px-4 py-2 left-[62.68px] top-[260.45px] absolute bg-lime-800 inline-flex justify-start items-center gap-2">
              <div className="w-80 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Business Contact/Tel. No. *</div>
            </div>
            <div className="w-80 px-4 py-2 left-[401.51px] top-[260.45px] absolute bg-lime-800 inline-flex justify-start items-center gap-2">
              <div className="w-80 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Business Type *</div>
            </div>
            <div className="w-3 h-3 left-[680.04px] top-[270.47px] absolute bg-lime-800" />
            <div className="w-80 px-4 py-2 left-[63.53px] top-[318.63px] absolute bg-lime-800 inline-flex justify-start items-center gap-2">
              <div className="w-80 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Upload Valid Business Permit *</div>
            </div>
            <div className="w-20 h-4 px-11 py-2.5 left-[304.95px] top-[325.79px] absolute bg-lime-800 inline-flex justify-center items-center gap-2">
              <div className="w-20 h-4 left-0 top-0 absolute bg-lime-800 rounded-3xl shadow-[1.7900452613830566px_3.5800905227661133px_3.5800905227661133px_0.8950226306915283px_rgba(0,0,0,0.16)]" />
              <div className="text-center justify-center text-amber-200 text-xs font-semibold font-['Inter']">Upload</div>
            </div>
            <div className="w-80 px-4 py-2 left-[402.36px] top-[318.63px] absolute bg-lime-800 inline-flex justify-start items-center gap-2">
              <div className="w-80 h-8 left-0 top-0 absolute bg-white rounded border-1 border-lime-800/40" />
              <div className="flex-1 justify-start text-lime-800 text-sm font-normal font-['Inter']">Upload Business Owner Valid ID *</div>
            </div>
            <div className="w-20 h-4 px-11 py-2.5 left-[634.34px] top-[325.79px] absolute bg-lime-800 inline-flex justify-center items-center gap-2">
              <div className="w-20 h-4 left-0 top-0 absolute bg-lime-800 rounded-3xl shadow-[1.7900452613830566px_3.5800905227661133px_3.5800905227661133px_0.8950226306915283px_rgba(0,0,0,0.16)]" />
              <div className="text-center justify-center text-amber-200 text-xs font-semibold font-['Inter']">Upload</div>
            </div>
            <div className="w-64 h-12 px-11 py-2.5 left-[63.53px] top-[397.39px] absolute bg-lime-800 inline-flex justify-center items-center gap-2">
              <div className="w-64 h-12 left-0 top-0 absolute bg-amber-400 rounded-3xl shadow-[1.7900452613830566px_3.5800905227661133px_3.5800905227661133px_0.8950226306915283px_rgba(0,0,0,0.16)]" />
              <div className="text-center justify-center text-lime-800 text-xl font-semibold font-['Inter']">Save Information</div>
            </div>
            <div className="w-32 h-32 left-[733.49px] top-[262.27px] absolute bg-white rounded-full shadow-[2.685067892074585px_2.685067892074585px_8.950225830078125px_0px_rgba(0,0,0,0.25)] border-1 border-lime-800/40" />
            <img className="w-20 h-20 left-[759px] top-[287.27px] absolute" src="https://placehold.co/79x79" />
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


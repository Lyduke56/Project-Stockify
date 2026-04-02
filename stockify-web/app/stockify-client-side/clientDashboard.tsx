"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavbarClient from "@/components/navbars/sidebar-client";

export default function ClientDashboard() {
  return (
    <div className="w-[1440px] h-[829px] relative bg-white overflow-hidden">
        <div className="w-[1035px] h-48 left-[332px] top-[557px] absolute bg-white rounded-xl outline outline-[0.84px] outline-offset-[-0.84px] outline-lime-800/20">
            <div className="w-[959.78px] h-12 left-[41.93px] top-[100.25px] absolute">
            <div className="w-64 h-10 left-[708.78px] top-[3.49px] absolute">
                <div className="left-0 top-0 absolute text-center justify-start text-lime-800 text-xl font-bold font-['Inter'] leading-7">$48.5K</div>
                <div className="w-16 left-0 top-[26.85px] absolute text-center justify-start text-lime-800/50 text-[10.07px] font-normal font-['Inter'] leading-3">Revenue</div>
                <div className="left-[85px] top-0 absolute text-center justify-start text-lime-800 text-xl font-bold font-['Inter'] leading-7">124</div>
                <div className="w-9 left-[85px] top-[26.85px] absolute text-center justify-start text-lime-800/50 text-[10.07px] font-normal font-['Inter'] leading-3">Orders</div>
                <div className="w-28 h-7 px-6 py-1.5 left-[133.29px] top-[6.26px] absolute inline-flex justify-center items-center gap-[5.20px]">
                <div className="w-28 h-7 left-0 top-0 absolute bg-amber-400 rounded-xl shadow-[1.0396476984024048px_2.0792953968048096px_2.0792953968048096px_0.5198238492012024px_rgba(0,0,0,0.16)]" />
                <div className="text-center justify-center text-lime-800 text-xs font-semibold font-['Inter']">Manage Shop</div>
                </div>
            </div>
            <div className="w-3.5 h-3.5 left-[80.49px] top-[31.88px] absolute overflow-hidden">
                <div className="w-3 h-2.5 left-[1.11px] top-[1.67px] absolute outline outline-1 outline-offset-[-0.56px] outline-orange-600" />
                <div className="w-0 h-0.5 left-[6.71px] top-[5.03px] absolute outline outline-1 outline-offset-[-0.56px] outline-orange-600" />
                <div className="w-[0.01px] h-0 left-[6.71px] top-[9.51px] absolute outline outline-1 outline-offset-[-0.56px] outline-orange-600" />
            </div>
            <div className="left-[97.27px] top-[29.36px] absolute justify-start text-orange-600 text-xs font-normal font-['Inter'] leading-4">12 low stock</div>
            <div className="w-16 h-4 left-0 top-[30.20px] absolute">
                <div className="w-3.5 h-3.5 left-0 top-[1.68px] absolute overflow-hidden">
                <div className="w-2.5 h-3 left-[1.68px] top-[1.12px] absolute outline outline-1 outline-offset-[-0.56px] outline-lime-800/70" />
                <div className="w-0 h-1.5 left-[6.71px] top-[6.71px] absolute outline outline-1 outline-offset-[-0.56px] outline-lime-800/70" />
                <div className="w-2.5 h-[2.80px] left-[1.84px] top-[3.92px] absolute outline outline-1 outline-offset-[-0.56px] outline-lime-800/70" />
                <div className="w-[5.03px] h-[2.88px] left-[4.20px] top-[2.39px] absolute outline outline-1 outline-offset-[-0.56px] outline-lime-800/70" />
                </div>
                <div className="left-[16.78px] top-[-0.84px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-4">245 items</div>
            </div>
            <div className="w-16 h-5 px-1.5 py-[1.68px] left-[104.61px] top-[2.52px] absolute rounded-md outline outline-[0.84px] outline-offset-[-0.84px] outline-lime-800/30 inline-flex justify-center items-center gap-[3.36px] overflow-hidden">
                <div className="justify-start text-neutral-950 text-[10.07px] font-medium font-['Inter'] leading-3">Coffee Shop</div>
            </div>
            <div className="w-20 h-6 left-[23.49px] top-0 absolute">
                <div className="left-0 top-[-0.84px] absolute justify-start text-lime-800 text-sm font-semibold font-['Inter'] leading-6">Shop Name</div>
            </div>
            <div className="w-4 h-4 left-0 top-[3.36px] absolute overflow-hidden">
                <div className="w-3.5 h-1 left-[1.40px] top-[1.40px] absolute outline outline-[1.40px] outline-offset-[-0.70px] outline-amber-400" />
                <div className="w-3 h-1.5 left-[2.80px] top-[8.39px] absolute outline outline-[1.40px] outline-offset-[-0.70px] outline-amber-400" />
                <div className="w-1 h-1 left-[6.29px] top-[11.19px] absolute outline outline-[1.40px] outline-offset-[-0.70px] outline-amber-400" />
                <div className="w-3.5 h-0 left-[1.40px] top-[4.89px] absolute outline outline-[1.40px] outline-offset-[-0.70px] outline-amber-400" />
                <div className="w-3.5 h-1 left-[1.40px] top-[4.89px] absolute outline outline-[1.40px] outline-offset-[-0.70px] outline-amber-400" />
            </div>
            </div>
            <div className="left-[20.97px] top-[37.75px] absolute justify-start text-gray-500 text-sm font-normal font-['Inter'] leading-5">Overview of your shop status</div>
            <div className="left-[20.97px] top-[19.30px] absolute justify-start text-lime-800 text-sm font-medium font-['Inter'] leading-3">Shop Status</div>
        </div>
        <div className="w-[1035px] h-32 left-[332px] top-[414px] absolute bg-orange-100 rounded-xl outline outline-[0.83px] outline-offset-[-0.83px] outline-orange-500/50">
            <div className="w-40 h-10 px-9 py-2 left-[842px] top-[49px] absolute inline-flex justify-center items-center gap-2">
            <div className="w-40 h-10 left-0 top-0 absolute bg-amber-400 rounded-2xl shadow-[1.4096916913986206px_2.819383382797241px_2.819383382797241px_0.7048458456993103px_rgba(0,0,0,0.16)]" />
            <div className="text-center justify-center text-lime-800 text-base font-semibold font-['Inter']">Renew Here</div>
            </div>
            <div className="left-[50px] top-[44px] absolute justify-start text-orange-900 text-sm font-medium font-['Inter'] leading-3">Account Alerts</div>
            <div className="w-4 h-4 left-[29px] top-[43px] absolute overflow-hidden">
            <div className="w-3.5 h-3 left-[1.38px] top-[2.07px] absolute outline outline-[1.39px] outline-offset-[-0.69px] outline-orange-600" />
            <div className="w-0 h-[2.78px] left-[8.33px] top-[6.25px] absolute outline outline-[1.39px] outline-offset-[-0.69px] outline-orange-600" />
            <div className="w-[0.01px] h-0 left-[8.33px] top-[11.81px] absolute outline outline-[1.39px] outline-offset-[-0.69px] outline-orange-600" />
            </div>
            <div className="w-80 left-[30px] top-[70px] absolute justify-start text-orange-700 text-base font-normal font-['Inter'] leading-5">10 days left before subscription expires!</div>
            <div className="w-24 h-3.5 left-[20.84px] top-[42.51px] absolute" />
        </div>
        <div className="w-72 h-40 left-[1004px] top-[231px] absolute">
            <div className="w-72 h-40 left-0 top-0 absolute bg-stone-600/0 rounded-3xl border-1 border-lime-800" />
            <div className="w-64 h-20 left-[17.99px] top-[57.22px] absolute bg-lime-950 rounded-tr-xl rounded-bl-xl rounded-br-xl" />
            <div className="w-64 h-4 left-[23.31px] top-[23.31px] absolute justify-start text-lime-800 text-sm font-bold font-['Inter']">Total Orders<br/></div>
            <div className="w-40 left-[81.20px] top-[73.50px] absolute justify-center text-amber-400 text-4xl font-bold font-['Inter']">124</div>
            <div className="w-44 h-5 left-[81.59px] top-[114.44px] absolute justify-start text-amber-400 text-xs font-semibold font-['Raleway']">+ 5% from previous month </div>
        </div>
        <div className="w-9 h-9 left-[1038px] top-[320px] absolute overflow-hidden">
            <div className="w-7 h-7 left-[1.46px] top-[2.92px] absolute bg-amber-400" />
        </div>
        <div className="w-72 h-40 left-[704px] top-[231px] absolute">
            <div className="w-72 h-40 left-0 top-0 absolute bg-stone-600/0 rounded-3xl border-1 border-lime-800" />
            <div className="w-64 h-20 left-[17.99px] top-[57.22px] absolute bg-lime-950 rounded-tr-xl rounded-bl-xl rounded-br-xl" />
            <div className="w-64 h-4 left-[23.31px] top-[23.31px] absolute justify-start text-lime-800 text-sm font-bold font-['Inter']">Monthly Revenue<br/></div>
            <div className="w-40 left-[81.20px] top-[73.50px] absolute justify-center text-amber-400 text-4xl font-bold font-['Inter']">₱48.5k</div>
            <div className="w-44 h-5 left-[81.59px] top-[114.44px] absolute justify-start text-amber-400 text-xs font-semibold font-['Raleway']">+ 8.56% from previous month </div>
        </div>
        <div className="w-9 h-9 left-[740px] top-[320px] absolute overflow-hidden">
            <div className="w-7 h-7 left-[4.38px] top-[2.92px] absolute bg-amber-400" />
        </div>
        <div className="w-72 h-40 left-[404px] top-[231px] absolute">
            <div className="w-72 h-40 left-0 top-0 absolute bg-stone-600/0 rounded-3xl border-1 border-lime-800" />
            <div className="w-64 h-20 left-[17.99px] top-[57.22px] absolute bg-lime-950 rounded-tr-xl rounded-bl-xl rounded-br-xl" />
            <div className="w-64 h-4 left-[23.31px] top-[23.31px] absolute justify-start text-lime-800 text-sm font-bold font-['Inter']">Active New Customers</div>
            <div className="w-40 left-[81.20px] top-[73.50px] absolute justify-center text-amber-400 text-4xl font-bold font-['Inter']">58</div>
            <div className="w-44 h-5 left-[81.59px] top-[114.44px] absolute justify-start text-amber-400 text-xs font-semibold font-['Raleway']">+ 10% from previous month </div>
        </div>
        <div className="w-9 h-10 left-[440px] top-[320px] absolute overflow-hidden">
            <div className="w-9 h-5 left-0 top-[10px] absolute bg-amber-400" />
        </div>
        <div className="left-[349px] top-[127px] absolute justify-start text-lime-800 text-3xl font-bold font-['Inter'] leading-8">Hello, Client!</div>
        <div className="left-[349px] top-[164.68px] absolute justify-start text-lime-800/70 text-sm font-normal font-['Inter'] leading-6">Shop Name Corporation, Inc.</div>
        <div className="w-[1060px] h-10 left-[320px] top-[19px] absolute">
            <div className="w-[1060px] h-10 left-0 top-0 absolute bg-amber-400 rounded-[40px] shadow-[2px_4px_11px_0px_rgba(0,0,0,0.25)]" />
            <img className="w-8 h-6 left-[29.34px] top-[7px] absolute" src="https://placehold.co/32x26" />
            <div className="left-[67.20px] top-[7px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter']">STOCKIFY</div>
            <img className="w-8 h-8 left-[916.14px] top-[4px] absolute" src="https://placehold.co/30x30" />
            <img className="w-8 h-8 left-[962.52px] top-[4px] absolute" src="https://placehold.co/30x30" />
            <img className="w-8 h-8 left-[1004.16px] top-[4px] absolute" src="https://placehold.co/30x30" />
            </div>
        </div>
  );
}
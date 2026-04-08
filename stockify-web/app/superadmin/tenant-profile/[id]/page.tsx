"use client";

import React, { useState } from "react";
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";

// --- STAT CARD COMPONENT ---
interface StatCardProps {
  title: string;
  value: string | number;
  trendText: string;
  className?: string;
  svgName: string;
}

function StatCard({ title, value, trendText, className = "", svgName }: StatCardProps) {
  return (
    <div className={`bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-md border-2 border-[#385E31] ${className}`}>
      <h3 className="text-[#FFFCEB] text-[18px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-3 flex-1 relative">
        <div className="flex items-center justify-center gap-3">
          <img 
            src={`/${svgName}.svg`} 
            alt={`${title} Icon`} 
            className="w-14 h-14 object-contain" 
          />
          <span className="text-[#385E31] text-[3.5rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-1 font-medium">{trendText}</p>
      </div>
    </div>
  );
}

// --- INTERACTIVE BAR CHART COMPONENT ---
function MonthlyPaymentChart() {
  const chartData = [
    { month: 'Jan', status: 'paid', amount: '₱2,725.00' },
    { month: 'Feb', status: 'paid', amount: '₱2,725.00' },
    { month: 'Mar', status: 'paid', amount: '₱2,725.00' },
    { month: 'Apr', status: 'overdue', amount: '₱2,725.00' },
    { month: 'May', status: 'paid', amount: '₱2,725.00' },
    { month: 'Jun', status: 'paid', amount: '₱2,725.00' },
    { month: 'Jul', status: 'missed', amount: '₱0.00' },
    { month: 'Aug', status: 'overdue', amount: '₱2,725.00' },
    { month: 'Sep', status: 'paid', amount: '₱2,725.00' },
    { month: 'Oct', status: 'paid', amount: '₱2,725.00' },
    { month: 'Nov', status: 'paid', amount: '₱2,725.00' },
    { month: 'Dec', status: 'paid', amount: '₱2,725.00' },
  ];

  const statusColors = {
    paid: '#385E31',      
    overdue: '#E5AD24',   
    missed: '#E91F22'     
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col mt-4">
      <h2 className="text-[26px] font-extrabold text-[#385E31] mb-6 text-center font-['Inter']">
        Monthly Payment Status
      </h2>

      <div className="relative w-full h-[320px] border-2 border-[#385E31] rounded-[10px] bg-[#FFFCEB] flex items-end px-4 pb-0 pt-12 shadow-sm">
        
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <span className="text-[11px] font-bold text-[#385E31]/60 w-16 text-right pr-3">Amount</span>
              <div className="flex-1 border-b border-[#385E31]/10"></div>
            </div>
          ))}
        </div>

        <div className="absolute top-[33%] left-16 right-4 border-b-2 border-dashed border-[#385E31]/40 z-10 pointer-events-none"></div>

        <div className="flex-1 flex justify-between h-[75%] ml-16 mr-4 z-20 gap-3">
          {chartData.map((data, index) => (
            <div 
              key={index} 
              className="relative w-full h-full flex flex-col justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-xs px-4 py-3 rounded-[8px] shadow-lg whitespace-nowrap z-30 transition-opacity flex flex-col gap-1 border border-[#F7B71D]">
                  <div className="font-bold text-[14px] text-[#F7B71D]">{data.month} 2026</div>
                  <div className="font-medium">Status: <span className="capitalize">{data.status}</span></div>
                  <div className="font-medium">Expected: {data.amount}</div>
                </div>
              )}
              
              <div 
                className="w-full h-full rounded-t-[4px] transition-all duration-300 group-hover:opacity-80 group-hover:-translate-y-1 shadow-sm"
                style={{ backgroundColor: statusColors[data.status as keyof typeof statusColors] }}
              ></div>
              
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#385E31]">
                {data.month}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-6 mt-12 text-[13px] font-bold text-[#385E31]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: statusColors.paid }}></div> Paid
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: statusColors.overdue }}></div> Overdue
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: statusColors.missed }}></div> Missed
        </div>
      </div>
    </div>
  );
}

// --- INTERACTIVE REVENUE LINE CHART COMPONENT ---
function TotalRevenueChart() {
  // Cumulative data to create the upward line chart
  const revenueData = [
    { month: 'Jan', amount: 2725, display: '₱2,725.00', status: 'paid' },
    { month: 'Feb', amount: 5450, display: '₱5,450.00', status: 'paid' },
    { month: 'Mar', amount: 8175, display: '₱8,175.00', status: 'paid' },
    { month: 'Apr', amount: 10900, display: '₱10,900.00', status: 'overdue' },
    { month: 'May', amount: 13625, display: '₱13,625.00', status: 'paid' },
    { month: 'Jun', amount: 16350, display: '₱16,350.00', status: 'paid' },
    { month: 'Jul', amount: 16350, display: '₱16,350.00', status: 'missed' },
    { month: 'Aug', amount: 19075, display: '₱19,075.00', status: 'overdue' },
    { month: 'Sep', amount: 21800, display: '₱21,800.00', status: 'paid' },
    { month: 'Oct', amount: 24525, display: '₱24,525.00', status: 'paid' },
    { month: 'Nov', amount: 27250, display: '₱27,250.00', status: 'paid' },
    { month: 'Dec', amount: 29975, display: '₱29,975.00', status: 'paid' },
  ];

  const maxAmount = 30000;
  
  const statusColors = {
    paid: '#385E31',      
    overdue: '#E5AD24',   
    missed: '#E91F22'     
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Map data to SVG viewBox coordinates (0 to 100)
  const polylinePoints = revenueData.map((data, index) => {
    const x = (index / (revenueData.length - 1)) * 100;
    const y = 100 - (data.amount / maxAmount) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full flex flex-col mt-5">
      <h2 className="text-[26px] font-extrabold text-[#385E31] mb-6 text-center font-['Inter']">
        Total Revenue
      </h2>

      <div className="relative w-full h-[320px] border-2 border-[#385E31] rounded-[10px] bg-[#FFFCEB] flex shadow-sm">
        
        {/* Background Y-Axis Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <span className="text-[11px] font-bold text-[#385E31]/60 w-16 text-right pr-3">Amount</span>
              <div className="flex-1 border-b border-[#385E31]/10"></div>
            </div>
          ))}
        </div>

        {/* Chart Drawing Area */}
        <div className="absolute left-16 right-8 top-10 bottom-10 z-10">
          {/* Connecting Line */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline 
              points={polylinePoints} 
              fill="none" 
              stroke="#E5AD24" 
              strokeWidth="3" 
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Interactive Diamonds & Tooltips */}
          {revenueData.map((data, index) => {
            const xPos = (index / (revenueData.length - 1)) * 100;
            const yPos = 100 - (data.amount / maxAmount) * 100;

            return (
              <div 
                key={index}
                className="absolute w-4 h-4 cursor-pointer group"
                style={{ 
                  left: `${xPos}%`, 
                  top: `${yPos}%`, 
                  transform: 'translate(-50%, -50%)' 
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {hoveredIndex === index && (
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-xs px-4 py-3 rounded-[8px] shadow-lg whitespace-nowrap z-30 transition-opacity flex flex-col gap-1 border border-[#F7B71D]">
                    <div className="font-bold text-[14px] text-[#F7B71D]">{data.month} 2026</div>
                    <div className="font-medium">Status: <span className="capitalize">{data.status}</span></div>
                    <div className="font-medium">Total: {data.display}</div>
                  </div>
                )}

                {/* Diamond Point */}
                <div 
                  className="w-full h-full rotate-45 border-[1.5px] border-white shadow-sm transition-transform duration-200 group-hover:scale-125"
                  style={{ backgroundColor: statusColors[data.status as keyof typeof statusColors] }}
                ></div>

                {/* X-Axis Label */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#385E31]">
                  {data.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-end gap-6 mt-12 text-[13px] font-bold text-[#385E31]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: statusColors.paid }}></div> Paid
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: statusColors.overdue }}></div> Overdue
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: statusColors.missed }}></div> Missed
        </div>
      </div>
    </div>
  );
}

// --- PAYMENT LOG TABLE COMPONENT ---
function PaymentLogTable() {
  const logData = [
    { id: 1, date: "09/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card" },
    { id: 2, date: "08/01/2026", amount: "₱2,725.00", status: "Late", notes: "Paid 5 days after due date" },
    { id: 3, date: "07/01/2026", amount: "₱0.00", status: "Missed", notes: "Payment failed, card declined" },
    { id: 4, date: "06/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card" },
    { id: 5, date: "05/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card" },
    { id: 6, date: "04/01/2026", amount: "₱2,725.00", status: "Late", notes: "Manual transfer received late" },
    { id: 7, date: "03/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card" },
    { id: 8, date: "02/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card" },
  ];

  const getPillStyles = (status: string) => {
    switch (status) {
      case 'On Time':
      case 'Active':
        return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
      case 'Late':
        return { bg: 'bg-[#FFD980]', text: 'text-[#385E31]' }; 
      case 'Missed':
        return { bg: 'bg-[#E91F22]', text: 'text-[#FFFCEB]' }; 
      default:
        return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
    }
  };

  return (
    <div className="w-full flex flex-col mt-5 mb-5">
      <h2 className="text-[26px] font-extrabold text-[#385E31] mb-6 text-center font-['Inter']">
        Payment Log
      </h2>

      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
        
        {/* Table Header */}
        <div className="w-full flex bg-[#385E31] px-6 py-4">
          <div className="flex-1 text-left text-[#FFFCEB] text-[15px] font-bold">Date</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Amount</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Status</div>
          <div className="flex-[1.5] text-left text-[#FFFCEB] text-[15px] font-bold pl-8">Notes</div>
        </div>

        {/* Table Rows */}
        <div className="flex flex-col w-full">
          {logData.map((row, idx) => {
            const { bg, text } = getPillStyles(row.status);
            const isLast = idx === logData.length - 1;
            
            return (
              <div key={row.id} className={`w-full flex px-6 py-[16px] items-center ${!isLast ? 'border-b border-[#385E31]/20' : ''}`}>
                <div className="flex-1 text-left text-[#3A6131] text-[13px] font-bold">{row.date}</div>
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.amount}</div>
                
                {/* Status Pill */}
                <div className="flex-1 flex justify-center items-center">
                  <div className={`w-[90px] py-[4px] rounded-[40px] flex justify-center items-center ${bg}`}>
                    <span className={`${text} text-[11px] font-bold leading-none`}>{row.status}</span>
                  </div>
                </div>

                <div className="flex-[1.5] text-left text-[#3A6131] text-[13px] font-medium pl-8">{row.notes}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load More Button */}
      <div className="w-full flex justify-end mt-6">
        <button className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold font-['Inter'] px-10 py-3 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function TenantPaymentHistory() {
  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <Sidebar />

      {/* RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12">
        
        <NavbarApp />

        <div className="w-full flex flex-col items-center mt-10 mb-8 gap-8 max-w-[1060px] mx-auto">
          
          {/* GREEN HEADER */}
          <div className="w-[1060px] h-50 p-12 bg-[#385E31] rounded-[10px] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] inline-flex flex-col justify-center items-start gap-2.5">
            <div className="self-stretch h-36 inline-flex justify-start items-center gap-10">
              <div data-image-upload-box="WithoutPicture(Store)" className="w-36 h-36 relative">
                <div className="w-36 h-36 left-0 top-0 absolute bg-[#FFD980] rounded-[5px] border border-lime-800/40" />
                
                {/* YELLOW BOX WITH SVG */}
                <div className="w-32 h-32 left-[7.50px] top-[6.75px] absolute overflow-hidden flex items-center justify-center">
                  <img 
                    src="/business-details.svg" 
                    alt="Business Details" 
                    className="w-30 h-30 object-contain" 
                  />
                </div>

              </div>
              <div className="flex-1 inline-flex flex-col justify-start items-start gap-7">
                <div className="self-stretch justify-center text-orange-100 text-4xl font-bold font-['Inter']">Tech IT Hub  |  Payment History</div>
                <div className="self-stretch flex flex-col justify-start items-start gap-5">
                  <div className="self-stretch justify-center text-orange-100 text-xl font-semibold font-['Inter'] leading-4 tracking-tight">Owner: Benideck Longakit</div>
                  <div className="self-stretch justify-center text-orange-100 text-xl font-semibold font-['Inter'] leading-4 tracking-tight">Date Registered: 02/21/2026</div>
                </div>
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Paid" 
              value="32.7k" 
              trendText="4 of 12 months" 
              svgName="SA-rev-stat" 
            />
            <StatCard 
              title="Late Payments" 
              value="12" 
              trendText="Avg. 24.8 days late" 
              svgName="SA-late-payments" 
            />
            <StatCard 
              title="Missed Payments" 
              value="3" 
              trendText="As of September 2026" 
              svgName="SA-missed-payments" 
            />
          </div>

          {/* INTERACTIVE BAR CHART */}
          <MonthlyPaymentChart />

          {/* NEW: INTERACTIVE LINE CHART */}
          <TotalRevenueChart />

          {/* NEW: PAYMENT LOG TABLE */}
          <PaymentLogTable />
          
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title:     string;
  value:     string | number;
  trendText: string;
  svgName:   string;
}

function StatCard({ title, value, trendText, svgName }: StatCardProps) {
  return (
    <div className="bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-sm border border-[#385E31]">
      <h3 className="text-[#FFFCEB] text-[14px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-4 flex-1">
        <div className="flex items-center justify-center gap-3">
          <img
            src={`/${svgName}.svg`}
            alt={title}
            className="w-10 h-10 object-contain"
          />
          <span className="text-[#385E31] text-[2.6rem] font-black leading-none">
            {value}
          </span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-2 font-medium">{trendText}</p>
      </div>
    </div>
  );
}

// ── Monthly Payment Chart ─────────────────────────────────────────────────────

function MonthlyPaymentChart() {
  const chartData = [
    { month: "Jan", status: "paid",    amount: "₱2,725.00" },
    { month: "Feb", status: "paid",    amount: "₱2,725.00" },
    { month: "Mar", status: "paid",    amount: "₱2,725.00" },
    { month: "Apr", status: "overdue", amount: "₱2,725.00" },
    { month: "May", status: "paid",    amount: "₱2,725.00" },
    { month: "Jun", status: "paid",    amount: "₱2,725.00" },
    { month: "Jul", status: "missed",  amount: "₱0.00"     },
    { month: "Aug", status: "overdue", amount: "₱2,725.00" },
    { month: "Sep", status: "paid",    amount: "₱2,725.00" },
    { month: "Oct", status: "paid",    amount: "₱2,725.00" },
    { month: "Nov", status: "paid",    amount: "₱2,725.00" },
    { month: "Dec", status: "paid",    amount: "₱2,725.00" },
  ];
  const statusColors = { paid: "#385E31", overdue: "#E5AD24", missed: "#E91F22" };
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col mt-1">
      <h2 className="text-[16px] font-extrabold text-[#385E31] mb-3 text-center">
        Monthly Payment Status
      </h2>
      <div className="relative w-full h-[200px] border border-[#385E31] rounded-[8px] bg-[#FFFCEB] flex items-end px-3 pb-0 pt-6 shadow-sm">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <div className="flex-1 border-b border-[#385E31]/10 ml-2" />
            </div>
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex justify-between h-[80%] z-20 gap-1">
          {chartData.map((data, index) => (
            <div
              key={index}
              className="relative w-full h-full flex flex-col justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-[10px] px-2.5 py-1.5 rounded-[6px] shadow-lg whitespace-nowrap z-30 flex flex-col gap-0.5 border border-[#F7B71D]">
                  <div className="font-bold text-[11px] text-[#F7B71D]">{data.month} 2026</div>
                  <div className="font-medium capitalize">{data.status}</div>
                  <div className="font-medium">{data.amount}</div>
                </div>
              )}
              <div
                className="w-full h-full rounded-t-[3px] transition-all duration-300 group-hover:opacity-80 group-hover:-translate-y-0.5 shadow-sm"
                style={{ backgroundColor: statusColors[data.status as keyof typeof statusColors] }}
              />
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#385E31]">
                {data.month}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-end gap-4 mt-7 text-[11px] font-bold text-[#385E31]">
        {Object.entries(statusColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Total Revenue Chart ───────────────────────────────────────────────────────

function TotalRevenueChart() {
  const revenueData = [
    { month: "Jan", amount: 2725,  display: "₱2,725.00",  status: "paid"    },
    { month: "Feb", amount: 5450,  display: "₱5,450.00",  status: "paid"    },
    { month: "Mar", amount: 8175,  display: "₱8,175.00",  status: "paid"    },
    { month: "Apr", amount: 10900, display: "₱10,900.00", status: "overdue" },
    { month: "May", amount: 13625, display: "₱13,625.00", status: "paid"    },
    { month: "Jun", amount: 16350, display: "₱16,350.00", status: "paid"    },
    { month: "Jul", amount: 16350, display: "₱16,350.00", status: "missed"  },
    { month: "Aug", amount: 19075, display: "₱19,075.00", status: "overdue" },
    { month: "Sep", amount: 21800, display: "₱21,800.00", status: "paid"    },
    { month: "Oct", amount: 24525, display: "₱24,525.00", status: "paid"    },
    { month: "Nov", amount: 27250, display: "₱27,250.00", status: "paid"    },
    { month: "Dec", amount: 29975, display: "₱29,975.00", status: "paid"    },
  ];
  const maxAmount = 30000;
  const statusColors = { paid: "#385E31", overdue: "#E5AD24", missed: "#E91F22" };
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const polylinePoints = revenueData
    .map((d, i) => `${(i / (revenueData.length - 1)) * 100},${100 - (d.amount / maxAmount) * 100}`)
    .join(" ");

  return (
    <div className="w-full flex flex-col mt-2">
      <h2 className="text-[16px] font-extrabold text-[#385E31] mb-3 text-center">
        Total Revenue
      </h2>
      <div className="relative w-full h-[200px] border border-[#385E31] rounded-[8px] bg-[#FFFCEB] flex shadow-sm">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <div className="flex-1 border-b border-[#385E31]/10 ml-2" />
            </div>
          ))}
        </div>
        {/* Line chart */}
        <div className="absolute left-4 right-4 top-6 bottom-6 z-10">
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#E5AD24"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {revenueData.map((data, index) => {
            const xPos = (index / (revenueData.length - 1)) * 100;
            const yPos = 100 - (data.amount / maxAmount) * 100;
            return (
              <div
                key={index}
                className="absolute w-3 h-3 cursor-pointer group"
                style={{
                  left:      `${xPos}%`,
                  top:       `${yPos}%`,
                  transform: "translate(-50%,-50%)",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {hoveredIndex === index && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-[10px] px-2.5 py-1.5 rounded-[6px] shadow-lg whitespace-nowrap z-30 flex flex-col gap-0.5 border border-[#F7B71D]">
                    <div className="font-bold text-[11px] text-[#F7B71D]">{data.month} 2026</div>
                    <div className="font-medium capitalize">{data.status}</div>
                    <div className="font-medium">Total: {data.display}</div>
                  </div>
                )}
                <div
                  className="w-full h-full rotate-45 border border-white shadow-sm transition-transform duration-200 group-hover:scale-125"
                  style={{ backgroundColor: statusColors[data.status as keyof typeof statusColors] }}
                />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#385E31]">
                  {data.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-end gap-4 mt-7 text-[11px] font-bold text-[#385E31]">
        {Object.entries(statusColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment Log Table ─────────────────────────────────────────────────────────

function PaymentLogTable() {
  const logData = [
    { id: 1, date: "09/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card"   },
    { id: 2, date: "08/01/2026", amount: "₱2,725.00", status: "Late",    notes: "Paid 5 days after due date"     },
    { id: 3, date: "07/01/2026", amount: "₱0.00",      status: "Missed",  notes: "Payment failed, card declined"  },
    { id: 4, date: "06/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card"   },
    { id: 5, date: "05/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card"   },
  ];

  const getPill = (status: string) => {
    switch (status) {
      case "On Time": return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
      case "Late":    return { bg: "bg-[#FFD980]",  text: "text-[#385E31]" };
      case "Missed":  return { bg: "bg-[#E91F22]",  text: "text-[#FFFCEB]" };
      default:        return { bg: "bg-[#385E31]",  text: "text-[#FFFCEB]" };
    }
  };

  return (
    <div className="w-full flex flex-col mt-2 mb-2">
      <h2 className="text-[16px] font-extrabold text-[#385E31] mb-3 text-center">
        Payment Log
      </h2>
      <div className="w-full bg-[#FFFCEB] rounded-[8px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-2.5">
          <div className="flex-1      text-left   text-[#FFFCEB] text-[12px] font-bold">Date</div>
          <div className="flex-1      text-center text-[#FFFCEB] text-[12px] font-bold">Amount</div>
          <div className="flex-1      text-center text-[#FFFCEB] text-[12px] font-bold">Status</div>
          <div className="flex-[1.5] text-left   text-[#FFFCEB] text-[12px] font-bold pl-5">Notes</div>
        </div>
        {/* Rows */}
        {logData.map((row, idx) => {
          const { bg, text } = getPill(row.status);
          return (
            <div
              key={row.id}
              className={`w-full flex px-4 py-2.5 items-center ${
                idx < logData.length - 1 ? "border-b border-[#385E31]/20" : ""
              }`}
            >
              <div className="flex-1      text-left   text-[#3A6131] text-[11px] font-bold">{row.date}</div>
              <div className="flex-1      text-center text-[#3A6131] text-[11px] font-bold">{row.amount}</div>
              <div className="flex-1      flex justify-center">
                <div className={`w-[72px] py-0.5 rounded-[40px] flex justify-center items-center ${bg}`}>
                  <span className={`${text} text-[9px] font-bold`}>{row.status}</span>
                </div>
              </div>
              <div className="flex-[1.5] text-left   text-[#3A6131] text-[11px] font-medium pl-5">{row.notes}</div>
            </div>
          );
        })}
      </div>
      <div className="w-full flex justify-end mt-3">
        <button className="bg-[#F7B71D] text-[#385E31] text-[12px] font-bold px-7 py-1.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PaymentHistoryTab() {
  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Paid"      value="32.7k" trendText="10 of 12 months"     svgName="SA-rev-stat"        />
        <StatCard title="Late Payments"   value="2"     trendText="Avg. 5 days late"     svgName="SA-late-payments"   />
        <StatCard title="Missed Payments" value="1"     trendText="As of September 2026" svgName="SA-missed-payments" />
      </div>

      {/* Charts */}
      <MonthlyPaymentChart />
      <TotalRevenueChart />

      {/* Payment Log */}
      <PaymentLogTable />
    </div>
  );
}
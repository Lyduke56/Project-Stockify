"use client";

import StatCard from "@/components/cards/stat-cards";
import { useState, useMemo } from "react";
import SalesForecastCard from "@/components/cards/employee/sales-forecast-card";
import { Search, Calendar, ChevronDown } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Beverages", "Food"];
const ITEMS: Record<string, string[]> = {
  All: ["All Items", "Americano", "Latte", "Croissant", "Tote Bag"],
  Beverages: ["All Beverages", "Americano", "Latte", "Cappuccino"],
  Food: ["All Food", "Croissant", "Sandwich", "Muffin"],
};

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ cod, qr }: { cod: number; qr: number }) {
  const total = 124500;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const codDash = (cod / 100) * circumference;
  const qrDash = (qr / 100) * circumference;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#F7B71D" strokeWidth="24"
        strokeDasharray={`${qrDash} ${circumference - qrDash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#385E31" strokeWidth="24"
        strokeDasharray={`${codDash} ${circumference - codDash}`}
        strokeDashoffset={-qrDash}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#385E31" fontSize="9" fontWeight="700">TOTAL STOCK</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#385E31" fontSize="12" fontWeight="800">₱{total.toLocaleString()}</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsReportsSection() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [category, setCategory] = useState("All");
  const [item, setItem] = useState("All Items");
  const [showValuation, setShowValuation] = useState(false);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setItem(ITEMS[val]?.[0] ?? "All Items");
  };

  return (
    <div className="w-full flex flex-col font-['Inter'] gap-8 pb-12">
      
      {/* ── Header ── */}
      <div className="w-full flex flex-col items-center mt-2">
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          Analytics & Orders
        </h1>
        <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
      </div>

      {/* ── Filter Bar (Styled like Orders Search Bar) ── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          {/* Date Range Picker Style */}
          <div className="relative min-w-[220px]">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-full border-2 border-[#385E31] bg-transparent text-[#385E31] font-bold text-sm outline-none cursor-pointer"
            >
              {["Last 7 Days", "Last 30 Days", "Last 90 Days", "Custom Range"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Calendar className="absolute left-4 top-2.5 text-[#385E31]" size={18} />
            <ChevronDown className="absolute right-4 top-3 text-[#385E31] pointer-events-none" size={14} />
          </div>

          {/* Item Filter Style */}
          <div className="relative min-w-[200px]">
            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-full border-2 border-[#385E31] bg-transparent text-[#385E31] font-bold text-sm outline-none cursor-pointer"
            >
              {ITEMS[category].map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <Search className="absolute left-4 top-2.5 text-[#385E31]" size={18} />
            <ChevronDown className="absolute right-4 top-3 text-[#385E31] pointer-events-none" size={14} />
          </div>

          {/* Category Quick Filter */}
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                  category === cat 
                    ? "bg-[#385E31] text-white border-[#385E31]" 
                    : "bg-white text-[#385E31] border-[#385E31]/20 hover:border-[#385E31]"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => alert("Exporting data…")}
          className="bg-[#F7B71D] text-[#385E31] font-extrabold text-sm px-8 py-2.5 rounded-full shadow-sm hover:brightness-95 transition-all"
        >
          EXPORT CSV
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Revenue" value="₱ 32k" trendText="Total revenue this month" className="w-full" svgName="employee-icons/piggybank" />
          <StatCard title="Total Orders" value="395" trendText="Orders processed today" className="w-full" svgName="employee-icons/orders" />
          <StatCard title="Top Selling Product" value="Coffee" trendText="Highest volume item" className="w-full" svgName="employee-icons/topseller" />
      </div>  

      {/* ── Revenue Table (Replaced with SalesForecastCard) ── */}
      <SalesForecastCard className="w-full" />

      {/* ── Bottom Row ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-center bg-[#FFFCEB] p-8 rounded-[20px] border-2 border-[#385E31]/10">
        
        {/* Donut Chart Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
          <DonutChart cod={60} qr={40} />
          <div className="flex flex-col gap-4">
            <h3 className="text-[#385E31] text-sm font-black uppercase tracking-widest">
              Payment Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-[#385E31]" />
                <span className="text-sm font-bold text-[#385E31]">Cash on Delivery</span>
                <span className="ml-auto text-[#385E31] font-black">60%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-[#F7B71D]" />
                <span className="text-sm font-bold text-[#385E31]">QR Code (G-Cash)</span>
                <span className="ml-auto text-[#385E31] font-black">40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="w-full lg:w-auto flex flex-col gap-3">
          <button
            onClick={() => setShowValuation(true)}
            className="w-full lg:min-w-[280px] bg-[#385E31] text-white font-black text-xs px-8 py-4 rounded-full border-2 border-[#385E31] shadow-md hover:scale-[1.02] transition-transform uppercase tracking-widest"
          >
            Inventory Valuation Report
          </button>
          <button
            className="w-full lg:min-w-[280px] bg-[#F7B71D] text-[#385E31] font-black text-xs px-8 py-4 rounded-full border-2 border-[#385E31] shadow-md hover:scale-[1.02] transition-transform uppercase tracking-widest"
          >
            Download Monthly Audit
          </button>
        </div>
      </div>

      {/* ── Valuation Modal ── */}
      {showValuation && (
        <div className="fixed inset-0 bg-[#385E31]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FEFCE8] rounded-[20px] p-8 max-w-md w-full shadow-2xl border-2 border-[#385E31]">
            <h3 className="text-[#385E31] text-xl font-black mb-6 uppercase tracking-tight">Inventory Valuation</h3>
            <div className="space-y-4">
              {/* Table Body */}
              {[
                { name: "Americano", stock: 320, value: 48000 },
                { name: "Latte", stock: 210, value: 37800 },
                { name: "Croissant", stock: 140, value: 21000 },
              ].map((row) => (
                <div key={row.name} className="flex justify-between items-center border-b border-[#385E31]/10 pb-2">
                  <div>
                    <p className="text-sm font-bold text-[#385E31]">{row.name}</p>
                    <p className="text-[10px] text-[#385E31]/60 font-bold uppercase">{row.stock} units in stock</p>
                  </div>
                  <p className="text-sm font-black text-[#385E31]">₱{row.value.toLocaleString()}</p>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4">
                <p className="text-base font-black text-[#385E31]">GRAND TOTAL</p>
                <p className="text-lg font-black text-[#F7B71D] bg-[#385E31] px-4 py-1 rounded-lg">₱135,200</p>
              </div>
            </div>
            <button
              onClick={() => setShowValuation(false)}
              className="mt-8 w-full bg-[#385E31] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all uppercase text-xs tracking-widest"
            >
              Close Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── MOCK DATA FOR DEMO ──────────────────────────────────────────────────────

const mainChartData = [
  { month: "Feb 2026", revenue: 35000, isForecast: false },
  { month: "Mar 2026", revenue: 42000, isForecast: false },
  { month: "Apr 2026", revenue: 45000, isForecast: false },
  { month: "May 2026", revenue: 46500, forecast: 46500, upper: 49000 },
  { month: "Jun 2026", revenue: 48000, forecast: 48000, upper: 51000 },
  { month: "Jul 2026", revenue: 50500, forecast: 50500, upper: 54000 },
];

const weeklyData = [
  { week: "Week 1", actual: 8800, forecast: 9200 },
  { week: "Week 2", actual: null, forecast: 9400 },
  { week: "Week 3", actual: null, forecast: 9100 },
  { week: "Week 4", actual: null, forecast: 9600 },
];

const categoryData = [
  { category: "Coffee", historical: 15000, forecast: 16500 },
  { category: "Pastries", historical: 8000, forecast: 9200 },
  { category: "Sandwiches", historical: 12000, forecast: 12500 },
  { category: "Beverages", historical: 5000, forecast: 5500 },
  { category: "Merchandise", historical: 2000, forecast: 2200 },
];

const topProducts = [
  { rank: 1, name: "Cappuccino", units: 1850, revenue: 9250, growth: "+8.5%" },
  { rank: 2, name: "Latte", units: 1620, revenue: 8910, growth: "+6.2%" },
  { rank: 3, name: "Croissant", units: 980, revenue: 3920, growth: "+5.1%" },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function SalesForecastDashboard() {
  return (
    <div className="min-h-screen bg-[#F4F1E1] p-6 lg:p-8 font-['Inter'] text-[#2D2D2D]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#385E31]">Sales Forecast & Projections</h1>
          <p className="text-sm text-gray-600">AI-powered predictions based on 3-month historical data</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none shadow-sm">
            <option>All Categories</option>
            <option>Coffee</option>
            <option>Pastries</option>
          </select>
          <button className="bg-white border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#EFE8C9] border border-[#DCD3A9] rounded-xl p-5 shadow-sm relative overflow-hidden">
          <p className="text-xs font-semibold text-gray-600 mb-2">Next Quarter Revenue</p>
          <h2 className="text-3xl font-bold text-[#385E31] mb-1">$132.1k</h2>
          <p className="text-sm font-medium text-[#385E31]">↗ +16.7%</p>
          <span className="absolute right-4 bottom-4 text-5xl text-[#DCD3A9] opacity-50 font-serif">$</span>
        </div>
        
        {/* standard cards */}
        {[
          { title: "Projected Orders", value: "9k", trend: "↗ +6.8%", icon: "🛒" },
          { title: "Avg Order Value", value: "$15.55", trend: "↗ +2.3%", icon: "🎯" },
          { title: "Forecast Accuracy", value: "94.2%", trend: "High confidence", icon: "📊", trendColor: "text-gray-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-white/50 relative overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 mb-2">{stat.title}</p>
            <h2 className="text-3xl font-bold text-[#2D2D2D] mb-1">{stat.value}</h2>
            <p className={`text-sm font-medium ${stat.trendColor || 'text-[#385E31]'}`}>{stat.trend}</p>
            <span className="absolute right-4 bottom-4 text-4xl opacity-20 grayscale">{stat.icon}</span>
          </div>
        ))}
      </div>

      {/* MAIN CHART */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-[#2D2D2D]">Revenue Forecast Analysis</h3>
            <p className="text-sm text-gray-500">Historical performance vs. projected revenue with confidence intervals</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-medium">
            <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-white hover:shadow-sm">Weekly</button>
            <button className="px-3 py-1 rounded-md bg-white shadow-sm text-[#2D2D2D]">3 Months</button>
            <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-white hover:shadow-sm">6 Months</button>
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mainChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} 
                />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              {/* Historical Line */}
              <Line type="monotone" dataKey="revenue" stroke="#385E31" strokeWidth={3} dot={{ r: 4, fill: "#385E31" }} name="Revenue" />
              {/* Upper Confidence Line (Dashed) */}
              <Line type="monotone" dataKey="upper" stroke="#F7B71D" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Upper Confidence" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Weekly Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#2D2D2D] text-sm mb-1">Weekly Performance</h3>
          <p className="text-xs text-gray-500 mb-6">Actual vs. forecasted weekly revenue</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={10} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="actual" fill="#385E31" name="Actual" radius={[2, 2, 0, 0]} maxBarSize={40} />
                <Bar dataKey="forecast" fill="#F7B71D" name="Forecast" radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#2D2D2D] text-sm mb-1">Category Performance</h3>
          <p className="text-xs text-gray-500 mb-6">Forecast by product category</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="historical" fill="#385E31" name="Historical" radius={[0, 2, 2, 0]} barSize={8} />
                <Bar dataKey="forecast" fill="#F7B71D" name="Forecast" radius={[0, 2, 2, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Forecast */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#2D2D2D] text-sm mb-1">Top Products Forecast</h3>
          <p className="text-xs text-gray-500 mb-4">Projected best sellers for next month</p>
          <div className="flex flex-col gap-3">
            {topProducts.map((prod) => (
              <div key={prod.rank} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F4F1E1] text-[#AFA04A] flex items-center justify-center font-bold text-sm">
                    {prod.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#2D2D2D]">{prod.name}</p>
                    <p className="text-xs text-gray-500">{prod.units} units • ${prod.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-[#385E31]">↗ {prod.growth}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-[#2D2D2D] text-sm mb-1">AI-Generated Insights</h3>
            <p className="text-xs text-gray-500">Actionable recommendations based on forecast</p>
          </div>
          
          <div className="bg-[#F0F7F0] border border-[#D5EAD5] rounded-lg p-4">
            <h4 className="flex items-center gap-2 font-semibold text-[#385E31] text-sm mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Strong Growth Trajectory
            </h4>
            <p className="text-xs text-[#4A7842] leading-relaxed">Revenue projected to increase 7.2% over the next quarter based on current trends.</p>
          </div>

          <div className="bg-[#FFF4ED] border border-[#FFDCC4] rounded-lg p-4">
            <h4 className="flex items-center gap-2 font-semibold text-[#C05621] text-sm mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Weekend Sales Spike
            </h4>
            <p className="text-xs text-[#9C4221] leading-relaxed">Weekend sales are 35% higher than weekdays. Consider increasing inventory for Fri-Sun.</p>
          </div>
        </div>
      </div>

      {/* SUMMARY FOOTER */}
      <div className="bg-[#EFE8C9] border border-[#DCD3A9] rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#385E31] mb-4">Forecast Summary & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="flex items-center gap-2 font-bold text-[#AFA04A] text-sm mb-2">
              📅 Planning Horizon
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">The next 3 months show steady growth. Plan inventory increases of 7-10% month-over-month to meet demand.</p>
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-bold text-[#AFA04A] text-sm mb-2">
              📦 Inventory Action
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">Focus restocking on Coffee and Pastries categories. These show highest growth potential at 7.0% and 6.5% respectively.</p>
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-bold text-[#AFA04A] text-sm mb-2">
              📈 Revenue Goal
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">Target $48k in revenue by July 2026. Current trajectory indicates 94% probability of achieving this goal.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
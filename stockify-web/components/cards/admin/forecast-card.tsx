"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import type { ClientDashboardStats } from "@/lib/client/dashboard-stats";

interface SalesForecastDashboardProps {
  data: ClientDashboardStats;
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
  };
}

// Matching your exact dashboard layout utility format
const formatCurrency = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

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

export default function SalesForecastDashboard({ data, colors }: SalesForecastDashboardProps) {
  // 🔴 DEMO TOGGLE: Change this to 'true' to show charts, or 'false' to mock the locked state
  const hasEnoughData = true; 

  const primary = colors?.color_primary ?? "#385E31";
  const secondary = colors?.color_secondary ?? "#2A4725";
  const accent = colors?.color_accent ?? "#F7B71D";
  const background = colors?.color_background ?? "#FFFCEB";

  return (
    <div className="flex-1 flex flex-col h-full w-full font-['Inter']">
      
      {/* Header — Mirrors dashboard-home style */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mb-8 gap-2"
      >
        <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase text-center mt-5" style={{ color: primary }}>
          Sales Forecast & Projections
        </h1>
        <div className="w-full max-w-[900px] h-1.5 rounded-full" style={{ backgroundColor: accent }} />
        <p className="text-sm text-gray-600 text-center mt-1">AI-powered predictions based on 3-month historical data</p>
      </motion.div>

      {hasEnoughData ? (
        <div className="flex flex-col w-full">
          
          {/* KPI Cards — Matches background layout tints of dashboard metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            
            {[
              { title: "Next Quarter Revenue", value: "₱132.1k", trend: "↗ +16.7%", icon: "₱" },
              { title: "Projected Orders", value: "₱132.1k", trend: "↗ +6.8%", icon: "🛒" },
              { title: "Avg Order Value", value: "₱15.55", trend: "↗ +2.3%", icon: "🎯" },
              { title: "Forecast Accuracy", value: "94.2%", trend: "High confidence", icon: "📊", trendColor: "text-gray-500" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 + i * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 relative overflow-hidden"
              >
                <p className="text-xs font-semibold text-gray-500 mb-2">{stat.title}</p>
                <h2 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h2>
                <p className={`text-sm font-medium ${stat.trendColor || ''}`} style={!stat.trendColor ? { color: primary } : {}}>{stat.trend}</p>
                <span className="absolute right-4 bottom-4 text-4xl opacity-20 grayscale select-none pointer-events-none">{stat.icon}</span>
              </motion.div>
            ))}
          </div>

          {/* MAIN GRAPH FRAME */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.65 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="font-bold text-gray-800">Revenue Forecast Analysis</h3>
                <p className="text-sm text-gray-500">Historical performance vs. projected revenue with confidence intervals</p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-medium">
                <button className="px-3 py-1 rounded-md text-gray-500 hover:bg-white hover:shadow-sm">Weekly</button>
                <button className="px-3 py-1 rounded-md bg-white shadow-sm text-gray-800">3 Months</button>
                <button className="px-3 py-1 rounded-md text-gray-500 hover:bg-white hover:shadow-sm">6 Months</button>
              </div>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mainChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
                  <YAxis tickFormatter={(val) => `₱${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="revenue" stroke={primary} strokeWidth={3} dot={{ r: 4, fill: primary }} name="Revenue" />
                  <Line type="monotone" dataKey="upper" stroke={accent} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Upper Confidence" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* SECONDARY INSIGHT ANALYSIS TRACKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Weekly performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-sm mb-1">Weekly Performance</h3>
              <p className="text-xs text-gray-500 mb-6">Actual vs. forecasted weekly revenue</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={10} />
                    <YAxis tickFormatter={(val) => `₱${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend iconType="square" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="actual" fill={primary} name="Actual" radius={[2, 2, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="forecast" fill={accent} name="Forecast" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-sm mb-1">Category Performance</h3>
              <p className="text-xs text-gray-500 mb-6">Forecast by product category</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(val) => `₱${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend iconType="square" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="historical" fill={primary} name="Historical" radius={[0, 2, 2, 0]} barSize={8} />
                    <Bar dataKey="forecast" fill={accent} name="Forecast" radius={[0, 2, 2, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-sm mb-1">Top Products Forecast</h3>
              <p className="text-xs text-gray-500 mb-4">Projected best sellers for next month</p>
              <div className="flex flex-col gap-3">
                {topProducts.map((prod) => (
                  <div key={prod.rank} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                           style={{ backgroundColor: `${primary}15`, color: primary }}>
                        {prod.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{prod.name}</p>
                        <p className="text-xs text-gray-500">{prod.units} units • ₱{prod.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: primary }}>↗ {prod.growth}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights panel overlays */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">AI-Generated Insights</h3>
                <p className="text-xs text-gray-500">Actionable recommendations based on forecast</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-emerald-50/40 border-emerald-200/60">
                <h4 className="flex items-center gap-2 font-semibold text-emerald-800 text-sm mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Strong Growth Trajectory
                </h4>
                <p className="text-xs text-emerald-700/90 leading-relaxed">Revenue projected to increase 7.2% over the next quarter based on current trends.</p>
              </div>

              <div className="border rounded-lg p-4 bg-amber-50/40 border-amber-200/60">
                <h4 className="flex items-center gap-2 font-semibold text-amber-800 text-sm mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Weekend Sales Spike
                </h4>
                <p className="text-xs text-amber-700/90 leading-relaxed">Weekend sales are 35% higher than weekdays. Consider increasing inventory for Fri-Sun.</p>
              </div>
            </div>
          </div>

          {/* DYNAMIC METRIC SUMMARY FOOTER */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.75 }}
            className="border rounded-xl p-6 shadow-sm bg-white border-gray-200"
          >
            <h3 className="font-bold mb-4" style={{ color: primary }}>Forecast Summary & Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "📅", label: "Planning Horizon", desc: "The next 3 months show steady growth. Plan inventory increases of 7-10% month-over-month to meet demand." },
                { icon: "📦", label: "Inventory Action", desc: "Focus restocking on Coffee and Pastries categories. These show highest growth potential at 7.0% and 6.5% respectively." },
                { icon: "📈", label: "Revenue Goal", desc: "Target $48k in revenue by July 2026. Current trajectory indicates 94% probability of achieving this goal." },
              ].map((rec, i) => (
                <div key={i}>
                  <h4 className="flex items-center gap-2 font-bold text-sm mb-2" style={{ color: accent }}>
                    {rec.icon} {rec.label}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        /* LOCKED STATE COMPONENT FRAME */
        <div className="w-full flex flex-col items-center justify-center py-32 bg-white rounded-xl border-2 border-dashed shadow-sm"
             style={{ borderColor: `${accent}40` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
               style={{ backgroundColor: `${accent}15`, color: accent }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: primary }}>Not Enough Data Yet</h2>
          <p className="text-gray-500 max-w-md text-center text-sm leading-relaxed px-6">
            Sales forecasts and AI projections will only be available after <strong>3 months</strong> of consecutive subscription data to ensure strict historical precision.
          </p>
        </div>
      )}
    </div>
  );
}
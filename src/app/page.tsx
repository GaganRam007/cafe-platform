"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Coffee,
  Smartphone,
  LayoutDashboard,
  QrCode,
  Flame,
  ChefHat,
  Users,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Wifi,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const [selectedTable, setSelectedTable] = useState<number>(2);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* Hero Header */}
      <header className="border-b border-[#E8E1D9] dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2E1C14] text-amber-400 flex items-center justify-center shadow-md">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#2E1C14] dark:text-white">
                  Aura Artisan Cafe
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Full-Stack Platform
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Operating System & Mobile QR Dining Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2E1C14] hover:bg-black text-white shadow-md transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner Dashboard</span>
            </Link>

            <Link
              href={`/order/${selectedTable}`}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md transition flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer QR App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Dual Interface Launchpad */}
      <main className="max-w-7xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 space-y-12">
        {/* Banner Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Real-time SSE WebSockets • Automated Recipe Deductions • Live KDS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#2E1C14] dark:text-white tracking-tight">
            The Complete Operating System for Modern Specialty Cafes
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Choose an interface below to explore either the zero-friction customer QR web application or the high-density desktop & tablet owner dashboard.
          </p>
        </div>

        {/* Dual Cards Launchpad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Customer QR Web App */}
          <div className="bg-white dark:bg-neutral-900 border border-[#E8E1D9] dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Mobile-First • Zero Friction
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Module 1: Customer QR Web App
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  Triggered at table via QR scan. Instant digital menu, item modifier sheets (oat/almond milk, sweetness, extra shots), shared table cart & bill tracking, tip selector, and 1-tap service requests.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dynamic WiFi info & diner session</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fuzzy search & dietary filter chips</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Item Customizer bottom sheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Split & Combined table bill tracker</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant Apple/Google Pay, Cards & UPI</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Persistent &quot;Call Server&quot; & &quot;Water&quot;</span>
                </div>
              </div>

              {/* Table Selector for Simulation */}
              <div className="p-3.5 bg-[#FAF7F2] dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Select Dining Table to Simulate:
                  </span>
                  <span className="font-bold text-amber-600">Table #{selectedTable}</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTable(num)}
                      className={`py-1.5 rounded-xl font-bold text-xs transition ${
                        selectedTable === num
                          ? "bg-[#2E1C14] text-white shadow"
                          : "bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={`/order/${selectedTable}`}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Smartphone className="w-4 h-4" />
                <span>Launch Customer QR App (Table #{selectedTable})</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
              </Link>
            </div>
          </div>

          {/* Card 2: Owner & Staff Dashboard */}
          <div className="bg-white dark:bg-neutral-900 border border-[#E8E1D9] dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Desktop & Tablet First
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Module 2: Owner & Staff Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  High-density command center with Role-Based Access Control (Admin/Owner, Barista, Waitstaff). Live visual floor plan, urgency KDS, automated recipe costing, and cafe health analytics.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2D Visual Floor Plan & High Density Grid</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dynamic QR Code Placard Generator & Print</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Kitchen Display System with Urgency Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automatic raw material recipe deductions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Shrinkage log & 1-click PO generator</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Live AOV, turnover & peak sales KPIs</span>
                </div>
              </div>

              {/* Role previews */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <span className="font-semibold text-xs text-neutral-700 dark:text-neutral-300 block">
                  Built-In Role Permissions (RBAC):
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <span className="font-bold block">Admin / Owner</span>
                    <span className="text-[10px] text-neutral-400">Full Access</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-xs">
                    <ChefHat className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <span className="font-bold block">Barista / KDS</span>
                    <span className="text-[10px] text-neutral-400">Tickets & Audio</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-xs">
                    <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <span className="font-bold block">Waitstaff</span>
                    <span className="text-[10px] text-neutral-400">Floor & Alerts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/dashboard"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#2E1C14] hover:bg-black text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>Open Owner & Staff Dashboard</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live System Capabilities Grid */}
        <div className="border-t border-[#E8E1D9] dark:border-neutral-800 pt-10">
          <h3 className="text-xl font-extrabold text-center text-[#2E1C14] dark:text-white mb-6">
            Production Architecture & Enterprise Design
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-[#E8E1D9] dark:border-neutral-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Live SSE Realtime Engine
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Server-Sent Events stream (/api/realtime) syncs order placements, status transitions, table occupations, and waiter calls instantaneously without manual refreshes.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-[#E8E1D9] dark:border-neutral-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Automated Inventory Depletion
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Every espresso, pastry, and brunch order queries the Bill of Materials (BOM) recipe and subtracts exact grams of beans, ml of oat milk, and sourdough loaves in real time.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-[#E8E1D9] dark:border-neutral-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Omnichannel Payments & Webhooks
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Supports instant digital checkout (Apple Pay, Google Pay, UPI, Cards) and &quot;Pay Cash at Counter&quot; with Stripe/Razorpay webhook listeners for capture notifications.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E1D9] dark:border-neutral-800 py-6 text-center text-xs text-neutral-500">
        <p>Aura Cafe Management Platform • Next.js App Router • Tailwind CSS • TanStack React Query</p>
      </footer>
    </div>
  );
}

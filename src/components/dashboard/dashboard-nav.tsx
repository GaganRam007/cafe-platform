"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Coffee,
  Layers,
  ChefHat,
  TrendingUp,
  Package,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  Droplets,
  CheckCircle,
  Wifi,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Table, Cafe, ServiceRequest } from "@/types/cafe";
import { useRealtime } from "@/components/providers/query-provider";

interface DashboardNavProps {
  cafe: Cafe;
  staff: { name: string; role: string; email?: string } | null;
  onLogout: () => void;
  serviceRequests: ServiceRequest[];
  onResolveServiceRequest: (id: string) => Promise<void>;
  tables: Table[];
  selectedTableForQr: number;
  onChangeSelectedTableForQr: (tbl: number) => void;
  currentTab: "floor" | "kds" | "inventory" | "analytics";
  onChangeTab: (tab: "floor" | "kds" | "inventory" | "analytics") => void;
}

export function DashboardNav({
  cafe,
  staff,
  onLogout,
  serviceRequests,
  onResolveServiceRequest,
  tables,
  selectedTableForQr,
  onChangeSelectedTableForQr,
  currentTab,
  onChangeTab,
}: DashboardNavProps) {
  const { isConnected } = useRealtime();
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const role = staff?.role || "admin";
  const pendingRequests = serviceRequests.filter((r) => r.status === "pending");

  const selectedTableObj = tables.find((t) => t.table_number === selectedTableForQr) || tables[0];
  const targetQrToken = selectedTableObj?.qr_token || `tbl-${selectedTableForQr}`;

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#2E1C14] text-white border-b border-white/10 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Status Indicator */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-lg shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm tracking-tight text-white">{cafe.name}</h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  Staff POS
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                    }`}
                  />
                  <span>{isConnected ? "Live SSE Active" : "Polling Sync"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Customer QR App Simulator Launch Link */}
          <div className="flex items-center gap-1.5 md:hidden">
            <Link
              href={`/order/${encodeURIComponent(targetQrToken)}`}
              target="_blank"
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1"
            >
              <span>T#{selectedTableForQr} QR</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Center: Navigation Tabs for High Density Dashboard */}
        <nav className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10 text-xs font-semibold overflow-x-auto w-full md:w-auto">
          {/* Floor & Tables */}
          {(role === "admin" || role === "manager" || role === "waitstaff" || role === "cashier") && (
            <button
              onClick={() => onChangeTab("floor")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === "floor"
                  ? "bg-amber-600 text-white shadow"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Floor & Tables</span>
            </button>
          )}

          {/* Kitchen KDS */}
          {(role === "admin" || role === "manager" || role === "kitchen" || role === "barista") && (
            <button
              onClick={() => onChangeTab("kds")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === "kds"
                  ? "bg-amber-600 text-white shadow"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen KDS</span>
            </button>
          )}

          {/* Inventory & Costing */}
          {(role === "admin" || role === "manager" || role === "kitchen") && (
            <button
              onClick={() => onChangeTab("inventory")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === "inventory"
                  ? "bg-amber-600 text-white shadow"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory & Recipes</span>
            </button>
          )}

          {/* Analytics */}
          {(role === "admin" || role === "manager") && (
            <button
              onClick={() => onChangeTab("analytics")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === "analytics"
                  ? "bg-amber-600 text-white shadow"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics & KPIs</span>
            </button>
          )}
        </nav>

        {/* Right: Staff Identity & Logout, QR Launcher, Service Alerts Bell */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Quick QR Viewer */}
          <div className="hidden lg:flex items-center bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
            <span className="text-neutral-400 text-[11px] mr-1.5">Table QR:</span>
            <select
              value={selectedTableForQr}
              onChange={(e) => onChangeSelectedTableForQr(Number(e.target.value))}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              {tables.map((tbl) => (
                <option key={tbl.table_number} value={tbl.table_number} className="bg-neutral-900 text-white">
                  Table #{tbl.table_number}
                </option>
              ))}
            </select>
            <Link
              href={`/order/${encodeURIComponent(targetQrToken)}`}
              target="_blank"
              className="ml-1.5 p-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold flex items-center gap-0.5 transition"
              title="Open table QR guest view in new tab"
            >
              <span>Launch</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Service Requests Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setShowServiceMenu(!showServiceMenu)}
              className={`relative p-2 rounded-xl border transition ${
                pendingRequests.length > 0
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-bounce"
                  : "bg-white/10 border-white/10 text-neutral-300 hover:bg-white/20"
              }`}
              title="Table waiter calls & water requests"
            >
              <Bell className="w-4 h-4" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Service Alert Dropdown Popup */}
            {showServiceMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-3 z-50 animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs font-bold">
                  <span>Active Diner Service Alerts</span>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    {pendingRequests.length} pending
                  </span>
                </div>

                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-4">
                      No pending diner assistance requests.
                    </p>
                  ) : (
                    pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            {req.type === "water" ? (
                              <Droplets className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Bell className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <span>Table #{req.table_number}</span>
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(req.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                          {req.message || `${req.type.replace("_", " ").toUpperCase()}`}
                        </p>

                        <button
                          onClick={() => {
                            onResolveServiceRequest(req.id);
                          }}
                          className="w-full py-1 rounded-lg bg-[#2E1C14] hover:bg-black text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Acknowledge & Clear</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Staff Badge with Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <Shield className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              <span className="text-white font-bold">{staff?.name || "Staff"}</span>
              <span className="ml-1.5 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/30">
                {role}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-xs text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
              title="Sign Out Staff"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 transition"
            title="Toggle Dark / Light Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

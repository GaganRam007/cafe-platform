"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight,
  PieChart,
  ShoppingBag,
  Award,
  Zap,
} from "lucide-react";
import { CafeAnalytics } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsViewProps {
  analytics: CafeAnalytics;
}

export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const [activeMetricTab, setActiveMetricTab] = useState<"sales" | "hourly" | "ingredients">("sales");

  const totalPayments = Object.values(analytics.payment_method_breakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* 4 Core High-Density KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Live Gross Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {formatCurrency(analytics.gross_revenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last Tuesday</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Average Order Value (AOV)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {formatCurrency(analytics.average_order_value)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Across {analytics.order_count} completed orders</p>
        </div>

        {/* Table Turnover Rate */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Table Turnover Rate</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {analytics.table_turnover_rate} turns / table
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Avg seating time: 42 minutes</p>
        </div>

        {/* Floor Occupancy Rate */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Dining Occupancy</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {analytics.occupancy_rate}%
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {analytics.active_table_count} of {analytics.total_table_count} tables currently dining
          </p>
        </div>
      </div>

      {/* Main Grid: Best-Sellers & Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top 5 Best-Sellers */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Top Best-Selling Menu Items
                </h4>
                <p className="text-xs text-neutral-500">Ranked by gross revenue and popularity</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              Real-Time Sales
            </span>
          </div>

          <div className="space-y-3">
            {analytics.top_selling_items.map((item, idx) => {
              const maxRev = analytics.top_selling_items[0]?.revenue || 1;
              const pct = Math.round((item.revenue / maxRev) * 100);

              return (
                <div key={item.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-neutral-600 dark:text-neutral-300">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-neutral-400">({item.category})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500 font-medium">{item.quantity} sold</span>
                      <span className="font-extrabold text-[#2E1C14] dark:text-amber-400">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Payment Channels
                </h4>
                <p className="text-xs text-neutral-500">Digital vs Counter Cash</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {Object.entries(analytics.payment_method_breakdown).map(([method, amount]) => {
              const pct = totalPayments > 0 ? ((amount / totalPayments) * 100).toFixed(1) : 0;
              const formattedName =
                method === "apple_pay"
                  ? "Apple Pay"
                  : method === "google_pay"
                  ? "Google Pay"
                  : method === "upi"
                  ? "UPI / QR"
                  : method === "card"
                  ? "Credit Card"
                  : "Cash at Counter";

              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-700 dark:text-neutral-300 capitalize">{formattedName}</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly Trend Breakdown & Ingredient Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak Order Hours */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Peak Order Hours Today
              </h4>
              <p className="text-xs text-neutral-500">Hourly volume and order spikes</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
              Peak: 12:00 PM
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
            {analytics.peak_order_hours.map((hour) => (
              <div
                key={hour.hour}
                className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center space-y-1"
              >
                <span className="text-[10px] text-neutral-500 block">{hour.hour.split(" ")[0]}</span>
                <span className="font-bold text-sm text-neutral-900 dark:text-white block">
                  {hour.orders}
                </span>
                <span className="text-[9px] text-emerald-600 font-medium block">
                  ${Math.round(hour.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Ingredient Consumption Rate */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Live Ingredient Consumption Velocity
              </h4>
              <p className="text-xs text-neutral-500">Deducted automatically from recipes</p>
            </div>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {analytics.ingredient_consumption_today.map((ing) => (
              <div
                key={ing.name}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-white">{ing.name}</span>
                  <span className="text-[10px] text-neutral-400 block">
                    Stock remaining: {ing.stockRemaining.toLocaleString()} {ing.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    -{ing.amount.toLocaleString()} {ing.unit}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Deducted Today</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Coffee,
  Volume2,
  VolumeX,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Order, OrderStatus, OrderItemStatus } from "@/types/cafe";
import { playAudioNotification } from "@/lib/utils";

interface KDSViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdateItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => Promise<void>;
}

export function KDSView({
  orders,
  onUpdateOrderStatus,
  onUpdateItemStatus,
}: KDSViewProps) {
  const [stationFilter, setStationFilter] = useState<"all" | "barista" | "kitchen">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedTickets, setCompletedTickets] = useState<Record<string, boolean>>({});
  const [, setTicker] = useState(0);

  // Live timer tick every 10 seconds to recalculate elapsed minutes
  useEffect(() => {
    const interval = setInterval(() => setTicker((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders: show non-completed, non-cancelled orders, sorted by oldest first
  const activeOrders = orders
    .filter((o) => o.status !== "completed" && o.status !== "cancelled")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Helper to calculate elapsed time in minutes
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  // Helper for status transition pipeline
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case "sent":
      case "draft":
        return "preparing";
      case "preparing":
        return "ready";
      case "ready":
        return "served";
      case "served":
        return "completed";
      default:
        return null;
    }
  };

  const getStatusButtonLabel = (current: OrderStatus) => {
    switch (current) {
      case "sent":
      case "draft":
        return "Start Preparing";
      case "preparing":
        return "Mark Ready for Pickup";
      case "ready":
        return "Mark Served to Table";
      case "served":
        return "Close Ticket (Done)";
      default:
        return "Complete";
    }
  };

  return (
    <div className="space-y-4">
      {/* KDS Header Controls */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E1C14] text-amber-400 flex items-center justify-center shadow">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Live Kitchen Display System (KDS)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                {activeOrders.length} Active Tickets
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              Chronologically sorted tickets with urgency alerts & sound triggers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Station Selector */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStationFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                stationFilter === "all"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              All Stations
            </button>
            <button
              onClick={() => setStationFilter("barista")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                stationFilter === "barista"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>Barista</span>
            </button>
            <button
              onClick={() => setStationFilter("kitchen")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                stationFilter === "kitchen"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kitchen</span>
            </button>
          </div>

          {/* Sound Controls */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playAudioNotification("new_order");
            }}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
              soundEnabled
                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500"
            }`}
            title="Toggle Web Audio order chimes"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline font-semibold">{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>

          <button
            onClick={() => playAudioNotification("new_order")}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
            title="Test pleasant chime"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Urgency Legend Banner */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">Urgency Tiers:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>&lt;10m (Normal)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>10-20m (Attention Required)</span>
        </span>
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span>&gt;20m (Pulsing Critical Alert)</span>
        </span>
      </div>

      {/* Ticket Grid */}
      {activeOrders.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-16 text-center border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
            Kitchen All Caught Up!
          </h4>
          <p className="text-xs text-neutral-500">
            No pending tickets. Incoming QR orders will automatically appear and chime here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.created_at);
            const isUrgent = elapsed >= 20;
            const isWarning = elapsed >= 10 && elapsed < 20;

            // Filter items by selected station if not 'all'
            const visibleItems = order.items.filter(
              (i) => stationFilter === "all" || i.station === stationFilter
            );

            if (visibleItems.length === 0 && stationFilter !== "all") {
              return null;
            }

            const nextStatus = getNextStatus(order.status);

            return (
              <div
                key={order.id}
                className={`relative bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border-2 overflow-hidden flex flex-col justify-between transition ${
                  isUrgent
                    ? "border-red-500 animate-urgent"
                    : isWarning
                    ? "border-amber-400"
                    : "border-emerald-400/80"
                }`}
              >
                {/* Ticket Top Header */}
                <div>
                  <div
                    className={`p-3.5 text-white flex items-center justify-between ${
                      isUrgent
                        ? "bg-red-600"
                        : isWarning
                        ? "bg-amber-600"
                        : "bg-[#2E1C14]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black tracking-wider">
                        {order.order_number}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold">
                        Table #{order.table_number}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m ago</span>
                    </div>
                  </div>

                  {/* Diner & Payment Info Bar */}
                  <div className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {order.customer_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {order.payment_status === "paid" ? "PAID" : "CASH AT COUNTER"}
                    </span>
                  </div>

                  {/* Items Checklist List */}
                  <div className="p-3.5 space-y-2.5">
                    {visibleItems.map((item) => {
                      const isItemDone =
                        item.status === "ready" || item.status === "delivered";

                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            onUpdateItemStatus(
                              order.id,
                              item.id,
                              isItemDone ? "preparing" : "ready"
                            )
                          }
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition select-none flex items-start gap-2.5 ${
                            isItemDone
                              ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 opacity-60 line-through"
                              : "bg-neutral-50 dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isItemDone}
                            onChange={() => {}}
                            className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-neutral-900 dark:text-white">
                                {item.quantity}x {item.item_name}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-semibold uppercase">
                                {item.station}
                              </span>
                            </div>

                            {item.selected_modifiers?.length > 0 && (
                              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium mt-0.5">
                                ↳ {item.selected_modifiers.map((m) => m.option_name).join(", ")}
                              </p>
                            )}

                            {item.notes && (
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Status Transition Action Footer */}
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Status:</span>
                    <span className="font-bold capitalize text-amber-700 dark:text-amber-400">
                      {order.status}
                    </span>
                  </div>

                  {nextStatus ? (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-[0.99] ${
                        order.status === "ready"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : order.status === "preparing"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-[#2E1C14] hover:bg-black text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{getStatusButtonLabel(order.status)}</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-semibold text-emerald-600 py-1">
                      Ticket Complete ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

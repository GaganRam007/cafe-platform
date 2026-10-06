"use client";

import React, { useState } from "react";
import {
  QrCode,
  GitMerge,
  PlusCircle,
  RotateCcw,
  Users,
  Clock,
  Sparkles,
  MapPin,
  LayoutGrid,
  Map as MapIcon,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Table, TableStatus, MenuItem, Cafe } from "@/types/cafe";
import { QRModal } from "./qr-modal";
import { ManualOrderModal } from "./manual-order-modal";
import { MergeSplitModal } from "./merge-split-modal";

interface FloorManagementProps {
  cafe: Cafe;
  tables: Table[];
  menuItems: MenuItem[];
  onUpdateTableStatus: (tableId: string, status: TableStatus) => Promise<void>;
  onResetTable: (tableId: string) => Promise<void>;
  onMergeTables: (target: number, source: number) => Promise<void>;
  onSplitTables: (target: number) => Promise<void>;
  onCreateManualOrder: (orderPayload: any) => Promise<void>;
}

export function FloorManagement({
  cafe,
  tables,
  menuItems,
  onUpdateTableStatus,
  onResetTable,
  onMergeTables,
  onSplitTables,
  onCreateManualOrder,
}: FloorManagementProps) {
  const [viewMode, setViewMode] = useState<"grid" | "floor_plan">("grid");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);
  const [manualOrderTable, setManualOrderTable] = useState<Table | null>(null);
  const [mergeModalTable, setMergeModalTable] = useState<Table | null>(null);

  // Status badge styling helper
  const getStatusConfig = (status: TableStatus) => {
    switch (status) {
      case "vacant":
        return {
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300",
          dot: "bg-emerald-500",
          label: "Vacant (Clean)",
          colorBadge: "bg-emerald-500",
        };
      case "seated":
        return {
          bg: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300",
          dot: "bg-amber-500",
          label: "Seated / Ordering",
          colorBadge: "bg-amber-500",
        };
      case "active_order":
        return {
          bg: "bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-300",
          dot: "bg-red-500 animate-pulse",
          label: "In-Kitchen / Active",
          colorBadge: "bg-red-500",
        };
      case "billing":
        return {
          bg: "bg-blue-500/15 border-blue-500/40 text-blue-800 dark:text-blue-300",
          dot: "bg-blue-500",
          label: "Payment Pending",
          colorBadge: "bg-blue-500",
        };
    }
  };

  const zones = ["all", "Main Dining", "Patio Garden", "Window Bar"];
  const filteredTables = tables.filter(
    (t) => selectedZone === "all" || t.zone === selectedZone
  );

  // Quick stats
  const vacantCount = tables.filter((t) => t.status === "vacant").length;
  const seatedCount = tables.filter((t) => t.status === "seated").length;
  const activeCount = tables.filter((t) => t.status === "active_order").length;
  const billingCount = tables.filter((t) => t.status === "billing").length;

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Legend Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-500 mr-1">Floor Status:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Vacant ({vacantCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Seated ({seatedCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            In-Kitchen ({activeCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Billing ({billingCount})
          </span>
        </div>

        {/* View Toggle & Zone Dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Zone Selector */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === "all" ? "All Zones" : z}
              </option>
            ))}
          </select>

          {/* Grid vs Map View Toggle */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Grid Table Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode("floor_plan")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === "floor_plan"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Visual 2D Floor Plan Layout"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Floor Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor View Area */}
      {viewMode === "grid" ? (
        /* High Density Table Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const statusConfig = getStatusConfig(table.status);

            return (
              <div
                key={table.id}
                className={`relative bg-white dark:bg-neutral-900 border rounded-2xl p-4 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                  table.status === "active_order"
                    ? "border-red-400/80 dark:border-red-800"
                    : table.status === "billing"
                    ? "border-blue-400/80 dark:border-blue-800"
                    : table.status === "seated"
                    ? "border-amber-400/80 dark:border-amber-800"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {/* Header row: Table number & status badge */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#2E1C14] text-[#FAF7F2] font-black text-base flex items-center justify-center shadow-sm">
                        #{table.table_number}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                          {table.label}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity} seats</span>
                          <span>• {table.zone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                      {table.merged_with && table.merged_with.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                          Merged: #{table.merged_with.join(", #")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Status Override Selector */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-400">Change Status:</span>
                    <select
                      value={table.status}
                      onChange={(e) =>
                        onUpdateTableStatus(table.id, e.target.value as TableStatus)
                      }
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                    >
                      <option value="vacant">🟢 Vacant</option>
                      <option value="seated">🟡 Seated</option>
                      <option value="active_order">🔴 Active Order</option>
                      <option value="billing">🔵 Billing</option>
                    </select>
                  </div>
                </div>

                {/* Table Card Quick Action Buttons */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-4 gap-1">
                  <button
                    onClick={() => setQrModalTable(table)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex flex-col items-center justify-center gap-1 transition"
                    title="Generate and print dynamic QR placard"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>QR Code</span>
                  </button>

                  <button
                    onClick={() => setManualOrderTable(table)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex flex-col items-center justify-center gap-1 transition"
                    title="Take manual order (phone/walk-in)"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Order</span>
                  </button>

                  <button
                    onClick={() => setMergeModalTable(table)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex flex-col items-center justify-center gap-1 transition"
                    title="Merge or split table"
                  >
                    <GitMerge className="w-3.5 h-3.5 text-purple-600" />
                    <span>Merge</span>
                  </button>

                  <button
                    onClick={() => onResetTable(table.id)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex flex-col items-center justify-center gap-1 transition"
                    title="Mark cleaned & reset table"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visual 2D Floor Plan Canvas */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Interactive Dining Floor Map (Zones: Window Bar • Main Dining • Patio Garden)</span>
            </span>
            <span>Tap any table for quick actions</span>
          </div>

          {/* 2D Canvas Container */}
          <div className="relative min-w-[700px] h-[480px] bg-[#FAF7F2] dark:bg-neutral-950 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 p-4 overflow-hidden">
            {/* Zone Markers on Map */}
            <div className="absolute top-3 left-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              🪟 Window Bar Station
            </div>
            <div className="absolute top-1/2 left-4 -translate-y-1/2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              ☕ Main Dining Room
            </div>
            <div className="absolute bottom-3 right-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              🌿 Patio Garden Arbor
            </div>

            {/* Positioned Tables */}
            {filteredTables.map((table) => {
              const statusConfig = getStatusConfig(table.status);

              return (
                <div
                  key={table.id}
                  onClick={() => setQrModalTable(table)}
                  style={{
                    left: `${table.position_x}%`,
                    top: `${table.position_y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-300 hover:scale-110 z-10`}
                >
                  <div
                    className={`w-20 h-20 rounded-2xl bg-white dark:bg-neutral-900 border-2 shadow-lg flex flex-col items-center justify-center p-1.5 ${
                      table.status === "active_order"
                        ? "border-red-500 animate-urgent"
                        : table.status === "billing"
                        ? "border-blue-500"
                        : table.status === "seated"
                        ? "border-amber-500"
                        : "border-emerald-500"
                    }`}
                  >
                    <span className="font-extrabold text-xs text-neutral-900 dark:text-white">
                      T-{table.table_number}
                    </span>
                    <span className="text-[10px] text-neutral-500">{table.capacity}p</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1 ${statusConfig.dot}`}
                    />
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-neutral-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                      #{table.table_number} • {statusConfig.label} ({table.zone})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Modals */}
      <QRModal
        cafe={cafe}
        table={qrModalTable}
        onClose={() => setQrModalTable(null)}
      />

      {manualOrderTable && (
        <ManualOrderModal
          table={manualOrderTable}
          menuItems={menuItems}
          onClose={() => setManualOrderTable(null)}
          onSubmit={onCreateManualOrder}
        />
      )}

      {mergeModalTable && (
        <MergeSplitModal
          table={mergeModalTable}
          allTables={tables}
          onClose={() => setMergeModalTable(null)}
          onMerge={onMergeTables}
          onSplit={onSplitTables}
        />
      )}
    </div>
  );
}

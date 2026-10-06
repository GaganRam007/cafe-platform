"use client";

import React, { useState } from "react";
import { X, GitMerge, Split } from "lucide-react";
import { Table } from "@/types/cafe";

interface MergeSplitModalProps {
  table: Table;
  allTables: Table[];
  onClose: () => void;
  onMerge: (targetTableNumber: number, sourceTableNumber: number) => Promise<void>;
  onSplit: (tableNumber: number) => Promise<void>;
}

export function MergeSplitModal({
  table,
  allTables,
  onClose,
  onMerge,
  onSplit,
}: MergeSplitModalProps) {
  const isMerged = table.merged_with && table.merged_with.length > 0;
  const availableToMerge = allTables.filter(
    (t) => t.table_number !== table.table_number && (!t.merged_with || t.merged_with.length === 0)
  );

  const [selectedSource, setSelectedSource] = useState<number>(
    availableToMerge[0]?.table_number || 1
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMerge = async () => {
    setIsProcessing(true);
    try {
      await onMerge(table.table_number, selectedSource);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    setIsProcessing(true);
    try {
      await onSplit(table.table_number);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        <div className="p-4 bg-[#2E1C14] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Table #{table.table_number} Merge / Split</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {isMerged ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Currently Merged With Table(s): {table.merged_with?.join(", ")}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  Combined capacity: {table.capacity} guests. Splitting will restore original individual table boundaries and statuses.
                </p>
              </div>

              <button
                onClick={handleSplit}
                disabled={isProcessing}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Split className="w-4 h-4" />
                <span>Split Tables Back to Original</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Merge Table #{table.table_number} (Capacity: {table.capacity}) with an adjacent table to accommodate a larger dining party.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Adjacent Table to Combine:
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  {availableToMerge.map((t) => (
                    <option key={t.id} value={t.table_number}>
                      Table #{t.table_number} ({t.zone} - {t.capacity} seats, {t.status})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleMerge}
                disabled={isProcessing || availableToMerge.length === 0}
                className="w-full py-3 bg-[#2E1C14] hover:bg-black text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow transition"
              >
                <GitMerge className="w-4 h-4 text-amber-400" />
                <span>Merge Tables (Combine Capacity)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

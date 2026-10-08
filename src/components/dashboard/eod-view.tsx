"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Loader2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function EodReconciliationView() {
  const qc = useQueryClient();
  const [countedCash, setCountedCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load EOD Report from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["eod_report"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("aura_staff_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/staff/reports/eod", { headers });
      if (!res.ok) throw new Error("Failed to load EOD report");
      return res.json();
    },
  });

  const report = data?.report;
  const byMethod = report?.by_payment_method || {};
  const expectedCash = byMethod.cash?.total || 0;

  const numCounted = parseFloat(countedCash) || 0;
  const variance = Number((numCounted - expectedCash).toFixed(2));

  const handleSubmitReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (countedCash === "" || isNaN(numCounted)) {
      setErrorMessage("Please enter the counted cash amount in register drawer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("aura_staff_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/staff/reports/eod", {
        method: "POST",
        headers,
        body: JSON.stringify({
          countedCash: numCounted,
          notes: notes.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to submit reconciliation");
      }

      setSubmitSuccess(true);
      qc.invalidateQueries({ queryKey: ["eod_report"] });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit reconciliation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-neutral-400">
        <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3 text-amber-600" />
        <p className="text-xs font-semibold">Generating End-of-Day Financial Report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              End-of-Day (EOD) Reconciliation & Register Close
            </h3>
            <p className="text-[11px] text-neutral-500">
              Audit sales tenders, balance cash drawer against register totals, and record closing variance
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300">
          Date: {report?.date || new Date().toISOString().split("T")[0]}
        </span>
      </div>

      {/* KPI Cards: Sales By Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cash Tender */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Cash Register Total</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700">
              {byMethod.cash?.count || 0} bills
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white pt-1">
            {formatCurrency(expectedCash)}
          </div>
          <p className="text-[10px] text-neutral-400">Must match physical cash in drawer</p>
        </div>

        {/* UPI / QR Tender */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>UPI / QR Digital</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700">
              {byMethod.upi?.count || 0} bills
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white pt-1">
            {formatCurrency(byMethod.upi?.total || 0)}
          </div>
          <p className="text-[10px] text-neutral-400">Directly settled into bank account</p>
        </div>

        {/* Card / EDC Tender */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Card / POS Machine</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700">
              {byMethod.card?.count || 0} bills
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white pt-1">
            {formatCurrency(byMethod.card?.total || 0)}
          </div>
          <p className="text-[10px] text-neutral-400">Matches EDC terminal batch report</p>
        </div>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
          Today&apos;s Tax & Revenue Audit Summary
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
            <span className="text-neutral-500">Gross Sales:</span>
            <div className="font-mono font-bold text-base text-neutral-900 dark:text-white">
              {formatCurrency(report?.total_sales || 0)}
            </div>
            <span className="text-[10px] text-neutral-400">{report?.total_orders || 0} paid orders</span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
            <span className="text-neutral-500">Total GST (5%):</span>
            <div className="font-mono font-bold text-base text-amber-600">
              {formatCurrency(report?.total_tax || 0)}
            </div>
            <span className="text-[10px] text-neutral-400">CGST ₹{report?.cgst || 0} + SGST ₹{report?.sgst || 0}</span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
            <span className="text-neutral-500">Staff Tips Collected:</span>
            <div className="font-mono font-bold text-base text-emerald-600">
              {formatCurrency(report?.total_tips || 0)}
            </div>
            <span className="text-[10px] text-neutral-400">Pool distribution</span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
            <span className="text-neutral-500">Discounts & Comps:</span>
            <div className="font-mono font-bold text-base text-red-500">
              {formatCurrency(report?.total_discounts || 0)}
            </div>
            <span className="text-[10px] text-neutral-400">{report?.void_orders_count || 0} voids</span>
          </div>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Form */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-600" />
          <span>Physical Register Drawer Cash Balancing</span>
        </h4>

        {submitSuccess ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h5 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
              EOD Reconciliation Successfully Locked & Submitted!
            </h5>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Counted cash ₹{numCounted} recorded with variance ₹{variance}. Audit trail generated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReconciliation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold block mb-1">
                  Expected System Cash:
                </label>
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-mono font-bold text-sm text-neutral-800 dark:text-neutral-200">
                  {formatCurrency(expectedCash)}
                </div>
              </div>

              <div>
                <label className="text-neutral-600 dark:text-neutral-400 font-semibold block mb-1">
                  Counted Cash in Drawer (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4500"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono text-sm outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <span className="text-neutral-600 dark:text-neutral-400 font-semibold block mb-1">
                  Reconciliation Variance:
                </span>
                <div
                  className={`p-3 rounded-xl font-mono font-bold text-sm flex items-center justify-between border ${
                    variance === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : variance > 0
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-red-50 text-red-700 border-red-300"
                  }`}
                >
                  <span>{formatCurrency(variance)}</span>
                  <span className="text-[10px] uppercase font-bold">
                    {variance === 0 ? "Balanced" : variance > 0 ? "Over" : "Short"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-neutral-600 dark:text-neutral-400 text-xs font-semibold block mb-1">
                Discrepancy Notes or Shift Handover Remarks:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for drawer shortage/overage or shift handover..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-amber-500"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || countedCash === ""}
              className="py-3 px-6 bg-[#2E1C14] hover:bg-black text-[#FAF7F2] font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Submitting & Locking Drawer Report...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Submit & Lock End of Day Reconciliation</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

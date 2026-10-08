"use client";

import React, { useState } from "react";
import {
  X,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  Percent,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Table, Order } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface SettleBillModalProps {
  table: Table;
  orders: Order[];
  staffRole?: string;
  onClose: () => void;
  onSettled: () => void;
}

export function SettleBillModal({
  table,
  orders,
  staffRole = "staff",
  onClose,
  onSettled,
}: SettleBillModalProps) {
  // Find unpaid orders for this table
  const tableOrders = orders.filter(
    (o) => o.table_id === table.id && o.payment_status !== "void"
  );
  const activeUnpaidOrders = tableOrders.filter((o) => o.payment_status === "unpaid" || o.payment_status === "pending" || o.payment_status === "cash_pending");
  const alreadySettledOrders = tableOrders.filter((o) => o.payment_status === "paid");

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    activeUnpaidOrders[0]?.id || tableOrders[0]?.id || ""
  );

  const currentOrder = tableOrders.find((o) => o.id === selectedOrderId);

  // Settlement Form State
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("upi");
  const [discountType, setDiscountType] = useState<"none" | "flat" | "percentage" | "comp" | "staff_meal">("none");
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [discountReason, setDiscountReason] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<string>("0");
  const [serviceChargeOptIn, setServiceChargeOptIn] = useState<boolean>(true);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<string>("");

  // Reopen Form State
  const [isReopening, setIsReopening] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    invoiceNumber: string;
    finalTotal: number;
    paymentMethod: string;
  } | null>(null);

  // Dynamic Financial Calculations
  const baseSubtotal = currentOrder?.subtotal || 0;
  const numDiscountVal = Math.max(0, parseFloat(discountValue) || 0);

  let calculatedDiscount = 0;
  if (discountType === "flat") {
    calculatedDiscount = Math.min(baseSubtotal, numDiscountVal);
  } else if (discountType === "percentage") {
    calculatedDiscount = (baseSubtotal * Math.min(100, numDiscountVal)) / 100;
  } else if (discountType === "comp" || discountType === "staff_meal") {
    calculatedDiscount = baseSubtotal;
  }

  const discountedSubtotal = Math.max(0, baseSubtotal - calculatedDiscount);
  const cgstAmount = Number((discountedSubtotal * 0.025).toFixed(2));
  const sgstAmount = Number((discountedSubtotal * 0.025).toFixed(2));
  const serviceFee = serviceChargeOptIn ? Number((discountedSubtotal * 0.05).toFixed(2)) : 0;
  const tip = Math.max(0, parseFloat(tipAmount) || 0);
  const calculatedGrandTotal = Number((discountedSubtotal + cgstAmount + sgstAmount + serviceFee + tip).toFixed(2));

  const numTendered = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, Number((numTendered - calculatedGrandTotal).toFixed(2)));

  const handleSettleBill = async () => {
    if (!currentOrder) return;
    setErrorMessage(null);

    // Validation
    if (discountType !== "none" && discountReason.trim().length < 5) {
      setErrorMessage("Discount reason must be at least 5 characters for audit compliance.");
      return;
    }

    if (paymentMethod === "cash" && numTendered > 0 && numTendered < calculatedGrandTotal) {
      setErrorMessage(`Tendered amount ₹${numTendered} is less than bill total ₹${calculatedGrandTotal}`);
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        orderId: currentOrder.id,
        paymentMethod,
        tip,
        serviceChargeOptIn,
      };

      if (discountType !== "none") {
        payload.discount = {
          type: discountType,
          value: numDiscountVal,
          reason: discountReason.trim(),
        };
      }

      if (customerPhone.trim()) {
        payload.customerPhone = customerPhone.trim();
      }

      const res = await fetch("/api/staff/settle-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to settle bill");
      }

      setSuccessResult({
        invoiceNumber: data.invoice?.invoice_number || "INV-SETTLED",
        finalTotal: data.order?.total_amount || calculatedGrandTotal,
        paymentMethod,
      });

      onSettled();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to settle bill");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopenBill = async () => {
    if (!currentOrder) return;
    setErrorMessage(null);

    if (reopenReason.trim().length < 15) {
      setErrorMessage("Audit reason for reopening bill must be at least 15 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/staff/reopen-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentOrder.id,
          reason: reopenReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reopen bill");
      }

      setIsReopening(false);
      onSettled();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reopen bill");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 bg-[#2E1C14] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Offline Bill Settlement • Table #{table.table_number}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                {table.label} ({table.zone}) • Staff Terminal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {successResult ? (
            /* Settlement Success Banner */
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Bill Settled Successfully!
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Table #{table.table_number} marked clean & vacant. Order finalized.
                </p>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">GST Invoice Number:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    {successResult.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Settled:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(successResult.finalTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tender Method:</span>
                  <span className="font-semibold uppercase text-neutral-800 dark:text-neutral-200">
                    {successResult.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-[#2E1C14] hover:bg-black text-white font-semibold rounded-2xl text-xs transition"
                >
                  Close & Return to Floor
                </button>
              </div>
            </div>
          ) : !currentOrder ? (
            <div className="py-12 text-center text-neutral-400">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No Active Orders on Table #{table.table_number}</p>
            </div>
          ) : (
            <>
              {/* Order Selector (if multiple orders) */}
              {tableOrders.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                    Select Order on Table #{table.table_number}:
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {tableOrders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setSelectedOrderId(o.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          selectedOrderId === o.id
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        Order #{o.order_number} ({o.payment_status.toUpperCase()})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Status & Info */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    Order #{currentOrder.order_number} • {currentOrder.customer_name}
                  </span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {currentOrder.items?.length || 0} items ordered
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase ${
                    currentOrder.payment_status === "paid"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                  }`}
                >
                  {currentOrder.payment_status}
                </span>
              </div>

              {/* If Order is Already Settled -> Provide Reopen Option for Owner */}
              {currentOrder.payment_status === "paid" ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>This bill is already settled and locked.</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Settled at: {currentOrder.settled_at || currentOrder.updated_at}
                    {currentOrder.settled_by && ` by staff: ${currentOrder.settled_by}`}
                  </p>

                  {(staffRole === "admin" || staffRole === "owner") && (
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800 space-y-2">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                        Reopen Settled Bill (Owner Only):
                      </span>
                      <textarea
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="Mandatory audit explanation (min 15 characters, e.g. Customer changed tender method)..."
                        className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:border-amber-600"
                        rows={2}
                      />
                      <button
                        onClick={handleReopenBill}
                        disabled={isLoading || reopenReason.trim().length < 15}
                        className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Confirm Reopen & Reverse Settlement</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Settlement Form */
                <>
                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Payment Tender Method:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "cash", label: "Cash", icon: Banknote },
                        { id: "upi", label: "UPI / QR", icon: QrCode },
                        { id: "card", label: "Card / EDC", icon: CreditCard },
                      ].map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                              paymentMethod === m.id
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash Change Calculator */}
                  {paymentMethod === "cash" && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-neutral-500 font-medium block mb-1">
                          Amount Tendered (₹):
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono text-sm outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium block mb-1">
                          Change to Return:
                        </span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(changeToReturn)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discounts & Adjustments */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-amber-600" />
                        <span>Discount / Concession:</span>
                      </span>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="text-xs p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium"
                      >
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="comp">Complimentary (100%)</option>
                        <option value="staff_meal">Staff Meal</option>
                      </select>
                    </div>

                    {discountType !== "none" && (
                      <div className="space-y-2 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                        {(discountType === "percentage" || discountType === "flat") && (
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">Value:</span>
                            <input
                              type="number"
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              className="w-24 p-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono text-xs outline-none"
                            />
                            <span className="text-[11px] text-neutral-400">
                              (-{formatCurrency(calculatedDiscount)})
                            </span>
                          </div>
                        )}
                        <div>
                          <input
                            type="text"
                            placeholder="Mandatory discount reason (min 5 chars)..."
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Staff Tip & Service Charge Toggle */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                      <label className="text-neutral-500 block mb-1">Staff Tip (₹):</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono outline-none"
                      />
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
                      <span className="text-neutral-500 block">5% Service Charge:</span>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={serviceChargeOptIn}
                          onChange={(e) => setServiceChargeOptIn(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          {serviceChargeOptIn ? "Included" : "Waived"}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* WhatsApp Phone for Invoice Dispatch */}
                  <div className="text-xs">
                    <label className="text-neutral-600 dark:text-neutral-400 font-medium block mb-1">
                      Customer Phone for WhatsApp GST Invoice (Optional):
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Financial Breakdown Preview */}
                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-500">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(baseSubtotal)}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount ({discountType}):</span>
                        <span className="font-mono">-{formatCurrency(calculatedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-500">
                      <span>CGST (2.5%) + SGST (2.5%):</span>
                      <span className="font-mono">{formatCurrency(cgstAmount + sgstAmount)}</span>
                    </div>
                    {serviceChargeOptIn && (
                      <div className="flex justify-between text-neutral-500">
                        <span>Service Charge (5%):</span>
                        <span className="font-mono">{formatCurrency(serviceFee)}</span>
                      </div>
                    )}
                    {tip > 0 && (
                      <div className="flex justify-between text-neutral-500">
                        <span>Staff Tip:</span>
                        <span className="font-mono">{formatCurrency(tip)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-sm font-bold text-neutral-900 dark:text-white">
                      <span>Final Total Payable:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-base">
                        {formatCurrency(calculatedGrandTotal)}
                      </span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Primary Button */}
                  <button
                    onClick={handleSettleBill}
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-[#2E1C14] hover:bg-black text-[#FAF7F2] font-bold rounded-2xl text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Processing Settlement & Generating Invoice...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Settle Bill ({formatCurrency(calculatedGrandTotal)}) & Issue GST Invoice</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

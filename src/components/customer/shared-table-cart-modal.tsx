"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Sparkles,
  Trash2,
  ChefHat,
  Coffee,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Order, OrderItem, Table, Cafe } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface CartDraftItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  station: "barista" | "kitchen";
  quantity: number;
  unit_price: number;
  selected_modifiers: {
    group_name: string;
    option_name: string;
    price_delta: number;
  }[];
  notes?: string;
  guest_name: string;
  guest_id: string;
}

interface SharedTableCartModalProps {
  cafe: Cafe;
  table: Table;
  guestName: string;
  guestId: string;
  cartItems: CartDraftItem[];
  tableLiveOrders: Order[];
  onRemoveCartItem: (id: string) => void;
  onClearCart: () => void;
  onClose: () => void;
  onSubmitOrder: (params: {
    items: CartDraftItem[];
    payment_method: string;
    tip_amount: number;
    subtotal: number;
    tax_amount: number;
    service_fee: number;
    total_amount: number;
    payment_status: "paid" | "cash_pending";
  }) => Promise<void>;
  onTriggerService: (type: "call_server" | "water" | "bill") => void;
}

export function SharedTableCartModal({
  cafe,
  table,
  guestName,
  guestId,
  cartItems,
  tableLiveOrders,
  onRemoveCartItem,
  onClose,
  onSubmitOrder,
  onTriggerService,
}: SharedTableCartModalProps) {
  const [activeTab, setActiveTab] = useState<"cart" | "live_bill">("cart");
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [customTip, setCustomTip] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"apple_pay" | "google_pay" | "card" | "upi" | "cash">("apple_pay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteData, setOrderCompleteData] = useState<{ orderNumber: string; total: number; isCash: boolean } | null>(null);

  // Cart financial calculations
  const myItemsSubtotal = cartItems
    .filter((i) => i.guest_id === guestId)
    .reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const taxRate = cafe.settings.tax_rate;
  const serviceRate = cafe.settings.service_fee_rate;

  const serviceFee = Number((cartSubtotal * serviceRate).toFixed(2));
  const taxAmount = Number((cartSubtotal * taxRate).toFixed(2));

  const tipAmount = customTip !== "" ? parseFloat(customTip) || 0 : Number(((cartSubtotal * tipPercent) / 100).toFixed(2));
  const totalBill = Number((cartSubtotal + serviceFee + taxAmount + tipAmount).toFixed(2));

  // Submitted Live Items from tableLiveOrders
  const allSubmittedItems: OrderItem[] = tableLiveOrders.flatMap((o) => o.items);
  const liveTotalAmount = tableLiveOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const handleCheckout = async (isCash: boolean = false) => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const selectedPay = isCash ? "cash" : paymentMethod;
      await onSubmitOrder({
        items: cartItems,
        payment_method: selectedPay,
        tip_amount: tipAmount,
        subtotal: cartSubtotal,
        tax_amount: taxAmount,
        service_fee: serviceFee,
        total_amount: totalBill,
        payment_status: isCash ? "cash_pending" : "paid",
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#D97706", "#2E1C14", "#10B981", "#F59E0B"],
      });

      setOrderCompleteData({
        orderNumber: `#${Math.floor(100 + Math.random() * 900)}`,
        total: totalBill,
        isCash,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#FAF7F2] dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E8E1D9] dark:border-neutral-800 animate-slide-up">
        {/* Modal Header */}
        <div className="p-4 bg-[#2E1C14] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Table #{table.table_number} Order & Bill</h2>
              <p className="text-[11px] text-amber-200/80">
                {cafe.name} • {guestName}
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

        {/* Tab Switcher: "Your Cart Items" vs "Table's Combined Live Bill" */}
        <div className="flex p-1.5 bg-neutral-200/70 dark:bg-neutral-800 m-3 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab("cart")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "cart"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <span>Current Draft Cart</span>
            {cartItems.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("live_bill")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "live_bill"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <span>Table Live Bill & Tracker</span>
            {allSubmittedItems.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                {allSubmittedItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Order Completion Screen */}
        {orderCompleteData ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Order Sent to Kitchen!</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Order {orderCompleteData.orderNumber} is now brewing for Table #{table.table_number}.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Status:</span>
                <span className="font-semibold text-emerald-600">
                  {orderCompleteData.isCash ? "Pay at Counter / Cash" : "Paid Digitally"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Billed:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(orderCompleteData.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Live Status:</span>
                <span className="font-medium text-amber-600 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 animate-spin" /> Preparing with Care
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setOrderCompleteData(null);
                  setActiveTab("live_bill");
                }}
                className="flex-1 py-3 bg-[#2E1C14] text-white font-semibold rounded-2xl text-xs hover:bg-black transition"
              >
                Track Live Order Status
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-2xl text-xs"
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 no-scrollbar">
            {activeTab === "cart" ? (
              <>
                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
                    <p className="text-sm font-medium">Your cart is currently empty</p>
                    <p className="text-xs">Explore the menu above and add handcrafted coffee & bakes.</p>
                  </div>
                ) : (
                  <>
                    {/* Split View: "Your Items" & "Other Diners at Table" */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span>Your Selection ({guestName})</span>
                        </span>
                        <span>{formatCurrency(myItemsSubtotal)}</span>
                      </div>

                      <div className="space-y-2">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-neutral-800/80 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-start justify-between gap-3 shadow-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                  {item.quantity}x {item.item_name}
                                </span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                  {item.station}
                                </span>
                              </div>

                              {item.selected_modifiers?.length > 0 && (
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                                  {item.selected_modifiers.map((m) => m.option_name).join(", ")}
                                </p>
                              )}

                              {item.notes && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-300 italic mt-0.5">
                                  Note: {item.notes}
                                </p>
                              )}

                              <div className="text-[10px] text-neutral-400 mt-1">
                                Added by: <span className="font-medium text-neutral-600 dark:text-neutral-300">{item.guest_name}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                              <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                {formatCurrency(item.unit_price * item.quantity)}
                              </span>
                              <button
                                onClick={() => onRemoveCartItem(item.id)}
                                className="text-neutral-400 hover:text-red-500 p-1 transition"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tip Selector */}
                    <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tip the Barista & Kitchen Team</span>
                        </span>
                        <span className="font-bold text-amber-600">{formatCurrency(tipAmount)}</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setTipPercent(pct);
                              setCustomTip("");
                            }}
                            className={`py-1.5 text-xs font-semibold rounded-xl border transition ${
                              tipPercent === pct && customTip === ""
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-neutral-50 dark:bg-neutral-700/50 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                            }`}
                          >
                            {pct === 0 ? "No Tip" : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Financial Bill Breakdown */}
                    <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Items Subtotal</span>
                        <span>{formatCurrency(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Service Charge (5%)</span>
                        <span>{formatCurrency(serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Sales Tax / GST (8%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Staff Tip</span>
                        <span>{formatCurrency(tipAmount)}</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold text-sm text-neutral-900 dark:text-white">
                        <span>Total Payable</span>
                        <span className="text-amber-700 dark:text-amber-400">{formatCurrency(totalBill)}</span>
                      </div>
                    </div>

                    {/* Instant Digital Checkout Options */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        Select Instant Checkout Method:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "apple_pay", label: "Apple Pay", icon: "" },
                          { id: "google_pay", label: "G Pay", icon: "G" },
                          { id: "upi", label: "UPI / Scan", icon: "⚡" },
                          { id: "card", label: "Credit Card", icon: "💳" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                              paymentMethod === m.id
                                ? "bg-amber-600 text-white border-amber-600 shadow"
                                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                            }`}
                          >
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handleCheckout(false)}
                        disabled={isSubmitting}
                        className="w-full bg-[#2E1C14] hover:bg-black text-[#FAF7F2] font-semibold py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-between disabled:opacity-50"
                      >
                        <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span>Pay Digitally ({paymentMethod.toUpperCase().replace("_", " ")})</span>
                        </span>
                        <span className="font-bold text-sm text-amber-300">
                          {isSubmitting ? "Processing..." : formatCurrency(totalBill)}
                        </span>
                      </button>

                      <button
                        onClick={() => handleCheckout(true)}
                        disabled={isSubmitting}
                        className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-950 dark:text-amber-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 border border-amber-300 dark:border-neutral-700"
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Place Order & Pay Cash at Counter</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Table's Combined Order & Live Bill Status */
              <div className="space-y-4">
                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-500">Live Active Orders for:</span>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      Table #{table.table_number} ({table.zone})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {table.status.toUpperCase().replace("_", " ")}
                  </span>
                </div>

                {allSubmittedItems.length === 0 ? (
                  <div className="py-10 text-center text-neutral-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No active orders placed yet for this table.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Live Order Items Tracking
                    </h4>

                    {allSubmittedItems.map((item, idx) => {
                      const isDelivered = item.status === "delivered";
                      const isReady = item.status === "ready";
                      const isPrep = item.status === "preparing";

                      return (
                        <div
                          key={item.id || idx}
                          className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {item.quantity}x {item.item_name}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                ({item.guest_name})
                              </span>
                            </div>
                            {item.selected_modifiers?.length > 0 && (
                              <p className="text-[10px] text-neutral-500 truncate">
                                {item.selected_modifiers.map((m) => m.option_name).join(", ")}
                              </p>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            {isDelivered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Delivered
                              </span>
                            ) : isReady ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            ) : isPrep ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                                <ChefHat className="w-3 h-3 animate-spin" /> Preparing
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Queued
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Table live total */}
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <span>Total Table Billed So Far</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(liveTotalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Persistent Service Actions Quick-Dock */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex gap-2">
              <button
                type="button"
                onClick={() => onTriggerService("water")}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 transition"
              >
                <span>💧</span>
                <span>Request Water</span>
              </button>
              <button
                type="button"
                onClick={() => onTriggerService("call_server")}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1.5 transition"
              >
                <span>🛎️</span>
                <span>Call Server</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

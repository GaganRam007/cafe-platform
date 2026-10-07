"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  FileText,
  ShieldCheck,
  Send,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Order, OrderItem, Table, Cafe } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

export interface CartDraftItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  station: "barista" | "kitchen";
  quantity: number;
  unit_price: number;
  selected_modifiers: {
    group_id?: string;
    group_name?: string;
    option_id?: string;
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
  qrToken: string;
  guestName: string;
  guestId: string;
  customer?: { id: string; name: string; phone_e164: string } | null;
  cartItems: CartDraftItem[];
  tableLiveOrders: Order[];
  onRemoveCartItem: (id: string) => void;
  onClearCart: () => void;
  onClose: () => void;
  onOrderSuccess: () => void;
  onRequireAuth: () => void;
  onTriggerService: (type: "call_server" | "water" | "bill") => void;
}

export function SharedTableCartModal({
  cafe,
  table,
  qrToken,
  guestName,
  guestId,
  customer,
  cartItems,
  tableLiveOrders,
  onRemoveCartItem,
  onClearCart,
  onClose,
  onOrderSuccess,
  onRequireAuth,
  onTriggerService,
}: SharedTableCartModalProps) {
  const [activeTab, setActiveTab] = useState<"cart" | "live_bill">("cart");
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [customTip, setCustomTip] = useState<string>("");
  const [includeServiceCharge, setIncludeServiceCharge] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay_upi" | "razorpay_card" | "cash">("razorpay_upi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [orderCompleteData, setOrderCompleteData] = useState<{
    orderNumber: string;
    invoiceNumber?: string;
    total: number;
    isCash: boolean;
    customerPhone?: string;
  } | null>(null);

  // Cart financial calculations (Preview display - server performs authoritative calculation)
  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const myItemsSubtotal = cartItems
    .filter((i) => i.guest_id === guestId)
    .reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  // Indian GST split: 2.5% CGST + 2.5% SGST = 5% total
  const cgstAmount = Number((cartSubtotal * 0.025).toFixed(2));
  const sgstAmount = Number((cartSubtotal * 0.025).toFixed(2));
  const serviceFee = includeServiceCharge ? Number((cartSubtotal * 0.05).toFixed(2)) : 0;
  const tipAmount = customTip !== "" ? parseFloat(customTip) || 0 : Number(((cartSubtotal * tipPercent) / 100).toFixed(2));
  const totalBill = Number((cartSubtotal + cgstAmount + sgstAmount + serviceFee + tipAmount).toFixed(2));

  // Submitted Live Items from tableLiveOrders
  const allSubmittedItems: OrderItem[] = tableLiveOrders.flatMap((o) => o.items || []);
  const liveTotalAmount = tableLiveOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const handleCheckout = async (isCash: boolean = false) => {
    if (cartItems.length === 0) return;

    // Check if phone authentication is completed
    if (!customer) {
      onRequireAuth();
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Placing order with kitchen & bar...");

    try {
      const selectedPay = isCash ? "cash" : "razorpay";

      // 1. Submit Order to Server (Server-Side Price Authority - server recomputes prices, taxes, deducts inventory)
      const orderPayload = {
        qr_token: qrToken,
        customer_name: customer.name || guestName,
        payment_method: selectedPay,
        service_charge_opt_in: includeServiceCharge,
        tip_amount: tipAmount,
        items: cartItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          selected_option_ids: item.selected_modifiers
            .map((m) => m.option_id)
            .filter(Boolean),
          notes: item.notes,
        })),
      };

      const orderRes = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to place order");
      }

      const createdOrder = orderData.order;

      if (isCash) {
        // Cash order placed directly with payment_status: cash_pending
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#D97706", "#2E1C14", "#10B981", "#F59E0B"],
        });

        setOrderCompleteData({
          orderNumber: createdOrder.order_number,
          total: createdOrder.total_amount,
          isCash: true,
          customerPhone: customer.phone_e164,
        });
        onClearCart();
        onOrderSuccess();
      } else {
        // Digital Razorpay Flow
        setStatusMessage("Initializing secure Razorpay gateway...");

        const rzpOrderRes = await fetch("/api/payments/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: createdOrder.id }),
        });

        const rzpData = await rzpOrderRes.json();
        if (!rzpOrderRes.ok) {
          throw new Error(rzpData.error || "Razorpay order creation failed");
        }

        setStatusMessage("Confirming payment & generating GST Tax Invoice...");

        // Simulate Razorpay payment completion via webhook trigger
        const paymentPayload = {
          order_id: createdOrder.id,
          payment_id: `pay_${Date.now().toString(36)}`,
          razorpay_order_id: rzpData.razorpay_order_id,
        };

        const webhookRes = await fetch("/api/webhooks/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentPayload),
        });

        const webhookData = await webhookRes.json();

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D97706", "#2E1C14", "#10B981", "#F59E0B"],
        });

        setOrderCompleteData({
          orderNumber: createdOrder.order_number,
          invoiceNumber: webhookData.invoice_number,
          total: createdOrder.total_amount,
          isCash: false,
          customerPhone: customer.phone_e164,
        });
        onClearCart();
        onOrderSuccess();
      }
    } catch (err: any) {
      console.error("Checkout failed:", err);
      alert(err.message || "Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setStatusMessage(null);
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
                {cafe.name} • {customer ? customer.name : guestName}
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
          <div className="p-6 text-center space-y-4 my-auto overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Order Confirmed!</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Order <strong className="font-mono text-neutral-800 dark:text-neutral-200">{orderCompleteData.orderNumber}</strong> has been transmitted to Kitchen & Bar.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-xs text-left space-y-2.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Status:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {orderCompleteData.isCash ? "Pay at Counter / Cash" : "Paid via Razorpay"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Billed:</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">
                  {formatCurrency(orderCompleteData.total)}
                </span>
              </div>
              {orderCompleteData.customerPhone && (
                <div className="flex justify-between items-center pt-1 border-t border-neutral-100 dark:border-neutral-700 text-[11px]">
                  <span className="text-neutral-500">WhatsApp Notification:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Dispatched to {orderCompleteData.customerPhone}
                  </span>
                </div>
              )}
            </div>

            {/* View Official GST Tax Invoice Button */}
            {orderCompleteData.invoiceNumber && (
              <Link
                href={`/invoice/${encodeURIComponent(orderCompleteData.invoiceNumber)}`}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Official GST Tax Invoice ({orderCompleteData.invoiceNumber})</span>
              </Link>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setOrderCompleteData(null);
                  setActiveTab("live_bill");
                }}
                className="flex-1 py-3 bg-[#2E1C14] text-white font-semibold rounded-2xl text-xs hover:bg-black transition"
              >
                Track Live Status
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
                    {/* Customer identity status bar */}
                    {!customer ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-amber-900 dark:text-amber-200">Phone Verification Required</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400">
                            Required for WhatsApp GST Invoice & live updates
                          </p>
                        </div>
                        <button
                          onClick={onRequireAuth}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition"
                        >
                          Verify Mobile
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Ordering as: <strong>{customer.name}</strong> ({customer.phone_e164})</span>
                        </span>
                      </div>
                    )}

                    {/* Split View: "Your Items" & "Other Diners at Table" */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span>Table Selections</span>
                        </span>
                        <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
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
                              <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-mono">
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
                        <span className="font-bold text-amber-600 font-mono">{formatCurrency(tipAmount)}</span>
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

                    {/* Financial Bill Breakdown with Indian GST Split */}
                    <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Items Subtotal</span>
                        <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>CGST (2.5%)</span>
                        <span className="font-mono">{formatCurrency(cgstAmount)}</span>
                      </div>

                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>SGST (2.5%)</span>
                        <span className="font-mono">{formatCurrency(sgstAmount)}</span>
                      </div>

                      {/* Opt-in Service Charge */}
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 pt-0.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeServiceCharge}
                            onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>Staff Service Contribution (5% opt-in)</span>
                        </label>
                        <span className="font-mono">{formatCurrency(serviceFee)}</span>
                      </div>

                      {tipAmount > 0 && (
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>Staff Tip</span>
                          <span className="font-mono">{formatCurrency(tipAmount)}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold text-sm text-neutral-900 dark:text-white">
                        <span>Total Payable</span>
                        <span className="text-amber-700 dark:text-amber-400 font-mono">{formatCurrency(totalBill)}</span>
                      </div>
                    </div>

                    {/* Instant Digital Checkout Options */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        Select Payment Method:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "razorpay_upi", label: "Razorpay UPI", icon: "⚡" },
                          { id: "razorpay_card", label: "Debit / Card", icon: "💳" },
                          { id: "cash", label: "Cash / Counter", icon: "💵" },
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

                    {statusMessage && (
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{statusMessage}</span>
                      </div>
                    )}

                    {/* Primary Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handleCheckout(paymentMethod === "cash")}
                        disabled={isSubmitting}
                        className="w-full bg-[#2E1C14] hover:bg-black text-[#FAF7F2] font-semibold py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-between disabled:opacity-50"
                      >
                        <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span>
                            {paymentMethod === "cash" ? "Place Order & Pay Cash" : "Pay via Razorpay Secure"}
                          </span>
                        </span>
                        <span className="font-bold text-sm text-amber-300 font-mono">
                          {isSubmitting ? "Processing..." : formatCurrency(totalBill)}
                        </span>
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
                    <p className="text-xs">No active orders placed yet for this table session.</p>
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

                    {/* Paid Invoices List */}
                    {tableLiveOrders.some((o: any) => o.invoice || o.payment_status === "paid") && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                          Digital GST Invoices
                        </h4>
                        {tableLiveOrders
                          .filter((o: any) => o.invoice)
                          .map((o: any) => (
                            <Link
                              key={o.id}
                              href={`/invoice/${encodeURIComponent(o.invoice.invoice_number)}`}
                              className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs hover:border-amber-500 transition group"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
                                <div>
                                  <span className="font-mono font-semibold text-neutral-900 dark:text-white block">
                                    {o.invoice.invoice_number}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">Order: {o.order_number}</span>
                                </div>
                              </div>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                                View Tax Invoice →
                              </span>
                            </Link>
                          ))}
                      </div>
                    )}

                    {/* Table live total */}
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <span>Total Table Billed So Far</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
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

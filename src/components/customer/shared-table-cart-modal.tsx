"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Trash2,
  ChefHat,
  Coffee,
  Users,
  FileText,
  ShieldCheck,
  Send,
  Loader2,
  Receipt,
  Droplets,
  Bell,
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
  const [includeServiceCharge, setIncludeServiceCharge] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [billRequestedMessage, setBillRequestedMessage] = useState<string | null>(null);
  const [orderCompleteData, setOrderCompleteData] = useState<{
    orderNumber: string;
    total: number;
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
  const totalBill = Number((cartSubtotal + cgstAmount + sgstAmount + serviceFee).toFixed(2));

  // Submitted Live Items from tableLiveOrders
  const allSubmittedItems: OrderItem[] = tableLiveOrders.flatMap((o) => o.items || []);
  const liveTotalAmount = tableLiveOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    // Check if phone authentication is completed
    if (!customer) {
      onRequireAuth();
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Placing order directly with kitchen & bar...");

    try {
      // 1. Submit Order to Server (Server-side price authority, inventory deduction, status: unpaid)
      const orderPayload = {
        qr_token: qrToken,
        customer_name: customer.name || guestName,
        service_charge_opt_in: includeServiceCharge,
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

      // Celebrate order submission
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#D97706", "#2E1C14", "#10B981", "#F59E0B"],
      });

      setOrderCompleteData({
        orderNumber: createdOrder.order_number,
        total: createdOrder.total_amount,
        customerPhone: customer.phone_e164,
      });

      onClearCart();
      onOrderSuccess();
    } catch (err: any) {
      console.error("Order submission failed:", err);
      alert(err.message || "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  };

  const handleRequestBill = () => {
    onTriggerService("bill");
    setBillRequestedMessage("Bill requested! A server is bringing your check to Table #" + table.table_number);
    setTimeout(() => setBillRequestedMessage(null), 6000);
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
            <span>Current Order Draft</span>
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
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Order Sent to Kitchen!</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Order <strong className="font-mono text-neutral-800 dark:text-neutral-200">#{orderCompleteData.orderNumber}</strong> is now being queued and prepared.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-xs text-left space-y-2.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Status:</span>
                <span className="font-semibold text-amber-600 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  Unpaid (Pay Offline at Counter/Table)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimated Total:</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">
                  {formatCurrency(orderCompleteData.total)}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700 text-[11px] text-neutral-400">
                Staff will collect payment (Cash, UPI, or Card) when you request the bill, and generate your official GST Tax Invoice.
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
                Track Live Status & View Bill
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
              /* Current Draft Cart View */
              <>
                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">Your order draft is empty</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Explore our handcrafted brews and kitchen specials to add items.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Draft Items List */}
                    <div className="space-y-2.5">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-start justify-between gap-3 shadow-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                {item.quantity}x {item.item_name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500 font-mono">
                                {formatCurrency(item.unit_price)}
                              </span>
                            </div>

                            {item.selected_modifiers?.length > 0 && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
                                + {item.selected_modifiers.map((m) => m.option_name).join(", ")}
                              </p>
                            )}

                            {item.notes && (
                              <p className="text-[10px] text-neutral-400 mt-0.5 italic">
                                &quot;{item.notes}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </span>
                            <button
                              onClick={() => onRemoveCartItem(item.id)}
                              className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Service charge toggle */}
                    <div className="p-3 bg-white dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                          5% Service Charge (Discretionary)
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Directly distributed to baristas and waitstaff
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeServiceCharge}
                        onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>

                    {/* Cart Financial Summary */}
                    <div className="p-3.5 bg-white dark:bg-neutral-800/90 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Items Subtotal</span>
                        <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>CGST (2.5%) + SGST (2.5%)</span>
                        <span className="font-mono">{formatCurrency(cgstAmount + sgstAmount)}</span>
                      </div>
                      {includeServiceCharge && (
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>Service Charge (5%)</span>
                          <span className="font-mono">{formatCurrency(serviceFee)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold text-sm text-neutral-900 dark:text-white">
                        <span>Estimated Order Total</span>
                        <span className="text-amber-700 dark:text-amber-400 font-mono">
                          {formatCurrency(totalBill)}
                        </span>
                      </div>
                    </div>

                    {statusMessage && (
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{statusMessage}</span>
                      </div>
                    )}

                    {/* Primary Button: Send Order to Kitchen */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className="w-full bg-[#2E1C14] hover:bg-black text-[#FAF7F2] font-semibold py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-between disabled:opacity-50"
                      >
                        <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <Send className="w-4 h-4 text-amber-400" />
                          <span>Place Order to Kitchen</span>
                        </span>
                        <span className="font-bold text-sm text-amber-300 font-mono">
                          {isSubmitting ? "Transmitting..." : formatCurrency(totalBill)}
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

                {billRequestedMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{billRequestedMessage}</span>
                  </div>
                )}

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

                    {/* Paid / Settled Invoices List */}
                    {tableLiveOrders.some((o: any) => o.invoice || o.payment_status === "paid") && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                          Digital GST Tax Invoices
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
                                  <span className="text-[10px] text-neutral-400">Order: #{o.order_number}</span>
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
                      <span>Total Billed to Table So Far</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                        {formatCurrency(liveTotalAmount)}
                      </span>
                    </div>

                    {/* Request Bill Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleRequestBill}
                        className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Request Bill / Call Staff for Payment</span>
                      </button>
                      <p className="text-[10px] text-neutral-400 text-center mt-1">
                        Staff will bring the check or EDC machine to your table (Cash, UPI, Card accepted).
                      </p>
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
                <Droplets className="w-3.5 h-3.5" />
                <span>Request Water</span>
              </button>
              <button
                type="button"
                onClick={() => onTriggerService("call_server")}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1.5 transition"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Call Server</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

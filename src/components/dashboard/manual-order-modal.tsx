"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Coffee, ShoppingCart } from "lucide-react";
import { MenuItem, Table } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface ManualOrderModalProps {
  table: Table;
  menuItems: MenuItem[];
  onClose: () => void;
  onSubmit: (orderPayload: any) => Promise<void>;
}

export function ManualOrderModal({
  table,
  menuItems,
  onClose,
  onSubmit,
}: ManualOrderModalProps) {
  const [customerName, setCustomerName] = useState("Walk-in Guest");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQtyChange = (itemId: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const orderItemsList = Object.entries(selectedItems).map(([itemId, qty]) => {
    const item = menuItems.find((m) => m.id === itemId)!;
    return {
      menu_item_id: item.id,
      item_name: item.name,
      station: item.station,
      quantity: qty,
      unit_price: item.base_price,
      selected_modifiers: [],
      status: "pending",
      guest_name: customerName,
      guest_id: "staff-manual",
    };
  });

  const subtotal = orderItemsList.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const service = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax + service).toFixed(2));

  const handleConfirm = async () => {
    if (orderItemsList.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        table_id: table.id,
        table_number: table.table_number,
        items: orderItemsList,
        customer_name: customerName,
        subtotal,
        tax_amount: tax,
        service_fee: service,
        tip_amount: 0,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cash" ? "cash_pending" : "paid",
        status: "preparing",
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-[#2E1C14] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Manual Order: Table #{table.table_number}</h3>
              <p className="text-[11px] text-neutral-300">Staff POS Walk-in / Phone Override</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Diner details */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-neutral-500">Customer Name / Reference</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              />
            </div>
            <div className="w-36 space-y-1">
              <label className="text-[11px] font-semibold text-neutral-500">Payment</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                <option value="cash">Cash Pending</option>
                <option value="card">Card Terminal</option>
                <option value="upi">UPI / Direct</option>
              </select>
            </div>
          </div>

          {/* Menu items picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Select Menu Items</label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {menuItems.map((item) => {
                const qty = selectedItems[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500">{formatCurrency(item.base_price)} • {item.station}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <button
                          onClick={() => handleQtyChange(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      <span className="w-5 text-center font-bold text-xs">{qty}</span>
                      <button
                        onClick={() => handleQtyChange(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-[#2E1C14] text-white hover:bg-black flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Breakdown */}
          {orderItemsList.length > 0 && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal ({orderItemsList.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Tax & Service (13%)</span>
                <span>{formatCurrency(tax + service)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-neutral-900 dark:text-white pt-1 border-t border-neutral-200 dark:border-neutral-700">
                <span>Total Due</span>
                <span className="text-amber-600">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={orderItemsList.length === 0 || isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-[#2E1C14] hover:bg-black text-white text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 shadow"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span>Send to Kitchen ({formatCurrency(total)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}

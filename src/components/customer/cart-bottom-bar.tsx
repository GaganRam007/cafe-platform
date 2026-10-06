"use client";

import React from "react";
import { ShoppingBag, ChevronRight, Bell, Droplets } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CartBottomBarProps {
  itemCount: number;
  totalAmount: number;
  onOpenCart: () => void;
  onRequestWater: () => void;
  onCallServer: () => void;
  hasActiveOrder: boolean;
}

export function CartBottomBar({
  itemCount,
  totalAmount,
  onOpenCart,
  onRequestWater,
  onCallServer,
  hasActiveOrder,
}: CartBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#FAF7F2]/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-[#E8E1D9] dark:border-neutral-800 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center gap-2">
        {/* Quick Table Service Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onRequestWater}
            className="w-11 h-12 rounded-2xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center text-[10px] font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 transition active:scale-95 shadow-sm"
            title="Request fresh water for table"
          >
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-[9px] mt-0.5">Water</span>
          </button>

          <button
            type="button"
            onClick={onCallServer}
            className="w-11 h-12 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 flex flex-col items-center justify-center text-[10px] font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/50 transition active:scale-95 shadow-sm"
            title="Call server to your table"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-[9px] mt-0.5">Server</span>
          </button>
        </div>

        {/* View Cart & Checkout Button */}
        <button
          type="button"
          onClick={onOpenCart}
          className={`flex-1 h-12 px-4 rounded-2xl font-semibold flex items-center justify-between text-xs sm:text-sm shadow-lg transition active:scale-[0.99] ${
            itemCount > 0
              ? "bg-[#2E1C14] hover:bg-black text-[#FAF7F2]"
              : hasActiveOrder
              ? "bg-emerald-800 hover:bg-emerald-900 text-white"
              : "bg-neutral-300 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-500 text-neutral-900 text-[10px] font-extrabold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span>
              {itemCount > 0
                ? "View Table Cart"
                : hasActiveOrder
                ? "View Live Table Bill"
                : "Cart Empty"}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold">
            <span>{totalAmount > 0 ? formatCurrency(totalAmount) : "Menu"}</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </div>
        </button>
      </div>
    </div>
  );
}

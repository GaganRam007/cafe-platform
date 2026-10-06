"use client";

import React from "react";
import Image from "next/image";
import { Plus, SlidersHorizontal, AlertCircle } from "lucide-react";
import { MenuItem } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const isSoldOut = !item.is_available || item.stock_count <= 0;
  const isLowStock = !isSoldOut && item.stock_count > 0 && item.stock_count <= 5;
  const hasModifiers = item.modifier_groups && item.modifier_groups.length > 0;

  return (
    <div
      onClick={() => !isSoldOut && onSelect(item)}
      className={`group relative bg-white dark:bg-neutral-900 border border-[#E8E1D9] dark:border-neutral-800 rounded-2xl p-3.5 shadow-sm transition-all duration-200 flex gap-3.5 items-start ${
        isSoldOut
          ? "opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-900/50"
          : "hover:shadow-md hover:border-amber-400/50 cursor-pointer active:scale-[0.99]"
      }`}
    >
      {/* Item Image with Badges */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 112px, 128px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />

        {/* Dietary Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
          {item.dietary_tags.map((tag) => (
            <span
              key={tag}
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                tag === "veg"
                  ? "bg-emerald-600/90 text-white"
                  : tag === "vegan"
                  ? "bg-green-700/90 text-white"
                  : tag === "gluten-free"
                  ? "bg-amber-600/90 text-white"
                  : "bg-red-600/90 text-white"
              }`}
            >
              {tag === "gluten-free" ? "GF" : tag}
            </span>
          ))}
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-1 text-center">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-600/90 px-2 py-0.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-2">
            {item.description}
          </p>
        </div>

        {/* Bottom row: Price, Stock status, Action trigger */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <div className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 text-[#2E1C14] dark:text-amber-200">
              {formatCurrency(item.base_price)}
            </div>

            {isLowStock && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                <AlertCircle className="w-2.5 h-2.5" />
                Only {item.stock_count} left
              </span>
            )}
          </div>

          <div>
            {isSoldOut ? (
              <span className="text-xs text-neutral-400 font-medium px-2 py-1">Unavailable</span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition active:scale-95 ${
                  hasModifiers
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                    : "bg-[#2E1C14] text-white hover:bg-neutral-800 dark:bg-amber-600 dark:hover:bg-amber-500"
                }`}
              >
                {hasModifiers ? (
                  <>
                    <SlidersHorizontal className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    <span>Customize</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

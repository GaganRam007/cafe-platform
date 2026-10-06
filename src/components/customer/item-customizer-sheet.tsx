"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, Check, MessageSquare } from "lucide-react";
import { MenuItem, SelectedModifier } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface ItemCustomizerSheetProps {
  item: MenuItem | null;
  guestName: string;
  guestId: string;
  onClose: () => void;
  onAddToCart: (configuredItem: {
    menu_item_id: string;
    item_name: string;
    station: "barista" | "kitchen";
    quantity: number;
    unit_price: number;
    selected_modifiers: SelectedModifier[];
    notes?: string;
    guest_name: string;
    guest_id: string;
  }) => void;
}

export function ItemCustomizerSheet({
  item,
  guestName,
  guestId,
  onClose,
  onAddToCart,
}: ItemCustomizerSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");

  // Initialize default modifier selections
  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    setNotes("");
    const initialMods: Record<string, string[]> = {};

    item.modifier_groups?.forEach((group) => {
      if (group.selection_type === "single") {
        const defaultOpt = group.options.find((o) => o.is_default) || group.options[0];
        if (defaultOpt) {
          initialMods[group.id] = [defaultOpt.id];
        }
      } else {
        const defaultOpts = group.options.filter((o) => o.is_default).map((o) => o.id);
        initialMods[group.id] = defaultOpts;
      }
    });

    setSelectedModifiers(initialMods);
  }, [item]);

  if (!item) return null;

  // Toggle modifier
  const handleSelectOption = (groupId: string, optionId: string, isSingle: boolean) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (isSingle) {
        return { ...prev, [groupId]: [optionId] };
      } else {
        const exists = current.includes(optionId);
        const updated = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
        return { ...prev, [groupId]: updated };
      }
    });
  };

  // Calculate unit price with modifier price deltas
  let modifierPriceSum = 0;
  const flatSelectedList: SelectedModifier[] = [];

  item.modifier_groups?.forEach((group) => {
    const selectedOptionIds = selectedModifiers[group.id] || [];
    selectedOptionIds.forEach((optId) => {
      const opt = group.options.find((o) => o.id === optId);
      if (opt) {
        modifierPriceSum += opt.price_delta;
        flatSelectedList.push({
          group_id: group.id,
          group_name: group.name,
          option_id: opt.id,
          option_name: opt.name,
          price_delta: opt.price_delta,
        });
      }
    });
  });

  const unitPrice = item.base_price + modifierPriceSum;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart({
      menu_item_id: item.id,
      item_name: item.name,
      station: item.station,
      quantity,
      unit_price: Number(unitPrice.toFixed(2)),
      selected_modifiers: flatSelectedList,
      notes: notes.trim() || undefined,
      guest_name: guestName,
      guest_id: guestId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content Container */}
      <div className="relative w-full max-w-lg bg-[#FAF7F2] dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#E8E1D9] dark:border-neutral-800 animate-slide-up">
        {/* Header with image */}
        <div className="relative h-44 sm:h-52 w-full bg-neutral-200 shrink-0">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{item.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-amber-300 font-bold text-base">
                {formatCurrency(item.base_price)}
              </span>
              <span className="text-xs text-neutral-300">• {item.prep_time_minutes} min prep</span>
              {item.calories && (
                <span className="text-xs text-neutral-300">• {item.calories} kcal</span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Modifier Options */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {item.description}
          </p>

          {item.modifier_groups?.map((group) => {
            const isSingle = group.selection_type === "single";
            const currentSelected = selectedModifiers[group.id] || [];

            return (
              <div key={group.id} className="space-y-2.5 pt-2 border-t border-[#E8E1D9] dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-[#2E1C14] dark:text-neutral-200">
                    {group.name}
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {group.is_required ? "Required" : "Optional"} • {isSingle ? "Pick 1" : "Multiple"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.options.map((option) => {
                    const isChecked = currentSelected.includes(option.id);
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => handleSelectOption(group.id, option.id, isSingle)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                          isChecked
                            ? "bg-amber-500/15 border-amber-600 dark:border-amber-500 text-neutral-900 dark:text-white ring-1 ring-amber-500"
                            : "bg-white dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-${isSingle ? "full" : "md"} border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-neutral-400 dark:border-neutral-500"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium truncate">{option.name}</span>
                        </div>
                        {option.price_delta > 0 && (
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0 ml-2">
                            +{formatCurrency(option.price_delta)}
                          </span>
                        )}
                        {option.price_delta < 0 && (
                          <span className="text-xs font-medium text-emerald-600 shrink-0 ml-2">
                            -{formatCurrency(Math.abs(option.price_delta))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Instructions Field */}
          <div className="pt-2 border-t border-[#E8E1D9] dark:border-neutral-800 space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Special Instructions for Barista / Kitchen</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Extra hot, oat foam on side, allergen notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Sticky Bottom Bar: Quantity & Add Button */}
        <div className="p-4 border-t border-[#E8E1D9] dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-neutral-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAdd}
            className="flex-1 bg-[#2E1C14] hover:bg-black text-[#FAF7F2] font-semibold py-3 px-4 rounded-2xl shadow-lg transition flex items-center justify-between active:scale-[0.99]"
          >
            <span className="text-sm">Add for {guestName}</span>
            <span className="text-sm font-bold text-amber-400">
              {formatCurrency(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

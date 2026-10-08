"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  RotateCcw,
  AlertTriangle,
  Loader2,
  DollarSign,
  Package,
} from "lucide-react";
import { MenuItem } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface MenuManagementProps {
  menuItems: MenuItem[];
  categories?: Array<{ id: string; name: string }>;
  onUpdateItem: (itemId: string, updates: { is_available?: boolean; base_price?: number; stock_count?: number }) => Promise<void>;
}

export function MenuManagement({
  menuItems,
  categories = [],
  onUpdateItem,
}: MenuManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editStock, setEditStock] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleStartEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditPrice(item.base_price.toString());
    setEditStock(item.stock_count.toString());
  };

  const handleSaveEdit = async (itemId: string) => {
    setIsSaving(true);
    try {
      const price = parseFloat(editPrice);
      const stock = parseInt(editStock, 10);
      await onUpdateItem(itemId, {
        base_price: isNaN(price) ? undefined : price,
        stock_count: isNaN(stock) ? undefined : stock,
      });
      setEditingItemId(null);
      setStatusMessage("Menu item updated successfully!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await onUpdateItem(item.id, {
        is_available: !item.is_available,
      });
    } catch (err: any) {
      alert(err.message || "Failed to toggle availability");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Menu & Pricing Management
            </h3>
            <p className="text-[11px] text-neutral-500">
              Update pricing, inventory stock limits, and toggle 86&apos;d availability in realtime
            </p>
          </div>
        </div>

        {statusMessage && (
          <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 font-medium">
            {statusMessage}
          </span>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search dishes, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Table / Grid */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">Stock Count</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredItems.map((item) => {
                const isEditing = editingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 line-clamp-1">
                        {item.description}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {item.dietary_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full font-semibold text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {item.station}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-20 p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono outline-none"
                        />
                      ) : (
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {formatCurrency(item.base_price)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-16 p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono outline-none"
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            item.stock_count <= 5 ? "text-red-500" : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {item.stock_count} units
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                          item.is_available
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        }`}
                      >
                        {item.is_available ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>In Menu</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span>86&apos;d (Sold Out)</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={isSaving}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="p-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
                          title="Edit Price & Stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

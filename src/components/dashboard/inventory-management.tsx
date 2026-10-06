"use client";

import React, { useState } from "react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  FileText,
  Truck,
  Plus,
  Trash2,
  DollarSign,
  Layers,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import {
  Ingredient,
  RecipeItem,
  MenuItem,
  Vendor,
  WastageLog,
  PurchaseOrder,
} from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface InventoryManagementProps {
  ingredients: Ingredient[];
  recipeItems: RecipeItem[];
  menuItems: MenuItem[];
  vendors: Vendor[];
  wastageLogs: WastageLog[];
  purchaseOrders: PurchaseOrder[];
  onLogWastage: (params: {
    ingredient_id: string;
    quantity: number;
    reason: WastageLog["reason"];
    logged_by: string;
  }) => Promise<void>;
  onCreatePO: (params: { vendor_id: string; items: any[] }) => Promise<void>;
}

export function InventoryManagement({
  ingredients,
  recipeItems,
  menuItems,
  vendors,
  wastageLogs,
  purchaseOrders,
  onLogWastage,
  onCreatePO,
}: InventoryManagementProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "recipes" | "wastage" | "po">("catalog");
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);

  // Form states
  const [wasteIngredientId, setWasteIngredientId] = useState(ingredients[0]?.id || "");
  const [wasteQty, setWasteQty] = useState<string>("100");
  const [wasteReason, setWasteReason] = useState<WastageLog["reason"]>("expired");
  const [wasteStaff, setWasteStaff] = useState("Staff");
  const [isSubmittingWaste, setIsSubmittingWaste] = useState(false);

  // PO form state
  const [poVendorId, setPoVendorId] = useState(vendors[0]?.id || "");
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);

  // Low stock calculation
  const lowStockItems = ingredients.filter((i) => i.current_stock <= i.reorder_level);
  const totalStockValue = ingredients.reduce((sum, i) => sum + i.current_stock * i.unit_cost, 0);
  const totalWasteLoss = wastageLogs.reduce((sum, w) => sum + w.cost, 0);

  const handleWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteIngredientId || !wasteQty) return;
    setIsSubmittingWaste(true);
    try {
      await onLogWastage({
        ingredient_id: wasteIngredientId,
        quantity: Number(wasteQty),
        reason: wasteReason,
        logged_by: wasteStaff,
      });
      setShowWasteModal(false);
      setWasteQty("100");
    } finally {
      setIsSubmittingWaste(false);
    }
  };

  const handleQuickPOGenerate = async (vendorId: string) => {
    setIsSubmittingPO(true);
    try {
      const vendorIngredients = ingredients.filter((i) => i.vendor_id === vendorId || i.current_stock <= i.reorder_level);
      const items = vendorIngredients.map((ing) => ({
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity: Math.max(1, Math.round(ing.reorder_level * 2)),
        unit: ing.unit,
        unit_cost: ing.unit_cost,
        total_cost: Number((Math.max(1, Math.round(ing.reorder_level * 2)) * ing.unit_cost).toFixed(2)),
      }));

      await onCreatePO({ vendor_id: vendorId, items });
      setShowPOModal(false);
    } finally {
      setIsSubmittingPO(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Inventory Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Total Stock Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-neutral-900 dark:text-white">
            {formatCurrency(totalStockValue)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Across {ingredients.length} raw inventory SKUs</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Low-Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            {lowStockItems.length} Items Below Reorder
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300 mt-0.5">Automated PO reorder triggers active</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Wastage & Shrinkage</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-extrabold text-red-600 dark:text-red-400">
            {formatCurrency(totalWasteLoss)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">{wastageLogs.length} logged incidents this cycle</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Active Purchase Orders</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
            {purchaseOrders.length} In-Transit
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Connected to {vendors.length} certified vendors</p>
        </div>
      </div>

      {/* Tabs and Action Buttons Bar */}
      <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "catalog"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Raw Materials ({ingredients.length})
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "recipes"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Recipe Costing ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab("wastage")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "wastage"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Shrinkage Log ({wastageLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("po")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "po"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Vendor POs ({purchaseOrders.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowWasteModal(true)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-800 flex items-center justify-center gap-1.5 transition"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Log Wastage</span>
          </button>

          <button
            onClick={() => setShowPOModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#2E1C14] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate PO</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Raw Materials Catalog */}
      {activeTab === "catalog" && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              Raw Ingredients Inventory Catalog
            </h4>
            <span className="text-xs text-neutral-500">Unit-level tracking (g, ml, pcs)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 uppercase font-bold text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Reorder Level</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4 text-right">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {ingredients.map((ing) => {
                  const isLow = ing.current_stock <= ing.reorder_level;
                  const totalVal = ing.current_stock * ing.unit_cost;

                  return (
                    <tr
                      key={ing.id}
                      className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition ${
                        isLow ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                        {ing.name}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">{ing.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {ing.current_stock.toLocaleString()} {ing.unit}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 font-mono">
                        {ing.reorder_level.toLocaleString()} {ing.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                        ${ing.unit_cost} / {ing.unit}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(totalVal)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" /> Reorder Triggered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Recipe-to-Menu Costing */}
      {activeTab === "recipes" && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Recipe-to-Menu Mapping & Automatic Stock Deductions
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Each completed order automatically calculates COGS and deducts raw materials from inventory
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Auto-Deduction Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map((item) => {
              const recipes = recipeItems.filter((r) => r.menu_item_id === item.id);
              // Calculate estimated COGS
              let cogs = 0;
              recipes.forEach((rec) => {
                const ing = ingredients.find((i) => i.id === rec.ingredient_id);
                if (ing) {
                  cogs += rec.quantity_required * ing.unit_cost;
                }
              });
              const grossProfit = item.base_price - cogs;
              const marginPercent = ((grossProfit / item.base_price) * 100).toFixed(1);

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 dark:text-white">
                        {item.name}
                      </h5>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                        {item.station} • {recipes.length} ingredients
                      </span>
                    </div>
                    <span className="font-extrabold text-sm text-[#2E1C14] dark:text-amber-400">
                      {formatCurrency(item.base_price)}
                    </span>
                  </div>

                  {/* Recipe BOM (Bill of Materials) */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">BOM Deductions:</span>
                    {recipes.map((rec) => {
                      const ing = ingredients.find((i) => i.id === rec.ingredient_id);
                      return (
                        <div key={rec.id} className="flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>• {ing?.name || rec.ingredient_id}</span>
                          <span className="font-mono font-medium">
                            {rec.quantity_required} {rec.unit || ing?.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost & Margin Analysis */}
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Est. COGS:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(cogs)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Gross Margin:</span>
                      <span className="font-bold text-emerald-600">{marginPercent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Shrinkage & Wastage Log */}
      {activeTab === "wastage" && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              Wastage & Shrinkage Incident Log
            </h4>
            <span className="text-xs text-red-600 font-bold">
              Total Recorded Loss: {formatCurrency(totalWasteLoss)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 uppercase font-bold text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Ingredient Wasted</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Financial Loss</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {wastageLogs.map((waste) => (
                  <tr key={waste.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                      {waste.ingredient_name}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {waste.quantity} {waste.unit}
                    </td>
                    <td className="py-3 px-4 font-bold text-red-600">
                      -{formatCurrency(waste.cost)}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {waste.reason.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500">{waste.logged_by}</td>
                    <td className="py-3 px-4 text-right text-neutral-400">
                      {new Date(waste.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Purchase Orders & Vendor Directory */}
      {activeTab === "po" && (
        <div className="space-y-4">
          {/* Vendor Directory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <h5 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                    {vendor.name}
                  </h5>
                  <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950 font-bold px-2 py-0.5 rounded-full">
                    {vendor.lead_time_days}d Lead
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">{vendor.category}</p>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-0.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <p>Rep: {vendor.contact_person}</p>
                  <p className="truncate">{vendor.email}</p>
                </div>
                <button
                  onClick={() => handleQuickPOGenerate(vendor.id)}
                  disabled={isSubmittingPO}
                  className="w-full mt-2 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>1-Click Reorder PO</span>
                </button>
              </div>
            ))}
          </div>

          {/* Active PO List */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Purchase Order Requisitions History
              </h4>
              <span className="text-xs text-neutral-500">Auto-generated upon stock depletion</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 uppercase font-bold text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Items Ordered</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Expected Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                        {po.po_number}
                      </td>
                      <td className="py-3 px-4 font-medium">{po.vendor_name}</td>
                      <td className="py-3 px-4 text-neutral-500">
                        {po.items.map((i) => `${i.quantity}${i.unit} ${i.ingredient_name}`).join(", ")}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(po.total_cost)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {po.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-500">
                        {po.expected_delivery || "Standard"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Log Wastage Modal */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setShowWasteModal(false)} />
          <form
            onSubmit={handleWasteSubmit}
            className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                <h4 className="font-bold text-sm">Log Shrinkage & Wastage</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowWasteModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Ingredient</label>
                <select
                  value={wasteIngredientId}
                  onChange={(e) => setWasteIngredientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.current_stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Quantity to Deduct</label>
                <input
                  type="number"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  min="1"
                  required
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Reason</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                >
                  <option value="expired">Expired / Sour</option>
                  <option value="spill">Spill / Dropped</option>
                  <option value="machine_purge">Espresso Machine Purge</option>
                  <option value="defective">Defective / Unbaked</option>
                  <option value="other">Other Incident</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Staff Member</label>
                <input
                  type="text"
                  value={wasteStaff}
                  onChange={(e) => setWasteStaff(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingWaste}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Confirm Deduction & Log Loss
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Generate PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setShowPOModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
            <div className="p-4 bg-[#2E1C14] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">One-Click PO Requisition</h4>
              </div>
              <button
                onClick={() => setShowPOModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-neutral-500">
                Select vendor to automatically compile low-stock materials into an official Purchase Order requisition.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Target Vendor</label>
                <select
                  value={poVendorId}
                  onChange={(e) => setPoVendorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-1">
                <span className="font-bold text-neutral-700 dark:text-neutral-300 block">Trigger Summary:</span>
                <p className="text-neutral-500">
                  Calculates 2x threshold replenishment buffer and emails automated purchase requisition with tracking invoice.
                </p>
              </div>

              <button
                onClick={() => handleQuickPOGenerate(poVendorId)}
                disabled={isSubmittingPO}
                className="w-full py-3 bg-[#2E1C14] hover:bg-black text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Confirm & Send PO to Vendor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

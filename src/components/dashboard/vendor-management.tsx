"use client";

import React, { useState } from "react";
import {
  Truck,
  Phone,
  Mail,
  Clock,
  DollarSign,
  PlusCircle,
  FileCheck,
  AlertCircle,
  Package,
} from "lucide-react";
import { Vendor, PurchaseOrder } from "@/types/cafe";
import { formatCurrency } from "@/lib/utils";

interface VendorManagementProps {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  onCreatePO?: (payload: any) => Promise<void>;
}

export function VendorManagement({
  vendors,
  purchaseOrders,
  onCreatePO,
}: VendorManagementProps) {
  const [selectedTab, setSelectedTab] = useState<"vendors" | "orders">("vendors");

  return (
    <div className="space-y-4">
      {/* Top Banner & Tab Controls */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Vendor & Procurement Management
            </h3>
            <p className="text-[11px] text-neutral-500">
              Manage suppliers, lead times, purchase orders, and replenishment contracts
            </p>
          </div>
        </div>

        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
          <button
            onClick={() => setSelectedTab("vendors")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              selectedTab === "vendors"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setSelectedTab("orders")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              selectedTab === "orders"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>
      </div>

      {selectedTab === "vendors" ? (
        /* Vendors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {vendor.name}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200">
                    Lead: {vendor.lead_time_days} days
                  </span>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-neutral-500">Contact:</span>
                    <span>{vendor.contact_person}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Min Order: <strong>{formatCurrency(vendor.min_order_amount || 0)}</strong></span>
                  <span>Payment: <strong>{vendor.payment_terms || "Net 30"}</strong></span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-neutral-400 block mb-1">Supplied Categories:</span>
                <div className="flex flex-wrap gap-1">
                  {(vendor.items_supplied || [vendor.category]).map((item: string) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Purchase Orders List */
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                        {po.po_number}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                        {po.vendor_name}
                      </td>
                      <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                        {po.created_at}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            po.status === "received"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                              : po.status === "submitted" || (po.status as string) === "ordered"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-neutral-100 text-neutral-600 border border-neutral-300"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(po.total_cost || po.total_amount || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

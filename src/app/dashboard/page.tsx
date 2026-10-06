"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coffee, Sparkles } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { FloorManagement } from "@/components/dashboard/floor-management";
import { KDSView } from "@/components/dashboard/kds-view";
import { InventoryManagement } from "@/components/dashboard/inventory-management";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { UserRole, TableStatus, OrderStatus, OrderItemStatus } from "@/types/cafe";

export default function StaffDashboardPage() {
  const qc = useQueryClient();
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [currentTab, setCurrentTab] = useState<"floor" | "kds" | "inventory" | "analytics">("floor");
  const [selectedTableForQr, setSelectedTableForQr] = useState<number>(2);

  // Load Bootstrap Data via React Query
  const { data, isLoading } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/bootstrap");
      return res.json();
    },
  });

  const cafe = data?.cafe;
  const tables = data?.tables || [];
  const menuItems = data?.menuItems || [];
  const ingredients = data?.ingredients || [];
  const recipeItems = data?.recipeItems || [];
  const orders = data?.orders || [];
  const serviceRequests = data?.serviceRequests || [];
  const wastageLogs = data?.wastageLogs || [];
  const vendors = data?.vendors || [];
  const purchaseOrders = data?.purchaseOrders || [];
  const analytics = data?.analytics;

  // Table Status Mutation
  const updateTableMutation = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: string; status: TableStatus }) => {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Reset Table Mutation
  const resetTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Merge Tables Mutation
  const mergeTablesMutation = useMutation({
    mutationFn: async ({ target, source }: { target: number; source: number }) => {
      const res = await fetch(`/api/tables/tbl-${target}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", sourceTableNumber: source }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Split Tables Mutation
  const splitTablesMutation = useMutation({
    mutationFn: async (tableNumber: number) => {
      const res = await fetch(`/api/tables/tbl-${tableNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "split" }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Manual Order Mutation
  const createManualOrderMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Order Status Mutation (KDS)
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Order Item Status Mutation (KDS)
  const updateOrderItemStatusMutation = useMutation({
    mutationFn: async ({ orderId, itemId, status }: { orderId: string; itemId: string; status: OrderItemStatus }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, item_status: status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Resolve Service Request Mutation
  const resolveServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Log Wastage Mutation
  const logWastageMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/inventory/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Create PO Mutation
  const createPOMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/inventory/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bootstrap"] }),
  });

  // Handle role switch auto-adjust tabs
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === "barista") {
      setCurrentTab("kds");
    } else if (role === "waitstaff") {
      setCurrentTab("floor");
    }
  };

  if (isLoading || !cafe) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#2E1C14] text-amber-400 flex items-center justify-center animate-bounce mb-3 shadow-lg">
          <Coffee className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
          Loading Staff Terminal & Floor Systems...
        </h2>
        <p className="text-xs text-neutral-500 mt-1">Connecting to live KDS, inventory and table nodes</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* High Density Desktop Navigation */}
      <DashboardNav
        cafe={cafe}
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        serviceRequests={serviceRequests}
        onResolveServiceRequest={async (id) => {
          await resolveServiceMutation.mutateAsync(id);
        }}
        selectedTableForQr={selectedTableForQr}
        onChangeSelectedTableForQr={setSelectedTableForQr}
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === "floor" && (
          <FloorManagement
            cafe={cafe}
            tables={tables}
            menuItems={menuItems}
            onUpdateTableStatus={async (tableId, status) => {
              await updateTableMutation.mutateAsync({ tableId, status });
            }}
            onResetTable={async (tableId) => {
              await resetTableMutation.mutateAsync(tableId);
            }}
            onMergeTables={async (target, source) => {
              await mergeTablesMutation.mutateAsync({ target, source });
            }}
            onSplitTables={async (target) => {
              await splitTablesMutation.mutateAsync(target);
            }}
            onCreateManualOrder={async (orderPayload) => {
              await createManualOrderMutation.mutateAsync(orderPayload);
            }}
          />
        )}

        {currentTab === "kds" && (
          <KDSView
            orders={orders}
            onUpdateOrderStatus={async (orderId, status) => {
              await updateOrderStatusMutation.mutateAsync({ orderId, status });
            }}
            onUpdateItemStatus={async (orderId, itemId, status) => {
              await updateOrderItemStatusMutation.mutateAsync({ orderId, itemId, status });
            }}
          />
        )}

        {currentTab === "inventory" && (
          <InventoryManagement
            ingredients={ingredients}
            recipeItems={recipeItems}
            menuItems={menuItems}
            vendors={vendors}
            wastageLogs={wastageLogs}
            purchaseOrders={purchaseOrders}
            onLogWastage={async (payload) => {
              await logWastageMutation.mutateAsync(payload);
            }}
            onCreatePO={async (payload) => {
              await createPOMutation.mutateAsync(payload);
            }}
          />
        )}

        {currentTab === "analytics" && analytics && (
          <AnalyticsView analytics={analytics} />
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Coffee,
  Sparkles,
  Shield,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Lock,
  UserCheck,
} from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { FloorManagement } from "@/components/dashboard/floor-management";
import { KDSView } from "@/components/dashboard/kds-view";
import { InventoryManagement } from "@/components/dashboard/inventory-management";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { TableStatus, OrderStatus, OrderItemStatus } from "@/types/cafe";

export default function StaffDashboardPage() {
  const qc = useQueryClient();
  const [currentTab, setCurrentTab] = useState<"floor" | "kds" | "inventory" | "analytics">("floor");
  const [selectedTableForQr, setSelectedTableForQr] = useState<number>(1);

  // Login PIN Form State
  const [loginRole, setLoginRole] = useState<string>("admin");
  const [loginPin, setLoginPin] = useState<string>("1234");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth-enabled fetch helper supporting both cookies and Authorization header
  const authFetch = (url: string, options: RequestInit = {}) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("aura_staff_token") : null;
    const headers = new Headers(options.headers || {});
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  // 1. Load Protected Staff Dashboard Data via React Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard_bootstrap"],
    queryFn: async () => {
      const res = await authFetch("/api/dashboard/bootstrap");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load dashboard data");
      }
      return res.json();
    },
    retry: false,
  });

  // 2. Real-time updates via SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/realtime");
    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          msg.type === "ORDER_CREATED" ||
          msg.type === "ORDER_UPDATED" ||
          msg.type === "TABLE_UPDATED" ||
          msg.type === "SERVICE_REQUEST_CREATED" ||
          msg.type === "SERVICE_REQUEST_RESOLVED" ||
          msg.type === "INVENTORY_UPDATED" ||
          msg.type === "PO_CREATED"
        ) {
          qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] });
        }
      } catch {
        // ignore parse error
      }
    };
    return () => {
      eventSource.close();
    };
  }, [qc]);

  // Handle staff login mutation
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: loginRole, pin: loginPin.trim() }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Authentication failed");
      }
      if (resData.token && typeof window !== "undefined") {
        localStorage.setItem("aura_staff_token", resData.token);
      }
      // Immediately fetch dashboard bootstrap with the token
      const bootRes = await fetch("/api/dashboard/bootstrap", {
        headers: resData.token ? { Authorization: `Bearer ${resData.token}` } : {},
      });
      if (bootRes.ok) {
        const bootData = await bootRes.json();
        qc.setQueryData(["dashboard_bootstrap"], bootData);
      } else {
        await refetch();
      }

      if (loginRole === "kitchen" || loginRole === "barista") {
        setCurrentTab("kds");
      } else {
        setCurrentTab("floor");
      }
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle staff logout
  const handleStaffLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("aura_staff_token");
      }
      await fetch("/api/auth/staff/logout", { method: "POST" });
    } catch {
      // ignore
    }
    qc.removeQueries({ queryKey: ["dashboard_bootstrap"] });
    qc.setQueryData(["dashboard_bootstrap"], null);
    await refetch();
  };

  // Set default tab based on logged-in role once data arrives
  useEffect(() => {
    const role = data?.staff?.role || data?.currentStaff?.role;
    if (role) {
      if (role === "kitchen" || role === "barista") {
        setCurrentTab("kds");
      }
    }
  }, [data?.staff?.role, data?.currentStaff?.role]);

  // Extract dashboard entities
  const cafe = data?.cafe;
  const staff = data?.staff || data?.currentStaff || null;
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
      const res = await authFetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Reset Table Mutation
  const resetTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const res = await authFetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Merge Tables Mutation
  const mergeTablesMutation = useMutation({
    mutationFn: async ({ target, source }: { target: number; source: number }) => {
      const res = await authFetch(`/api/tables/tbl-${target}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", sourceTableNumber: source }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Split Tables Mutation
  const splitTablesMutation = useMutation({
    mutationFn: async (tableNumber: number) => {
      const res = await authFetch(`/api/tables/tbl-${tableNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "split" }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Manual Order Mutation
  const createManualOrderMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      const res = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Order Status Mutation (KDS)
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Order Item Status Mutation (KDS)
  const updateOrderItemStatusMutation = useMutation({
    mutationFn: async ({ orderId, itemId, status }: { orderId: string; itemId: string; status: OrderItemStatus }) => {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, item_status: status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Resolve Service Request Mutation
  const resolveServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Log Wastage Mutation
  const logWastageMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/inventory/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // Create PO Mutation
  const createPOMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await authFetch("/api/inventory/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard_bootstrap"] }),
  });

  // 1. Unauthenticated Staff Screen (Strict Server-Side RBAC Enforcement)
  if (isError || (!isLoading && !staff)) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2E1C14] text-amber-400 flex items-center justify-center shadow-md">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Staff Terminal Login</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Aura Artisan Cafe • Point of Sale & KDS
              </p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Select Your Staff Role:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "admin", label: "Admin / Owner", pin: "1234" },
                  { id: "manager", label: "Manager", pin: "1111" },
                  { id: "kitchen", label: "Kitchen / Barista", pin: "2345" },
                  { id: "waitstaff", label: "Waitstaff", pin: "3456" },
                  { id: "cashier", label: "Cashier / Billing", pin: "4567" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setLoginRole(r.id);
                      setLoginPin(r.pin);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      loginRole === r.id
                        ? "bg-[#2E1C14] text-white border-[#2E1C14] shadow"
                        : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400"
                    }`}
                  >
                    <span className="font-bold block">{r.label}</span>
                    <span className="text-[10px] opacity-70 block font-mono">PIN: {r.pin}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Security PIN Code:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  maxLength={6}
                  required
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono tracking-widest text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate & Launch POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-[11px] text-neutral-400">
            Protected under strict Server-Side Session RBAC (HTTP-only cookies).
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading State
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
      {/* High Density Desktop Navigation with Staff Authentication Context */}
      <DashboardNav
        cafe={cafe}
        staff={staff}
        onLogout={handleStaffLogout}
        serviceRequests={serviceRequests}
        onResolveServiceRequest={async (id) => {
          await resolveServiceMutation.mutateAsync(id);
        }}
        tables={tables}
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

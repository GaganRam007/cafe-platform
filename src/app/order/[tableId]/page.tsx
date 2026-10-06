"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Check,
  Bell,
  Droplets,
  Receipt,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuItemCard } from "@/components/customer/menu-item-card";
import { ItemCustomizerSheet } from "@/components/customer/item-customizer-sheet";
import { SharedTableCartModal } from "@/components/customer/shared-table-cart-modal";
import { CartBottomBar } from "@/components/customer/cart-bottom-bar";
import { MenuItem, DietaryTag, Table, Cafe } from "@/types/cafe";
import { playAudioNotification } from "@/lib/utils";

export default function TableOrderPage() {
  const params = useParams();
  const tableIdParam = (params?.tableId as string) || "1";
  const qc = useQueryClient();

  // Diner anonymous identity
  const [guestName, setGuestName] = useState<string>("Guest Diner");
  const [guestId, setGuestId] = useState<string>("");

  useEffect(() => {
    // Generate or restore anonymous guest session
    const storedGuest = localStorage.getItem("aura_guest_session");
    if (storedGuest) {
      try {
        const parsed = JSON.parse(storedGuest);
        setGuestName(parsed.name || "Guest Diner");
        setGuestId(parsed.id || `guest-${Date.now()}`);
        return;
      } catch {
        // ignore
      }
    }
    const newId = `guest-${Math.random().toString(36).substring(2, 9)}`;
    const randomNames = ["Guest Maya", "Guest Liam", "Guest Alex", "Guest Chloe", "Guest Kai"];
    const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
    setGuestName(chosenName);
    setGuestId(newId);
    localStorage.setItem("aura_guest_session", JSON.stringify({ id: newId, name: chosenName }));
  }, []);

  const handleUpdateGuestName = (newName: string) => {
    setGuestName(newName);
    localStorage.setItem("aura_guest_session", JSON.stringify({ id: guestId, name: newName }));
  };

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<DietaryTag | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartDraftItems, setCartDraftItems] = useState<any[]>([]);
  const [serviceToast, setServiceToast] = useState<{ message: string; type: "water" | "call_server" | "bill" } | null>(null);

  // Load Bootstrap Data via React Query
  const { data, isLoading } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/bootstrap");
      return res.json();
    },
  });

  const cafe: Cafe = data?.cafe;
  const tables: Table[] = data?.tables || [];
  const menuItems: MenuItem[] = data?.menuItems || [];
  const categories = data?.categories || [];
  const orders = data?.orders || [];

  // Match active table
  const currentTable: Table = useMemo(() => {
    if (!tables.length) {
      return {
        id: `tbl-${tableIdParam}`,
        cafe_id: "cafe-aura-01",
        table_number: Number(tableIdParam) || 1,
        label: `Table #${tableIdParam}`,
        capacity: 4,
        zone: "Main Dining",
        qr_token: `qr-${tableIdParam}`,
        status: "seated",
        position_x: 20,
        position_y: 20,
        updated_at: new Date().toISOString(),
      };
    }
    const found = tables.find(
      (t) => String(t.table_number) === String(tableIdParam) || t.id === tableIdParam
    );
    return found || tables[0];
  }, [tables, tableIdParam]);

  // Live submitted orders for this specific table
  const tableLiveOrders = useMemo(() => {
    return orders.filter(
      (o: any) =>
        (o.table_id === currentTable.id || o.table_number === currentTable.table_number) &&
        o.status !== "completed" &&
        o.status !== "cancelled"
    );
  }, [orders, currentTable]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategoryId === "all" || item.category_id === selectedCategoryId;

      const matchesDietary =
        selectedDietary === "all" || item.dietary_tags.includes(selectedDietary);

      return matchesSearch && matchesCategory && matchesDietary;
    });
  }, [menuItems, searchQuery, selectedCategoryId, selectedDietary]);

  // Service Request Mutation
  const serviceMutation = useMutation({
    mutationFn: async (type: "call_server" | "water" | "bill") => {
      const res = await fetch(`/api/tables/${currentTable.id}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: `Guest ${guestName} triggered from mobile QR` }),
      });
      return res.json();
    },
    onSuccess: (_, type) => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      playAudioNotification("service");
      const text =
        type === "water"
          ? "Fresh table water requested! Waitstaff has been notified."
          : type === "call_server"
          ? "Server called to Table #" + currentTable.table_number + ". Someone will be right with you!"
          : "Bill settlement requested at Table #" + currentTable.table_number + ".";
      setServiceToast({ message: text, type });
      setTimeout(() => setServiceToast(null), 4000);
    },
  });

  // Submit Order Mutation
  const orderMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderPayload,
          cafe_id: cafe?.id,
          table_id: currentTable.id,
          table_number: currentTable.table_number,
          session_id: `sess-tbl-${currentTable.table_number}`,
          customer_name: guestName,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      setCartDraftItems([]);
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
  });

  // Cart operations
  const handleAddToCart = (configuredItem: any) => {
    const newItem = {
      ...configuredItem,
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setCartDraftItems((prev) => [...prev, newItem]);
    playAudioNotification("new_order");
  };

  const handleRemoveCartItem = (id: string) => {
    setCartDraftItems((prev) => prev.filter((i) => i.id !== id));
  };

  const cartTotalAmount = cartDraftItems.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0
  );

  if (isLoading || !cafe) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-600 flex items-center justify-center animate-bounce mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
          Connecting to Aura Cafe...
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Loading digital menu & table session for Table #{tableIdParam}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col pb-24 text-neutral-900 dark:text-neutral-100 selection:bg-amber-200">
      {/* Toast Alert Banner */}
      {serviceToast && (
        <div className="fixed top-3 left-4 right-4 z-50 max-w-md mx-auto p-3.5 bg-neutral-900/95 text-white rounded-2xl shadow-2xl border border-amber-500/30 flex items-center gap-3 backdrop-blur-md animate-slide-up">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            {serviceToast.type === "water" ? <Droplets className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <div className="flex-1 text-xs">
            <span className="font-semibold block text-amber-300">Request Dispatched</span>
            <span>{serviceToast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Dynamic Cafe Header with Table Context & WiFi */}
      <CustomerHeader
        cafe={cafe}
        table={currentTable}
        guestName={guestName}
        onUpdateGuestName={handleUpdateGuestName}
      />

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto px-4 pt-4 space-y-4">
        {/* Instant Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search espresso, matcha, pastries, toast..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-[#E8E1D9] dark:border-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dietary Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "All Items" },
            { id: "veg", label: "🌱 Vegetarian" },
            { id: "vegan", label: "🌿 Vegan" },
            { id: "gluten-free", label: "🌾 Gluten-Free" },
            { id: "non-veg", label: "🥩 Non-Veg" },
          ].map((chip) => {
            const isSelected = selectedDietary === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedDietary(chip.id as any)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                  isSelected
                    ? "bg-[#2E1C14] text-white shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-[#E8E1D9] dark:border-neutral-800 hover:bg-neutral-50"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Sticky Category Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-[#FAF7F2]/95 dark:bg-neutral-950/95 backdrop-blur-md py-2 -mx-4 px-4 border-b border-[#E8E1D9]/80 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              selectedCategoryId === "all"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800"
            }`}
          >
            All Categories ({menuItems.length})
          </button>

          {categories.map((cat: any) => {
            const count = menuItems.filter((m) => m.category_id === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Live Active Order Status Banner if Table has in-progress orders */}
        {tableLiveOrders.length > 0 && (
          <div
            onClick={() => setIsCartOpen(true)}
            className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Kitchen is Preparing {tableLiveOrders.length} Order(s)
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Tap to view live preparation stages & total bill
                </p>
              </div>
            </div>
            <Receipt className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
          </div>
        )}

        {/* Menu Items List */}
        <div className="space-y-3 pt-1">
          {filteredMenuItems.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm font-semibold">No items match your filter</p>
              <p className="text-xs">Try selecting another category or clearing filters.</p>
            </div>
          ) : (
            filteredMenuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelect={(selected) => setCustomizingItem(selected)}
              />
            ))
          )}
        </div>
      </main>

      {/* Item Customizer Modal / Bottom Sheet */}
      <ItemCustomizerSheet
        item={customizingItem}
        guestName={guestName}
        guestId={guestId}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Shared Table Cart & Live Bill Modal */}
      {isCartOpen && (
        <SharedTableCartModal
          cafe={cafe}
          table={currentTable}
          guestName={guestName}
          guestId={guestId}
          cartItems={cartDraftItems}
          tableLiveOrders={tableLiveOrders}
          onRemoveCartItem={handleRemoveCartItem}
          onClearCart={() => setCartDraftItems([])}
          onClose={() => setIsCartOpen(false)}
          onSubmitOrder={async (payload) => {
            await orderMutation.mutateAsync(payload);
          }}
          onTriggerService={(type) => serviceMutation.mutate(type)}
        />
      )}

      {/* Persistent Sticky Cart Bottom Bar */}
      <CartBottomBar
        itemCount={cartDraftItems.length}
        totalAmount={cartTotalAmount}
        hasActiveOrder={tableLiveOrders.length > 0}
        onOpenCart={() => setIsCartOpen(true)}
        onRequestWater={() => serviceMutation.mutate("water")}
        onCallServer={() => serviceMutation.mutate("call_server")}
      />
    </div>
  );
}

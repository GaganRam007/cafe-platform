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
  AlertTriangle,
  QrCode,
  ShieldAlert,
  Loader2,
} from "lucide-react";

import { CustomerHeader } from "@/components/customer/customer-header";
import { MenuItemCard } from "@/components/customer/menu-item-card";
import { ItemCustomizerSheet } from "@/components/customer/item-customizer-sheet";
import { SharedTableCartModal, CartDraftItem } from "@/components/customer/shared-table-cart-modal";
import { CartBottomBar } from "@/components/customer/cart-bottom-bar";
import { OtpAuthModal } from "@/components/customer/otp-auth-modal";
import { MenuItem, DietaryTag, Table, Cafe, Order } from "@/types/cafe";
import { playAudioNotification } from "@/lib/utils";

export default function TableOrderPage() {
  const params = useParams();
  const rawQrToken = (params?.qr_token as string) || "";
  const qrToken = decodeURIComponent(rawQrToken);
  const qc = useQueryClient();

  // Anonymous guest fallback identity (before OTP verification)
  const [guestName, setGuestName] = useState<string>("Guest Diner");
  const [guestId, setGuestId] = useState<string>("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
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
  const [cartDraftItems, setCartDraftItems] = useState<CartDraftItem[]>([]);
  const [serviceToast, setServiceToast] = useState<{ message: string; type: "water" | "call_server" | "bill" } | null>(null);

  // 1. Authoritative Customer Session Query (Validates Cryptographic QR Token on Server)
  const {
    data: sessionData,
    isLoading: isSessionLoading,
    isError: isSessionError,
    error: sessionError,
  } = useQuery({
    queryKey: ["customer_session", qrToken],
    queryFn: async () => {
      const res = await fetch(`/api/customer/session?qr_token=${encodeURIComponent(qrToken)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invalid QR code");
      }
      return res.json();
    },
    enabled: Boolean(qrToken),
    retry: 1,
  });

  // 2. Safe Public Menu Query (Stripping internal costs, margins, and vendors)
  const { data: menuData, isLoading: isMenuLoading } = useQuery({
    queryKey: ["customer_menu"],
    queryFn: async () => {
      const res = await fetch("/api/customer/menu");
      if (!res.ok) throw new Error("Failed to load menu");
      return res.json();
    },
  });

  // Real-time Event Listener via SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/realtime");
    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          msg.type === "ORDER_CREATED" ||
          msg.type === "ORDER_UPDATED" ||
          msg.type === "TABLE_UPDATED"
        ) {
          qc.invalidateQueries({ queryKey: ["customer_session", qrToken] });
        }
      } catch {
        // ignore parse error
      }
    };
    return () => {
      eventSource.close();
    };
  }, [qc, qrToken]);

  const table: Table | null = sessionData?.table || null;
  const customer = sessionData?.customer || null;
  const tableLiveOrders: Order[] = sessionData?.orders || [];

  const cafe: Cafe = menuData?.cafe || {
    id: "cafe-aura-01",
    name: "Aura Artisan Coffee & Bistro",
    tagline: "Specialty Pour-Overs, Sourdough Bakes & Slow Living",
    slug: "aura-cafe",
    address: "12, Indiranagar 100ft Road, Bengaluru, KA 560038",
    phone: "+91 98450 88221",
    logo_url: "/logo.png",
    banner_url: "/banner.jpg",
    settings: {
      wifi_ssid: "Aura_Guest_5G",
      wifi_pass: "VelvetLatte24",
      tax_rate: 0.05,
      service_fee_rate: 0.05,
      currency: "INR",
      currency_symbol: "₹",
      auto_stock_deduction: true,
      kds_sound_enabled: true,
    },
  };

  const categories = menuData?.categories || [];
  const menuItems: MenuItem[] = menuData?.items || [];

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
      if (!table) return;
      const res = await fetch(`/api/tables/${table.id}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: customer ? `${customer.name} (${customer.phone_e164})` : `Guest ${guestName}`,
        }),
      });
      return res.json();
    },
    onSuccess: (_, type) => {
      qc.invalidateQueries({ queryKey: ["customer_session", qrToken] });
      playAudioNotification("service");
      const text =
        type === "water"
          ? "Fresh table water requested! Waitstaff has been notified."
          : type === "call_server"
          ? "Server summoned! A team member is heading to your table."
          : "Bill request received. Preparing check.";
      setServiceToast({ message: text, type });
      setTimeout(() => setServiceToast(null), 4000);
    },
  });

  // Cart operations
  const handleAddToCart = (configuredItem: any) => {
    setCartDraftItems((prev) => [
      ...prev,
      {
        ...configuredItem,
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      },
    ]);
    setCustomizingItem(null);
  };

  const handleRemoveCartItem = (id: string) => {
    setCartDraftItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    setCartDraftItems([]);
  };

  // 1. Loading State
  if (isSessionLoading || isMenuLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-600 dark:text-neutral-400">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Connecting to Table Session...
        </p>
        <p className="text-xs text-neutral-500 mt-1">Verifying cryptographic QR credentials</p>
      </div>
    );
  }

  // 2. Strict Security: Reject Invalid or Tampered QR Tokens (Disallow manual fallback to Table 1)
  if (isSessionError || !table) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          Invalid or Expired Table QR Code
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
          Please scan the physical QR code placed on your dining table. Manual table selection is restricted to protect your billing and kitchen order integrity.
        </p>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 max-w-xs space-y-1 text-left">
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Dining Tip:</p>
          <p>Each table features a unique, cryptographically signed token. Ask our floor staff if you need assistance scanning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-neutral-950 flex flex-col font-sans pb-28">
      {/* Header with Table Context & Customer Profile */}
      <CustomerHeader
        cafe={cafe}
        table={table}
        guestName={guestName}
        onUpdateGuestName={handleUpdateGuestName}
        customer={customer}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Service Request Toast */}
      {serviceToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#2E1C14] text-white p-3.5 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            {serviceToast.type === "water" ? <Droplets className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <p className="text-xs font-medium flex-1">{serviceToast.message}</p>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 space-y-5">
        {/* Search Bar & Dietary Filter Pills */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search handcrafted brew, roast, pastries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-amber-600 transition shadow-sm"
            />
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all", label: "All Items" },
              { id: "veg", label: "🌱 Veg" },
              { id: "non-veg", label: "🍗 Non-Veg" },
              { id: "vegan", label: "🌿 100% Vegan" },
              { id: "gluten-free", label: "🌾 Gluten-Free" },
            ].map((diet) => (
              <button
                key={diet.id}
                onClick={() => setSelectedDietary(diet.id as any)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                  selectedDietary === diet.id
                    ? "bg-[#2E1C14] text-white shadow-sm"
                    : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200/80 dark:border-neutral-700"
                }`}
              >
                {diet.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Category Navigation Tabs */}
        <div className="sticky top-0 z-20 bg-[#FAF7F2]/90 dark:bg-neutral-950/90 backdrop-blur-md py-2 -mx-4 px-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`text-xs font-semibold px-4 py-2 rounded-2xl transition whitespace-nowrap ${
                selectedCategoryId === "all"
                  ? "bg-amber-600 text-white shadow"
                  : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-2xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategoryId === cat.id
                    ? "bg-amber-600 text-white shadow"
                    : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              {selectedCategoryId === "all"
                ? "Full Artisan Menu"
                : categories.find((c: any) => c.id === selectedCategoryId)?.name || "Menu Items"}
            </h2>
            <span className="text-xs text-neutral-500">{filteredMenuItems.length} items</span>
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No menu items match your criteria</p>
              <p className="text-xs mt-1">Try relaxing filters or searching for different ingredients.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredMenuItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onSelect={(it: MenuItem) => setCustomizingItem(it)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Quick Action Dock: Service Requests & Cart Trigger */}
      <CartBottomBar
        itemCount={cartDraftItems.length}
        totalAmount={cartDraftItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onRequestWater={() => serviceMutation.mutate("water")}
        onCallServer={() => serviceMutation.mutate("call_server")}
        hasActiveOrder={tableLiveOrders.length > 0}
      />

      {/* Modals & Sheets */}
      {customizingItem && (
        <ItemCustomizerSheet
          item={customizingItem}
          guestName={customer ? customer.name : guestName}
          guestId={guestId}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {isCartOpen && (
        <SharedTableCartModal
          cafe={cafe}
          table={table}
          qrToken={qrToken}
          guestName={guestName}
          guestId={guestId}
          customer={customer}
          cartItems={cartDraftItems}
          tableLiveOrders={tableLiveOrders}
          onRemoveCartItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onClose={() => setIsCartOpen(false)}
          onOrderSuccess={() => {
            qc.invalidateQueries({ queryKey: ["customer_session", qrToken] });
          }}
          onRequireAuth={() => setIsAuthModalOpen(true)}
          onTriggerService={(type) => serviceMutation.mutate(type)}
        />
      )}

      {/* Customer Phone/OTP Authentication Modal */}
      <OtpAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        tableId={table.id}
        onAuthenticated={() => {
          qc.invalidateQueries({ queryKey: ["customer_session", qrToken] });
        }}
      />
    </div>
  );
}

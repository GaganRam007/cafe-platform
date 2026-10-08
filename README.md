# Aura Cafe - Full-Stack Cafe Management & QR Dining Platform

A full-stack, responsive cafe operating system and mobile guest ordering suite built with **Next.js (App Router)**, **React**, **Tailwind CSS**, **TanStack Query**, and **WebSockets / Server-Sent Events (SSE)**.

---

## Documentation & Technical Specifications

- 📄 **[Revised Technical Specification: Offline Counter Settlement & POS Audit (v2.0)](./docs/REVISED_OFFLINE_PAYMENTS_SPEC.md)**: Production specification for transitioning from online gateways (Razorpay/webhooks) to offline counter settlement (Cash/UPI/Card), staff RBAC, sequential GST invoicing, anti-theft audit logs, and End-of-Day cash reconciliation.

---

## Architecture Overview

```
cafe-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Interactive Portal & Demo Simulator
│   │   ├── layout.tsx                   # PWA metadata, font & Theme Providers
│   │   ├── globals.css                  # Cafe aesthetic tokens, animations & print styles
│   │   ├── order/[tableId]/page.tsx     # Module 1: Customer QR-triggered Web App
│   │   ├── dashboard/page.tsx           # Module 2: Owner & Staff Web Dashboard
│   │   └── api/
│   │       ├── bootstrap/route.ts       # Full cafe state loader
│   │       ├── realtime/route.ts        # Server-Sent Events (SSE) live push stream
│   │       ├── orders/route.ts          # Order creation & list (auto recipe deduction)
│   │       ├── orders/[orderId]/route.ts# Order & item status pipeline
│   │       ├── tables/[tableId]/route.ts# Table status, merge, split, reset
│   │       ├── tables/[tableId]/service/route.ts # Diner waiter & water calls
│   │       ├── service-requests/[requestId]/route.ts # Staff resolve requests
│   │       ├── inventory/waste/route.ts # Shrinkage & spoilage logging
│   │       ├── inventory/po/route.ts    # Reorder trigger purchase order generator
│   │       └── webhooks/payment/route.ts# Stripe / Razorpay capture webhook
│   ├── components/
│   │   ├── customer/
│   │   │   ├── customer-header.tsx      # Table info, WiFi copy, anonymous diner identity
│   │   │   ├── menu-item-card.tsx       # Dietary badges, low stock, customization trigger
│   │   │   ├── item-customizer-sheet.tsx# Milk, sweetness, extra shots, temp modifiers
│   │   │   ├── cart-bottom-bar.tsx      # Sticky bottom bar & service quick buttons
│   │   │   └── shared-table-cart-modal.tsx # Split cart, live bill tracker, tips & checkout
│   │   ├── dashboard/
│   │   │   ├── dashboard-nav.tsx        # High density header, RBAC switcher, service alert dock
│   │   │   ├── floor-management.tsx     # 2D visual floor plan & high-density table grid
│   │   │   ├── kds-view.tsx             # Ticket timeline KDS, urgency alerts, Web Audio chimes
│   │   │   ├── inventory-management.tsx # Unit catalog, recipe BOM costing, PO generator
│   │   │   ├── analytics-view.tsx       # Live revenue, AOV, turnover, bestsellers, peak hours
│   │   │   ├── qr-modal.tsx             # Dynamic QR code & printable table placard
│   │   │   ├── manual-order-modal.tsx   # Phone/walk-in staff order override
│   │   │   └── merge-split-modal.tsx    # Table capacity merge & split
│   │   └── providers/
│   │       └── query-provider.tsx       # TanStack React Query + SSE auto-invalidator
│   ├── lib/
│   │   ├── data-store.ts                # Thread-safe in-memory store with auto BOM deductions
│   │   └── utils.ts                     # Classnames, currency formatter, Web Audio chimes
│   └── types/
│       └── cafe.ts                      # Strict TypeScript domain models
└── public/
    └── manifest.json                    # Mobile PWA configuration
```

---

## Core Modules & Features

### 1. Customer-Facing Web App (QR-Triggered)
- **URL Route:** `/order/[tableId]` (encodes cafe ID and specific table number).
- **Session:** Anonymous diner session with customizable name, synced with table order.
- **Dynamic Welcome Screen:** Cafe banner, logo, guest WiFi details (one-tap password copy), and active table badge.
- **Instant Search & Dietary Filters:** Real-time search by title or description; filter chips for **Vegetarian**, **Vegan**, **Gluten-Free**, and **Non-Veg**.
- **Interactive Digital Menu:** Sticky category navigation tabs (Espresso & Classics, Artisanal Brews, Bakery & Pastries, Brunch & Mains, Specialty Sips).
- **Item Customizer (Bottom Sheet):**
  - Modifiers: Milk selection (Whole, Oatly Barista, Almond, Skim), Sweetness levels (0%, 25%, 50%, 100%), Extra espresso shots, Serving style (Hot / Artisanal Ice).
  - Special instructions for barista / kitchen.
  - Live unit price calculator reflecting modifier deltas and quantity.
- **Shared Table Cart & Live Bill:**
  - Split view between **Your Items** and **Table's Combined Order** across multiple diners.
  - Live bill preparation tracker: *Queued*, *Preparing*, *Ready*, *Delivered*.
  - Flexible tip selector (0%, 5%, 10%, 15%, 20% or custom) with breakdown of subtotal, 5% service charge, and 8% tax.
- **Checkout & Quick Service Actions:**
  - Instant digital checkout (Apple Pay, Google Pay, UPI, Credit Card) with celebratory confetti.
  - "Pay at Counter / Cash" option setting order status to `cash_pending` and table to `billing`.
  - Persistent quick-actions: **Call Server** and **Request Water** with real-time staff dock notification.

---

### 2. Owner & Staff Web Dashboard
- **Role-Based Access Control (RBAC):** One-click toggle between **Admin / Owner**, **Barista / Kitchen Staff**, and **Waitstaff** with dedicated views and permissions.
- **Live Floor & Table Management:**
  - Visual 2D interactive floor plan map across dining zones (Main Dining, Patio Garden, Window Bar) plus high-density grid view.
  - Color-coded table statuses:
    - 🟢 Green: Vacant (Clean)
    - 🟡 Amber: Seated / Ordering
    - 🔴 Red: In-Kitchen / Active Order
    - 🔵 Blue: Payment Pending
  - Quick action buttons on each table:
    - **Generate & Print Dynamic QR Code:** High-resolution QR code generator with printable placard containing WiFi info and table number.
    - **Merge / Split Tables:** Combine adjacent table capacities for large dining parties, or split them back.
    - **Manual Order Override:** Staff POS entry for walk-in takeaway or phone orders.
    - **Reset Table / Cleaned:** 1-tap table reset to vacant.
- **Kitchen Display System (KDS):**
  - Ticket-based view ordered chronologically by elapsed time.
  - Color-coded urgency alerts:
    - Normal: `<10m` (Green)
    - Warning: `10–20m` (Amber)
    - Critical Alert: `>20m` (Pulsing Red)
  - One-click status transitions: `Received` → `Preparing` → `Ready` → `Served`.
  - Station filters: All Stations, Barista (Drinks), Kitchen (Food).
  - Individual item completion strike-through checklists.
  - Synthesized Web Audio API sound chime triggers on new orders.
- **Inventory & Recipe Costing Management:**
  - Unit-based ingredient tracking (grams, ml, pieces).
  - **Recipe-to-Menu BOM Mapping:** Automatically deducts exact quantities of raw materials (e.g. 18g espresso beans + 200ml oat milk per Spanish Latte) on order placement.
  - Low-stock automatic alert badges and reorder triggers.
  - Spoilage, spill, and shrinkage logging with cost calculations.
  - Certified vendor directory with lead times and 1-click Purchase Order (PO) requisition generator.
- **Analytics & Cafe Health:**
  - Real-time KPIs: Gross Revenue, Average Order Value (AOV), Table Turnover Rate, Dining Occupancy %.
  - Top 5 Best-Selling items with revenue progress bars.
  - Payment channel breakdown (Apple Pay, Google Pay, UPI, Cards, Cash).
  - Peak order hourly volume distribution.
  - Live daily ingredient consumption rates.

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (installed and configured) or Node.js 18+

### Running the Application

```bash
# 1. Install dependencies
bun install

# 2. Build production assets
bun run build

# 3. Start the production server
bun run start -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Interactive Landing & Simulator:** `http://localhost:3000/`
- **Owner & Staff Dashboard:** `http://localhost:3000/dashboard`
- **Customer QR Mobile App:** `http://localhost:3000/order/2` (or any table ID from 1 to 12)

# Aura Cafe - Enterprise Cafe Management & POS Operating System

A robust, full-stack cafe management platform, kitchen display system (KDS), and mobile QR dining suite built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **TanStack Query**, **Redis Pub/Sub & Server-Sent Events (SSE)**, and **PostgreSQL / Embedded Database**.

Designed specifically for modern cafes, artisanal roasteries, and bistros requiring offline cash/UPI/card counter settlement, tamper-proof audit trails, split GST compliance, and seamless guest experiences without mandatory app downloads.

---

## 🚀 Key Highlights & Architectural Features

### 1. Zero-Friction Customer Dining (Mobile-First Web App)
- **Cryptographic QR Routing:** Tamper-proof HMAC-SHA256 signed tokens (`/order/[qr_token]`) preventing table spoofing.
- **Diner Mobile & Name Login:** Lightweight 6-digit OTP verification issuing 30-day diner session cookies.
- **Multilingual Support:** One-tap language switcher for English (`EN`), Hindi (`HI`), and Kannada (`KN`).
- **Interactive Digital Menu:** Dietary tags (Veg, Vegan, Non-Veg, Gluten-Free), real-time stock availability badges, and allergen filtering.
- **Customization Engine:** Milk selections (Oat, Almond, Whole), sweetness levels, temperature, and extra espresso shots with automatic recipe inventory tracking.
- **Shared Table Cart & Live Bill:** Real-time shared order view, live prep status tracker (*Queued*, *Preparing*, *Ready*, *Delivered*), and quick server/water call buttons.
- **Offline Payment Flow:** Direct "Place Order to Kitchen" and "Request Bill / Call Staff for Payment" buttons (no online payment gateway friction or failed webhooks).

### 2. Owner & Staff Web Dashboard (POS & Operations)
- **Role-Based Access Control (RBAC):** Strict server-side authentication for `owner`, `manager`, `barista`, `waitstaff`, and `cashier` with PIN verification.
- **Live Floor & Table Management:** 2D interactive floor map across dining zones (Main Dining, Patio Garden, Window Bar) with color-coded table statuses, table merging/splitting, and QR placard generator.
- **Kitchen Display System (KDS):** Station routing (Barista vs. Kitchen), ticket timers, preparation FSM transitions, and audio chimes.
- **Menu & Stock Controls:** Real-time item pricing, stock quantity adjustment, and instant 86/availability toggles.
- **Inventory & BOM Recipe Costing:** Automatic ingredient deductions (including modifier deltas), wastage logging, and low-stock alerts.
- **Vendor Management & Purchase Orders:** Supplier contact directory, lead time tracking, and automated PO generator.
- **Offline Counter Bill Settlement:** Settle orders via Cash, UPI, or Card; tender cash change calculator; manager-authorized discounts with audit reasons; optional tips.
- **Automated GST & WhatsApp Invoicing:** Sequential GST Tax Invoices (SAC 996331, CGST 2.5%, SGST 2.5%, GSTIN, FSSAI) with automated WhatsApp notification delivery.
- **End-of-Day (EOD) Register Balancing:** Daily register closeout with system vs. counted cash variance calculations and lockouts.
- **Immutable Audit Trail:** Comprehensive logging of all settlements, voids, bill reopens, and menu modifications.

---

## 📁 Repository Structure

```
cafe-platform/
├── .github/
│   └── workflows/ci.yml             # GitHub Actions CI pipeline (lint, typecheck, tests)
├── prisma/
│   └── schema.prisma                # Database schema (PostgreSQL / SQLite)
├── public/
│   └── manifest.json                # PWA manifest configuration
├── scripts/
│   ├── backup-db.sh                 # Database backup script (pg_dump + gzip)
│   ├── seed.ts                      # Database seeding script
│   ├── test-concurrency.ts          # Concurrency & overselling test suite
│   └── verify-all.ts                # 25-point end-to-end integration test suite
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Portal & Demo Simulator
│   │   ├── layout.tsx               # Root Layout with Theme & Query Providers
│   │   ├── order/[qr_token]/page.tsx# Customer Mobile QR Ordering Page
│   │   ├── dashboard/page.tsx       # Staff & Owner Web Dashboard
│   │   ├── invoice/[invoiceNumber]/page.tsx # Public GST Tax Invoice Viewer
│   │   └── api/
│   │       ├── auth/                # Staff PIN login & Customer OTP endpoints
│   │       ├── customer/            # Public menu, session, orders, & GDPR data deletion
│   │       ├── staff/               # Settle bill, reopen bill, EOD reports, audit logs, menu
│   │       ├── realtime/route.ts    # Role/session-scoped SSE broadcast stream
│   │       └── ...
│   ├── components/
│   │   ├── customer/                # Customer header, menu cards, cart modal, item customizer
│   │   └── dashboard/               # Floor, KDS, Menu, Inventory, Vendors, EOD, Audit, Settlement
│   ├── lib/
│   │   ├── auth.ts                  # Staff & Diner JWT session management
│   │   ├── db.ts                    # Database repository, transactions, and seeding
│   │   ├── i18n.ts                  # English, Hindi, and Kannada translation dictionaries
│   │   ├── rate-limit.ts            # Sliding-window rate limiter
│   │   ├── realtime.ts              # Redis / In-memory PubSub Realtime Bus
│   │   ├── validations.ts           # Zod schema validation models
│   │   └── whatsapp-invoicing.ts    # WhatsApp Cloud API & GST invoice dispatcher
│   └── types/
│       └── cafe.ts                  # TypeScript domain models
├── docker-compose.yml               # Next.js, PostgreSQL 16, and Redis 7 multi-container setup
├── Dockerfile                       # Multi-stage production container build
├── .env.example                     # Environment variables configuration template
└── README.md
```

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- [Bun](https://bun.sh) (v1.2+) or Node.js (v20+)
- PostgreSQL (optional for Docker) or embedded SQLite (default zero-config)
- Redis (optional, in-memory fallback enabled by default)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Gagan-ramb/cafe-platform.git
cd cafe-platform
bun install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
```

### 3. Initialize & Seed Database
```bash
bun run seed
```

Default staff accounts created:
- **Owner / Admin:** PIN `1234`
- **Floor Manager:** PIN `1111`
- **Head Barista / Chef:** PIN `2345`
- **Waitstaff:** PIN `3456`
- **Billing Cashier:** PIN `4567`

### 4. Start Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Interactive Simulator & QR Access:** [http://localhost:3000](http://localhost:3000)
- **Staff POS & Operations Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 🧪 Testing & Verification

Run the full automated integrity test suite:
```bash
# Run 25-point End-to-End System Test Suite
bun run test

# Run Concurrency & Zero-Overselling Simulation
bun run test:concurrency

# Run Typecheck & Linter
bun x tsc --noEmit
bun run lint
```

---

## 🐳 Docker & Production Deployment

### Run with Docker Compose (App + Postgres 16 + Redis 7)
```bash
docker compose up -d --build
```

### Build Standalone Production Container
```bash
docker build -t cafe-platform:latest .
docker run -p 3000:3000 --env-file .env.example cafe-platform:latest
```

### Database Backup
```bash
./scripts/backup-db.sh
```
Creates timestamped `.db.gz` or `.sql.gz` archives in `./backups/` and automatically prunes backups older than 14 days.

---

## 🔒 Security & Compliance
- **Server Authoritative Pricing:** Client monetary values are discarded; all subtotals, taxes, and service charges are calculated exclusively on the server.
- **Stock Concurrency Protection:** Atomic database transactions prevent overselling under high concurrency.
- **Strict Role-Based Access Control:** All staff APIs enforce cookie/bearer token verification and role checks.
- **CSRF & Security Headers:** Enforced CSP, X-Frame-Options, HSTS, and origin validation on mutating endpoints.
- **GDPR & Privacy:** Customer data deletion endpoint (`DELETE /api/customer/data`) with phone hashing.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

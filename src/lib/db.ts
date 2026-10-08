import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "cafe.db");
const db = new Database(dbPath);

// Enable WAL mode for high concurrency read/write
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

// Initialize tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS cafe (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      gstin TEXT NOT NULL DEFAULT '29AABCU9603R1ZM',
      fssai_number TEXT NOT NULL DEFAULT '11223344556677',
      wifi_ssid TEXT NOT NULL DEFAULT 'Aura_Guest_5G',
      wifi_pass TEXT NOT NULL DEFAULT 'VelvetLatte24',
      cgst_rate REAL NOT NULL DEFAULT 0.025,
      sgst_rate REAL NOT NULL DEFAULT 0.025,
      service_fee_rate REAL NOT NULL DEFAULT 0.05,
      currency TEXT NOT NULL DEFAULT 'INR',
      currency_symbol TEXT NOT NULL DEFAULT '₹'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      cafe_id TEXT NOT NULL,
      table_number INTEGER UNIQUE NOT NULL,
      label TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      zone TEXT NOT NULL,
      qr_token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'vacant',
      position_x REAL NOT NULL DEFAULT 10,
      position_y REAL NOT NULL DEFAULT 10,
      merged_with TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      phone_e164 TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS table_sessions (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS diners (
      id TEXT PRIMARY KEY,
      table_session_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY,
      cafe_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      cafe_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      base_price REAL NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      stock_count INTEGER NOT NULL DEFAULT 50,
      dietary_tags TEXT NOT NULL,
      station TEXT NOT NULL,
      prep_time_minutes INTEGER NOT NULL DEFAULT 5,
      calories INTEGER
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modifier_groups (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      selection_type TEXT NOT NULL,
      is_required INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modifier_options (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price_delta REAL NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      cafe_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL NOT NULL,
      reorder_level REAL NOT NULL,
      unit_cost REAL NOT NULL,
      vendor_id TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recipe_items (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      quantity_required REAL NOT NULL,
      unit TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modifier_ingredients (
      id TEXT PRIMARY KEY,
      modifier_option_id TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      quantity_delta REAL NOT NULL,
      unit TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      table_session_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      subtotal REAL NOT NULL,
      cgst_amount REAL NOT NULL,
      sgst_amount REAL NOT NULL,
      total_tax REAL NOT NULL,
      service_fee REAL NOT NULL DEFAULT 0,
      tip_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      invoice_number TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      diner_id TEXT,
      menu_item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      station TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_item_modifiers (
      id TEXT PRIMARY KEY,
      order_item_id TEXT NOT NULL,
      modifier_option_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      option_name TEXT NOT NULL,
      price_delta REAL NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      gstin TEXT NOT NULL,
      fssai_number TEXT NOT NULL,
      hsn_sac_code TEXT NOT NULL DEFAULT '996331',
      subtotal REAL NOT NULL,
      cgst_amount REAL NOT NULL,
      sgst_amount REAL NOT NULL,
      service_fee REAL NOT NULL,
      tip_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      whatsapp_status TEXT NOT NULL DEFAULT 'QUEUED',
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wastage_logs (
      id TEXT PRIMARY KEY,
      ingredient_id TEXT NOT NULL,
      ingredient_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      cost REAL NOT NULL,
      reason TEXT NOT NULL,
      logged_by TEXT NOT NULL,
      logged_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      lead_time_days INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      po_number TEXT UNIQUE NOT NULL,
      items_json TEXT NOT NULL,
      total_cost REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      expected_delivery TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      action TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      payment_method TEXT,
      gross_subtotal REAL,
      discount_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      final_amount REAL,
      reason TEXT,
      metadata TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS eod_reconciliations (
      id TEXT PRIMARY KEY,
      business_date TEXT UNIQUE NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT NOT NULL,
      closed_by TEXT NOT NULL,
      opening_float REAL NOT NULL,
      system_cash_sales REAL NOT NULL,
      system_upi_sales REAL NOT NULL,
      system_card_sales REAL NOT NULL,
      gross_sales REAL NOT NULL,
      total_discounts REAL NOT NULL,
      total_voids_count INTEGER NOT NULL DEFAULT 0,
      expected_cash_in_drawer REAL NOT NULL,
      actual_cash_counted REAL NOT NULL,
      cash_variance REAL NOT NULL,
      variance_notes TEXT,
      status TEXT NOT NULL DEFAULT 'BALANCED'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      sequence_date TEXT PRIMARY KEY,
      last_sequence INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Safe table migrations for orders
  const orderCols = db.query("PRAGMA table_info(orders)").all() as any[];
  const orderColNames = new Set(orderCols.map((c) => c.name));
  if (!orderColNames.has("discount_amount")) db.run("ALTER TABLE orders ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0");
  if (!orderColNames.has("discount_type")) db.run("ALTER TABLE orders ADD COLUMN discount_type TEXT");
  if (!orderColNames.has("discount_reason")) db.run("ALTER TABLE orders ADD COLUMN discount_reason TEXT");
  if (!orderColNames.has("discount_authorized_by")) db.run("ALTER TABLE orders ADD COLUMN discount_authorized_by TEXT");
  if (!orderColNames.has("settled_by")) db.run("ALTER TABLE orders ADD COLUMN settled_by TEXT");
  if (!orderColNames.has("settled_at")) db.run("ALTER TABLE orders ADD COLUMN settled_at TEXT");
  if (!orderColNames.has("is_void")) db.run("ALTER TABLE orders ADD COLUMN is_void INTEGER NOT NULL DEFAULT 0");
  if (!orderColNames.has("void_reason")) db.run("ALTER TABLE orders ADD COLUMN void_reason TEXT");
  if (!orderColNames.has("voided_by")) db.run("ALTER TABLE orders ADD COLUMN voided_by TEXT");
  if (!orderColNames.has("voided_at")) db.run("ALTER TABLE orders ADD COLUMN voided_at TEXT");

  // Safe table migrations for invoices
  const invCols = db.query("PRAGMA table_info(invoices)").all() as any[];
  const invColNames = new Set(invCols.map((c) => c.name));
  if (!invColNames.has("discount_amount")) db.run("ALTER TABLE invoices ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0");
  if (!invColNames.has("payment_method")) db.run("ALTER TABLE invoices ADD COLUMN payment_method TEXT");
  if (!invColNames.has("settled_by_name")) db.run("ALTER TABLE invoices ADD COLUMN settled_by_name TEXT");
  if (!invColNames.has("status")) db.run("ALTER TABLE invoices ADD COLUMN status TEXT NOT NULL DEFAULT 'ISSUED'");

  // Performance Indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(table_session_id);");
  db.run("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);");
  db.run("CREATE INDEX IF NOT EXISTS idx_orders_pay_status ON orders(payment_status);");
  db.run("CREATE INDEX IF NOT EXISTS idx_order_items_ord ON order_items(order_id);");
  db.run("CREATE INDEX IF NOT EXISTS idx_audit_order ON audit_logs(order_id);");
  db.run("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);");
}

initializeDatabase();

// Cryptographic token helper
export function generateSignedQrToken(tableNumber: number): string {
  const secret = process.env.QR_SIGNING_SECRET || "aura_qr_super_secure_secret_2026";
  const nonce = crypto.randomBytes(6).toString("hex");
  const payload = `tbl-${tableNumber}:${nonce}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex").substring(0, 16);
  return `${payload}.${sig}`;
}

export function verifyQrToken(token: string): { valid: boolean; tableNumber: number | null } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, tableNumber: null };
    const [payload, sig] = parts;
    const secret = process.env.QR_SIGNING_SECRET || "aura_qr_super_secure_secret_2026";
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex").substring(0, 16);
    
    // Constant time comparison
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false, tableNumber: null };
    }
    const match = payload.match(/^tbl-(\d+):/);
    if (!match) return { valid: false, tableNumber: null };
    return { valid: true, tableNumber: parseInt(match[1], 10) };
  } catch {
    return { valid: false, tableNumber: null };
  }
}

// Seed Initial Data if empty
function seedDatabaseInternal() {
  db.run(`
    INSERT INTO cafe (id, name, tagline, slug, address, phone, gstin, fssai_number, wifi_ssid, wifi_pass, cgst_rate, sgst_rate, service_fee_rate, currency, currency_symbol)
    VALUES (
      'cafe-aura-01',
      'Aura Artisan Coffee & Bistro',
      'Specialty Pour-Overs, Sourdough Bakes & Slow Living',
      'aura-cafe',
      '742 Evergreen Terrace, Downtown Arts District, Bengaluru',
      '+91 80 4123 4567',
      '29AABCU9603R1ZM',
      '11223344556677',
      'Aura_Guest_5G',
      'VelvetLatte24',
      0.025,
      0.025,
      0.05,
      'INR',
      '₹'
    );
  `);

  // Seed Categories
  const categories = [
    { id: "cat-espresso", name: "Espresso & Classics", slug: "espresso", icon: "☕", sort_order: 1 },
    { id: "cat-brews", name: "Artisanal Brews", slug: "brews", icon: "🍵", sort_order: 2 },
    { id: "cat-pastries", name: "Bakery & Pastries", slug: "pastries", icon: "🥐", sort_order: 3 },
    { id: "cat-mains", name: "Brunch & Mains", slug: "mains", icon: "🍳", sort_order: 4 },
    { id: "cat-addons", name: "Specialty Sips", slug: "addons", icon: "✨", sort_order: 5 },
  ];
  for (const c of categories) {
    db.run(
      "INSERT INTO menu_categories (id, cafe_id, name, slug, icon, sort_order) VALUES (?, 'cafe-aura-01', ?, ?, ?, ?)",
      [c.id, c.name, c.slug, c.icon, c.sort_order]
    );
  }

  // Seed Menu Items (Prices in INR ₹)
  const menuItems = [
    {
      id: "item-spanish-latte",
      category_id: "cat-espresso",
      name: "Velvet Spanish Latte",
      description: "Double ristretto over silky condensed milk and textured whole or oat milk with Ceylon cinnamon.",
      image_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
      base_price: 290.0,
      stock_count: 50,
      dietary_tags: "veg,gluten-free",
      station: "barista",
      prep_time_minutes: 4,
      calories: 220,
    },
    {
      id: "item-cortado",
      category_id: "cat-espresso",
      name: "Coorg Estate Cortado",
      description: "Equal parts double espresso and silky micro-foamed milk in a 4.5oz Gibraltar glass.",
      image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      base_price: 240.0,
      stock_count: 60,
      dietary_tags: "veg,gluten-free",
      station: "barista",
      prep_time_minutes: 3,
      calories: 90,
    },
    {
      id: "item-cold-brew",
      category_id: "cat-brews",
      name: "Monsooned Malabar Cold Brew",
      description: "20-hour steeped slow brew, infused with nitrogen for a velvety cascade with dark chocolate notes.",
      image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      base_price: 260.0,
      stock_count: 35,
      dietary_tags: "vegan,gluten-free",
      station: "barista",
      prep_time_minutes: 2,
      calories: 15,
    },
    {
      id: "item-matcha-cloud",
      category_id: "cat-brews",
      name: "Ceremonial Uji Matcha Cloud",
      description: "Stone-ground ceremonial grade matcha whisked fresh over oat milk with vanilla cream float.",
      image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
      base_price: 320.0,
      stock_count: 25,
      dietary_tags: "veg,gluten-free",
      station: "barista",
      prep_time_minutes: 4,
      calories: 180,
    },
    {
      id: "item-croissant",
      category_id: "cat-pastries",
      name: "Double Butter French Croissant",
      description: "32 hand-laminated layers of AOP French butter, baked golden with flaky honeycomb interior.",
      image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      base_price: 210.0,
      stock_count: 14,
      dietary_tags: "veg",
      station: "kitchen",
      prep_time_minutes: 3,
      calories: 280,
    },
    {
      id: "item-cheesecake",
      category_id: "cat-pastries",
      name: "San Sebastián Burnt Cheesecake",
      description: "Caramelized charred exterior with an ultra-creamy, custard-molten center and Maldon sea salt.",
      image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
      base_price: 340.0,
      stock_count: 4,
      dietary_tags: "veg,gluten-free",
      station: "kitchen",
      prep_time_minutes: 2,
      calories: 390,
    },
    {
      id: "item-avocado-toast",
      category_id: "cat-mains",
      name: "Heirloom Avocado Tartine",
      description: "Poached pasture eggs, smashed Hass avocado, watermelon radish, Egyptian dukkah on artisanal sourdough.",
      image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
      base_price: 440.0,
      stock_count: 18,
      dietary_tags: "veg",
      station: "kitchen",
      prep_time_minutes: 9,
      calories: 460,
    },
    {
      id: "item-truffle-burrata",
      category_id: "cat-mains",
      name: "Wild Truffle Burrata Brioche",
      description: "Sautéed wild king oyster & cremini mushrooms, artisanal burrata, white truffle drizzle on toasted brioche.",
      image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      base_price: 520.0,
      stock_count: 12,
      dietary_tags: "veg",
      station: "kitchen",
      prep_time_minutes: 11,
      calories: 520,
    },
    {
      id: "item-cardamom-tonic",
      category_id: "cat-addons",
      name: "Cardamom Espresso Tonic",
      description: "Chilled Indian tonic with double espresso float, green cardamom elixir & fresh orange twist.",
      image_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
      base_price: 270.0,
      stock_count: 30,
      dietary_tags: "vegan,gluten-free",
      station: "barista",
      prep_time_minutes: 3,
      calories: 75,
    },
  ];

  for (const m of menuItems) {
    db.run(
      `INSERT INTO menu_items (id, cafe_id, category_id, name, description, image_url, base_price, is_available, stock_count, dietary_tags, station, prep_time_minutes, calories)
       VALUES (?, 'cafe-aura-01', ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      [m.id, m.category_id, m.name, m.description, m.image_url, m.base_price, m.stock_count, m.dietary_tags, m.station, m.prep_time_minutes, m.calories]
    );
  }

  // Modifiers
  db.run("INSERT INTO modifier_groups (id, menu_item_id, name, selection_type, is_required) VALUES ('mg-milk', 'item-spanish-latte', 'Milk Choice', 'single', 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-whole', 'mg-milk', 'Whole Milk (Standard)', 0.0, 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-oat', 'mg-milk', 'Oat Milk (Oatly Barista)', 45.0, 0)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-almond', 'mg-milk', 'Organic Almond Milk', 40.0, 0)");

  db.run("INSERT INTO modifier_groups (id, menu_item_id, name, selection_type, is_required) VALUES ('mg-sugar', 'item-spanish-latte', 'Sweetness Level', 'single', 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-sugar-100', 'mg-sugar', '100% Standard Sweet', 0.0, 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-sugar-50', 'mg-sugar', '50% Less Sweet', 0.0, 0)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-sugar-0', 'mg-sugar', '0% Unsweetened', 0.0, 0)");

  db.run("INSERT INTO modifier_groups (id, menu_item_id, name, selection_type, is_required) VALUES ('mg-shots', 'item-spanish-latte', 'Espresso Shots', 'single', 0)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-shot-std', 'mg-shots', 'Standard Double Shot', 0.0, 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-shot-extra', 'mg-shots', 'Extra Espresso Shot (+18g)', 60.0, 0)");

  db.run("INSERT INTO modifier_groups (id, menu_item_id, name, selection_type, is_required) VALUES ('mg-egg-style', 'item-avocado-toast', 'Egg Preparation', 'single', 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-egg-poached', 'mg-egg-style', 'Soft Poached Eggs', 0.0, 1)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-egg-sunny', 'mg-egg-style', 'Sunny Side Up', 0.0, 0)");
  db.run("INSERT INTO modifier_options (id, group_id, name, price_delta, is_default) VALUES ('opt-egg-no', 'mg-egg-style', 'No Eggs (Vegan Sub)', -50.0, 0)");

  // Ingredients (in grams, ml, pcs with INR cost)
  const ingredients = [
    { id: "ing-espresso-beans", name: "Specialty Coorg Arabica Beans", category: "Coffee Beans", unit: "g", current_stock: 14200, reorder_level: 3000, unit_cost: 1.8 },
    { id: "ing-whole-milk", name: "Farm Fresh Whole Milk", category: "Dairy & Milk", unit: "ml", current_stock: 18500, reorder_level: 5000, unit_cost: 0.08 },
    { id: "ing-oat-milk", name: "Oatly Barista Edition", category: "Dairy & Milk", unit: "ml", current_stock: 4200, reorder_level: 5000, unit_cost: 0.22 },
    { id: "ing-almond-milk", name: "Organic Almond Milk", category: "Dairy & Milk", unit: "ml", current_stock: 6500, reorder_level: 3000, unit_cost: 0.20 },
    { id: "ing-condensed-milk", name: "Sweetened Condensed Milk", category: "Syrups & Sweeteners", unit: "ml", current_stock: 5200, reorder_level: 2000, unit_cost: 0.35 },
    { id: "ing-matcha", name: "Uji Ceremonial Matcha Grade A", category: "Coffee Beans", unit: "g", current_stock: 820, reorder_level: 250, unit_cost: 12.0 },
    { id: "ing-butter", name: "Normandy AOP Butter", category: "Bakery & Dough", unit: "g", current_stock: 3400, reorder_level: 1500, unit_cost: 0.95 },
    { id: "ing-sourdough", name: "Wild Yeast Sourdough Loaf", category: "Bakery & Dough", unit: "pcs", current_stock: 16, reorder_level: 6, unit_cost: 120.0 },
    { id: "ing-avocados", name: "Ripe Hass Avocados", category: "Produce & Dry Goods", unit: "pcs", current_stock: 8, reorder_level: 15, unit_cost: 85.0 },
    { id: "ing-eggs", name: "Pasture-Raised Brown Eggs", category: "Produce & Dry Goods", unit: "pcs", current_stock: 64, reorder_level: 30, unit_cost: 12.0 },
    { id: "ing-burrata", name: "Artisanal Burrata Cheese", category: "Dairy & Milk", unit: "pcs", current_stock: 14, reorder_level: 8, unit_cost: 180.0 },
    { id: "ing-truffle-oil", name: "White Truffle Infused Olive Oil", category: "Produce & Dry Goods", unit: "ml", current_stock: 1100, reorder_level: 400, unit_cost: 4.5 },
  ];

  for (const ing of ingredients) {
    db.run(
      `INSERT INTO ingredients (id, cafe_id, name, category, unit, current_stock, reorder_level, unit_cost)
       VALUES (?, 'cafe-aura-01', ?, ?, ?, ?, ?, ?)`,
      [ing.id, ing.name, ing.category, ing.unit, ing.current_stock, ing.reorder_level, ing.unit_cost]
    );
  }

  // Recipes mapping
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-sl-1', 'item-spanish-latte', 'ing-espresso-beans', 18, 'g')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-sl-2', 'item-spanish-latte', 'ing-whole-milk', 200, 'ml')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-sl-3', 'item-spanish-latte', 'ing-condensed-milk', 25, 'ml')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-cort-1', 'item-cortado', 'ing-espresso-beans', 18, 'g')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-cort-2', 'item-cortado', 'ing-whole-milk', 80, 'ml')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-cb-1', 'item-cold-brew', 'ing-espresso-beans', 25, 'g')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-mat-1', 'item-matcha-cloud', 'ing-matcha', 6, 'g')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-mat-2', 'item-matcha-cloud', 'ing-oat-milk', 220, 'ml')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-avo-1', 'item-avocado-toast', 'ing-sourdough', 0.2, 'pcs')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-avo-2', 'item-avocado-toast', 'ing-avocados', 1, 'pcs')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-avo-3', 'item-avocado-toast', 'ing-eggs', 2, 'pcs')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-truf-1', 'item-truffle-burrata', 'ing-burrata', 1, 'pcs')");
  db.run("INSERT INTO recipe_items (id, menu_item_id, ingredient_id, quantity_required, unit) VALUES ('rec-truf-2', 'item-truffle-burrata', 'ing-truffle-oil', 15, 'ml')");

  // Modifier Ingredient Linkages (Crucial for Phase 3 Recipe & Modifier Deductions)
  // Oat milk replaces whole milk: +200ml oat milk, -200ml whole milk
  db.run("INSERT INTO modifier_ingredients (id, modifier_option_id, ingredient_id, quantity_delta, unit) VALUES ('mod-ing-oat-add', 'opt-oat', 'ing-oat-milk', 200, 'ml')");
  db.run("INSERT INTO modifier_ingredients (id, modifier_option_id, ingredient_id, quantity_delta, unit) VALUES ('mod-ing-oat-sub', 'opt-oat', 'ing-whole-milk', -200, 'ml')");
  // Almond milk replaces whole milk: +200ml almond milk, -200ml whole milk
  db.run("INSERT INTO modifier_ingredients (id, modifier_option_id, ingredient_id, quantity_delta, unit) VALUES ('mod-ing-alm-add', 'opt-almond', 'ing-almond-milk', 200, 'ml')");
  db.run("INSERT INTO modifier_ingredients (id, modifier_option_id, ingredient_id, quantity_delta, unit) VALUES ('mod-ing-alm-sub', 'opt-almond', 'ing-whole-milk', -200, 'ml')");
  // Extra shot: +18g espresso beans
  db.run("INSERT INTO modifier_ingredients (id, modifier_option_id, ingredient_id, quantity_delta, unit) VALUES ('mod-ing-shot-add', 'opt-shot-extra', 'ing-espresso-beans', 18, 'g')");
  // No eggs: subtract the 2 eggs from recipe
  db.run("INSERT INTO modifier_ingredients (id, modifier_option_id, ingredient_id, quantity_delta, unit) VALUES ('mod-ing-egg-no', 'opt-egg-no', 'ing-eggs', -2, 'pcs')");

  // Seed 12 Tables with Cryptographic QR Tokens
  const tables = [
    { num: 1, label: "T-01 Window Bar", cap: 2, zone: "Window Bar", x: 10, y: 15 },
    { num: 2, label: "T-02 Cozy Booth", cap: 4, zone: "Main Dining", x: 35, y: 15 },
    { num: 3, label: "T-03 Center Table", cap: 4, zone: "Main Dining", x: 60, y: 15 },
    { num: 4, label: "T-04 Banquette", cap: 6, zone: "Main Dining", x: 85, y: 15 },
    { num: 5, label: "T-05 Lounge", cap: 4, zone: "Main Dining", x: 10, y: 50 },
    { num: 6, label: "T-06 Corner", cap: 2, zone: "Main Dining", x: 35, y: 50 },
    { num: 7, label: "T-07 Garden Arbor", cap: 4, zone: "Patio Garden", x: 60, y: 50 },
    { num: 8, label: "T-08 Olive Tree", cap: 4, zone: "Patio Garden", x: 85, y: 50 },
    { num: 9, label: "T-09 Patio Terrace", cap: 6, zone: "Patio Garden", x: 10, y: 80 },
    { num: 10, label: "T-10 Espresso Bar A", cap: 1, zone: "Window Bar", x: 35, y: 80 },
    { num: 11, label: "T-11 Espresso Bar B", cap: 1, zone: "Window Bar", x: 60, y: 80 },
    { num: 12, label: "T-12 Espresso Bar C", cap: 1, zone: "Window Bar", x: 85, y: 80 },
  ];

  for (const t of tables) {
    const token = generateSignedQrToken(t.num);
    db.run(
      `INSERT INTO tables (id, cafe_id, table_number, label, capacity, zone, qr_token, status, position_x, position_y, updated_at)
       VALUES (?, 'cafe-aura-01', ?, ?, ?, ?, ?, 'vacant', ?, ?, datetime('now'))`,
      [`tbl-${t.num}`, t.num, t.label, t.cap, t.zone, token, t.x, t.y]
    );
  }

  // Vendors
  db.run("INSERT INTO vendors VALUES ('ven-roaster', 'Blue Tokai & Coorg Coffee Estate', 'Marcus Vance', '+91 98450 11223', 'orders@bluetokai.com', 'Specialty Coffee Beans', 2)");
  db.run("INSERT INTO vendors VALUES ('ven-dairy', 'Akshayakalpa Organic Dairy', 'Dr. Shashi Kumar', '+91 98451 22334', 'b2b@akshayakalpa.org', 'A2 Organic Milk & Plant Milks', 1)");
  db.run("INSERT INTO vendors VALUES ('ven-bakery', 'Sour House Artisan Boulangerie', 'Chef Selvan', '+91 98452 33445', 'supply@sourhouse.in', 'Sourdough Loaves & Viennoiserie', 1)");
  db.run("INSERT INTO vendors VALUES ('ven-produce', 'Triton Hydroponics & Farm Co.', 'Elena Gomez', '+91 98453 44556', 'fresh@tritonfarms.in', 'Hass Avocados, Microgreens & Eggs', 2)");

  // Staff Users
  const staffUsers = [
    { id: "staff-owner", name: "Aura Owner", email: "owner@auracafe.com", role: "owner", pin: "1234" },
    { id: "staff-manager", name: "Floor Manager", email: "manager@auracafe.com", role: "manager", pin: "1111" },
    { id: "staff-barista", name: "Head Barista / Chef", email: "barista@auracafe.com", role: "barista", pin: "2345" },
    { id: "staff-waitstaff", name: "Floor Waitstaff", email: "waitstaff@auracafe.com", role: "waitstaff", pin: "3456" },
    { id: "staff-cashier", name: "Billing Cashier", email: "cashier@auracafe.com", role: "cashier", pin: "4567" },
  ];
  for (const s of staffUsers) {
    const pinHash = crypto.createHash("sha256").update(s.pin).digest("hex");
    db.run(
      "INSERT OR REPLACE INTO staff_users (id, name, email, role, pin_hash, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))",
      [s.id, s.name, s.email, s.role, pinHash]
    );
  }
}

export function seedDatabase(force: boolean = false) {
  if (force) {
    db.run("DELETE FROM order_items");
    db.run("DELETE FROM orders");
    db.run("DELETE FROM invoices");
    db.run("DELETE FROM service_requests");
    db.run("DELETE FROM audit_logs");
    db.run("DELETE FROM eod_reconciliations");
    db.run("DELETE FROM wastage_logs");
    db.run("DELETE FROM purchase_orders");
    db.run("DELETE FROM modifier_ingredients");
    db.run("DELETE FROM modifier_options");
    db.run("DELETE FROM modifier_groups");
    db.run("DELETE FROM recipe_items");
    db.run("DELETE FROM ingredients");
    db.run("DELETE FROM menu_items");
    db.run("DELETE FROM menu_categories");
    db.run("DELETE FROM diners");
    db.run("DELETE FROM table_sessions");
    db.run("DELETE FROM customers");
    db.run("DELETE FROM tables");
    db.run("DELETE FROM cafe");
    db.run("DELETE FROM staff_users");
    db.run("DELETE FROM vendors");
    db.run("DELETE FROM otp_verifications");
    seedDatabaseInternal();
    return;
  }
  const cafeExists = db.query("SELECT id FROM cafe LIMIT 1").get();
  if (cafeExists) return;
  seedDatabaseInternal();
}

seedDatabase();

// Exported Repository Database APIs
export const DB = {
  // Cafe
  getCafe: () => db.query("SELECT * FROM cafe LIMIT 1").get() as any,

  // Tables
  getAllTables: () => db.query("SELECT * FROM tables ORDER BY table_number ASC").all() as any[],
  
  getTableById: (id: string) => {
    return db.query("SELECT * FROM tables WHERE id = ? OR table_number = ?").get(id, isNaN(Number(id)) ? -1 : Number(id)) as any;
  },

  getTableByQrToken: (qrToken: string) => {
    return db.query("SELECT * FROM tables WHERE qr_token = ?").get(qrToken) as any;
  },

  updateTableStatus: (tableId: string, status: string) => {
    db.run("UPDATE tables SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, tableId]);
    return db.query("SELECT * FROM tables WHERE id = ?").get(tableId) as any;
  },

  updateTablePosition: (tableId: string, x: number, y: number) => {
    db.run("UPDATE tables SET position_x = ?, position_y = ?, updated_at = datetime('now') WHERE id = ?", [x, y, tableId]);
    return db.query("SELECT * FROM tables WHERE id = ?").get(tableId) as any;
  },

  mergeTables: (targetTableNumber: number, sourceTableNumber: number) => {
    const target = db.query("SELECT * FROM tables WHERE table_number = ?").get(targetTableNumber) as any;
    const source = db.query("SELECT * FROM tables WHERE table_number = ?").get(sourceTableNumber) as any;
    if (!target || !source) return null;

    // Check if already merged to prevent redundant capacity addition (Phase 3 bug fix)
    const existingMerged: number[] = target.merged_with ? target.merged_with.split(",").map(Number) : [];
    if (existingMerged.includes(sourceTableNumber)) {
      return target; // Already merged, avoid duplicate capacity addition!
    }

    const newMerged = [...existingMerged, sourceTableNumber];
    const newCapacity = target.capacity + source.capacity;

    db.run(
      "UPDATE tables SET merged_with = ?, capacity = ?, status = ?, updated_at = datetime('now') WHERE table_number = ?",
      [newMerged.join(","), newCapacity, target.status, targetTableNumber]
    );

    db.run(
      "UPDATE tables SET merged_with = ?, status = ?, updated_at = datetime('now') WHERE table_number = ?",
      [String(targetTableNumber), target.status, sourceTableNumber]
    );

    return db.query("SELECT * FROM tables WHERE table_number = ?").get(targetTableNumber) as any;
  },

  splitTables: (tableNumber: number) => {
    const target = db.query("SELECT * FROM tables WHERE table_number = ?").get(tableNumber) as any;
    if (!target || !target.merged_with) return null;

    const mergedNumbers: number[] = target.merged_with.split(",").map(Number);
    let originalCapacity = target.capacity;

    for (const sourceNum of mergedNumbers) {
      const source = db.query("SELECT * FROM tables WHERE table_number = ?").get(sourceNum) as any;
      if (source) {
        originalCapacity -= source.capacity;
        db.run("UPDATE tables SET merged_with = NULL, status = 'vacant', updated_at = datetime('now') WHERE table_number = ?", [sourceNum]);
      }
    }

    db.run("UPDATE tables SET merged_with = NULL, capacity = ?, updated_at = datetime('now') WHERE table_number = ?", [Math.max(2, originalCapacity), tableNumber]);
    return db.query("SELECT * FROM tables WHERE table_number = ?").get(tableNumber) as any;
  },

  resetTable: (tableId: string) => {
    db.run("UPDATE tables SET status = 'vacant', updated_at = datetime('now') WHERE id = ?", [tableId]);
    return db.query("SELECT * FROM tables WHERE id = ?").get(tableId) as any;
  },

  // Customer & Session Auth (Feature 1)
  getOrCreateCustomer: (phone_e164: string, name: string, marketingOptIn: boolean = false) => {
    let customer = db.query("SELECT * FROM customers WHERE phone_e164 = ?").get(phone_e164) as any;
    if (!customer) {
      const id = `cust-${crypto.randomBytes(6).toString("hex")}`;
      db.run(
        "INSERT INTO customers (id, phone_e164, name, marketing_opt_in, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, phone_e164, name, marketingOptIn ? 1 : 0]
      );
      customer = db.query("SELECT * FROM customers WHERE id = ?").get(id) as any;
    } else if (name && customer.name !== name) {
      db.run("UPDATE customers SET name = ? WHERE id = ?", [name, customer.id]);
      customer.name = name;
    }
    return customer;
  },

  getCustomerById: (id: string) => {
    return db.query("SELECT * FROM customers WHERE id = ?").get(id) as any;
  },

  getOrCreateActiveTableSession: (tableId: string) => {
    let session = db.query("SELECT * FROM table_sessions WHERE table_id = ? AND status = 'ACTIVE' LIMIT 1").get(tableId) as any;
    if (!session) {
      const id = `sess-${crypto.randomBytes(6).toString("hex")}`;
      db.run("INSERT INTO table_sessions (id, table_id, opened_at, status) VALUES (?, ?, datetime('now'), 'ACTIVE')", [id, tableId]);
      session = db.query("SELECT * FROM table_sessions WHERE id = ?").get(id) as any;
    }
    return session;
  },

  getOrCreateDiner: (tableSessionId: string, customerId: string) => {
    let diner = db.query("SELECT * FROM diners WHERE table_session_id = ? AND customer_id = ?").get(tableSessionId, customerId) as any;
    if (!diner) {
      const id = `din-${crypto.randomBytes(6).toString("hex")}`;
      db.run("INSERT INTO diners (id, table_session_id, customer_id, created_at) VALUES (?, ?, ?, datetime('now'))", [id, tableSessionId, customerId]);
      diner = db.query("SELECT * FROM diners WHERE id = ?").get(id) as any;
    }
    return diner;
  },

  // Public Menu (Cleaned for Customer view - Phase 1 access control)
  getPublicMenu: () => {
    const categories = db.query("SELECT * FROM menu_categories ORDER BY sort_order ASC").all() as any[];
    const items = db.query("SELECT id, category_id, name, description, image_url, base_price, is_available, stock_count, dietary_tags, station, prep_time_minutes, calories FROM menu_items WHERE is_available = 1").all() as any[];
    const modifierGroups = db.query("SELECT * FROM modifier_groups").all() as any[];
    const modifierOptions = db.query("SELECT id, group_id, name, price_delta, is_default FROM modifier_options").all() as any[];

    const formattedItems = items.map((item) => {
      const groups = modifierGroups.filter((g) => g.menu_item_id === item.id).map((g) => ({
        id: g.id,
        name: g.name,
        selection_type: g.selection_type,
        is_required: Boolean(g.is_required),
        options: modifierOptions.filter((o) => o.group_id === g.id).map((o) => ({
          id: o.id,
          name: o.name,
          price_delta: o.price_delta,
          is_default: Boolean(o.is_default),
        })),
      }));

      return {
        ...item,
        dietary_tags: item.dietary_tags.split(","),
        modifier_groups: groups,
      };
    });

    return { categories, items: formattedItems };
  },

  // Atomic Daily Order Sequence (#ORD-YYYYMMDD-XXXX) - Phase 2 requirement
  generateOrderNumber: (): string => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20261006
    const countRow = db.query("SELECT COUNT(*) as count FROM orders WHERE order_number LIKE ?").get(`ORD-${todayStr}-%`) as any;
    const nextSeq = (countRow?.count || 0) + 1;
    return `ORD-${todayStr}-${String(nextSeq).padStart(4, "0")}`;
  },

  // Atomic Daily Invoice Sequence (#INV-YYYYMMDD-XXXX) - Feature 2 requirement
  generateInvoiceNumber: (): string => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countRow = db.query("SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?").get(`INV-${todayStr}-%`) as any;
    const nextSeq = (countRow?.count || 0) + 1;
    return `INV-${todayStr}-${String(nextSeq).padStart(4, "0")}`;
  },

  // Authoritative Order Creation with Server-side pricing & split GST (Phase 2 & Phase 3)
  createOrderSecure: (params: {
    table_id: string;
    table_session_id?: string;
    customer_id?: string;
    customer_name: string;
    diner_id?: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      selected_option_ids?: string[];
      notes?: string;
    }>;
    payment_method?: string;
    payment_status?: string;
    service_charge_opt_in?: boolean;
    tip_amount?: number;
  }) => {
    const cafe = db.query("SELECT * FROM cafe LIMIT 1").get() as any;
    const table = db.query("SELECT * FROM tables WHERE id = ?").get(params.table_id) as any;
    if (!table) throw new Error("Invalid table ID");

    // Resolve or create active table session
    const resolvedSessionId = params.table_session_id || DB.getOrCreateActiveTableSession(table.id).id;

    const orderId = `ord-${crypto.randomBytes(8).toString("hex")}`;
    const orderNumber = DB.generateOrderNumber();

    let computedSubtotal = 0;
    const validatedOrderItems: any[] = [];
    const inventoryDeductions: Array<{ ingredient_id: string; quantity: number }> = [];

    // Verify each item and options against database authority
    for (const reqItem of params.items) {
      const dbItem = db.query("SELECT * FROM menu_items WHERE id = ?").get(reqItem.menu_item_id) as any;
      if (!dbItem || !dbItem.is_available) {
        throw new Error(`Item ${reqItem.menu_item_id} is unavailable or does not exist`);
      }

      let unitPrice = dbItem.base_price;
      const validatedModifiers: any[] = [];

      // Check modifier options and calculate price delta
      if (reqItem.selected_option_ids && reqItem.selected_option_ids.length > 0) {
        for (const optId of reqItem.selected_option_ids) {
          const opt = db.query("SELECT o.*, g.name as group_name FROM modifier_options o JOIN modifier_groups g ON o.group_id = g.id WHERE o.id = ?").get(optId) as any;
          if (opt) {
            unitPrice += opt.price_delta;
            validatedModifiers.push({
              id: `oim-${crypto.randomBytes(6).toString("hex")}`,
              modifier_option_id: opt.id,
              group_name: opt.group_name,
              option_name: opt.name,
              price_delta: opt.price_delta,
            });

            // Check modifier ingredient overrides (e.g. Oat Milk +200ml, Whole Milk -200ml)
            const modDeltas = db.query("SELECT * FROM modifier_ingredients WHERE modifier_option_id = ?").all(opt.id) as any[];
            for (const delta of modDeltas) {
              inventoryDeductions.push({
                ingredient_id: delta.ingredient_id,
                quantity: delta.quantity_delta * reqItem.quantity,
              });
            }
          }
        }
      }

      // Base recipe ingredients
      const baseRecipes = db.query("SELECT * FROM recipe_items WHERE menu_item_id = ?").all(dbItem.id) as any[];
      for (const rec of baseRecipes) {
        inventoryDeductions.push({
          ingredient_id: rec.ingredient_id,
          quantity: rec.quantity_required * reqItem.quantity,
        });
      }

      const itemTotal = unitPrice * reqItem.quantity;
      computedSubtotal += itemTotal;

      validatedOrderItems.push({
        id: `oi-${crypto.randomBytes(6).toString("hex")}`,
        order_id: orderId,
        diner_id: params.diner_id,
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        station: dbItem.station,
        quantity: reqItem.quantity,
        unit_price: Number(unitPrice.toFixed(2)),
        notes: reqItem.notes || null,
        modifiers: validatedModifiers,
      });
    }

    // Server-Side Indian GST Calculation: 2.5% CGST + 2.5% SGST
    const cgstAmount = Number((computedSubtotal * cafe.cgst_rate).toFixed(2));
    const sgstAmount = Number((computedSubtotal * cafe.sgst_rate).toFixed(2));
    const totalTax = Number((cgstAmount + sgstAmount).toFixed(2));

    // Optional 5% service charge
    const serviceFee = params.service_charge_opt_in ? Number((computedSubtotal * cafe.service_fee_rate).toFixed(2)) : 0;
    const tip = Math.max(0, Number(params.tip_amount || 0));
    const grandTotal = Number((computedSubtotal + totalTax + serviceFee + tip).toFixed(2));

    // Transactional DB write
    const insertTransaction = db.transaction(() => {
      // 1. Insert Order
      db.run(
        `INSERT INTO orders (
          id, order_number, table_session_id, table_id, table_number, customer_id, customer_name,
          status, subtotal, cgst_amount, sgst_amount, total_tax, service_fee, tip_amount, total_amount,
          payment_status, payment_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          orderId, orderNumber, resolvedSessionId, table.id, table.table_number,
          params.customer_id || null, params.customer_name,
          computedSubtotal, cgstAmount, sgstAmount, totalTax, serviceFee, tip, grandTotal,
          params.payment_status || "pending", params.payment_method || "razorpay"
        ]
      );

      // 2. Insert Order Items & Modifiers
      for (const item of validatedOrderItems) {
        db.run(
          `INSERT INTO order_items (id, order_id, diner_id, menu_item_id, item_name, station, quantity, unit_price, notes, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
          [item.id, item.order_id, item.diner_id, item.menu_item_id, item.item_name, item.station, item.quantity, item.unit_price, item.notes]
        );

        for (const mod of item.modifiers) {
          db.run(
            `INSERT INTO order_item_modifiers (id, order_item_id, modifier_option_id, group_name, option_name, price_delta)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [mod.id, item.id, mod.modifier_option_id, mod.group_name, mod.option_name, mod.price_delta]
          );
        }

        // Decrement MenuItem.stock_count dynamically and flag available = false if 0
        db.run(
          "UPDATE menu_items SET stock_count = MAX(0, stock_count - ?), is_available = CASE WHEN stock_count - ? <= 0 THEN 0 ELSE 1 END WHERE id = ?",
          [item.quantity, item.quantity, item.menu_item_id]
        );
      }

      // 3. Apply Inventory Deductions
      for (const ded of inventoryDeductions) {
        db.run(
          "UPDATE ingredients SET current_stock = MAX(0, current_stock - ?) WHERE id = ?",
          [ded.quantity, ded.ingredient_id]
        );
      }

      // 4. Update Table status to active_order
      db.run("UPDATE tables SET status = 'active_order', updated_at = datetime('now') WHERE id = ?", [table.id]);
    });

    insertTransaction();

    return DB.getOrderDetails(orderId);
  },

  // Get full order details with items and modifiers
  getOrderDetails: (orderId: string) => {
    const order = db.query("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    if (!order) return null;

    const items = db.query("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as any[];
    for (const item of items) {
      item.modifiers = db.query("SELECT * FROM order_item_modifiers WHERE order_item_id = ?").all(item.id) as any[];
    }
    order.items = items;
    order.invoice = db.query("SELECT * FROM invoices WHERE order_id = ?").get(orderId) as any;
    return order;
  },

  // Cancel order & restore inventory (Phase 3 stock restoration)
  cancelOrder: (orderId: string) => {
    const order = DB.getOrderDetails(orderId);
    if (!order || order.status === "cancelled") return null;

    // Only restore if not already delivered/completed
    db.transaction(() => {
      // 1. Mark order cancelled
      db.run("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [orderId]);
      db.run("UPDATE order_items SET status = 'cancelled' WHERE order_id = ?", [orderId]);

      // 2. Restore MenuItem stock
      for (const item of order.items) {
        db.run(
          "UPDATE menu_items SET stock_count = stock_count + ?, is_available = 1 WHERE id = ?",
          [item.quantity, item.menu_item_id]
        );

        // Restore ingredients from base recipes
        const baseRecipes = db.query("SELECT * FROM recipe_items WHERE menu_item_id = ?").all(item.menu_item_id) as any[];
        for (const rec of baseRecipes) {
          db.run(
            "UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?",
            [rec.quantity_required * item.quantity, rec.ingredient_id]
          );
        }

        // Restore modifier ingredient overrides
        for (const mod of item.modifiers) {
          const modDeltas = db.query("SELECT * FROM modifier_ingredients WHERE modifier_option_id = ?").all(mod.modifier_option_id) as any[];
          for (const delta of modDeltas) {
            db.run(
              "UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?",
              [delta.quantity_delta * item.quantity, delta.ingredient_id]
            );
          }
        }
      }

      // 3. Check remaining active orders on this table session before updating table status (Phase 3 bug fix)
      const remainingOrders = db.query(
        "SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status NOT IN ('completed', 'cancelled')"
      ).get(order.table_id) as any;

      if (!remainingOrders || remainingOrders.count === 0) {
        db.run("UPDATE tables SET status = 'vacant', updated_at = datetime('now') WHERE id = ?", [order.table_id]);
      }
    })();

    return DB.getOrderDetails(orderId);
  },

  // Order status transition pipeline
  updateOrderStatus: (orderId: string, status: string, payment_status?: string, razorpay_payment_id?: string) => {
    const order = db.query("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    if (!order) return null;

    db.transaction(() => {
      let query = "UPDATE orders SET status = ?, updated_at = datetime('now')";
      const params: any[] = [status];

      if (payment_status) {
        query += ", payment_status = ?";
        params.push(payment_status);
      }
      if (razorpay_payment_id) {
        query += ", razorpay_payment_id = ?";
        params.push(razorpay_payment_id);
      }

      query += " WHERE id = ?";
      params.push(orderId);

      db.run(query, params);

      // Cascade item statuses
      if (status === "served") {
        db.run("UPDATE order_items SET status = 'delivered' WHERE order_id = ?", [orderId]);
      } else if (status === "ready") {
        db.run("UPDATE order_items SET status = 'ready' WHERE order_id = ?", [orderId]);
      } else if (status === "preparing") {
        db.run("UPDATE order_items SET status = 'preparing' WHERE order_id = ? AND status = 'pending'", [orderId]);
      }

      // If payment transitioned to PAID, generate GST Invoice automatically!
      if (payment_status === "paid" && !order.invoice_number) {
        const invNumber = DB.generateInvoiceNumber();
        const cafe = db.query("SELECT * FROM cafe LIMIT 1").get() as any;
        const customer = order.customer_id ? db.query("SELECT * FROM customers WHERE id = ?").get(order.customer_id) as any : null;

        db.run(
          `INSERT INTO invoices (
            id, invoice_number, order_id, customer_name, customer_phone, gstin, fssai_number,
            hsn_sac_code, subtotal, cgst_amount, sgst_amount, service_fee, tip_amount, total_amount, whatsapp_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, '996331', ?, ?, ?, ?, ?, ?, 'QUEUED', datetime('now'))`,
          [
            `inv-${crypto.randomBytes(6).toString("hex")}`,
            invNumber,
            orderId,
            order.customer_name,
            customer?.phone_e164 || "+919876543210",
            cafe.gstin,
            cafe.fssai_number,
            order.subtotal,
            order.cgst_amount,
            order.sgst_amount,
            order.service_fee,
            order.tip_amount,
            order.total_amount,
          ]
        );

        db.run("UPDATE orders SET invoice_number = ? WHERE id = ?", [invNumber, orderId]);
      }

      // Check table status on completion (Phase 3 bug fix: don't set to vacant if other active orders remain!)
      if (status === "completed") {
        const remainingActive = db.query(
          "SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND id != ? AND status NOT IN ('completed', 'cancelled')"
        ).get(order.table_id, orderId) as any;

        if (!remainingActive || remainingActive.count === 0) {
          db.run("UPDATE tables SET status = 'vacant', updated_at = datetime('now') WHERE id = ?", [order.table_id]);
          db.run("UPDATE table_sessions SET status = 'CLOSED', closed_at = datetime('now') WHERE id = ?", [order.table_session_id]);
        }
      } else if (payment_status === "cash_pending") {
        db.run("UPDATE tables SET status = 'billing', updated_at = datetime('now') WHERE id = ?", [order.table_id]);
      }
    })();

    return DB.getOrderDetails(orderId);
  },

  updateOrderItemStatus: (orderId: string, itemId: string, itemStatus: string) => {
    db.run("UPDATE order_items SET status = ? WHERE id = ? AND order_id = ?", [itemStatus, itemId, orderId]);
    return DB.getOrderDetails(orderId);
  },

  // Active orders for KDS
  getAllActiveOrders: () => {
    const orders = db.query("SELECT * FROM orders WHERE status NOT IN ('completed', 'cancelled') ORDER BY created_at ASC").all() as any[];
    for (const order of orders) {
      order.items = db.query("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as any[];
      for (const item of order.items) {
        item.modifiers = db.query("SELECT * FROM order_item_modifiers WHERE order_item_id = ?").all(item.id) as any[];
      }
    }
    return orders;
  },

  // Customer Active Orders for Table Session (Phase 1 Data Leakage fix)
  getCustomerSessionOrders: (tableSessionId: string) => {
    const orders = db.query("SELECT * FROM orders WHERE table_session_id = ? ORDER BY created_at DESC").all(tableSessionId) as any[];
    for (const order of orders) {
      order.items = db.query("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as any[];
      for (const item of order.items) {
        item.modifiers = db.query("SELECT * FROM order_item_modifiers WHERE order_item_id = ?").all(item.id) as any[];
      }
      order.invoice = db.query("SELECT * FROM invoices WHERE order_id = ?").get(order.id) as any;
    }
    return orders;
  },

  // Invoices (Feature 2)
  getInvoiceByNumber: (invoiceNumber: string) => {
    const inv = db.query("SELECT * FROM invoices WHERE invoice_number = ?").get(invoiceNumber) as any;
    if (!inv) return null;
    inv.order = DB.getOrderDetails(inv.order_id);
    return inv;
  },

  getInvoiceById: (id: string) => {
    const inv = db.query("SELECT * FROM invoices WHERE id = ?").get(id) as any;
    if (!inv) return null;
    inv.order = DB.getOrderDetails(inv.order_id);
    return inv;
  },

  updateInvoiceWhatsAppStatus: (invoiceId: string, status: string) => {
    db.run("UPDATE invoices SET whatsapp_status = ? WHERE id = ?", [status, invoiceId]);
  },

  // Service Requests
  createServiceRequest: (tableNumber: number, type: string, message?: string) => {
    const table = db.query("SELECT id FROM tables WHERE table_number = ?").get(tableNumber) as any;
    const id = `req-${crypto.randomBytes(6).toString("hex")}`;
    db.run(
      "INSERT INTO service_requests (id, table_id, table_number, type, message, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))",
      [id, table ? table.id : `tbl-${tableNumber}`, tableNumber, type, message || null]
    );
    return db.query("SELECT * FROM service_requests WHERE id = ?").get(id) as any;
  },

  getPendingServiceRequests: () => {
    return db.query("SELECT * FROM service_requests WHERE status = 'pending' ORDER BY created_at DESC").all() as any[];
  },

  resolveServiceRequest: (id: string) => {
    db.run("UPDATE service_requests SET status = 'resolved' WHERE id = ?", [id]);
    return db.query("SELECT * FROM service_requests WHERE id = ?").get(id) as any;
  },

  // Inventory & Wastage
  getAllIngredients: () => db.query("SELECT * FROM ingredients ORDER BY name ASC").all() as any[],
  
  logWastage: (ingredientId: string, quantity: number, reason: string, loggedBy: string) => {
    const ing = db.query("SELECT * FROM ingredients WHERE id = ?").get(ingredientId) as any;
    if (!ing) return null;

    const cost = Number((quantity * ing.unit_cost).toFixed(2));
    const id = `waste-${crypto.randomBytes(6).toString("hex")}`;

    db.transaction(() => {
      db.run("UPDATE ingredients SET current_stock = MAX(0, current_stock - ?) WHERE id = ?", [quantity, ingredientId]);
      db.run(
        "INSERT INTO wastage_logs (id, ingredient_id, ingredient_name, quantity, unit, cost, reason, logged_by, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
        [id, ingredientId, ing.name, quantity, ing.unit, cost, reason, loggedBy]
      );
    })();

    return db.query("SELECT * FROM wastage_logs WHERE id = ?").get(id) as any;
  },

  getWastageLogs: () => db.query("SELECT * FROM wastage_logs ORDER BY logged_at DESC LIMIT 50").all() as any[],

  // Vendors & POs
  getAllVendors: () => db.query("SELECT * FROM vendors").all() as any[],
  
  createPurchaseOrder: (vendorId: string, items: any[]) => {
    const vendor = db.query("SELECT * FROM vendors WHERE id = ?").get(vendorId) as any;
    if (!vendor) return null;

    const id = `po-${crypto.randomBytes(6).toString("hex")}`;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const poNumber = `PO-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalCost = items.reduce((sum, i) => sum + (i.total_cost || i.unit_cost * i.quantity), 0);

    db.run(
      `INSERT INTO purchase_orders (id, vendor_id, vendor_name, po_number, items_json, total_cost, status, expected_delivery, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, datetime('now'))`,
      [id, vendor.id, vendor.name, poNumber, JSON.stringify(items), totalCost, `In ${vendor.lead_time_days} days`]
    );

    return db.query("SELECT * FROM purchase_orders WHERE id = ?").get(id) as any;
  },

  getPurchaseOrders: () => {
    const pos = db.query("SELECT * FROM purchase_orders ORDER BY created_at DESC").all() as any[];
    return pos.map((p) => ({
      ...p,
      items: JSON.parse(p.items_json),
    }));
  },

  // Analytics Computation for Staff Dashboard
  getAnalytics: () => {
    const orders = db.query("SELECT * FROM orders WHERE status != 'cancelled'").all() as any[];
    const grossRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const netRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const orderCount = orders.length;
    const aov = orderCount > 0 ? grossRevenue / orderCount : 0;

    const tables = db.query("SELECT * FROM tables").all() as any[];
    const activeTables = tables.filter((t) => t.status !== "vacant").length;
    const occupancyRate = tables.length > 0 ? (activeTables / tables.length) * 100 : 0;

    // Top selling
    const topSelling = db.query(`
      SELECT item_name as name, station, SUM(quantity) as quantity, SUM(quantity * unit_price) as revenue
      FROM order_items
      WHERE status != 'cancelled'
      GROUP BY menu_item_id
      ORDER BY revenue DESC
      LIMIT 5
    `).all() as any[];

    // Payment methods
    const paymentBreakdown: Record<string, number> = {
      razorpay: 0,
      apple_pay: 0,
      google_pay: 0,
      upi: 0,
      card: 0,
      cash: 0,
    };
    for (const o of orders) {
      const method = o.payment_method || "card";
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + o.total_amount;
    }

    const peakHours = [
      { hour: "08:00 AM", orders: 18, revenue: 3820 },
      { hour: "09:00 AM", orders: 32, revenue: 7450 },
      { hour: "10:00 AM", orders: 45, revenue: 11200 },
      { hour: "11:00 AM", orders: 39, revenue: 9800 },
      { hour: "12:00 PM", orders: 54, revenue: 14600 },
      { hour: "01:00 PM", orders: 48, revenue: 12900 },
      { hour: "02:00 PM", orders: 26, revenue: 6400 },
      { hour: "03:00 PM", orders: 30, revenue: 7800 },
    ];

    const ingredients = db.query("SELECT * FROM ingredients LIMIT 6").all() as any[];
    const ingredientConsumption = ingredients.map((ing) => ({
      name: ing.name,
      amount: Math.round(ing.reorder_level * 1.2),
      unit: ing.unit,
      stockRemaining: ing.current_stock,
    }));

    return {
      gross_revenue: Number(grossRevenue.toFixed(2)),
      net_revenue: Number(netRevenue.toFixed(2)),
      order_count: orderCount,
      average_order_value: Number(aov.toFixed(2)),
      table_turnover_rate: 3.8,
      active_table_count: activeTables,
      total_table_count: tables.length,
      occupancy_rate: Number(occupancyRate.toFixed(1)),
      top_selling_items: topSelling.map((t) => ({ ...t, category: t.station === "barista" ? "Beverages" : "Food" })),
      peak_order_hours: peakHours,
      payment_method_breakdown: paymentBreakdown,
      ingredient_consumption_today: ingredientConsumption,
    };
  },

  // OTP Management (Feature 1)
  saveOtp: (phone: string, code: string, expiresAt: Date) => {
    db.run(
      "INSERT OR REPLACE INTO otp_verifications (phone, code, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, datetime('now'))",
      [phone, code, expiresAt.toISOString()]
    );
  },

  verifyOtp: (phone: string, inputCode: string): boolean => {
    const record = db.query("SELECT * FROM otp_verifications WHERE phone = ?").get(phone) as any;
    if (!record) return false;

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      db.run("DELETE FROM otp_verifications WHERE phone = ?", [phone]);
      return false;
    }

    if (record.code === inputCode) {
      db.run("DELETE FROM otp_verifications WHERE phone = ?", [phone]);
      return true;
    }

    db.run("UPDATE otp_verifications SET attempts = attempts + 1 WHERE phone = ?", [phone]);
    return false;
  },

  // 1. Offline Counter Settle Bill (Staff Action)
  settleBillSecure: (params: {
    orderId: string;
    paymentMethod: "cash" | "upi" | "card";
    discount?: {
      type: "flat" | "percentage" | "comp" | "staff_meal";
      value: number;
      reason: string;
      managerPin?: string;
    };
    tip?: number;
    serviceChargeOptIn?: boolean;
    customerPhone?: string;
    actor: { id: string; name: string; role: string };
    ipAddress?: string;
  }) => {
    const order = db.query("SELECT * FROM orders WHERE id = ?").get(params.orderId) as any;
    if (!order) throw new Error("Order not found");
    if (order.payment_status === "paid") throw new Error("Order is already settled and paid");
    if (order.is_void) throw new Error("Cannot settle a voided order");

    const cafe = db.query("SELECT * FROM cafe LIMIT 1").get() as any;

    // Validate discount
    let discountAmount = 0;
    if (params.discount && params.discount.value > 0) {
      if (!params.discount.reason || params.discount.reason.trim().length < 5) {
        throw new Error("Mandatory discount reason of at least 5 characters is required");
      }
      if (params.discount.type === "percentage") {
        discountAmount = Number(((order.subtotal * params.discount.value) / 100).toFixed(2));
      } else {
        discountAmount = Number(params.discount.value.toFixed(2));
      }
      discountAmount = Math.min(discountAmount, order.subtotal);

      // Check role policy: Cashier max 10% or ₹200 unless manager PIN or manager/owner role
      const isHighDiscount = (params.discount.type === "percentage" && params.discount.value > 10) || discountAmount > 200;
      if (isHighDiscount && (params.actor.role === "cashier" || params.actor.role === "waitstaff")) {
        if (!params.discount.managerPin) {
          throw new Error("Manager PIN authorization required for discounts exceeding 10% or ₹200");
        }
        if (params.discount.managerPin !== "1111" && params.discount.managerPin !== "1234") {
          throw new Error("Invalid Manager PIN for discount authorization");
        }
      }
    }

    const netTaxable = Math.max(0, order.subtotal - discountAmount);
    const cgstAmount = Number((netTaxable * cafe.cgst_rate).toFixed(2));
    const sgstAmount = Number((netTaxable * cafe.sgst_rate).toFixed(2));
    const totalTax = Number((cgstAmount + sgstAmount).toFixed(2));
    const serviceFee = params.serviceChargeOptIn !== false && order.service_fee > 0
      ? Number((netTaxable * cafe.service_fee_rate).toFixed(2))
      : 0;
    const tip = Math.max(0, Number(params.tip || 0));
    const finalTotal = Number((netTaxable + totalTax + serviceFee + tip).toFixed(2));

    const invoiceNumber = DB.generateInvoiceNumber();

    const settleTx = db.transaction(() => {
      // 1. Update order
      db.run(
        `UPDATE orders SET
          payment_status = 'paid',
          payment_method = ?,
          settled_by = ?,
          settled_at = datetime('now'),
          discount_amount = ?,
          discount_type = ?,
          discount_reason = ?,
          discount_authorized_by = ?,
          cgst_amount = ?,
          sgst_amount = ?,
          total_tax = ?,
          service_fee = ?,
          tip_amount = ?,
          total_amount = ?,
          invoice_number = ?,
          status = 'completed',
          updated_at = datetime('now')
         WHERE id = ?`,
        [
          params.paymentMethod,
          params.actor.id,
          discountAmount,
          params.discount?.type || null,
          params.discount?.reason || null,
          params.actor.id,
          cgstAmount,
          sgstAmount,
          totalTax,
          serviceFee,
          tip,
          finalTotal,
          invoiceNumber,
          order.id
        ]
      );

      // 2. Insert invoice
      db.run(
        `INSERT OR REPLACE INTO invoices (
          id, invoice_number, order_id, customer_name, customer_phone,
          gstin, fssai_number, hsn_sac_code, subtotal, discount_amount,
          cgst_amount, sgst_amount, service_fee, tip_amount, total_amount,
          payment_method, settled_by_name, whatsapp_status, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '996331', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', 'ISSUED', datetime('now'))`,
        [
          `inv-${crypto.randomBytes(6).toString("hex")}`,
          invoiceNumber,
          order.id,
          order.customer_name,
          params.customerPhone || "N/A",
          cafe.gstin,
          cafe.fssai_number,
          order.subtotal,
          discountAmount,
          cgstAmount,
          sgstAmount,
          serviceFee,
          tip,
          finalTotal,
          params.paymentMethod,
          params.actor.name
        ]
      );

      // 3. Insert audit log
      db.run(
        `INSERT INTO audit_logs (
          id, order_id, action, actor_id, actor_name, actor_role,
          payment_method, gross_subtotal, discount_amount, tax_amount, final_amount,
          reason, ip_address, created_at
        ) VALUES (?, ?, 'SETTLED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          `aud-${crypto.randomBytes(6).toString("hex")}`,
          order.id,
          params.actor.id,
          params.actor.name,
          params.actor.role,
          params.paymentMethod,
          order.subtotal,
          discountAmount,
          totalTax,
          finalTotal,
          params.discount?.reason || "Normal Settlement",
          params.ipAddress || "127.0.0.1"
        ]
      );

      // 4. Check if other active orders remain on this table session
      const remainingUnpaid = db.query(
        "SELECT COUNT(*) as count FROM orders WHERE table_session_id = ? AND payment_status != 'paid' AND id != ?"
      ).get(order.table_session_id, order.id) as any;

      if (!remainingUnpaid || remainingUnpaid.count === 0) {
        db.run("UPDATE table_sessions SET status = 'CLOSED', closed_at = datetime('now') WHERE id = ?", [order.table_session_id]);
        db.run("UPDATE tables SET status = 'vacant', updated_at = datetime('now') WHERE id = ?", [order.table_id]);
      }
    });

    settleTx();

    return {
      orderId: order.id,
      invoiceNumber,
      finalTotal,
      paymentMethod: params.paymentMethod,
      discountAmount,
      tableClosed: true,
    };
  },

  // 2. Reopen Settled Bill (Owner / Admin Only)
  reopenBillSecure: (params: {
    orderId: string;
    reason: string;
    actor: { id: string; name: string; role: string };
    ipAddress?: string;
  }) => {
    if (params.actor.role !== "admin" && params.actor.role !== "owner") {
      throw new Error("Only the Cafe Owner / Administrator can reopen a settled bill");
    }
    if (!params.reason || params.reason.trim().length < 15) {
      throw new Error("Mandatory audit reason of at least 15 characters required to reopen a settled bill");
    }

    const order = db.query("SELECT * FROM orders WHERE id = ?").get(params.orderId) as any;
    if (!order) throw new Error("Order not found");
    if (order.payment_status !== "paid") throw new Error("Only paid orders can be reopened");

    const reopenTx = db.transaction(() => {
      // 1. Revert order status
      db.run(
        `UPDATE orders SET
          payment_status = 'unpaid',
          payment_method = NULL,
          settled_at = NULL,
          status = 'ready',
          updated_at = datetime('now')
         WHERE id = ?`,
        [order.id]
      );

      // 2. Mark invoice as VOIDED_REOPENED
      db.run("UPDATE invoices SET status = 'VOIDED_REOPENED' WHERE order_id = ?", [order.id]);

      // 3. Reopen table session and table
      db.run("UPDATE table_sessions SET status = 'ACTIVE', closed_at = NULL WHERE id = ?", [order.table_session_id]);
      db.run("UPDATE tables SET status = 'active_order', updated_at = datetime('now') WHERE id = ?", [order.table_id]);

      // 4. Log to audit logs
      db.run(
        `INSERT INTO audit_logs (
          id, order_id, action, actor_id, actor_name, actor_role,
          payment_method, gross_subtotal, discount_amount, tax_amount, final_amount,
          reason, ip_address, created_at
        ) VALUES (?, ?, 'REOPENED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          `aud-${crypto.randomBytes(6).toString("hex")}`,
          order.id,
          params.actor.id,
          params.actor.name,
          params.actor.role,
          order.payment_method,
          order.subtotal,
          order.discount_amount || 0,
          order.total_tax,
          order.total_amount,
          params.reason,
          params.ipAddress || "127.0.0.1"
        ]
      );
    });

    reopenTx();

    return DB.getOrderDetails(order.id);
  },

  // 3. End of Day Reconciliation
  getEodReport: (businessDate?: string) => {
    const bDate = businessDate || new Date().toISOString().slice(0, 10);
    const orders = db.query(
      "SELECT * FROM orders WHERE DATE(created_at) = ? AND payment_status = 'paid'"
    ).all(bDate) as any[];

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let grossSales = 0;
    let totalDiscounts = 0;

    for (const o of orders) {
      grossSales += o.total_amount;
      totalDiscounts += o.discount_amount || 0;
      if (o.payment_method === "cash") cashSales += o.total_amount;
      else if (o.payment_method === "upi") upiSales += o.total_amount;
      else cardSales += o.total_amount;
    }

    const voids = db.query(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ? AND is_void = 1"
    ).get(bDate) as any;

    const openingFloat = 2000.0; // standard opening float
    const expectedCashInDrawer = Number((openingFloat + cashSales).toFixed(2));

    const existingRec = db.query(
      "SELECT * FROM eod_reconciliations WHERE business_date = ?"
    ).get(bDate) as any;

    return {
      business_date: bDate,
      opening_float: openingFloat,
      system_cash_sales: Number(cashSales.toFixed(2)),
      system_upi_sales: Number(upiSales.toFixed(2)),
      system_card_sales: Number(cardSales.toFixed(2)),
      gross_sales: Number(grossSales.toFixed(2)),
      total_discounts: Number(totalDiscounts.toFixed(2)),
      total_voids_count: voids ? voids.count : 0,
      expected_cash_in_drawer: expectedCashInDrawer,
      reconciliation: existingRec || null,
    };
  },

  submitEodReconciliation: (params: {
    businessDate: string;
    openingFloat: number;
    actualCashCounted: number;
    varianceNotes?: string;
    actor: { id: string; name: string };
  }) => {
    const report = DB.getEodReport(params.businessDate);
    const expected = Number((params.openingFloat + report.system_cash_sales).toFixed(2));
    const variance = Number((params.actualCashCounted - expected).toFixed(2));
    const status = variance === 0 ? "BALANCED" : variance > 0 ? "OVERAGE" : "SHORTAGE";

    const id = `eod-${params.businessDate}`;
    db.run(
      `INSERT OR REPLACE INTO eod_reconciliations (
        id, business_date, opened_at, closed_at, closed_by,
        opening_float, system_cash_sales, system_upi_sales, system_card_sales,
        gross_sales, total_discounts, total_voids_count,
        expected_cash_in_drawer, actual_cash_counted, cash_variance,
        variance_notes, status
      ) VALUES (?, ?, datetime('now', '-12 hours'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.businessDate,
        params.actor.name,
        params.openingFloat,
        report.system_cash_sales,
        report.system_upi_sales,
        report.system_card_sales,
        report.gross_sales,
        report.total_discounts,
        report.total_voids_count,
        expected,
        params.actualCashCounted,
        variance,
        params.varianceNotes || null,
        status
      ]
    );

    return db.query("SELECT * FROM eod_reconciliations WHERE id = ?").get(id) as any;
  },

  // 4. Audit Logs
  getAuditLogs: (filters?: { action?: string; actorId?: string; limit?: number }) => {
    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    const params: any[] = [];
    if (filters?.action) {
      sql += " AND action = ?";
      params.push(filters.action);
    }
    if (filters?.actorId) {
      sql += " AND actor_id = ?";
      params.push(filters.actorId);
    }
    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(filters?.limit || 100);
    return db.query(sql).all(...params) as any[];
  },

  createAuditLog: (entry: {
    orderId?: string;
    action: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    paymentMethod?: string;
    grossSubtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    finalAmount?: number;
    reason?: string;
    metadata?: any;
    ipAddress?: string;
  }) => {
    const id = `aud-${crypto.randomBytes(6).toString("hex")}`;
    db.run(
      `INSERT INTO audit_logs (
        id, order_id, action, actor_id, actor_name, actor_role,
        payment_method, gross_subtotal, discount_amount, tax_amount, final_amount,
        reason, metadata, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        id,
        entry.orderId || null,
        entry.action,
        entry.actorId,
        entry.actorName,
        entry.actorRole,
        entry.paymentMethod || null,
        entry.grossSubtotal || null,
        entry.discountAmount || 0,
        entry.taxAmount || 0,
        entry.finalAmount || null,
        entry.reason || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ipAddress || "127.0.0.1"
      ]
    );
    return id;
  },

  // 5. Privacy & GDPR Erasure
  deleteCustomerData: (phoneOrCustomerId: string) => {
    const customer = db.query("SELECT * FROM customers WHERE phone_e164 = ? OR id = ?").get(phoneOrCustomerId, phoneOrCustomerId) as any;
    if (!customer) return false;

    db.run("UPDATE orders SET customer_name = 'Anonymized Guest' WHERE customer_id = ?", [customer.id]);
    db.run("DELETE FROM diners WHERE customer_id = ?", [customer.id]);
    db.run("DELETE FROM customers WHERE id = ?", [customer.id]);
    db.run("DELETE FROM otp_verifications WHERE phone = ?", [customer.phone_e164]);
    return true;
  },

  // 6. Role-Guarded Order Status Transition (FSM)
  transitionOrderStatus: (orderId: string, newStatus: string, actorRole: string) => {
    const order = db.query("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    if (!order) throw new Error("Order not found");

    const validTransitions: Record<string, string[]> = {
      sent: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["served", "cancelled"],
      served: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${order.status}' to '${newStatus}'`);
    }

    // Role verification
    if (newStatus === "preparing" || newStatus === "ready") {
      if (actorRole !== "kitchen" && actorRole !== "barista" && actorRole !== "manager" && actorRole !== "admin" && actorRole !== "owner") {
        throw new Error("Only Barista/Kitchen or Managers can update preparation status");
      }
    } else if (newStatus === "served") {
      if (actorRole !== "waitstaff" && actorRole !== "manager" && actorRole !== "admin" && actorRole !== "owner") {
        throw new Error("Only Waitstaff or Managers can mark orders as served");
      }
    } else if (newStatus === "completed") {
      if (actorRole !== "cashier" && actorRole !== "manager" && actorRole !== "admin" && actorRole !== "owner") {
        throw new Error("Only Cashier or Managers can complete orders");
      }
    }

    // If cancelled, restore stock
    if (newStatus === "cancelled") {
      DB.cancelOrder(orderId);
      return DB.getOrderDetails(orderId);
    }

    db.run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [newStatus, orderId]);
    return DB.getOrderDetails(orderId);
  },

  // 7. Menu Item Management
  updateMenuItem: (itemId: string, updates: { is_available?: boolean; base_price?: number; stock_count?: number }) => {
    const item = db.query("SELECT * FROM menu_items WHERE id = ?").get(itemId) as any;
    if (!item) throw new Error("Menu item not found");

    const newAvail = updates.is_available !== undefined ? (updates.is_available ? 1 : 0) : item.is_available;
    const newPrice = updates.base_price !== undefined ? updates.base_price : item.base_price;
    const newStock = updates.stock_count !== undefined ? updates.stock_count : item.stock_count;

    db.run(
      "UPDATE menu_items SET is_available = ?, base_price = ?, stock_count = ? WHERE id = ?",
      [newAvail, newPrice, newStock, itemId]
    );
    return db.query("SELECT * FROM menu_items WHERE id = ?").get(itemId) as any;
  },
};

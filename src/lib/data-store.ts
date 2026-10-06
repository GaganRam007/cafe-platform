import {
  Cafe,
  Table,
  MenuCategory,
  MenuItem,
  Ingredient,
  RecipeItem,
  Order,
  OrderItem,
  ServiceRequest,
  WastageLog,
  Vendor,
  PurchaseOrder,
  CafeAnalytics,
  RealtimeMessage,
} from "@/types/cafe";

// Initial seed data
const initialCafe: Cafe = {
  id: "cafe-aura-01",
  name: "Aura Artisan Coffee & Bistro",
  tagline: "Specialty Pour-Overs, Sourdough Bakes & Slow Living",
  slug: "aura-cafe",
  address: "742 Evergreen Terrace, Downtown Arts District",
  phone: "+1 (555) 234-5678",
  logo_url: "☕",
  banner_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
  settings: {
    wifi_ssid: "Aura_Guest_5G",
    wifi_pass: "VelvetLatte24",
    tax_rate: 0.08, // 8%
    service_fee_rate: 0.05, // 5%
    currency: "USD",
    currency_symbol: "$",
    auto_stock_deduction: true,
    kds_sound_enabled: true,
  },
};

const initialCategories: MenuCategory[] = [
  { id: "cat-espresso", cafe_id: "cafe-aura-01", name: "Espresso & Classics", slug: "espresso", icon: "☕", sort_order: 1 },
  { id: "cat-brews", cafe_id: "cafe-aura-01", name: "Artisanal Brews", slug: "brews", icon: "🍵", sort_order: 2 },
  { id: "cat-pastries", cafe_id: "cafe-aura-01", name: "Bakery & Pastries", slug: "pastries", icon: "🥐", sort_order: 3 },
  { id: "cat-mains", cafe_id: "cafe-aura-01", name: "Brunch & Mains", slug: "mains", icon: "🍳", sort_order: 4 },
  { id: "cat-addons", cafe_id: "cafe-aura-01", name: "Specialty Sips", slug: "addons", icon: "✨", sort_order: 5 },
];

const initialMenuItems: MenuItem[] = [
  {
    id: "item-spanish-latte",
    cafe_id: "cafe-aura-01",
    category_id: "cat-espresso",
    name: "Velvet Spanish Latte",
    description: "Double ristretto over silky condensed milk and textured whole or plant milk with cinnamon dust.",
    image_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
    base_price: 6.25,
    is_available: true,
    stock_count: 50,
    dietary_tags: ["veg", "gluten-free"],
    station: "barista",
    prep_time_minutes: 4,
    calories: 220,
    modifier_groups: [
      {
        id: "mg-milk",
        menu_item_id: "item-spanish-latte",
        name: "Milk Choice",
        selection_type: "single",
        is_required: true,
        options: [
          { id: "opt-whole", name: "Whole Milk (Default)", price_delta: 0.0, is_default: true },
          { id: "opt-oat", name: "Oat Milk (Oatly Barista)", price_delta: 0.85 },
          { id: "opt-almond", name: "Organic Almond Milk", price_delta: 0.75 },
          { id: "opt-skim", name: "Skim Milk", price_delta: 0.0 },
        ],
      },
      {
        id: "mg-sugar",
        menu_item_id: "item-spanish-latte",
        name: "Sweetness Level",
        selection_type: "single",
        is_required: true,
        options: [
          { id: "opt-sugar-100", name: "100% Standard Sweet", price_delta: 0.0, is_default: true },
          { id: "opt-sugar-50", name: "50% Less Sweet", price_delta: 0.0 },
          { id: "opt-sugar-25", name: "25% Subtle Touch", price_delta: 0.0 },
          { id: "opt-sugar-0", name: "0% Unsweetened", price_delta: 0.0 },
        ],
      },
      {
        id: "mg-shots",
        menu_item_id: "item-spanish-latte",
        name: "Espresso Shots",
        selection_type: "single",
        is_required: false,
        options: [
          { id: "opt-shot-std", name: "Double Shot (Standard)", price_delta: 0.0, is_default: true },
          { id: "opt-shot-extra", name: "Extra Third Shot", price_delta: 1.25 },
          { id: "opt-shot-decaf", name: "Single Origin Swiss Decaf", price_delta: 0.5 },
        ],
      },
      {
        id: "mg-temp",
        menu_item_id: "item-spanish-latte",
        name: "Serving Style",
        selection_type: "single",
        is_required: true,
        options: [
          { id: "opt-temp-hot", name: "Hot Steamed (65°C)", price_delta: 0.0, is_default: true },
          { id: "opt-temp-iced", name: "Over Artisanal Ice Sphere", price_delta: 0.5 },
        ],
      },
    ],
  },
  {
    id: "item-cortado",
    cafe_id: "cafe-aura-01",
    category_id: "cat-espresso",
    name: "Ethiopian Cortado",
    description: "Equal parts double espresso and silky micro-foamed milk in a 4.5oz Gibraltar glass.",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    base_price: 4.85,
    is_available: true,
    stock_count: 60,
    dietary_tags: ["veg", "gluten-free"],
    station: "barista",
    prep_time_minutes: 3,
    calories: 90,
    modifier_groups: [
      {
        id: "mg-cort-milk",
        menu_item_id: "item-cortado",
        name: "Milk Choice",
        selection_type: "single",
        is_required: true,
        options: [
          { id: "opt-c-whole", name: "Whole Milk", price_delta: 0.0, is_default: true },
          { id: "opt-c-oat", name: "Oat Milk", price_delta: 0.85 },
          { id: "opt-c-almond", name: "Almond Milk", price_delta: 0.75 },
        ],
      },
      {
        id: "mg-cort-temp",
        menu_item_id: "item-cortado",
        name: "Temperature",
        selection_type: "single",
        is_required: false,
        options: [
          { id: "opt-c-hot", name: "Hot", price_delta: 0.0, is_default: true },
          { id: "opt-c-iced", name: "Chilled", price_delta: 0.5 },
        ],
      },
    ],
  },
  {
    id: "item-cold-brew",
    cafe_id: "cafe-aura-01",
    category_id: "cat-brews",
    name: "Yirgacheffe Nitro Cold Brew",
    description: "20-hour steeped slow brew, infused with pure nitrogen for a velvety stout-like cascade with blueberry notes.",
    image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    base_price: 5.75,
    is_available: true,
    stock_count: 35,
    dietary_tags: ["vegan", "gluten-free"],
    station: "barista",
    prep_time_minutes: 2,
    calories: 15,
    modifier_groups: [
      {
        id: "mg-cb-foam",
        menu_item_id: "item-cold-brew",
        name: "Cold Foam Topping",
        selection_type: "single",
        is_required: false,
        options: [
          { id: "opt-cb-none", name: "Pure Black (No Foam)", price_delta: 0.0, is_default: true },
          { id: "opt-cb-vanilla", name: "Madagascar Vanilla Foam", price_delta: 1.25 },
          { id: "opt-cb-salted", name: "Salted Caramel Cream", price_delta: 1.25 },
        ],
      },
    ],
  },
  {
    id: "item-matcha-cloud",
    cafe_id: "cafe-aura-01",
    category_id: "cat-brews",
    name: "Ceremonial Matcha Cloud",
    description: "Stone-ground Uji matcha whisked fresh, poured over oat milk and layered with house vanilla cold foam.",
    image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    base_price: 6.95,
    is_available: true,
    stock_count: 25,
    dietary_tags: ["veg", "gluten-free"],
    station: "barista",
    prep_time_minutes: 4,
    calories: 180,
    modifier_groups: [
      {
        id: "mg-mat-sweet",
        menu_item_id: "item-matcha-cloud",
        name: "Sweetness",
        selection_type: "single",
        is_required: true,
        options: [
          { id: "opt-m-sweet-med", name: "50% Agave Nectar", price_delta: 0.0, is_default: true },
          { id: "opt-m-sweet-zero", name: "0% Pure Matcha (Unsweetened)", price_delta: 0.0 },
          { id: "opt-m-sweet-full", name: "100% Traditional Sweet", price_delta: 0.0 },
        ],
      },
    ],
  },
  {
    id: "item-croissant",
    cafe_id: "cafe-aura-01",
    category_id: "cat-pastries",
    name: "Double Butter French Croissant",
    description: "32 hand-laminated layers of AOP Normandy butter, baked crisp golden with honeycomb interior.",
    image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    base_price: 4.5,
    is_available: true,
    stock_count: 14,
    dietary_tags: ["veg"],
    station: "kitchen",
    prep_time_minutes: 3,
    calories: 280,
    modifier_groups: [
      {
        id: "mg-croiss-serve",
        menu_item_id: "item-croissant",
        name: "Preparation",
        selection_type: "single",
        is_required: false,
        options: [
          { id: "opt-cr-warm", name: "Warm in stone oven", price_delta: 0.0, is_default: true },
          { id: "opt-cr-room", name: "Serve ambient room temp", price_delta: 0.0 },
          { id: "opt-cr-jam", name: "Add House Raspberry Jam (+ $0.75)", price_delta: 0.75 },
        ],
      },
    ],
  },
  {
    id: "item-cheesecake",
    cafe_id: "cafe-aura-01",
    category_id: "cat-pastries",
    name: "San Sebastián Burnt Cheesecake",
    description: "Caramelized charred exterior with an ultra-creamy, custard-molten center and Maldon sea salt.",
    image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    base_price: 7.25,
    is_available: true,
    stock_count: 3, // Low stock indicator!
    dietary_tags: ["veg", "gluten-free"],
    station: "kitchen",
    prep_time_minutes: 2,
    calories: 390,
    modifier_groups: [],
  },
  {
    id: "item-avocado-toast",
    cafe_id: "cafe-aura-01",
    category_id: "cat-mains",
    name: "Heirloom Avocado Tartine",
    description: "Poached pasture eggs, smashed Hass avocado, watermelon radish, Egyptian dukkah on toasted sourdough.",
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    base_price: 13.5,
    is_available: true,
    stock_count: 18,
    dietary_tags: ["veg"],
    station: "kitchen",
    prep_time_minutes: 9,
    calories: 460,
    modifier_groups: [
      {
        id: "mg-egg-style",
        menu_item_id: "item-avocado-toast",
        name: "Egg Preparation",
        selection_type: "single",
        is_required: true,
        options: [
          { id: "opt-egg-poached", name: "Soft Poached Eggs (Default)", price_delta: 0.0, is_default: true },
          { id: "opt-egg-sunny", name: "Sunny Side Up", price_delta: 0.0 },
          { id: "opt-egg-scrambled", name: "Creamy Soft Scramble", price_delta: 0.0 },
          { id: "opt-egg-no", name: "No Eggs (Vegan Sub)", price_delta: -1.5 },
        ],
      },
      {
        id: "mg-avo-adds",
        menu_item_id: "item-avocado-toast",
        name: "Add-ons",
        selection_type: "multiple",
        is_required: false,
        options: [
          { id: "opt-add-salmon", name: "Smoked Atlantic Salmon", price_delta: 4.5 },
          { id: "opt-add-feta", name: "Crumbled Danish Feta", price_delta: 2.0 },
        ],
      },
    ],
  },
  {
    id: "item-truffle-burrata",
    cafe_id: "cafe-aura-01",
    category_id: "cat-mains",
    name: "Wild Truffle Burrata Brioche",
    description: "Sautéed wild king oyster & cremini mushrooms, pugliese burrata, white truffle drizzle on brioche.",
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    base_price: 15.8,
    is_available: true,
    stock_count: 12,
    dietary_tags: ["veg"],
    station: "kitchen",
    prep_time_minutes: 11,
    calories: 520,
    modifier_groups: [],
  },
  {
    id: "item-pistachio-croissant",
    cafe_id: "cafe-aura-01",
    category_id: "cat-pastries",
    name: "Bronte Pistachio Danish",
    description: "Flaky circular pastry with rich Sicilian pistachio cream and roasted crushed pistachios.",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    base_price: 5.5,
    is_available: false, // Sold Out!
    stock_count: 0,
    dietary_tags: ["veg"],
    station: "kitchen",
    prep_time_minutes: 2,
    calories: 340,
    modifier_groups: [],
  },
  {
    id: "item-cardamom-tonic",
    cafe_id: "cafe-aura-01",
    category_id: "cat-addons",
    name: "Cardamom Espresso Tonic",
    description: "Chilled Fever-Tree Indian tonic with double espresso float, green cardamom elixir & orange twist.",
    image_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
    base_price: 6.5,
    is_available: true,
    stock_count: 30,
    dietary_tags: ["vegan", "gluten-free"],
    station: "barista",
    prep_time_minutes: 3,
    calories: 75,
    modifier_groups: [],
  },
];

const initialTables: Table[] = [
  { id: "tbl-1", cafe_id: "cafe-aura-01", table_number: 1, label: "T-01 Window", capacity: 2, zone: "Window Bar", qr_token: "qr-t01-8f92", status: "vacant", position_x: 10, position_y: 15, updated_at: new Date().toISOString() },
  { id: "tbl-2", cafe_id: "cafe-aura-01", table_number: 2, label: "T-02 Cozy Booth", capacity: 4, zone: "Main Dining", qr_token: "qr-t02-4k11", status: "active_order", position_x: 35, position_y: 15, current_order_id: "ord-102", updated_at: new Date().toISOString() },
  { id: "tbl-3", cafe_id: "cafe-aura-01", table_number: 3, label: "T-03 Center Table", capacity: 4, zone: "Main Dining", qr_token: "qr-t03-7a99", status: "seated", position_x: 60, position_y: 15, updated_at: new Date().toISOString() },
  { id: "tbl-4", cafe_id: "cafe-aura-01", table_number: 4, label: "T-04 Banquette", capacity: 6, zone: "Main Dining", qr_token: "qr-t04-2m44", status: "active_order", position_x: 85, position_y: 15, current_order_id: "ord-101", updated_at: new Date().toISOString() },
  { id: "tbl-5", cafe_id: "cafe-aura-01", table_number: 5, label: "T-05 Lounge", capacity: 4, zone: "Main Dining", qr_token: "qr-t05-9e32", status: "billing", position_x: 10, position_y: 50, current_order_id: "ord-103", updated_at: new Date().toISOString() },
  { id: "tbl-6", cafe_id: "cafe-aura-01", table_number: 6, label: "T-06 Corner", capacity: 2, zone: "Main Dining", qr_token: "qr-t06-3x77", status: "vacant", position_x: 35, position_y: 50, updated_at: new Date().toISOString() },
  { id: "tbl-7", cafe_id: "cafe-aura-01", table_number: 7, label: "T-07 Garden Arbor", capacity: 4, zone: "Patio Garden", qr_token: "qr-t07-6v81", status: "active_order", position_x: 60, position_y: 50, current_order_id: "ord-104", updated_at: new Date().toISOString() },
  { id: "tbl-8", cafe_id: "cafe-aura-01", table_number: 8, label: "T-08 Olive Tree", capacity: 4, zone: "Patio Garden", qr_token: "qr-t08-1z23", status: "vacant", position_x: 85, position_y: 50, updated_at: new Date().toISOString() },
  { id: "tbl-9", cafe_id: "cafe-aura-01", table_number: 9, label: "T-09 Patio Terrace", capacity: 6, zone: "Patio Garden", qr_token: "qr-t09-5p44", status: "vacant", position_x: 10, position_y: 80, updated_at: new Date().toISOString() },
  { id: "tbl-10", cafe_id: "cafe-aura-01", table_number: 10, label: "T-10 Espresso Bar A", capacity: 1, zone: "Window Bar", qr_token: "qr-t10-8b11", status: "vacant", position_x: 35, position_y: 80, updated_at: new Date().toISOString() },
  { id: "tbl-11", cafe_id: "cafe-aura-01", table_number: 11, label: "T-11 Espresso Bar B", capacity: 1, zone: "Window Bar", qr_token: "qr-t11-9c22", status: "seated", position_x: 60, position_y: 80, updated_at: new Date().toISOString() },
  { id: "tbl-12", cafe_id: "cafe-aura-01", table_number: 12, label: "T-12 Espresso Bar C", capacity: 1, zone: "Window Bar", qr_token: "qr-t12-4d33", status: "vacant", position_x: 85, position_y: 80, updated_at: new Date().toISOString() },
];

const initialIngredients: Ingredient[] = [
  { id: "ing-espresso-beans", cafe_id: "cafe-aura-01", name: "Specialty Ethiopian Beans", category: "Coffee Beans", unit: "g", current_stock: 14200, reorder_level: 3000, unit_cost: 0.038, vendor_id: "ven-roaster" },
  { id: "ing-whole-milk", cafe_id: "cafe-aura-01", name: "Farm Fresh Whole Milk", category: "Dairy & Milk", unit: "ml", current_stock: 18500, reorder_level: 5000, unit_cost: 0.0025, vendor_id: "ven-dairy" },
  { id: "ing-oat-milk", cafe_id: "cafe-aura-01", name: "Oatly Barista Edition", category: "Dairy & Milk", unit: "ml", current_stock: 4100, reorder_level: 5000, unit_cost: 0.0042, vendor_id: "ven-dairy" }, // Below reorder level!
  { id: "ing-almond-milk", cafe_id: "cafe-aura-01", name: "Organic Unsweetened Almond Milk", category: "Dairy & Milk", unit: "ml", current_stock: 7500, reorder_level: 3000, unit_cost: 0.0039, vendor_id: "ven-dairy" },
  { id: "ing-condensed-milk", cafe_id: "cafe-aura-01", name: "Sweetened Condensed Milk", category: "Syrups & Sweeteners", unit: "ml", current_stock: 5200, reorder_level: 2000, unit_cost: 0.006, vendor_id: "ven-dairy" },
  { id: "ing-matcha", cafe_id: "cafe-aura-01", name: "Uji Ceremonial Matcha Grade A", category: "Coffee Beans", unit: "g", current_stock: 820, reorder_level: 250, unit_cost: 0.18, vendor_id: "ven-roaster" },
  { id: "ing-butter", cafe_id: "cafe-aura-01", name: "Normandy AOP Butter", category: "Bakery & Dough", unit: "g", current_stock: 3400, reorder_level: 1500, unit_cost: 0.015, vendor_id: "ven-bakery" },
  { id: "ing-sourdough", cafe_id: "cafe-aura-01", name: "Wild Yeast Sourdough Loaf", category: "Bakery & Dough", unit: "pcs", current_stock: 16, reorder_level: 6, unit_cost: 4.2, vendor_id: "ven-bakery" },
  { id: "ing-avocados", cafe_id: "cafe-aura-01", name: "Ripe Hass Avocados", category: "Produce & Dry Goods", unit: "pcs", current_stock: 8, reorder_level: 15, unit_cost: 1.45, vendor_id: "ven-produce" }, // Below reorder!
  { id: "ing-eggs", cafe_id: "cafe-aura-01", name: "Pasture-Raised Brown Eggs", category: "Produce & Dry Goods", unit: "pcs", current_stock: 64, reorder_level: 30, unit_cost: 0.35, vendor_id: "ven-produce" },
  { id: "ing-burrata", cafe_id: "cafe-aura-01", name: "Artisanal Burrata di Puglia", category: "Dairy & Milk", unit: "pcs", current_stock: 14, reorder_level: 8, unit_cost: 3.1, vendor_id: "ven-dairy" },
  { id: "ing-truffle-oil", cafe_id: "cafe-aura-01", name: "White Truffle Infused Olive Oil", category: "Produce & Dry Goods", unit: "ml", current_stock: 1100, reorder_level: 400, unit_cost: 0.08, vendor_id: "ven-produce" },
];

const initialRecipeItems: RecipeItem[] = [
  { id: "rec-sl-1", menu_item_id: "item-spanish-latte", ingredient_id: "ing-espresso-beans", quantity_required: 18, unit: "g" },
  { id: "rec-sl-2", menu_item_id: "item-spanish-latte", ingredient_id: "ing-whole-milk", quantity_required: 200, unit: "ml" },
  { id: "rec-sl-3", menu_item_id: "item-spanish-latte", ingredient_id: "ing-condensed-milk", quantity_required: 25, unit: "ml" },
  { id: "rec-cort-1", menu_item_id: "item-cortado", ingredient_id: "ing-espresso-beans", quantity_required: 18, unit: "g" },
  { id: "rec-cort-2", menu_item_id: "item-cortado", ingredient_id: "ing-whole-milk", quantity_required: 80, unit: "ml" },
  { id: "rec-cb-1", menu_item_id: "item-cold-brew", ingredient_id: "ing-espresso-beans", quantity_required: 25, unit: "g" },
  { id: "rec-mat-1", menu_item_id: "item-matcha-cloud", ingredient_id: "ing-matcha", quantity_required: 6, unit: "g" },
  { id: "rec-mat-2", menu_item_id: "item-matcha-cloud", ingredient_id: "ing-oat-milk", quantity_required: 220, unit: "ml" },
  { id: "rec-avo-1", menu_item_id: "item-avocado-toast", ingredient_id: "ing-sourdough", quantity_required: 0.2, unit: "pcs" },
  { id: "rec-avo-2", menu_item_id: "item-avocado-toast", ingredient_id: "ing-avocados", quantity_required: 1, unit: "pcs" },
  { id: "rec-avo-3", menu_item_id: "item-avocado-toast", ingredient_id: "ing-eggs", quantity_required: 2, unit: "pcs" },
  { id: "rec-truf-1", menu_item_id: "item-truffle-burrata", ingredient_id: "ing-burrata", quantity_required: 1, unit: "pcs" },
  { id: "rec-truf-2", menu_item_id: "item-truffle-burrata", ingredient_id: "ing-truffle-oil", quantity_required: 15, unit: "ml" },
];

const initialVendors: Vendor[] = [
  { id: "ven-roaster", cafe_id: "cafe-aura-01", name: "Equator Single Origin Roasters", contact_person: "Marcus Vance", phone: "+1 (555) 345-8821", email: "orders@equatorroasters.com", category: "Coffee Beans & Teas", lead_time_days: 2 },
  { id: "ven-dairy", cafe_id: "cafe-aura-01", name: "Clover Crest Valley Dairy", contact_person: "Sarah Jenkins", phone: "+1 (555) 789-2211", email: "supply@clovercrest.com", category: "Dairy, Plant Milks & Cheeses", lead_time_days: 1 },
  { id: "ven-bakery", cafe_id: "cafe-aura-01", name: "Atelier Boulangerie Wholesale", contact_person: "Chef Henri Dupont", phone: "+1 (555) 901-4433", email: "delivery@atelierboulange.com", category: "Artisanal Breads & Pastry Dough", lead_time_days: 1 },
  { id: "ven-produce", cafe_id: "cafe-aura-01", name: "Heritage Organics Market Co.", contact_person: "Elena Gomez", phone: "+1 (555) 432-9988", email: "produce@heritageorganics.com", category: "Fresh Produce, Eggs, Truffles", lead_time_days: 2 },
];

// Helper to calculate minutes ago
const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();

const initialOrders: Order[] = [
  {
    id: "ord-101",
    cafe_id: "cafe-aura-01",
    table_id: "tbl-4",
    table_number: 4,
    session_id: "sess-t04-live",
    order_number: "#101",
    status: "preparing",
    customer_name: "Liam & Friends",
    guest_count: 3,
    subtotal: 39.05,
    service_fee: 1.95,
    tax_amount: 3.12,
    tip_amount: 5.0,
    total_amount: 49.12,
    payment_status: "paid",
    payment_method: "apple_pay",
    created_at: minutesAgo(24), // > 20 mins: PULSING RED urgency alert!
    updated_at: minutesAgo(24),
    items: [
      {
        id: "item-101-1",
        order_id: "ord-101",
        menu_item_id: "item-spanish-latte",
        item_name: "Velvet Spanish Latte",
        station: "barista",
        quantity: 2,
        unit_price: 7.1,
        selected_modifiers: [
          { group_id: "mg-milk", group_name: "Milk Choice", option_id: "opt-oat", option_name: "Oat Milk", price_delta: 0.85 },
          { group_id: "mg-temp", group_name: "Serving Style", option_id: "opt-temp-iced", option_name: "Iced", price_delta: 0.0 },
        ],
        notes: "Less ice please",
        status: "preparing",
        guest_name: "Liam",
        guest_id: "guest-liam-01",
        created_at: minutesAgo(24),
      },
      {
        id: "item-101-2",
        order_id: "ord-101",
        menu_item_id: "item-avocado-toast",
        item_name: "Heirloom Avocado Tartine",
        station: "kitchen",
        quantity: 1,
        unit_price: 18.0,
        selected_modifiers: [
          { group_id: "mg-egg-style", group_name: "Egg Preparation", option_id: "opt-egg-poached", option_name: "Soft Poached", price_delta: 0.0 },
          { group_id: "mg-avo-adds", group_name: "Add-ons", option_id: "opt-add-salmon", option_name: "Smoked Salmon", price_delta: 4.5 },
        ],
        notes: "Dukkah on the side",
        status: "preparing",
        guest_name: "Maya",
        guest_id: "guest-maya-02",
        created_at: minutesAgo(23),
      },
      {
        id: "item-101-3",
        order_id: "ord-101",
        menu_item_id: "item-croissant",
        item_name: "Double Butter French Croissant",
        station: "kitchen",
        quantity: 1,
        unit_price: 4.5,
        selected_modifiers: [],
        status: "ready",
        guest_name: "Maya",
        guest_id: "guest-maya-02",
        created_at: minutesAgo(23),
      },
    ],
  },
  {
    id: "ord-102",
    cafe_id: "cafe-aura-01",
    table_id: "tbl-2",
    table_number: 2,
    session_id: "sess-t02-live",
    order_number: "#102",
    status: "preparing",
    customer_name: "Sophia Chen",
    guest_count: 2,
    subtotal: 22.05,
    service_fee: 1.1,
    tax_amount: 1.76,
    tip_amount: 3.5,
    total_amount: 28.41,
    payment_status: "paid",
    payment_method: "card",
    created_at: minutesAgo(13), // > 10 mins: YELLOW alert!
    updated_at: minutesAgo(13),
    items: [
      {
        id: "item-102-1",
        order_id: "ord-102",
        menu_item_id: "item-cortado",
        item_name: "Ethiopian Cortado",
        station: "barista",
        quantity: 1,
        unit_price: 4.85,
        selected_modifiers: [
          { group_id: "mg-cort-milk", group_name: "Milk Choice", option_id: "opt-c-whole", option_name: "Whole Milk", price_delta: 0.0 },
        ],
        status: "preparing",
        guest_name: "Sophia",
        guest_id: "guest-sophia-01",
        created_at: minutesAgo(13),
      },
      {
        id: "item-102-2",
        order_id: "ord-102",
        menu_item_id: "item-truffle-burrata",
        item_name: "Wild Truffle Burrata Brioche",
        station: "kitchen",
        quantity: 1,
        unit_price: 15.8,
        selected_modifiers: [],
        status: "preparing",
        guest_name: "David",
        guest_id: "guest-david-02",
        created_at: minutesAgo(12),
      },
    ],
  },
  {
    id: "ord-103",
    cafe_id: "cafe-aura-01",
    table_id: "tbl-5",
    table_number: 5,
    session_id: "sess-t05-live",
    order_number: "#103",
    status: "served",
    customer_name: "Walk-in Guest",
    guest_count: 2,
    subtotal: 13.9,
    service_fee: 0.7,
    tax_amount: 1.11,
    tip_amount: 0.0,
    total_amount: 15.71,
    payment_status: "cash_pending", // Payment pending (Blue status for table!)
    payment_method: "cash",
    created_at: minutesAgo(42),
    updated_at: minutesAgo(5),
    items: [
      {
        id: "item-103-1",
        order_id: "ord-103",
        menu_item_id: "item-matcha-cloud",
        item_name: "Ceremonial Matcha Cloud",
        station: "barista",
        quantity: 2,
        unit_price: 6.95,
        selected_modifiers: [],
        status: "delivered",
        guest_name: "Guest",
        guest_id: "guest-tbl5-01",
        created_at: minutesAgo(42),
      },
    ],
  },
  {
    id: "ord-104",
    cafe_id: "cafe-aura-01",
    table_id: "tbl-7",
    table_number: 7,
    session_id: "sess-t07-live",
    order_number: "#104",
    status: "sent",
    customer_name: "Julian & Alex",
    guest_count: 2,
    subtotal: 17.5,
    service_fee: 0.88,
    tax_amount: 1.4,
    tip_amount: 2.5,
    total_amount: 22.28,
    payment_status: "paid",
    payment_method: "upi",
    created_at: minutesAgo(3), // Fresh green
    updated_at: minutesAgo(3),
    items: [
      {
        id: "item-104-1",
        order_id: "ord-104",
        menu_item_id: "item-cold-brew",
        item_name: "Yirgacheffe Nitro Cold Brew",
        station: "barista",
        quantity: 1,
        unit_price: 7.0,
        selected_modifiers: [
          { group_id: "mg-cb-foam", group_name: "Cold Foam Topping", option_id: "opt-cb-salted", option_name: "Salted Caramel Cream", price_delta: 1.25 },
        ],
        status: "pending",
        guest_name: "Julian",
        guest_id: "guest-julian-01",
        created_at: minutesAgo(3),
      },
      {
        id: "item-104-2",
        order_id: "ord-104",
        menu_item_id: "item-cheesecake",
        item_name: "San Sebastián Burnt Cheesecake",
        station: "kitchen",
        quantity: 1,
        unit_price: 7.25,
        selected_modifiers: [],
        status: "pending",
        guest_name: "Alex",
        guest_id: "guest-alex-02",
        created_at: minutesAgo(3),
      },
    ],
  },
];

const initialServiceRequests: ServiceRequest[] = [
  { id: "req-1", cafe_id: "cafe-aura-01", table_id: "tbl-2", table_number: 2, type: "water", message: "Two glasses of iced water requested", status: "pending", created_at: minutesAgo(4) },
  { id: "req-2", cafe_id: "cafe-aura-01", table_id: "tbl-5", table_number: 5, type: "bill", message: "Customer requested physical receipt / cash settlement", status: "pending", created_at: minutesAgo(2) },
];

const initialWastageLogs: WastageLog[] = [
  { id: "waste-1", cafe_id: "cafe-aura-01", ingredient_id: "ing-oat-milk", ingredient_name: "Oatly Barista Edition", quantity: 600, unit: "ml", cost: 2.52, reason: "expired", logged_by: "Barista Leo", logged_at: minutesAgo(180) },
  { id: "waste-2", cafe_id: "cafe-aura-01", ingredient_id: "ing-sourdough", ingredient_name: "Wild Yeast Sourdough Loaf", quantity: 1, unit: "pcs", cost: 4.2, reason: "defective", logged_by: "Chef Marco", logged_at: minutesAgo(360) },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-801",
    cafe_id: "cafe-aura-01",
    vendor_id: "ven-dairy",
    vendor_name: "Clover Crest Valley Dairy",
    po_number: "PO-2026-0801",
    items: [
      { ingredient_id: "ing-oat-milk", ingredient_name: "Oatly Barista Edition", quantity: 12000, unit: "ml", unit_cost: 0.0042, total_cost: 50.4 },
      { ingredient_id: "ing-whole-milk", ingredient_name: "Farm Fresh Whole Milk", quantity: 20000, unit: "ml", unit_cost: 0.0025, total_cost: 50.0 },
    ],
    total_cost: 100.4,
    status: "submitted",
    created_at: minutesAgo(120),
    expected_delivery: "Tomorrow, 7:00 AM",
  },
];

// Persistent state class
class CafeStore {
  private cafe: Cafe = initialCafe;
  private tables: Table[] = initialTables;
  private categories: MenuCategory[] = initialCategories;
  private menuItems: MenuItem[] = initialMenuItems;
  private ingredients: Ingredient[] = initialIngredients;
  private recipeItems: RecipeItem[] = initialRecipeItems;
  private orders: Order[] = initialOrders;
  private serviceRequests: ServiceRequest[] = initialServiceRequests;
  private wastageLogs: WastageLog[] = initialWastageLogs;
  private vendors: Vendor[] = initialVendors;
  private purchaseOrders: PurchaseOrder[] = initialPurchaseOrders;

  // Realtime SSE subscribers
  private subscribers: Set<(event: RealtimeMessage) => void> = new Set();

  public subscribe(callback: (event: RealtimeMessage) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public broadcast(type: RealtimeMessage["type"], payload: unknown) {
    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    for (const sub of this.subscribers) {
      try {
        sub(message);
      } catch (err) {
        console.error("Error in realtime broadcast subscriber", err);
      }
    }
  }

  // Getters
  public getCafe() { return this.cafe; }
  public getTables() { return this.tables; }
  public getTableById(id: string) { return this.tables.find(t => t.id === id || String(t.table_number) === id); }
  public getCategories() { return this.categories; }
  public getMenuItems() { return this.menuItems; }
  public getIngredients() { return this.ingredients; }
  public getRecipeItems() { return this.recipeItems; }
  public getOrders() { return this.orders; }
  public getOrderById(id: string) { return this.orders.find(o => o.id === id); }
  public getServiceRequests() { return this.serviceRequests; }
  public getWastageLogs() { return this.wastageLogs; }
  public getVendors() { return this.vendors; }
  public getPurchaseOrders() { return this.purchaseOrders; }

  // Automatic recipe stock deduction
  private deductIngredientsForOrder(order: Order) {
    if (!this.cafe.settings.auto_stock_deduction) return;

    for (const item of order.items) {
      const recipes = this.recipeItems.filter(r => r.menu_item_id === item.menu_item_id);
      for (const recipe of recipes) {
        const ingIndex = this.ingredients.findIndex(i => i.id === recipe.ingredient_id);
        if (ingIndex !== -1) {
          const deduction = recipe.quantity_required * item.quantity;
          this.ingredients[ingIndex].current_stock = Math.max(0, this.ingredients[ingIndex].current_stock - deduction);
        }
      }
    }
    this.broadcast("INVENTORY_DEDUCTED", { ingredients: this.ingredients });
  }

  // Order Operations
  public createOrder(orderData: Partial<Order>): Order {
    const orderNum = `#${100 + this.orders.length + 1}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      cafe_id: this.cafe.id,
      table_id: orderData.table_id || "tbl-1",
      table_number: orderData.table_number || 1,
      session_id: orderData.session_id || `sess-${Date.now()}`,
      order_number: orderNum,
      status: orderData.status || "sent",
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      service_fee: orderData.service_fee || 0,
      tax_amount: orderData.tax_amount || 0,
      tip_amount: orderData.tip_amount || 0,
      total_amount: orderData.total_amount || 0,
      payment_status: orderData.payment_status || "unpaid",
      payment_method: orderData.payment_method,
      customer_name: orderData.customer_name || "Guest",
      guest_count: orderData.guest_count || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);

    // Update table status to active_order
    const tableIndex = this.tables.findIndex(t => t.id === newOrder.table_id || t.table_number === newOrder.table_number);
    if (tableIndex !== -1) {
      this.tables[tableIndex].status = "active_order";
      this.tables[tableIndex].current_order_id = newOrder.id;
      this.tables[tableIndex].updated_at = new Date().toISOString();
      this.broadcast("TABLE_UPDATED", this.tables[tableIndex]);
    }

    // Deduct raw ingredients
    this.deductIngredientsForOrder(newOrder);

    this.broadcast("ORDER_CREATED", newOrder);
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: Order["status"], payment_status?: Order["payment_status"]): Order | null {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    this.orders[index].status = status;
    if (payment_status) {
      this.orders[index].payment_status = payment_status;
    }
    this.orders[index].updated_at = new Date().toISOString();

    // If all items status needs update
    if (status === "served") {
      this.orders[index].items.forEach(i => i.status = "delivered");
    } else if (status === "ready") {
      this.orders[index].items.forEach(i => i.status = "ready");
    } else if (status === "preparing") {
      this.orders[index].items.forEach(i => {
        if (i.status === "pending") i.status = "preparing";
      });
    }

    // Sync table status if order completed or billing
    const table = this.tables.find(t => t.id === this.orders[index].table_id || t.table_number === this.orders[index].table_number);
    if (table) {
      if (status === "completed") {
        table.status = "vacant";
        table.current_order_id = null;
        table.active_session_id = null;
        this.broadcast("TABLE_UPDATED", table);
      } else if (this.orders[index].payment_status === "cash_pending") {
        table.status = "billing";
        this.broadcast("TABLE_UPDATED", table);
      }
    }

    this.broadcast("ORDER_UPDATED", this.orders[index]);
    return this.orders[index];
  }

  public updateOrderItemStatus(orderId: string, itemId: string, status: OrderItem["status"]): Order | null {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    const item = this.orders[orderIndex].items.find(i => i.id === itemId);
    if (item) {
      item.status = status;
      this.orders[orderIndex].updated_at = new Date().toISOString();
      this.broadcast("ORDER_UPDATED", this.orders[orderIndex]);
    }
    return this.orders[orderIndex];
  }

  // Table operations
  public updateTable(tableId: string, updates: Partial<Table>): Table | null {
    const index = this.tables.findIndex(t => t.id === tableId || String(t.table_number) === tableId);
    if (index === -1) return null;

    this.tables[index] = {
      ...this.tables[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.broadcast("TABLE_UPDATED", this.tables[index]);
    return this.tables[index];
  }

  public mergeTables(targetTableNumber: number, sourceTableNumber: number): Table | null {
    const target = this.tables.find(t => t.table_number === targetTableNumber);
    const source = this.tables.find(t => t.table_number === sourceTableNumber);
    if (!target || !source) return null;

    target.merged_with = Array.from(new Set([...(target.merged_with || []), sourceTableNumber]));
    target.capacity += source.capacity;
    source.status = target.status;
    source.merged_with = [targetTableNumber];

    this.broadcast("TABLE_UPDATED", target);
    this.broadcast("TABLE_UPDATED", source);
    return target;
  }

  public splitTables(tableNumber: number): Table | null {
    const table = this.tables.find(t => t.table_number === tableNumber);
    if (!table || !table.merged_with) return null;

    for (const mergedNum of table.merged_with) {
      const other = this.tables.find(t => t.table_number === mergedNum);
      if (other) {
        other.merged_with = null;
        other.status = "vacant";
        this.broadcast("TABLE_UPDATED", other);
      }
    }
    table.merged_with = null;
    this.broadcast("TABLE_UPDATED", table);
    return table;
  }

  public resetTable(tableId: string): Table | null {
    const index = this.tables.findIndex(t => t.id === tableId || String(t.table_number) === tableId);
    if (index === -1) return null;

    this.tables[index].status = "vacant";
    this.tables[index].current_order_id = null;
    this.tables[index].active_session_id = null;
    this.tables[index].updated_at = new Date().toISOString();
    this.broadcast("TABLE_UPDATED", this.tables[index]);
    return this.tables[index];
  }

  // Service requests
  public createServiceRequest(tableNumber: number, type: ServiceRequest["type"], message?: string): ServiceRequest {
    const table = this.tables.find(t => t.table_number === tableNumber);
    const req: ServiceRequest = {
      id: `req-${Date.now()}`,
      cafe_id: this.cafe.id,
      table_id: table ? table.id : `tbl-${tableNumber}`,
      table_number: tableNumber,
      type,
      message,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    this.serviceRequests.unshift(req);
    this.broadcast("SERVICE_REQUEST_CREATED", req);
    return req;
  }

  public resolveServiceRequest(requestId: string): ServiceRequest | null {
    const index = this.serviceRequests.findIndex(r => r.id === requestId);
    if (index === -1) return null;

    this.serviceRequests[index].status = "resolved";
    this.broadcast("SERVICE_REQUEST_RESOLVED", this.serviceRequests[index]);
    return this.serviceRequests[index];
  }

  // Inventory & Wastage
  public logWastage(ingredientId: string, quantity: number, reason: WastageLog["reason"], logged_by: string = "Staff"): WastageLog | null {
    const ing = this.ingredients.find(i => i.id === ingredientId);
    if (!ing) return null;

    ing.current_stock = Math.max(0, ing.current_stock - quantity);
    const cost = Number((quantity * ing.unit_cost).toFixed(2));

    const log: WastageLog = {
      id: `waste-${Date.now()}`,
      cafe_id: this.cafe.id,
      ingredient_id: ingredientId,
      ingredient_name: ing.name,
      quantity,
      unit: ing.unit,
      cost,
      reason,
      logged_by,
      logged_at: new Date().toISOString(),
    };

    this.wastageLogs.unshift(log);
    this.broadcast("WASTAGE_LOGGED", log);
    this.broadcast("INVENTORY_DEDUCTED", { ingredients: this.ingredients });
    return log;
  }

  public createPurchaseOrder(vendorId: string, items: PurchaseOrder["items"]): PurchaseOrder | null {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) return null;

    const totalCost = items.reduce((sum, item) => sum + item.total_cost, 0);
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      cafe_id: this.cafe.id,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      po_number: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      items,
      total_cost: totalCost,
      status: "submitted",
      created_at: new Date().toISOString(),
      expected_delivery: `In ${vendor.lead_time_days} days`,
    };

    this.purchaseOrders.unshift(po);
    this.broadcast("PO_CREATED", po);
    return po;
  }

  // Analytics Computation
  public getAnalytics(): CafeAnalytics {
    const completedOrActiveOrders = this.orders.filter(o => o.status !== "cancelled");
    const grossRevenue = completedOrActiveOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const netRevenue = completedOrActiveOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const orderCount = completedOrActiveOrders.length;
    const aov = orderCount > 0 ? grossRevenue / orderCount : 0;

    const activeTables = this.tables.filter(t => t.status !== "vacant").length;
    const totalTables = this.tables.length;
    const occupancyRate = (activeTables / totalTables) * 100;

    // Top selling
    const itemMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();
    for (const order of completedOrActiveOrders) {
      for (const it of order.items) {
        const existing = itemMap.get(it.menu_item_id) || { name: it.item_name, category: it.station === "barista" ? "Beverages" : "Food", quantity: 0, revenue: 0 };
        existing.quantity += it.quantity;
        existing.revenue += it.unit_price * it.quantity;
        itemMap.set(it.menu_item_id, existing);
      }
    }
    const topSelling = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {
      apple_pay: 0,
      google_pay: 0,
      card: 0,
      upi: 0,
      cash: 0,
    };
    for (const order of completedOrActiveOrders) {
      const pm = order.payment_method || "card";
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + order.total_amount;
    }

    // Peak order hours
    const peakHours = [
      { hour: "08:00 AM", orders: 18, revenue: 142.5 },
      { hour: "09:00 AM", orders: 32, revenue: 274.0 },
      { hour: "10:00 AM", orders: 45, revenue: 388.2 },
      { hour: "11:00 AM", orders: 39, revenue: 341.0 },
      { hour: "12:00 PM", orders: 54, revenue: 512.4 },
      { hour: "01:00 PM", orders: 48, revenue: 460.0 },
      { hour: "02:00 PM", orders: 26, revenue: 215.0 },
      { hour: "03:00 PM", orders: 30, revenue: 248.5 },
    ];

    // Ingredient consumption
    const ingredientConsumption = this.ingredients.slice(0, 6).map(ing => ({
      name: ing.name,
      amount: Math.round(ing.reorder_level * 1.4),
      unit: ing.unit,
      stockRemaining: ing.current_stock,
    }));

    return {
      gross_revenue: Number(grossRevenue.toFixed(2)),
      net_revenue: Number(netRevenue.toFixed(2)),
      order_count: orderCount,
      average_order_value: Number(aov.toFixed(2)),
      table_turnover_rate: 3.4,
      active_table_count: activeTables,
      total_table_count: totalTables,
      occupancy_rate: Number(occupancyRate.toFixed(1)),
      top_selling_items: topSelling,
      peak_order_hours: peakHours,
      payment_method_breakdown: paymentBreakdown,
      ingredient_consumption_today: ingredientConsumption,
    };
  }
}

// Global singleton to preserve state across API routes in Next.js
declare global {
  // eslint-disable-next-line no-var
  var __cafeStore: CafeStore | undefined;
}

export const getStore = (): CafeStore => {
  if (!global.__cafeStore) {
    global.__cafeStore = new CafeStore();
  }
  return global.__cafeStore;
};

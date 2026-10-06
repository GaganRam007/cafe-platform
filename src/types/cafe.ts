export type TableStatus = "vacant" | "seated" | "active_order" | "billing";

export type OrderStatus = "draft" | "sent" | "preparing" | "ready" | "served" | "completed" | "cancelled";

export type OrderItemStatus = "pending" | "preparing" | "ready" | "delivered";

export type PaymentStatus = "unpaid" | "paid" | "cash_pending";

export type ServiceRequestType = "call_server" | "water" | "bill" | "clean";

export type DietaryTag = "veg" | "non-veg" | "vegan" | "gluten-free" | "dairy-free";

export type UserRole = "admin" | "barista" | "waitstaff";

export interface CafeSettings {
  wifi_ssid: string;
  wifi_pass: string;
  tax_rate: number; // e.g. 0.08 (8%)
  service_fee_rate: number; // e.g. 0.05 (5%)
  currency: string;
  currency_symbol: string;
  auto_stock_deduction: boolean;
  kds_sound_enabled: boolean;
}

export interface Cafe {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  address: string;
  phone: string;
  logo_url: string;
  banner_url: string;
  settings: CafeSettings;
}

export interface Table {
  id: string;
  cafe_id: string;
  table_number: number;
  label: string;
  capacity: number;
  zone: "Main Dining" | "Patio Garden" | "Window Bar" | "Mezzanine";
  qr_token: string;
  status: TableStatus;
  position_x: number; // for visual floor plan editor (0-100 percentage or grid)
  position_y: number;
  merged_with?: number[] | null;
  active_session_id?: string | null;
  current_order_id?: string | null;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  cafe_id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price_delta: number;
  is_default?: boolean;
}

export interface ModifierGroup {
  id: string;
  menu_item_id: string;
  name: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  min_selection?: number;
  max_selection?: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  cafe_id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
  base_price: number;
  is_available: boolean;
  stock_count: number;
  dietary_tags: DietaryTag[];
  modifier_groups: ModifierGroup[];
  station: "barista" | "kitchen";
  prep_time_minutes: number;
  calories?: number;
}

export interface SelectedModifier {
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  price_delta: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  station: "barista" | "kitchen";
  quantity: number;
  unit_price: number;
  selected_modifiers: SelectedModifier[];
  notes?: string;
  status: OrderItemStatus;
  guest_name: string;
  guest_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  cafe_id: string;
  table_id: string;
  table_number: number;
  session_id: string;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  service_fee: number;
  tax_amount: number;
  tip_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method?: string; // 'apple_pay' | 'google_pay' | 'card' | 'upi' | 'cash'
  customer_name: string;
  guest_count: number;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  cafe_id: string;
  name: string;
  category: "Dairy & Milk" | "Coffee Beans" | "Syrups & Sweeteners" | "Bakery & Dough" | "Produce & Dry Goods";
  unit: "g" | "ml" | "pcs" | "shots";
  current_stock: number;
  reorder_level: number;
  unit_cost: number; // cost per unit in dollars
  vendor_id?: string;
}

export interface RecipeItem {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  quantity_required: number;
  unit?: string;
}

export interface ServiceRequest {
  id: string;
  cafe_id: string;
  table_id: string;
  table_number: number;
  type: ServiceRequestType;
  message?: string;
  status: "pending" | "resolved";
  created_at: string;
}

export interface WastageLog {
  id: string;
  cafe_id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: "expired" | "spill" | "machine_purge" | "defective" | "other";
  logged_by: string;
  logged_at: string;
}

export interface Vendor {
  id: string;
  cafe_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  category: string;
  lead_time_days: number;
}

export interface PurchaseOrderItem {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  cafe_id: string;
  vendor_id: string;
  vendor_name: string;
  po_number: string;
  items: PurchaseOrderItem[];
  total_cost: number;
  status: "draft" | "submitted" | "received" | "cancelled";
  created_at: string;
  expected_delivery?: string;
}

export interface CafeAnalytics {
  gross_revenue: number;
  net_revenue: number;
  order_count: number;
  average_order_value: number;
  table_turnover_rate: number; // e.g. 3.2 turns/day
  active_table_count: number;
  total_table_count: number;
  occupancy_rate: number;
  top_selling_items: Array<{
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
  peak_order_hours: Array<{
    hour: string;
    orders: number;
    revenue: number;
  }>;
  payment_method_breakdown: Record<string, number>;
  ingredient_consumption_today: Array<{
    name: string;
    amount: number;
    unit: string;
    stockRemaining: number;
  }>;
}

export type RealtimeEventType = 
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "TABLE_UPDATED"
  | "SERVICE_REQUEST_CREATED"
  | "SERVICE_REQUEST_RESOLVED"
  | "INVENTORY_DEDUCTED"
  | "WASTAGE_LOGGED"
  | "PO_CREATED";

export interface RealtimeMessage {
  type: RealtimeEventType;
  payload: unknown;
  timestamp: string;
}

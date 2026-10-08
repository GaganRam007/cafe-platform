import { z } from "zod";

export const createOrderSchema = z
  .object({
    table_id: z.string().optional(),
    qr_token: z.string().optional(),
    table_session_id: z.string().optional(),
    customer_name: z.string().min(1, "Customer name is required").max(60),
    diner_id: z.string().optional(),
    items: z
      .array(
        z.object({
          menu_item_id: z.string().min(1, "Menu item ID is required"),
          quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Max quantity per item is 50"),
          selected_option_ids: z.array(z.string()).optional().default([]),
          notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
        })
      )
      .min(1, "Order must contain at least 1 item"),
    service_charge_opt_in: z.boolean().optional().default(true),
  })
  .refine((data) => data.table_id || data.qr_token, {
    message: "Either table_id or qr_token must be provided",
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// 2. Offline Bill Settlement Schema (Staff)
export const settleBillSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentMethod: z.enum(["cash", "upi", "card"], {
    message: "Payment method must be 'cash', 'upi', or 'card'",
  }),
  discount: z
    .object({
      type: z.enum(["flat", "percentage", "comp", "staff_meal"]),
      value: z.number().min(0).max(100, "Percentage discount cannot exceed 100%"),
      reason: z.string().min(5, "Discount reason must be at least 5 characters"),
      managerPin: z.string().optional(),
    })
    .optional(),
  tip: z.number().min(0, "Tip cannot be negative").max(2000, "Max tip limit is ₹2,000").optional().default(0),
  serviceChargeOptIn: z.boolean().optional().default(true),
  customerPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Valid phone number required").optional(),
});

export type SettleBillInput = z.infer<typeof settleBillSchema>;

// 3. Reopen Settled Bill Schema (Owner Only)
export const reopenBillSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reason: z.string().min(15, "Mandatory audit reason must be at least 15 characters"),
});

export type ReopenBillInput = z.infer<typeof reopenBillSchema>;

// 4. Service Request Schema
export const serviceRequestSchema = z.object({
  table_id: z.string().min(1, "Table ID is required"),
  type: z.enum(["call_server", "water", "bill", "clean"], {
    message: "Invalid service request type",
  }),
  message: z.string().max(150).optional(),
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

// 5. Order Status Transition Schema
export const orderStatusTransitionSchema = z.object({
  status: z.enum(["preparing", "ready", "served", "completed", "cancelled"], {
    message: "Invalid order status transition",
  }),
  item_id: z.string().optional(),
  item_status: z.enum(["pending", "preparing", "ready", "delivered", "cancelled"]).optional(),
});

export type OrderStatusTransitionInput = z.infer<typeof orderStatusTransitionSchema>;

// 6. EOD Reconciliation Schema
export const eodReconciliationSchema = z.object({
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  openingFloat: z.number().min(0, "Opening float cannot be negative"),
  actualCashCounted: z.number().min(0, "Actual cash counted cannot be negative"),
  varianceNotes: z.string().max(500).optional(),
});

export type EodReconciliationInput = z.infer<typeof eodReconciliationSchema>;

// 7. Menu Item Update Schema
export const menuItemUpdateSchema = z.object({
  is_available: z.boolean().optional(),
  base_price: z.number().positive("Base price must be positive").optional(),
  stock_count: z.number().int().min(0, "Stock count cannot be negative").optional(),
});

export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>;

// 8. OTP Authentication Schemas
export const otpSendSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Valid E.164 phone number is required"),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Valid E.164 phone number is required"),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
  name: z.string().min(1).max(60).optional().default("Guest"),
  marketingOptIn: z.boolean().optional().default(false),
  tableId: z.string().optional(),
});

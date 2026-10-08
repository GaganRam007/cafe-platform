import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { getDinerSessionFromCookies } from "@/lib/auth";
import { RealtimeBus } from "@/lib/realtime";
import { createOrderSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Sliding window rate limit (30 requests per minute per client IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "customer-ip";
    const rl = await rateLimit(`order_${ip}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before ordering again." },
        { status: 429 }
      );
    }

    const rawBody = await req.json();

    // 2. Strict Zod schema validation
    const parseResult = createOrderSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid order payload";
      return NextResponse.json({ error: firstError, details: parseResult.error.issues }, { status: 400 });
    }

    const { qr_token, table_id, items, service_charge_opt_in } = parseResult.data;

    // 3. Resolve table securely by signed QR token or table_id
    let table = null;
    if (qr_token) {
      table = DB.getTableByQrToken(qr_token);
    } else if (table_id) {
      table = DB.getTableById(table_id);
    }

    if (!table) {
      return NextResponse.json({ error: "Invalid or expired table credentials" }, { status: 403 });
    }

    // 4. Authenticated diner or guest identity
    const dinerSession = await getDinerSessionFromCookies(req);
    const tableSession = DB.getOrCreateActiveTableSession(table.id);

    let customerId = dinerSession?.customerId;
    let customerName = dinerSession?.name || parseResult.data.customer_name || "Guest Diner";
    let dinerId: string | undefined = undefined;

    if (customerId) {
      const diner = DB.getOrCreateDiner(tableSession.id, customerId);
      dinerId = diner.id;
    }

    // 5. Authoritative Server-Side Calculation (Recomputing all prices, taxes, stock deductions)
    // In our offline payment workflow, orders are placed directly as 'unpaid'
    const order = DB.createOrderSecure({
      table_id: table.id,
      table_session_id: tableSession.id,
      customer_id: customerId,
      customer_name: customerName,
      diner_id: dinerId,
      items: items.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        selected_option_ids: i.selected_option_ids,
        notes: i.notes,
      })),
      payment_method: undefined,
      payment_status: "unpaid",
      service_charge_opt_in: Boolean(service_charge_opt_in),
      tip_amount: 0,
    });

    // 6. Notify KDS & Staff Dashboard in realtime
    RealtimeBus.broadcast("ORDER_CREATED", order);
    RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(table.id));

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Order creation failed:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}

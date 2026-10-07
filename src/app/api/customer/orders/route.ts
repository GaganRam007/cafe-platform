import { NextResponse } from "next/server";
import { DB, verifyQrToken } from "@/lib/db";
import { getDinerSessionFromCookies } from "@/lib/auth";
import { RealtimeBus } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { qr_token, items, payment_method, service_charge_opt_in, tip_amount } = body;

    if (!qr_token) {
      return NextResponse.json({ error: "Table QR token is required" }, { status: 400 });
    }

    const table = DB.getTableByQrToken(qr_token);
    if (!table) {
      return NextResponse.json({ error: "Invalid or expired Table QR code" }, { status: 403 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    // Authenticated diner or guest identity
    const dinerSession = await getDinerSessionFromCookies(req);
    const tableSession = DB.getOrCreateActiveTableSession(table.id);

    let customerId = dinerSession?.customerId;
    let customerName = dinerSession?.name || body.customer_name || "Guest Diner";
    let dinerId: string | undefined = undefined;

    if (customerId) {
      const diner = DB.getOrCreateDiner(tableSession.id, customerId);
      dinerId = diner.id;
    }

    // Authoritative Server-Side Calculation (Recomputing all prices from DB authority, rejecting client numbers)
    const order = DB.createOrderSecure({
      table_id: table.id,
      table_session_id: tableSession.id,
      customer_id: customerId,
      customer_name: customerName,
      diner_id: dinerId,
      items: items.map((i: any) => ({
        menu_item_id: i.menu_item_id,
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        selected_option_ids: Array.isArray(i.selected_option_ids) ? i.selected_option_ids : [],
        notes: i.notes ? String(i.notes).slice(0, 200) : undefined,
      })),
      payment_method: payment_method || "razorpay",
      payment_status: payment_method === "cash" ? "cash_pending" : "pending",
      service_charge_opt_in: Boolean(service_charge_opt_in),
      tip_amount: Math.max(0, parseFloat(tip_amount) || 0),
    });

    // Notify KDS & Staff Dashboard in realtime
    RealtimeBus.broadcast("ORDER_CREATED", order);
    RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(table.id));

    return NextResponse.json({
      success: true,
      order,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Order creation failed:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}

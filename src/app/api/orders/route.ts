import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { RealtimeBus } from "@/lib/realtime";

export async function GET(req?: Request) {
  const auth = await verifyStaffSession(undefined, req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Staff authentication required" }, { status: 403 });
  }

  return NextResponse.json({ orders: DB.getAllActiveOrders() });
}

export async function POST(req: Request) {
  try {
    const auth = await verifyStaffSession(undefined, req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Staff authentication required" }, { status: 403 });
    }

    const body = await req.json();
    const tableId = body.table_id || `tbl-${body.table_number}`;
    const tableSession = DB.getOrCreateActiveTableSession(tableId);

    const order = DB.createOrderSecure({
      table_id: tableId,
      table_session_id: tableSession.id,
      customer_name: body.customer_name || "Walk-in Guest",
      items: body.items,
      payment_method: body.payment_method || "cash",
      payment_status: body.payment_status || "cash_pending",
      service_charge_opt_in: Boolean(body.service_charge_opt_in),
      tip_amount: body.tip_amount || 0,
    });

    RealtimeBus.broadcast("ORDER_CREATED", order);
    RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(tableId));

    return NextResponse.json({ order }, { status: 201 });
  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}

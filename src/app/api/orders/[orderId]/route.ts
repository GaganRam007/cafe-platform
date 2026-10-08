import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { RealtimeBus } from "@/lib/realtime";

export async function GET(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await props.params;
  const order = DB.getOrderDetails(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await props.params;
  try {
    const auth = await verifyStaffSession(undefined, request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Staff authentication required" }, { status: 403 });
    }

    const body = await request.json();

    // Cancellation with inventory restoration
    if (body.action === "cancel") {
      const cancelled = DB.cancelOrder(orderId);
      if (!cancelled) return NextResponse.json({ error: "Order could not be cancelled" }, { status: 400 });

      RealtimeBus.broadcast("ORDER_UPDATED", cancelled);
      RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(cancelled.table_id));
      RealtimeBus.broadcast("INVENTORY_DEDUCTED", { ingredients: DB.getAllIngredients() });
      return NextResponse.json({ order: cancelled });
    }

    // Item-level completion
    if (body.item_id && body.item_status) {
      const order = DB.updateOrderItemStatus(orderId, body.item_id, body.item_status);
      if (!order) return NextResponse.json({ error: "Order or item not found" }, { status: 404 });

      RealtimeBus.broadcast("ORDER_UPDATED", order);
      return NextResponse.json({ order });
    }

    // Offline payments safety: Reject raw payment status flip
    if (body.payment_status === "paid") {
      return NextResponse.json(
        {
          error:
            "Settling orders must be processed via POST /api/staff/settle-bill for audit logging, payment method verification, and GST invoice generation.",
        },
        { status: 400 }
      );
    }

    // Order-level status transition with FSM state machine checks
    if (body.status) {
      const order = DB.transitionOrderStatus(
        orderId,
        body.status,
        auth.session?.role || "admin"
      );
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      RealtimeBus.broadcast("ORDER_UPDATED", order);
      RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(order.table_id));
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
  } catch (err: any) {
    console.error("Order patch error:", err);
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function GET(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await props.params;
  const store = getStore();
  const order = store.getOrderById(orderId);
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
    const body = await request.json();
    const store = getStore();

    if (body.item_id && body.item_status) {
      const order = store.updateOrderItemStatus(orderId, body.item_id, body.item_status);
      if (!order) return NextResponse.json({ error: "Order or item not found" }, { status: 404 });
      return NextResponse.json({ order });
    }

    if (body.status || body.payment_status) {
      const order = store.updateOrderStatus(orderId, body.status, body.payment_status);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
  } catch (err) {
    console.error("Order patch error", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

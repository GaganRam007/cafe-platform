import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const store = getStore();

    // Standardized payload format or Stripe / Razorpay simulated event
    // Event type: 'payment_intent.succeeded' or 'payment.captured' or direct cafe platform event
    const orderId = body.order_id || body.data?.object?.metadata?.order_id;
    const paymentMethod = body.payment_method || body.data?.object?.payment_method_types?.[0] || "card";

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id in webhook payload" }, { status: 400 });
    }

    const order = store.updateOrderStatus(orderId, "preparing", "paid");
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.payment_method = paymentMethod;

    return NextResponse.json({
      received: true,
      order_id: orderId,
      status: "paid",
      payment_method: paymentMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Webhook processing error", err);
    return NextResponse.json({ error: "Failed to process payment webhook" }, { status: 500 });
  }
}

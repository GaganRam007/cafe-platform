import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = DB.getOrderDetails(order_id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const amountInPaise = Math.round(order.total_amount * 100);
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_AuraCafe2026";
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId: string;

    if (keySecret && keyId !== "rzp_test_AuraCafe2026") {
      // Live Razorpay API Call
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: order.order_number,
          notes: {
            table_number: String(order.table_number),
            customer_name: order.customer_name,
          },
        }),
      });

      if (!rzpRes.ok) {
        const errorText = await rzpRes.text();
        throw new Error(`Razorpay API error: ${errorText}`);
      }

      const rzpData = await rzpRes.json();
      razorpayOrderId = rzpData.id;
    } else {
      // Deterministic Sandbox Mock Razorpay Order ID
      razorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    }

    // Save razorpay_order_id to DB
    DB.updateOrderStatus(order.id, order.status, undefined, razorpayOrderId);

    return NextResponse.json({
      success: true,
      razorpay_order_id: razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key_id: keyId,
      order_number: order.order_number,
    });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: err.message || "Payment initialization failed" }, { status: 500 });
  }
}

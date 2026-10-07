import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { RealtimeBus } from "@/lib/realtime";
import { WhatsAppInvoicingService } from "@/lib/whatsapp-invoicing";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "aura_rzp_webhook_secret_2026";

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. Verify Cryptographic Webhook Signature (Phase 2 Requirement 2)
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        console.warn("[SECURITY] Razorpay webhook signature verification failed!");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    // Parse Order identifier
    const orderId =
      body.order_id ||
      body.payload?.payment?.entity?.notes?.order_id ||
      body.payload?.order?.entity?.notes?.order_id;

    const paymentId =
      body.payment_id ||
      body.payload?.payment?.entity?.id ||
      `pay_${crypto.randomBytes(6).toString("hex")}`;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id in webhook payload" }, { status: 400 });
    }

    // 2. Prevent Race Conditions: Perform DB state mutations BEFORE broadcasting (Phase 2 Requirement 2)
    const updatedOrder = DB.updateOrderStatus(orderId, "preparing", "paid", paymentId);
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3. Automated WhatsApp/GST Invoicing (Feature 2)
    const appOrigin = new URL(req.url).origin;
    await WhatsAppInvoicingService.dispatchInvoiceNotification(orderId, appOrigin);

    // 4. Broadcast Realtime Updates after DB consistency is guaranteed
    RealtimeBus.broadcast("ORDER_UPDATED", updatedOrder);
    RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(updatedOrder.table_id));

    return NextResponse.json({
      received: true,
      order_id: orderId,
      status: "paid",
      invoice_number: updatedOrder.invoice?.invoice_number,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failure" }, { status: 500 });
  }
}

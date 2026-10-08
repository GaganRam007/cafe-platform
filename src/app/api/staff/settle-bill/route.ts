import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { settleBillSchema } from "@/lib/validations";
import { RealtimeBus } from "@/lib/realtime";
import { WhatsAppInvoicingService } from "@/lib/whatsapp-invoicing";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Authenticate Staff Role
    const auth = await verifyStaffSession(["admin", "manager", "cashier"], req);
    if (!auth.authorized || !auth.session) {
      return NextResponse.json({ error: auth.error || "Cashier or Manager authentication required" }, { status: 403 });
    }

    // 2. Rate Limiting (60 settlements/min per staff)
    const rateCheck = await rateLimit(`settle:${auth.session.staffId}`, 60, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many settlement requests. Please slow down." }, { status: 429 });
    }

    // 3. Validate Input Body with Zod
    const body = await req.json();
    const parseResult = settleBillSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderId, paymentMethod, discount, tip, serviceChargeOptIn, customerPhone } = parseResult.data;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 4. Execute Secure Settlement in Database
    const result = DB.settleBillSecure({
      orderId,
      paymentMethod,
      discount: discount as any,
      tip,
      serviceChargeOptIn,
      customerPhone,
      actor: {
        id: auth.session.staffId,
        name: auth.session.name,
        role: auth.session.role,
      },
      ipAddress: clientIp,
    });

    // 5. Enqueue WhatsApp Tax Invoice Notification
    const fullOrder = DB.getOrderDetails(orderId);
    if (fullOrder) {
      await WhatsAppInvoicingService.dispatchInvoiceNotification(
        orderId,
        req.headers.get("origin") || "http://localhost:3000"
      );
    }

    // 6. Broadcast Realtime Events
    RealtimeBus.broadcast("ORDER_UPDATED", fullOrder);
    RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(fullOrder.table_id));

    const invoice = DB.getInvoiceByNumber(result.invoiceNumber);

    return NextResponse.json({
      success: true,
      message: "Bill successfully settled",
      ...result,
      invoice,
    });
  } catch (err: any) {
    console.error("Settle bill error:", err);
    return NextResponse.json({ error: err.message || "Failed to settle bill" }, { status: 400 });
  }
}

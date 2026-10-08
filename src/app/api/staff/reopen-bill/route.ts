import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { reopenBillSchema } from "@/lib/validations";
import { RealtimeBus } from "@/lib/realtime";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Strict Owner / Admin Check
    const auth = await verifyStaffSession(["admin"], req);
    if (!auth.authorized || !auth.session) {
      return NextResponse.json(
        { error: "Forbidden: Only the Cafe Owner / Administrator can reopen a settled bill" },
        { status: 403 }
      );
    }

    // 2. Rate Limiting (5 reopens/min)
    const rateCheck = await rateLimit(`reopen:${auth.session.staffId}`, 5, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many reopen requests. Please wait." }, { status: 429 });
    }

    // 3. Validate Input Body with Zod
    const body = await req.json();
    const parseResult = reopenBillSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderId, reason } = parseResult.data;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 4. Execute Reopen in Database
    const updatedOrder = DB.reopenBillSecure({
      orderId,
      reason,
      actor: {
        id: auth.session.staffId,
        name: auth.session.name,
        role: auth.session.role,
      },
      ipAddress: clientIp,
    });

    // 5. Broadcast Realtime Updates
    RealtimeBus.broadcast("ORDER_UPDATED", updatedOrder);
    RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(updatedOrder.table_id));

    return NextResponse.json({
      success: true,
      message: "Settled bill successfully reopened",
      order: updatedOrder,
    });
  } catch (err: any) {
    console.error("Reopen bill error:", err);
    return NextResponse.json({ error: err.message || "Failed to reopen bill" }, { status: 400 });
  }
}

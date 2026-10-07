import { NextResponse } from "next/server";
import { DB, verifyQrToken } from "@/lib/db";
import { getDinerSessionFromCookies } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qrToken = searchParams.get("qr_token");

    if (!qrToken) {
      return NextResponse.json({ error: "Missing qr_token parameter" }, { status: 400 });
    }

    // Cryptographic validation of QR Token (Phase 1 Table & QR Token Security)
    const table = DB.getTableByQrToken(qrToken);
    if (!table) {
      return NextResponse.json({ error: "Invalid or expired Table QR code" }, { status: 404 });
    }

    const dinerSession = await getDinerSessionFromCookies(req);
    const tableSession = DB.getOrCreateActiveTableSession(table.id);

    let customer = null;
    let diner = null;
    if (dinerSession) {
      customer = DB.getCustomerById(dinerSession.customerId);
      if (customer) {
        diner = DB.getOrCreateDiner(tableSession.id, customer.id);
      }
    }

    // Fetch strictly orders for this table session (no data leakage of other tables or past sessions)
    const sessionOrders = DB.getCustomerSessionOrders(tableSession.id);

    return NextResponse.json({
      table: {
        id: table.id,
        table_number: table.table_number,
        label: table.label,
        capacity: table.capacity,
        zone: table.zone,
        status: table.status,
      },
      table_session: tableSession,
      customer,
      diner,
      orders: sessionOrders,
    });
  } catch (err: any) {
    console.error("Customer session fetch error:", err);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}

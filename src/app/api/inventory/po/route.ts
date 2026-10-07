import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { RealtimeBus } from "@/lib/realtime";
import { verifyStaffSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const auth = await verifyStaffSession(["admin", "manager"]);
    if (!auth.authorized || !auth.session) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized: admin or manager role required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { vendor_id, items } = body;

    if (!vendor_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid vendor or empty items list" }, { status: 400 });
    }

    const po = DB.createPurchaseOrder(vendor_id, items);

    if (!po) {
      return NextResponse.json({ error: "Failed to generate PO: vendor not found" }, { status: 404 });
    }

    RealtimeBus.broadcast("PO_CREATED", { purchase_order: po });

    return NextResponse.json({ purchase_order: po }, { status: 201 });
  } catch (err) {
    console.error("PO creation error", err);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}

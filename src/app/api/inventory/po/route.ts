import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendor_id, items } = body;

    if (!vendor_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid vendor or empty items list" }, { status: 400 });
    }

    const store = getStore();
    const po = store.createPurchaseOrder(vendor_id, items);

    if (!po) {
      return NextResponse.json({ error: "Failed to generate PO: vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ purchase_order: po }, { status: 201 });
  } catch (err) {
    console.error("PO creation error", err);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}

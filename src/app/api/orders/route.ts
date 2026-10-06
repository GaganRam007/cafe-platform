import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({ orders: store.getOrders() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const store = getStore();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    const order = store.createOrder(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Order creation error", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

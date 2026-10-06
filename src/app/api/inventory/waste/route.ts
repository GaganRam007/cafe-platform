import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredient_id, quantity, reason, logged_by } = body;

    if (!ingredient_id || !quantity) {
      return NextResponse.json({ error: "Missing ingredient_id or quantity" }, { status: 400 });
    }

    const store = getStore();
    const log = store.logWastage(ingredient_id, Number(quantity), reason || "expired", logged_by || "Staff");

    if (!log) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    return NextResponse.json({ wastage: log }, { status: 201 });
  } catch (err) {
    console.error("Wastage log error", err);
    return NextResponse.json({ error: "Failed to log wastage" }, { status: 500 });
  }
}

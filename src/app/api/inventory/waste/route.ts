import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { RealtimeBus } from "@/lib/realtime";
import { verifyStaffSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const auth = await verifyStaffSession(["admin", "manager", "kitchen"]);
    if (!auth.authorized || !auth.session) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized: admin, manager, or kitchen role required" },
        { status: 401 }
      );
    }
    const staff = auth.session;

    const body = await req.json();
    const { ingredient_id, quantity, reason, logged_by } = body;

    if (!ingredient_id || !quantity) {
      return NextResponse.json({ error: "Missing ingredient_id or quantity" }, { status: 400 });
    }

    const log = DB.logWastage(
      ingredient_id,
      Number(quantity),
      reason || "expired",
      staff.name || logged_by || "Staff"
    );

    if (!log) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    RealtimeBus.broadcast("INVENTORY_UPDATED", {
      ingredients: DB.getAllIngredients(),
      wastage_log: log,
    });

    return NextResponse.json({ wastage: log }, { status: 201 });
  } catch (err) {
    console.error("Wastage log error", err);
    return NextResponse.json({ error: "Failed to log wastage" }, { status: 500 });
  }
}

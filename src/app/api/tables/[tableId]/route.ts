import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { RealtimeBus } from "@/lib/realtime";

export async function GET(
  request: Request,
  props: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await props.params;
  const table = DB.getTableById(tableId);
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });
  return NextResponse.json({ table });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await props.params;
  try {
    const auth = await verifyStaffSession(undefined, request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Staff authentication required" }, { status: 403 });
    }

    const body = await request.json();

    if (body.action === "reset") {
      const reset = DB.resetTable(tableId);
      RealtimeBus.broadcast("TABLE_UPDATED", reset);
      return NextResponse.json({ table: reset });
    }

    if (body.action === "merge" && body.sourceTableNumber) {
      const targetTableNumber = Number(tableId.replace("tbl-", ""));
      const merged = DB.mergeTables(targetTableNumber, Number(body.sourceTableNumber));
      if (!merged) return NextResponse.json({ error: "Merge failed: invalid tables" }, { status: 400 });

      RealtimeBus.broadcast("TABLE_UPDATED", merged);
      RealtimeBus.broadcast("TABLE_UPDATED", DB.getTableById(String(body.sourceTableNumber)));
      return NextResponse.json({ table: merged });
    }

    if (body.action === "split") {
      const tableNumber = Number(tableId.replace("tbl-", ""));
      const split = DB.splitTables(tableNumber);
      if (!split) return NextResponse.json({ error: "Split failed" }, { status: 400 });

      RealtimeBus.broadcast("TABLE_UPDATED", split);
      return NextResponse.json({ table: split });
    }

    if (body.status) {
      const updated = DB.updateTableStatus(tableId, body.status);
      RealtimeBus.broadcast("TABLE_UPDATED", updated);
      return NextResponse.json({ table: updated });
    }

    if (body.position_x !== undefined && body.position_y !== undefined) {
      const updated = DB.updateTablePosition(tableId, body.position_x, body.position_y);
      RealtimeBus.broadcast("TABLE_UPDATED", updated);
      return NextResponse.json({ table: updated });
    }

    return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
  } catch (err: any) {
    console.error("Table patch error:", err);
    return NextResponse.json({ error: err.message || "Failed to update table" }, { status: 500 });
  }
}

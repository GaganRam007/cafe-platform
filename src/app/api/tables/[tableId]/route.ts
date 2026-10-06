import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function GET(
  request: Request,
  props: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await props.params;
  const store = getStore();
  const table = store.getTableById(tableId);
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });
  return NextResponse.json({ table });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await props.params;
  try {
    const body = await request.json();
    const store = getStore();

    if (body.action === "reset") {
      const reset = store.resetTable(tableId);
      return NextResponse.json({ table: reset });
    }

    if (body.action === "merge" && body.sourceTableNumber) {
      const targetTableNumber = Number(tableId.replace("tbl-", ""));
      const merged = store.mergeTables(targetTableNumber, Number(body.sourceTableNumber));
      return NextResponse.json({ table: merged });
    }

    if (body.action === "split") {
      const tableNumber = Number(tableId.replace("tbl-", ""));
      const split = store.splitTables(tableNumber);
      return NextResponse.json({ table: split });
    }

    const updated = store.updateTable(tableId, body);
    if (!updated) return NextResponse.json({ error: "Table not found" }, { status: 404 });
    return NextResponse.json({ table: updated });
  } catch (err) {
    console.error("Table patch error", err);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

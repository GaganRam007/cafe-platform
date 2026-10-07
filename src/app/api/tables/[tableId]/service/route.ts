import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { RealtimeBus } from "@/lib/realtime";

export async function POST(
  request: Request,
  props: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await props.params;
  try {
    const body = await request.json();

    // Check if tableId is an ID, a token, or table number
    const table = DB.getTableById(tableId) || DB.getTableByQrToken(tableId);
    let tableNum = table ? table.table_number : Number(tableId.replace("tbl-", ""));
    if (isNaN(tableNum)) tableNum = 1;

    const req = DB.createServiceRequest(tableNum, body.type || "call_server", body.message);
    RealtimeBus.broadcast("SERVICE_REQUEST_CREATED", { request: req });

    return NextResponse.json({ request: req }, { status: 201 });
  } catch (err) {
    console.error("Service request error", err);
    return NextResponse.json({ error: "Failed to trigger service request" }, { status: 500 });
  }
}

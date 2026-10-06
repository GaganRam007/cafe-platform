import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function POST(
  request: Request,
  props: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await props.params;
  try {
    const body = await request.json();
    const store = getStore();

    // Table id can be "tbl-2" or "2"
    let tableNum = Number(tableId.replace("tbl-", ""));
    if (isNaN(tableNum)) tableNum = 1;

    const req = store.createServiceRequest(tableNum, body.type || "call_server", body.message);
    return NextResponse.json({ request: req }, { status: 201 });
  } catch (err) {
    console.error("Service request error", err);
    return NextResponse.json({ error: "Failed to trigger service request" }, { status: 500 });
  }
}

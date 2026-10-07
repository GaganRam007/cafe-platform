import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { RealtimeBus } from "@/lib/realtime";
import { verifyStaffSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ requestId: string }> }
) {
  const auth = await verifyStaffSession();
  if (!auth.authorized || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await props.params;
  const resolved = DB.resolveServiceRequest(requestId);
  if (!resolved) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }

  RealtimeBus.broadcast("SERVICE_REQUEST_RESOLVED", { request: resolved });

  return NextResponse.json({ request: resolved });
}

import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = await verifyStaffSession(["admin", "manager"], req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Manager or Owner authentication required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    const logs = DB.getAuditLogs({ action, actorId, limit });
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}

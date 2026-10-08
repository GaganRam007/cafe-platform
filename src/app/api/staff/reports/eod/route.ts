import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { eodReconciliationSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const auth = await verifyStaffSession(["admin", "manager"], req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Manager or Owner authentication required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const report = DB.getEodReport(dateParam);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate EOD report" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyStaffSession(["admin", "manager"], req);
    if (!auth.authorized || !auth.session) {
      return NextResponse.json({ error: "Manager or Owner authentication required" }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = eodReconciliationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { businessDate, openingFloat, actualCashCounted, varianceNotes } = parseResult.data;

    const result = DB.submitEodReconciliation({
      businessDate,
      openingFloat,
      actualCashCounted,
      varianceNotes,
      actor: { id: auth.session.staffId, name: auth.session.name },
    });

    return NextResponse.json({
      success: true,
      message: "End of Day reconciliation recorded",
      reconciliation: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record EOD reconciliation" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Online payment webhook endpoint has been decommissioned. Payments are processed offline by staff at the counter via /api/staff/settle-bill.",
    },
    { status: 410 }
  );
}

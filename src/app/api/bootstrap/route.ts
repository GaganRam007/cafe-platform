import { NextResponse } from "next/server";

export async function GET() {
  // Deprecated to prevent customer data leakage (Phase 1 Requirement 2)
  return NextResponse.json(
    {
      error: "Endpoint deprecated for security compliance. Diners must use /api/customer/menu and /api/customer/session. Staff must authenticate and use /api/dashboard/bootstrap.",
    },
    { status: 403 }
  );
}

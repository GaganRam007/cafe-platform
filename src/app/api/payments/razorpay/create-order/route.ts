import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Online payment order creation has been decommissioned. Orders are placed directly to the kitchen and settled offline by staff at the counter.",
    },
    { status: 410 }
  );
}

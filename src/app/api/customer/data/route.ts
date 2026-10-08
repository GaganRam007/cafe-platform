import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { getDinerSessionFromCookies } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const session = await getDinerSessionFromCookies(req);
    const body = await req.json().catch(() => ({}));
    const targetPhone = body.phone || session?.phone;

    if (!targetPhone) {
      return NextResponse.json({ error: "Phone number required for data deletion request" }, { status: 400 });
    }

    const deleted = DB.deleteCustomerData(targetPhone);
    if (!deleted) {
      return NextResponse.json({ error: "No customer records found matching this identifier" }, { status: 404 });
    }

    const res = NextResponse.json({
      success: true,
      message: "Customer data has been permanently deleted and historical orders anonymized for privacy.",
    });

    res.cookies.delete("aura_diner_session");
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process data deletion" }, { status: 500 });
  }
}

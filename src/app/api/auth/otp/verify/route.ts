import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { createDinerSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let phone = (body.phone || "").trim();
    const code = (body.code || "").trim();
    const name = (body.name || "Guest Diner").trim();
    const marketingOptIn = Boolean(body.marketing_opt_in);
    const tableId = body.table_id;

    if (!phone.startsWith("+")) {
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else {
        phone = `+${phone}`;
      }
    }

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone number and OTP code are required" }, { status: 400 });
    }

    const isValid = DB.verifyOtp(phone, code);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    // 1. Get or create Customer record
    const customer = DB.getOrCreateCustomer(phone, name, marketingOptIn);

    // 2. If table is provided, link to active table session and diner
    let tableSession = null;
    let diner = null;
    if (tableId) {
      tableSession = DB.getOrCreateActiveTableSession(tableId);
      diner = DB.getOrCreateDiner(tableSession.id, customer.id);
    }

    // 3. Issue 30-day secure session token
    const token = createDinerSessionToken(customer);

    const response = NextResponse.json({
      success: true,
      customer,
      table_session: tableSession,
      diner,
    });

    // Set secure HTTP-only cookie (30 days)
    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https");
    response.cookies.set("aura_diner_session", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

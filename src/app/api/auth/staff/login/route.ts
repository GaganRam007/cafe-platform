import { NextResponse } from "next/server";
import { authenticateStaffByPin, createStaffSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, pin } = body;

    if (!role || !pin) {
      return NextResponse.json({ error: "Role and PIN are required" }, { status: 400 });
    }

    const staffSession = authenticateStaffByPin(role, pin);
    if (!staffSession) {
      return NextResponse.json({ error: "Invalid PIN for the selected staff role" }, { status: 401 });
    }

    const token = createStaffSessionToken(staffSession);

    const response = NextResponse.json({
      success: true,
      token,
      staff: staffSession,
      session: staffSession,
    });

    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https");

    response.cookies.set("aura_staff_session", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 12 * 60 * 60, // 12 hours shift duration
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Staff login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

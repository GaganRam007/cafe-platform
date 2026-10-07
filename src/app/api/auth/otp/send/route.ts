import { NextResponse } from "next/server";
import { DB } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let phone = (body.phone || "").trim();

    // Standardize phone format (India +91)
    if (!phone.startsWith("+")) {
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else {
        phone = `+${phone}`;
      }
    }

    if (!/^\+[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    DB.saveOtp(phone, otpCode, expiresAt);

    console.log(`[SMS_GATEWAY] OTP for ${phone} is: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${phone}`,
      debug_otp: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    });
  } catch (err: any) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

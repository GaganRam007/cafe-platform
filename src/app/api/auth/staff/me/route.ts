import { NextResponse } from "next/server";
import { getStaffSessionFromCookies } from "@/lib/auth";

export async function GET(req?: Request) {
  const staff = await getStaffSessionFromCookies(req);
  if (!staff) {
    return NextResponse.json({ authenticated: false, staff: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, staff });
}

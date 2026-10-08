import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public path prefixes that do not require staff authentication
const PUBLIC_API_PATHS = [
  "/api/customer/",
  "/api/auth/otp/",
  "/api/auth/staff/login",
  "/api/invoices/",
  "/api/realtime",
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Apply Security Headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // 2. CSRF / Origin Verification for mutating staff APIs
  if (
    (pathname.startsWith("/api/staff/") || pathname.startsWith("/api/inventory/") || pathname.startsWith("/api/orders/")) &&
    ["POST", "PATCH", "DELETE", "PUT"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "CSRF verification failed: Origin mismatch" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Malformed origin header" }, { status: 403 });
      }
    }
  }

  // 3. Protected Staff API Routes Enforcement
  const isProtectedApi =
    pathname.startsWith("/api/staff/") ||
    pathname.startsWith("/api/dashboard/") ||
    (pathname.startsWith("/api/inventory/") && !pathname.includes("/public")) ||
    (pathname.startsWith("/api/orders/") && !pathname.includes("/customer"));

  const isPublicApi = PUBLIC_API_PATHS.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedApi && !isPublicApi) {
    const cookieToken = req.cookies.get("aura_staff_session")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!cookieToken && !bearerToken) {
      return NextResponse.json(
        { error: "Staff authentication required. Please sign in via staff terminal." },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
  ],
};

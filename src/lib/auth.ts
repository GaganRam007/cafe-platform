import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";

const AUTH_SECRET = process.env.AUTH_SECRET || "aura_production_secret_key_99347184";

export interface DinerSession {
  customerId: string;
  phone: string;
  name: string;
  issuedAt: number;
}

export interface StaffSession {
  staffId: string;
  name: string;
  role: "admin" | "manager" | "cashier" | "kitchen" | "waitstaff";
  issuedAt: number;
}

// Token Signing helper (HMAC SHA256)
function signPayload(payload: object): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(b64).digest("base64url");
  return `${b64}.${signature}`;
}

function verifyPayload<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(b64).digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// 1. Diner Session Management (30-day persistent cookie)
export function createDinerSessionToken(customer: { id: string; phone_e164: string; name: string }): string {
  return signPayload({
    customerId: customer.id,
    phone: customer.phone_e164,
    name: customer.name,
    issuedAt: Date.now(),
  });
}

export function parseDinerSessionToken(token: string): DinerSession | null {
  return verifyPayload<DinerSession>(token);
}

export async function getDinerSessionFromCookies(req?: Request): Promise<DinerSession | null> {
  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/aura_diner_session=([^;]+)/);
    if (match) return parseDinerSessionToken(match[1]);
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("aura_diner_session")?.value;
    if (!token) return null;
    return parseDinerSessionToken(token);
  } catch {
    return null;
  }
}

// 2. Staff Session & Strict Server-Side RBAC (Phase 1 Access Control)
const STAFF_ACCOUNTS: Record<string, { pin: string; name: string; role: StaffSession["role"] }> = {
  admin: { pin: "1234", name: "Aura Admin", role: "admin" },
  manager: { pin: "1111", name: "Floor Manager", role: "manager" },
  kitchen: { pin: "2345", name: "Head Barista / Chef", role: "kitchen" },
  waitstaff: { pin: "3456", name: "Floor Server", role: "waitstaff" },
  cashier: { pin: "4567", name: "Billing Cashier", role: "cashier" },
};

export function authenticateStaffByPin(role: string, pin: string): StaffSession | null {
  const account = STAFF_ACCOUNTS[role];
  if (!account) return null;
  if (account.pin !== pin) return null;

  return {
    staffId: `staff-${role}`,
    name: account.name,
    role: account.role,
    issuedAt: Date.now(),
  };
}

export const verifyStaffPin = authenticateStaffByPin;

export function createStaffSessionToken(session: StaffSession): string {
  return signPayload(session);
}

export function parseStaffSessionToken(token: string): StaffSession | null {
  return verifyPayload<StaffSession>(token);
}

export async function getStaffSessionFromCookies(req?: Request): Promise<StaffSession | null> {
  if (req) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const parsed = parseStaffSessionToken(authHeader.substring(7).trim());
      if (parsed) return parsed;
    }
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/aura_staff_session=([^;]+)/);
    if (match) return parseStaffSessionToken(match[1]);
  }
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const parsed = parseStaffSessionToken(authHeader.substring(7).trim());
      if (parsed) return parsed;
    }
  } catch {
    // ignore
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("aura_staff_session")?.value;
    if (!token) return null;
    return parseStaffSessionToken(token);
  } catch {
    return null;
  }
}

export async function verifyStaffSession(
  allowedRoles?: Array<StaffSession["role"]>,
  req?: Request
): Promise<{ authorized: boolean; session: StaffSession | null; error?: string }> {
  const session = await getStaffSessionFromCookies(req);
  if (!session) {
    return { authorized: false, session: null, error: "Authentication required" };
  }

  // Admin has superuser privileges across all routes
  if (session.role === "admin") {
    return { authorized: true, session };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { authorized: false, session, error: `Forbidden: role '${session.role}' is not authorized` };
  }

  return { authorized: true, session };
}

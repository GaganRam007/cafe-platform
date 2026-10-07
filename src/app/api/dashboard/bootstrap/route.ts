import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";

export async function GET(req?: Request) {
  // Strict Server-Side RBAC Access Control (Phase 1 Requirement 2)
  const auth = await verifyStaffSession(["admin", "manager", "cashier", "kitchen", "waitstaff"], req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Staff authentication required" }, { status: 401 });
  }

  return NextResponse.json({
    cafe: DB.getCafe(),
    tables: DB.getAllTables(),
    menuItems: DB.getPublicMenu().items,
    ingredients: DB.getAllIngredients(),
    orders: DB.getAllActiveOrders(),
    serviceRequests: DB.getPendingServiceRequests(),
    wastageLogs: DB.getWastageLogs(),
    vendors: DB.getAllVendors(),
    purchaseOrders: DB.getPurchaseOrders(),
    analytics: DB.getAnalytics(),
    staff: auth.session,
    currentStaff: auth.session,
  });
}

import { NextResponse } from "next/server";
import { DB } from "@/lib/db";
import { verifyStaffSession } from "@/lib/auth";
import { RealtimeBus } from "@/lib/realtime";
import { menuItemUpdateSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await props.params;

    // Staff authentication: manager or admin required to modify menu
    const auth = await verifyStaffSession(["admin", "manager"], req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Manager or Owner privileges required" }, { status: 403 });
    }

    const rawBody = await req.json();
    const parseResult = menuItemUpdateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const updated = DB.updateMenuItem(itemId, parseResult.data);

    // Audit log
    DB.createAuditLog({
      action: "MENU_ITEM_UPDATED",
      actorId: auth.session?.staffId || "unknown",
      actorName: auth.session?.name || "Staff",
      actorRole: auth.session?.role || "manager",
      reason: `Updated menu item: ${updated.name}`,
      metadata: {
        itemId,
        updates: parseResult.data,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    RealtimeBus.broadcast("MENU_UPDATED", { item: updated });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("Menu item update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update menu item" }, { status: 500 });
  }
}

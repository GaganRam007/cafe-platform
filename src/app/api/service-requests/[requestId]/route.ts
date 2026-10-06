import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await props.params;
  const store = getStore();
  const resolved = store.resolveServiceRequest(requestId);
  if (!resolved) return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  return NextResponse.json({ request: resolved });
}

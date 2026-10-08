import { RealtimeBus } from "@/lib/realtime";
import { RealtimeMessage } from "@/types/cafe";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientTableId = searchParams.get("table_id");
  const clientRole = searchParams.get("role");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connection ping
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Subscribe to RealtimeBus with scope filtering
      const unsubscribe = RealtimeBus.subscribe((event: RealtimeMessage & { _scope?: { tableId?: string; role?: string } }) => {
        try {
          // Scope checking:
          // If event is scoped to a specific table, only send to that table or staff
          if (event._scope?.tableId && clientTableId && event._scope.tableId !== clientTableId && !clientRole) {
            return;
          }
          // If event is scoped to a specific role, only send if role matches or admin
          if (event._scope?.role && clientRole && event._scope.role !== clientRole && clientRole !== "admin" && clientRole !== "owner") {
            return;
          }

          const cleanEvent: RealtimeMessage = {
            type: event.type,
            payload: event.payload,
            timestamp: event.timestamp,
          };
          const payloadString = `data: ${JSON.stringify(cleanEvent)}\n\n`;
          controller.enqueue(encoder.encode(payloadString));
        } catch (err) {
          console.error("SSE stream enqueue error", err);
        }
      });

      // Keepalive heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

import { getStore } from "@/lib/data-store";
import { RealtimeMessage } from "@/types/cafe";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const store = getStore();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial ping message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Subscribe to all store broadcasts
      const unsubscribe = store.subscribe((event: RealtimeMessage) => {
        try {
          const payloadString = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payloadString));
        } catch (err) {
          console.error("SSE stream enqueue error", err);
        }
      });

      // Keepalive heartbeat every 20 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 20000);

      // Cleanup on abort
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

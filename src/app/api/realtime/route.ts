import { RealtimeBus } from "@/lib/realtime";
import { RealtimeMessage } from "@/types/cafe";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connection ping
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Subscribe to RealtimeBus
      const unsubscribe = RealtimeBus.subscribe((event: RealtimeMessage) => {
        try {
          const payloadString = `data: ${JSON.stringify(event)}\n\n`;
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

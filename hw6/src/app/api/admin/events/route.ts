import { NextResponse } from "next/server";

import { subscribeAdminEvents } from "@/lib/realtime/bus";

export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      const unsubscribe = subscribeAdminEvents(send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
    },
    cancel() {
      cleanup?.();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}


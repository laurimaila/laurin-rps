import { NextRequest } from 'next/server';
import { matchService } from '@/lib/match-service';
import { GameResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Periodic keep-alive to prevent timeouts
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch (e) {
          clearInterval(keepAliveInterval);
        }
      }, 20_000);

      // Initial keep-alive
      controller.enqueue(encoder.encode(": keep-alive\n\n"));

      const onNewMatch = (event: Event) => {
        const match = (event as CustomEvent<GameResult>).detail;
        const data = `data: ${JSON.stringify(match)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      matchService.addEventListener("new_match", onNewMatch);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        matchService.removeEventListener("new_match", onNewMatch);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

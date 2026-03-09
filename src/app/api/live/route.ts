import { NextRequest } from 'next/server';
import { matchStore } from '@/lib/match-store';
import { GameResult } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial keep-alive
      controller.enqueue(encoder.encode(": keep-alive\n\n"));

      const onNewMatch = (match: GameResult) => {
        const data = `data: ${JSON.stringify(match)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      matchStore.on("new_match", onNewMatch);

      // Clean up on close
      req.signal.addEventListener('abort', () => {
        matchStore.off("new_match", onNewMatch);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

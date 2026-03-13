import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/match-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const player = searchParams.get('player');
  const date = searchParams.get('date');
  // Use playedAt and id for pagination cursor
  const playedAtStr = searchParams.get('playedAt');
  const id = searchParams.get('id');
  const limitStr = searchParams.get('limit');

  const limit = limitStr ? parseInt(limitStr) : 50;
  const playedAt = playedAtStr ? parseInt(playedAtStr) : undefined;
  const cursor = (playedAt && id) ? { playedAt, id } : undefined;

  let matches;

  if (player) {
    matches = await matchService.getByPlayer(player, limit, cursor, date || undefined);
  } else if (date) {
    matches = await matchService.getByDate(date, limit, cursor);
  } else {
    matches = await matchService.getLatest(limit, cursor);
  }

  // Generate next cursor based on last match fetched
  let nextCursor = null;
  if (matches.length === limit) {
    const lastMatch = matches[matches.length - 1];
    nextCursor = {
      playedAt: lastMatch.time,
      id: lastMatch.gameId
    };
  }

  return NextResponse.json({
    data: matches,
    cursor: nextCursor
  });
}

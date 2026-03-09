import { NextRequest, NextResponse } from 'next/server';
import { matchStore } from '@/lib/match-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const player = searchParams.get('player');
  const date = searchParams.get('date');

  let matches;

  if (player) {
    matches = matchStore.getByPlayer(player);
  } else if (date) {
    matches = matchStore.getByDate(date);
  } else {
    matches = matchStore.getLatest(100);
  }

  return NextResponse.json({
    data: matches,
    cursor: null
  });
}

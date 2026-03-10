import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/match-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const limitStr = searchParams.get('limit');
  const winsStr = searchParams.get('wins');
  const name = searchParams.get('name') || undefined;

  const limit = limitStr ? parseInt(limitStr) : 50;
  const wins = winsStr ? parseInt(winsStr) : undefined;
  
  const cursor = (wins !== undefined && name) ? { wins, name } : undefined;

  const stats = await matchService.getLeaderboard(startDate, endDate, limit, cursor);

  // Generate next cursor if we have results and possibly more
  let nextCursor = null;
  if (stats.length === limit) {
    const last = stats[stats.length - 1];
    nextCursor = {
      wins: last.wins,
      name: last.name
    };
  }

  return NextResponse.json({
    data: stats,
    cursor: nextCursor
  });
}

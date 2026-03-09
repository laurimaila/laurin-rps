import { NextRequest, NextResponse } from 'next/server';
import { matchStore } from '@/lib/match-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const stats = matchStore.getLeaderboard(startDate, endDate);

  return NextResponse.json({
    data: stats
  });
}

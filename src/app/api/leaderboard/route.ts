import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/match-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const stats = await matchService.getLeaderboard(startDate, endDate);

  return NextResponse.json({
    data: stats
  });
}

import { NextResponse } from 'next/server';
import { matchService } from '@/lib/match-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Fetch all unique player names because there aren't that many
  const players = await matchService.getAllPlayers();
  return NextResponse.json(players);
}

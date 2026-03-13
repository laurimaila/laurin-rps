import { db } from "@/db";
import { matches, players } from "@/db/schema";
import { desc, and, gte, lte, lt, sql, or, eq } from "drizzle-orm";
import { GameResult, Hand } from "./types";

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
}

export async function getLatestMatches(limit = 100, cursor?: { playedAt: number, id: string }): Promise<GameResult[]> {
  const whereClause = cursor ? or(
    lt(matches.playedAt, new Date(cursor.playedAt)),
    and(
      eq(matches.playedAt, new Date(cursor.playedAt)),
      lt(matches.id, cursor.id)
    )
  ) : undefined;

  const results = await db.query.matches.findMany({
    where: whereClause,
    limit,
    orderBy: [desc(matches.playedAt), desc(matches.id)],
    with: {
      playerA: true,
      playerB: true
    }
  });

  return results.map(m => ({
    type: "GAME_RESULT" as const,
    gameId: m.id,
    time: m.playedAt.getTime(),
    playerA: { name: m.playerA.name, played: m.playerAHand as Hand },
    playerB: { name: m.playerB.name, played: m.playerBHand as Hand }
  }));
}

export async function getMatchesByPlayer(name: string, limit = 100, cursor?: { playedAt: number, id: string }, date?: string): Promise<GameResult[]> {
  const cursorDate = cursor ? new Date(cursor.playedAt) : null;
  const cursorId = cursor?.id;

  let dateStart: Date | null = null;
  let dateEnd: Date | null = null;

  if (date) {
    dateStart = new Date(date);
    dateEnd = new Date(date);
    dateEnd.setDate(dateEnd.getDate() + 1);
  }

  const results = await db.query.matches.findMany({
    where: and(
      or(eq(matches.playerAId, name), eq(matches.playerBId, name)),
      dateStart && dateEnd ? and(gte(matches.playedAt, dateStart), lt(matches.playedAt, dateEnd)) : undefined,
      cursorDate && cursorId ? or(
        lt(matches.playedAt, cursorDate),
        and(eq(matches.playedAt, cursorDate), lt(matches.id, cursorId))
      ) : undefined
    ),
    limit,
    orderBy: [desc(matches.playedAt), desc(matches.id)],
    with: {
      playerA: true,
      playerB: true
    }
  });

  return results.map(m => ({
    type: "GAME_RESULT" as const,
    gameId: m.id,
    time: m.playedAt.getTime(),
    playerA: { name: m.playerA.name, played: m.playerAHand as Hand },
    playerB: { name: m.playerB.name, played: m.playerBHand as Hand }
  }));
}

export async function getMatchesByDate(date: string, limit = 100, cursor?: { playedAt: number, id: string }): Promise<GameResult[]> {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const filters = [
    gte(matches.playedAt, start),
    lte(matches.playedAt, end)
  ];

  if (cursor) {
    filters.push(or(
      lt(matches.playedAt, new Date(cursor.playedAt)),
      and(
        eq(matches.playedAt, new Date(cursor.playedAt)),
        lt(matches.id, cursor.id)
      )
    )!);
  }

  const results = await db.query.matches.findMany({
    where: and(...filters),
    limit,
    orderBy: [desc(matches.playedAt), desc(matches.id)],
    with: {
      playerA: true,
      playerB: true
    }
  });

  return results.map(m => ({
    type: "GAME_RESULT" as const,
    gameId: m.id,
    time: m.playedAt.getTime(),
    playerA: { name: m.playerA.name, played: m.playerAHand as Hand },
    playerB: { name: m.playerB.name, played: m.playerBHand as Hand }
  }));
}

export async function getLeaderboardStats(startDate?: string, endDate?: string, limit = 50, cursor?: { wins: number, name: string }): Promise<PlayerStats[]> {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (end) {
    end.setDate(end.getDate() + 1);
  }

  const query = sql`
    WITH stats AS (
      SELECT p.name,
             COUNT(CASE WHEN m.winner_id = p.id THEN 1 END) as wins,
             COUNT(CASE WHEN (m.player_a_id = p.id OR m.player_b_id = p.id) AND m.winner_id IS NOT NULL AND m.winner_id != p.id THEN 1 END) as losses,
             COUNT(CASE WHEN (m.player_a_id = p.id OR m.player_b_id = p.id) AND m.winner_id IS NULL THEN 1 END) as ties,
             COUNT(CASE WHEN (m.player_a_id = p.id OR m.player_b_id = p.id) THEN 1 END) as total
      FROM ${players} p
      LEFT JOIN ${matches} m ON (m.player_a_id = p.id OR m.player_b_id = p.id)
        ${start ? sql` AND m.played_at >= ${start}` : sql``}
        ${end ? sql` AND m.played_at < ${end}` : sql``}
      GROUP BY p.name
    )
    SELECT * FROM stats
    WHERE total > 0
    ${cursor ? sql` AND (wins < ${cursor.wins} OR (wins = ${cursor.wins} AND name > ${cursor.name}))` : sql``}
    ORDER BY wins DESC, name ASC
    LIMIT ${limit}
  `;

  const results = await db.execute(query);
  return results.rows as unknown as PlayerStats[];
}

export async function getAllPlayerNames(): Promise<string[]> {
  const results = await db.query.players.findMany({
    orderBy: [players.name],
  });
  return results.map(p => p.name);
}

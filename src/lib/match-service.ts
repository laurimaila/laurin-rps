import { GameResult, fetchHistoryFromReaktor, calculateWinner, Hand } from "./api";
import { db } from "@/db";
import { matches, players } from "@/db/schema";
import { desc, and, gte, lte, lt, sql, or, eq } from "drizzle-orm";

interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
}

class MatchService extends EventTarget {
  private static instance: MatchService;

  private isLiveConnected = false;
  private isHistoryLoaded = false;
  private token = process.env.REAKTOR_TOKEN;
  private totalMatchesLoaded = 0;

  private constructor() {
    super();
    this.init();
  }

  public static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  private async init() {
    if (!this.token) {
      console.warn("REAKTOR_TOKEN is missing. Skipping Match Store initialization (expected during build).");
      return;
    }
    console.log("Initializing Database-backed Match Store...");
    this.crawlHistory();
    this.connectLive();
  }

  private async crawlHistory(cursor?: string) {
    try {
      const res = await fetchHistoryFromReaktor(cursor);

      // Batch index this batch into DB
      const newMatchesCount = await this.storeMatches(res.data);

      this.totalMatchesLoaded += res.data.length;

      if (this.totalMatchesLoaded % 1000 === 0) {
        console.log(`Saved ${this.totalMatchesLoaded} matches...`);
      }

      // Early exit if we found no new matches in this batch (already synced)
      if (newMatchesCount === 0 && res.data.length > 0) {
        console.log("No new matches in batch. History is already up to date. Stopping crawl.");
        this.isHistoryLoaded = true;
        this.dispatchEvent(new Event("history_loaded"));
        return;
      }

      // TODO: Increase match limit later
      const matchLimit = process.env.NODE_ENV === "development" ? 10000 : 10000;

      if (res.cursor && this.totalMatchesLoaded < matchLimit) {
        console.log(`Waiting 1s before next batch... (${this.totalMatchesLoaded} indexed)`);
        setTimeout(() => this.crawlHistory(res.cursor!), 1000);
      } else {
        this.isHistoryLoaded = true;
        console.log(`SYNC COMPLETE. Total matches in DB: ${this.totalMatchesLoaded}`);
        this.dispatchEvent(new Event("history_loaded"));
      }
    } catch (err) {
      console.error("Sync Error:", err);
      setTimeout(() => this.crawlHistory(cursor), 10000);
    }
  }

  private async storeMatches(results: GameResult[]): Promise<number> {
    if (results.length === 0) return 0;
    let newMatchesCount = 0;

    try {
      // 1. Extract unique players
      const playerMap = new Map<string, { id: string, name: string }>();
      results.forEach(m => {
        playerMap.set(m.playerA.name, { id: m.playerA.name, name: m.playerA.name });
        playerMap.set(m.playerB.name, { id: m.playerB.name, name: m.playerB.name });
      });

      // 2. Batch insert players
      const playerValues = Array.from(playerMap.values());
      const PLAYER_CHUNK = 500;
      for (let i = 0; i < playerValues.length; i += PLAYER_CHUNK) {
        await db.insert(players)
          .values(playerValues.slice(i, i + PLAYER_CHUNK))
          .onConflictDoNothing();
      }

      // 3. Prepare matches
      const matchValues = results.map(m => {
        const winner = calculateWinner(m.playerA, m.playerB);
        let winnerId: string | null = null;
        if (winner === "A") winnerId = m.playerA.name;
        else if (winner === "B") winnerId = m.playerB.name;

        return {
          id: m.gameId,
          playedAt: new Date(m.time),
          playerAId: m.playerA.name,
          playerBId: m.playerB.name,
          playerAHand: m.playerA.played.toUpperCase() as any,
          playerBHand: m.playerB.played.toUpperCase() as any,
          winnerId: winnerId
        };
      });

      // 4. Batch insert matches in chunks
      const MATCH_CHUNK = 500;
      for (let i = 0; i < matchValues.length; i += MATCH_CHUNK) {
        const result = await db.insert(matches)
          .values(matchValues.slice(i, i + MATCH_CHUNK))
          .onConflictDoNothing()
          .returning({ id: matches.id });

        newMatchesCount += result.length;
      }
    } catch (err) {
      console.error(`Error storing batch:`, err);
    }

    return newMatchesCount;
  }

  private async indexMatch(match: GameResult) {
    await this.storeMatches([match]);
    this.dispatchEvent(new CustomEvent("new_match", { detail: match }));
  }

  private async connectLive() {
    if (this.isLiveConnected) return;
    this.isLiveConnected = true;

    try {
      const response = await fetch("https://assignments.reaktor.com/live", {
        headers: { Authorization: `Bearer ${this.token}` },
        cache: 'no-store'
      });
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.replace("data:", "").trim());
              if (data.type === "GAME_RESULT") {
                await this.indexMatch(data);
                this.totalMatchesLoaded++;
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Live Error:", err);
    } finally {
      this.isLiveConnected = false;
      setTimeout(() => this.connectLive(), 5000);
    }
  }

  // --- Query API ---

  public async getLatest(limit = 100, cursor?: { playedAt: number, id: string }): Promise<GameResult[]> {
    // Composite cursor: (playedAt < cursorTime) OR (playedAt = cursorTime AND id < cursorId)
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
      type: "GAME_RESULT",
      gameId: m.id,
      time: m.playedAt.getTime(),
      playerA: { name: m.playerA.name, played: m.playerAHand as Hand },
      playerB: { name: m.playerB.name, played: m.playerBHand as Hand }
    }));
  }

  public async getByPlayer(name: string, limit = 100, cursor?: { playedAt: number, id: string }): Promise<GameResult[]> {
    const cursorDate = cursor ? new Date(cursor.playedAt) : null;
    const cursorId = cursor?.id || null;

    // Optimized with UNION ALL to ensure index usage for both columns separately.
    // We use a composite cursor filter (played_at, id) < (cursor_date, cursor_id)
    const query = sql`
      WITH filtered AS (
        (SELECT * FROM ${matches}
         WHERE player_a_id = ${name}
         ${cursorDate ? sql` AND (played_at < ${cursorDate} OR (played_at = ${cursorDate} AND id < ${cursorId}))` : sql``})
        UNION ALL
        (SELECT * FROM ${matches}
         WHERE player_b_id = ${name} AND player_a_id != ${name}
         ${cursorDate ? sql` AND (played_at < ${cursorDate} OR (played_at = ${cursorDate} AND id < ${cursorId}))` : sql``})
      )
      SELECT * FROM filtered
      ORDER BY played_at DESC, id DESC
      LIMIT ${limit}
    `;

    const results = await db.execute(query);

    return results.rows.map((m: any) => ({
      type: "GAME_RESULT",
      gameId: m.id,
      time: new Date(m.played_at).getTime(),
      playerA: { name: m.player_a_id, played: m.player_a_hand as Hand },
      playerB: { name: m.player_b_id, played: m.player_b_hand as Hand }
    }));
  }

  public async getByDate(date: string, limit = 100, cursor?: { playedAt: number, id: string }): Promise<GameResult[]> {
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
      type: "GAME_RESULT",
      gameId: m.id,
      time: m.playedAt.getTime(),
      playerA: { name: m.playerA.name, played: m.playerAHand as Hand },
      playerB: { name: m.playerB.name, played: m.playerBHand as Hand }
    }));
  }

  public async getLeaderboard(startDate?: string, endDate?: string): Promise<PlayerStats[]> {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // If endDate is provided (e.g., '2026-03-09'), it defaults to 00:00:00.
    // To make it inclusive of that entire day, we add 1 day and use '<'.
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
      SELECT * FROM stats WHERE total > 0 ORDER BY wins DESC, name ASC
    `;

    const results = await db.execute(query);
    return results.rows as unknown as PlayerStats[];
  }

  public getStatus() {
    return { loaded: this.totalMatchesLoaded, isSyncing: !this.isHistoryLoaded };
  }
}

const globalForService = global as unknown as { matchService: MatchService };
export const matchService = globalForService.matchService || MatchService.getInstance();
if (process.env.NODE_ENV !== "production") globalForService.matchService = matchService;

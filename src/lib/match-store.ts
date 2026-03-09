import { EventEmitter } from "events";
import { GameResult, fetchHistoryFromReaktor, calculateWinner } from "./api";
import { format } from "date-fns";

interface PlayerStats {
  wins: number;
  losses: number;
  ties: number;
  total: number;
}

class MatchStore extends EventEmitter {
  private static instance: MatchStore;

  // High-performance Indexes
  private allMatches: GameResult[] = [];
  private matchesByDate: Map<string, GameResult[]> = new Map();
  private matchesByPlayer: Map<string, GameResult[]> = new Map();
  private statsByDateByPlayer: Map<string, Map<string, PlayerStats>> = new Map();

  private isLiveConnected = false;
  private isHistoryLoaded = false;
  private token = process.env.REAKTOR_TOKEN;
  private totalMatchesLoaded = 0;

  private constructor() {
    super();
    this.setMaxListeners(100);
    this.init();
  }

  public static getInstance(): MatchStore {
    if (!MatchStore.instance) {
      MatchStore.instance = new MatchStore();
    }
    return MatchStore.instance;
  }

  private async init() {
    if (!this.token) {
      console.warn("⚠️ REAKTOR_TOKEN is missing. Skipping Match Store initialization (expected during build).");
      return;
    }
    console.log("🚀 Initializing Indexed Match Store...");
    this.crawlHistory();
    this.connectLive();
  }

  private async crawlHistory(cursor?: string) {
    try {
      const res = await fetchHistoryFromReaktor(cursor);

      // Index this batch
      res.data.forEach(m => this.indexMatch(m, false));
      this.totalMatchesLoaded += res.data.length;

      if (this.totalMatchesLoaded % 1000 === 0) {
        console.log(`📂 [Index] Synced ${this.totalMatchesLoaded} matches...`);
      }

      const devLimit = process.env.NODE_ENV === "development" ? 5000 : 100000;

      if (res.cursor && this.totalMatchesLoaded < devLimit) {
        // Increased delay to be extremely polite to the API
        console.log(`⏳ Waiting 1.5s before next batch... (${this.totalMatchesLoaded} indexed)`);
        setTimeout(() => this.crawlHistory(res.cursor!), 1500);
      } else {
        this.isHistoryLoaded = true;
        console.log(`✅ SYNC COMPLETE. Total matches: ${this.totalMatchesLoaded}`);
        this.emit("history_loaded");
      }
    } catch (err) {
      console.error("❌ Sync Error:", err);
      setTimeout(() => this.crawlHistory(cursor), 10000);
    }
  }

  private indexMatch(match: GameResult, isNew: boolean) {
    const dateKey = format(new Date(match.time), "yyyy-MM-dd");

    // 1. All Matches (Latest View)
    if (isNew) {
      this.allMatches = [match, ...this.allMatches];
    } else {
      this.allMatches.push(match);
    }

    // 2. Date Index
    if (!this.matchesByDate.has(dateKey)) this.matchesByDate.set(dateKey, []);
    const dateList = this.matchesByDate.get(dateKey)!;
    isNew ? dateList.unshift(match) : dateList.push(match);

    // 3. Player Index & Stats
    const winner = calculateWinner(match.playerA, match.playerB);
    const players = [match.playerA, match.playerB];

    players.forEach((p, idx) => {
      const name = p.name;
      const isPlayerA = idx === 0;

      // Player Index
      if (!this.matchesByPlayer.has(name)) this.matchesByPlayer.set(name, []);
      const playerList = this.matchesByPlayer.get(name)!;
      isNew ? playerList.unshift(match) : playerList.push(match);

      // Stats Index
      if (!this.statsByDateByPlayer.has(dateKey)) this.statsByDateByPlayer.set(dateKey, new Map());
      const dayStats = this.statsByDateByPlayer.get(dateKey)!;
      if (!dayStats.has(name)) dayStats.set(name, { wins: 0, losses: 0, ties: 0, total: 0 });

      const stats = dayStats.get(name)!;
      stats.total++;
      if (winner === "TIE") stats.ties++;
      else if ((winner === "A" && isPlayerA) || (winner === "B" && !isPlayerA)) stats.wins++;
      else stats.losses++;
    });
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
                this.indexMatch(data, true);
                this.totalMatchesLoaded++;
                this.emit("new_match", data);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("❌ Live Error:", err);
    } finally {
      this.isLiveConnected = false;
      setTimeout(() => this.connectLive(), 5000);
    }
  }

  // --- Query API ---

  public getLatest(limit = 100) {
    return this.allMatches.slice(0, limit);
  }

  public getByPlayer(name: string) {
    return this.matchesByPlayer.get(name) || [];
  }

  public getByDate(date: string) {
    return this.matchesByDate.get(date) || [];
  }

  public getLeaderboard(startDate?: string, endDate?: string) {
    const aggregated = new Map<string, PlayerStats>();

    this.statsByDateByPlayer.forEach((dayStats, date) => {
      if (startDate && date < startDate) return;
      if (endDate && date > endDate) return;

      dayStats.forEach((stat, name) => {
        if (!aggregated.has(name)) aggregated.set(name, { wins: 0, losses: 0, ties: 0, total: 0 });
        const agg = aggregated.get(name)!;
        agg.wins += stat.wins;
        agg.losses += stat.losses;
        agg.ties += stat.ties;
        agg.total += stat.total;
      });
    });

    return Array.from(aggregated.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.wins - a.wins);
  }
}

const globalForStore = global as unknown as { matchStore: MatchStore };
export const matchStore = globalForStore.matchStore || MatchStore.getInstance();
if (process.env.NODE_ENV !== "production") globalForStore.matchStore = matchStore;

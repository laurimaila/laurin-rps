import {
  getLatestMatches,
  getMatchesByPlayer,
  getMatchesByDate,
  getLeaderboardStats,
  getAllPlayerNames,
} from "./match-queries";

import { crawlHistory, connectLiveStream } from "./match-sync";

class MatchService extends EventTarget {

  private static instance: MatchService;

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
    if (!process.env.REAKTOR_TOKEN) {
      console.warn("REAKTOR_TOKEN is missing. Skipping data init.");
      return;
    }
    console.log("Initializing MatchService...");

    crawlHistory();

    connectLiveStream((match) => {
      this.dispatchEvent(new CustomEvent("new_match", { detail: match }));
    });
  }

  public getLatest(limit = 100, cursor?: { playedAt: number, id: string }) {
    return getLatestMatches(limit, cursor);
  }

  public getByPlayer(name: string, limit = 100, cursor?: { playedAt: number, id: string }, date?: string) {
    return getMatchesByPlayer(name, limit, cursor, date);
  }

  public getByDate(date: string, limit = 100, cursor?: { playedAt: number, id: string }) {
    return getMatchesByDate(date, limit, cursor);
  }

  public getLeaderboard(startDate?: string, endDate?: string, limit = 50, cursor?: { wins: number, name: string }) {
    return getLeaderboardStats(startDate, endDate, limit, cursor);
  }

  public getAllPlayers() {
    return getAllPlayerNames();
  }
}

// Fixes singleton for Next.js hot reloads
const globalForService = global as unknown as { matchService: MatchService };
export const matchService = globalForService.matchService || MatchService.getInstance();
if (process.env.NODE_ENV !== "production") globalForService.matchService = matchService;

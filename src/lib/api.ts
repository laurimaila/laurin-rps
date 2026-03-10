export type Hand = string;

export interface Player {
  name: string;
  played: Hand;
}

export interface GameResult {
  type: "GAME_RESULT";
  gameId: string;
  time: number;
  playerA: Player;
  playerB: Player;
}

/**
 * REAKTOR API: Uses a string cursor for navigation
 */
export interface HistoryResponse {
  data: GameResult[];
  cursor: string | null;
}

/**
 * LOCAL API: Uses a composite cursor object for stable pagination
 */
export interface PaginatedHistoryResponse {
  data: GameResult[];
  cursor: { playedAt: number, id: string } | null;
}

const API_BASE = "https://assignments.reaktor.com";
const TOKEN = process.env.REAKTOR_TOKEN;

/**
 * SERVER-SIDE ONLY: Fetches history directly from Reaktor API
 */
export const fetchHistoryFromReaktor = async (cursor?: string): Promise<HistoryResponse> => {
  const url = cursor
    ? `${API_BASE}${cursor}`
    : `${API_BASE}/history`;

  console.log(`📡 Server fetching history from: ${url}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Reaktor API Error: ${res.status}`);
  return res.json();
};

export interface LeaderboardEntry {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
}

/**
 * CLIENT-SIDE ONLY: Fetches history from our local Next.js proxy/cache
 */
export const getHistory = async (params: { 
  player?: string, 
  date?: string, 
  playedAt?: number, 
  id?: string,
  limit?: number 
} = {}): Promise<PaginatedHistoryResponse> => {
  const searchParams = new URLSearchParams();
  if (params.player) searchParams.append('player', params.player);
  if (params.date) searchParams.append('date', params.date);
  if (params.playedAt) searchParams.append('playedAt', params.playedAt.toString());
  if (params.id) searchParams.append('id', params.id);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const res = await fetch(`/api/history?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch history from local API");
  return res.json();
};

export interface PaginatedLeaderboardResponse {
  data: LeaderboardEntry[];
  cursor: { wins: number, name: string } | null;
}

/**
 * CLIENT-SIDE ONLY: Fetches leaderboard with optional date range and pagination
 */
export const getLeaderboard = async (params: {
  startDate?: string,
  endDate?: string,
  wins?: number,
  name?: string,
  limit?: number
} = {}): Promise<PaginatedLeaderboardResponse> => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.wins !== undefined) searchParams.append('wins', params.wins.toString());
  if (params.name) searchParams.append('name', params.name);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const res = await fetch(`/api/leaderboard?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard from local API");
  return res.json();
};

export const calculateWinner = (playerA: Player, playerB: Player): "A" | "B" | "TIE" => {
  const hA = playerA.played.toUpperCase();
  const hB = playerB.played.toUpperCase();

  if (hA === hB) return "TIE";

  const standard = ["ROCK", "PAPER", "SCISSORS"];
  const isAStandard = standard.includes(hA);
  const isBStandard = standard.includes(hB);

  // Two weird hands tie
  if (!isAStandard && !isBStandard) return "TIE";

  // Weird hand loses to standard hand
  if (isAStandard && !isBStandard) return "A";
  if (!isAStandard && isBStandard) return "B";

  // Both are standard: normal RPS rules
  if (
    (hA === "ROCK" && hB === "SCISSORS") ||
    (hA === "PAPER" && hB === "ROCK") ||
    (hA === "SCISSORS" && hB === "PAPER")
  ) {
    return "A";
  }
  return "B";
};

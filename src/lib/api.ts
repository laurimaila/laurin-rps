export type Hand = "ROCK" | "PAPER" | "SCISSORS";

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

export interface HistoryResponse {
  data: GameResult[];
  cursor: string | null;
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
export const getHistory = async (params: { player?: string, date?: string } = {}): Promise<HistoryResponse> => {
  const searchParams = new URLSearchParams();
  if (params.player) searchParams.append('player', params.player);
  if (params.date) searchParams.append('date', params.date);

  const res = await fetch(`/api/history?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch history from local API");
  return res.json();
};

/**
 * CLIENT-SIDE ONLY: Fetches leaderboard with optional date range
 */
export const getLeaderboard = async (startDate?: string, endDate?: string): Promise<{ data: LeaderboardEntry[] }> => {
  const searchParams = new URLSearchParams();
  if (startDate) searchParams.append('startDate', startDate);
  if (endDate) searchParams.append('endDate', endDate);

  const res = await fetch(`/api/leaderboard?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard from local API");
  return res.json();
};
export const calculateWinner = (playerA: Player, playerB: Player): "A" | "B" | "TIE" => {
  if (playerA.played === playerB.played) return "TIE";
  if (
    (playerA.played === "ROCK" && playerB.played === "SCISSORS") ||
    (playerA.played === "PAPER" && playerB.played === "ROCK") ||
    (playerA.played === "SCISSORS" && playerB.played === "PAPER")
  ) {
    return "A";
  }
  return "B";
};

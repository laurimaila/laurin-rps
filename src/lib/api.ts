import {
  HistoryResponse,
  PaginatedHistoryResponse,
  PaginatedLeaderboardResponse,
  Player
} from "./types";

const API_BASE = process.env.API_BASE;
const TOKEN = process.env.REAKTOR_TOKEN;


// Server: Fetch history from Bad API
export const fetchHistoryFromBadApi = async (cursor?: string): Promise<HistoryResponse> => {
  const url = cursor
    ? `${API_BASE}${cursor}`
    : `${API_BASE}/history`;

  console.log(`Server fetching history from: ${url}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Bad API Error: ${res.status}`);
  return res.json();
};


// Client: Fetch history from our local Next.js proxy/cache
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
  if (!res.ok) throw new Error("Failed to fetch history from Next backend");
  return res.json();
};


// Client: Fetch leaderboard with optional date range and pagination
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
  if (!res.ok) throw new Error("Failed to fetch leaderboard from Next backend");
  return res.json();
};


// Client: Fetches all players for filter dropdowns
export const getPlayers = async (): Promise<string[]> => {
  const res = await fetch("/api/players");
  if (!res.ok) throw new Error("Failed to fetch players from Next backend");
  return res.json();
};

export const calculateWinner = (playerA: Player, playerB: Player): "A" | "B" | "TIE" => {
  const hA = playerA.played.toUpperCase();
  const hB = playerB.played.toUpperCase();

  if (hA === hB) return "TIE";

  const standard = ["ROCK", "PAPER", "SCISSORS"];
  const isAStandard = standard.includes(hA);
  const isBStandard = standard.includes(hB);

  // Two funny hands causes tie
  if (!isAStandard && !isBStandard) return "TIE";

  // Funny hand loses to standard
  if (isAStandard && !isBStandard) return "A";
  if (!isAStandard && isBStandard) return "B";

  // Normal RPS rules
  if (
    (hA === "ROCK" && hB === "SCISSORS") ||
    (hA === "PAPER" && hB === "ROCK") ||
    (hA === "SCISSORS" && hB === "PAPER")
  ) {
    return "A";
  }
  return "B";
};

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

export interface LeaderboardEntry {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
}

export interface HistoryCursor {
  playedAt: number;
  id: string;
}

export interface LeaderboardCursor {
  wins: number;
  name: string;
}

export interface PaginatedHistoryResponse {
  data: GameResult[];
  cursor: HistoryCursor | null;
}

export interface PaginatedLeaderboardResponse {
  data: LeaderboardEntry[];
  cursor: LeaderboardCursor | null;
}

export interface HistoryResponse {
  data: GameResult[];
  cursor: string | null;
}

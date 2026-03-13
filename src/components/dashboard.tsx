"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getHistory, getLeaderboard } from "@/lib/api";
import {
  GameResult,
  LeaderboardEntry,
  PaginatedHistoryResponse,
  PaginatedLeaderboardResponse
} from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentMatchesTab } from "@/components/recent-matches/recent-matches-tab";
import { LeaderboardTab } from "@/components/leaderboard/leaderboard-tab";
import { HistoryTab } from "@/components/history/history-tab";

export default function Dashboard() {
  // Could be later split into separate components if this grows too big
  const [liveMatches, setLiveMatches] = useState<GameResult[]>([]);
  const [historyMatches, setHistoryMatches] = useState<GameResult[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingMoreLeaderboard, setLoadingMoreLeaderboard] = useState(false);

  const getToday = () => new Date().toISOString().split('T')[0];

  const [playerFilter, setPlayerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  const [historyCursor, setHistoryCursor] = useState<{ playedAt: number, id: string } | null>(null);
  const [leaderboardCursor, setLeaderboardCursor] = useState<{ wins: number, name: string } | null>(null);

  // Use refs to store cursor values, allows useCallback
  // to be stable when cursors update
  const historyCursorRef = useRef(historyCursor);
  const leaderboardCursorRef = useRef(leaderboardCursor);

  useEffect(() => { historyCursorRef.current = historyCursor; }, [historyCursor]);
  useEffect(() => { leaderboardCursorRef.current = leaderboardCursor; }, [leaderboardCursor]);

  const [liveError, setLiveError] = useState<string | null>(null);

  // Connect to live endpoint
  useEffect(() => {
    let eventSource: EventSource | null = null;
    function connect() {
      eventSource = new EventSource("/api/live");
      eventSource.onmessage = (e) => {
        if (!e.data) return;
        try {
          const result = JSON.parse(e.data);
          if (result && result.gameId) {
            setLiveMatches((prev) => [result, ...prev].slice(0, 50));
          }
        } catch (err) {
          console.error("Problem pasing live data:", err);
        }
      };
      eventSource.onerror = () => {
        setLiveError("Live connection lost");
        eventSource?.close();
      };
    }
    connect();
    return () => eventSource?.close();
  }, []);

  // Load history on initial load or when filters change
  const loadHistory = useCallback(async (isInitial = true) => {
    if (isInitial) setLoadingHistory(true);
    else setLoadingMoreHistory(true);

    try {
      const cursor = isInitial ? undefined : historyCursorRef.current;
      const res: PaginatedHistoryResponse = await getHistory({
        player: playerFilter,
        date: dateFilter,
        limit: 50,
        playedAt: cursor?.playedAt,
        id: cursor?.id
      });

      if (isInitial) setHistoryMatches(res.data);
      else setHistoryMatches(prev => [...prev, ...res.data]);

      setHistoryCursor(res.cursor);
    } finally {
      setLoadingHistory(false);
      setLoadingMoreHistory(false);
    }
  }, [playerFilter, dateFilter]);

  // Load standings on initial load or when filters change
  const loadLeaderboard = useCallback(async (isInitial = true) => {
    // Prevent invalid date ranges
    if (startDate && endDate && startDate > endDate) {
      if (isInitial) {
        setLeaderboardData([]);
        setLoadingLeaderboard(false);
      }
      return;
    }

    if (isInitial) setLoadingLeaderboard(true);
    else setLoadingMoreLeaderboard(true);

    try {
      const cursor = isInitial ? undefined : leaderboardCursorRef.current;
      const res: PaginatedLeaderboardResponse = await getLeaderboard({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 50,
        wins: cursor?.wins,
        name: cursor?.name
      });

      if (isInitial) setLeaderboardData(res.data);
      else setLeaderboardData(prev => [...prev, ...res.data]);

      setLeaderboardCursor(res.cursor);
    } finally {
      setLoadingLeaderboard(false);
      setLoadingMoreLeaderboard(false);
    }
  }, [startDate, endDate]);

  // Reset when filters change
  useEffect(() => { loadHistory(true); }, [playerFilter, dateFilter, loadHistory]);
  useEffect(() => { loadLeaderboard(true); }, [startDate, endDate, loadLeaderboard]);

  // In recent matches, show a deduped list of history + live
  const seenIds = new Set();
  const unifiedMatches = [...liveMatches, ...historyMatches].filter(m => {
    if (seenIds.has(m.gameId)) return false;
    seenIds.add(m.gameId);
    return true;
  }).slice(0, 100);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-4 max-w-5xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-4 gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-slate-50 to-slate-400 font-sans">
            Laurin RPS
          </h1>
          <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[11px] pl-1">
            Real time Rock-Paper-Scissors statistics
          </p>
        </div>
      </header>

      <Tabs defaultValue="live" className="w-full flex flex-col items-center">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-4 mt-2 bg-slate-900 border border-slate-800 h-12 p-1">
          <TabsTrigger value="live" className="data-[state=active]:bg-slate-800 font-bold uppercase text-[12px] tracking-widest">Recent</TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-slate-800 font-bold uppercase text-[12px] tracking-widest">Leaderboard</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-800 font-bold uppercase text-[12px] tracking-widest">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="w-full">
          <RecentMatchesTab
            liveError={liveError}
            loadingHistory={loadingHistory}
            unifiedMatches={unifiedMatches}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="w-full">
          <LeaderboardTab
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            loadingLeaderboard={loadingLeaderboard}
            leaderboardData={leaderboardData}
            loadingMoreLeaderboard={loadingMoreLeaderboard}
            leaderboardCursor={leaderboardCursor}
            loadLeaderboard={loadLeaderboard}
          />
        </TabsContent>

        <TabsContent value="history" className="w-full">
          <HistoryTab
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            playerFilter={playerFilter}
            setPlayerFilter={setPlayerFilter}
            loadingHistory={loadingHistory}
            historyMatches={historyMatches}
            loadingMoreHistory={loadingMoreHistory}
            historyCursor={historyCursor}
            loadHistory={loadHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

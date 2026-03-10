"use client";

import { useEffect, useState, useCallback } from "react";
import { GameResult, getHistory, getLeaderboard, LeaderboardEntry, PaginatedHistoryResponse } from "@/lib/api";
import { MatchTable } from "@/components/match-table";
import { Leaderboard } from "@/components/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Calendar, ChevronDown } from "lucide-react";

export default function Dashboard() {
  const [liveMatches, setLiveMatches] = useState<GameResult[]>([]);
  const [historyMatches, setHistoryMatches] = useState<GameResult[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const [playerFilter, setPlayerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [nextCursor, setNextCursor] = useState<{ playedAt: number, id: string } | null>(null);

  const [liveError, setLiveError] = useState<string | null>(null);

  // 1. Live Stream Connection
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
          console.error("Malformed live data received:", err);
        }
      };
      eventSource.onerror = () => {
        setLiveError("Live stream paused (Reconnecting...)");
        eventSource?.close();
      };
    }
    connect();
    return () => eventSource?.close();
  }, []);

  // 2. Load History (Initial)
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res: PaginatedHistoryResponse = await getHistory({ player: playerFilter, date: dateFilter, limit: 50 });
      setHistoryMatches(res.data);
      setNextCursor(res.cursor);
    } finally {
      setLoadingHistory(false);
    }
  }, [playerFilter, dateFilter]);

  // 3. Load More History
  const loadMoreHistory = async () => {
    if (!nextCursor || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const res: PaginatedHistoryResponse = await getHistory({ 
        player: playerFilter, 
        date: dateFilter, 
        playedAt: nextCursor.playedAt, 
        id: nextCursor.id,
        limit: 50 
      });
      setHistoryMatches(prev => [...prev, ...res.data]);
      setNextCursor(res.cursor);
    } finally {
      setLoadingMore(false);
    }
  };

  // 4. Load Leaderboard
  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await getLeaderboard(startDate, endDate);
      setLeaderboardData(res.data);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const unifiedMatches = [...liveMatches, ...historyMatches].slice(0, 100);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-5xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-50">
            Laurin RPS
          </h1>
          <p className="text-muted-foreground font-medium">Tracking the throws</p>
        </div>
      </header>

      <Tabs defaultValue="live" className="w-full flex flex-col items-center">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="live" className="py-2.5">Recent Matches</TabsTrigger>
          <TabsTrigger value="leaderboard" className="py-2.5">Standings</TabsTrigger>
          <TabsTrigger value="history" className="py-2.5">Match History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="w-full">
          <Card className="border-t-4 border-t-red-600 shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
                <div className={`w-2.5 h-2.5 rounded-full ${liveError ? 'bg-slate-300' : 'bg-red-500 animate-pulse'}`} />
                Recent Matches
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-800">
              <div className="max-h-[700px] overflow-auto">
                {loadingHistory ? (
                  <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>
                ) : (
                  <MatchTable matches={unifiedMatches} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="w-full">
          <Card className="shadow-lg border-slate-800">
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-slate-100 text-xl font-bold">Player Standings</CardTitle>
              <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 px-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <Input
                    type="date"
                    className="h-8 border-none bg-transparent text-xs p-0 focus-visible:ring-0"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                  <span className="text-slate-700 font-bold">→</span>
                  <Input
                    type="date"
                    className="h-8 border-none bg-transparent text-xs p-0 focus-visible:ring-0"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-800">
              <div className="max-h-[600px] overflow-auto">
                {loadingLeaderboard ? (
                  <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>
                ) : (
                  <Leaderboard data={leaderboardData} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="w-full">
          <Card className="shadow-lg border-slate-800">
            <CardHeader className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <CardTitle className="text-slate-100 text-xl font-bold">Historical Archive</CardTitle>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-900/50 border-slate-800 text-slate-100"
                />
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search player name..."
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    className="pl-8 bg-slate-900/50 border-slate-800 text-slate-100"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-800">
              <div className="max-h-[700px] overflow-auto flex flex-col">
                <MatchTable matches={historyMatches} highlightPlayer={playerFilter} />
                
                {nextCursor && (
                  <div className="p-4 border-t border-slate-800 flex justify-center bg-slate-900/20">
                    <Button 
                      variant="ghost" 
                      onClick={loadMoreHistory} 
                      disabled={loadingMore}
                      className="w-full md:w-auto gap-2 text-slate-400 hover:text-slate-100"
                    >
                      {loadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      Load More Matches
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

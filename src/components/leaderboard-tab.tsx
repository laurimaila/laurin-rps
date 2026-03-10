"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaderboard } from "@/components/leaderboard";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar } from "lucide-react";
import { LeaderboardEntry } from "@/lib/api";

interface LeaderboardTabProps {
  startDate: string;
  endDate: string;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  loadingLeaderboard: boolean;
  leaderboardData: LeaderboardEntry[];
  loadingMoreLeaderboard: boolean;
  leaderboardCursor: any;
  loadLeaderboard: (isInitial?: boolean) => void;
}

export function LeaderboardTab({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  loadingLeaderboard,
  leaderboardData,
  loadingMoreLeaderboard,
  leaderboardCursor,
  loadLeaderboard
}: LeaderboardTabProps) {
  return (
    <Card className="border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-800 bg-slate-900/20 h-16 flex items-center py-0">
        <div className="flex flex-row justify-between items-center w-full gap-4">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-100 uppercase tracking-widest whitespace-nowrap">
            Standings
          </CardTitle>
          <div className="flex gap-4 bg-slate-900 p-1 rounded border border-slate-800">
            <div className="flex items-center gap-3 px-3">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <Input
                type="date"
                className="h-7 border-none bg-transparent text-[10px] p-0 focus-visible:ring-0 w-28 text-slate-300"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="text-slate-700 text-[10px] font-bold">TO</span>
              <Input
                type="date"
                className="h-7 border-none bg-transparent text-[10px] p-0 focus-visible:ring-0 w-28 text-slate-300 mr-2"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="text-[9px] font-black text-slate-500 hover:text-red-400 px-2 border-l border-slate-800 transition-colors uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[700px] overflow-auto">
          {loadingLeaderboard ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-700" /></div>
          ) : (
            <>
              <Leaderboard data={leaderboardData} startDate={startDate} endDate={endDate} />
              <InfiniteScroll
                isLoading={loadingMoreLeaderboard}
                hasMore={!!leaderboardCursor}
                onLoadMore={() => loadLeaderboard(false)}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

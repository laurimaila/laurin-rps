"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaderboard } from "@/components/leaderboard";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar } from "lucide-react";
import { LeaderboardEntry, LeaderboardCursor } from "@/lib/types";

interface LeaderboardTabProps {
  startDate: string;
  endDate: string;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  loadingLeaderboard: boolean;
  leaderboardData: LeaderboardEntry[];
  loadingMoreLeaderboard: boolean;
  leaderboardCursor: LeaderboardCursor | null;
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
      <CardHeader className="border-b border-slate-800 bg-slate-900/20 md:h-16 flex items-center py-2 md:py-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
          <CardTitle className="text-[10px] md:text-sm font-black flex items-center gap-2 text-slate-100 uppercase tracking-widest whitespace-nowrap px-1">
            Leaderboard
          </CardTitle>
          <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-4 bg-slate-900 p-1.5 rounded-lg border border-slate-800 w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-3 px-3 flex-1 md:flex-none justify-between md:justify-start">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex items-center gap-2 flex-1 md:flex-none">
                <Input
                  type="date"
                  className="h-8 border-none bg-transparent text-[12px] px-2 focus-visible:ring-0 w-[100px] md:w-32 text-slate-300 cursor-pointer [color-scheme:dark]"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                />
                <span className="text-slate-700 text-[10px] font-bold px-1">TO</span>
                <Input
                  type="date"
                  className="h-8 border-none bg-transparent text-[12px] px-2 focus-visible:ring-0 w-[100px] md:w-32 text-slate-300 cursor-pointer [color-scheme:dark]"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="text-[10px] font-black text-slate-500 hover:text-red-400 px-3 border-l border-slate-800 transition-colors uppercase ml-auto"
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

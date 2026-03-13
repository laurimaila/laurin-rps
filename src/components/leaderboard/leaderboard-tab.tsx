"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaderboard } from "./leaderboard";
import { InfiniteScroll } from "@/components/infinite-scroll/infinite-scroll";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar } from "lucide-react";
import { LeaderboardEntry, LeaderboardCursor } from "@/lib/types";
import { FilterBar } from "@/components/filter-bar/filter-bar";

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
          <FilterBar
            onClear={() => { setStartDate(""); setEndDate(""); }}
            canClear={!!(startDate || endDate)}
          >
            <div className="flex items-center gap-2 md:gap-3 px-3 flex-1 md:flex-none justify-between md:justify-start">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex items-center gap-2 flex-1 md:flex-none">
                <Input
                  type="date"
                  className="h-8 border-none bg-transparent text-[12px] px-2 focus-visible:ring-0 w-25 md:w-32 text-slate-300 cursor-pointer scheme-dark"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                />
                <span className="text-slate-700 text-[10px] font-bold px-1">TO</span>
                <Input
                  type="date"
                  className="h-8 border-none bg-transparent text-[12px] px-2 focus-visible:ring-0 w-25 md:w-32 text-slate-300 cursor-pointer scheme-dark"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                />
              </div>
            </div>
          </FilterBar>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-175 overflow-auto">
          {loadingLeaderboard ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-700" /></div>
          ) : (
            <>
              <Leaderboard data={leaderboardData} startDate={startDate} endDate={endDate} />
              <InfiniteScroll
                isLoading={loadingMoreLeaderboard}
                hasMore={!!leaderboardCursor}
                isEmpty={leaderboardData.length === 0}
                emptyMessage="No standings found"
                onLoadMore={() => loadLeaderboard(false)}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

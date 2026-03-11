"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchTable } from "@/components/match-table";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Search } from "lucide-react";
import { GameResult, Cursor } from "@/lib/types";

interface HistoryTabProps {
  dateFilter: string;
  setDateFilter: (val: string) => void;
  playerFilter: string;
  setPlayerFilter: (val: string) => void;
  loadingHistory: boolean;
  historyMatches: GameResult[];
  loadingMoreHistory: boolean;
  historyCursor: Cursor | null;
  loadHistory: (isInitial?: boolean) => void;
}

export function HistoryTab({
  dateFilter,
  setDateFilter,
  playerFilter,
  setPlayerFilter,
  loadingHistory,
  historyMatches,
  loadingMoreHistory,
  historyCursor,
  loadHistory
}: HistoryTabProps) {
  return (
    <Card className="border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-800 bg-slate-900/20 md:h-16 flex items-center py-2 md:py-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
          <CardTitle className="text-[10px] md:text-sm font-black flex items-center gap-2 text-slate-100 uppercase tracking-widest whitespace-nowrap px-1">
            Match History
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 bg-slate-900 p-1.5 rounded-lg border border-slate-800 w-full md:w-auto">
            <div className="flex items-center gap-3 px-3 flex-1 md:flex-none">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                className="h-8 border-none bg-transparent text-[12px] px-2 focus-visible:ring-0 w-full sm:w-32 text-slate-300 cursor-pointer [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center md:w-55 relative border-t sm:border-t-0 sm:border-l border-slate-800 px-4 flex-1 md:flex-none py-1.5 sm:py-0">
              <Search className="h-4 w-4 text-slate-500 mr-3 shrink-0" />
              <Input
                placeholder="Search by player name"
                value={playerFilter}
                onChange={(e) => setPlayerFilter(e.target.value)}
                className="h-8 border-none bg-transparent text-[12px] pl-2 pr-0 py-0 focus-visible:ring-0 w-full sm:w-48 md:w-64 text-slate-300 placeholder:text-slate-700 font-bold tracking-tight"
              />
            </div>
            {(dateFilter || playerFilter) && (
              <button
                onClick={() => { setDateFilter(""); setPlayerFilter(""); }}
                className="text-[10px] font-black text-slate-500 hover:text-red-400 px-4 border-t sm:border-t-0 sm:border-l border-slate-800 transition-colors uppercase py-1.5 sm:py-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-175 overflow-auto">
          {loadingHistory ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-700" /></div>
          ) : (
            <>
              <MatchTable matches={historyMatches} highlightPlayer={playerFilter} />
              <InfiniteScroll
                isLoading={loadingMoreHistory}
                hasMore={!!historyCursor}
                onLoadMore={() => loadHistory(false)}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

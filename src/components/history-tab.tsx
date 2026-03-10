"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchTable } from "@/components/match-table";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Search } from "lucide-react";
import { GameResult } from "@/lib/api";

interface HistoryTabProps {
  dateFilter: string;
  setDateFilter: (val: string) => void;
  playerFilter: string;
  setPlayerFilter: (val: string) => void;
  loadingHistory: boolean;
  historyMatches: GameResult[];
  loadingMoreHistory: boolean;
  historyCursor: any;
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
      <CardHeader className="border-b border-slate-800 bg-slate-900/20 h-16 flex items-center py-0">
        <div className="flex flex-row justify-between items-center w-full gap-4">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-100 uppercase tracking-widest whitespace-nowrap">
            Archive
          </CardTitle>
          <div className="flex gap-4 bg-slate-900 p-1 rounded border border-slate-800">
            <div className="flex items-center gap-3 px-3">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-7 border-none bg-transparent text-[10px] p-0 focus-visible:ring-0 w-28 text-slate-300 mr-2"
              />
            </div>
            <div className="flex items-center relative border-l border-slate-800 px-4">
              <Search className="h-3.5 w-3.5 text-slate-500 mr-2" />
              <Input
                placeholder="PLAYER NAME..."
                value={playerFilter}
                onChange={(e) => setPlayerFilter(e.target.value)}
                className="h-7 border-none bg-transparent text-[10px] p-0 pl-1 focus-visible:ring-0 w-40 md:w-56 text-slate-300 placeholder:text-slate-700 font-bold"
              />
            </div>
            {(dateFilter || playerFilter) && (
              <button
                onClick={() => { setDateFilter(""); setPlayerFilter(""); }}
                className="text-[9px] font-black text-slate-500 hover:text-red-400 px-3 border-l border-slate-800 transition-colors uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[700px] overflow-auto">
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

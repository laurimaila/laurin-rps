"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchTable } from "@/components/match-table";
import { InfiniteScroll } from "@/components/infinite-scroll/infinite-scroll";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar } from "lucide-react";
import { GameResult, HistoryCursor } from "@/lib/types";
import { FilterBar } from "@/components/filter-bar/filter-bar";
import { PlayerSearch } from "@/components/filter-bar/player-search";

interface HistoryTabProps {
  dateFilter: string;
  setDateFilter: (val: string) => void;
  playerFilter: string;
  setPlayerFilter: (val: string) => void;
  loadingHistory: boolean;
  historyMatches: GameResult[];
  loadingMoreHistory: boolean;
  historyCursor: HistoryCursor | null;
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
          <FilterBar
            onClear={() => { setDateFilter(""); setPlayerFilter(""); }}
            canClear={!!(dateFilter || playerFilter)}
          >
            <div className="flex items-center gap-3 px-3 flex-1 md:flex-none">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                className="h-8 border-none bg-transparent text-[12px] px-2 focus-visible:ring-0 w-full sm:w-32 text-slate-300 cursor-pointer scheme-dark"
              />
            </div>
            <PlayerSearch
              playerFilter={playerFilter}
              setPlayerFilter={setPlayerFilter}
            />
          </FilterBar>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-175 overflow-auto">
          {loadingHistory ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-700" /></div>
          ) : (
            <>
              <MatchTable
                matches={historyMatches}
                highlightPlayer={playerFilter}
                emptyMessage={null}
              />
              <InfiniteScroll
                isLoading={loadingMoreHistory}
                hasMore={!!historyCursor}
                isEmpty={historyMatches.length === 0}
                onLoadMore={() => loadHistory(false)}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

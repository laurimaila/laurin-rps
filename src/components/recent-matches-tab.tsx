"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchTable } from "@/components/match-table";
import { Loader2 } from "lucide-react";
import { GameResult } from "@/lib/api";

interface RecentMatchesTabProps {
  liveError: string | null;
  loadingHistory: boolean;
  unifiedMatches: GameResult[];
}

export function RecentMatchesTab({ liveError, loadingHistory, unifiedMatches }: RecentMatchesTabProps) {
  return (
    <Card className="border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-800 bg-slate-900/20 h-16 flex items-center py-0">
        <div className="flex flex-row justify-between items-center w-full gap-4">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-100 uppercase tracking-widest whitespace-nowrap">
            <div className={`w-2.5 h-2.5 rounded-full ${liveError ? 'bg-slate-300' : 'bg-red-500 animate-pulse'}`} />
            Recent Matches
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[700px] overflow-auto">
          {loadingHistory ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-700" /></div>
          ) : (
            <MatchTable matches={unifiedMatches} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

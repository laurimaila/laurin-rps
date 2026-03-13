import { LeaderboardEntry } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Leaderboard({ data, startDate, endDate }: { data: LeaderboardEntry[], startDate?: string, endDate?: string }) {
  // Check for invalid date range and show error if end < start
  const isInvalidRange = startDate && endDate && startDate > endDate;

  if (isInvalidRange) return <div className="p-12 text-center text-red-400 font-medium uppercase tracking-tighter">Invalid date range: End date must be after start date.</div>;
  if (data.length === 0) return null;

  return (
    <div className="rounded-md overflow-hidden px-2 md:px-6 py-2">
      <Table className="md:max-w-4xl mx-auto">
        <TableHeader className="bg-slate-900/40 border-b border-slate-800">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-slate-500 font-bold uppercase text-[10px] px-2 w-12">Rank</TableHead>
            <TableHead className="text-slate-400 font-bold uppercase text-[10px] px-2">Player</TableHead>
            <TableHead className="text-emerald-500 font-bold uppercase text-[10px] px-2 w-16 md:w-24 text-center">Wins</TableHead>
            <TableHead className="text-red-500 font-bold uppercase text-[10px] px-2 w-16 md:w-24 text-center hidden md:table-cell">Losses</TableHead>
            <TableHead className="text-slate-500 font-bold uppercase text-[10px] px-2 w-16 md:w-24 text-center hidden md:table-cell">Ties</TableHead>
            <TableHead className="text-slate-400 font-bold uppercase text-[10px] px-2 w-16 md:w-24 text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p, idx) => (
            <TableRow key={p.name} className="border-slate-800 hover:bg-slate-800/30">
              <TableCell className="font-mono text-slate-500 text-xs px-2">#{idx + 1}</TableCell>
              <TableCell className="font-bold text-slate-200 text-xs px-2 truncate max-w-25 md:max-w-none">{p.name}</TableCell>
              <TableCell className="text-emerald-400 font-black text-xs px-2 text-center">{p.wins}</TableCell>
              <TableCell className="text-red-400/80 text-xs px-2 text-center hidden md:table-cell">{p.losses}</TableCell>
              <TableCell className="text-slate-600 text-xs px-2 text-center hidden md:table-cell">{p.ties}</TableCell>
              <TableCell className="text-slate-400 text-xs px-2 text-center">{p.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

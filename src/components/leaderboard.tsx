import { LeaderboardEntry } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Leaderboard({ data, startDate, endDate }: { data: LeaderboardEntry[], startDate?: string, endDate?: string }) {
  const isInvalidRange = startDate && endDate && startDate > endDate;

  if (isInvalidRange) return <div className="p-12 text-center text-red-400 font-medium uppercase tracking-tighter">Invalid date range: End date must be after start date.</div>;
  if (data.length === 0) return <div className="p-12 text-center text-slate-500 font-medium italic">No standings found for selected period</div>;

  return (
    <div className="rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-900/40 border-b border-slate-800">
          <TableRow className="border-none">
            <TableHead className="text-slate-500 font-bold uppercase text-[10px]">Rank</TableHead>
            <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Player</TableHead>
            <TableHead className="text-emerald-500 font-bold uppercase text-[10px]">Wins</TableHead>
            <TableHead className="text-red-500 font-bold uppercase text-[10px]">Losses</TableHead>
            <TableHead className="text-slate-500 font-bold uppercase text-[10px]">Ties</TableHead>
            <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p, idx) => (
            <TableRow key={p.name} className="border-slate-800 hover:bg-slate-800/30">
              <TableCell className="font-mono text-slate-500">#{idx + 1}</TableCell>
              <TableCell className="font-bold text-slate-200">{p.name}</TableCell>
              <TableCell className="text-emerald-400 font-black">{p.wins}</TableCell>
              <TableCell className="text-red-400/80">{p.losses}</TableCell>
              <TableCell className="text-slate-600">{p.ties}</TableCell>
              <TableCell className="text-slate-400">{p.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

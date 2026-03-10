import { Player, calculateWinner } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";

interface Match {
  gameId: string;
  time: number;
  playerA: Player;
  playerB: Player;
}

const HandIcon = ({ hand }: { hand: string }) => {
  const h = hand.toUpperCase();
  switch (h) {
    case "ROCK": return <span className="text-xl drop-shadow-sm">🪨</span>;
    case "PAPER": return <span className="text-xl drop-shadow-sm">📄</span>;
    case "SCISSORS": return <span className="text-xl drop-shadow-sm">✂️</span>;
    case "LIZARD": return <span className="text-xl drop-shadow-sm">🦎</span>;
    case "SPOCK": return <span className="text-xl drop-shadow-sm">🖖</span>;
    default: return <span className="text-xl drop-shadow-sm text-slate-700">❓</span>;
  }
};

export function MatchTable({ matches, highlightPlayer }: { matches: Match[], highlightPlayer?: string }) {
  if (matches.length === 0) return <div className="p-12 text-center text-slate-500 font-medium italic">Scanning for new matches...</div>;

  return (
    <div className="w-full">
      <Table className="table-fixed w-full">
        <TableHeader className="bg-slate-900/40">
          <TableRow className="border-slate-800">
            <TableHead className="w-24 text-slate-500 text-[10px] uppercase font-bold">
              Time <span className="text-[8px] opacity-50 font-mono">UTC</span>
            </TableHead>
            <TableHead className="text-slate-400 font-bold overflow-hidden text-ellipsis whitespace-nowrap">{highlightPlayer ? "Target Player" : "Player A"}</TableHead>
            <TableHead className="text-center w-12"></TableHead>
            <TableHead className="text-center w-10 font-black text-slate-700">VS</TableHead>
            <TableHead className="text-center w-12"></TableHead>
            <TableHead className="text-right text-slate-400 font-bold overflow-hidden text-ellipsis whitespace-nowrap">{highlightPlayer ? "Opponent" : "Player B"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const shouldSwap = highlightPlayer &&
              match.playerB.name.toLowerCase() === highlightPlayer.toLowerCase();

            const pA = shouldSwap ? match.playerB : match.playerA;
            const pB = shouldSwap ? match.playerA : match.playerB;
            const winner = calculateWinner(pA, pB);

            const date = new Date(match.time);

            return (
              <TableRow key={match.gameId} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                <TableCell className="text-[10px] font-mono text-slate-600 leading-tight py-2">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                      {formatInTimeZone(date, 'UTC', 'MMM dd')}
                    </span>
                    <span className="text-slate-500 whitespace-nowrap">
                      {formatInTimeZone(date, 'UTC', 'HH:mm:ss')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-bold">
                  <div className="flex items-center gap-2">
                    <span className={winner === "A" ? "text-emerald-400" : "text-slate-300"}>{pA.name}</span>
                    {winner === "A" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] h-4 uppercase">Win</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <HandIcon hand={pA.played} />
                </TableCell>
                <TableCell className="text-center text-[10px] font-black text-slate-800">::</TableCell>
                <TableCell className="text-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <HandIcon hand={pB.played} />
                </TableCell>
                <TableCell className="text-right font-bold">
                  <div className="flex items-center justify-end gap-2">
                    {winner === "B" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] h-4 uppercase">Win</Badge>}
                    <span className={winner === "B" ? "text-emerald-400" : "text-slate-300"}>{pB.name}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

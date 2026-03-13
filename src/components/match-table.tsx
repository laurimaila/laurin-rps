import { Player } from "@/lib/types";
import { calculateWinner } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";

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
    case "DOG": return <span className="text-xl drop-shadow-sm">🐕</span>;
    default: return <span className="text-xl drop-shadow-sm text-slate-700">❓</span>;
  }
};

export function MatchTable({ 
  matches, 
  highlightPlayer, 
  emptyMessage = "Searching new matches..." 
}: { 
  matches: Match[], 
  highlightPlayer?: string,
  emptyMessage?: string | null
}) {
  if (matches.length === 0) {
    if (emptyMessage === null) return null;
    return <div className="p-12 text-center text-slate-500 font-medium italic">{emptyMessage}</div>;
  }

  return (
    <div className="w-full">
      <Table className="table-fixed w-full">
        <TableHeader className="bg-slate-900/40">
          <TableRow className="border-slate-800">
            <TableHead className="w-16 md:w-24 text-slate-500 text-[10px] uppercase font-bold px-2">
              Time <span className="text-[8px] opacity-50 font-mono">UTC</span>
            </TableHead>
            <TableHead className="text-slate-400 font-bold text-ellipsis whitespace-nowrap px-2">{highlightPlayer ? "Target Player" : "Player A"}</TableHead>
            <TableHead className="text-center w-12 hidden md:table-cell"></TableHead>
            <TableHead className="text-center w-10 font-black text-slate-700 px-1">VS</TableHead>
            <TableHead className="text-center w-12 hidden md:table-cell"></TableHead>
            <TableHead className="text-right text-slate-400 font-bold text-ellipsis whitespace-nowrap px-2">{highlightPlayer ? "Opponent" : "Player B"}</TableHead>
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
                <TableCell className="text-[10px] font-mono text-slate-600 leading-tight py-2 px-2">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter mb-0.5">
                      {formatInTimeZone(date, 'UTC', 'MMM dd')}
                    </span>
                    <span className="text-slate-500 whitespace-nowrap">
                      {formatInTimeZone(date, 'UTC', 'HH:mm:ss')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="md:font-bold px-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <span className={cn("text-xs md:text-sm truncate font-medium text-slate-300")}>{pA.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="md:hidden scale-75 origin-left">
                        <HandIcon hand={pA.played} />
                      </div>
                      {winner === "A" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] md:text-[9px] h-3.5 md:h-4 uppercase px-1 md:px-2">Win</Badge>}
                      {winner === "TIE" && <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[8px] md:text-[9px] h-3.5 md:h-4 uppercase px-1 md:px-2">Tie</Badge>}
                      {winner === "B" && <Badge className="bg-red-500/5 text-red-400/80 border-red-500/10 text-[8px] md:text-[9px] h-3.5 md:h-4 uppercase px-1 md:px-2">Loss</Badge>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center opacity-80 group-hover:opacity-100 transition-opacity hidden md:table-cell">
                  <HandIcon hand={pA.played} />
                </TableCell>
                <TableCell className="text-center text-[9px] font-black text-slate-800 px-1 select-none">VS</TableCell>
                <TableCell className="text-center opacity-80 group-hover:opacity-100 transition-opacity hidden md:table-cell">
                  <HandIcon hand={pB.played} />
                </TableCell>
                <TableCell className="text-right md:font-bold px-2">
                  <div className="flex flex-col items-end md:flex-row md:items-center md:justify-end gap-1 md:gap-2">
                    <span className={cn("text-xs md:text-sm truncate font-medium text-slate-300 order-1 md:order-2")}>{pB.name}</span>
                    <div className="flex items-center gap-1.5 order-2 md:order-1">
                      {winner === "B" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] md:text-[9px] h-3.5 md:h-4 uppercase px-1 md:px-2">Win</Badge>}
                      {winner === "TIE" && <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[8px] md:text-[9px] h-3.5 md:h-4 uppercase px-1 md:px-2">Tie</Badge>}
                      {winner === "A" && <Badge className="bg-red-500/5 text-red-400/80 border-red-500/10 text-[8px] md:text-[9px] h-3.5 md:h-4 uppercase px-1 md:px-2">Loss</Badge>}
                      <div className="md:hidden scale-75 origin-right">
                        <HandIcon hand={pB.played} />
                      </div>
                    </div>
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

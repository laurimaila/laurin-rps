"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getPlayers } from "@/lib/api";

interface PlayerSearchProps {
  playerFilter: string;
  setPlayerFilter: (val: string) => void;
  className?: string;
}

// Suggest player names as user types in the input field
export function PlayerSearch({
  playerFilter,
  setPlayerFilter,
  className = ""
}: PlayerSearchProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(playerFilter);

  useEffect(() => {
    getPlayers().then(setPlayers).catch(console.error);
  }, []);

  useEffect(() => {
    setInputValue(playerFilter);
  }, [playerFilter]);

  const lowerInput = inputValue.toLowerCase();
  const filteredPlayers = lowerInput
  ? players.filter(p => {
      const lowerPlayer = p.toLowerCase();
      return lowerPlayer.includes(lowerInput) && lowerPlayer !== lowerInput;
    })
  : [];

  // Only show when there are 10 or less matches
  const showSuggestions = filteredPlayers.length > 0 && filteredPlayers.length <= 10;

  return (
    <div className={`flex items-center md:w-50 relative border-t sm:border-t-0 sm:border-l border-slate-800 px-4 gap-3 flex-1 md:flex-none py-1.5 sm:py-0 ${className}`}>
      <Search className="h-4 w-4 text-slate-500 shrink-0 pointer-events-none" />
      <Input
        placeholder="Search by name"
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          setInputValue(val);
          if (players.includes(val)) {
            setPlayerFilter(val);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setPlayerFilter(inputValue);
          }
        }}
        list="player-names"
        className="h-8 border-none bg-transparent text-[12px] pl-2 pr-4 py-0 focus-visible:ring-0 text-slate-300 placeholder:text-slate-700 font-bold tracking-tight"
      />
      <datalist id="player-names">
        {showSuggestions && filteredPlayers.map(p => <option key={p} value={p} />)}
      </datalist>
    </div>
  );
  }

"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getPlayers } from "@/lib/api";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface PlayerSearchProps {
  playerFilter: string;
  setPlayerFilter: (val: string) => void;
  className?: string;
}

const MAX_SUGGESTIONS = 10;

// Suggest player names as user types in the input field
export function PlayerSearch({ playerFilter, setPlayerFilter, className = "" }: PlayerSearchProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [debouncedInput, setDebouncedInput] = useState(inputValue);

  useEffect(() => {
    getPlayers().then(setPlayers).catch(console.error);
  }, []);

  useEffect(() => {
    setInputValue(playerFilter);
  }, [playerFilter]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedInput(inputValue), 200);
    return () => clearTimeout(id);
  }, [inputValue]);

  const filteredPlayers = debouncedInput
    ? players
        .filter((p) => p.toLowerCase().includes(debouncedInput.toLowerCase()))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  return (
    <div className={cn("flex items-center md:w-48 border-t sm:border-t-0 border-slate-800 flex-1 md:flex-none", className)}>
      <Combobox
        items={filteredPlayers}
        value={playerFilter}
        onValueChange={(val) => {
          if (typeof val === 'string') {
            setPlayerFilter(val);
          }
        }}
        onInputValueChange={setInputValue}
        inputValue={inputValue}
      >
        <ComboboxInput
          placeholder="Search player..."
          showTrigger={false}
          className="border-none bg-transparent h-8 shadow-none w-full ring-0 focus-within:ring-0"
        >
          <InputGroupAddon align="inline-start" className="pl-4">
            <Search className="h-4 w-4 text-slate-500" />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent className="bg-slate-900 border-slate-800">
          <ComboboxList className="custom-scrollbar">
            {(player) => (
              <ComboboxItem
                key={player}
                value={player}
                className="text-slate-300 data-highlighted:bg-slate-800 data-highlighted:text-white py-2.5 px-3"
              >
                {player}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

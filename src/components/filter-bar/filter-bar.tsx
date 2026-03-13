"use client";

import { ReactNode } from "react";

interface FilterBarProps {
  onClear: () => void;
  canClear: boolean;
  children: ReactNode;
}

// Handles filtering in leaderboard and history
export function FilterBar({ onClear, canClear, children }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 md:gap-4 bg-slate-900 p-1.5 rounded-lg border border-slate-800 w-full md:w-auto">
      {children}
      <button
        onClick={onClear}
        disabled={!canClear}
        className="text-[10px] font-black text-slate-500 hover:text-red-400 disabled:opacity-20 disabled:hover:text-slate-500 disabled:cursor-not-allowed px-4 border-t sm:border-t-0 sm:border-l border-slate-800 transition-colors uppercase py-1.5 sm:py-0"
      >
        Clear
      </button>
    </div>
  );
}

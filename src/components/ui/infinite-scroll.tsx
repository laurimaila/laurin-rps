"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading }: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div ref={observerTarget} className="h-20 flex items-center justify-center border-t border-slate-800 bg-slate-900/10">
      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
      {!hasMore && !isLoading && (
        <span className="text-xs text-slate-600 font-medium uppercase tracking-widest">
          End of results
        </span>
      )}
    </div>
  );
}

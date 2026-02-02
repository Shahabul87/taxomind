'use client';

/**
 * Mode Search Input
 *
 * Compact search input for filtering modes within the mode dropdown.
 */

import { Search, X } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface ModeSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
}

export function ModeSearch({ query, onQueryChange }: ModeSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when mounted
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative px-1.5 pb-1.5">
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md"
        style={{
          background: 'var(--sam-surface)',
          border: '1px solid var(--sam-border)',
        }}
      >
        <Search
          className="h-3 w-3 shrink-0"
          style={{ color: 'var(--sam-text-muted)' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search modes..."
          className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[var(--sam-text-muted)]"
          style={{ color: 'var(--sam-text)' }}
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="shrink-0"
            style={{ color: 'var(--sam-text-muted)' }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

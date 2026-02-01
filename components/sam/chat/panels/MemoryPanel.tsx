"use client";

import React, { useState } from 'react';
import { Search, History, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MemorySearchPanel,
  ConversationHistory,
  MemoryInsightsWidget,
} from '@/components/sam/memory';

type MemoryView = 'insights' | 'search' | 'history';

interface MemoryPanelProps {
  className?: string;
}

export function MemoryPanel({ className }: MemoryPanelProps) {
  const [activeView, setActiveView] = useState<MemoryView>('insights');

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-2 pt-2 pb-1"
        style={{ borderBottom: '1px solid var(--sam-border)' }}
      >
        <MemoryTabButton
          active={activeView === 'insights'}
          onClick={() => setActiveView('insights')}
          icon={<Brain className="h-3 w-3" />}
          label="Insights"
        />
        <MemoryTabButton
          active={activeView === 'search'}
          onClick={() => setActiveView('search')}
          icon={<Search className="h-3 w-3" />}
          label="Search"
        />
        <MemoryTabButton
          active={activeView === 'history'}
          onClick={() => setActiveView('history')}
          icon={<History className="h-3 w-3" />}
          label="History"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 max-h-[250px] sam-scrollbar">
        {activeView === 'insights' && <MemoryInsightsWidget compact />}
        {activeView === 'search' && <MemorySearchPanel compact />}
        {activeView === 'history' && <ConversationHistory compact limit={10} />}
      </div>
    </div>
  );
}

function MemoryTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition-all duration-150',
        active
          ? 'bg-[var(--sam-accent)] text-white font-medium'
          : 'text-[var(--sam-text-secondary)] hover:bg-[var(--sam-surface-hover)]'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

"use client";

import React, { useState } from 'react';
import { BarChart3, Wrench, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressPanel } from './panels/ProgressPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import { MemoryPanel } from './panels/MemoryPanel';
import type { InfoDrawerTab, XPProgress, ToolSummary } from './types';
import type { UserProgress } from '@/lib/sam/gamification';

interface InfoDrawerProps {
  isOpen: boolean;
  // Progress
  userProgress: UserProgress | null;
  xpProgress: XPProgress | null;
  enableGamification?: boolean;
  confidenceScore?: number;
  // Tools
  tools: ToolSummary[];
  isLoadingTools: boolean;
  toolsError: string | null;
  onSelectTool: (tool: ToolSummary) => void;
  onRefreshTools: () => void;
  selectedToolId?: string | null;
  className?: string;
}

const TABS: Array<{ id: InfoDrawerTab; label: string; icon: React.ReactNode }> = [
  { id: 'progress', label: 'Progress', icon: <BarChart3 className="h-3 w-3" /> },
  { id: 'tools', label: 'Tools', icon: <Wrench className="h-3 w-3" /> },
  { id: 'memory', label: 'Memory', icon: <Brain className="h-3 w-3" /> },
];

export function InfoDrawer({
  isOpen,
  userProgress,
  xpProgress,
  enableGamification = true,
  confidenceScore,
  tools,
  isLoadingTools,
  toolsError,
  onSelectTool,
  onRefreshTools,
  selectedToolId,
  className,
}: InfoDrawerProps) {
  const [activeTab, setActiveTab] = useState<InfoDrawerTab>('progress');

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'shrink-0 sam-slide-down overflow-hidden',
        className
      )}
      style={{ borderBottom: '1px solid var(--sam-border)' }}
    >
      {/* Tabs */}
      <div
        className="flex items-center gap-0.5 px-2 pt-2"
        style={{ borderBottom: '1px solid var(--sam-border)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[11px] rounded-t-lg transition-all duration-150',
              activeTab === tab.id
                ? 'font-medium border-b-2'
                : 'opacity-60 hover:opacity-100'
            )}
            style={{
              color:
                activeTab === tab.id
                  ? 'var(--sam-accent)'
                  : 'var(--sam-text-secondary)',
              borderColor:
                activeTab === tab.id ? 'var(--sam-accent)' : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="max-h-[250px] overflow-y-auto sam-scrollbar">
        {activeTab === 'progress' && (
          <ProgressPanel
            userProgress={enableGamification ? userProgress : null}
            xpProgress={enableGamification ? xpProgress : null}
            confidenceScore={confidenceScore}
          />
        )}
        {activeTab === 'tools' && (
          <ToolsPanel
            tools={tools}
            isLoading={isLoadingTools}
            error={toolsError}
            onSelectTool={onSelectTool}
            onRefresh={onRefreshTools}
            selectedToolId={selectedToolId}
          />
        )}
        {activeTab === 'memory' && <MemoryPanel />}
      </div>
    </div>
  );
}

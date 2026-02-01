"use client";

import React from 'react';
import { Wrench, Loader2, AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolSummary } from '../types';

interface ToolsPanelProps {
  tools: ToolSummary[];
  isLoading: boolean;
  error: string | null;
  onSelectTool: (tool: ToolSummary) => void;
  onRefresh: () => void;
  selectedToolId?: string | null;
  className?: string;
}

export function ToolsPanel({
  tools,
  isLoading,
  error,
  onSelectTool,
  onRefresh,
  selectedToolId,
  className,
}: ToolsPanelProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2
          className="h-5 w-5 animate-spin"
          style={{ color: 'var(--sam-accent)' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-3', className)}>
        <div
          className="rounded-lg p-3 flex items-start gap-2"
          style={{ background: 'var(--sam-error)', opacity: 0.1 }}
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <div>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={onRefresh}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className={cn('p-3', className)}>
        <p
          className="text-xs text-center py-4"
          style={{ color: 'var(--sam-text-muted)' }}
        >
          No tools available
        </p>
      </div>
    );
  }

  return (
    <div className={cn('p-2 space-y-1', className)}>
      {tools.map((tool) => {
        const isSelected = selectedToolId === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            disabled={!tool.enabled}
            className={cn(
              'w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left',
              'transition-all duration-150',
              tool.enabled
                ? 'hover:bg-[var(--sam-surface-hover)] active:scale-[0.98]'
                : 'opacity-50 cursor-not-allowed',
              isSelected && 'ring-1 ring-[var(--sam-accent)]'
            )}
            style={isSelected ? { background: 'var(--sam-accent)' + '12' } : undefined}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: isSelected ? 'var(--sam-accent)' : 'var(--sam-accent)',
                opacity: isSelected ? 0.25 : tool.enabled ? 0.15 : 0.08,
              }}
            >
              <Wrench
                className="h-4 w-4"
                style={{ color: 'var(--sam-accent)' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-medium truncate"
                style={{ color: 'var(--sam-text)' }}
              >
                {tool.name}
              </p>
              <p
                className="text-[10px] line-clamp-2"
                style={{ color: 'var(--sam-text-muted)' }}
              >
                {tool.description}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'var(--sam-border)',
                    color: 'var(--sam-text-secondary)',
                  }}
                >
                  {tool.category}
                </span>
                {tool.deprecated && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    deprecated
                  </span>
                )}
              </div>
            </div>
            {tool.enabled && (
              <div
                className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 self-center transition-colors hover:brightness-110"
                style={{ background: 'var(--sam-accent)', opacity: isSelected ? 1 : 0.15 }}
              >
                <Play
                  className="h-3 w-3"
                  style={{ color: isSelected ? '#fff' : 'var(--sam-accent)' }}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

'use client';

/**
 * Engine Transparency Panel
 *
 * Collapsible panel below assistant messages showing:
 * - Engines run (as colored chips)
 * - Preset used
 * - Total processing time
 * - Per-engine confidence scores (expandable)
 * - For Smart Auto mode: signals that influenced selection
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Timer, Sparkles } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface EngineSignal {
  name: string;
  score: number;
  triggered: boolean;
}

interface EngineSelectionInfo {
  preset: string;
  reason: string;
  signals?: EngineSignal[];
  alternativePresets?: string[];
}

export interface EngineInsights {
  enginesRun?: string[];
  enginesFailed?: string[];
  enginesCached?: string[];
  totalTime?: number;
  engineSelection?: EngineSelectionInfo;
  bloomsDistribution?: Record<string, number>;
  qualityScore?: number;
}

interface EngineTransparencyPanelProps {
  insights: EngineInsights;
  visible?: boolean;
}

// ============================================================================
// ENGINE CHIP COLORS
// ============================================================================

const ENGINE_COLORS: Record<string, string> = {
  context: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  blooms: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  content: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  personalization: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  assessment: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  response: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

function getEngineColor(engine: string): string {
  return ENGINE_COLORS[engine] ?? 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EngineTransparencyPanel({ insights, visible = true }: EngineTransparencyPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!visible || !insights) return null;

  const enginesRun = insights.enginesRun ?? [];
  const enginesFailed = insights.enginesFailed ?? [];
  const enginesCached = insights.enginesCached ?? [];
  const totalTime = insights.totalTime ?? 0;
  const selection = insights.engineSelection;

  // Don't render if no engine info available
  if (enginesRun.length === 0 && !selection) return null;

  return (
    <div className="mt-1.5 border-t border-gray-200/50 dark:border-gray-700/50 pt-1.5">
      {/* Collapsed summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-full"
        aria-expanded={expanded}
        aria-label="Toggle engine details"
      >
        <Cpu className="h-3 w-3" />
        <span>{enginesRun.length} engine{enginesRun.length !== 1 ? 's' : ''}</span>
        {selection?.preset && (
          <>
            <span className="text-gray-300 dark:text-gray-600">&middot;</span>
            <span>{selection.preset}</span>
          </>
        )}
        {totalTime > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-600">&middot;</span>
            <Timer className="h-3 w-3" />
            <span>{totalTime}ms</span>
          </>
        )}
        <span className="ml-auto">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 space-y-2 text-[11px]">
          {/* Engine chips */}
          <div className="flex flex-wrap gap-1">
            {enginesRun.map((engine) => (
              <span
                key={engine}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getEngineColor(engine)}`}
              >
                {engine}
                {enginesCached.includes(engine) && (
                  <span className="ml-0.5 opacity-60" title="Cached result">&bull;</span>
                )}
              </span>
            ))}
            {enginesFailed.map((engine) => (
              <span
                key={`failed-${engine}`}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 line-through"
              >
                {engine}
              </span>
            ))}
          </div>

          {/* Engine selection reasoning */}
          {selection?.reason && (
            <div className="flex items-start gap-1.5 text-gray-500 dark:text-gray-400">
              <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{selection.reason}</span>
            </div>
          )}

          {/* Selection signals (for Smart Auto mode) */}
          {selection?.signals && selection.signals.length > 0 && (
            <div className="grid grid-cols-3 gap-1">
              {selection.signals.map((signal) => (
                <div
                  key={signal.name}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                    signal.triggered
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${signal.triggered ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="truncate">{signal.name.replace(/_/g, ' ')}</span>
                  <span className="ml-auto font-mono">{signal.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quality score */}
          {insights.qualityScore !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <span>Quality:</span>
              <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    insights.qualityScore >= 0.8 ? 'bg-green-500' :
                    insights.qualityScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.round(insights.qualityScore * 100)}%` }}
                />
              </div>
              <span className="font-mono">{Math.round(insights.qualityScore * 100)}%</span>
            </div>
          )}

          {/* Bloom&apos;s distribution mini chart */}
          {insights.bloomsDistribution && (
            <div className="space-y-0.5">
              <span className="text-gray-400 dark:text-gray-500">Bloom&apos;s:</span>
              <div className="flex gap-0.5 h-3">
                {Object.entries(insights.bloomsDistribution).map(([level, pct]) => (
                  <div
                    key={level}
                    className="bg-purple-400/60 dark:bg-purple-500/40 rounded-sm relative group"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    title={`${level}: ${Math.round(pct)}%`}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 hidden group-hover:block text-[9px] bg-gray-800 text-white px-1 rounded whitespace-nowrap">
                      {level.charAt(0)}{level.slice(1).toLowerCase()}: {Math.round(pct)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

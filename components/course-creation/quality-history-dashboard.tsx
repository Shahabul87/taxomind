"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityHistoryEntry {
  runId?: string;
  timestamp: string;
  averageQualityScore: number;
  chaptersCreated: number;
  sectionsCreated: number;
  totalTimeMs: number;
  perChapter: Array<{
    chapterNumber: number;
    qualityScore: number;
    bloomsLevel?: string;
  }>;
  qualityFlags?: string[];
}

interface QualityHistoryDashboardProps {
  courseId: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getHeatmapColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function QualityHistoryDashboard({ courseId }: QualityHistoryDashboardProps) {
  const [history, setHistory] = useState<QualityHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}/quality-history`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.qualityHistory)) {
        setHistory(json.qualityHistory);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-sm text-slate-400">
            Loading quality history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-sm text-slate-400">
            No quality history available. Generate course content to see quality scores.
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const trend = previous
    ? latest.averageQualityScore > previous.averageQualityScore
      ? 'improving'
      : latest.averageQualityScore < previous.averageQualityScore
        ? 'declining'
        : 'stable'
    : 'stable';

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;
  const trendColor = trend === 'improving' ? 'text-emerald-500' : trend === 'declining' ? 'text-red-500' : 'text-slate-400';

  // Collect all quality flags across runs
  const allFlags = history.flatMap(h => h.qualityFlags ?? []);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Quality History
            <Badge variant="outline" className="text-[10px]">
              {history.length} run{history.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <div className={cn('text-2xl font-bold', getScoreColor(latest.averageQualityScore))}>
                {latest.averageQualityScore}
              </div>
              <div className="text-xs text-slate-400">Latest Score</div>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('h-4 w-4', trendColor)} />
              <span className={cn('text-xs', trendColor)}>
                {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {formatDuration(latest.totalTimeMs)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality score line (simple text-based since recharts may not be loaded) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Score Over Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-16">
            {history.map((entry, idx) => {
              const height = Math.max(8, (entry.averageQualityScore / 100) * 64);
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end"
                  title={`Run ${idx + 1}: ${entry.averageQualityScore}/100 (${new Date(entry.timestamp).toLocaleDateString()})`}
                >
                  <div
                    className={cn('w-full rounded-t', getHeatmapColor(entry.averageQualityScore))}
                    style={{ height: `${height}px` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1">
            {history.map((entry, idx) => (
              <div key={idx} className="flex-1 text-center text-[9px] text-slate-400">
                {entry.averageQualityScore}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-chapter heatmap (latest run) */}
      {latest.perChapter.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chapter Quality (Latest Run)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {latest.perChapter.map((ch) => (
                <div
                  key={ch.chapterNumber}
                  className={cn(
                    'w-10 h-10 rounded flex items-center justify-center text-xs font-medium text-white',
                    getHeatmapColor(ch.qualityScore),
                  )}
                  title={`Chapter ${ch.chapterNumber}: ${ch.qualityScore}/100`}
                >
                  {ch.qualityScore}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality flags */}
      {allFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Quality Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {allFlags.slice(-10).map((flag, idx) => (
                <li key={idx} className="text-xs text-slate-500 dark:text-slate-400">
                  {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

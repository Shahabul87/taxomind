'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DepthAnalysisV2Result, ChapterAnalysis } from '../types';

interface KnowledgeFlowMapProps {
  analysis: DepthAnalysisV2Result;
}

const BLOOMS_ORDER: Record<string, number> = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6,
};

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: '#94a3b8',
  UNDERSTAND: '#60a5fa',
  APPLY: '#34d399',
  ANALYZE: '#fbbf24',
  EVALUATE: '#f97316',
  CREATE: '#a78bfa',
};

function getFlowScoreColor(score: number): string {
  if (score >= 80) return 'border-emerald-400 dark:border-emerald-600';
  if (score >= 60) return 'border-amber-400 dark:border-amber-600';
  return 'border-red-400 dark:border-red-600';
}

function getFlowBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

interface FlowConnection {
  from: ChapterAnalysis;
  to: ChapterAnalysis;
  cognitiveJump: number;
  isSmooth: boolean;
}

export function KnowledgeFlowMap({ analysis }: KnowledgeFlowMapProps) {
  const chapters = analysis.chapterAnalysis;

  const connections = useMemo((): FlowConnection[] => {
    const conns: FlowConnection[] = [];
    for (let i = 0; i < chapters.length - 1; i++) {
      const from = chapters[i];
      const to = chapters[i + 1];
      const fromLevel = BLOOMS_ORDER[from.primaryBloomsLevel] || 1;
      const toLevel = BLOOMS_ORDER[to.primaryBloomsLevel] || 1;
      const jump = toLevel - fromLevel;

      conns.push({
        from,
        to,
        cognitiveJump: jump,
        isSmooth: Math.abs(jump) <= 1,
      });
    }
    return conns;
  }, [chapters]);

  const cognitiveJumps = useMemo(() => {
    return connections.filter((c) => !c.isSmooth);
  }, [connections]);

  if (chapters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">No chapter data available for flow analysis.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Flow Diagram */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Chapter Knowledge Flow
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Flow Score: {analysis.flowScore}
            </Badge>
            {cognitiveJumps.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {cognitiveJumps.length} cognitive jump{cognitiveJumps.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Horizontal Flow */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center gap-2 min-w-max px-2">
            <TooltipProvider>
              {chapters.map((chapter, index) => {
                const bloomsColor = BLOOMS_COLORS[chapter.primaryBloomsLevel] || '#94a3b8';
                const connection = index < connections.length ? connections[index] : null;

                return (
                  <div key={chapter.chapterId} className="flex items-center">
                    {/* Chapter Node */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.08 }}
                          className={cn(
                            'relative p-3 rounded-xl border-2 w-36 cursor-default transition-all',
                            getFlowScoreColor(chapter.scores.flow),
                            getFlowBg(chapter.scores.flow)
                          )}
                        >
                          <div className="text-xs font-medium text-slate-500 mb-1">
                            Ch {chapter.position}
                          </div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2">
                            {chapter.chapterTitle}
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: bloomsColor }}
                            />
                            <span className="text-[10px] font-medium" style={{ color: bloomsColor }}>
                              {chapter.primaryBloomsLevel}
                            </span>
                          </div>

                          {/* Issue badge */}
                          {chapter.issueCount > 0 && (
                            <div className="absolute -top-2 -right-2">
                              <Badge
                                variant="destructive"
                                className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                              >
                                {chapter.issueCount}
                              </Badge>
                            </div>
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px]">
                        <p className="text-xs">
                          <strong>Depth:</strong> {chapter.scores.depth} |{' '}
                          <strong>Flow:</strong> {chapter.scores.flow} |{' '}
                          <strong>Consistency:</strong> {chapter.scores.consistency}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Connection Arrow */}
                    {connection && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.1 }}
                        className="flex flex-col items-center mx-1"
                      >
                        <ArrowRight
                          className={cn(
                            'h-5 w-5',
                            connection.isSmooth
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          )}
                        />
                        {!connection.isSmooth && (
                          <span className="text-[9px] font-bold text-red-500 mt-0.5">
                            {connection.cognitiveJump > 0 ? '+' : ''}{connection.cognitiveJump}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </Card>

      {/* Cognitive Jumps Alert */}
      {cognitiveJumps.length > 0 && (
        <Card className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Cognitive Level Jumps Detected
              </h4>
              <div className="space-y-1">
                {cognitiveJumps.map((conn, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Ch {conn.from.position}</strong> ({conn.from.primaryBloomsLevel})
                    {' '}&rarr;{' '}
                    <strong>Ch {conn.to.position}</strong> ({conn.to.primaryBloomsLevel})
                    {' '}&mdash; {Math.abs(conn.cognitiveJump)} level{Math.abs(conn.cognitiveJump) > 1 ? 's' : ''}{' '}
                    {conn.cognitiveJump > 0 ? 'up' : 'down'}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Insight */}
      <Card className="p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The knowledge flow map shows how cognitive levels progress through your chapters.
            Smooth transitions (1 level or less between chapters) indicate good pedagogical scaffolding.
            Large jumps can indicate missing prerequisites or abrupt difficulty changes.
          </p>
        </div>
      </Card>
    </div>
  );
}

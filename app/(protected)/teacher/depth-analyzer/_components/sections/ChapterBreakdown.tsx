'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Brain,
  GitBranch,
  Layers,
  Sparkles,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { DepthAnalysisV2Result } from '../types';

interface ChapterBreakdownProps {
  analysis: DepthAnalysisV2Result;
  courseId: string;
}

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: '#94a3b8',
  UNDERSTAND: '#60a5fa',
  APPLY: '#34d399',
  ANALYZE: '#fbbf24',
  EVALUATE: '#f97316',
  CREATE: '#a78bfa',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getProgressColor(score: number): string {
  if (score >= 80) return '[&>div]:bg-emerald-500';
  if (score >= 60) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function ScoreMini({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  return (
    <div className="flex-1 min-w-[80px]">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-bold', getScoreColor(score))}>{score}</span>
        <Progress value={score} className={cn('h-1.5 flex-1', getProgressColor(score))} />
      </div>
    </div>
  );
}

export function ChapterBreakdown({ analysis, courseId }: ChapterBreakdownProps) {
  const chapters = analysis.chapterAnalysis;
  const issues = analysis.issues;

  if (chapters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">No chapter analysis data available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={[chapters[0]?.chapterId]} className="space-y-3">
        {chapters.map((chapter, index) => {
          const chapterIssues = issues.filter(
            (issue) => issue.location.chapterId === chapter.chapterId
          );
          const criticalCount = chapterIssues.filter((i) => i.severity === 'CRITICAL').length;
          const highCount = chapterIssues.filter((i) => i.severity === 'HIGH').length;
          const bloomsColor = BLOOMS_COLORS[chapter.primaryBloomsLevel] || '#94a3b8';

          return (
            <motion.div
              key={chapter.chapterId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AccordionItem value={chapter.chapterId} className="border rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    {/* Position Number */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: bloomsColor }}
                    >
                      {chapter.position}
                    </div>

                    {/* Title and badges */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {chapter.chapterTitle}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{ color: bloomsColor, backgroundColor: bloomsColor + '20' }}
                        >
                          {chapter.primaryBloomsLevel}
                        </Badge>
                        {criticalCount > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {criticalCount} critical
                          </Badge>
                        )}
                        {highCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {highCount} high
                          </Badge>
                        )}
                        {chapterIssues.length > 0 && criticalCount === 0 && highCount === 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {chapterIssues.length} issue{chapterIssues.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Overall chapter score */}
                    <div className={cn('text-lg font-bold flex-shrink-0', getScoreColor(chapter.scores.quality))}>
                      {chapter.scores.quality}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  {/* Score Grid */}
                  <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg mb-4">
                    <ScoreMini label="Depth" score={chapter.scores.depth} icon={Brain} />
                    <ScoreMini label="Flow" score={chapter.scores.flow} icon={GitBranch} />
                    <ScoreMini label="Consistency" score={chapter.scores.consistency} icon={Layers} />
                    <ScoreMini label="Quality" score={chapter.scores.quality} icon={Sparkles} />
                  </div>

                  {/* Chapter Issues Summary */}
                  {chapterIssues.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Issues in this chapter
                      </h5>
                      {chapterIssues.slice(0, 5).map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start gap-2 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        >
                          <AlertTriangle
                            className={cn(
                              'h-3.5 w-3.5 mt-0.5 flex-shrink-0',
                              issue.severity === 'CRITICAL' ? 'text-red-500' :
                              issue.severity === 'HIGH' ? 'text-orange-500' :
                              issue.severity === 'MEDIUM' ? 'text-amber-500' :
                              'text-blue-500'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                              {issue.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1">{issue.description}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            {issue.type}
                          </Badge>
                        </div>
                      ))}
                      {chapterIssues.length > 5 && (
                        <p className="text-xs text-slate-500 text-center">
                          +{chapterIssues.length - 5} more issues
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                      No issues found in this chapter
                    </p>
                  )}

                  {/* Go to Edit */}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/courses/${courseId}/chapters/${chapter.chapterId}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Edit Chapter
                    </Link>
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          );
        })}
      </Accordion>
    </div>
  );
}

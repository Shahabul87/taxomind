'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  ExternalLink,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { DepthAnalysisV2Result, AnalysisIssue } from '../types';

interface RecommendationPanelProps {
  analysis: DepthAnalysisV2Result;
  courseId: string;
}

function buildFixUrl(courseId: string, location: AnalysisIssue['location']): string | null {
  if (location.chapterId && location.sectionId) {
    return `/teacher/courses/${courseId}/chapters/${location.chapterId}/section/${location.sectionId}`;
  }
  if (location.chapterId) {
    return `/teacher/courses/${courseId}/chapters/${location.chapterId}`;
  }
  return `/teacher/courses/${courseId}`;
}

const severityIcon: Record<string, React.ElementType> = {
  CRITICAL: XCircle,
  HIGH: AlertTriangle,
  MEDIUM: AlertCircle,
};

const severityColor: Record<string, string> = {
  CRITICAL: 'text-red-600 dark:text-red-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  MEDIUM: 'text-amber-600 dark:text-amber-400',
};

export function RecommendationPanel({ analysis, courseId }: RecommendationPanelProps) {
  // Get top 5 priority recommendations: Critical > High > Medium, then by issue type
  const topRecommendations = useMemo(() => {
    const openIssues = analysis.issues.filter(
      (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS'
    );

    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    return openIssues
      .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
      .slice(0, 5);
  }, [analysis.issues]);

  if (topRecommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200/50 dark:border-amber-800/50">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Priority Recommendations
          </h3>
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Top {topRecommendations.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {topRecommendations.map((issue, index) => {
            const SeverityIcon = severityIcon[issue.severity] || AlertCircle;
            const color = severityColor[issue.severity] || 'text-blue-600';
            const fixUrl = buildFixUrl(courseId, issue.location);

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-bold text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityIcon className={cn('h-3.5 w-3.5 flex-shrink-0', color)} />
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {issue.title}
                    </h4>
                  </div>

                  {issue.location.chapterTitle && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <ChevronRight className="h-3 w-3" />
                      <span>{issue.location.chapterTitle}</span>
                      {issue.location.sectionTitle && (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <span>{issue.location.sectionTitle}</span>
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {issue.fix.what}
                  </p>
                </div>

                {fixUrl && (
                  <Button size="sm" variant="outline" asChild className="flex-shrink-0">
                    <Link href={fixUrl} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

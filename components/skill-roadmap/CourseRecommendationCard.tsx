'use client';

import { BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MatchedCourse } from '@/hooks/use-skill-roadmap-journey';

interface CourseRecommendationCardProps {
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  reason: string;
  matchedCourseId: string | null;
  matchedCourse?: MatchedCourse | null;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export function CourseRecommendationCard({
  title,
  description,
  difficulty,
  estimatedHours,
  reason,
  matchedCourseId,
  matchedCourse,
}: CourseRecommendationCardProps) {
  const hasMatch = matchedCourseId && matchedCourse;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg flex-shrink-0',
          hasMatch
            ? 'bg-blue-100 dark:bg-blue-900/50'
            : 'bg-violet-100 dark:bg-violet-900/50'
        )}>
          <BookOpen className={cn(
            'h-4 w-4',
            hasMatch
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-violet-600 dark:text-violet-400'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {hasMatch ? matchedCourse.title : title}
            </h4>
            <Badge className={cn('text-[10px] px-1.5 py-0 border-0', DIFFICULTY_STYLES[difficulty] ?? DIFFICULTY_STYLES.BEGINNER)}>
              {difficulty}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400">~{estimatedHours}h</span>
            {reason && (
              <span className="text-xs text-slate-400 italic truncate">
                {reason}
              </span>
            )}
          </div>

          <div className="mt-3">
            {hasMatch ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                onClick={() => window.open(`/courses/${matchedCourseId}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                Enroll Now
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/50"
                onClick={() => {
                  const params = new URLSearchParams({
                    title,
                    overview: description,
                  });
                  window.open(`/teacher/create/ai-creator?${params.toString()}`, '_blank');
                }}
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                Create This Course
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

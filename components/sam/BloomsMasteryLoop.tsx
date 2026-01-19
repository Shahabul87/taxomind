'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BloomsLevel } from '@prisma/client';

interface AccessibleCourse {
  id: string;
  title: string;
}

const BLOOMS_LEVELS: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  REMEMBER: 'bg-emerald-500',
  UNDERSTAND: 'bg-sky-500',
  APPLY: 'bg-indigo-500',
  ANALYZE: 'bg-amber-500',
  EVALUATE: 'bg-orange-500',
  CREATE: 'bg-rose-500',
};

interface BloomsMasteryLoopProps {
  className?: string;
}

export function BloomsMasteryLoop({ className }: BloomsMasteryLoopProps) {
  const [courses, setCourses] = useState<AccessibleCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/courses/accessible');
      if (!response.ok) {
        throw new Error('Failed to load courses');
      }
      const payload = await response.json();
      const list = (payload.data ?? []) as AccessibleCourse[];
      setCourses(list);
      if (!selectedCourseId && list.length > 0) {
        setSelectedCourseId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load courses');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const runAnalysis = useCallback(async () => {
    if (!selectedCourseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sam/blooms-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          depth: 'detailed',
          includeRecommendations: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze Bloom\'s mastery');
      }

      const payload = await response.json();
      setAnalysis(payload.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze course');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  const distribution = analysis?.courseLevel?.distribution ?? {};
  const recommendations = analysis?.recommendations ?? [];

  return (
    <Card className={cn('border-slate-200 bg-white', className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-2 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Bloom&apos;s Mastery Loop</CardTitle>
              <CardDescription>Track cognitive depth and next-step recommendations.</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={runAnalysis} disabled={isLoading || !selectedCourseId}>
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!analysis && !isLoading && (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Run the Bloom&apos;s analysis to see mastery distribution and recommendations.
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {BLOOMS_LEVELS.map((level) => (
                <div key={level} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{level}</span>
                    <span>{Math.round(distribution[level] ?? 0)}%</span>
                  </div>
                  <Progress
                    value={distribution[level] ?? 0}
                    className="mt-2"
                    indicatorClassName={BLOOMS_COLORS[level]}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Course Depth</p>
                  <p className="text-xs text-slate-500">Cognitive depth score and balance</p>
                </div>
                <Badge variant="secondary">
                  {analysis.courseLevel?.balance ?? 'balanced'}
                </Badge>
              </div>
              <div className="mt-3">
                <Progress value={analysis.courseLevel?.cognitiveDepth ?? 0} />
                <p className="mt-2 text-xs text-slate-500">
                  Depth score: {Math.round(analysis.courseLevel?.cognitiveDepth ?? 0)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900">Next-step recommendations</p>
                <Badge variant="outline">{recommendations.length}</Badge>
              </div>
              <div className="space-y-2">
                {recommendations.slice(0, 4).map((rec: any) => (
                  <div key={`${rec.type}-${rec.targetLevel}`} className="rounded-md bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{rec.description}</span>
                      <Badge variant="secondary" className="capitalize">{rec.priority}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Target level: {rec.targetLevel} · Impact: {rec.expectedImpact}
                    </p>
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <p className="text-sm text-slate-500">No recommendations yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BloomsMasteryLoop;

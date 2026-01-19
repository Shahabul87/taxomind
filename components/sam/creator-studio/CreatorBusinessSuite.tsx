'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, DollarSign, RefreshCw, Sparkles } from 'lucide-react';
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

interface AccessibleCourse {
  id: string;
  title: string;
  sources?: string[];
}

interface CreatorBusinessSuiteProps {
  className?: string;
}

export function CreatorBusinessSuite({ className }: CreatorBusinessSuiteProps) {
  const [courses, setCourses] = useState<AccessibleCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [marketAnalysis, setMarketAnalysis] = useState<any | null>(null);
  const [profitability, setProfitability] = useState<any | null>(null);
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
      const ownedCourses = list.filter((course) => course.sources?.includes('OWNER'));
      setCourses(ownedCourses);
      if (!selectedCourseId && ownedCourses.length > 0) {
        setSelectedCourseId(ownedCourses[0].id);
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
      const [marketRes, financialRes] = await Promise.all([
        fetch('/api/sam/course-market-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourseId,
            analysisType: 'comprehensive',
            includeRecommendations: true,
          }),
        }),
        fetch('/api/sam/financial-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'profitability-analysis',
            data: { courseId: selectedCourseId },
          }),
        }),
      ]);

      if (!marketRes.ok || !financialRes.ok) {
        throw new Error('Failed to fetch creator insights');
      }

      const marketPayload = await marketRes.json();
      const financialPayload = await financialRes.json();

      setMarketAnalysis(marketPayload.data ?? null);
      setProfitability(financialPayload.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run analysis');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  const formatPercent = (value?: number) =>
    value !== undefined ? `${Math.round(value)}%` : '—';

  return (
    <Card className={cn('border-slate-200 bg-white', className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Creator Business Suite</CardTitle>
              <CardDescription>Market demand, pricing, and profitability insights.</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select your course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runAnalysis} disabled={isLoading || !selectedCourseId}>
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

        {!marketAnalysis && !profitability && !isLoading && (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Run the analysis to see market and profitability insights for your course.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Market Outlook</h4>
              <Badge variant="secondary">{marketAnalysis?.trends?.marketGrowth ?? '—'}</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Market Value</span>
                  <span>{marketAnalysis?.marketValue?.score ?? '—'}</span>
                </div>
                <Progress value={marketAnalysis?.marketValue?.score ?? 0} className="mt-2" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Demand Score</span>
                <span className="font-medium text-slate-900">{marketAnalysis?.marketValue?.factors?.demand ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Branding Score</span>
                <span className="font-medium text-slate-900">{marketAnalysis?.branding?.score ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Recommended Price</span>
                <span className="font-semibold text-emerald-600">${marketAnalysis?.pricing?.recommendedPrice ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Profitability</h4>
              <Badge variant="outline">{profitability?.course?.recommendedAction ?? '—'}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Revenue</span>
                <span className="font-medium text-slate-900">${profitability?.course?.revenue ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Profit</span>
                <span className="font-semibold text-indigo-600">${profitability?.course?.profit ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Margin</span>
                <span className="font-medium text-slate-900">{formatPercent(profitability?.course?.margin)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Completion Rate</span>
                <span className="font-medium text-slate-900">{formatPercent(profitability?.course?.completionRate)}</span>
              </div>
            </div>
          </div>
        </div>

        {profitability?.recommendations?.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900">Next Actions</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              {profitability.recommendations.slice(0, 3).map((item: string) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CreatorBusinessSuite;

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Users,
  ArrowUp,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BenchmarkData {
  courseId: string;
  courseGrade: string;
  courseScore: number;
  categoryId: string;
  categoryName: string;
  categoryStats: {
    totalCourses: number;
    averageScore: number;
    averageGrade: string;
    medianScore: number;
    top10PercentScore: number;
    top10PercentGrade: string;
  };
  ranking: {
    rank: number;
    percentile: number;
    aboveAverage: boolean;
    inTop10Percent: boolean;
  };
  topCourseInsights: string[];
  improvementOpportunities: string[];
}

interface CourseBenchmarkCardProps {
  courseId: string;
  onViewRecommendations?: () => void;
  className?: string;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  A: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  B: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  C: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  D: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  'N/A': 'text-slate-500 bg-slate-100 dark:bg-slate-800',
};

export function CourseBenchmarkCard({
  courseId,
  onViewRecommendations,
  className,
}: CourseBenchmarkCardProps) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/courses/category-benchmarks?courseId=${courseId}`);
        const data = await response.json();

        if (data.success) {
          setBenchmarkData(data.data);
        } else {
          setError(data.error?.message || 'Failed to load benchmarks');
        }
      } catch (err) {
        setError('Failed to load benchmark data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBenchmarks();
  }, [courseId]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !benchmarkData) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
          <p className="text-sm text-slate-500">{error || 'No benchmark data available'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onViewRecommendations}>
            View Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { categoryStats, ranking, topCourseInsights, improvementOpportunities } = benchmarkData;
  const scoreGap = categoryStats.top10PercentScore - benchmarkData.courseScore;
  const averageGap = benchmarkData.courseScore - categoryStats.averageScore;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Category Benchmark
            </CardTitle>
            <CardDescription className="text-blue-100 mt-1">
              How your course compares to {benchmarkData.categoryName}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-0 text-sm font-medium"
          >
            {categoryStats.totalCourses} courses
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Score Comparison */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="text-xs text-slate-500 mb-1">Your Course</div>
            <div
              className={cn(
                'text-2xl font-bold',
                ranking.aboveAverage ? 'text-emerald-600' : 'text-amber-600'
              )}
            >
              {benchmarkData.courseGrade}
            </div>
            <div className="text-xs text-slate-500">{benchmarkData.courseScore}/100</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="text-xs text-slate-500 mb-1">Category Avg</div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {categoryStats.averageGrade}
            </div>
            <div className="text-xs text-slate-500">{categoryStats.averageScore}/100</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800"
          >
            <div className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" />
              Top 10%
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {categoryStats.top10PercentGrade}
            </div>
            <div className="text-xs text-amber-500">{categoryStats.top10PercentScore}/100</div>
          </motion.div>
        </div>

        {/* Ranking Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'p-4 rounded-xl border',
            ranking.inTop10Percent
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
              : ranking.aboveAverage
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full',
                  ranking.inTop10Percent
                    ? 'bg-emerald-500 text-white'
                    : ranking.aboveAverage
                    ? 'bg-blue-500 text-white'
                    : 'bg-amber-500 text-white'
                )}
              >
                {ranking.inTop10Percent ? (
                  <Trophy className="h-5 w-5" />
                ) : ranking.aboveAverage ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <Target className="h-5 w-5" />
                )}
              </div>
              <div>
                <div
                  className={cn(
                    'font-semibold',
                    ranking.inTop10Percent
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : ranking.aboveAverage
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-amber-700 dark:text-amber-300'
                  )}
                >
                  {ranking.inTop10Percent
                    ? 'Top 10% in Category!'
                    : ranking.aboveAverage
                    ? 'Above Average'
                    : 'Room for Growth'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {ranking.rank > 0
                    ? `Rank #${ranking.rank} of ${categoryStats.totalCourses}`
                    : 'Not yet ranked'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {ranking.percentile}%
              </div>
              <div className="text-xs text-slate-500">percentile</div>
            </div>
          </div>

          {/* Progress to Top 10% */}
          {!ranking.inTop10Percent && scoreGap > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-600 dark:text-slate-400">Progress to Top 10%</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {Math.round((benchmarkData.courseScore / categoryStats.top10PercentScore) * 100)}%
                </span>
              </div>
              <Progress
                value={(benchmarkData.courseScore / categoryStats.top10PercentScore) * 100}
                className="h-2"
              />
              <div className="text-xs text-slate-500 mt-1">
                +{Math.round(scoreGap)} points to reach top 10%
              </div>
            </div>
          )}
        </motion.div>

        {/* Top Course Insights */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            What Top Courses Do
          </div>
          <div className="space-y-2">
            {topCourseInsights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <ArrowUp className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{insight}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Improvement Opportunities */}
        {improvementOpportunities.length > 0 && !ranking.inTop10Percent && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              Your Opportunities
            </div>
            <div className="space-y-2">
              {improvementOpportunities.slice(0, 3).map((opportunity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <ChevronRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{opportunity}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {onViewRecommendations && !ranking.inTop10Percent && (
          <Button onClick={onViewRecommendations} className="w-full">
            View Improvement Recommendations
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

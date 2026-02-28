'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Microscope,
  Play,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Clock,
  AlertTriangle,
  BarChart3,
  Brain,
  GitBranch,
  Layers,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useQualityAnalysis } from './hooks/use-quality-analysis';
import { CourseSelector } from './sections/CourseSelector';
import { AnalysisProgressDisplay } from './sections/AnalysisProgress';
import dynamic from 'next/dynamic';
const AnalysisHero = dynamic(
  () => import('./sections/AnalysisHero').then(mod => ({ default: mod.AnalysisHero })),
  { ssr: false, loading: () => <div className="animate-pulse h-48 bg-muted rounded-lg" /> }
);
const BloomsTaxonomyChart = dynamic(
  () => import('./sections/BloomsTaxonomyChart').then(mod => ({ default: mod.BloomsTaxonomyChart })),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" /> }
);
import { KnowledgeFlowMap } from './sections/KnowledgeFlowMap';
import { ConsistencyMatrix } from './sections/ConsistencyMatrix';
import { ChapterBreakdown } from './sections/ChapterBreakdown';
import { IssueTracker } from './sections/IssueTracker';
import { RecommendationPanel } from './sections/RecommendationPanel';

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
  chapters: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
    }>;
  }>;
  latestAnalysis: {
    id: string;
    overallScore: number;
    analyzedAt: Date;
    version: number;
  } | null;
}

interface CourseQualityAnalyzerProps {
  courses: CourseData[];
  userId: string;
  initialCourseId?: string;
}

type AnalyzerState = 'selecting' | 'analyzing' | 'results';

export function CourseQualityAnalyzer({
  courses,
  userId,
  initialCourseId,
}: CourseQualityAnalyzerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialCourseId ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const prevCourseIdRef = useRef<string | null>(null);

  const {
    startAnalysis,
    loadExistingAnalysis,
    updateIssueStatus,
    progress,
    result,
    isLoading,
    error,
    clearResult,
  } = useQualityAnalysis();

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Determine current state
  const analyzerState: AnalyzerState = (() => {
    if (!selectedCourseId) return 'selecting';
    if (progress.isAnalyzing) return 'analyzing';
    return 'results';
  })();

  // Auto-load existing analysis when course selected
  useEffect(() => {
    if (!selectedCourseId || selectedCourseId === prevCourseIdRef.current) return;
    prevCourseIdRef.current = selectedCourseId;
    loadExistingAnalysis(selectedCourseId);
  }, [selectedCourseId, loadExistingAnalysis]);

  const handleCourseSelect = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveTab('overview');
    clearResult();
  }, [clearResult]);

  const handleBack = useCallback(() => {
    setSelectedCourseId(null);
    prevCourseIdRef.current = null;
    clearResult();
  }, [clearResult]);

  const handleStartAnalysis = useCallback((forceReanalyze: boolean = false) => {
    if (!selectedCourseId) return;
    startAnalysis(selectedCourseId, { forceReanalyze, aiEnabled: true });
  }, [selectedCourseId, startAnalysis]);

  const handleUpdateIssue = useCallback(async (
    issueId: string,
    updates: { status?: string; userNotes?: string }
  ) => {
    if (!result) return;
    await updateIssueStatus(
      result.id,
      issueId,
      updates.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'SKIPPED' | 'WONT_FIX',
      updates.userNotes
    );
  }, [result, updateIssueStatus]);

  // Course selection view
  if (analyzerState === 'selecting') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 sm:p-6 lg:p-8"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur-xl opacity-40" />
            <div className="relative p-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-xl shadow-violet-500/20">
              <Microscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-violet-800 to-indigo-900 dark:from-white dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Course Quality Analyzer
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              AI-powered deep analysis with Bloom&apos;s Taxonomy, knowledge flow &amp; actionable fixes
            </p>
          </div>
        </div>

        <CourseSelector courses={courses} onSelect={handleCourseSelect} />
      </motion.div>
    );
  }

  // Analysis / Results view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedCourse?.title}
            </h1>
            {result && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Analyzed {formatDistanceToNow(new Date(result.analyzedAt), { addSuffix: true })}
                <span className="text-slate-400 mx-1">|</span>
                Version {result.version}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result && !progress.isAnalyzing ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-analyze
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Re-analyze course?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will run a fresh AI analysis of your course. Previous results are saved as a version history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStartAnalysis(true)}>
                    Re-analyze
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : !progress.isAnalyzing && !result && !isLoading ? (
            <Button
              onClick={() => handleStartAnalysis(false)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Progress during analysis */}
        {progress.isAnalyzing && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <AnalysisProgressDisplay progressState={progress} />
          </motion.div>
        )}

        {/* Error */}
        {error && !progress.isAnalyzing && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400">Analysis Failed</h3>
                  <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartAnalysis(false)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {result && !progress.isAnalyzing && !error && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Hero Section */}
            <AnalysisHero analysis={result} />

            {/* Tabbed Results */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Cognitive Depth</span>
                  <span className="sm:hidden">Depth</span>
                </TabsTrigger>
                <TabsTrigger value="flow" className="gap-1.5">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden sm:inline">Knowledge Flow</span>
                  <span className="sm:hidden">Flow</span>
                </TabsTrigger>
                <TabsTrigger value="consistency" className="gap-1.5">
                  <Layers className="h-4 w-4" />
                  Consistency
                </TabsTrigger>
                <TabsTrigger value="chapters" className="gap-1.5">
                  <Brain className="h-4 w-4" />
                  Chapters
                </TabsTrigger>
                <TabsTrigger value="issues" className="gap-1.5">
                  <ListChecks className="h-4 w-4" />
                  Issues
                  {result.issueCount.total > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'ml-1',
                        result.issueCount.critical > 0 && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      )}
                    >
                      {result.issueCount.total}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <BloomsTaxonomyChart analysis={result} />
              </TabsContent>

              <TabsContent value="flow">
                <KnowledgeFlowMap analysis={result} />
              </TabsContent>

              <TabsContent value="consistency">
                <ConsistencyMatrix analysis={result} />
              </TabsContent>

              <TabsContent value="chapters">
                <ChapterBreakdown analysis={result} courseId={selectedCourseId ?? ''} />
              </TabsContent>

              <TabsContent value="issues">
                <IssueTracker
                  issues={result.issues}
                  courseId={selectedCourseId ?? ''}
                  onUpdateIssue={handleUpdateIssue}
                />
              </TabsContent>
            </Tabs>

            {/* Recommendation Panel */}
            <RecommendationPanel analysis={result} courseId={selectedCourseId ?? ''} />
          </motion.div>
        )}

        {/* Empty / Loading state */}
        {!result && !progress.isAnalyzing && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center">
              <div className="flex flex-col items-center">
                {isLoading ? (
                  <>
                    <div className="p-4 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                      <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Loading Analysis...
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                      Checking for existing analysis results
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                      <Microscope className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Ready to Analyze
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                      Click &quot;Start Analysis&quot; to run an AI-powered deep analysis of your course.
                      You&apos;ll get detailed insights on cognitive depth, knowledge flow, consistency,
                      and specific issues to fix.
                    </p>
                    <Button
                      onClick={() => handleStartAnalysis(false)}
                      className="mt-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

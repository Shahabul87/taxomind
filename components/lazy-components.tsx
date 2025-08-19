"use client";

import { lazy, Suspense, ComponentType } from 'react';

import { ErrorBoundary } from './ui/error-boundary';
import { LoadingSpinner } from './ui/loading-spinner';

// Loading fallback components
const ChartLoadingFallback = (): JSX.Element => (
  <div className="h-64 w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading chart...</div>
  </div>
);

const EditorLoadingFallback = (): JSX.Element => (
  <div className="h-40 w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading editor...</div>
  </div>
);

const AnalyticsLoadingFallback = (): JSX.Element => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-24 w-full bg-slate-800/50 rounded-lg animate-pulse" />
    ))}
  </div>
);

const AILoadingFallback = (): JSX.Element => (
  <div className="h-48 w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading AI assistant...</div>
  </div>
);

const DashboardLoadingFallback = (): JSX.Element => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
    ))}
  </div>
);

const VideoLoadingFallback = (): JSX.Element => (
  <div className="aspect-video w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading video player...</div>
  </div>
);

// Lazy loaded components
// Removed non-existent imports; ensure only existing modules are referenced
export const LazyTiptapEditor = lazy(() => import('@/components/tiptap/editor').then(m => ({ default: m.TipTapEditor })));
export const LazyAnalyticsDashboard = lazy(() => import('@/components/analytics/enhanced-analytics-dashboard').then(m => ({ default: m.EnhancedAnalyticsDashboard })));
// Placeholder for future AI assistant component – currently unused
export const LazyAIAssistant = lazy(() => Promise.resolve({ default: () => null }));
export const LazyVideoPlayer = lazy(() => import('@/components/video/tracked-video-player').then(m => ({ default: m.TrackedVideoPlayer })));
export const LazyUserDashboard = lazy(() => import('@/app/dashboard/user/_components/UserDashboard').then(m => ({ default: m.UserDashboard })));
export const LazyTeacherDashboard = lazy(() => import('../app/(protected)/teacher/courses/_components/courses-dashboard').then(module => ({ default: module.CoursesDashboard })));
export const LazyExamCreation = lazy(() => import('../app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/ExamCreationForm').then(module => ({ default: module.ExamCreationForm })));
// Simple placeholder for react-flow demo component
export const LazyReactFlow = lazy(() => Promise.resolve({ default: () => null }));
export const LazyCodeEditor = lazy(() => Promise.resolve({ default: () => null }));
export const LazyConfetti = lazy(() => import('react-confetti'));

// HOC for lazy loading with error boundary
function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  FallbackComponent: ComponentType = LoadingSpinner
): (props: T) => JSX.Element {
  return function LazyComponent(props: T): JSX.Element {
    return (
      <ErrorBoundary>
        <Suspense fallback={<FallbackComponent />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Wrapped components with proper loading states
// Remove reference to non-existent LazyChartComponent
export const LazyEditor = withLazyLoading(LazyTiptapEditor, EditorLoadingFallback);
export const LazyAnalytics = withLazyLoading(LazyAnalyticsDashboard, AnalyticsLoadingFallback);
export const LazyAI = withLazyLoading(LazyAIAssistant, AILoadingFallback);
export const LazyVideo = withLazyLoading(LazyVideoPlayer, VideoLoadingFallback);
export const LazyUserDash = withLazyLoading(LazyUserDashboard, DashboardLoadingFallback);
export const LazyTeacherDash = withLazyLoading(LazyTeacherDashboard, DashboardLoadingFallback);
export const LazyExam = withLazyLoading(LazyExamCreation, EditorLoadingFallback);
export const LazyFlow = withLazyLoading(LazyReactFlow, ChartLoadingFallback);
export const LazyCode = withLazyLoading(LazyCodeEditor, EditorLoadingFallback);

// Dynamic import utilities
export const dynamicImport = {
  // UI Libraries
  framerMotion: () => import('framer-motion'),
  reactFlow: () => import('reactflow'),
  recharts: () => import('recharts'),
  chartjs: () => import('chart.js'),
  
  // Editor
  tiptap: () => import('@tiptap/react'),
  monaco: () => import('@monaco-editor/react'),
  
  // Analytics
  analytics: () => import('@/lib/analytics'),
  
  // AI
  anthropic: () => import('@anthropic-ai/sdk'),
  
  // Utilities
  lodash: () => import('lodash'),
  dateFns: () => import('date-fns'),
  
  // Video
  reactYoutube: () => import('react-youtube'),
  
  // Confetti
  confetti: () => import('react-confetti'),
};

// Route-based lazy loading
export const LazyRouteComponents = {
  TeacherCourses: lazy(() => import('@/app/(protected)/teacher/courses/page')),
  StudentDashboard: lazy(() => import('@/app/dashboard/user/page')),
  CourseLearn: lazy(() => import('@/app/(course)/courses/[courseId]/learn/[chapterId]/sections/[sectionId]/page')),
  Analytics: lazy(() => import('@/app/analytics/user/page')),
  Settings: lazy(() => import('@/app/(protected)/settings/page')),
};

// Preload functions for critical routes
export const preloadCriticalComponents = {} as const;
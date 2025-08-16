"use client";

import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from './ui/loading-spinner';
import { ErrorBoundary } from './ui/error-boundary';

// Loading fallback components
const ChartLoadingFallback = () => (
  <div className="h-64 w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading chart...</div>
  </div>
);

const EditorLoadingFallback = () => (
  <div className="h-40 w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading editor...</div>
  </div>
);

const AnalyticsLoadingFallback = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-24 w-full bg-slate-800/50 rounded-lg animate-pulse" />
    ))}
  </div>
);

const AILoadingFallback = () => (
  <div className="h-48 w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading AI assistant...</div>
  </div>
);

const DashboardLoadingFallback = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
    ))}
  </div>
);

const VideoLoadingFallback = () => (
  <div className="aspect-video w-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-slate-400">Loading video player...</div>
  </div>
);

// Lazy loaded components
export const LazyChartComponent = lazy(() => import('./charts/chart-component'));
export const LazyTiptapEditor = lazy(() => import('./editor/tiptap-editor'));
export const LazyAnalyticsDashboard = lazy(() => import('./analytics/analytics-dashboard'));
export const LazyAIAssistant = lazy(() => import('./ai/ai-assistant'));
export const LazyVideoPlayer = lazy(() => import('./video/video-player'));
export const LazyUserDashboard = lazy(() => import('../app/dashboard/user/_components/UserDashboard'));
export const LazyTeacherDashboard = lazy(() => import('../app/(protected)/teacher/courses/_components/courses-dashboard'));
export const LazyExamCreation = lazy(() => import('../app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/ExamCreationForm'));
export const LazyReactFlow = lazy(() => import('./flow/react-flow-component'));
export const LazyCodeEditor = lazy(() => import('./editor/code-editor'));
export const LazyConfetti = lazy(() => import('react-confetti'));

// HOC for lazy loading with error boundary
function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback: ComponentType = LoadingSpinner,
  errorFallback?: ComponentType<{ error: Error }>
) {
  return function LazyComponent(props: T) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={<fallback />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Wrapped components with proper loading states
export const LazyChart = withLazyLoading(LazyChartComponent, ChartLoadingFallback);
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
  analytics: () => import('../lib/analytics'),
  
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
  TeacherCourses: lazy(() => import('../app/(protected)/teacher/courses/page')),
  StudentDashboard: lazy(() => import('../app/dashboard/user/page')),
  CourseLearn: lazy(() => import('../app/(course)/courses/[courseId]/learn/[chapterId]/sections/[sectionId]/page')),
  Analytics: lazy(() => import('../app/analytics/student/page')),
  Settings: lazy(() => import('../app/(protected)/settings/page')),
};

// Preload functions for critical routes
export const preloadCriticalComponents = {
  dashboard: () => {
    LazyUserDashboard.preload?.();
  },
  teacher: () => {
    LazyTeacherDashboard.preload?.();
    LazyExamCreation.preload?.();
  },
  course: () => {
    LazyVideoPlayer.preload?.();
    LazyTiptapEditor.preload?.();
  },
  analytics: () => {
    LazyAnalyticsDashboard.preload?.();
    LazyChartComponent.preload?.();
  },
};
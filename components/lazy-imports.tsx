/**
 * Lazy-loaded components for better code splitting and performance
 * This reduces initial bundle size by loading components only when needed
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
  </div>
);

// ============================================
// HEAVY EDITOR COMPONENTS
// ============================================

// Monaco Code Editor - Only load when needed (~98MB)
export const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Disable SSR for client-only component
  }
);

// TipTap Rich Text Editor - Load on demand
export const TipTapEditor = dynamic(
  () => import('@/components/tiptap/editor').then(mod => ({ default: mod.TipTapEditor })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// ============================================
// CHART COMPONENTS
// ============================================

// Chart.js components
export const LineChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const BarChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const PieChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Pie),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Recharts components
export const RechartsLineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const RechartsBarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// ============================================
// PDF & DOCUMENT COMPONENTS
// ============================================

// PDF generation - Heavy library
export const PDFGenerator = dynamic(
  () => Promise.resolve({ default: () => null }),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// HTML to Canvas for screenshots
export const Html2Canvas = dynamic(
  () => Promise.resolve({ default: () => null }),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// ============================================
// SYNTAX HIGHLIGHTING
// ============================================

// React Syntax Highlighter - Heavy library, load on demand
export const LazySyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Prism),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazySyntaxHighlighterLight = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Light),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// ============================================
// COLLABORATION COMPONENTS
// ============================================

// Collaborative editing with Yjs
export const CollaborativeEditor = dynamic(
  () => import('@/components/collaborative-editing/collaborative-editor').then(m => ({ default: m.CollaborativeEditor })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// ============================================
// ANALYTICS COMPONENTS
// ============================================

// Complex analytics dashboard
export const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics/enhanced-analytics-dashboard').then(m => ({ default: m.EnhancedAnalyticsDashboard })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// Progress chart - Lazy-loaded recharts bar chart for learning progress
export const ProgressChart = dynamic(
  () => import('@/components/dashboard/progress-chart'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// Teacher insights panel
export const TeacherInsights = dynamic(
  () => Promise.resolve({ default: () => null }),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// ============================================
// AI/ML COMPONENTS
// ============================================

// SAM AI Assistant - Complex AI components
export const SAMAssistantLazy = dynamic(
  () => import('@/components/sam/SAMAssistant').then(m => ({ default: m.SAMAssistant })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// AI Course Creator
export const AICourseCreator = dynamic(
  () => import('@/app/(protected)/teacher/create/ai-creator/page'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// ============================================
// ICON LIBRARIES - Load specific icons only
// ============================================

// Lucide icons are already optimized and tree-shakeable
// No need for dynamic loading as they're small and efficient
// Removed getTablerIcon function as we're now using lucide-react

// React icons function removed as we're now exclusively using lucide-react

// ============================================
// HEAVY UI COMPONENTS
// ============================================

// React Flow for visual programming
export const ReactFlowEditor = dynamic(
  () => import('reactflow'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Typewriter effect animation
export const TypewriterEffect = dynamic(
  () => import('typewriter-effect'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Confetti animation
export const Confetti = dynamic(
  () => import('react-confetti'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Helper function to lazy load any component
 * @param importFunc - Dynamic import function
 * @param options - Loading and SSR options
 */
export const lazyLoad = (
  importFunc: () => Promise<any>,
  options = { loading: LoadingSpinner, ssr: false }
) => {
  // Next.js dynamic requires options to be an object literal at compile time
  // Return the dynamic function directly with inline options
  return dynamic(importFunc, { loading: LoadingSpinner, ssr: false });
};

/**
 * Preload a component in the background
 * @param componentName - Name of the component to preload
 */
export const preloadComponent = (componentName: string) => {
  switch (componentName) {
    case 'monaco':
      import('@monaco-editor/react');
      break;
    case 'tiptap':
      import('@/components/tiptap/editor');
      break;
    case 'charts':
      import('react-chartjs-2');
      import('recharts');
      break;
    case 'pdf':
      import('jspdf');
      break;
    default:
      break;
  }
};

// ============================================
// EXPORT OPTIMIZED COMPONENTS
// ============================================

const LazyComponents = {
  // Editors
  MonacoEditor,
  TipTapEditor,
  
  // Charts
  LineChart,
  BarChart,
  PieChart,
  RechartsLineChart,
  RechartsBarChart,
  
  // Documents
  PDFGenerator,
  Html2Canvas,
  
  // Collaboration
  CollaborativeEditor,
  
  // Analytics
  AnalyticsDashboard,
  ProgressChart,
  TeacherInsights,
  
  // AI
  SAMAssistant: SAMAssistantLazy,
  AICourseCreator,
  
  // UI
  ReactFlowEditor,
  TypewriterEffect,
  Confetti,
  
  // Utilities
  lazyLoad,
  preloadComponent,
};

export default LazyComponents;
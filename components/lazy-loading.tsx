import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Enhanced Lazy Loading Components for Bundle Optimization
 */

// Loading fallbacks
const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingSpinner />
  </div>
);

const DashboardFallback = () => (
  <div className="space-y-4 p-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

const AnalyticsFallback = () => (
  <div className="space-y-6 p-6">
    <div className="h-10 bg-gray-200 rounded animate-pulse" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

// Lazy loaded components - Heavy/Complex components
export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/analytics/enhanced-analytics-dashboard')
    .then(module => ({ default: module.EnhancedAnalyticsDashboard }))
);

export const LazyVideoPlayer = lazy(() => 
  import('@/components/video/tracked-video-player')
    .then(module => ({ default: module.TrackedVideoPlayer }))
);

export const LazyTipTapEditor = lazy(() => 
  import('@/components/tiptap/editor')
    .then(module => ({ default: module.TipTapEditor }))
);

export const LazyCalendar = lazy(() => 
  import('@/app/calendar/_components/optimized-calendar')
    .then(module => ({ default: module.OptimizedCalendar }))
);

export const LazyChartComponents = lazy(() => 
  import('@/components/charts/client-charts')
    .then(module => ({ default: module.ClientCharts }))
);

export const LazyAITutor = lazy(() => 
  import('@/app/ai-tutor/_components/ai-tutor-content')
    .then(module => ({ default: module.AITutorContent }))
);

export const LazySearch = lazy(() => 
  import('@/app/(homepage)/_components/search-overlay')
    .then(module => ({ default: module.SearchOverlay }))
);

export const LazyChatInterface = lazy(() => 
  import('@/app/ai-tutor/_components/chat-interface')
    .then(module => ({ default: module.ChatInterface }))
);

export const LazyInfiniteMovingCards = lazy(() => 
  import('@/components/ui/infinite-moving-cards')
    .then(module => ({ default: module.InfiniteMovingCards }))
);

export const LazyCardsCarousel = lazy(() => 
  import('@/components/cardscarousel/cards-carousel')
    .then(module => ({ default: module.CardsCarousel }))
);

// Wrapper components with appropriate fallbacks
export const AnalyticsDashboardLazy = ({ ...props }) => (
  <Suspense fallback={<AnalyticsFallback />}>
    <LazyAnalyticsDashboard {...props} />
  </Suspense>
);

export const VideoPlayerLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyVideoPlayer {...props} />
  </Suspense>
);

export const TipTapEditorLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyTipTapEditor {...props} />
  </Suspense>
);

export const CalendarLazy = ({ ...props }) => (
  <Suspense fallback={<DashboardFallback />}>
    <LazyCalendar {...props} />
  </Suspense>
);

export const ChartComponentsLazy = ({ ...props }) => (
  <Suspense fallback={<AnalyticsFallback />}>
    <LazyChartComponents {...props} />
  </Suspense>
);

export const AITutorLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyAITutor {...props} />
  </Suspense>
);

export const SearchLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazySearch {...props} />
  </Suspense>
);

export const ChatInterfaceLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyChatInterface {...props} />
  </Suspense>
);

export const InfiniteMovingCardsLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyInfiniteMovingCards {...props} />
  </Suspense>
);

export const CardsCarouselLazy = ({ ...props }) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyCardsCarousel {...props} />
  </Suspense>
);

// High-order component for easy lazy loading
export function withLazyLoading<P extends object>(
  component: ComponentType<P>,
  fallback: ComponentType = DefaultFallback
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: component }));
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Route-based lazy loading for pages
export const LazyRoutes = {
  Analytics: lazy(() => import('@/app/analytics/student/page')),
  AITutor: lazy(() => import('@/app/ai-tutor/page')),
  Calendar: lazy(() => import('@/app/calendar/page')),
  Profile: lazy(() => import('@/app/profile/page')),
  Search: lazy(() => import('@/app/(protected)/search/page')),
  Messages: lazy(() => import('@/app/messages/page')),
};

// Bundle split utilities
export const BundleSplitWrapper = ({ 
  children, 
  fallback = <DefaultFallback />,
  timeout = 5000 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);
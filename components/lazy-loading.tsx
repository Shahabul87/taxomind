import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  LazyAnalyticsDashboard,
  LazyVideoPlayer,
  LazyTiptapEditor,
} from '@/components/lazy-components';

// TypeScript interfaces for component props
interface VideoPlayerProps {
  videoId?: string;
  src?: string;
  title?: string;
  poster?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  autoplay?: boolean;
  className?: string;
  showAnalytics?: boolean;
}

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  editorClassName?: string;
  bubbleMenu?: boolean;
  simple?: boolean;
}

interface CalendarProps {
  events?: any[];
  filters?: any;
  onEventMove?: (eventId: string, newDate: Date) => void;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  onEventClick?: (event: any) => void;
}

interface CarouselProps {
  items: JSX.Element[];
  initialScroll?: number;
  [key: string]: any;
}

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

// Lazy loaded components - Heavy/Complex components are imported from lazy-components
export const LazyCalendar = lazy(() => 
  import('@/app/calendar/_components/optimized-calendar')
    .then(module => ({ default: module.OptimizedCalendar }))
);

// No chart bundle wrapper available; keep placeholder component
const ChartComponentsPlaceholder = lazy(() => Promise.resolve({ default: () => null }));

const LazyAITutor = lazy(() => Promise.resolve({ default: () => null }));
const LazySearch = lazy(() => Promise.resolve({ default: () => null }));
const LazyChatInterface = lazy(() => Promise.resolve({ default: () => null }));

const InfiniteMovingCardsPlaceholder = lazy(() => Promise.resolve({ default: (props: any) => null }));

export const LazyCardsCarousel = lazy(() => 
  import('@/components/cardscarousel/cards-carousel')
    .then(module => ({ default: module.Carousel }))
);

// Wrapper components with appropriate fallbacks
export const AnalyticsDashboardLazy = ({ ...props }: any) => (
  <Suspense fallback={<AnalyticsFallback />}>
    <LazyAnalyticsDashboard {...props} />
  </Suspense>
);

export const VideoPlayerLazy = ({ videoId = '', src = '', ...props }: VideoPlayerProps) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyVideoPlayer videoId={videoId} src={src} {...props} />
  </Suspense>
);

export const TipTapEditorLazy = ({ value = '', ...props }: EditorProps) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyTiptapEditor value={value} {...props} />
  </Suspense>
);

export const CalendarLazy = ({ 
  events = [], 
  filters = {}, 
  onEventMove = () => {}, 
  onDateSelect = () => {}, 
  selectedDate = new Date(), 
  onEventClick = () => {},
  ...props 
}: CalendarProps) => (
  <Suspense fallback={<DashboardFallback />}>
    <LazyCalendar 
      events={events}
      filters={filters}
      onEventMove={onEventMove}
      onDateSelect={onDateSelect}
      selectedDate={selectedDate}
      onEventClick={onEventClick}
      {...props} 
    />
  </Suspense>
);

export const ChartComponentsLazy = ({ ...props }: any) => (
  <Suspense fallback={<AnalyticsFallback />}>
    <ChartComponentsPlaceholder {...props} />
  </Suspense>
);

export const AITutorLazy = ({ ...props }: any) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyAITutor {...props} />
  </Suspense>
);

export const SearchLazy = ({ ...props }: any) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazySearch {...props} />
  </Suspense>
);

export const ChatInterfaceLazy = ({ ...props }: any) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyChatInterface {...props} />
  </Suspense>
);

export const InfiniteMovingCardsLazy = ({ ...props }: any) => (
  <Suspense fallback={<DefaultFallback />}>
    <InfiniteMovingCardsPlaceholder {...props} />
  </Suspense>
);

export const CardsCarouselLazy = ({ items = [], ...props }: CarouselProps) => (
  <Suspense fallback={<DefaultFallback />}>
    <LazyCardsCarousel items={items} {...props} />
  </Suspense>
);

// High-order component for easy lazy loading
export const withLazyLoading = <P extends object>(
  component: ComponentType<P>,
  fallback: ComponentType = DefaultFallback
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: component }));
  const Fallback = fallback;
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
};

// Route-based lazy loading for pages
export const LazyRoutes = {
  Analytics: lazy(() => Promise.resolve({ default: () => null })),
  AITutor: lazy(() => Promise.resolve({ default: () => null })),
  Calendar: lazy(() => import('@/app/calendar/page')),
  Search: lazy(() => import('@/app/(protected)/search/page')),
  Messages: lazy(() => import('@/app/dashboard/user/messages/page')),
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
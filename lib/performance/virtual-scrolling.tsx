/**
 * Virtual Scrolling Implementation
 * Phase 3.2: Virtual scrolling for large lists and performance optimization
 * Part of Enterprise Code Quality Plan Phase 3
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  ReactNode,
  CSSProperties,
} from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface VirtualScrollItem {
  id: string | number;
  height?: number;
  [key: string]: any;
}

interface VirtualScrollProps<T extends VirtualScrollItem> {
  items: T[];
  height: number; // Container height
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  overscan?: number; // Number of items to render outside visible area
  scrollOffset?: number;
  onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down') => void;
  className?: string;
  style?: CSSProperties;
  loading?: boolean;
  loadingComponent?: ReactNode;
  endReached?: () => void;
  endReachedThreshold?: number; // Pixels from bottom to trigger endReached
}

interface VirtualGridProps<T extends VirtualScrollItem> {
  items: T[];
  height: number;
  width: number;
  itemWidth: number;
  itemHeight: number;
  columns: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
  style?: CSSProperties;
}

interface UseVirtualScrollReturn {
  visibleItems: Array<{
    item: any;
    index: number;
    style: CSSProperties;
  }>;
  totalHeight: number;
  containerProps: {
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: CSSProperties;
  };
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
}

/**
 * Hook for virtual scrolling functionality
 */
export function useVirtualScroll<T extends VirtualScrollItem>({
  items,
  height,
  itemHeight,
  overscan = 5,
  onScroll,
  endReached,
  endReachedThreshold = 100,
}: Pick<VirtualScrollProps<T>, 'items' | 'height' | 'itemHeight' | 'overscan' | 'onScroll' | 'endReached' | 'endReachedThreshold'>): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate item heights
  const itemHeights = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.map(() => itemHeight);
    }
    return items.map((item, index) => itemHeight(item, index));
  }, [items, itemHeight]);

  // Calculate cumulative heights for position lookup
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    for (let i = 0; i < itemHeights.length; i++) {
      heights.push(heights[i] + itemHeights[i]);
    }
    return heights;
  }, [itemHeights]);

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;

  // Find visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      if (cumulativeHeights[mid] <= scrollTop) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    const startIndex = Math.max(0, end - overscan);

    // Binary search for end index
    const viewportBottom = scrollTop + height;
    start = 0;
    end = items.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      if (cumulativeHeights[mid] <= viewportBottom) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    const endIndex = Math.min(items.length - 1, start + overscan);

    return { start: startIndex, end: endIndex };
  }, [scrollTop, height, cumulativeHeights, items.length, overscan]);

  // Generate visible items with styles
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i];
      if (!item) continue;

      const style: CSSProperties = {
        position: 'absolute',
        top: cumulativeHeights[i],
        left: 0,
        right: 0,
        height: itemHeights[i],
      };

      result.push({ item, index: i, style });
    }
    return result;
  }, [visibleRange, items, cumulativeHeights, itemHeights]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    const scrollDirection = newScrollTop > lastScrollTop ? 'down' : 'up';
    
    setScrollTop(newScrollTop);
    setLastScrollTop(newScrollTop);
    
    onScroll?.(newScrollTop, scrollDirection);

    // Check if we're near the end
    if (endReached && newScrollTop + height + endReachedThreshold >= totalHeight) {
      endReached();
    }
  }, [lastScrollTop, onScroll, endReached, height, totalHeight, endReachedThreshold]);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current || index < 0 || index >= items.length) return;

    const itemTop = cumulativeHeights[index];
    const itemHeight = itemHeights[index];
    
    let targetScrollTop = itemTop;
    
    switch (align) {
      case 'center':
        targetScrollTop = itemTop - (height - itemHeight) / 2;
        break;
      case 'end':
        targetScrollTop = itemTop - height + itemHeight;
        break;
    }

    targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - height));
    
    scrollElementRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
  }, [cumulativeHeights, itemHeights, height, totalHeight, items.length]);

  return {
    visibleItems,
    totalHeight,
    containerProps: {
      onScroll: handleScroll,
      style: {
        height,
        overflow: 'auto',
        position: 'relative',
      },
    },
    scrollToItem,
  };
}

/**
 * Virtual Scroll List Component
 */
export function VirtualScrollList<T extends VirtualScrollItem>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  scrollOffset = 0,
  onScroll,
  className = '',
  style = {},
  loading = false,
  loadingComponent,
  endReached,
  endReachedThreshold = 100,
}: VirtualScrollProps<T>) {
  const {
    visibleItems,
    totalHeight,
    containerProps,
    scrollToItem,
  } = useVirtualScroll({
    items,
    height,
    itemHeight,
    overscan,
    onScroll,
    endReached,
    endReachedThreshold,
  });

  // Expose scrollToItem via ref
  const scrollListRef = useRef<{ scrollToItem: typeof scrollToItem }>(null);
  
  React.useImperativeHandle(scrollListRef, () => ({
    scrollToItem,
  }), [scrollToItem]);

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center h-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div
      className={className}
      style={{ ...style, ...containerProps.style }}
      onScroll={containerProps.onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style: itemStyle }) =>
          renderItem(item, index, itemStyle)
        )}
      </div>
      {loading && (loadingComponent || defaultLoadingComponent)}
    </div>
  );
}

/**
 * Virtual Grid Component for grid layouts
 */
export function VirtualGrid<T extends VirtualScrollItem>({
  items,
  height,
  width,
  itemWidth,
  itemHeight,
  columns,
  renderItem,
  gap = 0,
  overscan = 5,
  className = '',
  style = {},
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate grid dimensions
  const rowHeight = itemHeight + gap;
  const colWidth = itemWidth + gap;
  const itemsPerRow = columns;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight;

  // Calculate visible range
  const visibleRowStart = Math.floor(scrollTop / rowHeight);
  const visibleRowEnd = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + height) / rowHeight)
  );

  const startIndex = Math.max(0, (visibleRowStart - overscan) * itemsPerRow);
  const endIndex = Math.min(
    items.length - 1,
    (visibleRowEnd + overscan + 1) * itemsPerRow - 1
  );

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const item = items[i];
      if (!item) continue;

      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      const style: CSSProperties = {
        position: 'absolute',
        top: row * rowHeight,
        left: col * colWidth,
        width: itemWidth,
        height: itemHeight,
      };

      result.push({ item, index: i, style });
    }
    return result;
  }, [startIndex, endIndex, items, itemsPerRow, rowHeight, colWidth, itemWidth, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={className}
      style={{
        ...style,
        height,
        width,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style: itemStyle }) =>
          renderItem(item, index, itemStyle)
        )}
      </div>
    </div>
  );
}

/**
 * Infinite Scroll List with virtual scrolling
 */
interface InfiniteVirtualScrollProps<T extends VirtualScrollItem> extends Omit<VirtualScrollProps<T>, 'endReached'> {
  hasNextPage: boolean;
  isLoadingNextPage: boolean;
  loadNextPage: () => Promise<void> | void;
  pageSize?: number;
}

export function InfiniteVirtualScrollList<T extends VirtualScrollItem>({
  items,
  height,
  itemHeight,
  renderItem,
  hasNextPage,
  isLoadingNextPage,
  loadNextPage,
  pageSize = 20,
  ...props
}: InfiniteVirtualScrollProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEndReached = useCallback(async () => {
    if (isLoading || isLoadingNextPage || !hasNextPage) return;

    try {
      setIsLoading(true);
      await loadNextPage();
    } catch (error) {
      logger.error("Error loading next page:", error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLoadingNextPage, hasNextPage, loadNextPage]);

  return (
    <VirtualScrollList
      {...props}
      items={items}
      height={height}
      itemHeight={itemHeight}
      renderItem={renderItem}
      endReached={handleEndReached}
      loading={isLoading || isLoadingNextPage}
    />
  );
}

/**
 * Course List with Virtual Scrolling
 */
interface VirtualCourseListProps {
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    instructor?: string;
    price?: number;
    rating?: number;
    enrolled?: boolean;
  }>;
  height: number;
  onCourseClick?: (courseId: string) => void;
  loading?: boolean;
}

export function VirtualCourseList({
  courses,
  height,
  onCourseClick,
  loading = false,
}: VirtualCourseListProps) {
  const renderCourseItem = useCallback((
    course: VirtualCourseListProps['courses'][0],
    index: number,
    style: CSSProperties
  ) => (
    <div
      key={course.id}
      style={style}
      className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
      onClick={() => onCourseClick?.(course.id)}
    >
      <div className="flex items-center space-x-4">
        {course.thumbnail && (
          <Image
            src={course.thumbnail}
            alt={course.title}
            width={64}
            height={64}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{course.title}</h3>
          {course.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mt-1">
              {course.description}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2">
            {course.instructor && (
              <span className="text-sm text-gray-500">
                By {course.instructor}
              </span>
            )}
            {course.rating && (
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="text-sm ml-1">{course.rating}</span>
              </div>
            )}
            {course.price !== undefined && (
              <span className="text-sm font-medium">
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </span>
            )}
          </div>
        </div>
        {course.enrolled && (
          <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Enrolled
          </div>
        )}
      </div>
    </div>
  ), [onCourseClick]);

  return (
    <VirtualScrollList
      items={courses}
      height={height}
      itemHeight={120} // Fixed height for course items
      renderItem={renderCourseItem}
      loading={loading}
      className="border border-gray-200 rounded-lg"
    />
  );
}

/**
 * User Analytics List with Virtual Scrolling
 */
interface VirtualAnalyticsListProps {
  analytics: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    activityType: string;
    timestamp: Date;
    metadata?: any;
  }>;
  height: number;
  onUserClick?: (userId: string) => void;
}

export function VirtualAnalyticsList({
  analytics,
  height,
  onUserClick,
}: VirtualAnalyticsListProps) {
  const renderAnalyticsItem = useCallback((
    item: VirtualAnalyticsListProps['analytics'][0],
    index: number,
    style: CSSProperties
  ) => (
    <div
      key={item.id}
      style={style}
      className="p-3 border-b border-gray-100 hover:bg-gray-50"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUserClick?.(item.userId)}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              {item.userName}
            </button>
            <span className="text-gray-500 text-sm">({item.userEmail})</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">{item.activityType}</p>
          {item.metadata && (
            <p className="text-xs text-gray-500 mt-1">
              {JSON.stringify(item.metadata)}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {item.timestamp.toLocaleDateString()}
        </span>
      </div>
    </div>
  ), [onUserClick]);

  return (
    <VirtualScrollList
      items={analytics}
      height={height}
      itemHeight={80}
      renderItem={renderAnalyticsItem}
      className="border border-gray-200 rounded-lg bg-white"
    />
  );
}

/**
 * Performance monitoring for virtual scroll
 */
export class VirtualScrollPerformanceMonitor {
  private static renderTimes: number[] = [];
  private static scrollEvents: number = 0;
  private static lastRenderTime: number = 0;

  static trackRender(startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.renderTimes.push(renderTime);
    this.lastRenderTime = renderTime;

    // Keep only last 100 measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes = this.renderTimes.slice(-100);
    }

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      logger.warn(`[Virtual Scroll] Slow render: ${renderTime.toFixed(2)}ms`);
    }
  }

  static trackScrollEvent(): void {
    this.scrollEvents++;
  }

  static getMetrics() {
    const avgRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
      : 0;

    return {
      averageRenderTime: avgRenderTime,
      lastRenderTime: this.lastRenderTime,
      totalScrollEvents: this.scrollEvents,
      renderSamples: this.renderTimes.length,
    };
  }

  static clearMetrics(): void {
    this.renderTimes = [];
    this.scrollEvents = 0;
    this.lastRenderTime = 0;
  }
}

export type {
  VirtualScrollItem,
  VirtualScrollProps,
  VirtualGridProps,
  InfiniteVirtualScrollProps,
  VirtualCourseListProps,
  VirtualAnalyticsListProps,
};
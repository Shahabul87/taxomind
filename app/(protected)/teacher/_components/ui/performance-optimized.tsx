"use client";

import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Custom hooks for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

// Memoized Card Components
interface OptimizedCardProps {
  id: string;
  title: string;
  description?: string;
  status: string;
  metadata: {
    [key: string]: any;
  };
  onClick?: (id: string) => void;
  className?: string;
}

export const OptimizedCard = memo<OptimizedCardProps>(({ 
  id, 
  title, 
  description, 
  status, 
  metadata, 
  onClick, 
  className 
}) => {
  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [id, onClick]);

  const statusColor = useMemo(() => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }, [status]);

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow duration-200",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{title}</CardTitle>
          <Badge className={statusColor}>{status}</Badge>
        </div>
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          {Object.entries(metadata).map(([key, value]) => (
            <span key={key}>
              {key}: {value}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Virtualized List Component
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Lazy Image Component
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
}

export const LazyImage = memo<LazyImageProps>(({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjwvUHN2Zz4K"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const isVisible = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (isVisible && !isLoaded && !error) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setError(true);
      img.src = src;
    }
  }, [isVisible, isLoaded, error, src]);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {!isLoaded && !error && (
        <Image
          src={placeholder}
          alt=""
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full object-cover animate-pulse"
        />
      )}
      {isLoaded && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// Memoized Stats Component
interface StatsProps {
  data: {
    label: string;
    value: number;
    change?: number;
    icon?: React.ReactNode;
  }[];
  className?: string;
}

export const MemoizedStats = memo<StatsProps>(({ data, className }) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {data.map((stat, index) => (
        <Card key={`${stat.label}-${index}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.change !== undefined && (
                  <p className={cn(
                    "text-xs",
                    stat.change > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {stat.change > 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
                  </p>
                )}
              </div>
              {stat.icon && (
                <div className="w-8 h-8 text-blue-500">
                  {stat.icon}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

MemoizedStats.displayName = 'MemoizedStats';

// Optimized Search Component
interface OptimizedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export const OptimizedSearch = memo<OptimizedSearchProps>(({ 
  placeholder = "Search...", 
  onSearch, 
  debounceMs = 300,
  className 
}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={handleChange}
      className={cn(
        "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
    />
  );
});

OptimizedSearch.displayName = 'OptimizedSearch';

// Memoized Table Component
interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function OptimizedTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className
}: OptimizedTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = useCallback((key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey]);

  const handleRowClick = useCallback((item: T) => {
    onRowClick?.(item);
  }, [onRowClick]);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                  column.sortable && "cursor-pointer hover:bg-gray-100"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && sortKey === column.key && (
                    <span className="text-blue-500">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                "hover:bg-gray-50 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => handleRowClick(item)}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key])
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number>();
  const endTime = useRef<number>();

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      endTime.current = performance.now();
      const duration = endTime.current - (startTime.current || 0);
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
    };
  }, [name]);
}

// Memory leak prevention hook
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
}

// Batch updates hook
export function useBatchUpdates<T>(initialValue: T[], batchSize: number = 10) {
  const [items, setItems] = useState<T[]>(initialValue);
  const [isProcessing, setIsProcessing] = useState(false);
  const queueRef = useRef<T[]>([]);

  const addItems = useCallback((newItems: T[]) => {
    queueRef.current.push(...newItems);
    
    if (!isProcessing) {
      setIsProcessing(true);
      
      const processQueue = () => {
        if (queueRef.current.length === 0) {
          setIsProcessing(false);
          return;
        }
        
        const batch = queueRef.current.splice(0, batchSize);
        setItems(prev => [...prev, ...batch]);
        
        // Process next batch on next tick
        requestAnimationFrame(processQueue);
      };
      
      requestAnimationFrame(processQueue);
    }
  }, [batchSize, isProcessing]);

  const clearItems = useCallback(() => {
    setItems([]);
    queueRef.current = [];
  }, []);

  return { items, addItems, clearItems, isProcessing };
}

// Export all optimization utilities
export {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  usePerformanceMonitor,
  useCleanup,
  useBatchUpdates
};
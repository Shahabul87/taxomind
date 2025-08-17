"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { LoadingSpinner } from './ui/loading-spinner';
import { ErrorBoundary } from './ui/error-boundary';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  priority?: number;
  preload?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function ProgressiveLoader({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  priority = 0,
  preload = false,
  onLoad,
  onError,
}: ProgressiveLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(preload);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  const loadContent = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate loading delay based on priority
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 100 - priority * 10)));
      
      setIsLoaded(true);
      onLoad?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Loading failed');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, priority, onLoad, onError]);

  useEffect(() => {
    if (preload) {
      loadContent();
    }
  }, [preload, loadContent]);

  useEffect(() => {
    if (isIntersecting && !isLoaded && !isLoading) {
      loadContent();
    }
  }, [isIntersecting, isLoaded, isLoading, loadContent]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p>Failed to load content: {error.message}</p>
          <button 
            onClick={loadContent}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (isLoading) {
      return fallback || <LoadingSpinner />;
    }

    if (isLoaded) {
      return children;
    }

    return fallback || <div className="h-20 bg-slate-800/20 rounded animate-pulse" />;
  };

  return (
    <div ref={containerRef}>
      <ErrorBoundary onError={onError}>
        {renderContent()}
      </ErrorBoundary>
    </div>
  );
}

// HOC for progressive loading
export function withProgressiveLoading<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<ProgressiveLoaderProps, 'children'> = {
}
) {
  return function ProgressiveComponent(props: T) {
    return (
      <ProgressiveLoader {...options}>
        <Component {...props} />
      </ProgressiveLoader>
    );
  };
}

// Progressive loading manager
class ProgressiveLoadingManager {
  private queue: Array<{ priority: number; loader: () => Promise<void> }> = [];
  private isProcessing = false;
  private maxConcurrent = 3;
  private processing = 0;

  add(loader: () => Promise<void>, priority: number = 0) {
    this.queue.push({ priority, loader });
    this.queue.sort((a, b) => b.priority - a.priority);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.processing >= this.maxConcurrent) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && this.processing < this.maxConcurrent) {
      const item = this.queue.shift();
      if (item) {
        this.processing++;
        
        item.loader()
          .catch(console.error)
          .finally(() => {
            this.processing--;
            this.processQueue();
          });
      }
    }

    this.isProcessing = false;
  }
}

export const progressiveLoadingManager = new ProgressiveLoadingManager();

// Progressive image loading
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  priority?: number;
  sizes?: string;
  quality?: number;
}

export function ProgressiveImage({
  src,
  alt,
  className,
  placeholder,
  priority = 0,
  sizes,
  quality = 75,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  useEffect(() => {
    if (isIntersecting || priority > 5) {
      const img = new window.Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsError(true);
      img.src = src;
    }
  }, [isIntersecting, src, priority]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-slate-800/20 animate-pulse" />
      )}
      
      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 bg-slate-800/20 flex items-center justify-center">
          <span className="text-slate-400 text-sm">Failed to load image</span>
        </div>
      )}
      
      {/* Actual image */}
      {isLoaded && (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={priority > 5 ? 'eager' : 'lazy'}
          sizes={sizes}
          width={800}
          height={600}
          quality={quality}
        />
      )}
    </div>
  );
}

// Progressive script loading
export function useProgressiveScript(src: string, options: { priority?: number; async?: boolean } = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async !== false;
    
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setIsError(true);
    
    if (options.priority && options.priority > 5) {
      document.head.appendChild(script);
    } else {
      // Defer loading for lower priority scripts
      setTimeout(() => {
        document.head.appendChild(script);
      }, (10 - (options.priority || 0)) * 100);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [src, options.priority, options.async]);

  return { isLoaded, isError };
}
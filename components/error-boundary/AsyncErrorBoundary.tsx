'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface AsyncErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'children'> {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  loadingDelay?: number;
}

/**
 * Async Error Boundary Component
 * Combines Suspense with ErrorBoundary for handling both loading and error states
 */
export function AsyncErrorBoundary({
  children,
  loadingFallback,
  loadingDelay = 200,
  ...errorBoundaryProps
}: AsyncErrorBoundaryProps) {
  const defaultLoadingFallback = (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="ml-2">Loading...</span>
    </div>
  );

  return (
    <ErrorBoundary {...errorBoundaryProps}>
      <Suspense fallback={loadingFallback || defaultLoadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default AsyncErrorBoundary;
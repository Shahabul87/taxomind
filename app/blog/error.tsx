'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for Blog Page
 * Catches and displays errors in a user-friendly way
 * Enterprise-grade error handling with recovery options
 */
export default function BlogError({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    // Log error to monitoring service
    console.error('[BLOG_ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center space-y-6 shadow-2xl border-red-200/50 dark:border-red-900/50">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 motion-safe:animate-pulse motion-reduce:animate-none"></div>
            <div className="relative p-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white">
              <AlertCircle className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Oops! Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            We encountered an error while loading the blog posts. This might be a temporary issue.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="border-slate-300 dark:border-slate-600"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          If this problem persists, please contact support or try again later.
        </p>
      </Card>
    </div>
  );
}

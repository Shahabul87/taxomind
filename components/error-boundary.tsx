'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Oops! Something went wrong
        </h1>
        
        <p className="mb-6 text-gray-600">
          We&apos;ve encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg bg-gray-100 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-gray-700">Error Details:</p>
            <p className="text-xs text-gray-600 font-mono">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button 
            onClick={reset}
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
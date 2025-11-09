'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service (Sentry, LogRocket, etc.)
    console.error('Section page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
              <CardDescription>
                We encountered an error while loading this course section. This could be a temporary
                issue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/my-courses">
                <Home className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            If this problem persists, please{' '}
            <Link href="/support" className="text-blue-600 hover:underline">
              contact support
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

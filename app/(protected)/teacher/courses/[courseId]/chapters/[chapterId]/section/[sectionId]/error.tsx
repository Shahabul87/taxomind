"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("Section page error:", error);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === "production" && error.digest) {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          digest: error.digest,
          message: error.message,
          timestamp: new Date().toISOString(),
          page: "section",
        }),
      }).catch(console.error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-base mt-2">
            We&apos;ve encountered an unexpected error. Our team has been notified and is working on a fix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Details in Development */}
          {process.env.NODE_ENV === "development" && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Development Error Details:
              </p>
              <pre className="text-xs overflow-auto p-3 bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-700">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link href="/teacher/courses" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          {error.digest && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>If this problem persists, please contact support with the error ID:</p>
              <p className="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {error.digest}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

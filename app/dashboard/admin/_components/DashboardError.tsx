"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Dashboard Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            An error occurred while loading the admin dashboard. Please try again.
          </p>
          {error.message && (
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/dashboard/admin"}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

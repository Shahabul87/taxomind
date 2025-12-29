"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logger } from "@/lib/logger";

interface LearnErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error page for the learn route
 * Provides a beautiful error UI with recovery options
 */
export default function LearnError({ error, reset }: LearnErrorProps) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error("Learn page error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            {/* Animated Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 relative"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              {/* Animated ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-300 dark:border-red-700"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Unable to Load Course
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-center">
              We encountered an error while loading your learning dashboard.
              This might be a temporary issue.
            </p>

            {/* Error Details for Development */}
            {process.env.NODE_ENV === "development" && (
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-slate-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Reload Page
                </Button>

                <Button variant="outline" asChild className="flex items-center justify-center gap-2">
                  <Link href="/dashboard">
                    <Home className="w-4 h-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                </Button>
              </div>

              <Button variant="ghost" asChild className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                <Link href="/courses">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Browse All Courses
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              If this problem persists, please try again later or contact support.
            </p>
          </CardContent>
        </Card>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
        </div>
      </motion.div>
    </div>
  );
}

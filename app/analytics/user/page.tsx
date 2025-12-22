"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnterpriseUnifiedAnalytics } from "@/components/analytics/EnterpriseUnifiedAnalytics";
import { AnalyticsErrorBoundary } from "@/components/analytics/ErrorBoundary";
import { AnalyticsDashboardSkeleton } from "@/components/analytics/enterprise/Skeleton";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ExtendedUser } from "@/next-auth";

/**
 * Stable demo user object to prevent unnecessary re-renders.
 * Used when user is not authenticated to display demo analytics data.
 */
const DEMO_USER: ExtendedUser = {
  id: "demo-user",
  name: "Demo User",
  email: "demo@example.com",
  image: null,
  isTwoFactorEnabled: false,
  isOAuth: false,
} satisfies ExtendedUser;

/**
 * Type guard to check if a user object is a valid ExtendedUser.
 */
function isExtendedUser(user: unknown): user is ExtendedUser {
  if (!user || typeof user !== "object") return false;
  const u = user as Partial<ExtendedUser>;
  return (
    typeof u.id === "string" &&
    typeof u.isTwoFactorEnabled === "boolean" &&
    typeof u.isOAuth === "boolean"
  );
}

/**
 * User Analytics Page - Enterprise Edition
 *
 * A completely redesigned analytics dashboard with:
 * - Consolidated navigation (5 main tabs instead of 11)
 * - Enterprise-level design system with cohesive colors
 * - Proper skeleton loading states
 * - Improved empty states with CTAs
 * - Sparkline trends and progress indicators
 * - Clean typography hierarchy
 *
 * Route: `/analytics/user`
 * Access: Public (shows demo data if not authenticated)
 */
export default function UserAnalyticsPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the user to prevent unnecessary re-renders
  const user = useMemo((): ExtendedUser | null => {
    if (status === "loading" || !isInitialized) return null;
    if (session?.user) return session.user;
    return DEMO_USER;
  }, [session?.user, status, isInitialized]);

  // Stable error reset function
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setError("User not authenticated");
      setIsInitialized(true);
      return;
    }

    if (session?.user) {
      setError(null);
      setIsInitialized(true);
    } else {
      setError("No user data available");
      setIsInitialized(true);
    }
  }, [session?.user, status]);

  // Loading state with skeleton
  if (status === "loading") {
    return (
      <MobileLayout
        user={null}
        showHeader={true}
        showSidebar={false}
        showBottomBar={false}
        contentClassName="bg-slate-50 dark:bg-slate-900"
      >
        <div className="p-4 sm:p-6">
          <AnalyticsDashboardSkeleton />
        </div>
      </MobileLayout>
    );
  }

  // Error state when no user
  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
        <Card className="max-w-lg mx-auto mt-12 border-red-200 dark:border-red-800 bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <h2 className="font-semibold text-lg">Unable to Load Analytics</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {error === "User not authenticated"
                ? "Sign in to view your personalized learning analytics and track your progress."
                : "We encountered an issue loading your analytics. This is usually temporary."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {error === "User not authenticated" ? (
                <Button
                  onClick={() => (window.location.href = "/auth/signin")}
                  className="gap-2"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="outline" onClick={resetError}>
                  Try Again
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MobileLayout
      user={user}
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={false}
      contentClassName="bg-slate-50 dark:bg-slate-900"
    >
      {/* Demo mode notice - subtle and non-intrusive */}
      {error && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 px-4 py-2">
          <p className="text-blue-700 dark:text-blue-300 text-sm text-center">
            Viewing demo analytics — <a href="/auth/signin" className="underline font-medium">Sign in</a> for your personalized data
          </p>
        </div>
      )}

      <AnalyticsErrorBoundary>
        <EnterpriseUnifiedAnalytics
          user={user}
          variant="fullpage"
          className="min-h-screen"
        />
      </AnalyticsErrorBoundary>
    </MobileLayout>
  );
}
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImprovedUnifiedAnalytics } from '@/components/analytics/ImprovedUnifiedAnalytics';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { ExtendedUser } from "@/next-auth";
// UserRole removed - users no longer have roles

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
 * Ensures all required fields are present before using the user object.
 *
 * @param user - The user object to validate
 * @returns True if the user is a valid ExtendedUser with all required fields
 *
 * @example
 * ```tsx
 * const user = session?.user;
 * if (isExtendedUser(user)) {
 *   // TypeScript knows user has all ExtendedUser fields
 *   console.log(user.isTwoFactorEnabled);
 * }
 * ```
 */
function isExtendedUser(user: unknown): user is ExtendedUser {
  if (!user || typeof user !== 'object') return false;

  const u = user as Partial<ExtendedUser>;

  return (
    typeof u.id === 'string' &&
    typeof u.isTwoFactorEnabled === 'boolean' &&
    typeof u.isOAuth === 'boolean'
  );
}

/**
 * User Analytics Page Component
 *
 * Main page component for displaying comprehensive user analytics.
 * Handles authentication state, loading states, and error scenarios.
 *
 * Features:
 * - Session-based authentication with fallback to demo mode
 * - Comprehensive analytics dashboard
 * - Mobile-optimized layout with gestures
 * - Error boundary protection
 * - Loading states with proper UX
 *
 * Route: `/analytics/user`
 * Access: Public (shows demo data if not authenticated)
 *
 * @returns Analytics page with full dashboard or appropriate error/loading state
 */
export default function UserAnalyticsPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the user to prevent unnecessary re-renders
  const user = useMemo((): ExtendedUser | null => {
    if (status === "loading" || !isInitialized) return null;

    if (session?.user) {
      return session.user;
    }

    return DEMO_USER;
  }, [session?.user, status, isInitialized]);

  // Stable error reset function
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
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

  if (status === "loading") {
    return (
      <MobileLayout
        user={null}
        showHeader={true}
        showSidebar={false}
        showBottomBar={false}
        contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
      >
        <AnalyticsSkeleton variant="fullpage" />
      </MobileLayout>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <h2 className="font-semibold text-lg">Unable to Load Analytics</h2>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {error === "User not authenticated"
                ? "You need to be signed in to view your personalized analytics."
                : "We encountered an issue loading your analytics dashboard. This is usually temporary."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {error === "User not authenticated" ? (
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/auth/signin'}
                  aria-label="Go to sign in page"
                >
                  <ArrowRight className="w-4 h-4 mr-2" aria-hidden="true" />
                  Sign In
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetError}
                  aria-label="Try loading analytics again"
                >
                  Try Again
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                aria-label="Go to home page"
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
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              {error} — Using demo data for analytics.
            </p>
          </div>
        </div>
      )}

      <AnalyticsErrorBoundary>
        <ImprovedUnifiedAnalytics
          user={user}
          variant="fullpage"
          className="min-h-screen"
        />
      </AnalyticsErrorBoundary>
    </MobileLayout>
  );
}
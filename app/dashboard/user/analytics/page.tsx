'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, ArrowRight, BarChart3, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnterpriseUnifiedAnalytics } from '@/components/analytics/EnterpriseUnifiedAnalytics';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { AnalyticsDashboardSkeleton } from '@/components/analytics/enterprise/Skeleton';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { LearningAnalyticsDashboard } from '../_components/learning-command-center/analytics';
import { ExtendedUser } from '@/next-auth';

/**
 * Stable demo user object to prevent unnecessary re-renders.
 * Used when user is not authenticated to display demo analytics data.
 */
const DEMO_USER: ExtendedUser = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com',
  image: null,
  isTwoFactorEnabled: false,
  isOAuth: false,
} satisfies ExtendedUser;

/**
 * User Analytics Page - Enterprise Edition
 *
 * A comprehensive analytics dashboard with:
 * - Learning Analytics Dashboard (Phase 5) with heatmap, progress, insights
 * - Enterprise Unified Analytics for detailed metrics
 * - Proper skeleton loading states
 * - Improved empty states with CTAs
 *
 * Route: `/dashboard/user/analytics`
 * Access: Public (shows demo data if not authenticated)
 */
export default function UserAnalyticsPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'learning' | 'detailed'>('learning');

  // Memoize the user to prevent unnecessary re-renders
  const user = useMemo((): ExtendedUser | null => {
    if (status === 'loading' || !isInitialized) return null;
    if (session?.user) return session.user;
    return DEMO_USER;
  }, [session?.user, status, isInitialized]);

  // Stable error reset function
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setError('User not authenticated');
      setIsInitialized(true);
      return;
    }

    if (session?.user) {
      setError(null);
      setIsInitialized(true);
    } else {
      setError('No user data available');
      setIsInitialized(true);
    }
  }, [session?.user, status]);

  // Loading state with skeleton
  if (status === 'loading') {
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
      <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-900 sm:p-6">
        <Card className="mx-auto mt-12 max-w-lg border-red-200 bg-white dark:border-red-800 dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Unable to Load Analytics</h2>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              {error === 'User not authenticated'
                ? 'Sign in to view your personalized learning analytics and track your progress.'
                : 'We encountered an issue loading your analytics. This is usually temporary.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {error === 'User not authenticated' ? (
                <Button
                  onClick={() => (window.location.href = '/auth/signin')}
                  className="gap-2"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" onClick={resetError}>
                  Try Again
                </Button>
              )}
              <Button variant="ghost" onClick={() => (window.location.href = '/')}>
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
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-center text-sm text-blue-700 dark:text-blue-300">
            Viewing demo analytics —{' '}
            <a href="/auth/signin" className="font-medium underline">
              Sign in
            </a>{' '}
            for your personalized data
          </p>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Analytics View Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100/80 dark:bg-slate-800/80">
            <TabsTrigger value="learning" className="gap-2">
              <Brain className="h-4 w-4" />
              Learning Insights
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Detailed Analytics
            </TabsTrigger>
          </TabsList>

          {/* Learning Analytics Tab (Phase 5) */}
          <TabsContent value="learning">
            <AnalyticsErrorBoundary>
              <LearningAnalyticsDashboard
                defaultTab="overview"
                onRefresh={async () => {
                  // Could trigger API refresh here
                  console.log('Refreshing learning analytics...');
                }}
              />
            </AnalyticsErrorBoundary>
          </TabsContent>

          {/* Detailed Analytics Tab (Enterprise) */}
          <TabsContent value="detailed">
            <AnalyticsErrorBoundary>
              <EnterpriseUnifiedAnalytics
                user={user}
                variant="fullpage"
                className="min-h-screen"
              />
            </AnalyticsErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}

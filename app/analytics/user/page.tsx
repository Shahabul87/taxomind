"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { User } from "next-auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImprovedUnifiedAnalytics } from '@/components/analytics/ImprovedUnifiedAnalytics';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

// Stable demo user object to prevent unnecessary re-renders
const DEMO_USER: User = {
  id: "demo-user",
  name: "Demo User",
  email: "demo@example.com",
  image: null,
  role: "USER"
} as User;

export default function UserAnalyticsPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the user to prevent unnecessary re-renders
  const user = useMemo(() => {
    if (status === "loading" || !isInitialized) return null;
    
    if (session?.user) {
      return session.user as User;
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error Loading Analytics</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetError}
              className="mt-4"
            >
              Reset
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Smart Header */}
      <SmartHeader user={user as any} />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Smart Sidebar - Fixed position with 72px collapsed width */}
        <SmartSidebar user={user as any} />

        {/* Main Content Area - Left padding matches collapsed sidebar width (72px) */}
        <main className="flex-1 pt-16 pl-[72px] transition-all duration-300">
          {/* Debug Info */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed top-20 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs">
              <p>Session User Role: {session?.user?.role || "No role"}</p>
              <p>Is Admin: {session?.user?.role === "ADMIN" ? "Yes" : "No"}</p>
            </div>
          )}

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
              user={user as any}
              variant="fullpage"
              className="min-h-screen"
            />
          </AnalyticsErrorBoundary>
        </main>
      </div>
    </div>
  );
}
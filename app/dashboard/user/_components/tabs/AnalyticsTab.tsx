"use client";

import { User } from "next-auth";
import { ImprovedUnifiedAnalytics } from '@/components/analytics/ImprovedUnifiedAnalytics';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';

interface AnalyticsTabProps {
  user: User;
}

export function AnalyticsTab({ user }: AnalyticsTabProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <AnalyticsErrorBoundary>
        <ImprovedUnifiedAnalytics 
          user={user} 
          variant="dashboard"
          className="min-h-[600px]"
        />
      </AnalyticsErrorBoundary>
    </div>
  );
}
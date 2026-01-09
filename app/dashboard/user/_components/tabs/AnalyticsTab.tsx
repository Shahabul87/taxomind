'use client';

import { User } from 'next-auth';
import { LearningAnalyticsDashboard } from '../learning-command-center/analytics';

interface AnalyticsTabProps {
  user: User;
}

export function AnalyticsTab({ user }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <LearningAnalyticsDashboard
        defaultTab="overview"
        onRefresh={async () => {
          // Trigger data refresh
          console.log('Refreshing analytics data...');
        }}
        onExport={() => {
          // Export analytics data
          console.log('Exporting analytics data...');
        }}
      />
    </div>
  );
}

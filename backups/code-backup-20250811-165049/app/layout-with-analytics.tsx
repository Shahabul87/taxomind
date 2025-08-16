// Example: Root Layout with Analytics Provider

import { AnalyticsProvider } from '@/lib/analytics/analytics-provider';
import { auth } from '@/auth';

export default async function RootLayoutWithAnalytics({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <AnalyticsProvider
          config={{
            enabled: true, // Can be controlled by environment variable
            debug: process.env.NODE_ENV === 'development',
            endpoint: '/api/analytics/events'
          }}
        >
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
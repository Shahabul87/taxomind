import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { currentUser } from '@/lib/auth';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { PracticeClient } from './_components/PracticeClient';

/**
 * Loading skeleton for the practice dashboard
 */
function PracticeDashboardSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-slate-500 dark:text-slate-400">
          Loading your practice dashboard...
        </p>
      </div>
    </div>
  );
}

/**
 * 10,000 Hour Practice Dashboard Page
 *
 * A comprehensive practice tracking dashboard that visualizes the user&apos;s
 * journey toward mastery (10,000 hours of deliberate practice) with:
 * - Real-time session tracking
 * - GitHub-style practice heatmaps
 * - Skill mastery progress cards
 * - Milestone achievements
 * - Leaderboards
 * - SAM AI recommendations
 *
 * Route: /dashboard/user/practice
 * Access: Authenticated users only
 */
export default async function PracticeDashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/signin?callbackUrl=/dashboard/user/practice');
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
      <div className="p-4 sm:p-6">
        <Suspense fallback={<PracticeDashboardSkeleton />}>
          <PracticeClient userId={user.id} />
        </Suspense>
      </div>
    </MobileLayout>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: '10,000 Hour Practice | Taxomind',
  description:
    'Track your journey to mastery with deliberate practice tracking, skill progress, and milestone achievements.',
};

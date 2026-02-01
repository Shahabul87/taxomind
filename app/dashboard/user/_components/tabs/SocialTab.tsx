'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { FeatureGate } from '@/lib/dashboard/FeatureGate';

// Social Learning Components
import { SocialLearningHub } from '@/components/sam/social-learning-hub';
import { PeerLearningHub } from '@/components/sam/PeerLearningHub';
import { ActiveLearnersWidget } from '@/components/sam/presence/ActiveLearnersWidget';
import { StudyBuddyChat } from '@/components/sam/study-buddy-chat';
import { StudyBuddyFinder } from '@/components/sam/StudyBuddyFinder';
import { CollaborationSpace } from '@/components/sam/CollaborationSpace';
import { SocialLearningFeed } from '@/components/sam/SocialLearningFeed';
import { RealtimeCollaborationWidget } from '@/components/sam/RealtimeCollaborationWidget';

interface SocialTabProps {
  userId: string;
}

export function SocialTab({ userId }: SocialTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-slate-900 dark:via-pink-900/10 dark:to-rose-900/10">
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        <FeatureGate feature="SOCIAL_TAB_ENABLED">
          {/* Social Learning Hub - Unified social experience */}
          <div className="mb-6 sm:mb-8">
            <SocialLearningHub userId={userId} />
          </div>

          {/* Peer Learning & Active Learners */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <PeerLearningHub />
            <ActiveLearnersWidget />
          </div>

          {/* Study Buddy */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <StudyBuddyFinder />
            <StudyBuddyChat userId={userId} />
          </div>

          {/* Collaboration Space */}
          <div className="mb-6 sm:mb-8">
            <CollaborationSpace />
          </div>

          {/* Social Feed & Realtime Collaboration */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <SocialLearningFeed />
            <RealtimeCollaborationWidget />
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}

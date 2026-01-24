'use client';

import React from 'react';
import type { User as NextAuthUser } from 'next-auth';

// Social Learning Hub
import { SocialLearningHub } from '@/components/sam/social-learning-hub';

// Study Buddy Components
import { StudyBuddyFinder } from '@/components/sam/StudyBuddyFinder';
import { StudyBuddyChat } from '@/components/sam/study-buddy-chat';

// Collaboration Components
import { CollaborationSpace } from '@/components/sam/CollaborationSpace';
import { PeerLearningHub } from '@/components/sam/PeerLearningHub';
import { RealtimeCollaborationWidget } from '@/components/sam/RealtimeCollaborationWidget';

// Community & Presence
import { ActiveLearnersWidget } from '@/components/sam/presence';
import { LeaderboardWidget } from '@/components/sam/LeaderboardWidget';
import { SocialLearningFeed } from '@/components/sam/SocialLearningFeed';

interface SocialSubTabProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
  };
}

export function SocialSubTab({ user }: SocialSubTabProps) {
  return (
    <div className="space-y-6">
      {/* Social Learning Hub - Main social center */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🌐</span> Social Learning Hub
        </h2>
        <SocialLearningHub userId={user.id ?? ''} />
      </section>

      {/* Study Buddy Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">👥</span> Study Buddies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Find Study Partners */}
          <StudyBuddyFinder
            userId={user.id ?? ''}
            courseId=""
            maxBuddies={6}
            className="min-h-[400px]"
          />

          {/* Study Buddy Chat */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 overflow-hidden">
            <StudyBuddyChat
              userId={user.id ?? ''}
              className="h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🤝</span> Collaboration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Collaboration Space */}
          <CollaborationSpace
            userId={user.id ?? ''}
            className="min-h-[400px]"
          />

          {/* Peer Learning Hub */}
          <PeerLearningHub
            userId={user.id ?? ''}
            className="min-h-[400px]"
          />
        </div>
      </section>

      {/* Realtime & Community Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔴</span> Live Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Realtime Collaboration */}
          <RealtimeCollaborationWidget />

          {/* Active Learners */}
          <ActiveLearnersWidget courseId="" maxUsers={10} />

          {/* Leaderboard */}
          <LeaderboardWidget
            period="weekly"
            scope="global"
            limit={10}
            showCurrentUser={true}
          />
        </div>
      </section>

      {/* Social Feed Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📰</span> Learning Feed
        </h2>
        <SocialLearningFeed userId={user.id ?? ''} className="w-full" />
      </section>
    </div>
  );
}

export default SocialSubTab;

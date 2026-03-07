'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProfilePageLayout } from './_components/ProfilePageLayout';
import { ProfileHeader } from './_components/ProfileHeader';
import { OverviewTab } from './_components/OverviewTab';
import { CoursesTab } from './_components/CoursesTab';
import { AchievementsTab } from './_components/AchievementsTab';
import { SkillsTab } from './_components/SkillsTab';
import { ActivityTab } from './_components/ActivityTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { UserProfile } from './_components/types';

const TAB_TRIGGER_CLASS =
  'data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 py-1.5 sm:py-2';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }
  }, [status]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/profile');
        const result = await response.json();

        if (!response.ok) {
          const errorMsg = result.error?.message || `API returned ${response.status}`;
          console.error('[Profile] API Error:', {
            status: response.status,
            error: result.error,
          });
          toast({
            title: 'Error',
            description: errorMsg,
            variant: 'destructive',
          });
          return;
        }

        if (result.success && result.data) {
          setProfile(result.data);
        } else {
          toast({
            title: 'Error',
            description: result.error?.message || 'Failed to load profile data',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('[Profile] Fetch error:', error);
        toast({
          title: 'Error',
          description: `Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, toast]);

  if (!isMounted || status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="animate-spin rounded-full h-10 w-10 xs:h-12 xs:w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Unable to Load Profile
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 break-words">
            We encountered an issue loading your profile data. Please try again.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="h-9 sm:h-10 text-xs sm:text-sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProfilePageLayout>
      <div className="min-h-screen pb-24 sm:pb-0">
        <ProfileHeader profile={profile} />

        {/* Tabs */}
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4 sm:space-y-6 md:space-y-8"
            >
              <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <TabsTrigger value="overview" className={TAB_TRIGGER_CLASS}>
                  Overview
                </TabsTrigger>
                <TabsTrigger value="courses" className={TAB_TRIGGER_CLASS}>
                  Courses
                </TabsTrigger>
                <TabsTrigger value="achievements" className={TAB_TRIGGER_CLASS}>
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="skills" className={TAB_TRIGGER_CLASS}>
                  Skills
                </TabsTrigger>
                <TabsTrigger value="activity" className={TAB_TRIGGER_CLASS}>
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6 md:space-y-8">
                <OverviewTab profile={profile} />
              </TabsContent>

              <TabsContent value="courses" className="space-y-4 sm:space-y-6 md:space-y-8">
                <CoursesTab courses={profile.courses} />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4 sm:space-y-6 md:space-y-8">
                <AchievementsTab achievements={profile.achievements} />
              </TabsContent>

              <TabsContent value="skills" className="space-y-4 sm:space-y-6 md:space-y-8">
                <SkillsTab skills={profile.skills} />
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 sm:space-y-6 md:space-y-8">
                <ActivityTab activities={profile.recentActivity} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </ProfilePageLayout>
  );
}

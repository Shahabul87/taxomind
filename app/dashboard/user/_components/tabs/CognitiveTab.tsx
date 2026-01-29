'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { User } from 'next-auth';
import {
  Brain,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  CognitiveProfileCard,
  CognitiveJourneyTracker,
  LevelUpCelebration,
} from '@/components/learner';

interface CognitiveProfile {
  id: string;
  userId: string;
  overallLevel: number;
  levelName: string;
  levelNumber: number;
  distribution: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  xp: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  levels: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  growth: {
    startingLevel: number | null;
    peakLevel: number | null;
    totalGrowth: number;
  };
  strengths: string[];
  growthArea: string | null;
  totalActivities: number;
  lastActivityAt: string | null;
  recentMilestones: Array<{
    id: string;
    type: string;
    level: string;
    title: string;
    description: string | null;
    achievedAt: string;
    xpAwarded: number;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    level: string;
    courseId?: string;
  }>;
}

interface CognitiveTabProps {
  user: User;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[300px] rounded-xl" />
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );
}

export function CognitiveTab({ user }: CognitiveTabProps) {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const previousLevelRef = useRef<number | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/cognitive-profile');
      const data = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching cognitive profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recalculateProfile = useCallback(async () => {
    if (!profile) return;

    setIsRecalculating(true);
    previousLevelRef.current = profile.levelNumber;

    try {
      const response = await fetch('/api/user/cognitive-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        const newProfile = data.data;
        setProfile(newProfile);

        if (
          previousLevelRef.current !== null &&
          newProfile.levelNumber > previousLevelRef.current
        ) {
          setShowLevelUp(true);
        } else {
          toast.success('Profile updated!');
        }
      }
    } catch (error) {
      console.error('Error recalculating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsRecalculating(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Build Your Cognitive Profile
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
              Complete learning activities, take quizzes, and engage with course content to start
              building your cognitive profile. We&apos;ll track your growth across Bloom&apos;s
              Taxonomy levels.
            </p>
            <Button asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Level Up Celebration */}
      <LevelUpCelebration
        isVisible={showLevelUp}
        previousLevel={previousLevelRef.current ?? profile.overallLevel}
        newLevel={profile.overallLevel}
        previousLevelName={
          previousLevelRef.current
            ? ['Rememberer', 'Understander', 'Applier', 'Analyzer', 'Evaluator', 'Creator'][
                (previousLevelRef.current ?? 1) - 1
              ]
            : profile.levelName
        }
        newLevelName={profile.levelName}
        xpEarned={500}
        onClose={() => setShowLevelUp(false)}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cognitive Profile
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Track your thinking growth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={recalculateProfile}
            disabled={isRecalculating}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Updating...' : 'Refresh'}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/user/cognitive-profile">
              Full View
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Profile Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <CognitiveProfileCard profile={profile} />
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {profile.overallLevel.toFixed(1)}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Current Level</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              +{profile.growth.totalGrowth.toFixed(1)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Total Growth</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {profile.totalActivities}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">Activities</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {profile.strengths.length}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Strengths</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations */}
      {profile.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.recommendations.slice(0, 2).map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    {rec.type === 'growth_area' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                        {rec.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {rec.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {rec.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Achievements */}
      {profile.recentMilestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {profile.recentMilestones.slice(0, 3).map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex-shrink-0 w-40 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        +{milestone.xpAwarded} XP
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                      {milestone.title}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

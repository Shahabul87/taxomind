'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, RefreshCw, Sparkles, BookOpen, Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  CognitiveProfileCard,
  CognitiveJourneyTracker,
  LevelUpCelebration,
} from '@/components/learner';

// Types
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

// Loading Skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );
}

export default function CognitiveProfilePage() {
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
      } else {
        toast.error(data.error?.message || 'Failed to load cognitive profile');
      }
    } catch (error) {
      console.error('Error fetching cognitive profile:', error);
      toast.error('Failed to load cognitive profile');
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

        // Check for level-up
        if (
          previousLevelRef.current !== null &&
          newProfile.levelNumber > previousLevelRef.current
        ) {
          setShowLevelUp(true);
        } else {
          toast.success('Cognitive profile updated!');
        }
      } else {
        toast.error(data.error?.message || 'Failed to recalculate profile');
      }
    } catch (error) {
      console.error('Error recalculating profile:', error);
      toast.error('Failed to recalculate profile');
    } finally {
      setIsRecalculating(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20 p-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20 p-6">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Brain className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Cognitive Profile Yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Complete some learning activities to start building your cognitive profile.
          </p>
          <Button asChild>
            <Link href="/dashboard/user">
              Start Learning
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20">
      {/* Level Up Celebration Modal */}
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

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Your Cognitive Profile
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track your thinking growth across Bloom&apos;s Taxonomy
            </p>
          </div>

          <Button
            onClick={recalculateProfile}
            disabled={isRecalculating}
            variant="outline"
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Updating...' : 'Recalculate'}
          </Button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cognitive Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CognitiveProfileCard profile={profile} />
          </motion.div>

          {/* Cognitive Journey Tracker */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CognitiveJourneyTracker
              levels={profile.levels}
              xp={profile.xp}
              currentLevelNumber={profile.levelNumber}
            />
          </motion.div>
        </div>

        {/* Recommendations Section */}
        {profile.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <CardTitle>Recommended Next Steps</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-purple-500 text-white">
                          {rec.type === 'growth_area' ? (
                            <Target className="h-5 w-5" />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900 dark:text-white truncate">
                              {rec.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {rec.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Milestones */}
        {profile.recentMilestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <CardTitle>Recent Achievements</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.recentMilestones.map((milestone, i) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {milestone.title}
                          </h4>
                          {milestone.xpAwarded > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            >
                              +{milestone.xpAwarded} XP
                            </Badge>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 shrink-0">
                        {new Date(milestone.achievedAt).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Link href="/dashboard/user/my-courses">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Continue Learning
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Complete activities to grow your cognitive profile
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/courses">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <Target className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Find New Challenges
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Explore courses with higher-order thinking activities
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CognitiveProfileCard } from './cognitive-profile-card';
import { CognitiveJourneyTracker } from './cognitive-journey-tracker';
import { TrendingUp, Trophy, Award, Sparkles } from 'lucide-react';

interface CognitiveProfileDashboardProps {
  userId: string;
}

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

export function CognitiveProfileDashboard({ userId }: CognitiveProfileDashboardProps) {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/user/cognitive-profile');
      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.error?.message || 'Failed to load profile');
      }
    } catch {
      setError('Failed to load cognitive profile');
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateProfile = async () => {
    try {
      setIsRecalculating(true);
      const response = await fetch('/api/user/cognitive-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.error?.message || 'Failed to recalculate');
      }
    } catch {
      setError('Failed to recalculate profile');
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {error || 'Unable to load profile'}
          </h2>
          <Button onClick={fetchProfile} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Your Cognitive Profile
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Track your thinking growth across Bloom&apos;s Taxonomy
              </p>
            </div>
          </div>
          <Button
            onClick={recalculateProfile}
            disabled={isRecalculating}
            variant="outline"
            className="gap-2"
          >
            {isRecalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalculate
          </Button>
        </div>
      </motion.div>

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 sm:mb-8"
      >
        <CognitiveProfileCard profile={profile} />
      </motion.div>

      {/* Two Column Layout: Journey Tracker & Growth Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Journey Tracker */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CognitiveJourneyTracker
            levels={profile.levels}
            xp={profile.xp}
            currentLevelNumber={profile.levelNumber}
          />
        </motion.div>

        {/* Growth Summary & Milestones */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle className="text-lg font-semibold">
                  Growth Summary
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Growth Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
                  <Sparkles className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    +{profile.growth.totalGrowth.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Total Growth</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                  <Award className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {profile.growth.peakLevel?.toFixed(1) || profile.overallLevel.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Peak Level</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                  <Brain className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {profile.totalActivities}
                  </div>
                  <div className="text-xs text-slate-500">Activities</div>
                </div>
              </div>

              {/* Recent Milestones */}
              {profile.recentMilestones.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>Recent Milestones</span>
                  </div>
                  <div className="space-y-2">
                    {profile.recentMilestones.slice(0, 3).map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white text-sm">
                            {milestone.title}
                          </div>
                          {milestone.description && (
                            <div className="text-xs text-slate-500 truncate">
                              {milestone.description}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          +{milestone.xpAwarded} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for milestones */}
              {profile.recentMilestones.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Complete activities to earn milestones!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations Section */}
      {profile.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            🎯 Recommended Next Steps
          </h3>
          <div className="space-y-3">
            {profile.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {rec.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {rec.description}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {rec.level}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

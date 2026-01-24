'use client';

/**
 * SkillBuildTrackerConnected
 *
 * Connected version of SkillBuildTracker that fetches real data from the API.
 * Uses the skill-build-track hooks to get user's skill profiles, roadmaps,
 * and handle practice session logging.
 */

import { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Rocket, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SkillBuildTracker from './skill-build-tracker';
import {
  useSkillProfiles,
  useRecordPractice,
  useSkillRoadmap,
  useDecayPredictions,
  useSkillInsights,
} from '@/hooks/use-skill-build-track';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API Response Types - These match what the hooks return
 */
interface ApiSkillProfile {
  id: string;
  userId: string;
  skillId: string;
  skill?: {
    name?: string;
    category?: string;
  };
  dimensions?: {
    mastery?: number;
    retention?: number;
    application?: number;
    confidence?: number;
    calibration?: number;
  };
  compositeScore?: number;
  proficiencyLevel?: string;
  velocity?: {
    trend?: string;
    learningSpeed?: number;
    sessionsToNextLevel?: number;
    daysToNextLevel?: number;
    acceleration?: number;
  };
  decay?: {
    riskLevel?: string;
    daysUntilLevelDrop?: number;
    recommendedReviewDate?: string;
    daysSinceLastPractice?: number;
  };
  practiceHistory?: {
    currentStreak?: number;
    longestStreak?: number;
    totalSessions?: number;
    totalMinutes?: number;
    averageScore?: number;
    bestScore?: number;
    lastPracticedAt?: string;
  };
}

interface ApiRoadmap {
  id: string;
  title: string;
  description?: string;
  status?: string;
  totalEstimatedHours?: number;
  completionPercentage?: number;
  targetCompletionDate?: string;
  milestones?: Array<{
    id: string;
    title: string;
    description?: string;
    status?: string;
    targetDate?: string;
    skills?: Array<{
      skillId?: string;
      skillName?: string;
      targetLevel?: string;
      currentLevel?: string;
      progress?: number;
    }>;
    estimatedHours?: number;
    actualHours?: number;
  }>;
}

// Component Props Types
type ComponentProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

type ComponentSkillCategory =
  | 'TECHNICAL'
  | 'SOFT'
  | 'DOMAIN'
  | 'TOOL'
  | 'METHODOLOGY'
  | 'CERTIFICATION'
  | 'LEADERSHIP';

type ComponentDecayRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type ComponentVelocityTrend = 'ACCELERATING' | 'STEADY' | 'SLOWING' | 'STAGNANT' | 'DECLINING';

interface ComponentSkillDimensions {
  mastery: number;
  retention: number;
  application: number;
  confidence: number;
  calibration: number;
}

interface ComponentSkillProfile {
  id: string;
  skillId: string;
  skillName: string;
  category: ComponentSkillCategory;
  dimensions: ComponentSkillDimensions;
  compositeScore: number;
  proficiencyLevel: ComponentProficiencyLevel;
  decayRisk: ComponentDecayRisk;
  daysUntilReview: number;
  streak: number;
  velocityTrend: ComponentVelocityTrend;
  lastPracticedAt?: Date;
}

interface ComponentMilestone {
  id: string;
  title: string;
  description: string;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  targetDate?: Date;
  skills: Array<{ name: string; targetLevel: ComponentProficiencyLevel }>;
}

interface ComponentRoadmap {
  id: string;
  title: string;
  completionPercentage: number;
  totalHours: number;
  remainingHours: number;
  targetDate?: Date;
  milestones: ComponentMilestone[];
}

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Validate and cast proficiency level
 */
function toComponentProficiencyLevel(level?: string): ComponentProficiencyLevel {
  const validLevels: ComponentProficiencyLevel[] = [
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
  ];
  if (level && validLevels.includes(level as ComponentProficiencyLevel)) {
    return level as ComponentProficiencyLevel;
  }
  return 'NOVICE';
}

/**
 * Validate and cast skill category
 */
function toComponentCategory(category?: string): ComponentSkillCategory {
  const validCategories: ComponentSkillCategory[] = [
    'TECHNICAL', 'SOFT', 'DOMAIN', 'TOOL', 'METHODOLOGY', 'CERTIFICATION', 'LEADERSHIP'
  ];
  if (category && validCategories.includes(category as ComponentSkillCategory)) {
    return category as ComponentSkillCategory;
  }
  return 'TECHNICAL';
}

/**
 * Validate and cast decay risk
 */
function toComponentDecayRisk(risk?: string): ComponentDecayRisk {
  const validRisks: ComponentDecayRisk[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (risk && validRisks.includes(risk as ComponentDecayRisk)) {
    return risk as ComponentDecayRisk;
  }
  return 'LOW';
}

/**
 * Validate and cast velocity trend
 */
function toComponentVelocityTrend(trend?: string): ComponentVelocityTrend {
  const validTrends: ComponentVelocityTrend[] = [
    'ACCELERATING', 'STEADY', 'SLOWING', 'STAGNANT', 'DECLINING'
  ];
  if (trend && validTrends.includes(trend as ComponentVelocityTrend)) {
    return trend as ComponentVelocityTrend;
  }
  return 'STAGNANT';
}

/**
 * Transform API skill profile to component format
 */
function transformApiProfile(apiProfile: ApiSkillProfile): ComponentSkillProfile {
  // Extract skill name from skill definition if available
  const skillName = apiProfile.skill?.name || apiProfile.skillId || 'Unknown Skill';

  // Extract category from skill definition if available
  const category = toComponentCategory(apiProfile.skill?.category);

  // Map decay risk level
  const decayRisk = toComponentDecayRisk(apiProfile.decay?.riskLevel);

  // Map velocity trend
  const velocityTrend = toComponentVelocityTrend(apiProfile.velocity?.trend);

  // Map proficiency level
  const proficiencyLevel = toComponentProficiencyLevel(apiProfile.proficiencyLevel);

  return {
    id: apiProfile.id,
    skillId: apiProfile.skillId,
    skillName,
    category,
    dimensions: {
      mastery: apiProfile.dimensions?.mastery ?? 0,
      retention: apiProfile.dimensions?.retention ?? 0,
      application: apiProfile.dimensions?.application ?? 0,
      confidence: apiProfile.dimensions?.confidence ?? 50,
      calibration: apiProfile.dimensions?.calibration ?? 50,
    },
    compositeScore: apiProfile.compositeScore ?? 0,
    proficiencyLevel,
    decayRisk,
    daysUntilReview: apiProfile.decay?.daysUntilLevelDrop ?? 30,
    streak: apiProfile.practiceHistory?.currentStreak ?? 0,
    velocityTrend,
    lastPracticedAt: apiProfile.practiceHistory?.lastPracticedAt
      ? new Date(apiProfile.practiceHistory.lastPracticedAt)
      : undefined,
  };
}

/**
 * Validate and cast milestone status
 */
function toMilestoneStatus(status?: string): 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' {
  const validStatuses = ['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED'] as const;
  if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
    return status as (typeof validStatuses)[number];
  }
  return 'LOCKED';
}

/**
 * Transform API roadmap to component format
 */
function transformApiRoadmap(apiRoadmap: ApiRoadmap): ComponentRoadmap {
  const totalHours = apiRoadmap.totalEstimatedHours ?? 0;
  const completionPercentage = apiRoadmap.completionPercentage ?? 0;
  const remainingHours = totalHours * (1 - completionPercentage / 100);

  return {
    id: apiRoadmap.id,
    title: apiRoadmap.title,
    completionPercentage,
    totalHours,
    remainingHours,
    targetDate: apiRoadmap.targetCompletionDate
      ? new Date(apiRoadmap.targetCompletionDate)
      : undefined,
    milestones: (apiRoadmap.milestones ?? []).map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? '',
      status: toMilestoneStatus(milestone.status),
      targetDate: milestone.targetDate ? new Date(milestone.targetDate) : undefined,
      skills: (milestone.skills ?? []).map((skill) => ({
        name: skill.skillName ?? 'Unknown',
        targetLevel: toComponentProficiencyLevel(skill.targetLevel),
      })),
    })),
  };
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  onCreateRoadmap: () => void;
  isGenerating: boolean;
  error?: string | null;
}

function EmptyState({ onCreateRoadmap, isGenerating, error }: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-500/20 dark:to-emerald-500/20 flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Start Your Skill Journey
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                You haven&apos;t tracked any skills yet. Create a learning roadmap to begin building and tracking your skills.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Track Progress</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Monitor your skill development with multi-dimensional scoring
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl mb-2">⏰</div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Prevent Decay</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Get alerts when skills need review to maintain mastery
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Reach Goals</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Follow personalized roadmaps to achieve your targets
                    </p>
                  </div>
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm mb-4">
                    {error}
                  </div>
                )}
                <Button
                  onClick={onCreateRoadmap}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 shadow-md disabled:opacity-70"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Roadmap...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Roadmap
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse" />
          <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-white animate-spin" />
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading your skills...</p>
      </motion.div>
    </div>
  );
}

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="max-w-lg mx-auto pt-20">
        <Alert variant="destructive" className="border-red-200 dark:border-red-500/30">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Failed to load skills</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-4 w-full"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CONNECTED COMPONENT
// ============================================================================

export interface SkillBuildTrackerConnectedProps {
  /** Optional callback when a skill review is started */
  onStartReview?: (skillId: string) => void;
}

export default function SkillBuildTrackerConnected({
  onStartReview,
}: SkillBuildTrackerConnectedProps = {}) {
  const [showRoadmapWizard, setShowRoadmapWizard] = useState(false);

  // Fetch skill profiles
  const {
    profiles: apiProfiles,
    stats,
    isLoading: isLoadingProfiles,
    error: profilesError,
    refetch: refetchProfiles,
  } = useSkillProfiles({
    includeDecayRisks: true,
    limit: 100,
  });

  // Fetch decay predictions
  const {
    predictions: decayPredictions,
    isLoading: isLoadingDecay,
  } = useDecayPredictions({
    daysAhead: 30,
    includeReviewSchedule: true,
  });

  // Record practice mutation
  const {
    recordPractice,
    isRecording,
    lastResult: practiceResult,
  } = useRecordPractice();

  // Roadmap generation
  const {
    roadmap: apiRoadmap,
    progress: roadmapProgress,
    generateRoadmap,
    isGenerating,
  } = useSkillRoadmap();

  // Insights for recommendations
  const {
    insights,
    isLoading: isLoadingInsights,
  } = useSkillInsights({
    includeRecommendations: true,
    includeNextActions: true,
  });

  // Transform API profiles to component format
  const profiles = useMemo(() => {
    if (!apiProfiles || apiProfiles.length === 0) return [];

    // Cast API profiles to our expected shape and transform
    return apiProfiles.map((profile) =>
      transformApiProfile(profile as unknown as ApiSkillProfile)
    );
  }, [apiProfiles]);

  // Transform roadmap to component format
  const roadmap = useMemo(() => {
    if (!apiRoadmap) return undefined;
    // Cast API roadmap to our expected shape and transform
    return transformApiRoadmap(apiRoadmap as unknown as ApiRoadmap);
  }, [apiRoadmap]);

  // Calculate computed stats
  const computedStats = useMemo(() => {
    if (!stats) {
      return {
        totalSkills: profiles.length,
        averageScore: profiles.length > 0
          ? profiles.reduce((sum, p) => sum + p.compositeScore, 0) / profiles.length
          : 0,
        currentStreak: profiles.length > 0
          ? Math.max(...profiles.map(p => p.streak))
          : 0,
        atRiskCount: profiles.filter(p => p.decayRisk === 'HIGH' || p.decayRisk === 'CRITICAL').length,
      };
    }

    return {
      totalSkills: stats.totalSkills,
      averageScore: stats.averageScore,
      currentStreak: profiles.length > 0
        ? Math.max(...profiles.map(p => p.streak))
        : 0,
      atRiskCount: stats.atRiskCount,
    };
  }, [stats, profiles]);

  // Handle practice recording
  const handleRecordPractice = useCallback(async (data: {
    skillId: string;
    duration: number;
    score?: number;
    isAssessment: boolean;
    notes?: string;
  }) => {
    try {
      await recordPractice({
        skillId: data.skillId,
        durationMinutes: data.duration,
        score: data.score,
        isAssessment: data.isAssessment,
        notes: data.notes,
      });

      // Refetch profiles to get updated data
      await refetchProfiles();
    } catch (error) {
      console.error('Failed to record practice:', error);
      throw error;
    }
  }, [recordPractice, refetchProfiles]);

  // Handle completing a review (spaced repetition)
  const handleCompleteReview = useCallback(async (data: {
    skillId: string;
    confidence: number;
    quality: 'EASY' | 'GOOD' | 'HARD' | 'AGAIN';
    notes?: string;
  }) => {
    try {
      // Map quality to score for the practice record
      const qualityToScore: Record<string, number> = {
        'AGAIN': 30,   // Need more practice - low score
        'HARD': 50,    // Struggled - medium-low score
        'GOOD': 75,    // Recalled with effort - good score
        'EASY': 95,    // Instant recall - excellent score
      };

      // Record the review as a practice session with the mapped score
      await recordPractice({
        skillId: data.skillId,
        durationMinutes: 5, // Review sessions are typically short
        score: qualityToScore[data.quality],
        isAssessment: false,
        notes: data.notes ? `[Review - Confidence: ${data.confidence}/5] ${data.notes}` : `[Review - Confidence: ${data.confidence}/5, Quality: ${data.quality}]`,
      });

      // Refetch profiles to update the UI
      await refetchProfiles();
    } catch (error) {
      console.error('Failed to record review:', error);
      throw error;
    }
  }, [recordPractice, refetchProfiles]);

  // Track roadmap generation error for display
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  // Handle creating a roadmap
  const handleCreateRoadmap = useCallback(async () => {
    try {
      setRoadmapError(null);
      await generateRoadmap({
        targetType: 'SKILL_SET',
        hoursPerWeek: 10,
        preferences: {
          learningStyle: 'MIXED',
          includeAssessments: true,
          prioritizeQuickWins: true,
        },
      });
      setShowRoadmapWizard(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate roadmap';
      setRoadmapError(message);
      console.error('Failed to generate roadmap:', error);
    }
  }, [generateRoadmap]);

  // Combined loading state
  const isLoading = isLoadingProfiles;

  // Handle errors
  if (profilesError) {
    return <ErrorState error={profilesError} onRetry={refetchProfiles} />;
  }

  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show empty state if no profiles AND no roadmap
  if (profiles.length === 0 && !roadmap) {
    return (
      <EmptyState
        onCreateRoadmap={handleCreateRoadmap}
        isGenerating={isGenerating}
        error={roadmapError}
      />
    );
  }

  // Render the skill tracker with real data
  return (
    <SkillBuildTracker
      profiles={profiles}
      roadmap={roadmap}
      totalSkills={computedStats.totalSkills}
      averageScore={computedStats.averageScore}
      currentStreak={computedStats.currentStreak}
      atRiskCount={computedStats.atRiskCount}
      onRecordPractice={handleRecordPractice}
      onStartReview={onStartReview}
      onCompleteReview={handleCompleteReview}
    />
  );
}

'use client';

/**
 * React Hooks for SkillBuildTrack Engine
 * Provides easy-to-use hooks for skill tracking, practice logging,
 * decay predictions, roadmaps, and insights.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  SkillBuildProfile,
  SkillBuildInsights,
  SkillBuildRoadmap,
  SkillBuildPortfolio,
  SkillBuildBenchmark,
  SkillBuildProficiencyLevel,
  SkillBuildCategory,
  SkillBuildRecommendation,
  SkillDecayPrediction,
  RecordPracticeResult,
  SkillBuildAchievement,
} from '@sam-ai/educational';

// ============================================================================
// TYPES
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  action?: string;
  error?: string;
  details?: unknown[];
}

interface UseSkillProfileOptions {
  skillId: string;
  includeEvidence?: boolean;
  includeHistory?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseSkillProfilesOptions {
  category?: SkillBuildCategory;
  minLevel?: SkillBuildProficiencyLevel;
  includeDecayRisks?: boolean;
  limit?: number;
  offset?: number;
}

interface UseDecayPredictionsOptions {
  skillIds?: string[];
  daysAhead?: number;
  includeReviewSchedule?: boolean;
}

interface UseSkillInsightsOptions {
  includeRecommendations?: boolean;
  includeNextActions?: boolean;
  maxRecommendations?: number;
}

interface UseSkillPortfolioOptions {
  includeEmployability?: boolean;
  includeRecommendations?: boolean;
  targetRoleIds?: string[];
}

interface RecordPracticeInput {
  skillId: string;
  durationMinutes: number;
  score?: number;
  maxScore?: number;
  isAssessment?: boolean;
  completed?: boolean;
  sourceId?: string;
  sourceType?: 'COURSE' | 'PROJECT' | 'EXERCISE' | 'ASSESSMENT' | 'REAL_WORLD';
  notes?: string;
}

interface GenerateRoadmapInput {
  targetType: 'ROLE' | 'SKILL_SET' | 'CERTIFICATION' | 'CUSTOM';
  targetId?: string;
  targetSkills?: Array<{ skillId: string; targetLevel: SkillBuildProficiencyLevel }>;
  targetCompletionDate?: Date;
  hoursPerWeek?: number;
  preferences?: {
    learningStyle?: 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';
    includeAssessments?: boolean;
    prioritizeQuickWins?: boolean;
    focusCategories?: SkillBuildCategory[];
  };
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

async function skillBuildTrackApi<T>(
  action: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch('/api/sam/skill-build-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `Request failed with status ${response.status}`,
    };
  }

  return response.json();
}

// ============================================================================
// useSkillProfile - Single skill profile
// ============================================================================

export function useSkillProfile(options: UseSkillProfileOptions) {
  const {
    skillId,
    includeEvidence = true,
    includeHistory = false,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [profile, setProfile] = useState<SkillBuildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        skillId,
        includeEvidence: includeEvidence.toString(),
        includeHistory: includeHistory.toString(),
      });

      const response = await fetch(`/api/sam/skill-build-track?${params}`);
      const data: ApiResponse<SkillBuildProfile> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [skillId, includeEvidence, includeHistory]);

  useEffect(() => {
    fetchProfile();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchProfile, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchProfile, autoRefresh, refreshInterval]);

  return { profile, isLoading, error, refetch: fetchProfile };
}

// ============================================================================
// useSkillProfiles - All user skill profiles
// ============================================================================

export function useSkillProfiles(options: UseSkillProfilesOptions = {}) {
  const { category, minLevel, includeDecayRisks = true, limit = 50, offset = 0 } = options;

  const [profiles, setProfiles] = useState<SkillBuildProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [decayRisks, setDecayRisks] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeDecayRisks: includeDecayRisks.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (category) params.set('category', category);
      if (minLevel) params.set('minLevel', minLevel);

      const response = await fetch(`/api/sam/skill-build-track?${params}`);
      const data: ApiResponse<{
        profiles: SkillBuildProfile[];
        total: number;
        decayRisks?: unknown[];
      }> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch profiles');
      }

      setProfiles(data.data.profiles);
      setTotal(data.data.total);
      setDecayRisks(data.data.decayRisks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [category, minLevel, includeDecayRisks, limit, offset]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Computed stats
  const stats = useMemo(() => {
    if (profiles.length === 0) return null;

    const byLevel: Record<string, number> = {};
    let totalScore = 0;
    let atRisk = 0;

    profiles.forEach((p) => {
      byLevel[p.proficiencyLevel] = (byLevel[p.proficiencyLevel] || 0) + 1;
      totalScore += p.compositeScore;
      if (p.decay.riskLevel === 'HIGH' || p.decay.riskLevel === 'CRITICAL') {
        atRisk++;
      }
    });

    return {
      totalSkills: profiles.length,
      averageScore: totalScore / profiles.length,
      byLevel,
      atRiskCount: atRisk,
    };
  }, [profiles]);

  return { profiles, total, decayRisks, stats, isLoading, error, refetch: fetchProfiles };
}

// ============================================================================
// useRecordPractice - Record a practice session
// ============================================================================

export function useRecordPractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RecordPracticeResult | null>(null);

  const recordPractice = useCallback(async (input: RecordPracticeInput) => {
    try {
      setIsRecording(true);
      setError(null);

      const result = await skillBuildTrackApi<RecordPracticeResult>('record-practice', input);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to record practice');
      }

      setLastResult(result.data);
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsRecording(false);
    }
  }, []);

  return { recordPractice, isRecording, error, lastResult };
}

// ============================================================================
// useDecayPredictions - Get skill decay predictions
// ============================================================================

export function useDecayPredictions(options: UseDecayPredictionsOptions = {}) {
  const { skillIds, daysAhead = 30, includeReviewSchedule = true } = options;

  const [predictions, setPredictions] = useState<SkillDecayPrediction[]>([]);
  const [reviewSchedule, setReviewSchedule] = useState<unknown[]>([]);
  const [overallRisk, setOverallRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await skillBuildTrackApi<{
        predictions: SkillDecayPrediction[];
        reviewSchedule: unknown[];
        overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      }>('get-decay-predictions', { skillIds, daysAhead, includeReviewSchedule });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch predictions');
      }

      setPredictions(result.data.predictions);
      setReviewSchedule(result.data.reviewSchedule);
      setOverallRisk(result.data.overallRisk);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [skillIds, daysAhead, includeReviewSchedule]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Skills needing urgent review
  const urgentReviews = useMemo(() => {
    return predictions.filter(
      (p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
    );
  }, [predictions]);

  return {
    predictions,
    reviewSchedule,
    overallRisk,
    urgentReviews,
    isLoading,
    error,
    refetch: fetchPredictions,
  };
}

// ============================================================================
// useSkillRoadmap - Generate and manage skill roadmaps
// ============================================================================

export function useSkillRoadmap() {
  const [roadmap, setRoadmap] = useState<SkillBuildRoadmap | null>(null);
  const [alternativePaths, setAlternativePaths] = useState<SkillBuildRoadmap[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoadmap = useCallback(async (input: GenerateRoadmapInput) => {
    try {
      setIsGenerating(true);
      setError(null);

      const result = await skillBuildTrackApi<{
        roadmap: SkillBuildRoadmap;
        alternativePaths?: SkillBuildRoadmap[];
        warnings?: string[];
      }>('generate-roadmap', {
        ...input,
        targetCompletionDate: input.targetCompletionDate?.toISOString(),
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate roadmap');
      }

      setRoadmap(result.data.roadmap);
      setAlternativePaths(result.data.alternativePaths || []);

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Computed progress
  const progress = useMemo(() => {
    if (!roadmap) return null;

    const completedMilestones = roadmap.milestones.filter(
      (m) => m.status === 'COMPLETED'
    ).length;
    const inProgressMilestones = roadmap.milestones.filter(
      (m) => m.status === 'IN_PROGRESS'
    ).length;

    return {
      completionPercentage: roadmap.completionPercentage,
      completedMilestones,
      inProgressMilestones,
      totalMilestones: roadmap.milestones.length,
      remainingHours: roadmap.totalEstimatedHours * (1 - roadmap.completionPercentage / 100),
    };
  }, [roadmap]);

  return {
    roadmap,
    alternativePaths,
    progress,
    generateRoadmap,
    isGenerating,
    error,
    clearRoadmap: () => setRoadmap(null),
  };
}

// ============================================================================
// useSkillInsights - Get personalized insights and recommendations
// ============================================================================

export function useSkillInsights(options: UseSkillInsightsOptions = {}) {
  const { includeRecommendations = true, includeNextActions = true, maxRecommendations = 10 } = options;

  const [insights, setInsights] = useState<SkillBuildInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await skillBuildTrackApi<SkillBuildInsights>('get-insights', {
        includeRecommendations,
        includeNextActions,
        maxRecommendations,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch insights');
      }

      setInsights(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [includeRecommendations, includeNextActions, maxRecommendations]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Top priority recommendations
  const topRecommendations = useMemo(() => {
    if (!insights?.recommendations) return [];
    return insights.recommendations
      .filter((r) => r.priority === 'HIGH' || r.priority === 'CRITICAL')
      .slice(0, 5);
  }, [insights]);

  return { insights, topRecommendations, isLoading, error, refetch: fetchInsights };
}

// ============================================================================
// useSkillPortfolio - Get complete skill portfolio with employability
// ============================================================================

export function useSkillPortfolio(options: UseSkillPortfolioOptions = {}) {
  const { includeEmployability = true, includeRecommendations = true, targetRoleIds } = options;

  const [portfolio, setPortfolio] = useState<SkillBuildPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await skillBuildTrackApi<SkillBuildPortfolio>('get-portfolio', {
        includeEmployability,
        includeRecommendations,
        targetRoleIds,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch portfolio');
      }

      setPortfolio(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [includeEmployability, includeRecommendations, targetRoleIds]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { portfolio, isLoading, error, refetch: fetchPortfolio };
}

// ============================================================================
// useSkillBenchmark - Get skill benchmark comparison
// ============================================================================

export function useSkillBenchmark(skillId: string, options?: {
  source?: 'INDUSTRY' | 'ROLE' | 'PEER_GROUP' | 'ORGANIZATION' | 'MARKET';
  roleId?: string;
  industry?: string;
}) {
  const [benchmark, setBenchmark] = useState<SkillBuildBenchmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmark = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await skillBuildTrackApi<SkillBuildBenchmark>('get-benchmark', {
        skillId,
        ...options,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch benchmark');
      }

      setBenchmark(result.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [skillId, options]);

  useEffect(() => {
    fetchBenchmark();
  }, [fetchBenchmark]);

  return { benchmark, isLoading, error, refetch: fetchBenchmark };
}

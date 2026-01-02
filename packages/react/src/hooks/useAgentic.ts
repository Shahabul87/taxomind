/**
 * useAgentic Hook
 * Provides React integration for SAM Agentic AI capabilities
 *
 * Phase 5: Frontend Integration
 * - Goal management (create, list, update, decompose)
 * - Learning recommendations
 * - Progress tracking
 * - Skill assessment
 * - Check-in management
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetDate?: string;
  progress: number;
  context: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    topicIds?: string[];
    skillIds?: string[];
  };
  currentMastery?: string;
  targetMastery?: string;
  subGoals?: SubGoal[];
  createdAt: string;
  updatedAt: string;
}

export interface SubGoal {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  order: number;
  estimatedMinutes?: number;
  completedAt?: string;
}

export interface Plan {
  id: string;
  goalId: string;
  userId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  dailyMinutes: number;
  startDate: string;
  estimatedEndDate?: string;
  steps: PlanStep[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanStep {
  id: string;
  planId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  order: number;
  estimatedMinutes: number;
  scheduledDate?: string;
  completedAt?: string;
}

export interface Recommendation {
  id: string;
  type: 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  targetUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationBatch {
  recommendations: Recommendation[];
  totalEstimatedTime: number;
  generatedAt: string;
  context: {
    availableTime?: number;
    currentGoals?: string[];
    recentTopics?: string[];
  };
}

export interface ProgressReport {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalStudyTime: number;
  sessionsCompleted: number;
  topicsStudied: string[];
  skillsImproved: string[];
  goalsProgress: Array<{
    goalId: string;
    goalTitle: string;
    progressDelta: number;
    currentProgress: number;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  streak: number;
  generatedAt: string;
}

export interface SkillAssessment {
  skillId: string;
  skillName: string;
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  confidence: number;
  lastAssessedAt: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CheckIn {
  id: string;
  userId: string;
  type: string;
  status: 'scheduled' | 'pending' | 'sent' | 'responded' | 'expired';
  message: string;
  questions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'single_choice' | 'multiple_choice' | 'scale' | 'yes_no' | 'emoji';
    options?: string[];
    required?: boolean;
  }>;
  suggestedActions?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
  }>;
  scheduledTime: string;
  respondedAt?: string;
}

export interface UseAgenticOptions {
  /** Auto-fetch goals on mount */
  autoFetchGoals?: boolean;
  /** Auto-fetch recommendations on mount */
  autoFetchRecommendations?: boolean;
  /** Auto-fetch pending check-ins on mount */
  autoFetchCheckIns?: boolean;
  /** Available time for recommendations (minutes) */
  availableTime?: number;
  /** Refresh interval for recommendations (ms) */
  recommendationRefreshInterval?: number;
}

export interface UseAgenticReturn {
  // Goals
  goals: Goal[];
  isLoadingGoals: boolean;
  fetchGoals: (status?: string) => Promise<void>;
  createGoal: (data: CreateGoalData) => Promise<Goal | null>;
  updateGoal: (goalId: string, data: Partial<CreateGoalData>) => Promise<Goal | null>;
  decomposeGoal: (goalId: string) => Promise<Goal | null>;
  deleteGoal: (goalId: string) => Promise<boolean>;

  // Plans
  plans: Plan[];
  isLoadingPlans: boolean;
  fetchPlans: (goalId?: string) => Promise<void>;
  createPlan: (goalId: string, dailyMinutes?: number) => Promise<Plan | null>;
  startPlan: (planId: string) => Promise<boolean>;
  pausePlan: (planId: string) => Promise<boolean>;
  resumePlan: (planId: string) => Promise<boolean>;

  // Recommendations
  recommendations: RecommendationBatch | null;
  isLoadingRecommendations: boolean;
  fetchRecommendations: (availableTime?: number) => Promise<void>;
  dismissRecommendation: (recommendationId: string) => void;

  // Progress
  progressReport: ProgressReport | null;
  isLoadingProgress: boolean;
  fetchProgressReport: (period?: 'daily' | 'weekly' | 'monthly') => Promise<void>;

  // Skills
  skills: SkillAssessment[];
  isLoadingSkills: boolean;
  fetchSkillMap: () => Promise<void>;

  // Check-ins
  checkIns: CheckIn[];
  isLoadingCheckIns: boolean;
  fetchCheckIns: (status?: string) => Promise<void>;
  respondToCheckIn: (checkInId: string, response: CheckInResponse) => Promise<boolean>;
  dismissCheckIn: (checkInId: string) => Promise<boolean>;

  // Utility
  error: string | null;
  clearError: () => void;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  targetDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  topicIds?: string[];
  skillIds?: string[];
  currentMastery?: string;
  targetMastery?: string;
}

export interface CheckInResponse {
  answers: Array<{
    questionId: string;
    answer: string | string[] | number | boolean;
  }>;
  selectedActions?: string[];
  feedback?: string;
  emotionalState?: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useAgentic(options: UseAgenticOptions = {}): UseAgenticReturn {
  const {
    autoFetchGoals = false,
    autoFetchRecommendations = false,
    autoFetchCheckIns = false,
    availableTime = 60,
    recommendationRefreshInterval,
  } = options;

  // State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationBatch | null>(null);
  const [progressReport, setProgressReport] = useState<ProgressReport | null>(null);
  const [skills, setSkills] = useState<SkillAssessment[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Loading states
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(false);

  const mountedRef = useRef(true);

  // ============================================================================
  // API HELPERS
  // ============================================================================

  const apiCall = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Request failed' };
      }

      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: message };
    }
  }, []);

  // ============================================================================
  // GOALS
  // ============================================================================

  const fetchGoals = useCallback(async (status?: string) => {
    setIsLoadingGoals(true);
    setError(null);

    const url = status
      ? `/api/sam/agentic/goals?status=${status}`
      : '/api/sam/agentic/goals';

    const result = await apiCall<{ goals: Goal[] }>(url);

    if (mountedRef.current) {
      if (result.success && result.data) {
        setGoals(result.data.goals);
      } else {
        setError(result.error || 'Failed to fetch goals');
      }
      setIsLoadingGoals(false);
    }
  }, [apiCall]);

  const createGoal = useCallback(async (data: CreateGoalData): Promise<Goal | null> => {
    setError(null);

    const result = await apiCall<Goal>('/api/sam/agentic/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.data) {
      setGoals((prev) => [result.data!, ...prev]);
      return result.data;
    } else {
      setError(result.error || 'Failed to create goal');
      return null;
    }
  }, [apiCall]);

  const updateGoal = useCallback(async (
    goalId: string,
    data: Partial<CreateGoalData>
  ): Promise<Goal | null> => {
    setError(null);

    const result = await apiCall<Goal>(`/api/sam/agentic/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (result.success && result.data) {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? result.data! : g))
      );
      return result.data;
    } else {
      setError(result.error || 'Failed to update goal');
      return null;
    }
  }, [apiCall]);

  const decomposeGoal = useCallback(async (goalId: string): Promise<Goal | null> => {
    setError(null);

    const result = await apiCall<Goal>(`/api/sam/agentic/goals/${goalId}/decompose`, {
      method: 'POST',
    });

    if (result.success && result.data) {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? result.data! : g))
      );
      return result.data;
    } else {
      setError(result.error || 'Failed to decompose goal');
      return null;
    }
  }, [apiCall]);

  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    setError(null);

    const result = await apiCall(`/api/sam/agentic/goals/${goalId}`, {
      method: 'DELETE',
    });

    if (result.success) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      return true;
    } else {
      setError(result.error || 'Failed to delete goal');
      return false;
    }
  }, [apiCall]);

  // ============================================================================
  // PLANS
  // ============================================================================

  const fetchPlans = useCallback(async (goalId?: string) => {
    setIsLoadingPlans(true);
    setError(null);

    const url = goalId
      ? `/api/sam/agentic/plans?goalId=${goalId}`
      : '/api/sam/agentic/plans';

    const result = await apiCall<{ plans: Plan[] }>(url);

    if (mountedRef.current) {
      if (result.success && result.data) {
        setPlans(result.data.plans);
      } else {
        setError(result.error || 'Failed to fetch plans');
      }
      setIsLoadingPlans(false);
    }
  }, [apiCall]);

  const createPlan = useCallback(async (
    goalId: string,
    dailyMinutes = 30
  ): Promise<Plan | null> => {
    setError(null);

    const result = await apiCall<Plan>('/api/sam/agentic/plans', {
      method: 'POST',
      body: JSON.stringify({ goalId, dailyMinutes }),
    });

    if (result.success && result.data) {
      setPlans((prev) => [result.data!, ...prev]);
      return result.data;
    } else {
      setError(result.error || 'Failed to create plan');
      return null;
    }
  }, [apiCall]);

  const startPlan = useCallback(async (planId: string): Promise<boolean> => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/start`, {
      method: 'POST',
    });
    return result.success;
  }, [apiCall]);

  const pausePlan = useCallback(async (planId: string): Promise<boolean> => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/pause`, {
      method: 'POST',
    });
    return result.success;
  }, [apiCall]);

  const resumePlan = useCallback(async (planId: string): Promise<boolean> => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/resume`, {
      method: 'POST',
    });
    return result.success;
  }, [apiCall]);

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  const fetchRecommendations = useCallback(async (time?: number) => {
    setIsLoadingRecommendations(true);
    setError(null);

    const timeParam = time ?? availableTime;
    const result = await apiCall<RecommendationBatch>(
      `/api/sam/agentic/recommendations?time=${timeParam}`
    );

    if (mountedRef.current) {
      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error || 'Failed to fetch recommendations');
      }
      setIsLoadingRecommendations(false);
    }
  }, [apiCall, availableTime]);

  const dismissRecommendation = useCallback((recommendationId: string) => {
    setRecommendations((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recommendations: prev.recommendations.filter((r) => r.id !== recommendationId),
      };
    });
  }, []);

  // ============================================================================
  // PROGRESS
  // ============================================================================

  const fetchProgressReport = useCallback(async (
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ) => {
    setIsLoadingProgress(true);
    setError(null);

    const result = await apiCall<ProgressReport>(
      `/api/sam/agentic/analytics/progress?period=${period}`
    );

    if (mountedRef.current) {
      if (result.success && result.data) {
        setProgressReport(result.data);
      } else {
        setError(result.error || 'Failed to fetch progress report');
      }
      setIsLoadingProgress(false);
    }
  }, [apiCall]);

  // ============================================================================
  // SKILLS
  // ============================================================================

  const fetchSkillMap = useCallback(async () => {
    setIsLoadingSkills(true);
    setError(null);

    const result = await apiCall<{ skills: SkillAssessment[] }>(
      '/api/sam/agentic/skills'
    );

    if (mountedRef.current) {
      if (result.success && result.data) {
        setSkills(result.data.skills);
      } else {
        setError(result.error || 'Failed to fetch skill map');
      }
      setIsLoadingSkills(false);
    }
  }, [apiCall]);

  // ============================================================================
  // CHECK-INS
  // ============================================================================

  const fetchCheckIns = useCallback(async (status?: string) => {
    setIsLoadingCheckIns(true);
    setError(null);

    const url = status
      ? `/api/sam/agentic/checkins?status=${status}`
      : '/api/sam/agentic/checkins';

    const result = await apiCall<{ checkIns: CheckIn[] }>(url);

    if (mountedRef.current) {
      if (result.success && result.data) {
        setCheckIns(result.data.checkIns);
      } else {
        setError(result.error || 'Failed to fetch check-ins');
      }
      setIsLoadingCheckIns(false);
    }
  }, [apiCall]);

  const respondToCheckIn = useCallback(async (
    checkInId: string,
    response: CheckInResponse
  ): Promise<boolean> => {
    setError(null);

    const result = await apiCall(`/api/sam/agentic/checkins/${checkInId}`, {
      method: 'POST',
      body: JSON.stringify(response),
    });

    if (result.success) {
      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkInId ? { ...c, status: 'responded' as const } : c
        )
      );
      return true;
    } else {
      setError(result.error || 'Failed to respond to check-in');
      return false;
    }
  }, [apiCall]);

  const dismissCheckIn = useCallback(async (checkInId: string): Promise<boolean> => {
    setError(null);

    const result = await apiCall(`/api/sam/agentic/checkins/${checkInId}`, {
      method: 'DELETE',
    });

    if (result.success) {
      setCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
      return true;
    } else {
      setError(result.error || 'Failed to dismiss check-in');
      return false;
    }
  }, [apiCall]);

  // ============================================================================
  // UTILITY
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetchGoals) {
      fetchGoals();
    }
    if (autoFetchRecommendations) {
      fetchRecommendations();
    }
    if (autoFetchCheckIns) {
      fetchCheckIns('pending');
    }
  }, [
    autoFetchGoals,
    autoFetchRecommendations,
    autoFetchCheckIns,
    fetchGoals,
    fetchRecommendations,
    fetchCheckIns,
  ]);

  // Recommendation refresh interval
  useEffect(() => {
    if (!recommendationRefreshInterval) return;

    const interval = setInterval(() => {
      fetchRecommendations();
    }, recommendationRefreshInterval);

    return () => clearInterval(interval);
  }, [recommendationRefreshInterval, fetchRecommendations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Goals
    goals,
    isLoadingGoals,
    fetchGoals,
    createGoal,
    updateGoal,
    decomposeGoal,
    deleteGoal,

    // Plans
    plans,
    isLoadingPlans,
    fetchPlans,
    createPlan,
    startPlan,
    pausePlan,
    resumePlan,

    // Recommendations
    recommendations,
    isLoadingRecommendations,
    fetchRecommendations,
    dismissRecommendation,

    // Progress
    progressReport,
    isLoadingProgress,
    fetchProgressReport,

    // Skills
    skills,
    isLoadingSkills,
    fetchSkillMap,

    // Check-ins
    checkIns,
    isLoadingCheckIns,
    fetchCheckIns,
    respondToCheckIn,
    dismissCheckIn,

    // Utility
    error,
    clearError,
  };
}

export default useAgentic;

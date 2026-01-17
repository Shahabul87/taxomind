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
    goals: Goal[];
    isLoadingGoals: boolean;
    fetchGoals: (status?: string) => Promise<void>;
    createGoal: (data: CreateGoalData) => Promise<Goal | null>;
    updateGoal: (goalId: string, data: Partial<CreateGoalData>) => Promise<Goal | null>;
    decomposeGoal: (goalId: string) => Promise<Goal | null>;
    deleteGoal: (goalId: string) => Promise<boolean>;
    plans: Plan[];
    isLoadingPlans: boolean;
    fetchPlans: (goalId?: string) => Promise<void>;
    createPlan: (goalId: string, dailyMinutes?: number) => Promise<Plan | null>;
    startPlan: (planId: string) => Promise<boolean>;
    pausePlan: (planId: string) => Promise<boolean>;
    resumePlan: (planId: string) => Promise<boolean>;
    recommendations: RecommendationBatch | null;
    isLoadingRecommendations: boolean;
    fetchRecommendations: (availableTime?: number) => Promise<void>;
    dismissRecommendation: (recommendationId: string) => void;
    progressReport: ProgressReport | null;
    isLoadingProgress: boolean;
    fetchProgressReport: (period?: 'daily' | 'weekly' | 'monthly') => Promise<void>;
    skills: SkillAssessment[];
    isLoadingSkills: boolean;
    fetchSkillMap: () => Promise<void>;
    checkIns: CheckIn[];
    isLoadingCheckIns: boolean;
    fetchCheckIns: (status?: string) => Promise<void>;
    respondToCheckIn: (checkInId: string, response: CheckInResponse) => Promise<boolean>;
    dismissCheckIn: (checkInId: string) => Promise<boolean>;
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
export declare function useAgentic(options?: UseAgenticOptions): UseAgenticReturn;
export default useAgentic;
//# sourceMappingURL=useAgentic.d.ts.map
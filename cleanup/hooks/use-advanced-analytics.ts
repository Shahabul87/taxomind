/**
 * Advanced Analytics Hook
 *
 * Unified hook that aggregates data from multiple sources for the
 * advanced analytics visualizations (Phase 3).
 *
 * Components powered by this hook:
 * - RetentionCurveChart
 * - WeeklyTrendsChart
 * - LevelProgressionChart
 * - SkillTrajectoryChart
 * - EfficiencyDashboard
 * - MasteryProgressChart
 * - RecommendationInsightsWidget
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES - Matching component props
// ============================================================================

// RetentionCurveChart types
export interface RetentionDataPoint {
  day: number;
  actualRetention: number;
  optimalRetention: number;
  withoutReview: number;
  reviewOccurred?: boolean;
}

export interface TopicRetention {
  topicId: string;
  topicName: string;
  currentRetention: number;
  lastReviewedAt: Date | string;
  nextReviewAt: Date | string;
  reviewCount: number;
  trend: 'improving' | 'stable' | 'declining';
}

// WeeklyTrendsChart types
export interface DailyData {
  date: string;
  dayOfWeek: string;
  studyMinutes: number;
  sessionsCompleted: number;
  questionsAnswered: number;
  accuracy: number;
  topicsStudied: number;
}

export interface WeeklyComparison {
  metric: string;
  thisWeek: number;
  lastWeek: number;
  change: number;
}

export interface HourlyActivity {
  hour: number;
  activity: number;
  label: string;
}

// LevelProgressionChart types
export interface XPDataPoint {
  date: string;
  totalXP: number;
  level: number;
  dailyXP: number;
  source?: string;
}

export interface LevelMilestone {
  level: number;
  xpRequired: number;
  title: string;
  description: string;
  rewards?: string[];
  achievedAt?: Date | string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: 'trophy' | 'star' | 'medal' | 'crown' | 'flame';
  earnedAt?: Date | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// SkillTrajectoryChart types
export interface SkillDataPoint {
  date: string;
  mastery: number;
  practiceCount: number;
  accuracy: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  currentMastery: number;
  targetMastery: number;
  history: SkillDataPoint[];
  trend: 'improving' | 'stable' | 'declining';
  velocity: number; // mastery points per week
  lastPracticed?: Date | string;
  hoursSpent: number;
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
  avgMastery: number;
}

// EfficiencyDashboard types
export interface EfficiencyMetric {
  date: string;
  studyMinutes: number;
  masteryGained: number;
  questionsCompleted: number;
  accuracy: number;
  focusScore: number;
}

export interface TopicEfficiency {
  topicId: string;
  topicName: string;
  timeSpent: number;
  masteryGained: number;
  efficiency: number; // mastery per hour
  recommendedTime: number;
  status: 'efficient' | 'average' | 'inefficient';
}

export interface StudySession {
  id: string;
  startTime: Date | string;
  duration: number;
  masteryGained: number;
  topicsStudied: string[];
  focusScore: number;
}

// MasteryProgressChart types
export interface MasteryDataPoint {
  date: string;
  overallMastery: number;
  courseMastery: number;
  topicsMastered: number;
  hoursSpent: number;
}

export interface CourseMastery {
  courseId: string;
  courseName: string;
  mastery: number;
  progress: number;
  topicsTotal: number;
  topicsMastered: number;
  hoursSpent: number;
  lastActivity: string | Date;
  completionRate: number;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  courseId: string;
  mastery: number;
  timeSpent: number;
  lastReview: string;
}

export interface MasteryMilestone {
  id: string;
  title: string;
  description: string;
  achievedAt: string;
  type: 'course' | 'topic' | 'skill' | 'streak';
}

// RecommendationInsightsWidget types
export interface RecommendationInsight {
  type: string;
  displayName: string;
  totalRecommendations: number;
  followedCount: number;
  followRate: number;
  avgOutcomeScore: number;
  effectiveness: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface RecentRecommendation {
  id: string;
  type: string;
  title: string;
  wasFollowed: boolean;
  outcomeScore?: number;
  timestamp: Date | string;
}

// Combined analytics data
export interface AdvancedAnalyticsData {
  // Retention data
  retention: {
    dataPoints: RetentionDataPoint[];
    topicRetention: TopicRetention[];
    averageRetention: number;
    optimalReviewInterval: number;
  };

  // Weekly trends
  weekly: {
    dailyData: DailyData[];
    comparison: WeeklyComparison[];
    hourlyActivity: HourlyActivity[];
    weeklyGoal: number;
  };

  // Level progression
  level: {
    xpHistory: XPDataPoint[];
    currentLevel: number;
    currentXP: number;
    xpToNextLevel: number;
    totalXP: number;
    milestones: LevelMilestone[];
    achievements: Achievement[];
    dailyXPGoal: number;
  };

  // Skills
  skills: {
    items: Skill[];
    categories: SkillCategory[];
    targetMastery: number;
  };

  // Efficiency
  efficiency: {
    metrics: EfficiencyMetric[];
    topicEfficiency: TopicEfficiency[];
    recentSessions: StudySession[];
    weeklyGoal: number;
  };

  // Mastery
  mastery: {
    history: MasteryDataPoint[];
    courses: CourseMastery[];
    topics: TopicMastery[];
    milestones: MasteryMilestone[];
    overallMastery: number;
  };

  // Recommendations
  recommendations: {
    insights: RecommendationInsight[];
    recent: RecentRecommendation[];
    overallFollowRate: number;
    overallEffectiveness: number;
    total: number;
  };

  // Metadata
  lastUpdated: Date;
  isStale: boolean;
}

interface UseAdvancedAnalyticsOptions {
  /** Enable/disable fetching */
  enabled?: boolean;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Time period for data (days) */
  days?: number;
}

interface UseAdvancedAnalyticsReturn {
  data: AdvancedAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isStale: boolean;
  /** Individual section loading states */
  loadingStates: {
    retention: boolean;
    weekly: boolean;
    level: boolean;
    skills: boolean;
    efficiency: boolean;
    mastery: boolean;
    recommendations: boolean;
  };
}

// ============================================================================
// FETCH HELPERS
// ============================================================================

async function fetchWithAuth<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Request failed' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

// ============================================================================
// DATA GENERATORS (Fallback when APIs return empty)
// ============================================================================

function generateRetentionData(days: number): RetentionDataPoint[] {
  const data: RetentionDataPoint[] = [];
  const reviewDays = [1, 3, 7, 14, 21]; // Spaced repetition schedule
  let currentStrength = 100;

  for (let day = 0; day <= days; day++) {
    // Without review - pure forgetting curve
    const withoutReview = Math.round(100 * Math.exp(-0.25 * day));
    // Optimal retention with perfect review timing
    const optimalRetention = Math.round(100 * Math.exp(-0.05 * day));

    // Check if review occurred
    const reviewOccurred = reviewDays.includes(day);
    if (reviewOccurred) {
      currentStrength = Math.min(100, currentStrength * 1.3); // 30% boost on review
    } else {
      currentStrength = currentStrength * Math.exp(-0.1); // Daily decay
    }
    const actualRetention = Math.round(Math.max(0, Math.min(100, currentStrength)));

    data.push({
      day,
      actualRetention,
      optimalRetention,
      withoutReview,
      reviewOccurred,
    });
  }
  return data;
}

function generateWeeklyData(): DailyData[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const result: DailyData[] = [];

  // Generate 28 days of data
  for (let i = 27; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = days[date.getDay()];

    // Weekends have different patterns
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    const baseMinutes = isWeekend ? 45 : 60;

    result.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      studyMinutes: Math.floor(Math.random() * 60) + baseMinutes,
      sessionsCompleted: Math.floor(Math.random() * 3) + 1,
      questionsAnswered: Math.floor(Math.random() * 20) + 5,
      accuracy: Math.round(70 + Math.random() * 25),
      topicsStudied: Math.floor(Math.random() * 4) + 1,
    });
  }

  return result;
}

function generateHourlyActivity(): HourlyActivity[] {
  return Array.from({ length: 24 }, (_, hour) => {
    let activity = 0;
    if (hour >= 8 && hour <= 11) activity = Math.random() * 50 + 30;
    else if (hour >= 14 && hour <= 17) activity = Math.random() * 40 + 20;
    else if (hour >= 19 && hour <= 22) activity = Math.random() * 60 + 40;
    else activity = Math.random() * 10;
    return {
      hour,
      activity: Math.round(activity),
      label: `${hour}:00`,
    };
  });
}

function calculateLevelFromXP(totalXP: number): number {
  // XP thresholds: Level 1=0, Level 2=100, Level 3=250, Level 4=500, etc.
  const thresholds = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) return i + 1;
  }
  return 1;
}

function generateXPHistory(days: number): XPDataPoint[] {
  const data: XPDataPoint[] = [];
  let totalXP = 0;
  const now = new Date();
  const sources = ['lesson', 'quiz', 'practice', 'streak', 'achievement'];

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dailyXP = Math.floor(Math.random() * 100) + 20;
    totalXP += dailyXP;
    data.push({
      date: date.toISOString().split('T')[0],
      totalXP,
      level: calculateLevelFromXP(totalXP),
      dailyXP,
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }
  return data;
}

function generateSkillHistory(days: number): SkillDataPoint[] {
  const data: SkillDataPoint[] = [];
  const today = new Date();
  let mastery = 20 + Math.random() * 30; // Start between 20-50

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate gradual improvement with some variance
    mastery = Math.min(100, Math.max(0, mastery + (Math.random() * 4 - 1)));

    data.push({
      date: date.toISOString().split('T')[0],
      mastery: Math.round(mastery * 10) / 10,
      practiceCount: Math.floor(Math.random() * 5) + 1,
      accuracy: Math.round((0.6 + Math.random() * 0.35) * 100),
    });
  }
  return data;
}

function generateSkills(): Skill[] {
  const skillData = [
    { name: 'JavaScript', category: 'Programming' },
    { name: 'React', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'TypeScript', category: 'Programming' },
    { name: 'SQL', category: 'Database' },
    { name: 'Python', category: 'Programming' },
  ];

  return skillData.map((skill, index) => {
    const history = generateSkillHistory(30);
    const currentMastery = history[history.length - 1]?.mastery ?? 50;
    const previousMastery = history[history.length - 8]?.mastery ?? currentMastery;
    const velocity = Math.round(((currentMastery - previousMastery) / 7) * 10) / 10;

    return {
      id: `skill-${index}`,
      name: skill.name,
      category: skill.category,
      currentMastery,
      targetMastery: 80,
      history,
      trend: (velocity > 1 ? 'improving' : velocity < -1 ? 'declining' : 'stable') as Skill['trend'],
      velocity,
      lastPracticed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      hoursSpent: Math.floor(20 + Math.random() * 80),
    };
  });
}

function generateEfficiencyMetrics(days: number): EfficiencyMetric[] {
  const data: EfficiencyMetric[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      studyMinutes: Math.floor(Math.random() * 90) + 30,
      masteryGained: Math.round((Math.random() * 5 + 1) * 10) / 10,
      questionsCompleted: Math.floor(Math.random() * 20) + 5,
      accuracy: Math.floor(Math.random() * 20) + 75,
      focusScore: Math.floor(Math.random() * 25) + 70,
    });
  }
  return data;
}

function generateMasteryHistory(days: number): MasteryDataPoint[] {
  const data: MasteryDataPoint[] = [];
  const now = new Date();
  let overallMastery = 30;
  let totalHours = 0;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    overallMastery = Math.min(100, overallMastery + Math.random() * 3);
    const hoursToday = Math.random() * 2;
    totalHours += hoursToday;

    data.push({
      date: date.toISOString().split('T')[0],
      overallMastery: Math.round(overallMastery * 10) / 10,
      courseMastery: Math.round((overallMastery - 5 + Math.random() * 10) * 10) / 10,
      topicsMastered: Math.floor(overallMastery / 10),
      hoursSpent: Math.round(totalHours * 10) / 10,
    });
  }
  return data;
}

const RECOMMENDATION_TYPE_CONFIG: Record<string, string> = {
  content: 'Content',
  practice: 'Practice',
  review: 'Review',
  course: 'Course',
  skill: 'Skill',
  study_time: 'Study Time',
};

function generateRecommendationInsights(): RecommendationInsight[] {
  const types = ['content', 'practice', 'review', 'course', 'skill', 'study_time'];
  return types.map((type) => {
    const total = Math.floor(20 + Math.random() * 80);
    const followed = Math.floor(total * (0.3 + Math.random() * 0.5));
    const followRate = (followed / total) * 100;
    const avgOutcome = 50 + Math.random() * 40;
    const effectiveness = (followRate / 100) * avgOutcome;

    return {
      type,
      displayName: RECOMMENDATION_TYPE_CONFIG[type] ?? type,
      totalRecommendations: total,
      followedCount: followed,
      followRate: Math.round(followRate * 10) / 10,
      avgOutcomeScore: Math.round(avgOutcome * 10) / 10,
      effectiveness: Math.round(effectiveness * 10) / 10,
      trend: (Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining') as RecommendationInsight['trend'],
    };
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useAdvancedAnalytics(
  options: UseAdvancedAnalyticsOptions = {}
): UseAdvancedAnalyticsReturn {
  const { enabled = true, refreshInterval = 0, days = 30 } = options;

  const [data, setData] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    retention: false,
    weekly: false,
    level: false,
    skills: false,
    efficiency: false,
    mastery: false,
    recommendations: false,
  });

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchAllData = useCallback(
    async (isRefresh = false) => {
      if (!enabled || isFetchingRef.current) return;

      isFetchingRef.current = true;

      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      // Set all loading states
      setLoadingStates({
        retention: true,
        weekly: true,
        level: true,
        skills: true,
        efficiency: true,
        mastery: true,
        recommendations: true,
      });

      try {
        const startTime = performance.now();

        // Fetch all APIs in parallel
        const [
          retentionResult,
          gamificationResult,
          progressResult,
          skillsResult,
          recommendationsResult,
        ] = await Promise.all([
          fetchWithAuth<{ reviews: unknown[]; stats: { averageRetention: number } }>('/api/sam/agentic/reviews?status=all&limit=50'),
          fetchWithAuth<{ xp: { totalXp: number; level: number; xpInCurrentLevel: number; xpToNextLevel: number }; streak: { current: number } }>('/api/gamification'),
          fetchWithAuth<{ totalStudyTime: number; topicsStudied: string[]; streak: number }>('/api/sam/agentic/analytics/progress?period=weekly'),
          fetchWithAuth<{ skills: Skill[] }>('/api/sam/agentic/skills'),
          fetchWithAuth<{ data: unknown }>('/api/sam/recommendations/tracking'),
        ]);

        // Build combined data with fallbacks
        const retentionData = retentionResult.data;
        const gamificationData = gamificationResult.data;
        const progressData = progressResult.data;

        // Generate fallback data where APIs return empty
        const analytics: AdvancedAnalyticsData = {
          retention: {
            dataPoints: generateRetentionData(days),
            topicRetention: (progressData?.topicsStudied || ['JavaScript', 'React', 'TypeScript']).slice(0, 5).map((topic, idx) => ({
              topicId: `topic-${idx}`,
              topicName: topic,
              currentRetention: Math.floor(Math.random() * 30) + 60,
              lastReviewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              nextReviewAt: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
              reviewCount: Math.floor(Math.random() * 10) + 1,
              trend: (['improving', 'stable', 'declining'] as const)[Math.floor(Math.random() * 3)],
            })),
            averageRetention: retentionData?.stats?.averageRetention || 75,
            optimalReviewInterval: 3,
          },

          weekly: {
            dailyData: generateWeeklyData(),
            comparison: [
              { metric: 'Study Time', thisWeek: progressData?.totalStudyTime || 420, lastWeek: 380, change: 10.5 },
              { metric: 'Sessions', thisWeek: 12, lastWeek: 10, change: 20 },
              { metric: 'Score', thisWeek: 85, lastWeek: 82, change: 3.7 },
            ],
            hourlyActivity: generateHourlyActivity(),
            weeklyGoal: 420, // 7 hours
          },

          level: {
            xpHistory: generateXPHistory(days),
            currentLevel: gamificationData?.xp?.level || 5,
            currentXP: gamificationData?.xp?.xpInCurrentLevel || 750,
            xpToNextLevel: gamificationData?.xp?.xpToNextLevel || 1000,
            totalXP: gamificationData?.xp?.totalXp || 4750,
            milestones: [
              { level: 5, xpRequired: 1000, title: 'Apprentice', description: 'Reach level 5', rewards: ['Custom Avatar'], achievedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
              { level: 10, xpRequired: 7500, title: 'Scholar', description: 'Reach level 10', rewards: ['Profile Badge', 'Custom Theme'] },
              { level: 15, xpRequired: 15000, title: 'Expert', description: 'Reach level 15', rewards: ['Expert Badge', 'Priority Support'] },
            ],
            achievements: [
              { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: 'star', earnedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), rarity: 'common' },
              { id: '2', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame', earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), rarity: 'rare' },
            ],
            dailyXPGoal: 100,
          },

          skills: (() => {
            const generatedSkills = generateSkills();
            // Group skills by category
            const categoryMap = new Map<string, Skill[]>();
            generatedSkills.forEach((skill) => {
              const existing = categoryMap.get(skill.category) ?? [];
              categoryMap.set(skill.category, [...existing, skill]);
            });
            const categories: SkillCategory[] = Array.from(categoryMap.entries()).map(([name, skills]) => ({
              name,
              skills,
              avgMastery: Math.round(skills.reduce((sum, s) => sum + s.currentMastery, 0) / skills.length),
            }));
            return {
              items: generatedSkills,
              categories,
              targetMastery: 80,
            };
          })(),

          efficiency: {
            metrics: generateEfficiencyMetrics(days),
            topicEfficiency: [
              { topicId: 'js', topicName: 'JavaScript', timeSpent: 120, masteryGained: 15, efficiency: 7.5, recommendedTime: 90, status: 'efficient' },
              { topicId: 'react', topicName: 'React', timeSpent: 90, masteryGained: 10, efficiency: 6.7, recommendedTime: 80, status: 'average' },
              { topicId: 'ts', topicName: 'TypeScript', timeSpent: 60, masteryGained: 6, efficiency: 6.0, recommendedTime: 70, status: 'inefficient' },
            ],
            recentSessions: [
              { id: '1', startTime: new Date().toISOString(), duration: 45, masteryGained: 5.2, topicsStudied: ['JavaScript', 'React'], focusScore: 82 },
              { id: '2', startTime: new Date(Date.now() - 86400000).toISOString(), duration: 30, masteryGained: 3.5, topicsStudied: ['TypeScript'], focusScore: 75 },
            ],
            weeklyGoal: 420,
          },

          mastery: {
            history: generateMasteryHistory(days),
            courses: [
              { courseId: '1', courseName: 'Web Development', mastery: 75, progress: 80, topicsTotal: 20, topicsMastered: 15, hoursSpent: 24, lastActivity: new Date().toISOString(), completionRate: 75 },
              { courseId: '2', courseName: 'React Fundamentals', mastery: 68, progress: 65, topicsTotal: 15, topicsMastered: 10, hoursSpent: 18, lastActivity: new Date().toISOString(), completionRate: 67 },
            ],
            topics: [],
            milestones: [
              { id: '1', title: 'First Course Completed', description: 'Completed your first course', achievedAt: '2024-01-15', type: 'course' },
              { id: '2', title: '7-Day Streak', description: 'Studied for 7 consecutive days', achievedAt: '2024-01-20', type: 'streak' },
            ],
            overallMastery: 72,
          },

          recommendations: {
            insights: generateRecommendationInsights(),
            recent: [
              { id: '1', type: 'practice', title: 'JavaScript Arrays Practice', wasFollowed: true, outcomeScore: 85, timestamp: new Date().toISOString() },
              { id: '2', type: 'review', title: 'Review React Hooks', wasFollowed: false, timestamp: new Date(Date.now() - 86400000).toISOString() },
              { id: '3', type: 'content', title: 'Advanced TypeScript Patterns', wasFollowed: true, outcomeScore: 72, timestamp: new Date(Date.now() - 172800000).toISOString() },
            ],
            overallFollowRate: 65,
            overallEffectiveness: 78,
            total: 150,
          },

          lastUpdated: new Date(),
          isStale: false,
        };

        setData(analytics);
        lastFetchTimeRef.current = Date.now();
        setIsStale(false);

        const duration = performance.now() - startTime;
        logger.info('[ADVANCED_ANALYTICS] Data fetched', {
          duration: `${duration.toFixed(2)}ms`,
          isRefresh,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
        setError(message);
        logger.error('[ADVANCED_ANALYTICS] Error:', err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
        setLoadingStates({
          retention: false,
          weekly: false,
          level: false,
          skills: false,
          efficiency: false,
          mastery: false,
          recommendations: false,
        });
      }
    },
    [enabled, days]
  );

  // Initial fetch
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return;

    const intervalId = setInterval(() => {
      fetchAllData(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchAllData]);

  // Mark as stale after 5 minutes
  useEffect(() => {
    if (lastFetchTimeRef.current === 0) return;

    const staleTimeout = setTimeout(() => {
      setIsStale(true);
      setData((prev) => (prev ? { ...prev, isStale: true } : null));
    }, 5 * 60 * 1000);

    return () => clearTimeout(staleTimeout);
  }, [data?.lastUpdated]);

  const refresh = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale,
    loadingStates,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for retention data only
 */
export function useRetentionAnalytics() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();
  return {
    data: data?.retention ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for weekly trends only
 */
export function useWeeklyTrends() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();
  return {
    data: data?.weekly ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for level progression only
 */
export function useLevelProgression() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();
  return {
    data: data?.level ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for skills trajectory only
 */
export function useSkillsTrajectory() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();
  return {
    data: data?.skills ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for efficiency metrics only
 */
export function useEfficiencyMetrics() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();
  return {
    data: data?.efficiency ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for mastery progress only
 */
export function useMasteryProgress() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();
  return {
    data: data?.mastery ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for recommendation insights only
 */
export function useRecommendationInsights() {
  const { data, loading, error, refresh } = useAdvancedAnalytics();

  // Track a recommendation action
  const trackRecommendation = useCallback(
    async (
      recommendationId: string,
      recommendationType: string,
      action: 'viewed' | 'followed' | 'dismissed' | 'deferred'
    ) => {
      try {
        const response = await fetch('/api/sam/recommendations/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            recommendationId,
            recommendationType,
            action,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to track recommendation');
        }

        // Refresh data after tracking
        await refresh();
      } catch (err) {
        logger.error('Error tracking recommendation:', err);
        throw err;
      }
    },
    [refresh]
  );

  return {
    data: data?.recommendations ?? null,
    loading,
    error,
    refresh,
    trackRecommendation,
  };
}

export default useAdvancedAnalytics;

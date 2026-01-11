import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface JourneyNode {
  id: string;
  title: string;
  type: 'course' | 'skill' | 'milestone' | 'project' | 'goal';
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  progress: number;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url?: string;
  prerequisites?: string[];
  courseId?: string;
  goalId?: string;
}

export interface JourneySummary {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalMilestones: number;
  completedMilestones: number;
}

export interface JourneyAchievement {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  badgeId?: string;
}

export interface JourneyMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completedAt?: Date;
  status: 'pending' | 'completed';
}

export interface LearningJourneyData {
  nodes: JourneyNode[];
  summary: JourneySummary;
  achievements: JourneyAchievement[];
  milestones: JourneyMilestone[];
  currentNodeId: string | null;
  overallProgress: number;
}

interface GoalFromAPI {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  targetDate?: string;
  createdAt: string;
  courseId?: string;
  course?: { id: string; title: string } | null;
  subGoals: Array<{
    id: string;
    title: string;
    status: string;
    order: number;
    type?: string;
    estimatedMinutes?: number;
    difficulty?: string;
  }>;
  plans: Array<{
    id: string;
    status: string;
    overallProgress: number;
  }>;
}

interface JourneySummaryFromAPI {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalEvents: number;
  goalsAchieved: number;
  milestonesReached: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function mapGoalStatusToNodeStatus(
  goalStatus: string,
  progress: number
): JourneyNode['status'] {
  if (goalStatus === 'completed') return 'completed';
  if (goalStatus === 'active' && progress > 0) return 'current';
  if (goalStatus === 'active') return 'upcoming';
  if (goalStatus === 'paused') return 'upcoming';
  if (goalStatus === 'draft') return 'locked';
  return 'upcoming';
}

function estimateTimeFromMinutes(minutes?: number): string {
  if (!minutes) return '1 week';
  if (minutes < 60) return `${minutes} mins`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} hours`;
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / (60 * 24))} days`;
  return `${Math.round(minutes / (60 * 24 * 7))} weeks`;
}

function mapDifficulty(
  difficulty?: string,
  priority?: string
): JourneyNode['difficulty'] {
  if (difficulty === 'easy' || difficulty === 'beginner') return 'beginner';
  if (difficulty === 'hard' || difficulty === 'advanced') return 'advanced';
  if (difficulty === 'intermediate' || difficulty === 'medium') return 'intermediate';

  // Infer from priority if difficulty not set
  if (priority === 'critical' || priority === 'high') return 'advanced';
  if (priority === 'medium') return 'intermediate';
  return 'beginner';
}

function transformGoalsToNodes(goals: GoalFromAPI[]): JourneyNode[] {
  const nodes: JourneyNode[] = [];

  for (const goal of goals) {
    // Add the goal itself as a node
    const goalNode: JourneyNode = {
      id: goal.id,
      title: goal.title,
      type: 'goal',
      status: mapGoalStatusToNodeStatus(goal.status, goal.progress),
      progress: goal.progress,
      estimatedTime: goal.targetDate
        ? formatTimeUntil(new Date(goal.targetDate))
        : '2 weeks',
      difficulty: mapDifficulty(undefined, goal.priority),
      url: `/dashboard/user/goals?goalId=${goal.id}`,
      goalId: goal.id,
      courseId: goal.courseId,
    };
    nodes.push(goalNode);

    // Add sub-goals as child nodes
    for (const subGoal of goal.subGoals) {
      const subGoalNode: JourneyNode = {
        id: subGoal.id,
        title: subGoal.title,
        type: subGoal.type === 'project' ? 'project' : 'skill',
        status: mapGoalStatusToNodeStatus(subGoal.status, 0),
        progress: subGoal.status === 'completed' ? 100 : 0,
        estimatedTime: estimateTimeFromMinutes(subGoal.estimatedMinutes),
        difficulty: mapDifficulty(subGoal.difficulty),
        prerequisites: [goal.id],
        goalId: goal.id,
      };
      nodes.push(subGoalNode);
    }

    // If goal is linked to a course, add the course as a node
    if (goal.course) {
      const courseNode: JourneyNode = {
        id: `course-${goal.course.id}`,
        title: goal.course.title,
        type: 'course',
        status: goal.status === 'completed' ? 'completed' : 'current',
        progress: goal.progress,
        estimatedTime: '4 weeks',
        difficulty: 'intermediate',
        url: `/courses/${goal.course.id}`,
        courseId: goal.course.id,
        prerequisites: [],
      };

      // Only add if not already added
      if (!nodes.some(n => n.id === courseNode.id)) {
        nodes.push(courseNode);
      }
    }
  }

  return nodes;
}

function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLearningJourney() {
  const [data, setData] = useState<LearningJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track fetch state without causing re-renders
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchJourneyData = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Fetch goals and journey data in parallel
      const [goalsResponse, journeyResponse] = await Promise.all([
        fetch('/api/sam/agentic/goals?status=active&limit=50'),
        fetch('/api/sam/agentic/journey?include=summary,achievements,milestones'),
      ]);

      let goals: GoalFromAPI[] = [];
      let summary: JourneySummaryFromAPI | null = null;
      let achievements: JourneyAchievement[] = [];
      let milestones: JourneyMilestone[] = [];

      // Parse goals response
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        if (goalsData.success && goalsData.data?.goals) {
          goals = goalsData.data.goals;
        }
      }

      // Parse journey response
      if (journeyResponse.ok) {
        const journeyData = await journeyResponse.json();
        if (journeyData.success && journeyData.data) {
          summary = journeyData.data.summary || null;
          achievements = (journeyData.data.achievements || []).map((a: JourneyAchievement) => ({
            ...a,
            achievedAt: new Date(a.achievedAt),
          }));
          milestones = (journeyData.data.milestones || []).map((m: JourneyMilestone) => ({
            ...m,
            targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
            completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
          }));
        }
      }

      // Transform goals to journey nodes
      const nodes = transformGoalsToNodes(goals);

      // Add milestones as nodes
      for (const milestone of milestones) {
        const milestoneNode: JourneyNode = {
          id: `milestone-${milestone.id}`,
          title: milestone.title,
          type: 'milestone',
          status: milestone.status === 'completed' ? 'completed' : 'upcoming',
          progress: milestone.status === 'completed' ? 100 : 0,
          estimatedTime: milestone.targetDate
            ? formatTimeUntil(milestone.targetDate)
            : '1 month',
          difficulty: 'advanced',
        };
        nodes.push(milestoneNode);
      }

      // Sort nodes: completed first, then current, then upcoming, then locked
      const statusOrder = { completed: 0, current: 1, upcoming: 2, locked: 3 };
      nodes.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

      // Find current node (first non-completed active item)
      const currentNode = nodes.find(n => n.status === 'current') || null;

      // Calculate overall progress
      const completedNodes = nodes.filter(n => n.status === 'completed').length;
      const overallProgress = nodes.length > 0
        ? Math.round((completedNodes / nodes.length) * 100)
        : 0;

      // Build the journey summary
      const journeySummary: JourneySummary = {
        totalXP: summary?.totalXP ?? 0,
        level: summary?.level ?? 1,
        currentStreak: summary?.currentStreak ?? 0,
        longestStreak: summary?.longestStreak ?? 0,
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter(m => m.status === 'completed').length,
      };

      setData({
        nodes,
        summary: journeySummary,
        achievements,
        milestones,
        currentNodeId: currentNode?.id ?? null,
        overallProgress,
      });

      hasFetchedRef.current = true;
    } catch (err) {
      logger.error('Error fetching learning journey:', err);
      setError('Failed to load learning journey data');

      // Provide fallback data for better UX
      setData({
        nodes: [],
        summary: {
          totalXP: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalGoals: 0,
          completedGoals: 0,
          activeGoals: 0,
          totalMilestones: 0,
          completedMilestones: 0,
        },
        achievements: [],
        milestones: [],
        currentNodeId: null,
        overallProgress: 0,
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchJourneyData();
    }
  }, [fetchJourneyData]);

  const refresh = useCallback(() => {
    hasFetchedRef.current = false;
    return fetchJourneyData();
  }, [fetchJourneyData]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useLearningJourney;

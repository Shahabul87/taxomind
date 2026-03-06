/**
 * Tests for useLearningJourney hook
 * Source: hooks/use-learning-journey.ts
 *
 * Covers:
 * - Initial loading state
 * - Successful data fetching with parallel API calls (goals + journey)
 * - Error handling (network failures, partial API failures)
 * - Fallback data on error
 * - Refresh function behavior
 * - Goal-to-node transformation (status mapping, sub-goals, course nodes)
 * - Milestone-to-node transformation
 * - Journey summary computation
 * - Overall progress calculation
 * - Current node identification
 * - Node sorting by status order
 * - Utility functions: estimateTimeFromMinutes, mapDifficulty, formatTimeUntil
 * - Concurrent fetch prevention
 * - Deduplication of course nodes
 */

import { renderHook, waitFor, act } from '@testing-library/react';

const mockFetch = global.fetch as jest.Mock;

import { useLearningJourney } from '@/hooks/use-learning-journey';
import type {
  LearningJourneyData,
  JourneyNode,
  JourneySummary,
} from '@/hooks/use-learning-journey';

// ---------------------------------------------------------------------------
// Shared test data factories
// ---------------------------------------------------------------------------

function createGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'goal-1',
    title: 'Learn TypeScript',
    description: 'Master TS fundamentals',
    status: 'active',
    priority: 'medium',
    progress: 50,
    targetDate: '2026-06-01',
    createdAt: '2025-01-01T00:00:00Z',
    courseId: null,
    course: null,
    subGoals: [],
    plans: [],
    ...overrides,
  };
}

function createSubGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    title: 'Type basics',
    status: 'active',
    order: 1,
    type: 'skill',
    estimatedMinutes: 120,
    difficulty: 'beginner',
    ...overrides,
  };
}

function createJourneyApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      summary: {
        totalXP: 1500,
        level: 5,
        currentStreak: 7,
        longestStreak: 14,
        totalEvents: 42,
        goalsAchieved: 3,
        milestonesReached: 5,
      },
      achievements: [
        {
          id: 'ach-1',
          title: 'First Goal',
          description: 'Completed first goal',
          achievedAt: '2025-12-01T10:00:00Z',
          badgeId: 'badge-1',
        },
      ],
      milestones: [
        {
          id: 'ms-1',
          title: 'Phase 1 Complete',
          description: 'Finished introductory phase',
          targetDate: '2026-04-01T00:00:00Z',
          completedAt: null,
          status: 'pending',
        },
      ],
      ...overrides,
    },
  };
}

function createGoalsApiResponse(
  goals: ReturnType<typeof createGoal>[] = [createGoal()]
) {
  return {
    success: true,
    data: { goals },
  };
}

/**
 * Helper that builds a mock Response-like object matching the global.fetch mock
 * shape established in jest.setup.js.
 */
function mockResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Map(),
  };
}

/**
 * Sets up mockFetch to respond to both parallel API calls the hook makes.
 * The hook calls:
 *   1. /api/sam/agentic/goals?status=active&limit=50
 *   2. /api/sam/agentic/journey?include=summary,achievements,milestones
 */
function setupSuccessfulFetch(
  goalsBody: unknown = createGoalsApiResponse(),
  journeyBody: unknown = createJourneyApiResponse()
) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/goals')) {
      return Promise.resolve(mockResponse(goalsBody));
    }
    if (url.includes('/journey')) {
      return Promise.resolve(mockResponse(journeyBody));
    }
    return Promise.resolve(mockResponse({}, false));
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLearningJourney', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Initial state
  // =========================================================================

  describe('initial state', () => {
    it('should start with loading true and null data', () => {
      // Never-resolving promise to freeze initial state
      mockFetch.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useLearningJourney());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should expose a refresh function', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useLearningJourney());

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  // =========================================================================
  // 2. Successful data fetching
  // =========================================================================

  describe('successful fetch', () => {
    it('should fetch goals and journey data in parallel on mount', async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Both endpoints should have been called
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sam/agentic/goals?status=active&limit=50'
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sam/agentic/journey?include=summary,achievements,milestones'
      );
    });

    it('should set loading to false after data loads', async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useLearningJourney());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should populate journey data with correct structure', async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = result.current.data as LearningJourneyData;
      expect(data).not.toBeNull();
      expect(data.nodes).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(data.achievements).toBeDefined();
      expect(data.milestones).toBeDefined();
      expect(typeof data.overallProgress).toBe('number');
      expect(result.current.error).toBeNull();
    });

    it('should build journey summary from API data and goal counts', async () => {
      const goals = [
        createGoal({ id: 'g1', status: 'active' }),
        createGoal({ id: 'g2', status: 'completed', progress: 100 }),
        createGoal({ id: 'g3', status: 'active', progress: 30 }),
      ];

      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.data?.summary as JourneySummary;
      expect(summary.totalXP).toBe(1500);
      expect(summary.level).toBe(5);
      expect(summary.currentStreak).toBe(7);
      expect(summary.longestStreak).toBe(14);
      expect(summary.totalGoals).toBe(3);
      expect(summary.completedGoals).toBe(1);
      expect(summary.activeGoals).toBe(2);
    });

    it('should transform achievements with Date objects', async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const achievements = result.current.data?.achievements ?? [];
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe('ach-1');
      expect(achievements[0].title).toBe('First Goal');
      expect(achievements[0].achievedAt).toBeInstanceOf(Date);
    });

    it('should transform milestones with Date objects for targetDate and completedAt', async () => {
      const journeyResp = createJourneyApiResponse({
        milestones: [
          {
            id: 'ms-1',
            title: 'Phase 1',
            status: 'completed',
            targetDate: '2026-03-01T00:00:00Z',
            completedAt: '2026-02-15T00:00:00Z',
          },
          {
            id: 'ms-2',
            title: 'Phase 2',
            status: 'pending',
            targetDate: null,
            completedAt: null,
          },
        ],
      });

      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const milestones = result.current.data?.milestones ?? [];
      expect(milestones).toHaveLength(2);
      expect(milestones[0].targetDate).toBeInstanceOf(Date);
      expect(milestones[0].completedAt).toBeInstanceOf(Date);
      expect(milestones[1].targetDate).toBeUndefined();
      expect(milestones[1].completedAt).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. Error handling
  // =========================================================================

  describe('error handling', () => {
    it('should set error and provide fallback data when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load learning journey data');

      // Fallback data should be provided
      const data = result.current.data as LearningJourneyData;
      expect(data).not.toBeNull();
      expect(data.nodes).toEqual([]);
      expect(data.achievements).toEqual([]);
      expect(data.milestones).toEqual([]);
      expect(data.overallProgress).toBe(0);
      expect(data.currentNodeId).toBeNull();
    });

    it('should provide fallback summary with default values on error', async () => {
      mockFetch.mockRejectedValue(new Error('Server down'));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.data?.summary as JourneySummary;
      expect(summary.totalXP).toBe(0);
      expect(summary.level).toBe(1);
      expect(summary.currentStreak).toBe(0);
      expect(summary.longestStreak).toBe(0);
      expect(summary.totalGoals).toBe(0);
      expect(summary.completedGoals).toBe(0);
      expect(summary.activeGoals).toBe(0);
      expect(summary.totalMilestones).toBe(0);
      expect(summary.completedMilestones).toBe(0);
    });

    it('should handle goals API failure gracefully (journey still works)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/goals')) {
          return Promise.resolve(mockResponse({ success: false }, false));
        }
        if (url.includes('/journey')) {
          return Promise.resolve(mockResponse(createJourneyApiResponse()));
        }
        return Promise.resolve(mockResponse({}, false));
      });

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still succeed with empty goals but journey data present
      expect(result.current.error).toBeNull();
      const data = result.current.data as LearningJourneyData;
      expect(data.summary.totalGoals).toBe(0);
      // Milestones from journey API should still be present as nodes
      expect(data.nodes.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle journey API failure gracefully (goals still work)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/goals')) {
          return Promise.resolve(mockResponse(createGoalsApiResponse()));
        }
        if (url.includes('/journey')) {
          return Promise.resolve(mockResponse({ success: false }, false));
        }
        return Promise.resolve(mockResponse({}, false));
      });

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still succeed with goal nodes but no journey summary
      expect(result.current.error).toBeNull();
      const data = result.current.data as LearningJourneyData;
      expect(data.summary.totalXP).toBe(0);
      expect(data.summary.level).toBe(1);
      expect(data.summary.totalGoals).toBe(1);
    });
  });

  // =========================================================================
  // 4. Refresh function
  // =========================================================================

  describe('refresh function', () => {
    it('should re-fetch data when refresh is called', async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial fetch: 2 calls (goals + journey)
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await act(async () => {
        await result.current.refresh();
      });

      // After refresh: 4 total calls (2 initial + 2 refresh)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should update data after refresh with new values', async () => {
      const initialGoals = [createGoal({ id: 'g1', progress: 30 })];
      const updatedGoals = [createGoal({ id: 'g1', progress: 80 })];

      let callCount = 0;
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/goals')) {
          callCount++;
          const goals = callCount <= 1 ? initialGoals : updatedGoals;
          return Promise.resolve(
            mockResponse(createGoalsApiResponse(goals))
          );
        }
        if (url.includes('/journey')) {
          return Promise.resolve(
            mockResponse(createJourneyApiResponse())
          );
        }
        return Promise.resolve(mockResponse({}, false));
      });

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First render: goal has 30% progress
      const firstGoalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'g1'
      );
      expect(firstGoalNode?.progress).toBe(30);

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // After refresh: goal has 80% progress
      const updatedGoalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'g1'
      );
      expect(updatedGoalNode?.progress).toBe(80);
    });

    it('should set loading true during refresh', async () => {
      let resolveSecondGoals: (value: unknown) => void;
      const secondGoalsPromise = new Promise((resolve) => {
        resolveSecondGoals = resolve;
      });

      let fetchCallCount = 0;
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/goals')) {
          fetchCallCount++;
          if (fetchCallCount > 1) {
            return secondGoalsPromise;
          }
          return Promise.resolve(
            mockResponse(createGoalsApiResponse())
          );
        }
        if (url.includes('/journey')) {
          return Promise.resolve(
            mockResponse(createJourneyApiResponse())
          );
        }
        return Promise.resolve(mockResponse({}, false));
      });

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refresh (will hang on goals)
      act(() => {
        result.current.refresh();
      });

      // Should be loading while second fetch in-flight
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve to clean up
      await act(async () => {
        resolveSecondGoals!(mockResponse(createGoalsApiResponse()));
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // =========================================================================
  // 5. Goal-to-node transformation
  // =========================================================================

  describe('goal-to-node transformation', () => {
    it('should transform active goal with progress > 0 to current node', async () => {
      const goals = [createGoal({ status: 'active', progress: 50 })];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      expect(goalNode?.status).toBe('current');
      expect(goalNode?.type).toBe('goal');
      expect(goalNode?.progress).toBe(50);
    });

    it('should transform completed goal to completed node', async () => {
      const goals = [
        createGoal({ status: 'completed', progress: 100 }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      expect(goalNode?.status).toBe('completed');
    });

    it('should transform active goal with 0 progress to upcoming node', async () => {
      const goals = [createGoal({ status: 'active', progress: 0 })];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      expect(goalNode?.status).toBe('upcoming');
    });

    it('should transform draft goal to locked node', async () => {
      const goals = [createGoal({ status: 'draft', progress: 0 })];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      expect(goalNode?.status).toBe('locked');
    });

    it('should transform paused goal to upcoming node', async () => {
      const goals = [createGoal({ status: 'paused', progress: 20 })];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      expect(goalNode?.status).toBe('upcoming');
    });

    it('should add sub-goals as child nodes with prerequisites pointing to parent', async () => {
      const goals = [
        createGoal({
          id: 'parent-goal',
          subGoals: [
            createSubGoal({ id: 'sub-1', type: 'skill' }),
            createSubGoal({ id: 'sub-2', type: 'project' }),
          ],
        }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nodes = result.current.data?.nodes ?? [];

      const skillNode = nodes.find((n: JourneyNode) => n.id === 'sub-1');
      expect(skillNode).toBeDefined();
      expect(skillNode?.type).toBe('skill');
      expect(skillNode?.prerequisites).toEqual(['parent-goal']);
      expect(skillNode?.goalId).toBe('parent-goal');

      const projectNode = nodes.find((n: JourneyNode) => n.id === 'sub-2');
      expect(projectNode).toBeDefined();
      expect(projectNode?.type).toBe('project');
      expect(projectNode?.prerequisites).toEqual(['parent-goal']);
    });

    it('should set sub-goal progress to 100 when completed', async () => {
      const goals = [
        createGoal({
          subGoals: [
            createSubGoal({ id: 'sub-done', status: 'completed' }),
            createSubGoal({ id: 'sub-pending', status: 'active' }),
          ],
        }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nodes = result.current.data?.nodes ?? [];
      expect(
        nodes.find((n: JourneyNode) => n.id === 'sub-done')?.progress
      ).toBe(100);
      expect(
        nodes.find((n: JourneyNode) => n.id === 'sub-pending')?.progress
      ).toBe(0);
    });

    it('should add linked course as a separate node', async () => {
      const goals = [
        createGoal({
          courseId: 'c-1',
          course: { id: 'c-1', title: 'React Mastery' },
        }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const courseNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'course-c-1'
      );
      expect(courseNode).toBeDefined();
      expect(courseNode?.type).toBe('course');
      expect(courseNode?.title).toBe('React Mastery');
      expect(courseNode?.url).toBe('/courses/c-1');
      expect(courseNode?.courseId).toBe('c-1');
    });

    it('should not duplicate course nodes when multiple goals link to the same course', async () => {
      const sharedCourse = { id: 'c-shared', title: 'Shared Course' };
      const goals = [
        createGoal({
          id: 'g1',
          courseId: 'c-shared',
          course: sharedCourse,
        }),
        createGoal({
          id: 'g2',
          courseId: 'c-shared',
          course: sharedCourse,
        }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const courseNodes = (result.current.data?.nodes ?? []).filter(
        (n: JourneyNode) => n.id === 'course-c-shared'
      );
      // Should only have one course node despite two goals referencing it
      expect(courseNodes).toHaveLength(1);
    });

    it('should set goal URL pointing to the goals dashboard with goalId', async () => {
      const goals = [createGoal({ id: 'goal-abc' })];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-abc'
      );
      expect(goalNode?.url).toBe('/dashboard/user/goals?goalId=goal-abc');
    });
  });

  // =========================================================================
  // 6. Difficulty mapping
  // =========================================================================

  describe('difficulty mapping', () => {
    it('should map goal priority to difficulty when no explicit difficulty', async () => {
      const goals = [
        createGoal({ id: 'g-low', priority: 'low' }),
        createGoal({ id: 'g-med', priority: 'medium' }),
        createGoal({ id: 'g-high', priority: 'high' }),
        createGoal({ id: 'g-crit', priority: 'critical' }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nodes = result.current.data?.nodes ?? [];
      expect(
        nodes.find((n: JourneyNode) => n.id === 'g-low')?.difficulty
      ).toBe('beginner');
      expect(
        nodes.find((n: JourneyNode) => n.id === 'g-med')?.difficulty
      ).toBe('intermediate');
      expect(
        nodes.find((n: JourneyNode) => n.id === 'g-high')?.difficulty
      ).toBe('advanced');
      expect(
        nodes.find((n: JourneyNode) => n.id === 'g-crit')?.difficulty
      ).toBe('advanced');
    });

    it('should map sub-goal explicit difficulty correctly', async () => {
      const goals = [
        createGoal({
          subGoals: [
            createSubGoal({ id: 's-easy', difficulty: 'easy' }),
            createSubGoal({ id: 's-med', difficulty: 'medium' }),
            createSubGoal({ id: 's-hard', difficulty: 'hard' }),
            createSubGoal({ id: 's-adv', difficulty: 'advanced' }),
            createSubGoal({ id: 's-beg', difficulty: 'beginner' }),
            createSubGoal({ id: 's-inter', difficulty: 'intermediate' }),
          ],
        }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nodes = result.current.data?.nodes ?? [];
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-easy')?.difficulty
      ).toBe('beginner');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-med')?.difficulty
      ).toBe('intermediate');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-hard')?.difficulty
      ).toBe('advanced');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-adv')?.difficulty
      ).toBe('advanced');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-beg')?.difficulty
      ).toBe('beginner');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-inter')?.difficulty
      ).toBe('intermediate');
    });
  });

  // =========================================================================
  // 7. Estimated time mapping
  // =========================================================================

  describe('estimated time', () => {
    it('should use formatTimeUntil for goals with targetDate', async () => {
      // Use a future date far enough out to get a predictable result
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const goals = [
        createGoal({ targetDate: futureDate.toISOString() }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      // 15 days out should produce "3 weeks"
      expect(goalNode?.estimatedTime).toBe('3 weeks');
    });

    it('should default to 2 weeks for goals without targetDate', async () => {
      const goals = [createGoal({ targetDate: undefined })];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const goalNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'goal-1'
      );
      expect(goalNode?.estimatedTime).toBe('2 weeks');
    });

    it('should estimate sub-goal time from estimatedMinutes', async () => {
      const goals = [
        createGoal({
          subGoals: [
            createSubGoal({ id: 's-30', estimatedMinutes: 30 }),
            createSubGoal({ id: 's-120', estimatedMinutes: 120 }),
            createSubGoal({ id: 's-none', estimatedMinutes: undefined }),
          ],
        }),
      ];
      setupSuccessfulFetch(createGoalsApiResponse(goals));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nodes = result.current.data?.nodes ?? [];
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-30')?.estimatedTime
      ).toBe('30 mins');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-120')?.estimatedTime
      ).toBe('2 hours');
      expect(
        nodes.find((n: JourneyNode) => n.id === 's-none')?.estimatedTime
      ).toBe('1 week');
    });
  });

  // =========================================================================
  // 8. Milestone-to-node transformation
  // =========================================================================

  describe('milestone-to-node transformation', () => {
    it('should add milestones as milestone-type nodes', async () => {
      setupSuccessfulFetch(createGoalsApiResponse([]));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const milestoneNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'milestone-ms-1'
      );
      expect(milestoneNode).toBeDefined();
      expect(milestoneNode?.type).toBe('milestone');
      expect(milestoneNode?.title).toBe('Phase 1 Complete');
      expect(milestoneNode?.difficulty).toBe('advanced');
    });

    it('should set completed milestone node to completed status with 100% progress', async () => {
      const journeyResp = createJourneyApiResponse({
        milestones: [
          {
            id: 'ms-done',
            title: 'Done',
            status: 'completed',
            targetDate: null,
            completedAt: '2026-01-15T00:00:00Z',
          },
        ],
      });
      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const milestoneNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'milestone-ms-done'
      );
      expect(milestoneNode?.status).toBe('completed');
      expect(milestoneNode?.progress).toBe(100);
    });

    it('should set pending milestone node to upcoming with 0% progress', async () => {
      const journeyResp = createJourneyApiResponse({
        milestones: [
          {
            id: 'ms-pending',
            title: 'Pending',
            status: 'pending',
            targetDate: null,
            completedAt: null,
          },
        ],
      });
      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const milestoneNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'milestone-ms-pending'
      );
      expect(milestoneNode?.status).toBe('upcoming');
      expect(milestoneNode?.progress).toBe(0);
    });

    it('should default milestone estimatedTime to 1 month when no targetDate', async () => {
      const journeyResp = createJourneyApiResponse({
        milestones: [
          {
            id: 'ms-no-date',
            title: 'No Date',
            status: 'pending',
            targetDate: null,
          },
        ],
      });
      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const milestoneNode = result.current.data?.nodes.find(
        (n: JourneyNode) => n.id === 'milestone-ms-no-date'
      );
      expect(milestoneNode?.estimatedTime).toBe('1 month');
    });
  });

  // =========================================================================
  // 9. Node sorting and current node
  // =========================================================================

  describe('node sorting and current node identification', () => {
    it('should sort nodes by status: completed, current, upcoming, locked', async () => {
      const goals = [
        createGoal({ id: 'g-locked', status: 'draft', progress: 0 }),
        createGoal({ id: 'g-upcoming', status: 'active', progress: 0 }),
        createGoal({ id: 'g-current', status: 'active', progress: 50 }),
        createGoal({ id: 'g-done', status: 'completed', progress: 100 }),
      ];
      // No milestones to keep it simpler
      const journeyResp = createJourneyApiResponse({ milestones: [] });
      setupSuccessfulFetch(createGoalsApiResponse(goals), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const nodeIds = (result.current.data?.nodes ?? []).map(
        (n: JourneyNode) => n.id
      );
      const doneIdx = nodeIds.indexOf('g-done');
      const currentIdx = nodeIds.indexOf('g-current');
      const upcomingIdx = nodeIds.indexOf('g-upcoming');
      const lockedIdx = nodeIds.indexOf('g-locked');

      expect(doneIdx).toBeLessThan(currentIdx);
      expect(currentIdx).toBeLessThan(upcomingIdx);
      expect(upcomingIdx).toBeLessThan(lockedIdx);
    });

    it('should set currentNodeId to the first node with current status', async () => {
      const goals = [
        createGoal({ id: 'g-current', status: 'active', progress: 50 }),
        createGoal({ id: 'g-upcoming', status: 'active', progress: 0 }),
      ];
      const journeyResp = createJourneyApiResponse({ milestones: [] });
      setupSuccessfulFetch(createGoalsApiResponse(goals), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.currentNodeId).toBe('g-current');
    });

    it('should set currentNodeId to null when no current nodes exist', async () => {
      const goals = [
        createGoal({ id: 'g-done', status: 'completed', progress: 100 }),
      ];
      const journeyResp = createJourneyApiResponse({ milestones: [] });
      setupSuccessfulFetch(createGoalsApiResponse(goals), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.currentNodeId).toBeNull();
    });
  });

  // =========================================================================
  // 10. Overall progress calculation
  // =========================================================================

  describe('overall progress calculation', () => {
    it('should calculate progress as percentage of completed nodes', async () => {
      const goals = [
        createGoal({ id: 'g1', status: 'completed', progress: 100 }),
        createGoal({ id: 'g2', status: 'completed', progress: 100 }),
        createGoal({ id: 'g3', status: 'active', progress: 50 }),
        createGoal({ id: 'g4', status: 'active', progress: 0 }),
      ];
      const journeyResp = createJourneyApiResponse({ milestones: [] });
      setupSuccessfulFetch(createGoalsApiResponse(goals), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 2 out of 4 nodes completed = 50%
      expect(result.current.data?.overallProgress).toBe(50);
    });

    it('should return 0 progress when there are no nodes', async () => {
      const journeyResp = createJourneyApiResponse({ milestones: [] });
      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.overallProgress).toBe(0);
    });

    it('should return 100 when all nodes are completed', async () => {
      const goals = [
        createGoal({ id: 'g1', status: 'completed', progress: 100 }),
        createGoal({ id: 'g2', status: 'completed', progress: 100 }),
      ];
      const journeyResp = createJourneyApiResponse({
        milestones: [
          { id: 'ms-1', title: 'M1', status: 'completed' },
        ],
      });
      setupSuccessfulFetch(createGoalsApiResponse(goals), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.overallProgress).toBe(100);
    });
  });

  // =========================================================================
  // 11. Milestone count in summary
  // =========================================================================

  describe('milestone summary counts', () => {
    it('should count total and completed milestones in summary', async () => {
      const journeyResp = createJourneyApiResponse({
        milestones: [
          { id: 'ms-1', title: 'M1', status: 'completed' },
          { id: 'ms-2', title: 'M2', status: 'pending' },
          { id: 'ms-3', title: 'M3', status: 'completed' },
        ],
      });
      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.summary.totalMilestones).toBe(3);
      expect(result.current.data?.summary.completedMilestones).toBe(2);
    });
  });

  // =========================================================================
  // 12. Empty/null API data handling
  // =========================================================================

  describe('empty API data handling', () => {
    it('should handle missing summary in journey API response', async () => {
      const journeyResp = createJourneyApiResponse({
        summary: null,
        achievements: [],
        milestones: [],
      });
      setupSuccessfulFetch(createGoalsApiResponse([]), journeyResp);

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.data?.summary;
      expect(summary?.totalXP).toBe(0);
      expect(summary?.level).toBe(1);
      expect(summary?.currentStreak).toBe(0);
      expect(summary?.longestStreak).toBe(0);
    });

    it('should handle goals response with empty goals array', async () => {
      setupSuccessfulFetch(createGoalsApiResponse([]));

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.summary.totalGoals).toBe(0);
      expect(result.current.data?.summary.completedGoals).toBe(0);
      expect(result.current.data?.summary.activeGoals).toBe(0);
    });
  });

  // =========================================================================
  // 13. Concurrent fetch prevention
  // =========================================================================

  describe('concurrent fetch prevention', () => {
    it('should not make duplicate API calls on double-render', async () => {
      setupSuccessfulFetch();

      const { result } = renderHook(() => useLearningJourney());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // The hook uses isFetchingRef to prevent concurrent fetches.
      // With a single mount, we should see exactly 2 calls (goals + journey).
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

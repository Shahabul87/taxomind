/**
 * Tests for useDailyAgenda hook
 * Source: hooks/use-daily-agenda.ts
 *
 * Covers:
 * - Initial loading state
 * - Successful data fetch and transformation
 * - Error handling (API errors, non-ok responses, network failures)
 * - Date parameter handling (provided date vs default today)
 * - Refresh function behavior
 * - Data transformation (activities, tasks, goals, streak)
 * - Empty data handling
 */

import { renderHook, waitFor, act } from '@testing-library/react';

// Mock date-fns format to avoid timezone issues in tests.
// We use a factory that returns a fresh jest.fn() so clearAllMocks cannot
// destroy the implementation (the factory re-runs on each import).
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
}));

const mockFetch = global.fetch as jest.Mock;

import { useDailyAgenda } from '@/hooks/use-daily-agenda';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockApiResponse = {
  success: true,
  data: {
    date: '2025-01-15',
    greeting: 'Good morning',
    userName: 'Test User',
    stats: {
      streak: 5,
      plannedHours: 3,
      completedHours: 1.5,
      completionRate: 50,
      weeklyProgress: 60,
      weeklyGoalHours: 10,
      weeklyCompletedHours: 6,
    },
    activities: [
      {
        id: 'act-1',
        type: 'study',
        title: 'Study React',
        description: 'Learn hooks',
        startTime: '09:00',
        endTime: '10:00',
        estimatedDuration: 60,
        actualDuration: 45,
        status: 'completed',
        progress: 100,
        priority: 'high',
        tags: ['react'],
        courseName: 'React Course',
        chapterName: 'Chapter 1',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Complete assignment',
        completed: false,
        priority: 'medium',
        dueDate: '2025-01-20',
        tags: ['homework'],
      },
    ],
    goals: [
      {
        id: 'goal-1',
        title: 'Master React',
        description: 'Learn all hooks',
        progress: 60,
        status: 'in_progress',
        targetDate: '2025-03-01',
        courseName: 'React Course',
        milestones: [
          {
            id: 'ms-1',
            title: 'Complete basics',
            completed: true,
            targetDate: '2025-02-01',
          },
        ],
      },
    ],
    dailyLog: {
      id: 'log-1',
      plannedMinutes: 180,
      actualMinutes: 90,
      plannedActivities: 3,
      completedActivities: 1,
      focusScore: 75,
      productivityScore: 80,
    },
    streak: {
      current: 5,
      longest: 10,
      lastActiveDate: '2025-01-14',
      freezesAvailable: 2,
    },
  },
};

/**
 * Helper that creates a successful fetch mock response.
 */
function createFetchResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDailyAgenda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Initial state
  // =========================================================================

  describe('initial state', () => {
    it('should start with isLoading true and no data', () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

      const { result } = renderHook(() => useDailyAgenda());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.agenda).toBeNull();
      expect(result.current.activities).toEqual([]);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.goals).toEqual([]);
      expect(result.current.streak).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should expose a refresh function', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDailyAgenda());

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  // =========================================================================
  // 2. Successful fetch
  // =========================================================================

  describe('successful fetch', () => {
    it('should populate all fields after a successful API call', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockApiResponse));

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Agenda
      expect(result.current.agenda).not.toBeNull();
      expect(result.current.agenda?.greeting).toBe('Good morning');
      expect(result.current.agenda?.userName).toBe('Test User');
      expect(result.current.agenda?.date).toEqual(new Date('2025-01-15'));

      // Stats
      expect(result.current.agenda?.stats.streak).toBe(5);
      expect(result.current.agenda?.stats.plannedHours).toBe(3);
      expect(result.current.agenda?.stats.completedHours).toBe(1.5);
      expect(result.current.agenda?.stats.completionRate).toBe(50);
      expect(result.current.agenda?.stats.weeklyProgress).toEqual({
        current: 6,
        target: 10,
        percentage: 60,
      });

      // Motivational quote should be a non-empty string
      expect(typeof result.current.agenda?.motivationalQuote).toBe('string');
      expect(result.current.agenda?.motivationalQuote?.length).toBeGreaterThan(0);

      // Activities
      expect(result.current.activities).toHaveLength(1);

      // Tasks
      expect(result.current.tasks).toHaveLength(1);

      // Goals
      expect(result.current.goals).toHaveLength(1);

      // Streak
      expect(result.current.streak).not.toBeNull();

      // No error
      expect(result.current.error).toBeNull();
    });

    it('should set isLoading to false after data is loaded', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockApiResponse));

      const { result } = renderHook(() => useDailyAgenda());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // =========================================================================
  // 3. Error handling
  // =========================================================================

  describe('error handling', () => {
    it('should set error when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse({}, false));

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch daily agenda');
      expect(result.current.agenda).toBeNull();
    });

    it('should set error when API returns success: false with message', async () => {
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({
          success: false,
          error: { message: 'Unauthorized access' },
        })
      );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Unauthorized access');
    });

    it('should set default error when API returns success: false without message', async () => {
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ success: false })
      );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch daily agenda');
    });

    it('should set error when fetch throws a network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network failure');
    });

    it('should set generic error when a non-Error is thrown', async () => {
      mockFetch.mockRejectedValueOnce('something unexpected');

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('An error occurred');
    });
  });

  // =========================================================================
  // 4. Date parameter
  // =========================================================================

  describe('date parameter', () => {
    it('should use the provided date in the API call', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockApiResponse));

      const specificDate = new Date(2025, 5, 15); // June 15, 2025

      renderHook(() => useDailyAgenda(specificDate));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Verify the fetch URL contains the correctly formatted date
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/dashboard/daily?date=2025-06-15'
      );
    });

    it('should default to today when no date is provided', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockApiResponse));

      const now = new Date();
      const expectedYear = now.getFullYear();
      const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(now.getDate()).padStart(2, '0');
      const expectedDate = `${expectedYear}-${expectedMonth}-${expectedDay}`;

      renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // When no date is provided the hook uses today's date
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/dashboard/daily?date=${expectedDate}`
      );
    });

    it('should re-fetch when the date prop changes', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockApiResponse))
        .mockResolvedValueOnce(createFetchResponse(mockApiResponse));

      const dateA = new Date(2025, 0, 10);
      const dateB = new Date(2025, 0, 20);

      const { rerender } = renderHook(
        ({ date }) => useDailyAgenda(date),
        { initialProps: { date: dateA } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/dashboard/daily?date=2025-01-10'
      );

      rerender({ date: dateB });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/dashboard/daily?date=2025-01-20'
      );
    });
  });

  // =========================================================================
  // 5. Refresh function
  // =========================================================================

  describe('refresh function', () => {
    it('should re-fetch data when refresh is called', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockApiResponse))
        .mockResolvedValueOnce(
          createFetchResponse({
            ...mockApiResponse,
            data: {
              ...mockApiResponse.data,
              greeting: 'Good afternoon',
            },
          })
        );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agenda?.greeting).toBe('Good morning');

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.agenda?.greeting).toBe('Good afternoon');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should set isLoading to true while refreshing', async () => {
      let resolveSecondFetch: (value: unknown) => void;
      const secondFetchPromise = new Promise((resolve) => {
        resolveSecondFetch = resolve;
      });

      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockApiResponse))
        .mockReturnValueOnce(secondFetchPromise);

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.refresh();
      });

      // isLoading should be true while the second fetch is in-flight
      expect(result.current.isLoading).toBe(true);

      // Resolve the second fetch to clean up
      await act(async () => {
        resolveSecondFetch!(createFetchResponse(mockApiResponse));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // =========================================================================
  // 6. Data transformation
  // =========================================================================

  describe('data transformation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockApiResponse));
    });

    it('should transform activities correctly', async () => {
      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activity = result.current.activities[0];
      expect(activity).toEqual({
        id: 'act-1',
        type: 'study',
        title: 'Study React',
        description: 'Learn hooks',
        startTime: '09:00',
        endTime: '10:00',
        estimatedDuration: 60,
        actualDuration: 45,
        status: 'completed',
        progress: 100,
        priority: 'high',
        tags: ['react'],
        courseName: 'React Course',
        chapterName: 'Chapter 1',
      });
    });

    it('should transform tasks correctly including dueDate as Date', async () => {
      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const task = result.current.tasks[0];
      expect(task.id).toBe('task-1');
      expect(task.title).toBe('Complete assignment');
      expect(task.completed).toBe(false);
      expect(task.priority).toBe('medium');
      expect(task.tags).toEqual(['homework']);
      // dueDate should be transformed to a Date object
      expect(task.dueDate).toEqual(new Date('2025-01-20'));
      expect(task.dueDate).toBeInstanceOf(Date);
    });

    it('should transform goals and milestones correctly', async () => {
      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const goal = result.current.goals[0];
      expect(goal.id).toBe('goal-1');
      expect(goal.title).toBe('Master React');
      expect(goal.description).toBe('Learn all hooks');
      expect(goal.progress).toBe(60);
      expect(goal.status).toBe('in_progress');
      expect(goal.targetDate).toEqual(new Date('2025-03-01'));
      expect(goal.targetDate).toBeInstanceOf(Date);
      expect(goal.courseName).toBe('React Course');

      // Milestones
      expect(goal.milestones).toHaveLength(1);
      const milestone = goal.milestones[0];
      expect(milestone.id).toBe('ms-1');
      expect(milestone.title).toBe('Complete basics');
      expect(milestone.completed).toBe(true);
      expect(milestone.targetDate).toEqual(new Date('2025-02-01'));
      expect(milestone.targetDate).toBeInstanceOf(Date);
    });

    it('should transform streak correctly', async () => {
      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.streak).toEqual({
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: new Date('2025-01-14'),
        freezesAvailable: 2,
      });
      expect(result.current.streak?.lastActiveDate).toBeInstanceOf(Date);
    });

    it('should transform agenda stats with weeklyProgress sub-object', async () => {
      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.agenda?.stats).toEqual({
        streak: 5,
        plannedHours: 3,
        completedHours: 1.5,
        completionRate: 50,
        weeklyProgress: {
          current: 6,
          target: 10,
          percentage: 60,
        },
      });
    });
  });

  // =========================================================================
  // 7. Empty data
  // =========================================================================

  describe('empty data', () => {
    it('should handle empty activities, tasks, and goals arrays', async () => {
      const emptyResponse = {
        success: true,
        data: {
          ...mockApiResponse.data,
          activities: [],
          tasks: [],
          goals: [],
        },
      };

      mockFetch.mockResolvedValueOnce(createFetchResponse(emptyResponse));

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activities).toEqual([]);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.goals).toEqual([]);
      expect(result.current.agenda).not.toBeNull();
      expect(result.current.streak).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle task without dueDate', async () => {
      const responseWithNoDueDate = {
        success: true,
        data: {
          ...mockApiResponse.data,
          tasks: [
            {
              id: 'task-no-date',
              title: 'No due date task',
              completed: false,
              priority: 'low',
              tags: [],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(
        createFetchResponse(responseWithNoDueDate)
      );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks[0].dueDate).toBeUndefined();
    });

    it('should handle streak without lastActiveDate', async () => {
      const responseWithNoLastActive = {
        success: true,
        data: {
          ...mockApiResponse.data,
          streak: {
            current: 0,
            longest: 3,
            freezesAvailable: 0,
          },
        },
      };

      mockFetch.mockResolvedValueOnce(
        createFetchResponse(responseWithNoLastActive)
      );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.streak?.currentStreak).toBe(0);
      expect(result.current.streak?.longestStreak).toBe(3);
      expect(result.current.streak?.lastActiveDate).toBeUndefined();
      expect(result.current.streak?.freezesAvailable).toBe(0);
    });

    it('should handle goal with milestone that has no targetDate', async () => {
      const responseWithNoMilestoneDate = {
        success: true,
        data: {
          ...mockApiResponse.data,
          goals: [
            {
              id: 'goal-2',
              title: 'Another goal',
              progress: 20,
              status: 'on_track',
              targetDate: '2025-06-01',
              milestones: [
                {
                  id: 'ms-no-date',
                  title: 'No date milestone',
                  completed: false,
                },
              ],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(
        createFetchResponse(responseWithNoMilestoneDate)
      );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.goals[0].milestones[0].targetDate).toBeUndefined();
    });

    it('should handle activity without optional fields', async () => {
      const responseWithMinimalActivity = {
        success: true,
        data: {
          ...mockApiResponse.data,
          activities: [
            {
              id: 'act-minimal',
              type: 'quiz',
              title: 'Quick Quiz',
              estimatedDuration: 15,
              status: 'NOT_STARTED',
              progress: 0,
              priority: 'LOW',
              tags: [],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(
        createFetchResponse(responseWithMinimalActivity)
      );

      const { result } = renderHook(() => useDailyAgenda());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activity = result.current.activities[0];
      expect(activity.id).toBe('act-minimal');
      expect(activity.description).toBeUndefined();
      expect(activity.startTime).toBeUndefined();
      expect(activity.endTime).toBeUndefined();
      expect(activity.actualDuration).toBeUndefined();
      expect(activity.courseName).toBeUndefined();
      expect(activity.chapterName).toBeUndefined();
    });
  });
});

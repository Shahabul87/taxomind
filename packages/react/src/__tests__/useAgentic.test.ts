/**
 * @sam-ai/react - useAgentic Hook Tests
 * Phase 6: Testing and Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentic, type Goal, type Plan } from '../hooks/useAgentic';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockGoal = {
  id: 'goal_1',
  userId: 'user_1',
  title: 'Master React Hooks',
  description: 'Learn all React hooks',
  status: 'active' as const,
  priority: 'high' as const,
  progress: 25,
  context: { courseId: 'course_1' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPlan = {
  id: 'plan_1',
  goalId: 'goal_1',
  userId: 'user_1',
  status: 'active' as const,
  dailyMinutes: 30,
  startDate: new Date().toISOString(),
  steps: [],
  progress: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockRecommendations = {
  recommendations: [
    {
      id: 'rec_1',
      type: 'content' as const,
      title: 'Continue React Basics',
      description: 'Pick up where you left off',
      reason: 'You have an in-progress chapter',
      priority: 'high' as const,
      estimatedMinutes: 30,
      targetUrl: '/courses/1/chapters/1',
    },
    {
      id: 'rec_2',
      type: 'practice' as const,
      title: 'Practice Session',
      description: 'Reinforce your learning',
      reason: 'Regular practice improves retention',
      priority: 'medium' as const,
      estimatedMinutes: 15,
    },
  ],
  totalEstimatedTime: 45,
  generatedAt: new Date().toISOString(),
  context: { availableTime: 60 },
};

const mockProgressReport = {
  userId: 'user_1',
  period: 'weekly' as const,
  totalStudyTime: 180,
  sessionsCompleted: 12,
  topicsStudied: ['React Hooks', 'State Management'],
  skillsImproved: ['useEffect', 'useState'],
  goalsProgress: [
    { goalId: 'goal_1', goalTitle: 'Master React Hooks', progressDelta: 10, currentProgress: 35 },
  ],
  strengths: ['React Basics'],
  areasForImprovement: ['Testing'],
  streak: 5,
  generatedAt: new Date().toISOString(),
};

const mockSkills = {
  skills: [
    {
      skillId: 'skill_1',
      skillName: 'React Hooks',
      level: 'intermediate' as const,
      score: 65,
      confidence: 80,
      lastAssessedAt: new Date().toISOString(),
      trend: 'improving' as const,
    },
  ],
};

const mockCheckIn = {
  id: 'checkin_1',
  userId: 'user_1',
  type: 'DAILY_PROGRESS',
  status: 'pending' as const,
  message: 'How is your learning going today?',
  questions: [
    { id: 'q1', question: 'Rate your progress', type: 'scale' as const, required: true },
  ],
  scheduledTime: new Date().toISOString(),
};

// ============================================================================
// FETCH MOCK HELPER
// ============================================================================

function createFetchMock() {
  return vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';

    // Goals endpoints
    if (url.includes('/api/sam/agentic/goals')) {
      if (method === 'GET') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { goals: [mockGoal] } }),
        };
      }
      if (method === 'POST') {
        if (url.includes('/decompose')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { ...mockGoal, subGoals: [{ id: 'sub_1', title: 'Learn useState' }] },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: true, data: mockGoal }),
        };
      }
      if (method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { ...mockGoal, title: 'Updated Goal' } }),
        };
      }
      if (method === 'DELETE') {
        return { ok: true, json: async () => ({ success: true }) };
      }
    }

    // Plans endpoints
    if (url.includes('/api/sam/agentic/plans')) {
      if (method === 'GET') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { plans: [mockPlan] } }),
        };
      }
      if (method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockPlan }),
        };
      }
    }

    // Recommendations endpoint
    if (url.includes('/api/sam/agentic/recommendations')) {
      return {
        ok: true,
        json: async () => ({ success: true, data: mockRecommendations }),
      };
    }

    // Progress endpoint
    if (url.includes('/api/sam/agentic/analytics/progress')) {
      return {
        ok: true,
        json: async () => ({ success: true, data: mockProgressReport }),
      };
    }

    // Skills endpoint
    if (url.includes('/api/sam/agentic/skills')) {
      return {
        ok: true,
        json: async () => ({ success: true, data: mockSkills }),
      };
    }

    // Check-ins endpoint
    if (url.includes('/api/sam/agentic/checkins')) {
      if (method === 'GET') {
        return {
          ok: true,
          json: async () => ({ success: true, data: { checkIns: [mockCheckIn] } }),
        };
      }
      if (method === 'POST') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      if (method === 'DELETE') {
        return { ok: true, json: async () => ({ success: true }) };
      }
    }

    // Default fallback
    return { ok: true, json: async () => ({ success: true, data: {} }) };
  });
}

// ============================================================================
// TESTS
// ============================================================================

describe('useAgentic', () => {
  let fetchMock: ReturnType<typeof createFetchMock>;

  beforeEach(() => {
    fetchMock = createFetchMock();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // INITIALIZATION TESTS
  // --------------------------------------------------------------------------

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useAgentic());

      expect(result.current.goals).toEqual([]);
      expect(result.current.plans).toEqual([]);
      expect(result.current.recommendations).toBeNull();
      expect(result.current.progressReport).toBeNull();
      expect(result.current.skills).toEqual([]);
      expect(result.current.checkIns).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should auto-fetch goals when autoFetchGoals is true', async () => {
      renderHook(() => useAgentic({ autoFetchGoals: true }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/sam/agentic/goals',
          expect.any(Object)
        );
      });
    });

    it('should auto-fetch recommendations when autoFetchRecommendations is true', async () => {
      renderHook(() => useAgentic({ autoFetchRecommendations: true, availableTime: 45 }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/sam/agentic/recommendations?time=45',
          expect.any(Object)
        );
      });
    });

    it('should auto-fetch pending check-ins when autoFetchCheckIns is true', async () => {
      renderHook(() => useAgentic({ autoFetchCheckIns: true }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/sam/agentic/checkins?status=pending',
          expect.any(Object)
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // GOALS TESTS
  // --------------------------------------------------------------------------

  describe('Goals', () => {
    it('should fetch goals successfully', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].title).toBe('Master React Hooks');
      expect(result.current.isLoadingGoals).toBe(false);
    });

    it('should fetch goals with status filter', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals('active');
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/sam/agentic/goals?status=active',
        expect.any(Object)
      );
    });

    it('should create a new goal', async () => {
      const { result } = renderHook(() => useAgentic());

      let createdGoal: Goal | null | undefined;
      await act(async () => {
        createdGoal = await result.current.createGoal({
          title: 'Master React Hooks',
          priority: 'high',
        });
      });

      expect(createdGoal).toBeDefined();
      expect((createdGoal as Goal).title).toBe('Master React Hooks');
      expect(result.current.goals).toContainEqual(expect.objectContaining({ title: 'Master React Hooks' }));
    });

    it('should update an existing goal', async () => {
      const { result } = renderHook(() => useAgentic());

      // First fetch goals
      await act(async () => {
        await result.current.fetchGoals();
      });

      // Then update
      let updatedGoal: Goal | null = null;
      await act(async () => {
        updatedGoal = await result.current.updateGoal('goal_1', { title: 'Updated Goal' });
      });

      expect(updatedGoal).toBeDefined();
      expect(result.current.goals.find(g => g.id === 'goal_1')?.title).toBe('Updated Goal');
    });

    it('should decompose a goal into sub-goals', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      let decomposedGoal: Goal | null | undefined;
      await act(async () => {
        decomposedGoal = await result.current.decomposeGoal('goal_1');
      });

      expect((decomposedGoal as Goal).subGoals).toBeDefined();
      expect((decomposedGoal as Goal).subGoals).toHaveLength(1);
    });

    it('should delete a goal', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      expect(result.current.goals).toHaveLength(1);

      let deleted;
      await act(async () => {
        deleted = await result.current.deleteGoal('goal_1');
      });

      expect(deleted).toBe(true);
      expect(result.current.goals).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // PLANS TESTS
  // --------------------------------------------------------------------------

  describe('Plans', () => {
    it('should fetch plans successfully', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchPlans();
      });

      expect(result.current.plans).toHaveLength(1);
      expect(result.current.plans[0].status).toBe('active');
    });

    it('should create a plan for a goal', async () => {
      const { result } = renderHook(() => useAgentic());

      let createdPlan: Plan | null | undefined;
      await act(async () => {
        createdPlan = await result.current.createPlan('goal_1', 30);
      });

      expect(createdPlan).toBeDefined();
      expect((createdPlan as Plan).dailyMinutes).toBe(30);
    });

    it('should start, pause, and resume a plan', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.startPlan('plan_1');
      });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/sam/agentic/plans/plan_1/start',
        expect.objectContaining({ method: 'POST' })
      );

      await act(async () => {
        await result.current.pausePlan('plan_1');
      });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/sam/agentic/plans/plan_1/pause',
        expect.objectContaining({ method: 'POST' })
      );

      await act(async () => {
        await result.current.resumePlan('plan_1');
      });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/sam/agentic/plans/plan_1/resume',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // --------------------------------------------------------------------------
  // RECOMMENDATIONS TESTS
  // --------------------------------------------------------------------------

  describe('Recommendations', () => {
    it('should fetch recommendations successfully', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchRecommendations(60);
      });

      expect(result.current.recommendations).toBeDefined();
      expect(result.current.recommendations?.recommendations).toHaveLength(2);
      expect(result.current.recommendations?.totalEstimatedTime).toBe(45);
    });

    it('should dismiss a recommendation', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchRecommendations();
      });

      expect(result.current.recommendations?.recommendations).toHaveLength(2);

      act(() => {
        result.current.dismissRecommendation('rec_1');
      });

      expect(result.current.recommendations?.recommendations).toHaveLength(1);
      expect(result.current.recommendations?.recommendations[0].id).toBe('rec_2');
    });

    it('should accept refresh interval configuration', () => {
      const { result } = renderHook(() =>
        useAgentic({
          recommendationRefreshInterval: 5000,
        })
      );

      // Hook should initialize without errors when interval is configured
      expect(result.current.fetchRecommendations).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // PROGRESS TESTS
  // --------------------------------------------------------------------------

  describe('Progress', () => {
    it('should fetch progress report successfully', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchProgressReport('weekly');
      });

      expect(result.current.progressReport).toBeDefined();
      expect(result.current.progressReport?.totalStudyTime).toBe(180);
      expect(result.current.progressReport?.streak).toBe(5);
    });

    it('should include goals progress in report', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchProgressReport();
      });

      expect(result.current.progressReport?.goalsProgress).toHaveLength(1);
      expect(result.current.progressReport?.goalsProgress[0].progressDelta).toBe(10);
    });
  });

  // --------------------------------------------------------------------------
  // SKILLS TESTS
  // --------------------------------------------------------------------------

  describe('Skills', () => {
    it('should fetch skill map successfully', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchSkillMap();
      });

      expect(result.current.skills).toHaveLength(1);
      expect(result.current.skills[0].level).toBe('intermediate');
      expect(result.current.skills[0].trend).toBe('improving');
    });
  });

  // --------------------------------------------------------------------------
  // CHECK-INS TESTS
  // --------------------------------------------------------------------------

  describe('Check-ins', () => {
    it('should fetch check-ins successfully', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchCheckIns();
      });

      expect(result.current.checkIns).toHaveLength(1);
      expect(result.current.checkIns[0].type).toBe('DAILY_PROGRESS');
    });

    it('should respond to a check-in', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchCheckIns();
      });

      const responded = await act(async () => {
        return result.current.respondToCheckIn('checkin_1', {
          answers: [{ questionId: 'q1', answer: 8 }],
        });
      });

      expect(responded).toBe(true);
      expect(result.current.checkIns[0].status).toBe('responded');
    });

    it('should dismiss a check-in', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchCheckIns();
      });

      const dismissed = await act(async () => {
        return result.current.dismissCheckIn('checkin_1');
      });

      expect(dismissed).toBe(true);
      expect(result.current.checkIns).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // ERROR HANDLING TESTS
  // --------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      fetchMock.mockImplementationOnce(async () => ({
        ok: false,
        json: async () => ({ success: false, error: 'Server error' }),
      }));

      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.goals).toEqual([]);
    });

    it('should handle network errors', async () => {
      fetchMock.mockImplementationOnce(async () => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear errors', async () => {
      fetchMock.mockImplementationOnce(async () => ({
        ok: false,
        json: async () => ({ success: false, error: 'Some error' }),
      }));

      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // LOADING STATE TESTS
  // --------------------------------------------------------------------------

  describe('Loading States', () => {
    it('should start with loading states as false', () => {
      const { result } = renderHook(() => useAgentic());

      expect(result.current.isLoadingGoals).toBe(false);
      expect(result.current.isLoadingRecommendations).toBe(false);
      expect(result.current.isLoadingProgress).toBe(false);
      expect(result.current.isLoadingSkills).toBe(false);
      expect(result.current.isLoadingCheckIns).toBe(false);
      expect(result.current.isLoadingPlans).toBe(false);
    });

    it('should complete loading without errors for goals', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchGoals();
      });

      expect(result.current.isLoadingGoals).toBe(false);
      expect(result.current.goals).toHaveLength(1);
    });

    it('should complete loading without errors for recommendations', async () => {
      const { result } = renderHook(() => useAgentic());

      await act(async () => {
        await result.current.fetchRecommendations();
      });

      expect(result.current.isLoadingRecommendations).toBe(false);
      expect(result.current.recommendations).toBeDefined();
    });
  });
});

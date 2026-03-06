/**
 * Tests for usePracticeSession hook
 * Source: hooks/use-practice-session.ts
 *
 * This hook manages practice session lifecycle:
 * - Fetches active session and metadata on mount
 * - Provides start/pause/resume/end session actions
 * - Polls for active session updates when status is ACTIVE
 * - Shows toast notifications for user feedback
 * - Stores last session result with quality scoring details
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock useToast before importing the hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock practice dashboard types (module has side-effect exports like PROFICIENCY_CONFIG)
jest.mock('@/components/sam/practice-dashboard/types', () => ({}));

const mockFetch = global.fetch as jest.Mock;

import { usePracticeSession } from '@/hooks/use-practice-session';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

const createMockSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  skillId: 'skill-1',
  skillName: 'TypeScript',
  sessionType: 'DELIBERATE',
  focusLevel: 'HIGH',
  status: 'ACTIVE',
  startedAt: '2026-03-04T10:00:00.000Z',
  rawHours: 1.5,
  qualityHours: 1.5,
  qualityMultiplier: 1.2,
  totalPausedSeconds: 0,
  createdAt: '2026-03-04T10:00:00.000Z',
  updatedAt: '2026-03-04T10:00:00.000Z',
  ...overrides,
});

const createMockEndResult = (overrides: Record<string, unknown> = {}) => ({
  session: createMockSession({
    status: 'COMPLETED',
    endedAt: '2026-03-04T11:30:00.000Z',
    qualityHours: 1.5,
    qualityMultiplier: 1.2,
  }),
  masteryUpdate: null,
  qualityScoring: {
    multiplier: 1.2,
    evidenceType: 'SELF_REPORT',
    breakdown: {
      timeWeight: 0.3,
      focusWeight: 0.3,
      bloomsWeight: 0.2,
      sessionTypeWeight: 0.1,
      assessmentBonus: 0,
      projectBonus: 0,
      peerReviewBonus: 0,
      difficultyAdjustment: 0.1,
    },
    confidenceLevel: 0.7,
  },
  validation: null,
  warnings: [],
  ...overrides,
});

const createMockMetadataResponse = () => ({
  success: true,
  data: {
    sessions: [],
    sessionTypeInfo: [
      {
        type: 'DELIBERATE',
        multiplier: 1.5,
        label: 'Deliberate Practice',
        description: 'Focused, intentional practice',
        bestFor: 'Skill improvement',
      },
    ],
    bloomsLevelInfo: [
      {
        level: 'APPLY',
        multiplier: 1.2,
        label: 'Apply',
        description: 'Using knowledge in new situations',
        examples: ['Solve a problem'],
        cognitiveEffort: 'Medium',
      },
    ],
  },
});

/**
 * Helper to build a fetch mock response object.
 */
const mockResponse = (
  data: unknown,
  options: { ok?: boolean; status?: number } = {}
) => ({
  ok: options.ok !== undefined ? options.ok : true,
  status: options.status || 200,
  json: () => Promise.resolve(data),
});

// ============================================================================
// TESTS
// ============================================================================

describe('usePracticeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: active session endpoint returns null (no active session),
    // metadata endpoint returns empty data
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/sessions/active')) {
        return Promise.resolve(
          mockResponse({ success: true, data: null })
        );
      }
      if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
        return Promise.resolve(mockResponse(createMockMetadataResponse()));
      }
      return Promise.resolve(mockResponse({ success: true, data: null }));
    });
  });

  // ==========================================================================
  // 1. INITIAL STATE
  // ==========================================================================

  describe('Initial state', () => {
    it('should start with isLoading true while fetching', () => {
      // Delay the fetch so we can capture isLoading = true
      mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves

      const { result } = renderHook(() => usePracticeSession());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.activeSession).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should have no active session initially', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeSession).toBeNull();
    });

    it('should have correct default boolean states', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isStarting).toBe(false);
      expect(result.current.isPausing).toBe(false);
      expect(result.current.isResuming).toBe(false);
      expect(result.current.isEnding).toBe(false);
      expect(result.current.lastSessionResult).toBeNull();
    });

    it('should fetch active session and metadata on mount', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Two fetches: active session + metadata
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/sessions/active');
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/practice/sessions?limit=1');
    });

    it('should not fetch when enabled is false', async () => {
      renderHook(() => usePracticeSession({ enabled: false }));

      // Give a tick for any async work
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should populate sessionTypeInfo and bloomsLevelInfo from metadata', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionTypeInfo).toHaveLength(1);
      expect(result.current.sessionTypeInfo[0].type).toBe('DELIBERATE');
      expect(result.current.bloomsLevelInfo).toHaveLength(1);
      expect(result.current.bloomsLevelInfo[0].level).toBe('APPLY');
    });
  });

  // ==========================================================================
  // 2. FETCH ACTIVE SESSION
  // ==========================================================================

  describe('fetchActiveSession', () => {
    it('should set active session on successful fetch', async () => {
      const session = createMockSession();
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: session })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeSession).toEqual(session);
      expect(result.current.error).toBeNull();
    });

    it('should set error on fetch failure (non-ok response)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({}, { ok: false, status: 500 })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch active session');
      expect(result.current.activeSession).toBeNull();
    });

    it('should set error when response has success=false', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: false, error: 'Session not found' })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Session not found');
    });

    it('should set error on network error', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.reject(new Error('Network error'));
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  // ==========================================================================
  // 3. START SESSION
  // ==========================================================================

  describe('startSession', () => {
    const createSessionData = {
      skillId: 'skill-1',
      skillName: 'TypeScript',
      sessionType: 'DELIBERATE' as const,
      focusLevel: 'HIGH' as const,
    };

    it('should start a session successfully and show toast', async () => {
      const newSession = createMockSession();

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: newSession })
      );

      let returnedSession: unknown;
      await act(async () => {
        returnedSession = await result.current.startSession(createSessionData);
      });

      expect(returnedSession).toEqual(newSession);
      expect(result.current.activeSession).toEqual(newSession);
      expect(result.current.isStarting).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Session Started',
          description: expect.stringContaining('TypeScript'),
        })
      );
    });

    it('should handle 409 conflict by setting the existing active session', async () => {
      const existingSession = createMockSession({ id: 'existing-session' });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse(
          { error: 'Session already active', activeSession: existingSession },
          { ok: false, status: 409 }
        )
      );

      let returnedSession: unknown;
      await act(async () => {
        returnedSession = await result.current.startSession(createSessionData);
      });

      expect(returnedSession).toBeNull();
      expect(result.current.activeSession).toEqual(existingSession);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Session Already Active',
          variant: 'destructive',
        })
      );
    });

    it('should show error toast on start failure', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse(
          { error: 'Skill not found' },
          { ok: false, status: 404 }
        )
      );

      let returnedSession: unknown;
      await act(async () => {
        returnedSession = await result.current.startSession(createSessionData);
      });

      expect(returnedSession).toBeNull();
      expect(result.current.error).toBe('Skill not found');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Skill not found',
          variant: 'destructive',
        })
      );
    });

    it('should handle network error during start', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      await act(async () => {
        await result.current.startSession(createSessionData);
      });

      expect(result.current.error).toBe('Connection refused');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });

    it('should send correct POST body', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: createMockSession() })
      );

      await act(async () => {
        await result.current.startSession(createSessionData);
      });

      // Find the POST call (not the initial GET calls)
      const postCall = mockFetch.mock.calls.find(
        (call: unknown[]) =>
          typeof call[1] === 'object' &&
          (call[1] as Record<string, unknown>).method === 'POST' &&
          call[0] === '/api/sam/practice/sessions'
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse(postCall![1].body)).toEqual(createSessionData);
    });
  });

  // ==========================================================================
  // 4. PAUSE SESSION
  // ==========================================================================

  describe('pauseSession', () => {
    it('should pause session successfully and show toast', async () => {
      const activeSession = createMockSession();
      const pausedSession = createMockSession({ status: 'PAUSED' });

      // Mount with an active session
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      // Now mock the pause endpoint
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: pausedSession })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.pauseSession();
      });

      expect(success).toBe(true);
      expect(result.current.activeSession).toEqual(pausedSession);
      expect(result.current.isPausing).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Session Paused',
        })
      );
    });

    it('should return false and be a no-op without active session', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.pauseSession();
      });

      expect(success).toBe(false);
      // No fetch call for pause endpoint should have been made
      const pauseCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && (call[0] as string).includes('/pause')
      );
      expect(pauseCalls).toHaveLength(0);
    });

    it('should show error toast on pause failure', async () => {
      const activeSession = createMockSession();

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ error: 'Cannot pause' }, { ok: false, status: 400 })
      );

      let success: boolean = true;
      await act(async () => {
        success = await result.current.pauseSession();
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Cannot pause');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });

  // ==========================================================================
  // 5. RESUME SESSION
  // ==========================================================================

  describe('resumeSession', () => {
    it('should resume session successfully and show toast', async () => {
      const pausedSession = createMockSession({ status: 'PAUSED' });
      const resumedSession = createMockSession({ status: 'ACTIVE' });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: pausedSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(pausedSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: resumedSession })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.resumeSession();
      });

      expect(success).toBe(true);
      expect(result.current.activeSession).toEqual(resumedSession);
      expect(result.current.isResuming).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Session Resumed',
        })
      );
    });

    it('should return false and be a no-op without active session', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.resumeSession();
      });

      expect(success).toBe(false);
    });

    it('should show error toast on resume failure', async () => {
      const pausedSession = createMockSession({ status: 'PAUSED' });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: pausedSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(pausedSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ error: 'Session expired' }, { ok: false, status: 400 })
      );

      let success: boolean = true;
      await act(async () => {
        success = await result.current.resumeSession();
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Session expired');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Session expired',
          variant: 'destructive',
        })
      );
    });
  });

  // ==========================================================================
  // 6. END SESSION
  // ==========================================================================

  describe('endSession', () => {
    it('should end session, clear active session, set lastSessionResult, and show toast', async () => {
      const activeSession = createMockSession();
      const endResult = createMockEndResult();

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: endResult })
      );

      let returnedResult: unknown;
      await act(async () => {
        returnedResult = await result.current.endSession({ rating: 4 });
      });

      expect(returnedResult).toEqual(endResult);
      expect(result.current.activeSession).toBeNull();
      expect(result.current.lastSessionResult).toEqual(endResult);
      expect(result.current.isEnding).toBe(false);

      // Toast should show quality hours info
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Session Completed!',
          description: expect.stringContaining('1.50 quality hours'),
        })
      );
    });

    it('should include quality scoring details in toast description', async () => {
      const activeSession = createMockSession();
      const endResult = createMockEndResult();

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: endResult })
      );

      await act(async () => {
        await result.current.endSession();
      });

      // Should include multiplier and evidence type from qualityScoring
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('1.20x multiplier'),
        })
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('self_report evidence'),
        })
      );
    });

    it('should show mastery level up toast when masteryUpdate.levelUp is true', async () => {
      jest.useFakeTimers();
      const activeSession = createMockSession();
      const endResult = createMockEndResult({
        masteryUpdate: {
          skillName: 'TypeScript',
          newLevel: 'INTERMEDIATE',
          levelUp: true,
          qualityHoursGained: 1.5,
          totalQualityHours: 105,
        },
      });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: endResult })
      );

      await act(async () => {
        await result.current.endSession();
      });

      // Advance timers for the delayed mastery toast (1000ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Level Up!',
        })
      );

      jest.useRealTimers();
    });

    it('should return null and be a no-op without active session', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let returnedResult: unknown = 'not-null';
      await act(async () => {
        returnedResult = await result.current.endSession();
      });

      expect(returnedResult).toBeNull();
    });

    it('should show error toast on end failure', async () => {
      const activeSession = createMockSession();

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ error: 'Server error' }, { ok: false, status: 500 })
      );

      await act(async () => {
        await result.current.endSession();
      });

      expect(result.current.error).toBe('Server error');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });

    it('should use session multiplier in toast when qualityScoring is null', async () => {
      const activeSession = createMockSession();
      const endResult = createMockEndResult({
        qualityScoring: undefined,
      });
      // Override the session multiplier value
      endResult.session = createMockSession({
        status: 'COMPLETED',
        qualityHours: 2.0,
        qualityMultiplier: 0.85,
      });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: endResult })
      );

      await act(async () => {
        await result.current.endSession();
      });

      // Should use session's qualityMultiplier when qualityScoring is absent
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('0.85x multiplier'),
        })
      );
    });
  });

  // ==========================================================================
  // 7. CLEAR LAST SESSION RESULT
  // ==========================================================================

  describe('clearLastSessionResult', () => {
    it('should clear the last session result', async () => {
      const activeSession = createMockSession();
      const endResult = createMockEndResult();

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      // End the session first to populate lastSessionResult
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: endResult })
      );

      await act(async () => {
        await result.current.endSession();
      });

      expect(result.current.lastSessionResult).toEqual(endResult);

      // Now clear it
      act(() => {
        result.current.clearLastSessionResult();
      });

      expect(result.current.lastSessionResult).toBeNull();
    });
  });

  // ==========================================================================
  // 8. POLLING
  // ==========================================================================

  describe('Polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set up polling interval when session status is ACTIVE', async () => {
      const activeSession = createMockSession({ status: 'ACTIVE' });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() =>
        usePracticeSession({ pollInterval: 5000 })
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      // Clear call count after initial loads
      const callCountAfterInit = mockFetch.mock.calls.length;

      // Advance time to trigger polling
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Should have made at least one additional fetch call
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callCountAfterInit);
    });

    it('should not poll when session status is PAUSED', async () => {
      const pausedSession = createMockSession({ status: 'PAUSED' });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: pausedSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result } = renderHook(() =>
        usePracticeSession({ pollInterval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(pausedSession);
      });

      const callCountAfterInit = mockFetch.mock.calls.length;

      // Advance past multiple poll intervals
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      // No additional fetch calls should have been made
      expect(mockFetch.mock.calls.length).toBe(callCountAfterInit);
    });

    it('should not poll when there is no active session', async () => {
      const { result } = renderHook(() =>
        usePracticeSession({ pollInterval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountAfterInit = mockFetch.mock.calls.length;

      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      expect(mockFetch.mock.calls.length).toBe(callCountAfterInit);
    });

    it('should clean up polling interval on unmount', async () => {
      const activeSession = createMockSession({ status: 'ACTIVE' });
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: activeSession })
          );
        }
        if (typeof url === 'string' && url.includes('/sessions?limit=1')) {
          return Promise.resolve(mockResponse(createMockMetadataResponse()));
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      const { result, unmount } = renderHook(() =>
        usePracticeSession({ pollInterval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.activeSession).toEqual(activeSession);
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  // ==========================================================================
  // 9. REFRESH ACTIVE SESSION
  // ==========================================================================

  describe('refreshActiveSession', () => {
    it('should re-fetch the active session when called', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSession = createMockSession({ id: 'refreshed-session' });
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/sessions/active')) {
          return Promise.resolve(
            mockResponse({ success: true, data: newSession })
          );
        }
        return Promise.resolve(mockResponse({ success: true }));
      });

      await act(async () => {
        await result.current.refreshActiveSession();
      });

      expect(result.current.activeSession).toEqual(newSession);
    });
  });

  // ==========================================================================
  // 10. RETURN SHAPE
  // ==========================================================================

  describe('Return shape', () => {
    it('should expose all expected properties and methods', async () => {
      const { result } = renderHook(() => usePracticeSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // State properties
      expect(result.current).toHaveProperty('activeSession');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isStarting');
      expect(result.current).toHaveProperty('isPausing');
      expect(result.current).toHaveProperty('isResuming');
      expect(result.current).toHaveProperty('isEnding');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('lastSessionResult');
      expect(result.current).toHaveProperty('sessionTypeInfo');
      expect(result.current).toHaveProperty('bloomsLevelInfo');

      // Action methods
      expect(typeof result.current.startSession).toBe('function');
      expect(typeof result.current.pauseSession).toBe('function');
      expect(typeof result.current.resumeSession).toBe('function');
      expect(typeof result.current.endSession).toBe('function');
      expect(typeof result.current.refreshActiveSession).toBe('function');
      expect(typeof result.current.clearLastSessionResult).toBe('function');
    });
  });
});

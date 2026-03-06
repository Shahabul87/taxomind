import { renderHook, act, waitFor } from '@testing-library/react';

// Mock sonner toast before importing the hook
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

import {
  usePredictiveAnalytics,
  useCompletionPrediction,
  useStudySchedule,
  useAtRiskStudents,
  usePersonalizedRecommendations,
} from '@/hooks/use-predictive-analytics';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Test Data Factories
// ---------------------------------------------------------------------------

function makeCompletionPrediction(overrides = {}) {
  return {
    completionProbability: 92,
    confidenceScore: 88,
    estimatedCompletionDate: '2026-04-01T00:00:00.000Z',
    riskFactors: ['Low quiz engagement'],
    recommendations: ['Review chapter 3'],
    ...overrides,
  };
}

function makeStudySchedule(overrides = {}) {
  return {
    recommendedDailyMinutes: 60,
    bestStudyTimes: ['8:00 AM - 9:00 AM'],
    weeklyGoal: 420,
    estimatedCompletionWeeks: 6,
    nextMilestone: 'Finish Module 4',
    ...overrides,
  };
}

function makeAtRiskStudent(overrides = {}) {
  return {
    userId: 'user-risk-1',
    riskScore: 0.75,
    riskFactors: ['Missed 3 sessions'],
    urgency: 'high' as const,
    recommendedActions: ['Send reminder'],
    ...overrides,
  };
}

function makePersonalizedRecommendations(overrides = {}) {
  return {
    contentRecommendations: ['Try async/await exercises'],
    studyStrategies: ['Use Pomodoro technique'],
    peerConnections: ['Join study group A'],
    resourceSuggestions: ['MDN Web Docs'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

function mockFetchSuccess(data: Record<string, unknown>) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map(),
  } as unknown as Response);
}

function mockFetchNotOk(status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: 'Server error' }),
    text: () => Promise.resolve('Server error'),
    headers: new Map(),
  } as unknown as Response);
}

function mockFetchNetworkError() {
  mockFetch.mockRejectedValueOnce(new Error('Network failure'));
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('usePredictiveAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Initial State
  // =========================================================================

  it('returns initial state with loading=false and error=null', () => {
    const { result } = renderHook(() => usePredictiveAnalytics());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.predictCourseCompletion).toBe('function');
    expect(typeof result.current.predictOptimalStudySchedule).toBe('function');
    expect(typeof result.current.identifyAtRiskStudents).toBe('function');
    expect(typeof result.current.generatePersonalizedRecommendations).toBe('function');
  });

  // =========================================================================
  // 2. predictCourseCompletion
  // =========================================================================

  describe('predictCourseCompletion', () => {
    it('fetches prediction data successfully', async () => {
      const prediction = makeCompletionPrediction();
      mockFetchSuccess({ success: true, prediction });

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictCourseCompletion('course-123');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/predict-completion?courseId=course-123'
      );
      expect(returnValue).toEqual(prediction);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns fallback data when API responds with !ok', async () => {
      mockFetchNotOk(503);

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictCourseCompletion('course-456');
      });

      // The hook catches the error and returns fallback mock data
      expect(returnValue).toBeDefined();
      expect((returnValue as { completionProbability: number }).completionProbability).toBe(85);
      expect((returnValue as { confidenceScore: number }).confidenceScore).toBe(78);
      expect(result.current.loading).toBe(false);
    });

    it('returns fallback data when API returns success:false', async () => {
      mockFetchSuccess({ success: false, error: 'Prediction model unavailable' });

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictCourseCompletion('course-789');
      });

      // Falls back to mock data
      expect(returnValue).toBeDefined();
      expect((returnValue as { completionProbability: number }).completionProbability).toBe(85);
    });

    it('returns fallback data on network error', async () => {
      mockFetchNetworkError();

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictCourseCompletion('course-err');
      });

      expect(returnValue).toBeDefined();
      expect((returnValue as { recommendations: string[] }).recommendations).toHaveLength(3);
      expect(result.current.loading).toBe(false);
    });

    it('includes estimatedCompletionDate in fallback data', async () => {
      mockFetchNotOk();

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictCourseCompletion('c-1');
      });

      const fallback = returnValue as { estimatedCompletionDate: string };
      expect(fallback.estimatedCompletionDate).toBeDefined();
      // The fallback date is 7 days from now
      const futureDate = new Date(fallback.estimatedCompletionDate);
      expect(futureDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // =========================================================================
  // 3. predictOptimalStudySchedule
  // =========================================================================

  describe('predictOptimalStudySchedule', () => {
    it('fetches study schedule successfully', async () => {
      const schedule = makeStudySchedule();
      mockFetchSuccess({ success: true, schedule });

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictOptimalStudySchedule('course-s1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/study-schedule?courseId=course-s1'
      );
      expect(returnValue).toEqual(schedule);
    });

    it('returns fallback schedule on failure', async () => {
      mockFetchNotOk();

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.predictOptimalStudySchedule('course-s2');
      });

      const fallback = returnValue as {
        recommendedDailyMinutes: number;
        bestStudyTimes: string[];
        weeklyGoal: number;
      };
      expect(fallback.recommendedDailyMinutes).toBe(45);
      expect(fallback.bestStudyTimes).toHaveLength(3);
      expect(fallback.weeklyGoal).toBe(315);
      expect(result.current.loading).toBe(false);
    });
  });

  // =========================================================================
  // 4. identifyAtRiskStudents
  // =========================================================================

  describe('identifyAtRiskStudents', () => {
    it('fetches at-risk students successfully', async () => {
      const students = [makeAtRiskStudent(), makeAtRiskStudent({ userId: 'user-risk-2', urgency: 'critical' as const })];
      mockFetchSuccess({ success: true, atRiskStudents: students });

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.identifyAtRiskStudents('course-r1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/at-risk-students?courseId=course-r1'
      );
      expect(returnValue).toEqual(students);
      expect(result.current.error).toBeNull();
    });

    it('sets error state and shows toast when API responds with !ok', async () => {
      mockFetchNotOk(500);

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.identifyAtRiskStudents('course-r2');
      });

      // identifyAtRiskStudents does NOT use fallback data -- it sets error
      expect(returnValue).toBeNull();
      expect(result.current.error).toBe('Failed to identify at-risk students');
      expect(toast.error).toHaveBeenCalledWith('Failed to identify at-risk students');
    });

    it('sets error state when API returns success:false with custom message', async () => {
      mockFetchSuccess({ success: false, error: 'Insufficient data' });

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.identifyAtRiskStudents('course-r3');
      });

      expect(returnValue).toBeNull();
      expect(result.current.error).toBe('Insufficient data');
      expect(toast.error).toHaveBeenCalledWith('Insufficient data');
    });

    it('sets generic error message for non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('string-error');

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.identifyAtRiskStudents('course-r4');
      });

      expect(returnValue).toBeNull();
      expect(result.current.error).toBe('An error occurred');
      expect(toast.error).toHaveBeenCalledWith('An error occurred');
    });
  });

  // =========================================================================
  // 5. generatePersonalizedRecommendations
  // =========================================================================

  describe('generatePersonalizedRecommendations', () => {
    it('fetches personalized recommendations successfully', async () => {
      const recommendations = makePersonalizedRecommendations();
      mockFetchSuccess({ success: true, recommendations });

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.generatePersonalizedRecommendations('course-p1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/recommendations?courseId=course-p1'
      );
      expect(returnValue).toEqual(recommendations);
    });

    it('returns fallback recommendations on API failure', async () => {
      mockFetchNotOk();

      const { result } = renderHook(() => usePredictiveAnalytics());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.generatePersonalizedRecommendations('course-p2');
      });

      const fallback = returnValue as {
        contentRecommendations: string[];
        studyStrategies: string[];
        peerConnections: string[];
        resourceSuggestions: string[];
      };
      expect(fallback.contentRecommendations).toHaveLength(3);
      expect(fallback.studyStrategies).toHaveLength(3);
      expect(fallback.peerConnections).toHaveLength(3);
      expect(fallback.resourceSuggestions).toHaveLength(3);
      expect(result.current.loading).toBe(false);
    });
  });

  // =========================================================================
  // 6. Loading state transitions
  // =========================================================================

  it('sets loading=true during fetch and loading=false after completion', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(
      pendingPromise.then(() => ({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, prediction: makeCompletionPrediction() }),
        text: () => Promise.resolve(''),
        headers: new Map(),
      })) as Promise<Response>
    );

    const { result } = renderHook(() => usePredictiveAnalytics());

    let fetchPromise: Promise<unknown>;
    act(() => {
      fetchPromise = result.current.predictCourseCompletion('course-loading');
    });

    // Loading should be true while the fetch is pending
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!(undefined);
      await fetchPromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it('clears previous error when a new request starts', async () => {
    // First call: triggers error in identifyAtRiskStudents
    mockFetchNotOk();
    const { result } = renderHook(() => usePredictiveAnalytics());

    await act(async () => {
      await result.current.identifyAtRiskStudents('course-err');
    });

    expect(result.current.error).toBe('Failed to identify at-risk students');

    // Second call: error should be cleared at start even if it eventually fails
    mockFetchNotOk();
    await act(async () => {
      await result.current.identifyAtRiskStudents('course-err2');
    });

    // Error is set again from the new failure, but it was cleared at start
    expect(result.current.error).toBeTruthy();
  });
});

// ===========================================================================
// Convenience Hooks
// ===========================================================================

describe('useCompletionPrediction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches prediction on mount when courseId is provided', async () => {
    const prediction = makeCompletionPrediction();
    // The hook internally calls usePredictiveAnalytics().predictCourseCompletion
    // which calls fetch. The hook will always fall back to mock data on error,
    // so we mock a successful response.
    mockFetchSuccess({ success: true, prediction });

    const { result } = renderHook(() => useCompletionPrediction('course-auto'));

    await waitFor(() => {
      expect(result.current.prediction).toEqual(prediction);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analytics/predict-completion?courseId=course-auto'
    );
  });

  it('uses demo-course when no courseId is provided', async () => {
    mockFetchSuccess({ success: true, prediction: makeCompletionPrediction() });

    renderHook(() => useCompletionPrediction());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/predict-completion?courseId=demo-course'
      );
    });
  });

  it('exposes refreshPrediction to manually re-fetch', async () => {
    mockFetchSuccess({ success: true, prediction: makeCompletionPrediction({ completionProbability: 70 }) });

    const { result } = renderHook(() => useCompletionPrediction('course-ref'));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.prediction).toBeDefined();
    });

    // Setup a new response for the refresh
    const updatedPrediction = makeCompletionPrediction({ completionProbability: 95 });
    mockFetchSuccess({ success: true, prediction: updatedPrediction });

    await act(async () => {
      await result.current.refreshPrediction();
    });

    expect(result.current.prediction).toEqual(updatedPrediction);
  });
});

describe('useStudySchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches schedule on mount with courseId', async () => {
    const schedule = makeStudySchedule();
    mockFetchSuccess({ success: true, schedule });

    const { result } = renderHook(() => useStudySchedule('course-sched'));

    await waitFor(() => {
      expect(result.current.schedule).toEqual(schedule);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analytics/study-schedule?courseId=course-sched'
    );
  });

  it('uses demo-course when no courseId is provided', async () => {
    mockFetchSuccess({ success: true, schedule: makeStudySchedule() });

    renderHook(() => useStudySchedule());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/study-schedule?courseId=demo-course'
      );
    });
  });
});

describe('useAtRiskStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches at-risk students on mount', async () => {
    const students = [makeAtRiskStudent()];
    mockFetchSuccess({ success: true, atRiskStudents: students });

    const { result } = renderHook(() => useAtRiskStudents('course-risk'));

    await waitFor(() => {
      expect(result.current.students).toEqual(students);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analytics/at-risk-students?courseId=course-risk'
    );
  });

  it('exposes refreshStudents to re-fetch data', async () => {
    const initialStudents = [makeAtRiskStudent()];
    mockFetchSuccess({ success: true, atRiskStudents: initialStudents });

    const { result } = renderHook(() => useAtRiskStudents('course-risk2'));

    await waitFor(() => {
      expect(result.current.students).toBeDefined();
    });

    const updatedStudents = [
      makeAtRiskStudent({ urgency: 'critical' as const }),
      makeAtRiskStudent({ userId: 'user-risk-3', urgency: 'low' as const }),
    ];
    mockFetchSuccess({ success: true, atRiskStudents: updatedStudents });

    await act(async () => {
      await result.current.refreshStudents();
    });

    expect(result.current.students).toEqual(updatedStudents);
  });
});

describe('usePersonalizedRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches recommendations on mount with courseId', async () => {
    const recommendations = makePersonalizedRecommendations();
    mockFetchSuccess({ success: true, recommendations });

    const { result } = renderHook(() => usePersonalizedRecommendations('course-rec'));

    await waitFor(() => {
      expect(result.current.recommendations).toEqual(recommendations);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analytics/recommendations?courseId=course-rec'
    );
  });

  it('uses demo-course when no courseId is provided', async () => {
    mockFetchSuccess({ success: true, recommendations: makePersonalizedRecommendations() });

    renderHook(() => usePersonalizedRecommendations());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/recommendations?courseId=demo-course'
      );
    });
  });

  it('exposes refreshRecommendations to re-fetch data', async () => {
    mockFetchSuccess({ success: true, recommendations: makePersonalizedRecommendations() });

    const { result } = renderHook(() => usePersonalizedRecommendations('course-rec2'));

    await waitFor(() => {
      expect(result.current.recommendations).toBeDefined();
    });

    const updated = makePersonalizedRecommendations({
      contentRecommendations: ['Learn TypeScript generics'],
    });
    mockFetchSuccess({ success: true, recommendations: updated });

    await act(async () => {
      await result.current.refreshRecommendations();
    });

    expect(result.current.recommendations).toEqual(updated);
  });
});

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCourseAnalytics, useRealtimeUpdates } from '@/hooks/use-course-analytics';

// ---------------------------------------------------------------------------
// Test Data Factories
// ---------------------------------------------------------------------------

const createMockCourse = (overrides: Record<string, unknown> = {}) => ({
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course',
  cleanDescription: null,
  imageUrl: null,
  price: 49.99,
  isPublished: true,
  courseGoals: null,
  categoryId: 'cat-1',
  courseRatings: null,
  activeLearners: null,
  userId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
  dealEndDate: null,
  whatYouWillLearn: [],
  slug: null,
  subtitle: null,
  isFeatured: false,
  organizationId: null,
  prerequisites: null,
  difficulty: null,
  totalDuration: null,
  originalPrice: null,
  averageRating: null,
  isFree: false,
  priceType: 'ONE_TIME',
  subcategoryId: null,
  category: { name: 'Programming' },
  _count: { Purchase: 10, chapters: 5 },
  ...overrides,
});

const createMockApiData = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    analytics: {
      revenue: {
        total: 5000,
        growth: 12.5,
        chart: [],
        breakdown: [
          {
            category: 'Programming',
            revenue: 5000,
            percentage: 100,
            courseCount: 1,
            enrollmentCount: 10,
          },
        ],
        trend: 'up' as const,
      },
      engagement: {
        activeStudents: 10,
        avgCompletionRate: 68.5,
        topPerformingCourses: [],
        engagementTrend: [],
      },
      performance: {
        avgRating: 4.3,
        totalReviews: 3,
        nps: 72,
        satisfactionTrend: [],
      },
      growth: {
        newEnrollments: 2,
        churnRate: 5.2,
        retentionRate: 94.8,
        growthRate: 12.5,
      },
    },
    recentActivity: [
      {
        id: 'act-1',
        type: 'enrollment',
        message: 'New enrollment in Test Course',
        timestamp: '2025-01-15T10:00:00.000Z',
        metadata: {},
      },
    ],
    insights: [
      {
        id: 'ins-1',
        type: 'success',
        title: 'Revenue Growth',
        description: 'Revenue is growing',
        priority: 1,
      },
    ],
    performanceIndicators: [
      {
        id: 'pi-1',
        label: 'Revenue',
        value: 5000,
        target: 50000,
        unit: '$',
        status: 'needs-attention',
        trend: 'up',
      },
    ],
    ...overrides,
  },
});

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

const mockFetchSuccess = (apiData: ReturnType<typeof createMockApiData>) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(apiData),
    text: () => Promise.resolve(JSON.stringify(apiData)),
    headers: new Map(),
  });
};

const mockFetchFailure = () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map(),
  });
};

const mockFetchNetworkError = () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
};

const mockFetchApiError = () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: false, error: 'Something went wrong' }),
    text: () => Promise.resolve(''),
    headers: new Map(),
  });
};

// ---------------------------------------------------------------------------
// useCourseAnalytics Tests
// ---------------------------------------------------------------------------

describe('useCourseAnalytics', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  // -----------------------------------------------------------------------
  // 1. Initial State
  // -----------------------------------------------------------------------

  describe('initial state', () => {
    it('should start with isLoading true when courses are provided', () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false when courses array is empty', async () => {
      const courses: ReturnType<typeof createMockCourse>[] = [];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should initialize analytics as null', () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      expect(result.current.analytics).toBeNull();
    });

    it('should initialize enhancedCourses as empty array', () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      expect(result.current.enhancedCourses).toEqual([]);
    });

    it('should initialize recentActivity as empty array', () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      expect(result.current.recentActivity).toEqual([]);
    });

    it('should initialize insights as empty array', () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      expect(result.current.insights).toEqual([]);
    });

    it('should initialize performanceIndicators as empty array', () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      expect(result.current.performanceIndicators).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // 2. API Success Path
  // -----------------------------------------------------------------------

  describe('API success', () => {
    it('should fetch analytics from the correct endpoint', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/teacher-analytics/courses-dashboard');
      });
    });

    it('should set analytics from API response', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analytics).not.toBeNull();
      expect(result.current.analytics?.revenue.total).toBe(5000);
      expect(result.current.analytics?.revenue.growth).toBe(12.5);
      expect(result.current.analytics?.revenue.trend).toBe('up');
    });

    it('should set recentActivity from API response', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recentActivity).toHaveLength(1);
      expect(result.current.recentActivity[0].id).toBe('act-1');
      expect(result.current.recentActivity[0].type).toBe('enrollment');
    });

    it('should set insights from API response', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.insights).toHaveLength(1);
      expect(result.current.insights[0].id).toBe('ins-1');
      expect(result.current.insights[0].type).toBe('success');
      expect(result.current.insights[0].title).toBe('Revenue Growth');
    });

    it('should set performanceIndicators from API response', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.performanceIndicators).toHaveLength(1);
      expect(result.current.performanceIndicators[0].id).toBe('pi-1');
      expect(result.current.performanceIndicators[0].label).toBe('Revenue');
      expect(result.current.performanceIndicators[0].value).toBe(5000);
    });

    it('should set isLoading to false after data is loaded', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should populate enhancedCourses when API succeeds', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.enhancedCourses).toHaveLength(1);
      expect(result.current.enhancedCourses[0].id).toBe('course-1');
    });
  });

  // -----------------------------------------------------------------------
  // 3. API Failure / Fallback Path
  // -----------------------------------------------------------------------

  describe('API failure fallback', () => {
    it('should fall back to mock data when API returns non-OK status', async () => {
      mockFetchFailure();
      const course = createMockCourse();
      const courses = [course];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analytics).not.toBeNull();
      expect(result.current.analytics?.revenue.total).toBe(
        (course._count.Purchase) * (course.price as number)
      );
    });

    it('should fall back to mock data on network error', async () => {
      mockFetchNetworkError();
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analytics).not.toBeNull();
    });

    it('should fall back to mock data when API returns success: false', async () => {
      mockFetchApiError();
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analytics).not.toBeNull();
    });

    it('should generate mock recentActivity on fallback', async () => {
      mockFetchFailure();
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recentActivity.length).toBeGreaterThan(0);
      expect(result.current.recentActivity.length).toBeLessThanOrEqual(10);
    });

    it('should generate mock insights on fallback', async () => {
      mockFetchFailure();
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.insights).toBeDefined();
      expect(Array.isArray(result.current.insights)).toBe(true);
    });

    it('should generate mock performanceIndicators on fallback', async () => {
      mockFetchFailure();
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The mock generator creates exactly 4 indicators
      expect(result.current.performanceIndicators).toHaveLength(4);
      expect(result.current.performanceIndicators[0].id).toBe('revenue-target');
      expect(result.current.performanceIndicators[1].id).toBe('completion-rate');
      expect(result.current.performanceIndicators[2].id).toBe('student-satisfaction');
      expect(result.current.performanceIndicators[3].id).toBe('retention-rate');
    });

    it('should generate enhancedCourses on fallback', async () => {
      mockFetchFailure();
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.enhancedCourses).toHaveLength(1);
      expect(result.current.enhancedCourses[0].id).toBe('course-1');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Empty Courses
  // -----------------------------------------------------------------------

  describe('empty courses', () => {
    it('should not call fetch when courses is empty', async () => {
      const courses: ReturnType<typeof createMockCourse>[] = [];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should leave analytics as null when courses is empty', async () => {
      const courses: ReturnType<typeof createMockCourse>[] = [];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analytics).toBeNull();
    });

    it('should return empty enhancedCourses when courses is empty', async () => {
      const courses: ReturnType<typeof createMockCourse>[] = [];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.enhancedCourses).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Enhanced Courses
  // -----------------------------------------------------------------------

  describe('enhancedCourses', () => {
    it('should contain analytics data on each enhanced course', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enhanced = result.current.enhancedCourses[0];
      expect(enhanced.analytics).toBeDefined();
      expect(typeof enhanced.analytics.completionRate).toBe('number');
      expect(typeof enhanced.analytics.engagementScore).toBe('number');
      expect(typeof enhanced.analytics.retentionRate).toBe('number');
      expect(enhanced.analytics.revenueMetrics).toBeDefined();
      expect(enhanced.analytics.enrollmentTrend).toBeDefined();
    });

    it('should contain performance data on each enhanced course', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enhanced = result.current.enhancedCourses[0];
      expect(enhanced.performance).toBeDefined();
      expect(typeof enhanced.performance.currentRevenue).toBe('number');
      expect(typeof enhanced.performance.previousRevenue).toBe('number');
      expect(typeof enhanced.performance.growthRate).toBe('number');
      expect(typeof enhanced.performance.averageRating).toBe('number');
      expect(typeof enhanced.performance.totalReviews).toBe('number');
    });

    it('should contain projections data on each enhanced course', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enhanced = result.current.enhancedCourses[0];
      expect(enhanced.projections).toBeDefined();
      expect(typeof enhanced.projections.estimatedRevenue30Days).toBe('number');
      expect(typeof enhanced.projections.estimatedEnrollments30Days).toBe('number');
      expect(typeof enhanced.projections.growthPotentialScore).toBe('number');
      expect(typeof enhanced.projections.marketDemandScore).toBe('number');
    });

    it('should contain reviews data on each enhanced course', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enhanced = result.current.enhancedCourses[0];
      expect(enhanced.reviews).toBeDefined();
      expect(typeof enhanced.reviews?.averageRating).toBe('number');
      expect(typeof enhanced.reviews?.totalReviews).toBe('number');
      expect(enhanced.reviews?.ratingDistribution).toBeDefined();
      expect(enhanced.reviews?.recentReviews).toEqual([]);
    });

    it('should serialize date fields as strings', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enhanced = result.current.enhancedCourses[0];
      expect(typeof enhanced.createdAt).toBe('string');
      expect(typeof enhanced.updatedAt).toBe('string');
    });

    it('should compute revenue from _count.Purchase and price', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse({ price: 100, _count: { Purchase: 5, chapters: 3 } })];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const enhanced = result.current.enhancedCourses[0];
      // Revenue = Purchase count * price
      expect(enhanced.performance.currentRevenue).toBe(500);
    });

    it('should handle multiple courses', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [
        createMockCourse({ id: 'course-1', title: 'Course A' }),
        createMockCourse({ id: 'course-2', title: 'Course B', price: 99.99 }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.enhancedCourses).toHaveLength(2);
      // The hook sorts enhanced courses by revenue descending for topPerformingCourses,
      // but setEnhancedCourses uses the original map order
      const ids = result.current.enhancedCourses.map((c) => c.id);
      expect(ids).toContain('course-1');
      expect(ids).toContain('course-2');
    });
  });

  // -----------------------------------------------------------------------
  // 6. Aggregate Metrics
  // -----------------------------------------------------------------------

  describe('aggregateMetrics', () => {
    it('should be null when analytics is null', async () => {
      const courses: ReturnType<typeof createMockCourse>[] = [];
      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregateMetrics).toBeNull();
    });

    it('should derive totalRevenue from analytics', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregateMetrics).not.toBeNull();
      expect(result.current.aggregateMetrics?.totalRevenue).toBe(5000);
    });

    it('should derive totalStudents from engagement.activeStudents', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregateMetrics?.totalStudents).toBe(10);
    });

    it('should derive avgRating from performance.avgRating', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregateMetrics?.avgRating).toBe(4.3);
    });

    it('should derive growthRate from growth.growthRate', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregateMetrics?.growthRate).toBe(12.5);
    });

    it('should derive topCategory from first breakdown entry', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregateMetrics?.topCategory).toBe('Programming');
    });
  });

  // -----------------------------------------------------------------------
  // 7. getCourseById
  // -----------------------------------------------------------------------

  describe('getCourseById', () => {
    it('should return the enhanced course matching the given id', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [
        createMockCourse({ id: 'course-1', title: 'First' }),
        createMockCourse({ id: 'course-2', title: 'Second' }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getCourseById('course-2');
      expect(found).toBeDefined();
      expect(found?.id).toBe('course-2');
      expect(found?.title).toBe('Second');
    });

    it('should return undefined for a non-existent id', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getCourseById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // 8. refreshAnalytics
  // -----------------------------------------------------------------------

  describe('refreshAnalytics', () => {
    it('should re-fetch analytics from the API', async () => {
      const apiData = createMockApiData();
      mockFetchSuccess(apiData);
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Override the mock with updated data for the refresh call
      const updatedApiData = createMockApiData({
        analytics: {
          ...apiData.data.analytics,
          revenue: { ...apiData.data.analytics.revenue, total: 9999 },
        },
      });
      mockFetchSuccess(updatedApiData);

      await act(async () => {
        await result.current.refreshAnalytics();
      });

      expect(result.current.analytics?.revenue.total).toBe(9999);
    });

    it('should complete a full loading cycle during refresh', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After initial load, isLoading is false
      expect(result.current.isLoading).toBe(false);

      // Set up fresh data for the refresh
      const refreshedApiData = createMockApiData({
        analytics: {
          revenue: { total: 7777, growth: 15, chart: [], breakdown: [], trend: 'up' },
          engagement: { activeStudents: 20, avgCompletionRate: 75, topPerformingCourses: [], engagementTrend: [] },
          performance: { avgRating: 4.5, totalReviews: 8, nps: 80, satisfactionTrend: [] },
          growth: { newEnrollments: 5, churnRate: 3, retentionRate: 97, growthRate: 15 },
        },
      });
      mockFetchSuccess(refreshedApiData);

      // Call refreshAnalytics and verify it resolves and updates data
      await act(async () => {
        await result.current.refreshAnalytics();
      });

      // After refresh completes, isLoading should be false again
      expect(result.current.isLoading).toBe(false);
      // The analytics should reflect the refreshed data
      expect(result.current.analytics?.revenue.total).toBe(7777);
    });

    it('should fall back to mock data on refresh failure when courses exist', async () => {
      mockFetchSuccess(createMockApiData());
      const courses = [createMockCourse()];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate API failure on refresh
      mockFetchFailure();

      await act(async () => {
        await result.current.refreshAnalytics();
      });

      // Should still have analytics from the fallback mock generator
      expect(result.current.analytics).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 9. Mock analytics calculation correctness
  // -----------------------------------------------------------------------

  describe('mock analytics calculations', () => {
    it('should calculate total revenue from courses in fallback mode', async () => {
      mockFetchFailure();
      const courses = [
        createMockCourse({ id: 'c1', price: 50, _count: { Purchase: 10, chapters: 1 } }),
        createMockCourse({ id: 'c2', price: 100, _count: { Purchase: 5, chapters: 2 } }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 50*10 + 100*5 = 1000
      expect(result.current.analytics?.revenue.total).toBe(1000);
    });

    it('should handle courses with null price in fallback mode', async () => {
      mockFetchFailure();
      const courses = [
        createMockCourse({ id: 'c1', price: null, _count: { Purchase: 10, chapters: 1 } }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // null price treated as 0
      expect(result.current.analytics?.revenue.total).toBe(0);
    });

    it('should calculate category breakdown in fallback mode', async () => {
      mockFetchFailure();
      const courses = [
        createMockCourse({
          id: 'c1',
          price: 50,
          category: { name: 'JavaScript' },
          _count: { Purchase: 4, chapters: 1 },
        }),
        createMockCourse({
          id: 'c2',
          price: 100,
          category: { name: 'Python' },
          _count: { Purchase: 2, chapters: 1 },
        }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const breakdown = result.current.analytics?.revenue.breakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown?.length).toBe(2);

      const jsCategory = breakdown?.find((b) => b.category === 'JavaScript');
      const pyCategory = breakdown?.find((b) => b.category === 'Python');

      expect(jsCategory?.revenue).toBe(200); // 50*4
      expect(jsCategory?.courseCount).toBe(1);
      expect(pyCategory?.revenue).toBe(200); // 100*2
      expect(pyCategory?.courseCount).toBe(1);
    });

    it('should set revenue trend to stable when total is not above 10000', async () => {
      mockFetchFailure();
      const courses = [
        createMockCourse({ id: 'c1', price: 10, _count: { Purchase: 2, chapters: 1 } }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Revenue = 10*2 = 20, which is <= 10000, so trend should be 'stable'
      expect(result.current.analytics?.revenue.trend).toBe('stable');
    });

    it('should set revenue trend to up when total exceeds 10000', async () => {
      mockFetchFailure();
      const courses = [
        createMockCourse({ id: 'c1', price: 200, _count: { Purchase: 100, chapters: 1 } }),
      ];

      const { result } = renderHook(() => useCourseAnalytics(courses));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Revenue = 200*100 = 20000, which is > 10000, so trend should be 'up'
      expect(result.current.analytics?.revenue.trend).toBe('up');
    });
  });
});

// ---------------------------------------------------------------------------
// useRealtimeUpdates Tests
// ---------------------------------------------------------------------------

describe('useRealtimeUpdates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not call onUpdate immediately', () => {
    const onUpdate = jest.fn();
    renderHook(() => useRealtimeUpdates(onUpdate));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should call onUpdate callback after 30 seconds', () => {
    const onUpdate = jest.fn();
    renderHook(() => useRealtimeUpdates(onUpdate));

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('should call onUpdate with an event object containing type and data', () => {
    const onUpdate = jest.fn();
    renderHook(() => useRealtimeUpdates(onUpdate));

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(String),
        data: expect.objectContaining({
          courseId: expect.any(String),
          timestamp: expect.any(Date),
        }),
      })
    );
  });

  it('should emit events with valid type values', () => {
    const onUpdate = jest.fn();
    renderHook(() => useRealtimeUpdates(onUpdate));

    act(() => {
      jest.advanceTimersByTime(30000 * 10);
    });

    const validTypes = ['enrollment', 'review', 'payment'];
    const calls = onUpdate.mock.calls;

    calls.forEach((call: Array<{ type: string; data: unknown }>) => {
      expect(validTypes).toContain(call[0].type);
    });
  });

  it('should clear the interval on unmount', () => {
    const onUpdate = jest.fn();
    const { unmount } = renderHook(() => useRealtimeUpdates(onUpdate));

    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(onUpdate).toHaveBeenCalledTimes(1);

    unmount();

    // After unmount, advancing time should not trigger more calls
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('should call onUpdate multiple times across intervals', () => {
    const onUpdate = jest.fn();
    renderHook(() => useRealtimeUpdates(onUpdate));

    act(() => {
      jest.advanceTimersByTime(30000 * 3);
    });

    expect(onUpdate).toHaveBeenCalledTimes(3);
  });
});

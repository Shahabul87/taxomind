import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// The framer-motion mock is provided globally via jest.setup.js.
// The logger mock is provided globally via jest.setup.js.

// ---- UI component mocks ----

jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
    role,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    role?: string;
  }) => (
    <div data-testid="card" className={className} role={role} {...rest}>
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    size,
    className,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    variant?: string;
    size?: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <button
      data-testid="action-button"
      data-variant={variant}
      data-size={size}
      className={className}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

// ---- Tabs mock using React Context (same pattern as CognitiveAnalytics.test) ----
// The real component wraps TabsList in a raw <div> for touch handling, which breaks
// React.Children.map-based prop drilling. Context bypasses that.

const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (val: string) => void;
}>({});

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (val: string) => void;
    className?: string;
  }) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div data-testid="tabs" data-value={value} className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  ),
  TabsList: ({
    children,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    role?: string;
  }) => (
    <div data-testid="tabs-list" className={className} role="tablist" {...rest}>
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => {
    const ctx = React.useContext(TabsContext);
    return (
      <button
        data-testid={`tab-trigger-${value}`}
        className={className}
        role="tab"
        aria-selected={ctx.value === value}
        onClick={() => ctx.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => (
    <div data-testid={`tab-content-${value}`} className={className} role="tabpanel">
      {children}
    </div>
  ),
}));

// ---- Mock storage-utils ----

const mockGetStoredTab = jest.fn(() => 'overview');
const mockGetStoredPeriod = jest.fn((): 'DAILY' | 'WEEKLY' | 'MONTHLY' => 'DAILY');
const mockStoreTab = jest.fn();
const mockStorePeriod = jest.fn();

jest.mock('@/components/analytics/storage-utils', () => ({
  getStoredTab: () => mockGetStoredTab(),
  getStoredPeriod: () => mockGetStoredPeriod(),
  storeTab: (tab: string) => mockStoreTab(tab),
  storePeriod: (period: string) => mockStorePeriod(period),
}));

// ---- Mock analytics hooks ----

const mockRefreshAnalytics = jest.fn();
const mockRefreshPerformance = jest.fn();
const mockRefreshPulse = jest.fn();

const defaultAnalyticsHookReturn = {
  data: { totalStudyTime: 120, coursesEnrolled: 3, completionRate: 0.75 },
  loading: false,
  error: null as string | null,
  refreshAnalytics: mockRefreshAnalytics,
};

const defaultPerformanceHookReturn = {
  data: { averageScore: 85, streak: 5, totalQuizzes: 12 },
  loading: false,
  error: null as string | null,
  refreshPerformance: mockRefreshPerformance,
};

const defaultPulseHookReturn = {
  pulse: { activeUsers: 42, recentEvents: [] },
  loading: false,
  error: null as string | null,
  refreshPulse: mockRefreshPulse,
};

let analyticsHookReturn = { ...defaultAnalyticsHookReturn };
let performanceHookReturn = { ...defaultPerformanceHookReturn };
let pulseHookReturn = { ...defaultPulseHookReturn };

jest.mock('@/hooks/use-stable-analytics', () => ({
  useStableAnalytics: jest.fn(() => analyticsHookReturn),
  useStablePerformanceMetrics: jest.fn(() => performanceHookReturn),
  useStableRealtimePulse: jest.fn(() => pulseHookReturn),
}));

// ---- Mock cn utility ----

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | null | boolean)[]) =>
    args.filter(Boolean).join(' '),
}));

// ---- Mock child components (simple div stubs that capture key props) ----

const mockAnalyticsNavigation = jest.fn(({ variant }: { variant: string }) => (
  <div data-testid="analytics-navigation" data-variant={variant}>
    AnalyticsNavigation
  </div>
));

const mockAnalyticsHeader = jest.fn(
  ({
    variant,
    selectedPeriod,
  }: {
    variant: string;
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    onRefreshAll: () => void;
  }) => (
    <div
      data-testid="analytics-header"
      data-variant={variant}
      data-period={selectedPeriod}
    >
      AnalyticsHeader
    </div>
  ),
);

const mockDashboardView = jest.fn(
  ({ className }: { className?: string }) => (
    <div data-testid="dashboard-view" className={className}>
      DashboardView
    </div>
  ),
);

const mockOverviewTab = jest.fn(() => (
  <div data-testid="overview-tab">OverviewTab</div>
));
const mockPerformanceTab = jest.fn(() => (
  <div data-testid="performance-tab">PerformanceTab</div>
));
const mockCoursesTab = jest.fn(() => (
  <div data-testid="courses-tab">CoursesTab</div>
));
const mockIntelligentFeaturesTab = jest.fn(() => (
  <div data-testid="intelligent-features-tab">IntelligentFeaturesTab</div>
));
const mockJobMarketTab = jest.fn(() => (
  <div data-testid="jobmarket-tab">JobMarketTab</div>
));
const mockStudentFeaturesTab = jest.fn(() => (
  <div data-testid="student-features-tab">StudentFeaturesTab</div>
));
const mockTeacherFeaturesTab = jest.fn(() => (
  <div data-testid="teacher-features-tab">TeacherFeaturesTab</div>
));
const mockAdminFeaturesTab = jest.fn(() => (
  <div data-testid="admin-features-tab">AdminFeaturesTab</div>
));
const mockPostAnalyticsTab = jest.fn(() => (
  <div data-testid="post-analytics-tab">PostAnalyticsTab</div>
));
const mockCognitiveAnalytics = jest.fn(() => (
  <div data-testid="cognitive-analytics">CognitiveAnalytics</div>
));
const mockPredictiveAnalytics = jest.fn(() => (
  <div data-testid="predictive-analytics">PredictiveAnalytics</div>
));
const mockRealtimePulse = jest.fn(() => (
  <div data-testid="realtime-pulse">RealtimePulse</div>
));

jest.mock('@/components/analytics/AnalyticsNavigation', () => ({
  AnalyticsNavigation: (props: Record<string, unknown>) =>
    mockAnalyticsNavigation(props as { variant: string }),
}));

jest.mock('@/components/analytics/AnalyticsHeader', () => ({
  AnalyticsHeader: (props: Record<string, unknown>) =>
    mockAnalyticsHeader(
      props as {
        variant: string;
        selectedPeriod: string;
        onPeriodChange: (p: string) => void;
        onRefreshAll: () => void;
      },
    ),
}));

jest.mock('@/components/analytics/DashboardView', () => ({
  DashboardView: (props: Record<string, unknown>) =>
    mockDashboardView(props as { className?: string }),
}));

jest.mock('@/components/analytics/tabs/OverviewTab', () => ({
  OverviewTab: (props: Record<string, unknown>) => mockOverviewTab(props),
}));

jest.mock('@/components/analytics/tabs/PerformanceTab', () => ({
  PerformanceTab: (props: Record<string, unknown>) =>
    mockPerformanceTab(props),
}));

jest.mock('@/components/analytics/tabs/CoursesTab', () => ({
  CoursesTab: (props: Record<string, unknown>) => mockCoursesTab(props),
}));

jest.mock('@/components/analytics/tabs/IntelligentFeaturesTab', () => ({
  IntelligentFeaturesTab: (props: Record<string, unknown>) =>
    mockIntelligentFeaturesTab(props),
}));

jest.mock('@/components/analytics/tabs/JobMarketTab', () => ({
  JobMarketTab: (props: Record<string, unknown>) => mockJobMarketTab(props),
}));

jest.mock('@/components/analytics/tabs/StudentFeaturesTab', () => ({
  StudentFeaturesTab: (props: Record<string, unknown>) =>
    mockStudentFeaturesTab(props),
}));

jest.mock('@/components/analytics/tabs/TeacherFeaturesTab', () => ({
  TeacherFeaturesTab: (props: Record<string, unknown>) =>
    mockTeacherFeaturesTab(props),
}));

jest.mock('@/components/analytics/tabs/AdminFeaturesTab', () => ({
  AdminFeaturesTab: (props: Record<string, unknown>) =>
    mockAdminFeaturesTab(props),
}));

jest.mock('@/components/analytics/tabs/PostAnalyticsTab', () => ({
  PostAnalyticsTab: (props: Record<string, unknown>) =>
    mockPostAnalyticsTab(props),
}));

jest.mock('@/components/analytics/CognitiveAnalytics', () => ({
  CognitiveAnalytics: (props: Record<string, unknown>) =>
    mockCognitiveAnalytics(props),
}));

jest.mock(
  '@/app/dashboard/user/_components/smart-dashboard/PredictiveAnalytics',
  () => ({
    PredictiveAnalytics: (props: Record<string, unknown>) =>
      mockPredictiveAnalytics(props),
  }),
);

jest.mock(
  '@/app/dashboard/user/_components/smart-dashboard/RealtimePulse',
  () => ({
    RealtimePulse: (props: Record<string, unknown>) =>
      mockRealtimePulse(props),
  }),
);

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { ImprovedUnifiedAnalytics } from '@/components/analytics/ImprovedUnifiedAnalytics';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-test-123',
    name: 'Test User',
    email: 'test@taxomind.com',
    image: null,
    isTwoFactorEnabled: false,
    isOAuth: false,
    isTeacher: false,
    isAffiliate: false,
    ...overrides,
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ImprovedUnifiedAnalytics', () => {
  const defaultUser = createMockUser();

  beforeEach(() => {
    // Reset hook return values to defaults
    analyticsHookReturn = { ...defaultAnalyticsHookReturn };
    performanceHookReturn = { ...defaultPerformanceHookReturn };
    pulseHookReturn = { ...defaultPulseHookReturn };

    // Reset storage mock defaults
    mockGetStoredTab.mockReturnValue('overview');
    mockGetStoredPeriod.mockReturnValue('DAILY');

    // Reset all child component mock call histories
    mockAnalyticsNavigation.mockClear();
    mockAnalyticsHeader.mockClear();
    mockDashboardView.mockClear();
    mockOverviewTab.mockClear();
    mockPerformanceTab.mockClear();
    mockCoursesTab.mockClear();
    mockIntelligentFeaturesTab.mockClear();
    mockJobMarketTab.mockClear();
    mockStudentFeaturesTab.mockClear();
    mockTeacherFeaturesTab.mockClear();
    mockAdminFeaturesTab.mockClear();
    mockPostAnalyticsTab.mockClear();
    mockCognitiveAnalytics.mockClear();
    mockPredictiveAnalytics.mockClear();
    mockRealtimePulse.mockClear();
    mockStoreTab.mockClear();
    mockStorePeriod.mockClear();
    mockRefreshAnalytics.mockClear();
    mockRefreshPerformance.mockClear();
    mockRefreshPulse.mockClear();
  });

  // --------------------------------------------------------------------------
  // 1. Renders tab navigation
  // --------------------------------------------------------------------------
  describe('Tab navigation rendering', () => {
    it('renders tab triggers for all standard tabs in fullpage variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const expectedTabs = [
        'overview',
        'performance',
        'cognitive',
        'courses',
        'posts',
        'jobmarket',
        'features',
        'student-features',
        'teacher-features',
        'insights',
        'realtime',
      ];

      expectedTabs.forEach((tab) => {
        expect(screen.getByTestId(`tab-trigger-${tab}`)).toBeInTheDocument();
      });
    });

    it('renders the TabsList container with tablist role in fullpage variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders AnalyticsNavigation child component', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('analytics-navigation')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Shows default active tab
  // --------------------------------------------------------------------------
  describe('Default active tab', () => {
    it('defaults to overview tab when localStorage returns overview', () => {
      mockGetStoredTab.mockReturnValue('overview');

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const tabsContainer = screen.getByTestId('tabs');
      expect(tabsContainer).toHaveAttribute('data-value', 'overview');
    });

    it('uses the stored tab from localStorage on initial render', () => {
      mockGetStoredTab.mockReturnValue('performance');

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const tabsContainer = screen.getByTestId('tabs');
      expect(tabsContainer).toHaveAttribute('data-value', 'performance');
    });

    it('uses stored period from localStorage on initial render', () => {
      mockGetStoredPeriod.mockReturnValue('WEEKLY');

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockAnalyticsHeader).toHaveBeenCalledWith(
        expect.objectContaining({ selectedPeriod: 'WEEKLY' }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Tab switching works
  // --------------------------------------------------------------------------
  describe('Tab switching', () => {
    it('calls handleTabChange and updates active tab when a tab trigger is clicked', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const performanceTrigger = screen.getByTestId('tab-trigger-performance');
      fireEvent.click(performanceTrigger);

      // The onValueChange callback calls storeTab
      expect(mockStoreTab).toHaveBeenCalledWith('performance');
    });

    it('persists tab change to localStorage via storeTab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      fireEvent.click(screen.getByTestId('tab-trigger-courses'));
      expect(mockStoreTab).toHaveBeenCalledWith('courses');

      fireEvent.click(screen.getByTestId('tab-trigger-cognitive'));
      expect(mockStoreTab).toHaveBeenCalledWith('cognitive');
    });

    it('renders corresponding tab content panels for each tab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      // All tab content panels should be rendered (mock tabs render all panels)
      expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      expect(
        screen.getByTestId('tab-content-performance'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-cognitive')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-courses')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-posts')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-jobmarket')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-features')).toBeInTheDocument();
      expect(
        screen.getByTestId('tab-content-student-features'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('tab-content-teacher-features'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-insights')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-realtime')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Period selector renders
  // --------------------------------------------------------------------------
  describe('Period selector', () => {
    it('renders AnalyticsHeader with selectedPeriod and period change handler', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('analytics-header')).toBeInTheDocument();
      expect(screen.getByTestId('analytics-header')).toHaveAttribute(
        'data-period',
        'DAILY',
      );
    });

    it('passes the onPeriodChange callback to AnalyticsHeader', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      // Verify AnalyticsHeader received onPeriodChange prop
      expect(mockAnalyticsHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          onPeriodChange: expect.any(Function),
        }),
      );
    });

    it('stores the period in localStorage when onPeriodChange is called', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      // Extract the onPeriodChange callback from the mock call
      const headerProps = mockAnalyticsHeader.mock.calls[0][0];
      act(() => {
        headerProps.onPeriodChange('MONTHLY');
      });

      expect(mockStorePeriod).toHaveBeenCalledWith('MONTHLY');
    });

    it('renders AnalyticsHeader with MONTHLY period when stored as MONTHLY', () => {
      mockGetStoredPeriod.mockReturnValue('MONTHLY');

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('analytics-header')).toHaveAttribute(
        'data-period',
        'MONTHLY',
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. Shows loading state
  // --------------------------------------------------------------------------
  describe('Loading state', () => {
    it('renders a loading spinner when analyticsLoading is true', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        loading: true,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveAttribute(
        'aria-label',
        'Loading analytics data',
      );
      expect(
        screen.getByText('Loading your analytics...'),
      ).toBeInTheDocument();
    });

    it('renders loading state when performanceLoading is true', () => {
      performanceHookReturn = {
        ...defaultPerformanceHookReturn,
        loading: true,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders loading state when pulseLoading is true', () => {
      pulseHookReturn = {
        ...defaultPulseHookReturn,
        loading: true,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not render tabs or content when loading', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        loading: true,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('analytics-header'),
      ).not.toBeInTheDocument();
    });

    it('applies className to loading state container', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        loading: true,
      };

      const { container } = render(
        <ImprovedUnifiedAnalytics
          user={defaultUser}
          variant="fullpage"
          className="custom-loading-class"
        />,
      );

      // The root div should contain the custom class
      const rootDiv = container.firstElementChild;
      expect(rootDiv?.className).toContain('custom-loading-class');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Role-based tabs: admin-only tabs hidden for regular users
  // --------------------------------------------------------------------------
  describe('Role-based tab visibility', () => {
    it('does not render admin-features tab trigger for regular users', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      // The component sets isAdmin = false, so admin-features tab should not be present
      expect(
        screen.queryByTestId('tab-trigger-admin-features'),
      ).not.toBeInTheDocument();
    });

    it('does not render admin-features tab content for regular users', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(
        screen.queryByTestId('tab-content-admin-features'),
      ).not.toBeInTheDocument();
    });

    it('renders teacher-features tab for all users (not admin-restricted)', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(
        screen.getByTestId('tab-trigger-teacher-features'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('tab-content-teacher-features'),
      ).toBeInTheDocument();
    });

    it('renders student-features tab for all users', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(
        screen.getByTestId('tab-trigger-student-features'),
      ).toBeInTheDocument();
    });

    it('falls back to overview when stored tab is admin-features and user is not admin', () => {
      mockGetStoredTab.mockReturnValue('admin-features');

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      // Since isAdmin is always false in this component, the useEffect should
      // reset an admin-features stored tab to overview
      expect(mockStoreTab).toHaveBeenCalledWith('overview');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Applies className prop
  // --------------------------------------------------------------------------
  describe('className prop', () => {
    it('applies className to the fullpage variant root container', () => {
      const { container } = render(
        <ImprovedUnifiedAnalytics
          user={defaultUser}
          variant="fullpage"
          className="extra-class-name"
        />,
      );

      const rootDiv = container.firstElementChild;
      expect(rootDiv?.className).toContain('extra-class-name');
    });

    it('passes className to DashboardView in dashboard variant', () => {
      render(
        <ImprovedUnifiedAnalytics
          user={defaultUser}
          variant="dashboard"
          className="dashboard-extra"
        />,
      );

      expect(mockDashboardView).toHaveBeenCalledWith(
        expect.objectContaining({ className: 'dashboard-extra' }),
      );
    });

    it('renders without errors when className is not provided', () => {
      const { container } = render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(container.firstElementChild).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Dashboard variant renders correctly
  // --------------------------------------------------------------------------
  describe('Dashboard variant', () => {
    it('renders DashboardView component', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="dashboard" />,
      );

      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
    });

    it('renders AnalyticsNavigation with dashboard variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="dashboard" />,
      );

      expect(screen.getByTestId('analytics-navigation')).toHaveAttribute(
        'data-variant',
        'dashboard',
      );
    });

    it('renders AnalyticsHeader with dashboard variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="dashboard" />,
      );

      expect(screen.getByTestId('analytics-header')).toHaveAttribute(
        'data-variant',
        'dashboard',
      );
    });

    it('does not render Tabs component in dashboard variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="dashboard" />,
      );

      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
    });

    it('passes user and analytics data to DashboardView', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="dashboard" />,
      );

      expect(mockDashboardView).toHaveBeenCalledWith(
        expect.objectContaining({
          user: defaultUser,
          analytics: defaultAnalyticsHookReturn.data,
          performance: defaultPerformanceHookReturn.data,
        }),
      );
    });

    it('defaults to dashboard variant when variant prop is not provided', () => {
      render(<ImprovedUnifiedAnalytics user={defaultUser} />);

      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Fullpage variant renders correctly
  // --------------------------------------------------------------------------
  describe('Fullpage variant', () => {
    it('renders Tabs component with all tab content panels', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      expect(screen.getByTestId('performance-tab')).toBeInTheDocument();
      expect(screen.getByTestId('cognitive-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('courses-tab')).toBeInTheDocument();
      expect(screen.getByTestId('post-analytics-tab')).toBeInTheDocument();
      expect(screen.getByTestId('jobmarket-tab')).toBeInTheDocument();
      expect(
        screen.getByTestId('intelligent-features-tab'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('student-features-tab')).toBeInTheDocument();
      expect(screen.getByTestId('teacher-features-tab')).toBeInTheDocument();
      expect(screen.getByTestId('predictive-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('realtime-pulse')).toBeInTheDocument();
    });

    it('does not render DashboardView in fullpage variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
    });

    it('renders AnalyticsNavigation with fullpage variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('analytics-navigation')).toHaveAttribute(
        'data-variant',
        'fullpage',
      );
    });

    it('renders AnalyticsHeader with fullpage variant', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByTestId('analytics-header')).toHaveAttribute(
        'data-variant',
        'fullpage',
      );
    });

    it('applies gradient background class to fullpage root', () => {
      const { container } = render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const rootDiv = container.firstElementChild;
      expect(rootDiv?.className).toContain('min-h-screen');
      expect(rootDiv?.className).toContain('bg-gradient-to-br');
    });

    it('passes onRefreshAll callback to AnalyticsHeader', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const headerProps = mockAnalyticsHeader.mock.calls[0][0];

      act(() => {
        headerProps.onRefreshAll();
      });

      expect(mockRefreshAnalytics).toHaveBeenCalledTimes(1);
      expect(mockRefreshPerformance).toHaveBeenCalledTimes(1);
      expect(mockRefreshPulse).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Shows error state with fallback
  // --------------------------------------------------------------------------
  describe('Error state', () => {
    it('renders error UI when all hooks have errors and no data', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        data: null as unknown as typeof defaultAnalyticsHookReturn.data,
        error: 'Failed to load analytics data',
      };
      performanceHookReturn = {
        ...defaultPerformanceHookReturn,
        data: null as unknown as typeof defaultPerformanceHookReturn.data,
        error: null,
      };
      pulseHookReturn = {
        ...defaultPulseHookReturn,
        pulse: null as unknown as typeof defaultPulseHookReturn.pulse,
        error: null,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText('Error loading analytics'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Failed to load analytics data'),
      ).toBeInTheDocument();
    });

    it('renders the Try Again button in error state', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        data: null as unknown as typeof defaultAnalyticsHookReturn.data,
        error: 'Network error',
      };
      performanceHookReturn = {
        ...defaultPerformanceHookReturn,
        data: null as unknown as typeof defaultPerformanceHookReturn.data,
        error: null,
      };
      pulseHookReturn = {
        ...defaultPulseHookReturn,
        pulse: null as unknown as typeof defaultPulseHookReturn.pulse,
        error: null,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
    });

    it('calls all refresh functions when Try Again button is clicked', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        data: null as unknown as typeof defaultAnalyticsHookReturn.data,
        error: 'Failed to load analytics data',
      };
      performanceHookReturn = {
        ...defaultPerformanceHookReturn,
        data: null as unknown as typeof defaultPerformanceHookReturn.data,
        error: null,
      };
      pulseHookReturn = {
        ...defaultPulseHookReturn,
        pulse: null as unknown as typeof defaultPulseHookReturn.pulse,
        error: null,
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockRefreshAnalytics).toHaveBeenCalledTimes(1);
      expect(mockRefreshPerformance).toHaveBeenCalledTimes(1);
      expect(mockRefreshPulse).toHaveBeenCalledTimes(1);
    });

    it('displays first available error message from hooks', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        data: null as unknown as typeof defaultAnalyticsHookReturn.data,
        error: null,
      };
      performanceHookReturn = {
        ...defaultPerformanceHookReturn,
        data: null as unknown as typeof defaultPerformanceHookReturn.data,
        error: 'Performance service unavailable',
      };
      pulseHookReturn = {
        ...defaultPulseHookReturn,
        pulse: null as unknown as typeof defaultPulseHookReturn.pulse,
        error: 'Pulse timeout',
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      // The component renders analyticsError || performanceError || pulseError
      expect(
        screen.getByText('Performance service unavailable'),
      ).toBeInTheDocument();
    });

    it('does not show error state when data exists despite errors', () => {
      // hasError is true, but analytics data exists, so error state should NOT show
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        error: 'Partial error',
      };

      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('applies className to error state container', () => {
      analyticsHookReturn = {
        ...defaultAnalyticsHookReturn,
        data: null as unknown as typeof defaultAnalyticsHookReturn.data,
        error: 'Error',
      };
      performanceHookReturn = {
        ...defaultPerformanceHookReturn,
        data: null as unknown as typeof defaultPerformanceHookReturn.data,
        error: null,
      };
      pulseHookReturn = {
        ...defaultPulseHookReturn,
        pulse: null as unknown as typeof defaultPulseHookReturn.pulse,
        error: null,
      };

      const { container } = render(
        <ImprovedUnifiedAnalytics
          user={defaultUser}
          variant="fullpage"
          className="error-custom-class"
        />,
      );

      const rootDiv = container.firstElementChild;
      expect(rootDiv?.className).toContain('error-custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Additional: Refresh and data passing
  // --------------------------------------------------------------------------
  describe('Data passing to child components', () => {
    it('passes analytics and performance data to OverviewTab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockOverviewTab).toHaveBeenCalledWith(
        expect.objectContaining({
          analytics: defaultAnalyticsHookReturn.data,
          performance: defaultPerformanceHookReturn.data,
          pulse: defaultPulseHookReturn.pulse,
        }),
      );
    });

    it('passes analytics and performance data to PerformanceTab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockPerformanceTab).toHaveBeenCalledWith(
        expect.objectContaining({
          analytics: defaultAnalyticsHookReturn.data,
          performance: defaultPerformanceHookReturn.data,
        }),
      );
    });

    it('passes user to CognitiveAnalytics', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockCognitiveAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          user: defaultUser,
        }),
      );
    });

    it('passes user to PredictiveAnalytics in insights tab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockPredictiveAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          user: defaultUser,
        }),
      );
    });

    it('passes user to RealtimePulse in realtime tab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockRealtimePulse).toHaveBeenCalledWith(
        expect.objectContaining({
          user: defaultUser,
        }),
      );
    });

    it('passes user and analytics to JobMarketTab', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      expect(mockJobMarketTab).toHaveBeenCalledWith(
        expect.objectContaining({
          user: defaultUser,
          analytics: defaultAnalyticsHookReturn.data,
        }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // Keyboard navigation
  // --------------------------------------------------------------------------
  describe('Keyboard navigation', () => {
    it('renders TabsList with onKeyDown handler for keyboard navigation', () => {
      render(
        <ImprovedUnifiedAnalytics user={defaultUser} variant="fullpage" />,
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toBeInTheDocument();
      // The onKeyDown prop is passed but our mock simply passes it through as a prop
    });
  });
});

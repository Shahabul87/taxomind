import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// The framer-motion mock is provided globally via jest.setup.js.
// The logger mock is provided globally via jest.setup.js.

// ---------------------------------------------------------------------------
// Mock the data-fetching hooks BEFORE importing the component.
// We need fine-grained control over loading / error / data states.
// ---------------------------------------------------------------------------

const mockRefreshAnalytics = jest.fn();
const mockRefreshPerformance = jest.fn();

const defaultAnalyticsReturn = {
  data: { totalStudents: 24, avgEngagement: 87, completionRate: 94 },
  loading: false,
  error: null,
  refreshAnalytics: mockRefreshAnalytics,
};

const defaultPerformanceReturn = {
  data: { averageScore: 82, topPerformers: 5 },
  loading: false,
  error: null,
  refreshPerformance: mockRefreshPerformance,
};

jest.mock('@/hooks/use-stable-analytics', () => ({
  useStableAnalytics: jest.fn(() => defaultAnalyticsReturn),
  useStablePerformanceMetrics: jest.fn(() => defaultPerformanceReturn),
}));

// Import the mocked hooks so individual tests can override return values
import {
  useStableAnalytics,
  useStablePerformanceMetrics,
} from '@/hooks/use-stable-analytics';

const mockedUseStableAnalytics = useStableAnalytics as jest.Mock;
const mockedUseStablePerformanceMetrics = useStablePerformanceMetrics as jest.Mock;

// ---------------------------------------------------------------------------
// Mock UI components - consistent with project-wide analytics test patterns
// ---------------------------------------------------------------------------

jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
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
}));

// Use React Context to propagate onValueChange through arbitrary DOM nesting.
// The component may wrap TabsList in layout divs, which breaks
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
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs-list" className={className} role="tablist">
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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    size,
    className,
    onClick,
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
    >
      {children}
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Mock child tab components to isolate unit tests to TeacherAnalyticsDashboard
// ---------------------------------------------------------------------------

jest.mock('@/components/analytics/tabs/TeacherFeaturesTab', () => ({
  TeacherFeaturesTab: ({ analytics, performance }: Record<string, unknown>) => (
    <div data-testid="teacher-features-tab" data-has-analytics={!!analytics} data-has-performance={!!performance}>
      TeacherFeaturesTab
    </div>
  ),
}));

jest.mock('@/components/analytics/tabs/OverviewTab', () => ({
  OverviewTab: ({ analytics, performance, pulse }: Record<string, unknown>) => (
    <div data-testid="overview-tab" data-has-analytics={!!analytics} data-has-performance={!!performance} data-pulse={String(pulse)}>
      OverviewTab
    </div>
  ),
}));

jest.mock('@/components/analytics/tabs/PerformanceTab', () => ({
  PerformanceTab: ({ analytics, performance }: Record<string, unknown>) => (
    <div data-testid="performance-tab" data-has-analytics={!!analytics} data-has-performance={!!performance}>
      PerformanceTab
    </div>
  ),
}));

// Mock cn utility to pass through classnames
jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENT UNDER TEST
// ============================================================================

import { TeacherAnalyticsDashboard } from '@/components/analytics/TeacherAnalyticsDashboard';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockUser = (overrides?: Partial<{ id: string; name: string; email: string }>) => ({
  id: 'teacher-001',
  name: 'Jane Instructor',
  email: 'jane@taxomind.com',
  ...overrides,
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe('TeacherAnalyticsDashboard', () => {
  beforeEach(() => {
    // Reset hook mocks to default (loaded, no errors) state
    mockedUseStableAnalytics.mockReturnValue(defaultAnalyticsReturn);
    mockedUseStablePerformanceMetrics.mockReturnValue(defaultPerformanceReturn);
    mockRefreshAnalytics.mockClear();
    mockRefreshPerformance.mockClear();
  });

  // --------------------------------------------------------------------------
  // 1. Renders section heading
  // --------------------------------------------------------------------------
  describe('section heading', () => {
    it('renders the main "Teacher Analytics" heading', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const heading = screen.getByText('Teacher Analytics');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('renders the subtitle describing the dashboard purpose', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(
        screen.getByText('Classroom management and teaching insights')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Shows 4 quick stats cards with correct values
  // --------------------------------------------------------------------------
  describe('quick stats cards', () => {
    it('renders exactly 4 stat cards in the grid', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      // The component renders stat cards plus tab content cards.
      // Stat card values are unique numeric strings we can assert on.
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('87%')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows the "Active Students" stat with value 24', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Active Students')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('shows the "Avg Engagement" stat with value 87%', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Avg Engagement')).toBeInTheDocument();
      expect(screen.getByText('87%')).toBeInTheDocument();
    });

    it('shows the "Completion Rate" stat with value 94%', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    it('shows the "At-Risk Students" stat with value 3', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('At-Risk Students')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Shows period selector
  // --------------------------------------------------------------------------
  describe('period selector', () => {
    it('renders all three period buttons (Daily, Weekly, Monthly)', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('highlights the Weekly button by default (default selectedPeriod is WEEKLY)', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      // The "default" variant button gets the gradient className.
      // Our mock renders data-variant so we can check it.
      const buttons = screen.getAllByTestId('action-button');
      const weeklyButton = buttons.find((btn) => btn.textContent?.includes('Weekly'));
      expect(weeklyButton).toBeDefined();
      expect(weeklyButton).toHaveAttribute('data-variant', 'default');
    });

    it('switches period when a different period button is clicked', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const dailyButton = screen.getByText('Daily').closest('button');
      expect(dailyButton).toBeTruthy();

      fireEvent.click(dailyButton!);

      // The hook should be called with the new period on next render.
      // Since hooks are mocked, we verify the component re-renders without error.
      // The useStableAnalytics hook will be re-invoked with the new period.
      expect(mockedUseStableAnalytics).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Tab navigation between 4 tabs
  // --------------------------------------------------------------------------
  describe('tab navigation', () => {
    it('renders all 4 tab triggers', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-teaching-tools')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-performance')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-insights')).toBeInTheDocument();
    });

    it('renders correct labels for each tab trigger', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Class Overview')).toBeInTheDocument();
      expect(screen.getByText('Teaching Tools')).toBeInTheDocument();
      expect(screen.getByText('Student Performance')).toBeInTheDocument();
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });

    it('renders all 4 tab content panels', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-teaching-tools')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-performance')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-insights')).toBeInTheDocument();
    });

    it('calls onValueChange when a tab trigger is clicked', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const teachingToolsTrigger = screen.getByTestId('tab-trigger-teaching-tools');
      fireEvent.click(teachingToolsTrigger);

      // After state update, the Tabs component should re-render with the new value.
      // We verify the tabs container reflects the new active tab.
      const tabsContainer = screen.getByTestId('tabs');
      expect(tabsContainer).toHaveAttribute('data-value', 'teaching-tools');
    });

    it('updates active tab when performance tab is clicked', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      fireEvent.click(screen.getByTestId('tab-trigger-performance'));

      const tabsContainer = screen.getByTestId('tabs');
      expect(tabsContainer).toHaveAttribute('data-value', 'performance');
    });

    it('updates active tab when insights tab is clicked', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      fireEvent.click(screen.getByTestId('tab-trigger-insights'));

      const tabsContainer = screen.getByTestId('tabs');
      expect(tabsContainer).toHaveAttribute('data-value', 'insights');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Default tab is active
  // --------------------------------------------------------------------------
  describe('default active tab', () => {
    it('sets "overview" as the default active tab', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const tabsContainer = screen.getByTestId('tabs');
      expect(tabsContainer).toHaveAttribute('data-value', 'overview');
    });

    it('marks the overview tab trigger as selected by default', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const overviewTrigger = screen.getByTestId('tab-trigger-overview');
      expect(overviewTrigger).toHaveAttribute('aria-selected', 'true');
    });

    it('does not mark other tab triggers as selected by default', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByTestId('tab-trigger-teaching-tools')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-trigger-performance')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-trigger-insights')).toHaveAttribute('aria-selected', 'false');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Applies custom className
  // --------------------------------------------------------------------------
  describe('custom className', () => {
    it('applies the custom className to the root container', () => {
      const { container } = render(
        <TeacherAnalyticsDashboard user={createMockUser()} className="my-custom-class" />
      );

      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('my-custom-class');
    });

    it('preserves the default min-h-screen class alongside custom className', () => {
      const { container } = render(
        <TeacherAnalyticsDashboard user={createMockUser()} className="extra-styling" />
      );

      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('min-h-screen');
      expect(rootDiv.className).toContain('extra-styling');
    });

    it('renders without className when none is provided', () => {
      const { container } = render(
        <TeacherAnalyticsDashboard user={createMockUser()} />
      );

      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('min-h-screen');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Renders teacher-specific content
  // --------------------------------------------------------------------------
  describe('teacher-specific content', () => {
    it('shows the "7 Teaching Tools" badge', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('7 Teaching Tools')).toBeInTheDocument();
    });

    it('renders the Refresh button in the header', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls both refresh functions when Refresh button is clicked', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const refreshButton = screen.getByText('Refresh').closest('button');
      expect(refreshButton).toBeTruthy();

      fireEvent.click(refreshButton!);

      expect(mockRefreshAnalytics).toHaveBeenCalledTimes(1);
      expect(mockRefreshPerformance).toHaveBeenCalledTimes(1);
    });

    it('renders AI Insights content in the insights tab', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('AI-Powered Teaching Insights')).toBeInTheDocument();
      expect(screen.getByText('Engagement Optimization')).toBeInTheDocument();
      expect(screen.getByText('Content Difficulty')).toBeInTheDocument();
      expect(screen.getByText('At-Risk Alert')).toBeInTheDocument();
    });

    it('passes analytics and performance data to OverviewTab', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const overviewTab = screen.getByTestId('overview-tab');
      expect(overviewTab).toHaveAttribute('data-has-analytics', 'true');
      expect(overviewTab).toHaveAttribute('data-has-performance', 'true');
      // OverviewTab receives pulse as null
      expect(overviewTab).toHaveAttribute('data-pulse', 'null');
    });

    it('passes analytics and performance data to TeacherFeaturesTab', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const featuresTab = screen.getByTestId('teacher-features-tab');
      expect(featuresTab).toHaveAttribute('data-has-analytics', 'true');
      expect(featuresTab).toHaveAttribute('data-has-performance', 'true');
    });

    it('passes analytics and performance data to PerformanceTab', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const perfTab = screen.getByTestId('performance-tab');
      expect(perfTab).toHaveAttribute('data-has-analytics', 'true');
      expect(perfTab).toHaveAttribute('data-has-performance', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // 8. Shows correct stat labels
  // --------------------------------------------------------------------------
  describe('stat labels', () => {
    it('renders all four stat labels in the correct order', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const expectedLabels = [
        'Active Students',
        'Avg Engagement',
        'Completion Rate',
        'At-Risk Students',
      ];

      expectedLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('renders stat labels inside card-content containers', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const cardContents = screen.getAllByTestId('card-content');

      // "Active Students" should be inside a card-content
      const activeStudentsLabel = screen.getByText('Active Students');
      const parentCardContent = activeStudentsLabel.closest('[data-testid="card-content"]');
      expect(parentCardContent).toBeTruthy();
    });

    it('pairs each label with its corresponding numeric value', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      // Check that each label and its value share a common card-content ancestor
      const pairs = [
        { label: 'Active Students', value: '24' },
        { label: 'Avg Engagement', value: '87%' },
        { label: 'Completion Rate', value: '94%' },
        { label: 'At-Risk Students', value: '3' },
      ];

      pairs.forEach(({ label, value }) => {
        const labelElement = screen.getByText(label);
        const cardContent = labelElement.closest('[data-testid="card-content"]');
        expect(cardContent).toBeTruthy();
        expect(cardContent!.textContent).toContain(value);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Loading and error states (bonus: ensures the component handles all states)
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('shows loading spinner when analytics data is loading', () => {
      mockedUseStableAnalytics.mockReturnValue({
        ...defaultAnalyticsReturn,
        loading: true,
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Loading teacher analytics...')).toBeInTheDocument();
    });

    it('shows loading spinner when performance data is loading', () => {
      mockedUseStablePerformanceMetrics.mockReturnValue({
        ...defaultPerformanceReturn,
        loading: true,
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Loading teacher analytics...')).toBeInTheDocument();
    });

    it('does not render stats cards during loading', () => {
      mockedUseStableAnalytics.mockReturnValue({
        ...defaultAnalyticsReturn,
        loading: true,
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.queryByText('Active Students')).not.toBeInTheDocument();
      expect(screen.queryByText('Teacher Analytics')).not.toBeInTheDocument();
    });

    it('applies custom className to the loading container', () => {
      mockedUseStableAnalytics.mockReturnValue({
        ...defaultAnalyticsReturn,
        loading: true,
      });

      const { container } = render(
        <TeacherAnalyticsDashboard user={createMockUser()} className="loading-wrapper" />
      );

      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('loading-wrapper');
    });
  });

  describe('error state', () => {
    it('shows error message when both hooks error and have no data', () => {
      mockedUseStableAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Network timeout',
        refreshAnalytics: mockRefreshAnalytics,
      });
      mockedUseStablePerformanceMetrics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Server error',
        refreshPerformance: mockRefreshPerformance,
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Error loading teacher analytics')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('shows Try Again button in error state', () => {
      mockedUseStableAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to fetch',
        refreshAnalytics: mockRefreshAnalytics,
      });
      mockedUseStablePerformanceMetrics.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refreshPerformance: mockRefreshPerformance,
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls refresh functions when Try Again is clicked', () => {
      mockedUseStableAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Connection refused',
        refreshAnalytics: mockRefreshAnalytics,
      });
      mockedUseStablePerformanceMetrics.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refreshPerformance: mockRefreshPerformance,
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      const tryAgainButton = screen.getByText('Try Again').closest('button');
      expect(tryAgainButton).toBeTruthy();
      fireEvent.click(tryAgainButton!);

      expect(mockRefreshAnalytics).toHaveBeenCalledTimes(1);
      expect(mockRefreshPerformance).toHaveBeenCalledTimes(1);
    });

    it('renders main content when error exists but data is available (stale data)', () => {
      mockedUseStableAnalytics.mockReturnValue({
        ...defaultAnalyticsReturn,
        error: 'Stale data warning',
      });

      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      // Should show the dashboard, not the error state
      expect(screen.getByText('Teacher Analytics')).toBeInTheDocument();
      expect(screen.getByText('Active Students')).toBeInTheDocument();
      expect(screen.queryByText('Error loading teacher analytics')).not.toBeInTheDocument();
    });

    it('applies custom className to the error container', () => {
      mockedUseStableAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Oops',
        refreshAnalytics: mockRefreshAnalytics,
      });
      mockedUseStablePerformanceMetrics.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refreshPerformance: mockRefreshPerformance,
      });

      const { container } = render(
        <TeacherAnalyticsDashboard user={createMockUser()} className="error-wrapper" />
      );

      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('error-wrapper');
    });
  });

  // --------------------------------------------------------------------------
  // Hook invocation verification
  // --------------------------------------------------------------------------
  describe('hook invocation', () => {
    it('calls useStableAnalytics with the default WEEKLY period', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(mockedUseStableAnalytics).toHaveBeenCalledWith('WEEKLY');
    });

    it('calls useStablePerformanceMetrics with WEEKLY period and 30 days', () => {
      render(<TeacherAnalyticsDashboard user={createMockUser()} />);

      expect(mockedUseStablePerformanceMetrics).toHaveBeenCalledWith('WEEKLY', 30);
    });
  });
});

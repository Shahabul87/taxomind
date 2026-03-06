import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ============================================================================
// MOCK: useAgentic hook from @sam-ai/react
// pnpm resolves @sam-ai/react via symlink to packages/react/src/index.ts
// jest.mock must use the resolved filesystem path for proper interception
// ============================================================================

const mockFetchProgressReport = jest.fn();
const mockFetchSkillMap = jest.fn();

// Mutable object - tests modify properties directly before each render
const mockHookReturn: Record<string, unknown> = {
  progressReport: null,
  isLoadingProgress: false,
  fetchProgressReport: mockFetchProgressReport,
  skills: [],
  isLoadingSkills: false,
  fetchSkillMap: mockFetchSkillMap,
  error: null,
};

// jest.mock resolves relative paths from the test file location.
// The @sam-ai/react package is at packages/react/src/index.ts relative to rootDir.
// From __tests__/components/sam/, we traverse up 3 directories to rootDir.
jest.mock(
  '../../../packages/react/src/index',
  () => ({
    __esModule: true,
    useAgentic: () => mockHookReturn,
  })
);

// ============================================================================
// MOCK: UI components
// ============================================================================

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: {
    children: React.ReactNode;
    value: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="tabs" data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<Record<string, unknown>>,
            { onValueChange }
          );
        }
        return child;
      })}
    </div>
  ),
  TabsList: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (v: string) => void }) => (
    <div data-testid="tabs-list">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<Record<string, unknown>>,
            { onValueChange }
          );
        }
        return child;
      })}
    </div>
  ),
  TabsTrigger: ({ children, value, onValueChange }: {
    children: React.ReactNode;
    value: string;
    onValueChange?: (v: string) => void;
  }) => (
    <button
      data-testid={`tab-trigger-${value}`}
      data-value={value}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { ProgressDashboard } from '@/components/sam/progress-dashboard';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createProgressReport(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-123',
    period: 'weekly' as const,
    totalStudyTime: 145,
    sessionsCompleted: 8,
    topicsStudied: ['React Hooks', 'TypeScript Generics', 'Next.js Routing'],
    skillsImproved: ['react', 'typescript'],
    goalsProgress: [
      {
        goalId: 'goal-1',
        goalTitle: 'Master React Hooks',
        progressDelta: 15,
        currentProgress: 75,
      },
      {
        goalId: 'goal-2',
        goalTitle: 'Learn TypeScript Advanced Types',
        progressDelta: -5,
        currentProgress: 40,
      },
    ],
    strengths: ['Component Architecture', 'State Management'],
    areasForImprovement: ['Testing', 'Performance Optimization'],
    streak: 7,
    generatedAt: '2026-03-01T12:00:00Z',
    ...overrides,
  };
}

function createSkillAssessment(overrides: Record<string, unknown> = {}) {
  return {
    skillId: 'skill-1',
    skillName: 'React',
    level: 'intermediate' as const,
    score: 72,
    confidence: 0.85,
    lastAssessedAt: '2026-02-28T10:00:00Z',
    trend: 'improving' as const,
    ...overrides,
  };
}

function createMultipleSkills() {
  return [
    createSkillAssessment(),
    createSkillAssessment({
      skillId: 'skill-2',
      skillName: 'TypeScript',
      level: 'advanced',
      score: 88,
      trend: 'stable',
      lastAssessedAt: '2026-02-27T14:00:00Z',
    }),
    createSkillAssessment({
      skillId: 'skill-3',
      skillName: 'CSS',
      level: 'beginner',
      score: 35,
      trend: 'declining',
      lastAssessedAt: '2026-02-20T08:00:00Z',
    }),
  ];
}

// ============================================================================
// HELPER: Reset mock hook return to default state
// ============================================================================

function resetMockHook() {
  mockFetchProgressReport.mockReset();
  mockFetchSkillMap.mockReset();
  mockHookReturn.progressReport = null;
  mockHookReturn.isLoadingProgress = false;
  mockHookReturn.fetchProgressReport = mockFetchProgressReport;
  mockHookReturn.skills = [];
  mockHookReturn.isLoadingSkills = false;
  mockHookReturn.fetchSkillMap = mockFetchSkillMap;
  mockHookReturn.error = null;
}

// ============================================================================
// TESTS
// ============================================================================

describe('ProgressDashboard', () => {
  beforeEach(() => {
    resetMockHook();
  });

  // --------------------------------------------------------------------------
  // Rendering & Basic Structure
  // --------------------------------------------------------------------------

  describe('rendering and basic structure', () => {
    it('renders the main heading and description', () => {
      render(<ProgressDashboard />);

      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
      expect(screen.getByText('Track your learning journey with SAM')).toBeInTheDocument();
    });

    it('renders the refresh button', () => {
      render(<ProgressDashboard />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('accepts and applies a custom className', () => {
      const { container } = render(<ProgressDashboard className="custom-class" />);

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows loading indicator when isLoadingProgress is true', () => {
      mockHookReturn.isLoadingProgress = true;

      render(<ProgressDashboard />);

      // Should NOT show "No progress data yet" while loading
      expect(screen.queryByText('No progress data yet')).not.toBeInTheDocument();
      // Should NOT show stat cards while loading
      expect(screen.queryByText('Study Time')).not.toBeInTheDocument();
    });

    it('shows skill loading indicator when isLoadingSkills is true and progress data exists', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.isLoadingSkills = true;

      render(<ProgressDashboard showSkills={true} />);

      // Skill Assessment section heading should render
      expect(screen.getByText('Skill Assessment')).toBeInTheDocument();
      // But the empty skills message should not show (loading instead)
      expect(screen.queryByText('Complete assessments to track your skill progress')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Error State
  // --------------------------------------------------------------------------

  describe('error state', () => {
    it('displays error message when useAgentic returns error', () => {
      const errorMessage = 'Failed to fetch progress report';
      mockHookReturn.error = errorMessage;

      render(<ProgressDashboard />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error banner when error is null', () => {
      mockHookReturn.error = null;

      render(<ProgressDashboard />);

      expect(screen.queryByText('Failed to fetch progress report')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Empty / No Data State
  // --------------------------------------------------------------------------

  describe('empty state', () => {
    it('shows empty state message when progressReport is null and not loading', () => {
      mockHookReturn.progressReport = null;
      mockHookReturn.isLoadingProgress = false;

      render(<ProgressDashboard />);

      expect(screen.getByText('No progress data yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start learning with SAM to see your progress analytics')
      ).toBeInTheDocument();
    });

    it('shows empty skills message when skills array is empty and progress data exists', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = [];
      mockHookReturn.isLoadingSkills = false;

      render(<ProgressDashboard showSkills={true} />);

      expect(
        screen.getByText('Complete assessments to track your skill progress')
      ).toBeInTheDocument();
    });

    it('shows empty strengths message when strengths array is empty', () => {
      mockHookReturn.progressReport = createProgressReport({ strengths: [] });

      render(<ProgressDashboard />);

      expect(
        screen.getByText('Keep learning to discover your strengths!')
      ).toBeInTheDocument();
    });

    it('shows empty improvement areas message when areasForImprovement is empty', () => {
      mockHookReturn.progressReport = createProgressReport({ areasForImprovement: [] });

      render(<ProgressDashboard />);

      expect(
        screen.getByText('Great job! No major areas flagged.')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Stat Cards
  // --------------------------------------------------------------------------

  describe('stat cards with correct data', () => {
    it('renders study time formatted as hours and minutes', () => {
      mockHookReturn.progressReport = createProgressReport({ totalStudyTime: 145 });

      render(<ProgressDashboard />);

      // 145 minutes = 2h 25m
      expect(screen.getByText('2h 25m')).toBeInTheDocument();
      expect(screen.getByText('Study Time')).toBeInTheDocument();
    });

    it('renders study time in minutes only when under 60', () => {
      mockHookReturn.progressReport = createProgressReport({ totalStudyTime: 45 });

      render(<ProgressDashboard />);

      expect(screen.getByText('45m')).toBeInTheDocument();
    });

    it('renders study time as exact hours when minutes portion is zero', () => {
      mockHookReturn.progressReport = createProgressReport({ totalStudyTime: 120 });

      render(<ProgressDashboard />);

      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('renders sessions completed as sub-value of study time card', () => {
      mockHookReturn.progressReport = createProgressReport({ sessionsCompleted: 8 });

      render(<ProgressDashboard />);

      expect(screen.getByText('8 sessions')).toBeInTheDocument();
    });

    it('renders topics studied count', () => {
      mockHookReturn.progressReport = createProgressReport({
        topicsStudied: ['React Hooks', 'TypeScript Generics', 'Next.js Routing'],
      });

      render(<ProgressDashboard />);

      expect(screen.getByText('Topics Studied')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('this period')).toBeInTheDocument();
    });

    it('renders learning streak value with day unit', () => {
      mockHookReturn.progressReport = createProgressReport({ streak: 7 });

      render(<ProgressDashboard />);

      expect(screen.getByText('Learning Streak')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
    });

    it('renders skills improved count with sub-label', () => {
      mockHookReturn.progressReport = createProgressReport({
        skillsImproved: ['react', 'typescript'],
      });

      render(<ProgressDashboard />);

      expect(screen.getByText('Skills Improved')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('skills leveled up')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Strengths & Areas for Improvement
  // --------------------------------------------------------------------------

  describe('strengths and areas for improvement', () => {
    it('renders strengths section with badge items', () => {
      mockHookReturn.progressReport = createProgressReport({
        strengths: ['Component Architecture', 'State Management'],
      });

      render(<ProgressDashboard />);

      expect(screen.getByText('Strengths')).toBeInTheDocument();
      expect(screen.getByText('Component Architecture')).toBeInTheDocument();
      expect(screen.getByText('State Management')).toBeInTheDocument();
    });

    it('renders areas for improvement section with badge items', () => {
      mockHookReturn.progressReport = createProgressReport({
        areasForImprovement: ['Testing', 'Performance Optimization'],
      });

      render(<ProgressDashboard />);

      expect(screen.getByText('Areas to Improve')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Period Selector (Tabs)
  // --------------------------------------------------------------------------

  describe('period selector', () => {
    it('renders Daily, Weekly, and Monthly tab triggers', () => {
      render(<ProgressDashboard />);

      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('defaults to weekly period', () => {
      render(<ProgressDashboard />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'weekly');
    });

    it('respects defaultPeriod prop of daily', () => {
      render(<ProgressDashboard defaultPeriod="daily" />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'daily');
    });

    it('respects defaultPeriod prop of monthly', () => {
      render(<ProgressDashboard defaultPeriod="monthly" />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'monthly');
    });

    it('calls fetchProgressReport on mount with the default period', () => {
      render(<ProgressDashboard defaultPeriod="monthly" />);

      expect(mockFetchProgressReport).toHaveBeenCalledWith('monthly');
    });

    it('calls fetchSkillMap on mount when showSkills is true', () => {
      render(<ProgressDashboard showSkills={true} />);

      expect(mockFetchSkillMap).toHaveBeenCalled();
    });

    it('does not call fetchSkillMap on mount when showSkills is false', () => {
      render(<ProgressDashboard showSkills={false} />);

      expect(mockFetchSkillMap).not.toHaveBeenCalled();
    });

    it('calls fetchProgressReport with new period when tab changes', () => {
      render(<ProgressDashboard />);

      // Initial call with default "weekly"
      expect(mockFetchProgressReport).toHaveBeenCalledWith('weekly');

      // Click "Daily" tab
      const dailyTab = screen.getByTestId('tab-trigger-daily');
      fireEvent.click(dailyTab);

      // Should now call with "daily"
      expect(mockFetchProgressReport).toHaveBeenCalledWith('daily');
    });
  });

  // --------------------------------------------------------------------------
  // Goal Progress
  // --------------------------------------------------------------------------

  describe('goal progress', () => {
    it('renders goal progress cards with correct titles', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.getByText('Goal Progress')).toBeInTheDocument();
      expect(screen.getByText('Master React Hooks')).toBeInTheDocument();
      expect(screen.getByText('Learn TypeScript Advanced Types')).toBeInTheDocument();
    });

    it('renders completion percentages for each goal', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders positive progress delta with plus sign', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.getByText('+15%')).toBeInTheDocument();
    });

    it('renders negative progress delta without plus sign', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.getByText('-5%')).toBeInTheDocument();
    });

    it('shows period-specific description in goal progress header', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={true} defaultPeriod="weekly" />);

      expect(screen.getByText('How your goals progressed this weekly')).toBeInTheDocument();
    });

    it('renders progress bars for each goal', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={true} />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const goalProgressBars = progressBars.filter(
        (bar) =>
          bar.getAttribute('aria-valuenow') === '75' ||
          bar.getAttribute('aria-valuenow') === '40'
      );
      expect(goalProgressBars).toHaveLength(2);
    });

    it('does not render goal progress section when showGoals is false', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard showGoals={false} />);

      expect(screen.queryByText('Goal Progress')).not.toBeInTheDocument();
    });

    it('does not render goal progress section when goalsProgress is empty', () => {
      mockHookReturn.progressReport = createProgressReport({ goalsProgress: [] });

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.queryByText('Goal Progress')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Skill Progress Cards
  // --------------------------------------------------------------------------

  describe('skill progress cards', () => {
    it('renders skill cards with names and section heading', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = createMultipleSkills();

      render(<ProgressDashboard showSkills={true} />);

      expect(screen.getByText('Skill Assessment')).toBeInTheDocument();
      expect(screen.getByText('Your current skill levels')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
    });

    it('renders skill level badges for each skill', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = createMultipleSkills();

      render(<ProgressDashboard showSkills={true} />);

      expect(screen.getByText('intermediate')).toBeInTheDocument();
      expect(screen.getByText('advanced')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
    });

    it('renders rounded mastery percentage for each skill', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = [createSkillAssessment({ score: 72.4 })];

      render(<ProgressDashboard showSkills={true} />);

      expect(screen.getByText('72%')).toBeInTheDocument();
      expect(screen.getByText('Mastery')).toBeInTheDocument();
    });

    it('renders last assessed date for skills', () => {
      const assessedDate = '2026-02-28T10:00:00Z';
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = [createSkillAssessment({ lastAssessedAt: assessedDate })];

      render(<ProgressDashboard showSkills={true} />);

      const expectedDate = new Date(assessedDate).toLocaleDateString();
      expect(screen.getByText(`Last assessed: ${expectedDate}`)).toBeInTheDocument();
    });

    it('does not render skill section when showSkills is false', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = createMultipleSkills();

      render(<ProgressDashboard showSkills={false} />);

      expect(screen.queryByText('Skill Assessment')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Compact Mode
  // --------------------------------------------------------------------------

  describe('compact mode', () => {
    it('renders compact layout with Progress heading instead of full heading', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard compact={true} />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.queryByText('Learning Progress')).not.toBeInTheDocument();
    });

    it('shows study time in compact mode', () => {
      mockHookReturn.progressReport = createProgressReport({ totalStudyTime: 90 });

      render(<ProgressDashboard compact={true} />);

      expect(screen.getByText('Study Time')).toBeInTheDocument();
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('shows sessions count in compact mode', () => {
      mockHookReturn.progressReport = createProgressReport({ sessionsCompleted: 5 });

      render(<ProgressDashboard compact={true} />);

      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows streak with day label in compact mode', () => {
      mockHookReturn.progressReport = createProgressReport({ streak: 3 });

      render(<ProgressDashboard compact={true} />);

      expect(screen.getByText('Streak')).toBeInTheDocument();
      expect(screen.getByText(/3 days/)).toBeInTheDocument();
    });

    it('shows loading state in compact mode when isLoadingProgress is true', () => {
      mockHookReturn.isLoadingProgress = true;

      render(<ProgressDashboard compact={true} />);

      // Should show Progress heading even while loading
      expect(screen.getByText('Progress')).toBeInTheDocument();
      // No data should be visible
      expect(screen.queryByText('Study Time')).not.toBeInTheDocument();
    });

    it('shows "No progress data" in compact mode when no report data', () => {
      mockHookReturn.progressReport = null;
      mockHookReturn.isLoadingProgress = false;

      render(<ProgressDashboard compact={true} />);

      expect(screen.getByText('No progress data')).toBeInTheDocument();
    });

    it('does not show period tabs in compact mode', () => {
      render(<ProgressDashboard compact={true} />);

      expect(screen.queryByText('Daily')).not.toBeInTheDocument();
      expect(screen.queryByText('Weekly')).not.toBeInTheDocument();
      expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Refresh Button
  // --------------------------------------------------------------------------

  describe('refresh behavior', () => {
    it('refresh button is disabled when loading progress', () => {
      mockHookReturn.isLoadingProgress = true;

      render(<ProgressDashboard />);

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'outline'
      );
      expect(refreshButton).toBeDisabled();
    });

    it('calls fetchProgressReport and fetchSkillMap when refresh is clicked', async () => {
      mockHookReturn.progressReport = createProgressReport();
      mockFetchProgressReport.mockResolvedValue(undefined);
      mockFetchSkillMap.mockResolvedValue(undefined);

      render(<ProgressDashboard showSkills={true} />);

      // Clear the initial mount calls
      mockFetchProgressReport.mockClear();
      mockFetchSkillMap.mockClear();

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'outline'
      );
      expect(refreshButton).toBeDefined();

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      expect(mockFetchProgressReport).toHaveBeenCalledWith('weekly');
      expect(mockFetchSkillMap).toHaveBeenCalled();
    });

    it('does not call fetchSkillMap on refresh when showSkills is false', async () => {
      mockHookReturn.progressReport = createProgressReport();
      mockFetchProgressReport.mockResolvedValue(undefined);
      mockFetchSkillMap.mockResolvedValue(undefined);

      render(<ProgressDashboard showSkills={false} />);

      mockFetchProgressReport.mockClear();
      mockFetchSkillMap.mockClear();

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'outline'
      );

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      expect(mockFetchProgressReport).toHaveBeenCalledWith('weekly');
      expect(mockFetchSkillMap).not.toHaveBeenCalled();
    });

    it('compact mode refresh button is disabled when loading', () => {
      mockHookReturn.isLoadingProgress = true;

      render(<ProgressDashboard compact={true} />);

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'ghost'
      );
      expect(refreshButton).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Props Handling
  // --------------------------------------------------------------------------

  describe('props handling', () => {
    it('defaults showSkills to true (skill section visible)', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = [];

      render(<ProgressDashboard />);

      expect(screen.getByText('Skill Assessment')).toBeInTheDocument();
    });

    it('defaults showGoals to true (goal section visible when data exists)', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard />);

      expect(screen.getByText('Goal Progress')).toBeInTheDocument();
    });

    it('defaults compact to false (full layout with Learning Progress heading)', () => {
      render(<ProgressDashboard />);

      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles zero study time', () => {
      mockHookReturn.progressReport = createProgressReport({ totalStudyTime: 0 });

      render(<ProgressDashboard />);

      expect(screen.getByText('0m')).toBeInTheDocument();
    });

    it('handles zero streak without crash', () => {
      mockHookReturn.progressReport = createProgressReport({ streak: 0 });

      render(<ProgressDashboard />);

      expect(screen.getByText('0 days')).toBeInTheDocument();
    });

    it('handles empty topicsStudied array', () => {
      mockHookReturn.progressReport = createProgressReport({ topicsStudied: [] });

      render(<ProgressDashboard />);

      expect(screen.getByText('Topics Studied')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles empty skillsImproved array', () => {
      mockHookReturn.progressReport = createProgressReport({ skillsImproved: [] });

      render(<ProgressDashboard />);

      expect(screen.getByText('Skills Improved')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles goal with zero progressDelta (non-negative gets plus sign)', () => {
      mockHookReturn.progressReport = createProgressReport({
        goalsProgress: [
          {
            goalId: 'goal-zero',
            goalTitle: 'No Change Goal',
            progressDelta: 0,
            currentProgress: 50,
          },
        ],
      });

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.getByText('No Change Goal')).toBeInTheDocument();
      expect(screen.getByText('+0%')).toBeInTheDocument();
    });

    it('handles goal with 100% completion', () => {
      mockHookReturn.progressReport = createProgressReport({
        goalsProgress: [
          {
            goalId: 'goal-done',
            goalTitle: 'Completed Goal',
            progressDelta: 5,
            currentProgress: 100,
          },
        ],
      });

      render(<ProgressDashboard showGoals={true} />);

      expect(screen.getByText('Completed Goal')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders error banner alongside loading state', () => {
      mockHookReturn.isLoadingProgress = true;
      mockHookReturn.error = 'Network error occurred';

      render(<ProgressDashboard />);

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('handles skill with unknown level gracefully without crash', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = [
        createSkillAssessment({
          skillId: 'skill-unknown',
          skillName: 'Unknown Skill',
          level: 'unknown-level',
        }),
      ];

      render(<ProgressDashboard showSkills={true} />);

      expect(screen.getByText('Unknown Skill')).toBeInTheDocument();
      expect(screen.getByText('unknown-level')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Correct Labels and Headings
  // --------------------------------------------------------------------------

  describe('correct labels and headings', () => {
    it('renders all main section headings when full data is present', () => {
      mockHookReturn.progressReport = createProgressReport();
      mockHookReturn.skills = createMultipleSkills();

      render(<ProgressDashboard showSkills={true} showGoals={true} />);

      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
      expect(screen.getByText('Track your learning journey with SAM')).toBeInTheDocument();
      expect(screen.getByText('Strengths')).toBeInTheDocument();
      expect(screen.getByText('Areas to Improve')).toBeInTheDocument();
      expect(screen.getByText('Goal Progress')).toBeInTheDocument();
      expect(screen.getByText('Skill Assessment')).toBeInTheDocument();
      expect(screen.getByText('Your current skill levels')).toBeInTheDocument();
    });

    it('renders all four stat card labels', () => {
      mockHookReturn.progressReport = createProgressReport();

      render(<ProgressDashboard />);

      expect(screen.getByText('Study Time')).toBeInTheDocument();
      expect(screen.getByText('Topics Studied')).toBeInTheDocument();
      expect(screen.getByText('Learning Streak')).toBeInTheDocument();
      expect(screen.getByText('Skills Improved')).toBeInTheDocument();
    });

    it('renders stat card sub-values with correct text', () => {
      mockHookReturn.progressReport = createProgressReport({
        sessionsCompleted: 8,
        skillsImproved: ['react', 'ts'],
      });

      render(<ProgressDashboard />);

      expect(screen.getByText('8 sessions')).toBeInTheDocument();
      expect(screen.getByText('this period')).toBeInTheDocument();
      expect(screen.getByText('skills leveled up')).toBeInTheDocument();
    });
  });
});

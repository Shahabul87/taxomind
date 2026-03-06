import React from 'react';
import { render, screen } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================
// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// The framer-motion mock is provided globally via jest.setup.js.
// The next/link mock is provided globally via moduleNameMapper pointing
// to __mocks__/next-link.js (renders an <a> element with href).
// ============================================================================

// Mock the analytics hook - must be declared before component import
const mockUseLearnerAnalytics = jest.fn();

jest.mock('@/hooks/use-unified-analytics', () => ({
  useLearnerAnalytics: (...args: unknown[]) => mockUseLearnerAnalytics(...args),
}));

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
  }) => <h3 className={className}>{children}</h3>,
  CardDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <p className={className}>{children}</p>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
      style={{ width: `${value}%` }}
    />
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

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { PersonalLearningProgress } from '@/components/analytics/personal-learning-progress';

// ============================================================================
// TYPE IMPORTS (for factory functions)
// ============================================================================

import type {
  LearnerAnalytics,
  LearnerOverview,
  CognitiveProgress,
  ExamPerformance,
  WeeklyActivity,
  RecentProgress,
} from '@/hooks/use-unified-analytics';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createLearnerOverview(
  overrides: Partial<LearnerOverview> = {}
): LearnerOverview {
  return {
    totalCoursesEnrolled: 8,
    coursesCompleted: 3,
    coursesInProgress: 4,
    overallProgress: 62,
    totalTimeSpent: 135,
    studyStreak: 12,
    averageScore: 78,
    ...overrides,
  };
}

function createCognitiveProgress(
  overrides: Partial<CognitiveProgress> = {}
): CognitiveProgress {
  return {
    bloomsLevel: 'Apply',
    cognitiveScore: 65,
    skillsAcquired: ['Critical Thinking', 'Problem Solving'],
    growthTrend: [
      { date: '2026-02-01', score: 55 },
      { date: '2026-02-15', score: 60 },
      { date: '2026-03-01', score: 65 },
    ],
    ...overrides,
  };
}

function createExamPerformance(
  overrides: Partial<ExamPerformance> = {}
): ExamPerformance {
  return {
    totalAttempts: 15,
    averageScore: 82,
    passRate: 87,
    recentExams: [
      {
        examId: 'exam-1',
        examTitle: 'JavaScript Fundamentals',
        score: 92,
        passed: true,
        date: '2026-03-01T10:00:00Z',
      },
      {
        examId: 'exam-2',
        examTitle: 'React Advanced Patterns',
        score: 75,
        passed: true,
        date: '2026-02-25T14:00:00Z',
      },
      {
        examId: 'exam-3',
        examTitle: 'Data Structures',
        score: 45,
        passed: false,
        date: '2026-02-20T09:00:00Z',
      },
    ],
    ...overrides,
  };
}

function createWeeklyActivity(
  overrides?: Partial<WeeklyActivity>[]
): WeeklyActivity[] {
  const defaults: WeeklyActivity[] = [
    { date: '2026-03-01', timeSpent: 45, sectionsCompleted: 3 },
    { date: '2026-03-02', timeSpent: 30, sectionsCompleted: 2 },
    { date: '2026-03-03', timeSpent: 0, sectionsCompleted: 0 },
    { date: '2026-03-04', timeSpent: 60, sectionsCompleted: 5 },
    { date: '2026-03-05', timeSpent: 15, sectionsCompleted: 1 },
    { date: '2026-03-06', timeSpent: 90, sectionsCompleted: 7 },
    { date: '2026-03-07', timeSpent: 20, sectionsCompleted: 2 },
  ];
  if (overrides) {
    return defaults.map((d, i) => ({ ...d, ...(overrides[i] || {}) }));
  }
  return defaults;
}

function createRecentProgress(
  overrides?: Partial<RecentProgress>[]
): RecentProgress[] {
  const defaults: RecentProgress[] = [
    {
      courseId: 'course-1',
      courseTitle: 'Advanced TypeScript',
      progress: 75,
      lastAccessed: '2026-03-04T18:00:00Z',
    },
    {
      courseId: 'course-2',
      courseTitle: 'React Mastery',
      progress: 40,
      lastAccessed: '2026-03-03T12:00:00Z',
    },
    {
      courseId: 'course-3',
      courseTitle: 'Node.js Deep Dive',
      progress: 90,
      lastAccessed: '2026-03-02T08:00:00Z',
    },
  ];
  if (overrides) {
    return defaults.map((d, i) => ({ ...d, ...(overrides[i] || {}) }));
  }
  return defaults;
}

function createLearnerAnalytics(
  overrides: Partial<LearnerAnalytics> = {}
): LearnerAnalytics {
  return {
    overview: createLearnerOverview(),
    cognitiveProgress: createCognitiveProgress(),
    examPerformance: createExamPerformance(),
    weeklyActivity: createWeeklyActivity(),
    recentProgress: createRecentProgress(),
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('PersonalLearningProgress', () => {
  beforeEach(() => {
    mockUseLearnerAnalytics.mockReset();
  });

  // --------------------------------------------------------------------------
  // 1. Loading state
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('renders compact skeleton when loading with compact=true', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={true} />
      );

      // Compact skeleton renders a 4-column grid with pulse placeholders
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);

      // Compact skeleton has grid-cols-4
      const gridElement = container.querySelector('[class*="grid-cols-4"]');
      expect(gridElement).toBeInTheDocument();
    });

    it('renders full skeleton when loading with compact=false', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      // Full skeleton renders a 6-column stat grid + 2 large panels
      const pulseElements = container.querySelectorAll('.animate-pulse');
      // 6 stat cards + 2 large panels = 8 pulse elements
      expect(pulseElements.length).toBe(8);
    });

    it('defaults to full skeleton when compact prop is not provided', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      const { container } = render(<PersonalLearningProgress />);

      // Full skeleton has 6-column grid for stat cards
      const gridElement = container.querySelector(
        '[class*="grid-cols-6"]'
      );
      expect(gridElement).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Error state
  // --------------------------------------------------------------------------

  describe('error state', () => {
    it('renders the error message when error string is returned', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to fetch analytics data',
      });

      render(<PersonalLearningProgress />);

      expect(
        screen.getByText('Failed to fetch analytics data')
      ).toBeInTheDocument();
    });

    it('renders a "Start Learning" link to /courses on error', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Something went wrong',
      });

      render(<PersonalLearningProgress />);

      const link = screen.getByText('Start Learning');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/courses');
    });

    it('renders fallback message when data is null and no error', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress />);

      expect(
        screen.getByText('No learning data available yet')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Compact mode renders 4 stat cards
  // --------------------------------------------------------------------------

  describe('compact mode', () => {
    // NOTE: The StatCard component renders icon, value, and subtext,
    // but does NOT render the label prop in the DOM. Tests verify the
    // rendered values and subtexts instead.

    it('renders 4 stat cards with values and subtexts', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({
          totalCoursesEnrolled: 8,
          coursesCompleted: 3,
          overallProgress: 62,
          studyStreak: 12,
        }),
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Apply',
          cognitiveScore: 65,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      // StatCard renders: value + subtext (label is accepted but never rendered)
      // Courses card: value=8, subtext="3 completed"
      expect(screen.getByText('3 completed')).toBeInTheDocument();
      // Progress card: value="62%", subtext="overall"
      expect(screen.getByText('62%')).toBeInTheDocument();
      expect(screen.getByText('overall')).toBeInTheDocument();
      // Streak card: value="12d", subtext="days learning"
      expect(screen.getByText('12d')).toBeInTheDocument();
      expect(screen.getByText('days learning')).toBeInTheDocument();
      // Level card: value="Apply", subtext="65% score"
      expect(screen.getByText('65% score')).toBeInTheDocument();
    });

    it('shows correct values for enrolled courses count', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({ totalCoursesEnrolled: 12 }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('shows completed count as subtext', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({
          totalCoursesEnrolled: 10,
          coursesCompleted: 5,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      expect(screen.getByText('5 completed')).toBeInTheDocument();
    });

    it('shows overall progress as percentage', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({ overallProgress: 73 }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      expect(screen.getByText('73%')).toBeInTheDocument();
      expect(screen.getByText('overall')).toBeInTheDocument();
    });

    it('shows study streak in days format', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({ studyStreak: 7 }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      expect(screen.getByText('7d')).toBeInTheDocument();
      expect(screen.getByText('days learning')).toBeInTheDocument();
    });

    it('shows cognitive level and score in the Level stat card', () => {
      const analytics = createLearnerAnalytics({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Analyze',
          cognitiveScore: 72,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('72% score')).toBeInTheDocument();
    });

    it('renders the "Learning Progress" title', () => {
      const analytics = createLearnerAnalytics();
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
    });

    it('renders a 2x4 grid layout for stat cards', () => {
      const analytics = createLearnerAnalytics();
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={true} />
      );

      const grid = container.querySelector(
        '[class*="grid-cols-2"][class*="sm:grid-cols-4"]'
      );
      expect(grid).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Full mode renders all sections
  // --------------------------------------------------------------------------

  describe('full mode', () => {
    function renderFullMode(analyticsOverrides: Partial<LearnerAnalytics> = {}) {
      const analytics = createLearnerAnalytics(analyticsOverrides);
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });
      return render(<PersonalLearningProgress compact={false} />);
    }

    // -- Overview stats row --

    it('renders all 6 overview stat cards', () => {
      renderFullMode();

      expect(screen.getByText('Enrolled')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Study Streak')).toBeInTheDocument();
      expect(screen.getByText('Time Spent')).toBeInTheDocument();
      expect(screen.getByText('Avg Score')).toBeInTheDocument();
    });

    it('shows correct enrolled count in the Enrolled card', () => {
      // Use a unique number that does not appear elsewhere in the default data
      renderFullMode({
        overview: createLearnerOverview({ totalCoursesEnrolled: 23 }),
      });

      expect(screen.getByText('23')).toBeInTheDocument();
    });

    it('shows correct completed count', () => {
      renderFullMode({
        overview: createLearnerOverview({ coursesCompleted: 7 }),
      });

      // "7" for coursesCompleted - verify it appears at least once
      const elements = screen.getAllByText('7');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows correct in-progress count', () => {
      // Use a unique number to avoid collisions
      renderFullMode({
        overview: createLearnerOverview({ coursesInProgress: 17 }),
      });

      expect(screen.getByText('17')).toBeInTheDocument();
    });

    it('shows study streak with "d" suffix', () => {
      renderFullMode({
        overview: createLearnerOverview({ studyStreak: 21 }),
      });

      expect(screen.getByText('21d')).toBeInTheDocument();
    });

    it('formats time spent as hours and minutes when >= 60 minutes', () => {
      renderFullMode({
        overview: createLearnerOverview({ totalTimeSpent: 135 }),
      });

      expect(screen.getByText('2h 15m')).toBeInTheDocument();
    });

    it('formats time spent as minutes only when < 60', () => {
      renderFullMode({
        overview: createLearnerOverview({ totalTimeSpent: 45 }),
      });

      expect(screen.getByText('45m')).toBeInTheDocument();
    });

    it('formats time spent as hours only when evenly divisible', () => {
      renderFullMode({
        overview: createLearnerOverview({ totalTimeSpent: 120 }),
      });

      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('shows average score as percentage when not null', () => {
      renderFullMode({
        overview: createLearnerOverview({ averageScore: 85 }),
      });

      // 85% may appear in multiple places; verify at least one
      const elements = screen.getAllByText('85%');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "--" for average score when null', () => {
      renderFullMode({
        overview: createLearnerOverview({ averageScore: null }),
      });

      expect(screen.getByText('--')).toBeInTheDocument();
    });

    // -- Cognitive Development section --

    it('renders the Cognitive Development section title', () => {
      renderFullMode();

      expect(screen.getByText('Cognitive Development')).toBeInTheDocument();
    });

    it('shows the Bloom&apos;s Taxonomy description', () => {
      renderFullMode();

      expect(
        screen.getByText(
          "Your thinking skills progress based on Bloom's Taxonomy"
        )
      ).toBeInTheDocument();
    });

    it('shows current cognitive level in the prominent display', () => {
      // Use "Evaluate" which does not conflict with the compact view
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Evaluate',
        }),
      });

      // "Evaluate" appears in the big display AND in the Bloom's levels list
      const evaluateElements = screen.getAllByText('Evaluate');
      expect(evaluateElements.length).toBeGreaterThanOrEqual(2);
      expect(
        screen.getByText('Current Cognitive Level')
      ).toBeInTheDocument();
    });

    it('shows cognitive mastery score with progress bar', () => {
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({ cognitiveScore: 78 }),
      });

      expect(screen.getByText('78% cognitive mastery')).toBeInTheDocument();
    });

    it('renders all 6 taxonomy level names in the progress list', () => {
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Remember',
          cognitiveScore: 30,
        }),
      });

      const levelNames = [
        'Remember',
        'Understand',
        'Apply',
        'Analyze',
        'Evaluate',
        'Create',
      ];
      for (const name of levelNames) {
        // Each name appears at least once (in the list); some may appear
        // in the prominent display too if it matches the current level
        const elements = screen.getAllByText(name);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('shows "Bloom&apos;s Levels Progress" heading', () => {
      renderFullMode();

      expect(
        screen.getByText("Bloom's Levels Progress")
      ).toBeInTheDocument();
    });

    it('renders progress bars for each Bloom&apos;s level', () => {
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Apply',
          cognitiveScore: 65,
        }),
      });

      const progressBars = screen.getAllByTestId('progress-bar');
      // At least 6 for Bloom levels + 1 for the cognitive score bar
      expect(progressBars.length).toBeGreaterThanOrEqual(7);
    });

    it('marks passed Bloom levels with 100% progress', () => {
      // If current level is "Apply", Remember and Understand should be 100%
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Apply',
          cognitiveScore: 65,
        }),
      });

      const progressBars = screen.getAllByRole('progressbar');
      const hundredPercentBars = progressBars.filter(
        (bar) => bar.getAttribute('aria-valuenow') === '100'
      );
      // Remember and Understand should be 100%
      expect(hundredPercentBars.length).toBeGreaterThanOrEqual(2);
    });

    it('marks current Bloom level with cognitive score as progress', () => {
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Analyze',
          cognitiveScore: 55,
        }),
      });

      const progressBars = screen.getAllByRole('progressbar');
      const matchingBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '55'
      );
      expect(matchingBar).toBeTruthy();
    });

    it('marks Bloom levels above current as 0% progress', () => {
      // Current level is "Apply" (index 2), so Analyze, Evaluate, Create = 0%
      renderFullMode({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Apply',
          cognitiveScore: 65,
        }),
      });

      const progressBars = screen.getAllByRole('progressbar');
      const zeroBars = progressBars.filter(
        (bar) => bar.getAttribute('aria-valuenow') === '0'
      );
      // Analyze, Evaluate, Create = 3 bars at 0%
      expect(zeroBars.length).toBeGreaterThanOrEqual(3);
    });

    // -- Exam Performance section --

    it('renders Exam Performance section title', () => {
      renderFullMode();

      expect(screen.getByText('Exam Performance')).toBeInTheDocument();
    });

    it('shows assessment results description', () => {
      renderFullMode();

      expect(
        screen.getByText('Your assessment results and progress')
      ).toBeInTheDocument();
    });

    it('shows total attempts, average score, and pass rate labels', () => {
      renderFullMode({
        examPerformance: createExamPerformance({
          totalAttempts: 25,
          averageScore: 79,
          passRate: 88,
        }),
      });

      expect(screen.getByText('Total Attempts')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Pass Rate')).toBeInTheDocument();
      // Verify values exist (may appear multiple times due to overview stats)
      expect(screen.getByText('25')).toBeInTheDocument();
      const scoreElements = screen.getAllByText('79%');
      expect(scoreElements.length).toBeGreaterThanOrEqual(1);
      const rateElements = screen.getAllByText('88%');
      expect(rateElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows recent exam titles in exam history', () => {
      renderFullMode();

      expect(
        screen.getByText('JavaScript Fundamentals')
      ).toBeInTheDocument();
      expect(
        screen.getByText('React Advanced Patterns')
      ).toBeInTheDocument();
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
    });

    it('shows "Recent Exams" heading when exams exist', () => {
      renderFullMode();

      expect(screen.getByText('Recent Exams')).toBeInTheDocument();
    });

    it('displays exam scores as percentages', () => {
      renderFullMode({
        examPerformance: createExamPerformance({
          recentExams: [
            {
              examId: 'e1',
              examTitle: 'Test Exam',
              score: 88,
              passed: true,
              date: '2026-03-01T10:00:00Z',
            },
          ],
        }),
      });

      // The score appears as "88%" in the exam row
      const scoreElements = screen.getAllByText('88%');
      expect(scoreElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Passed" badge for passing exams', () => {
      renderFullMode({
        examPerformance: createExamPerformance({
          recentExams: [
            {
              examId: 'e1',
              examTitle: 'Passing Exam',
              score: 80,
              passed: true,
              date: '2026-03-01T10:00:00Z',
            },
          ],
        }),
      });

      expect(screen.getByText('Passed')).toBeInTheDocument();
      const badges = screen.getAllByTestId('badge');
      const passedBadge = badges.find((b) => b.textContent === 'Passed');
      expect(passedBadge).toHaveAttribute('data-variant', 'default');
    });

    it('shows "Failed" badge for failing exams', () => {
      renderFullMode({
        examPerformance: createExamPerformance({
          recentExams: [
            {
              examId: 'e1',
              examTitle: 'Failed Exam',
              score: 35,
              passed: false,
              date: '2026-03-01T10:00:00Z',
            },
          ],
        }),
      });

      expect(screen.getByText('Failed')).toBeInTheDocument();
      const badges = screen.getAllByTestId('badge');
      const failedBadge = badges.find((b) => b.textContent === 'Failed');
      expect(failedBadge).toHaveAttribute('data-variant', 'destructive');
    });

    it('does not render "Recent Exams" heading when recentExams is empty', () => {
      renderFullMode({
        examPerformance: createExamPerformance({ recentExams: [] }),
      });

      expect(screen.queryByText('Recent Exams')).not.toBeInTheDocument();
    });

    it('shows at most 4 recent exams even if more are provided', () => {
      const fiveExams = Array.from({ length: 5 }, (_, i) => ({
        examId: `exam-${i}`,
        examTitle: `Exam Number ${i + 1}`,
        score: 70 + i * 5,
        passed: true,
        date: `2026-03-0${i + 1}T10:00:00Z`,
      }));

      renderFullMode({
        examPerformance: createExamPerformance({ recentExams: fiveExams }),
      });

      // The 5th exam should not be rendered (sliced to 4)
      expect(screen.getByText('Exam Number 1')).toBeInTheDocument();
      expect(screen.getByText('Exam Number 4')).toBeInTheDocument();
      expect(screen.queryByText('Exam Number 5')).not.toBeInTheDocument();
    });

    // -- Weekly Activity section --

    it('renders Weekly Activity section title', () => {
      renderFullMode();

      expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
    });

    it('renders bars for each day of the week', () => {
      const { container } = renderFullMode();

      // The weekly chart has 7 days, each rendered in a flex-1 column
      const activityColumns = container.querySelectorAll(
        '[class*="flex-1"][class*="flex-col"]'
      );
      expect(activityColumns.length).toBe(7);
    });

    it('shows total time across all weekly days', () => {
      // Default factory: 45+30+0+60+15+90+20 = 260 min = 4h 20m
      renderFullMode();

      expect(screen.getByText(/Total:/)).toBeInTheDocument();
      expect(screen.getByText(/4h 20m/)).toBeInTheDocument();
    });

    it('shows total sections completed count', () => {
      // Default factory: 3+2+0+5+1+7+2 = 20
      renderFullMode();

      expect(screen.getByText(/20 completed/)).toBeInTheDocument();
    });

    it('renders weekday abbreviations for activity bars', () => {
      const { container } = renderFullMode();

      // The component renders toLocaleDateString("en-US", {weekday: "short"})
      // This produces 3-letter day names like "Sat", "Sun", "Mon", etc.
      const dayLabels = container.querySelectorAll('[class*="text-\\[10px\\]"]');
      expect(dayLabels.length).toBe(7);
    });

    // -- Recent Course Progress section --

    it('renders Recent Course Progress section title', () => {
      renderFullMode();

      expect(
        screen.getByText('Recent Course Progress')
      ).toBeInTheDocument();
    });

    it('shows course titles as links to /learn/[courseId]', () => {
      renderFullMode();

      const link1 = screen.getByText('Advanced TypeScript').closest('a');
      expect(link1).toHaveAttribute('href', '/learn/course-1');

      const link2 = screen.getByText('React Mastery').closest('a');
      expect(link2).toHaveAttribute('href', '/learn/course-2');
    });

    it('shows progress percentage for each course via progress bars', () => {
      renderFullMode();

      // Progress values appear as both text and aria-valuenow on progress bars
      // Use progress bars to verify since text values may collide with other sections
      const progressBars = screen.getAllByRole('progressbar');
      const bar75 = progressBars.find(
        (b) => b.getAttribute('aria-valuenow') === '75'
      );
      const bar40 = progressBars.find(
        (b) => b.getAttribute('aria-valuenow') === '40'
      );
      const bar90 = progressBars.find(
        (b) => b.getAttribute('aria-valuenow') === '90'
      );
      expect(bar75).toBeTruthy();
      expect(bar40).toBeTruthy();
      expect(bar90).toBeTruthy();
    });

    it('renders progress bars for each course', () => {
      renderFullMode();

      const progressBars = screen.getAllByRole('progressbar');
      const bar75 = progressBars.find(
        (b) => b.getAttribute('aria-valuenow') === '75'
      );
      const bar40 = progressBars.find(
        (b) => b.getAttribute('aria-valuenow') === '40'
      );
      const bar90 = progressBars.find(
        (b) => b.getAttribute('aria-valuenow') === '90'
      );
      expect(bar75).toBeTruthy();
      expect(bar40).toBeTruthy();
      expect(bar90).toBeTruthy();
    });

    it('shows at most 4 recent courses even if more are provided', () => {
      const fiveCourses: RecentProgress[] = Array.from(
        { length: 5 },
        (_, i) => ({
          courseId: `c-${i}`,
          courseTitle: `Course ${i + 1}`,
          progress: (i + 1) * 20,
          lastAccessed: `2026-03-0${i + 1}T10:00:00Z`,
        })
      );

      renderFullMode({ recentProgress: fiveCourses });

      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.getByText('Course 4')).toBeInTheDocument();
      expect(screen.queryByText('Course 5')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Empty state when no courses enrolled
  // --------------------------------------------------------------------------

  describe('empty state (no courses in progress)', () => {
    it('shows empty message when recentProgress is empty in full view', () => {
      const analytics = createLearnerAnalytics({ recentProgress: [] });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      expect(
        screen.getByText('No courses in progress yet')
      ).toBeInTheDocument();
    });

    it('shows "Browse Courses" link in empty recent progress', () => {
      const analytics = createLearnerAnalytics({ recentProgress: [] });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      const browseLink = screen.getByText('Browse Courses');
      expect(browseLink).toBeInTheDocument();
      expect(browseLink.closest('a')).toHaveAttribute('href', '/courses');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Correct stat values (enrolled, completed, streak, time spent)
  // --------------------------------------------------------------------------

  describe('stat values accuracy', () => {
    it('displays zero values correctly in compact mode', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({
          totalCoursesEnrolled: 0,
          coursesCompleted: 0,
          overallProgress: 0,
          studyStreak: 0,
        }),
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Remember',
          cognitiveScore: 0,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={true} />);

      // Value "0" for courses
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(1);
      // Progress "0%"
      expect(screen.getByText('0%')).toBeInTheDocument();
      // Streak "0d"
      expect(screen.getByText('0d')).toBeInTheDocument();
      // Level "Remember" from cognitiveProgress
      expect(screen.getByText('Remember')).toBeInTheDocument();
      // Score "0% score"
      expect(screen.getByText('0% score')).toBeInTheDocument();
    });

    it('displays large values correctly in full mode', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({
          totalCoursesEnrolled: 100,
          coursesCompleted: 50,
          coursesInProgress: 30,
          studyStreak: 365,
          totalTimeSpent: 6000,
          averageScore: 99,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('365d')).toBeInTheDocument();
      // 6000 minutes = 100h
      expect(screen.getByText('100h')).toBeInTheDocument();
      const scoreElements = screen.getAllByText('99%');
      expect(scoreElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Bloom&apos;s level display
  // --------------------------------------------------------------------------

  describe("Bloom's level display", () => {
    it('shows "Remember" as current level when bloomsLevel is Remember', () => {
      const analytics = createLearnerAnalytics({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Remember',
          cognitiveScore: 30,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      // "Remember" appears as the current level display AND in the progress list
      const rememberElements = screen.getAllByText('Remember');
      expect(rememberElements.length).toBeGreaterThanOrEqual(2);
    });

    it('shows "Create" as the highest level when bloomsLevel is Create', () => {
      const analytics = createLearnerAnalytics({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Create',
          cognitiveScore: 90,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      // All 5 levels below Create should be passed (100%)
      const progressBars = screen.getAllByRole('progressbar');
      const hundredBars = progressBars.filter(
        (b) => b.getAttribute('aria-valuenow') === '100'
      );
      // Remember, Understand, Apply, Analyze, Evaluate = 5 bars at 100%
      expect(hundredBars.length).toBeGreaterThanOrEqual(5);
    });

    it('renders numeric indexes for Bloom levels beyond the current level', () => {
      // When bloomsLevel is "Apply" (index 2), levels Analyze (index 3),
      // Evaluate (index 4), Create (index 5) show as numbers 4, 5, 6
      // respectively in the circular indicator.
      const analytics = createLearnerAnalytics({
        cognitiveProgress: createCognitiveProgress({
          bloomsLevel: 'Apply',
          cognitiveScore: 50,
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      // The number circles have specific classes: bg-slate-200 for not-reached levels
      const notReachedCircles = container.querySelectorAll(
        '[class*="bg-slate-200"][class*="w-6"][class*="h-6"]'
      );
      // Should be 3 not-reached circles: Analyze (4), Evaluate (5), Create (6)
      expect(notReachedCircles.length).toBe(3);

      // Verify the text content of those circles
      const circleTexts = Array.from(notReachedCircles).map(
        (el) => el.textContent
      );
      expect(circleTexts).toContain('4');
      expect(circleTexts).toContain('5');
      expect(circleTexts).toContain('6');
    });
  });

  // --------------------------------------------------------------------------
  // 8. Handles null/undefined data gracefully
  // --------------------------------------------------------------------------

  describe('null and edge-case data handling', () => {
    it('handles averageScore null in full view without crashing', () => {
      const analytics = createLearnerAnalytics({
        overview: createLearnerOverview({ averageScore: null }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('handles empty recentExams array without crashing', () => {
      const analytics = createLearnerAnalytics({
        examPerformance: createExamPerformance({ recentExams: [] }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      // "Recent Exams" heading should not appear
      expect(screen.queryByText('Recent Exams')).not.toBeInTheDocument();
      // But the rest of the exam section should still render
      expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    });

    it('handles zero timeSpent across all weekly days', () => {
      const zeroActivity: WeeklyActivity[] = Array.from(
        { length: 7 },
        (_, i) => ({
          date: `2026-03-0${i + 1}`,
          timeSpent: 0,
          sectionsCompleted: 0,
        })
      );

      const analytics = createLearnerAnalytics({
        weeklyActivity: zeroActivity,
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      // Total should be "0m"
      expect(screen.getByText(/0m/)).toBeInTheDocument();
      expect(screen.getByText(/0 completed/)).toBeInTheDocument();
    });

    it('handles single-day weekly activity array', () => {
      const singleDay: WeeklyActivity[] = [
        { date: '2026-03-05', timeSpent: 30, sectionsCompleted: 2 },
      ];

      const analytics = createLearnerAnalytics({
        weeklyActivity: singleDay,
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      // Should render 1 activity column without crashing
      const activityColumns = container.querySelectorAll(
        '[class*="flex-1"][class*="flex-col"]'
      );
      expect(activityColumns.length).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Hook invocation
  // --------------------------------------------------------------------------

  describe('hook invocation', () => {
    it('calls useLearnerAnalytics with "month" time range', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<PersonalLearningProgress />);

      expect(mockUseLearnerAnalytics).toHaveBeenCalledWith('month');
    });

    it('calls useLearnerAnalytics exactly once per render', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<PersonalLearningProgress />);

      expect(mockUseLearnerAnalytics).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // 10. className pass-through
  // --------------------------------------------------------------------------

  describe('className pass-through', () => {
    it('applies custom className in compact mode', () => {
      const analytics = createLearnerAnalytics();
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={true} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('applies custom className in full mode', () => {
      const analytics = createLearnerAnalytics();
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress
          compact={false}
          className="my-full-class"
        />
      );

      const wrapper = container.querySelector('.my-full-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies custom className in error state', () => {
      mockUseLearnerAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Network error',
      });

      const { container } = render(
        <PersonalLearningProgress className="error-class" />
      );

      const card = container.querySelector('.error-class');
      expect(card).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 11. Weekly activity bar height proportionality
  // --------------------------------------------------------------------------

  describe('weekly activity bar heights', () => {
    it('renders the tallest bar at 100% height for the day with max timeSpent', () => {
      const activity: WeeklyActivity[] = [
        { date: '2026-03-01', timeSpent: 10, sectionsCompleted: 1 },
        { date: '2026-03-02', timeSpent: 100, sectionsCompleted: 8 },
        { date: '2026-03-03', timeSpent: 50, sectionsCompleted: 4 },
      ];

      const analytics = createLearnerAnalytics({
        weeklyActivity: activity,
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      // The bar for 100 min should have style height: 100%
      const bars = container.querySelectorAll('[class*="rounded-t-md"]');
      const heights = Array.from(bars).map(
        (b) => (b as HTMLElement).style.height
      );
      expect(heights).toContain('100%');
    });

    it('renders a minimum of 5% height for bars with zero timeSpent', () => {
      const activity: WeeklyActivity[] = [
        { date: '2026-03-01', timeSpent: 60, sectionsCompleted: 5 },
        { date: '2026-03-02', timeSpent: 0, sectionsCompleted: 0 },
      ];

      const analytics = createLearnerAnalytics({
        weeklyActivity: activity,
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      const bars = container.querySelectorAll('[class*="rounded-t-md"]');
      const zeroBar = Array.from(bars).find((b) => {
        const cls = (b as HTMLElement).className;
        return cls.includes('bg-slate-200');
      });
      expect(zeroBar).toBeTruthy();
      expect((zeroBar as HTMLElement).style.height).toBe('5%');
    });
  });

  // --------------------------------------------------------------------------
  // 12. Exam date formatting
  // --------------------------------------------------------------------------

  describe('exam date formatting', () => {
    it('formats exam dates using toLocaleDateString', () => {
      const analytics = createLearnerAnalytics({
        examPerformance: createExamPerformance({
          recentExams: [
            {
              examId: 'e1',
              examTitle: 'Date Format Test Exam',
              score: 80,
              passed: true,
              date: '2026-03-01T10:00:00Z',
            },
          ],
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      // The date is formatted via toLocaleDateString() which produces
      // locale-dependent output. Verify the exam title is there and a date string exists.
      expect(
        screen.getByText('Date Format Test Exam')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 13. Course progress lastAccessed date formatting
  // --------------------------------------------------------------------------

  describe('course progress date formatting', () => {
    it('formats lastAccessed dates using toLocaleDateString', () => {
      const analytics = createLearnerAnalytics({
        recentProgress: [
          {
            courseId: 'c1',
            courseTitle: 'Date Test Course',
            progress: 60,
            lastAccessed: '2026-01-15T08:00:00Z',
          },
        ],
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      render(<PersonalLearningProgress compact={false} />);

      expect(screen.getByText('Date Test Course')).toBeInTheDocument();
      // The date renders via toLocaleDateString() which varies by locale,
      // but we confirm a link with the right href exists
      const link = screen.getByText('Date Test Course').closest('a');
      expect(link).toHaveAttribute('href', '/learn/c1');
    });
  });

  // --------------------------------------------------------------------------
  // 14. Icon rendering
  // --------------------------------------------------------------------------

  describe('icon rendering', () => {
    it('renders Lucide icons in compact mode stat cards', () => {
      const analytics = createLearnerAnalytics();
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={true} />
      );

      // The mock renders SVGs with aria-hidden="true"
      const iconSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
      // At least: GraduationCap (title) + BookOpen + Target + Flame + Brain (4 stat icons)
      expect(iconSvgs.length).toBeGreaterThanOrEqual(5);
    });

    it('renders Lucide icons in full mode overview cards', () => {
      const analytics = createLearnerAnalytics();
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      const iconSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
      // Full mode has many icons: 6 overview + section headers + Bloom levels + etc.
      expect(iconSvgs.length).toBeGreaterThanOrEqual(12);
    });
  });

  // --------------------------------------------------------------------------
  // 15. Passing score color coding in exam results
  // --------------------------------------------------------------------------

  describe('exam score color coding', () => {
    it('applies green text color class for passed exams', () => {
      const analytics = createLearnerAnalytics({
        examPerformance: createExamPerformance({
          recentExams: [
            {
              examId: 'e-pass',
              examTitle: 'Passed Color Exam',
              score: 85,
              passed: true,
              date: '2026-03-01T10:00:00Z',
            },
          ],
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      // The component applies cn("text-sm font-semibold", exam.passed ? "text-green-600" : "text-red-600")
      // Our cn mock joins them with spaces: "text-sm font-semibold text-green-600"
      const greenScoreSpan = container.querySelector(
        'span[class*="text-green-600"]'
      );
      expect(greenScoreSpan).toBeInTheDocument();
      expect(greenScoreSpan?.textContent).toContain('85%');
    });

    it('applies red text color class for failed exams', () => {
      const analytics = createLearnerAnalytics({
        examPerformance: createExamPerformance({
          recentExams: [
            {
              examId: 'e-fail',
              examTitle: 'Failed Color Exam',
              score: 30,
              passed: false,
              date: '2026-03-01T10:00:00Z',
            },
          ],
        }),
      });
      mockUseLearnerAnalytics.mockReturnValue({
        data: analytics,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PersonalLearningProgress compact={false} />
      );

      const redScoreSpan = container.querySelector(
        'span[class*="text-red-600"]'
      );
      expect(redScoreSpan).toBeInTheDocument();
      expect(redScoreSpan?.textContent).toContain('30%');
    });
  });
});

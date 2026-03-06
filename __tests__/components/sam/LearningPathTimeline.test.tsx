import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ============================================================================
// MOCKS - All external dependencies mocked before component import
// ============================================================================

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock date-fns - next/jest uses modularizeImports which transforms
// `import { format } from 'date-fns'` into `import format from 'date-fns/format'`.
// We must mock each sub-module individually.
// NOTE: restoreMocks: true clears jest.fn() implementations after each test,
// so we re-apply implementations in beforeEach below.
jest.mock('date-fns', () => ({
  format: jest.fn(),
  formatDistanceToNow: jest.fn(),
  addDays: jest.fn(),
  isPast: jest.fn(),
  isToday: jest.fn(),
  isFuture: jest.fn(),
}));

jest.mock('date-fns/format', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('date-fns/formatDistanceToNow', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('date-fns/addDays', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('date-fns/isPast', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('date-fns/isToday', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('date-fns/isFuture', () => ({ __esModule: true, default: jest.fn() }));

// Helper to get fresh date-fns mock references (they are default exports from submodules)
function getDateMocks() {
  return {
    format: require('date-fns/format').default as jest.Mock,
    formatDistanceToNow: require('date-fns/formatDistanceToNow').default as jest.Mock,
    addDays: require('date-fns/addDays').default as jest.Mock,
    isPast: require('date-fns/isPast').default as jest.Mock,
    isToday: require('date-fns/isToday').default as jest.Mock,
    isFuture: require('date-fns/isFuture').default as jest.Mock,
  };
}

// Mock framer-motion
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) => {
        const {
          initial, animate, exit, transition, variants,
          whileHover, whileTap, whileInView, viewport,
          drag, dragConstraints, dragElastic,
          onAnimationStart, onAnimationComplete, layout, layoutId,
          ...htmlProps
        } = props;
        return ReactFM.createElement(tag, { ...htmlProps, ref }, children);
      },
    );
    Comp.displayName = `motion.${tag}`;
    return Comp;
  };
  return {
    motion: new Proxy(
      {},
      { get: (_t: Record<string, unknown>, prop: string) => makeMotion(prop) },
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// Mock lucide-react icons - single data-testid="icon-default" per the global moduleNameMapper
// The global mock already handles this via Proxy, but we override locally for consistency
jest.mock('lucide-react', () => {
  const ReactLR = require('react');
  const MockIcon = ReactLR.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<SVGSVGElement>) =>
      ReactLR.createElement('svg', { ref, 'data-testid': 'icon-default', 'aria-hidden': 'true', ...props }),
  );
  MockIcon.displayName = 'MockIcon';
  return new Proxy(
    {},
    {
      get: (_: Record<string, unknown>, name: string) => {
        if (name === '__esModule') return true;
        return MockIcon;
      },
    },
  );
});

// Mock UI card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="card-description" className={className}>{children}</p>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
}));

// Mock Badge UI component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="ui-badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

// Mock Button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { variant, size, asChild, ...htmlProps } = props;
    return <button data-testid="ui-button" data-variant={variant} data-size={size} {...htmlProps}>{children}</button>;
  },
}));

// Mock Progress
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} role="progressbar" />
  ),
}));

// Mock Skeleton
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock ScrollArea
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>{children}</div>
  ),
}));

// Mock Tooltip - render nothing for tooltip content to avoid duplicate text
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT UNDER TEST (must come after mocks)
// ============================================================================
import { LearningPathTimeline } from '@/components/sam/LearningPathTimeline';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

interface TimelineMilestone {
  id: string;
  name: string;
  type: 'concept' | 'skill' | 'chapter' | 'checkpoint' | 'assessment';
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  completedAt?: string;
  estimatedDate?: string;
  masteryLevel: number;
  targetMastery: number;
  order: number;
  isOptional?: boolean;
  rewards?: {
    xp: number;
    badges?: string[];
  };
}

interface LearningPathTimelineData {
  pathId: string;
  pathName: string;
  courseId?: string;
  courseName?: string;
  milestones: TimelineMilestone[];
  progress: {
    completedCount: number;
    totalCount: number;
    completionPercentage: number;
    currentMilestoneIndex: number;
    estimatedCompletionDate?: string;
    averagePacePerDay: number;
    daysRemaining: number;
  };
  stats: {
    totalXpEarned: number;
    badgesEarned: number;
    currentStreak: number;
    bestStreak: number;
    totalTimeSpent: number;
  };
  pacing: {
    status: 'ahead' | 'on_track' | 'behind';
    daysAheadOrBehind: number;
    recommendation?: string;
  };
}

function createMilestone(overrides: Partial<TimelineMilestone> = {}): TimelineMilestone {
  return {
    id: 'milestone-1',
    name: 'Introduction to TypeScript',
    type: 'concept',
    description: 'Learn the basics of TypeScript',
    status: 'completed',
    completedAt: '2026-01-15T10:30:00Z',
    masteryLevel: 85,
    targetMastery: 80,
    order: 1,
    isOptional: false,
    rewards: {
      xp: 100,
      badges: ['TypeScript Beginner'],
    },
    ...overrides,
  };
}

function createTimelineData(overrides: Partial<LearningPathTimelineData> = {}): LearningPathTimelineData {
  return {
    pathId: 'path-1',
    pathName: 'TypeScript Mastery Path',
    courseId: 'course-1',
    courseName: 'Complete TypeScript Course',
    milestones: [
      createMilestone({
        id: 'ms-1',
        name: 'TypeScript Basics',
        type: 'concept',
        status: 'completed',
        completedAt: '2026-01-15T10:30:00Z',
        masteryLevel: 90,
        targetMastery: 80,
        order: 1,
        rewards: { xp: 100, badges: ['TS Starter'] },
      }),
      createMilestone({
        id: 'ms-2',
        name: 'Advanced Types',
        type: 'skill',
        status: 'current',
        completedAt: undefined,
        estimatedDate: '2026-03-10T00:00:00Z',
        masteryLevel: 45,
        targetMastery: 80,
        order: 2,
        rewards: { xp: 200 },
      }),
      createMilestone({
        id: 'ms-3',
        name: 'Generics Deep Dive',
        type: 'chapter',
        status: 'upcoming',
        completedAt: undefined,
        estimatedDate: '2026-03-20T00:00:00Z',
        masteryLevel: 0,
        targetMastery: 80,
        order: 3,
        isOptional: true,
      }),
      createMilestone({
        id: 'ms-4',
        name: 'Final Assessment',
        type: 'assessment',
        status: 'locked',
        completedAt: undefined,
        masteryLevel: 0,
        targetMastery: 90,
        order: 4,
        rewards: { xp: 500, badges: ['TypeScript Master'] },
      }),
    ],
    progress: {
      completedCount: 1,
      totalCount: 4,
      completionPercentage: 25,
      currentMilestoneIndex: 1,
      estimatedCompletionDate: '2026-04-15T00:00:00Z',
      averagePacePerDay: 0.5,
      daysRemaining: 30,
    },
    stats: {
      totalXpEarned: 350,
      badgesEarned: 2,
      currentStreak: 5,
      bestStreak: 12,
      totalTimeSpent: 720,
    },
    pacing: {
      status: 'on_track',
      daysAheadOrBehind: 0,
      recommendation: 'Keep up the great work!',
    },
    ...overrides,
  };
}

function mockFetchSuccess(data: LearningPathTimelineData): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  });
}

function mockFetchError(message: string = 'Server error', status: number = 500): void {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error: message }),
  });
}

function mockFetchNetworkError(): void {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('LearningPathTimeline', () => {
  beforeEach(() => {
    mockFetch.mockReset();

    // Re-apply date-fns mock implementations (restoreMocks: true clears them after each test)
    const dm = getDateMocks();
    dm.format.mockImplementation((date: Date, fmt: string) => {
      if (fmt === 'MMM d, yyyy') return 'Jan 15, 2026';
      if (fmt === 'MMM d') return 'Mar 10';
      if (fmt === 'MMMM d, yyyy') return 'April 15, 2026';
      return 'formatted-date';
    });
    dm.formatDistanceToNow.mockImplementation(() => '3 days ago');
    dm.addDays.mockImplementation((date: Date, days: number) => new Date('2026-04-01'));
    dm.isPast.mockImplementation(() => false);
    dm.isToday.mockImplementation(() => false);
    dm.isFuture.mockImplementation(() => true);
  });

  // --------------------------------------------------------------------------
  // RENDERING - Empty / No Props State
  // --------------------------------------------------------------------------

  describe('Empty / No Props State', () => {
    it('renders empty state when no pathId or courseId is provided', () => {
      render(<LearningPathTimeline />);
      expect(screen.getByText('Learning Path Timeline')).toBeInTheDocument();
      expect(screen.getByText('Track your progress through the learning path')).toBeInTheDocument();
      expect(
        screen.getByText('No learning path selected. Enroll in a course to see your timeline.'),
      ).toBeInTheDocument();
    });

    it('does not call fetch when no pathId or courseId is provided', () => {
      render(<LearningPathTimeline />);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('renders a Card wrapper in empty state', () => {
      render(<LearningPathTimeline />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('applies custom className in empty state', () => {
      render(<LearningPathTimeline className="custom-class" />);
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------

  describe('Loading State', () => {
    it('shows skeleton loading state while fetching data', () => {
      // Make fetch never resolve so we stay in loading
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      render(<LearningPathTimeline pathId="path-1" />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it('renders Card wrapper during loading', () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      render(<LearningPathTimeline pathId="path-1" />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('applies custom className during loading state', () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      render(<LearningPathTimeline pathId="path-1" className="loading-class" />);
      expect(screen.getByTestId('card')).toHaveClass('loading-class');
    });
  });

  // --------------------------------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------------------------------

  describe('Error State', () => {
    it('renders error message when fetch returns non-ok response', async () => {
      mockFetchError('Failed to fetch timeline data');
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Timeline')).toBeInTheDocument();
      });
    });

    it('displays the specific error message from the API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false, error: 'Custom error message' }),
      });
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('shows Retry button in error state', async () => {
      mockFetchError();
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries fetch when Retry button is clicked', async () => {
      mockFetchError();
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const timelineData = createTimelineData();
      mockFetchSuccess(timelineData);

      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => {
        expect(screen.getByText('TypeScript Mastery Path')).toBeInTheDocument();
      });
      // Initial fetch + retry
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('handles network errors gracefully', async () => {
      mockFetchNetworkError();
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows generic error message for non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('string error');
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
      });
    });

    it('applies custom className in error state', async () => {
      mockFetchError();
      render(<LearningPathTimeline pathId="path-1" className="error-class" />);
      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('error-class');
      });
    });
  });

  // --------------------------------------------------------------------------
  // DATA FETCH BEHAVIOR
  // --------------------------------------------------------------------------

  describe('Data Fetching', () => {
    it('fetches with pathId query parameter', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-123" />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('pathId=path-123'),
        );
      });
    });

    it('fetches with courseId query parameter', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline courseId="course-456" />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('courseId=course-456'),
        );
      });
    });

    it('fetches with both pathId and courseId query parameters', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" courseId="course-1" />);
      await waitFor(() => {
        const callUrl = mockFetch.mock.calls[0][0] as string;
        expect(callUrl).toContain('pathId=path-1');
        expect(callUrl).toContain('courseId=course-1');
      });
    });

    it('calls the correct API endpoint', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sam/learning-path/timeline?'),
        );
      });
    });

    it('re-fetches when pathId changes', async () => {
      const data1 = createTimelineData({ pathName: 'Path One' });
      const data2 = createTimelineData({ pathName: 'Path Two' });
      mockFetchSuccess(data1);

      const { rerender } = render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Path One')).toBeInTheDocument();
      });

      mockFetchSuccess(data2);
      rerender(<LearningPathTimeline pathId="path-2" />);
      await waitFor(() => {
        expect(screen.getByText('Path Two')).toBeInTheDocument();
      });
    });

    it('re-fetches when courseId changes', async () => {
      const data1 = createTimelineData({ courseName: 'Course A' });
      const data2 = createTimelineData({ courseName: 'Course B' });
      mockFetchSuccess(data1);

      const { rerender } = render(<LearningPathTimeline courseId="c-1" />);
      await waitFor(() => {
        expect(screen.getByText('Course A')).toBeInTheDocument();
      });

      mockFetchSuccess(data2);
      rerender(<LearningPathTimeline courseId="c-2" />);
      await waitFor(() => {
        expect(screen.getByText('Course B')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUCCESSFUL DATA RENDERING - Header & Progress
  // --------------------------------------------------------------------------

  describe('Header and Progress', () => {
    it('renders the path name as a card title', async () => {
      const data = createTimelineData({ pathName: 'React Fundamentals' });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      });
    });

    it('renders the course name when provided', async () => {
      const data = createTimelineData({ courseName: 'Full Stack Development' });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Full Stack Development')).toBeInTheDocument();
      });
    });

    it('does not render course name when not provided', async () => {
      const data = createTimelineData({ courseName: undefined });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryByTestId('card-description')).not.toBeInTheDocument();
    });

    it('displays overall progress text', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Overall Progress')).toBeInTheDocument();
        expect(screen.getByText('1/4 milestones')).toBeInTheDocument();
      });
    });

    it('renders progress bar with correct value', async () => {
      const data = createTimelineData();
      data.progress.completionPercentage = 75;
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      });
    });

    it('displays estimated completion date and remaining days', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        // date-fns format mock returns 'April 15, 2026' for MMMM d, yyyy
        expect(screen.getByText(/April 15, 2026/)).toBeInTheDocument();
        expect(screen.getByText(/30 days remaining/)).toBeInTheDocument();
      });
    });

    it('does not display estimated completion when not provided', async () => {
      const data = createTimelineData();
      data.progress.estimatedCompletionDate = undefined;
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryByText(/days remaining/)).not.toBeInTheDocument();
    });

    it('renders the refresh button', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      // There should be a button with RefreshCw icon (rendered as svg)
      const buttons = screen.getAllByTestId('ui-button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls fetchTimelineData when refresh button is clicked', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });

      // Prepare second fetch
      const data2 = createTimelineData({ pathName: 'Refreshed Path' });
      mockFetchSuccess(data2);

      // The refresh button is the one with variant="outline" and size="icon"
      const refreshButton = screen.getAllByTestId('ui-button').find(
        (btn) => btn.getAttribute('data-variant') === 'outline' && btn.getAttribute('data-size') === 'icon',
      );
      expect(refreshButton).toBeDefined();
      fireEvent.click(refreshButton!);

      await waitFor(() => {
        expect(screen.getByText('Refreshed Path')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // STATS SECTION
  // --------------------------------------------------------------------------

  describe('Stats Section', () => {
    it('renders XP earned stat', async () => {
      const data = createTimelineData();
      data.stats.totalXpEarned = 1500;
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats />);
      await waitFor(() => {
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('XP Earned')).toBeInTheDocument();
      });
    });

    it('renders badges earned stat', async () => {
      const data = createTimelineData();
      data.stats.badgesEarned = 7;
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats />);
      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('Badges')).toBeInTheDocument();
      });
    });

    it('renders day streak stat', async () => {
      const data = createTimelineData();
      data.stats.currentStreak = 15;
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats />);
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('Day Streak')).toBeInTheDocument();
      });
    });

    it('renders hours stat (converted from minutes)', async () => {
      const data = createTimelineData();
      data.stats.totalTimeSpent = 180; // 3 hours
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats />);
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Hours')).toBeInTheDocument();
      });
    });

    it('does not render stats when showStats is false', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats={false} />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryByText('XP Earned')).not.toBeInTheDocument();
      expect(screen.queryByText('Day Streak')).not.toBeInTheDocument();
    });

    it('does not render stats in compact mode', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats compact />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryByText('XP Earned')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // PACING INDICATOR
  // --------------------------------------------------------------------------

  describe('Pacing Indicator', () => {
    it('renders "On Track" label when pacing is on_track', async () => {
      const data = createTimelineData({ pacing: { status: 'on_track', daysAheadOrBehind: 0 } });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing />);
      await waitFor(() => {
        expect(screen.getByText('On Track')).toBeInTheDocument();
      });
    });

    it('renders "Ahead of Schedule" with positive days badge', async () => {
      const data = createTimelineData({ pacing: { status: 'ahead', daysAheadOrBehind: 3 } });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing />);
      await waitFor(() => {
        expect(screen.getByText('Ahead of Schedule')).toBeInTheDocument();
        expect(screen.getByText('+3 days')).toBeInTheDocument();
      });
    });

    it('renders "Behind Schedule" with negative days badge', async () => {
      const data = createTimelineData({ pacing: { status: 'behind', daysAheadOrBehind: -2 } });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing />);
      await waitFor(() => {
        expect(screen.getByText('Behind Schedule')).toBeInTheDocument();
        expect(screen.getByText('-2 days')).toBeInTheDocument();
      });
    });

    it('does not render days badge when daysAheadOrBehind is 0', async () => {
      const data = createTimelineData({ pacing: { status: 'on_track', daysAheadOrBehind: 0 } });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing />);
      await waitFor(() => {
        expect(screen.getByText('On Track')).toBeInTheDocument();
      });
      expect(screen.queryByText(/days$/)).not.toBeInTheDocument();
    });

    it('renders recommendation text when provided', async () => {
      const data = createTimelineData({
        pacing: { status: 'behind', daysAheadOrBehind: -1, recommendation: 'Try to study 30 more minutes daily' },
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing />);
      await waitFor(() => {
        expect(screen.getByText('Try to study 30 more minutes daily')).toBeInTheDocument();
      });
    });

    it('does not render pacing when showPacing is false', async () => {
      const data = createTimelineData({ pacing: { status: 'ahead', daysAheadOrBehind: 5 } });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing={false} />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryByText('Ahead of Schedule')).not.toBeInTheDocument();
    });

    it('does not render pacing in compact mode', async () => {
      const data = createTimelineData({ pacing: { status: 'ahead', daysAheadOrBehind: 5 } });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showPacing compact />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryByText('Ahead of Schedule')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // MILESTONE RENDERING
  // --------------------------------------------------------------------------

  describe('Milestone Rendering', () => {
    it('renders all milestone names', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('TypeScript Basics')).toBeInTheDocument();
        expect(screen.getByText('Advanced Types')).toBeInTheDocument();
        expect(screen.getByText('Generics Deep Dive')).toBeInTheDocument();
        expect(screen.getByText('Final Assessment')).toBeInTheDocument();
      });
    });

    it('renders milestone type badges', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('concept')).toBeInTheDocument();
        expect(screen.getByText('skill')).toBeInTheDocument();
        expect(screen.getByText('chapter')).toBeInTheDocument();
        expect(screen.getByText('assessment')).toBeInTheDocument();
      });
    });

    it('renders status labels for milestones', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        // Upcoming and Locked both exist
        expect(screen.getAllByText('Upcoming').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders Milestones heading', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Milestones')).toBeInTheDocument();
      });
    });

    it('renders a ScrollArea for milestones', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
      });
    });

    it('shows mastery percentage for milestones with mastery > 0', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('90% mastery')).toBeInTheDocument();
        expect(screen.getByText('45% mastery')).toBeInTheDocument();
      });
    });

    it('does not show mastery percentage for milestones with 0 mastery', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({ id: 'ms-only', masteryLevel: 0, status: 'upcoming' }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.milestones[0].name)).toBeInTheDocument();
      });
      expect(screen.queryByText('0% mastery')).not.toBeInTheDocument();
    });

    it('renders Optional badge for optional milestones', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Optional')).toBeInTheDocument();
      });
    });

    it('renders milestone description when not in compact mode', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-desc',
            name: 'Descriptive Milestone',
            description: 'This is a detailed description of the milestone',
            status: 'current',
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact={false} />);
      await waitFor(() => {
        expect(screen.getByText('This is a detailed description of the milestone')).toBeInTheDocument();
      });
    });

    it('hides milestone description in compact mode', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-desc',
            name: 'Descriptive Milestone',
            description: 'This should be hidden in compact mode',
            status: 'current',
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact />);
      await waitFor(() => {
        expect(screen.getByText('Descriptive Milestone')).toBeInTheDocument();
      });
      expect(screen.queryByText('This should be hidden in compact mode')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // MILESTONE DATES
  // --------------------------------------------------------------------------

  describe('Milestone Dates', () => {
    it('renders completed date for completed milestones', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        // date-fns format mock returns 'Jan 15, 2026' for MMM d, yyyy
        expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
      });
    });

    it('renders estimated date for upcoming milestones (future)', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-future',
            name: 'Future Milestone',
            status: 'upcoming',
            completedAt: undefined,
            estimatedDate: '2026-04-01T00:00:00Z',
            masteryLevel: 0,
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        // date-fns format mock returns 'Mar 10' for MMM d
        expect(screen.getByText('Mar 10')).toBeInTheDocument();
      });
    });

    it('renders "Today" for milestones estimated for today', async () => {
      getDateMocks().isToday.mockImplementation(() => true);

      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-today',
            name: 'Today Milestone',
            status: 'current',
            completedAt: undefined,
            estimatedDate: '2026-03-05T00:00:00Z',
            masteryLevel: 20,
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('renders "Overdue" for milestones past estimated date', async () => {
      const dm = getDateMocks();
      dm.isPast.mockImplementation(() => true);
      dm.isToday.mockImplementation(() => false);

      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-overdue',
            name: 'Past Due Task',
            status: 'current',
            completedAt: undefined,
            estimatedDate: '2026-02-20T00:00:00Z',
            masteryLevel: 10,
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(/Overdue \(3 days ago\)/)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // REWARDS
  // --------------------------------------------------------------------------

  describe('Rewards', () => {
    it('renders XP rewards for milestones', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-xp',
            name: 'XP Milestone',
            status: 'completed',
            rewards: { xp: 250 },
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact={false} />);
      await waitFor(() => {
        expect(screen.getByText('+250 XP')).toBeInTheDocument();
      });
    });

    it('renders badge rewards for milestones', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-badge',
            name: 'Badge Milestone',
            status: 'completed',
            rewards: { xp: 50, badges: ['Gold Star', 'Speed Demon'] },
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact={false} />);
      await waitFor(() => {
        expect(screen.getByText('Gold Star')).toBeInTheDocument();
        expect(screen.getByText('Speed Demon')).toBeInTheDocument();
      });
    });

    it('does not render rewards section when xp is 0 and no badges', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-no-reward',
            name: 'No Reward Milestone',
            status: 'upcoming',
            rewards: { xp: 0 },
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact={false} />);
      await waitFor(() => {
        expect(screen.getByText('No Reward Milestone')).toBeInTheDocument();
      });
      expect(screen.queryByText('+0 XP')).not.toBeInTheDocument();
    });

    it('does not render rewards in compact mode', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-compact-reward',
            name: 'Compact Reward Test',
            status: 'completed',
            rewards: { xp: 500, badges: ['Master'] },
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact />);
      await waitFor(() => {
        expect(screen.getByText('Compact Reward Test')).toBeInTheDocument();
      });
      expect(screen.queryByText('+500 XP')).not.toBeInTheDocument();
      expect(screen.queryByText('Master')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // INTERACTIONS
  // --------------------------------------------------------------------------

  describe('Milestone Click Interactions', () => {
    it('calls onMilestoneClick when a milestone is clicked', async () => {
      const onMilestoneClick = jest.fn();
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" onMilestoneClick={onMilestoneClick} />);
      await waitFor(() => {
        expect(screen.getByText('TypeScript Basics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('TypeScript Basics'));
      expect(onMilestoneClick).toHaveBeenCalledWith('ms-1');
    });

    it('calls onMilestoneClick with correct id for each milestone', async () => {
      const onMilestoneClick = jest.fn();
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" onMilestoneClick={onMilestoneClick} />);
      await waitFor(() => {
        expect(screen.getByText('Advanced Types')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Advanced Types'));
      expect(onMilestoneClick).toHaveBeenCalledWith('ms-2');

      fireEvent.click(screen.getByText('Generics Deep Dive'));
      expect(onMilestoneClick).toHaveBeenCalledWith('ms-3');
    });

    it('does not crash when onMilestoneClick is not provided', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('TypeScript Basics')).toBeInTheDocument();
      });
      // Should not throw
      fireEvent.click(screen.getByText('TypeScript Basics'));
    });
  });

  // --------------------------------------------------------------------------
  // COMPACT MODE
  // --------------------------------------------------------------------------

  describe('Compact Mode', () => {
    it('uses smaller ScrollArea height in compact mode', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact />);
      await waitFor(() => {
        const scrollArea = screen.getByTestId('scroll-area');
        expect(scrollArea.className).toContain('h-48');
      });
    });

    it('uses larger ScrollArea height in non-compact mode', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact={false} />);
      await waitFor(() => {
        const scrollArea = screen.getByTestId('scroll-area');
        expect(scrollArea.className).toContain('h-80');
      });
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('handles empty milestones array', async () => {
      const data = createTimelineData({
        milestones: [],
        progress: { completedCount: 0, totalCount: 0, completionPercentage: 0, currentMilestoneIndex: 0, averagePacePerDay: 0, daysRemaining: 0 },
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
        expect(screen.getByText('0/0 milestones')).toBeInTheDocument();
      });
    });

    it('handles single milestone', async () => {
      const data = createTimelineData({
        milestones: [createMilestone({ id: 'single', name: 'Only Milestone', status: 'current' })],
        progress: { completedCount: 0, totalCount: 1, completionPercentage: 0, currentMilestoneIndex: 0, averagePacePerDay: 1, daysRemaining: 5 },
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Only Milestone')).toBeInTheDocument();
        expect(screen.getByText('0/1 milestones')).toBeInTheDocument();
      });
    });

    it('handles milestone with no rewards', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-no-rewards',
            name: 'No Rewards Milestone',
            status: 'upcoming',
            rewards: undefined,
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('No Rewards Milestone')).toBeInTheDocument();
      });
    });

    it('handles milestone with empty badges array', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({
            id: 'ms-empty-badges',
            name: 'Empty Badges Milestone',
            status: 'completed',
            rewards: { xp: 100, badges: [] },
          }),
        ],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" compact={false} />);
      await waitFor(() => {
        expect(screen.getByText('Empty Badges Milestone')).toBeInTheDocument();
        expect(screen.getByText('+100 XP')).toBeInTheDocument();
      });
    });

    it('handles 100% completion', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({ id: 'ms-done', name: 'Done', status: 'completed', masteryLevel: 100 }),
        ],
        progress: { completedCount: 1, totalCount: 1, completionPercentage: 100, currentMilestoneIndex: 0, averagePacePerDay: 1, daysRemaining: 0 },
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('1/1 milestones')).toBeInTheDocument();
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('handles zero XP earned and zero badges', async () => {
      const data = createTimelineData();
      data.stats.totalXpEarned = 0;
      data.stats.badgesEarned = 0;
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" showStats />);
      await waitFor(() => {
        expect(screen.getByText('XP Earned')).toBeInTheDocument();
      });
    });

    it('renders all milestone types correctly', async () => {
      const types: Array<'concept' | 'skill' | 'chapter' | 'checkpoint' | 'assessment'> = [
        'concept', 'skill', 'chapter', 'checkpoint', 'assessment',
      ];
      const milestones = types.map((type, idx) =>
        createMilestone({
          id: `ms-type-${type}`,
          name: `${type} milestone`,
          type,
          status: 'upcoming',
          order: idx + 1,
          masteryLevel: 0,
          completedAt: undefined,
        }),
      );
      const data = createTimelineData({ milestones });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        types.forEach((type) => {
          expect(screen.getByText(`${type} milestone`)).toBeInTheDocument();
        });
      });
    });

    it('handles very long milestone names', async () => {
      const longName = 'A'.repeat(200);
      const data = createTimelineData({
        milestones: [createMilestone({ id: 'ms-long', name: longName, status: 'current' })],
      });
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('handles API returning success false with no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false }),
      });
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });

    it('applies className prop to the card in data-loaded state', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" className="loaded-class" />);
      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('loaded-class');
      });
    });
  });

  // --------------------------------------------------------------------------
  // DEFAULT PROPS
  // --------------------------------------------------------------------------

  describe('Default Prop Values', () => {
    it('defaults showStats to true', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('XP Earned')).toBeInTheDocument();
      });
    });

    it('defaults showPacing to true', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('On Track')).toBeInTheDocument();
      });
    });

    it('defaults compact to false', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        const scrollArea = screen.getByTestId('scroll-area');
        expect(scrollArea.className).toContain('h-80');
      });
    });
  });

  // --------------------------------------------------------------------------
  // MULTIPLE RE-RENDERS AND STATE TRANSITIONS
  // --------------------------------------------------------------------------

  describe('State Transitions', () => {
    it('transitions from loading to data state', async () => {
      const data = createTimelineData();
      mockFetchSuccess(data);
      render(<LearningPathTimeline pathId="path-1" />);
      // Initially should be loading (skeletons)
      // Then data should appear
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
      expect(screen.queryAllByTestId('skeleton').length).toBe(0);
    });

    it('transitions from loading to error state', async () => {
      mockFetchError('Timeout');
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        // Non-OK response triggers the fixed error message
        expect(screen.getByText('Failed to fetch timeline data')).toBeInTheDocument();
      });
    });

    it('transitions from error to data state via retry', async () => {
      mockFetchError('Initial error');
      render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch timeline data')).toBeInTheDocument();
      });

      const data = createTimelineData();
      mockFetchSuccess(data);
      fireEvent.click(screen.getByText('Retry'));
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
    });

    it('handles transition from no-props to props-provided', async () => {
      const { rerender } = render(<LearningPathTimeline />);
      expect(screen.getByText('Learning Path Timeline')).toBeInTheDocument();

      const data = createTimelineData();
      mockFetchSuccess(data);
      rerender(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText(data.pathName)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // TIMELINE VISUAL STRUCTURE
  // --------------------------------------------------------------------------

  describe('Timeline Visual Structure', () => {
    it('renders timeline dot for current milestone with pulse animation', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({ id: 'ms-current', name: 'Current', status: 'current', masteryLevel: 50 }),
        ],
      });
      mockFetchSuccess(data);
      const { container } = render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Current')).toBeInTheDocument();
      });
      const pulsingDot = container.querySelector('.animate-pulse');
      expect(pulsingDot).toBeInTheDocument();
    });

    it('does not render timeline connector after last milestone', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({ id: 'ms-only', name: 'Last One', status: 'completed' }),
        ],
      });
      mockFetchSuccess(data);
      const { container } = render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Last One')).toBeInTheDocument();
      });
      // Single milestone - last item should not have the connector line (w-0.5 flex-1)
      // The pb-0 class is applied to the last item
      const milestoneContent = container.querySelector('.pb-0');
      expect(milestoneContent).toBeInTheDocument();
    });

    it('renders locked milestone with reduced opacity', async () => {
      const data = createTimelineData({
        milestones: [
          createMilestone({ id: 'ms-locked', name: 'Locked Milestone', status: 'locked', masteryLevel: 0 }),
        ],
      });
      mockFetchSuccess(data);
      const { container } = render(<LearningPathTimeline pathId="path-1" />);
      await waitFor(() => {
        expect(screen.getByText('Locked Milestone')).toBeInTheDocument();
      });
      const lockedElement = container.querySelector('.opacity-50');
      expect(lockedElement).toBeInTheDocument();
    });
  });
});

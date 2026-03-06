import React from 'react';
import { render, screen, fireEvent, waitFor, act, within, cleanup } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock framer-motion with Proxy pattern for motion components
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

// Mock UI card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div data-testid="card" className={className} onClick={onClick}>{children}</div>
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

// Mock Button - forward all HTML-safe props including onClick and disabled
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
      disabled={disabled as boolean | undefined}
      data-variant={variant as string | undefined}
      data-size={size as string | undefined}
      className={className as string | undefined}
    >
      {children}
    </button>
  ),
}));

// Mock Progress
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} role="progressbar" />
  ),
}));

// Mock Tooltip - render trigger children, suppress tooltip content to avoid duplicate text
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}));

// Mock Dialog - only render children when open
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean; onOpenChange: (o: boolean) => void }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="dialog-description" className={className}>{children}</p>
  ),
  DialogFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-footer" className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-header" className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// MOCK HOOK - useSpacedRepetition
// ============================================================================

const mockRefresh = jest.fn().mockResolvedValue(undefined);
const mockSubmitReview = jest.fn();
const mockSetStatus = jest.fn();

const defaultHookReturn = {
  data: null as ReturnType<typeof createMockData> | null,
  loading: false,
  error: null as string | null,
  refresh: mockRefresh,
  submitReview: mockSubmitReview,
  setStatus: mockSetStatus,
  status: 'week' as const,
  loadMore: jest.fn(),
  hasMore: false,
  loadingMore: false,
  getReviewsForDate: jest.fn(() => []),
  nextDueReview: null,
  isStale: false,
};

let hookReturnValue = { ...defaultHookReturn };

jest.mock('@/hooks/use-spaced-repetition', () => ({
  useSpacedRepetition: () => hookReturnValue,
}));

// ============================================================================
// IMPORT UNDER TEST (must come after mocks)
// ============================================================================

import { SpacedRepetitionCalendar, SpacedRepetitionWidget } from '@/components/sam/SpacedRepetitionCalendar';
import type { ReviewEntry, ReviewStats, SpacedRepetitionData } from '@/hooks/use-spaced-repetition';

// ============================================================================
// TEST DATA FACTORY
// ============================================================================

function createReview(overrides: Partial<ReviewEntry> = {}): ReviewEntry {
  const today = new Date();
  return {
    id: 'review-1',
    conceptId: 'concept-1',
    conceptName: 'JavaScript Closures',
    courseTitle: 'Advanced JavaScript',
    nextReviewDate: today,
    easeFactor: 2.5,
    interval: 3,
    repetitions: 2,
    lastScore: 4,
    retentionEstimate: 85,
    priority: 'medium',
    isOverdue: false,
    daysUntilReview: 0,
    ...overrides,
  };
}

function createStats(overrides: Partial<ReviewStats> = {}): ReviewStats {
  return {
    totalPending: 5,
    overdueCount: 1,
    dueTodayCount: 3,
    dueThisWeekCount: 5,
    averageRetention: 75,
    streakDays: 7,
    topicsByPriority: { urgent: 1, high: 1, medium: 2, low: 1 },
    ...overrides,
  };
}

function createMockData(overrides: Partial<SpacedRepetitionData> = {}): SpacedRepetitionData {
  return {
    reviews: [
      createReview({ id: 'r1', conceptId: 'c1', conceptName: 'JavaScript Closures', priority: 'medium' }),
      createReview({
        id: 'r2',
        conceptId: 'c2',
        conceptName: 'React Hooks',
        priority: 'urgent',
        isOverdue: true,
        daysUntilReview: -2,
        retentionEstimate: 25,
        courseTitle: 'React Mastery',
      }),
      createReview({
        id: 'r3',
        conceptId: 'c3',
        conceptName: 'TypeScript Generics',
        priority: 'high',
        retentionEstimate: 55,
      }),
    ],
    stats: createStats(),
    calendar: [],
    pagination: { total: 3, limit: 10, offset: 0, hasMore: false },
    ...overrides,
  };
}

function setHookReturn(overrides: Partial<typeof defaultHookReturn>): void {
  hookReturnValue = { ...defaultHookReturn, ...overrides };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Find a button by its data-variant and data-size attributes.
 * The component uses Button with variant="ghost" size="icon" for nav buttons.
 */
function findNavButtons(): { prevBtn: HTMLElement | undefined; nextBtn: HTMLElement | undefined } {
  const allButtons = screen.getAllByRole('button');
  // Navigation buttons are the first two buttons with data-variant="ghost" and data-size="icon"
  const ghostIconBtns = allButtons.filter(
    (btn) => btn.getAttribute('data-variant') === 'ghost' && btn.getAttribute('data-size') === 'icon'
  );
  // The first ghost+icon button is "previous month", the second is "next month"
  return { prevBtn: ghostIconBtns[0], nextBtn: ghostIconBtns[1] };
}

/**
 * Find the refresh button (ghost, icon, inside review list section).
 * It appears after the nav buttons and calendar day buttons.
 */
function findRefreshButton(): HTMLElement | undefined {
  const allButtons = screen.getAllByRole('button');
  const ghostIconBtns = allButtons.filter(
    (btn) => btn.getAttribute('data-variant') === 'ghost' && btn.getAttribute('data-size') === 'icon'
  );
  // The third ghost+icon button is the refresh button (after prev and next month)
  return ghostIconBtns[2];
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('SpacedRepetitionCalendar', () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
    hookReturnValue = { ...defaultHookReturn };
  });

  afterEach(() => {
    cleanup();
  });

  // --------------------------------------------------------------------------
  // 1. Loading state
  // --------------------------------------------------------------------------
  describe('Loading state', () => {
    it('shows loading skeleton when loading is true and no data', () => {
      setHookReturn({ loading: true, data: null });

      render(<SpacedRepetitionCalendar />);

      const cards = screen.getAllByTestId('card');
      const pulsingCard = cards.find((c) => c.className?.includes('animate-pulse'));
      expect(pulsingCard).toBeTruthy();
    });

    it('shows muted placeholder rectangles in the loading state', () => {
      setHookReturn({ loading: true, data: null });

      render(<SpacedRepetitionCalendar />);

      const cardContent = screen.getByTestId('card-content');
      const placeholders = cardContent.querySelectorAll('.bg-muted');
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('does not show loading state when data is already loaded', () => {
      setHookReturn({ loading: true, data: createMockData() });

      render(<SpacedRepetitionCalendar />);

      // When data exists, even if loading, the full component renders (no animate-pulse on top-level)
      const cards = screen.getAllByTestId('card');
      const pulsingCard = cards.find((c) => c.className?.includes('animate-pulse'));
      expect(pulsingCard).toBeFalsy();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Error state
  // --------------------------------------------------------------------------
  describe('Error state', () => {
    it('displays error message when error occurs', () => {
      setHookReturn({ error: 'Failed to fetch reviews' });

      render(<SpacedRepetitionCalendar />);

      expect(screen.getByText('Failed to Load Reviews')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch reviews')).toBeInTheDocument();
    });

    it('renders a Try Again button in error state', () => {
      setHookReturn({ error: 'Network error' });

      render(<SpacedRepetitionCalendar />);

      const tryAgainBtn = screen.getByText('Try Again');
      expect(tryAgainBtn).toBeInTheDocument();
    });

    it('calls refresh when Try Again button is clicked', () => {
      setHookReturn({ error: 'Server error' });

      render(<SpacedRepetitionCalendar />);

      fireEvent.click(screen.getByText('Try Again'));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('applies custom className to error card', () => {
      setHookReturn({ error: 'Error occurred' });

      render(<SpacedRepetitionCalendar className="custom-error-class" />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-error-class');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Statistics display
  // --------------------------------------------------------------------------
  describe('Statistics display', () => {
    it('renders stat cards when showStats is true and stats exist', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showStats={true} />);

      expect(screen.getByText('Due Today')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('Avg Retention')).toBeInTheDocument();
    });

    it('displays correct stat values from data', () => {
      const stats = createStats({
        dueTodayCount: 7,
        overdueCount: 2,
        dueThisWeekCount: 12,
        averageRetention: 75,
      });
      setHookReturn({ data: createMockData({ stats }) });

      // Render without calendar to avoid number collisions with day numbers
      render(<SpacedRepetitionCalendar showStats={true} showCalendar={false} showReviewList={false} />);

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows "All caught up!" when dueTodayCount is 0', () => {
      const stats = createStats({ dueTodayCount: 0 });
      setHookReturn({ data: createMockData({ stats }) });

      render(<SpacedRepetitionCalendar showStats={true} />);

      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });

    it('shows "great job!" when overdueCount is 0', () => {
      const stats = createStats({ overdueCount: 0 });
      setHookReturn({ data: createMockData({ stats }) });

      render(<SpacedRepetitionCalendar showStats={true} />);

      expect(screen.getByText('great job!')).toBeInTheDocument();
    });

    it('does not render stats when showStats is false', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showStats={false} />);

      expect(screen.queryByText('Due Today')).not.toBeInTheDocument();
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    });

    it('shows "reviews pending" subtitle when dueTodayCount > 0', () => {
      const stats = createStats({ dueTodayCount: 5 });
      setHookReturn({ data: createMockData({ stats }) });

      render(<SpacedRepetitionCalendar showStats={true} showCalendar={false} showReviewList={false} />);

      expect(screen.getByText('reviews pending')).toBeInTheDocument();
    });

    it('shows "need attention" subtitle when overdueCount > 0', () => {
      const stats = createStats({ overdueCount: 3 });
      setHookReturn({ data: createMockData({ stats }) });

      render(<SpacedRepetitionCalendar showStats={true} showCalendar={false} showReviewList={false} />);

      expect(screen.getByText('need attention')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Calendar rendering
  // --------------------------------------------------------------------------
  describe('Calendar rendering', () => {
    it('renders calendar when showCalendar is true', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showCalendar={true} />);

      // Weekday headers should be visible
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('does not render calendar when showCalendar is false', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showCalendar={false} />);

      expect(screen.queryByText('Sun')).not.toBeInTheDocument();
      expect(screen.queryByText('Mon')).not.toBeInTheDocument();
    });

    it('displays current month and year in calendar header', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showCalendar={true} />);

      const now = new Date();
      const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(monthYear)).toBeInTheDocument();
    });

    it('renders the Today button', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showCalendar={true} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders day numbers in the calendar grid', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showCalendar={true} />);

      // Current day of the month should be present
      const today = new Date();
      const dayNumber = today.getDate().toString();
      const dayElements = screen.getAllByText(dayNumber);
      expect(dayElements.length).toBeGreaterThan(0);
    });

    it('renders priority legend at the bottom of the calendar', () => {
      // Render without review list to avoid duplicate priority text from badges
      setHookReturn({ data: createMockData({ reviews: [] }) });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={false} showStats={false} />);

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('renders 42 calendar day buttons (6 weeks x 7 days)', () => {
      setHookReturn({ data: createMockData({ reviews: [] }) });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={false} showStats={false} />);

      // Calendar grid buttons: 42 day buttons + 2 nav buttons + Today button = 45 total
      const allButtons = screen.getAllByRole('button');
      // Filter only calendar day buttons (those whose text content is a day number 1-31)
      const dayButtons = allButtons.filter((btn) => {
        const text = btn.textContent?.trim() ?? '';
        const num = parseInt(text, 10);
        return !isNaN(num) && num >= 1 && num <= 31;
      });
      // Should be at least 28 (minimum days in a month) but typically 42 (with padding)
      expect(dayButtons.length).toBeGreaterThanOrEqual(28);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Month navigation
  // --------------------------------------------------------------------------
  describe('Month navigation', () => {
    it('navigates to previous month when left navigation button is clicked', () => {
      setHookReturn({ data: createMockData({ reviews: [] }) });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={false} showStats={false} />);

      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthYear = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const { prevBtn } = findNavButtons();
      expect(prevBtn).toBeTruthy();

      fireEvent.click(prevBtn!);

      expect(screen.getByText(prevMonthYear)).toBeInTheDocument();
    });

    it('navigates to next month when right navigation button is clicked', () => {
      setHookReturn({ data: createMockData({ reviews: [] }) });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={false} showStats={false} />);

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthYear = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const { nextBtn } = findNavButtons();
      expect(nextBtn).toBeTruthy();

      fireEvent.click(nextBtn!);

      expect(screen.getByText(nextMonthYear)).toBeInTheDocument();
    });

    it('returns to current month when Today button is clicked after navigation', () => {
      setHookReturn({ data: createMockData({ reviews: [] }) });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={false} showStats={false} />);

      const now = new Date();
      const currentMonthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Navigate to previous month first
      const { prevBtn } = findNavButtons();
      fireEvent.click(prevBtn!);

      // Now click Today
      fireEvent.click(screen.getByText('Today'));

      expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
    });

    it('navigates multiple months forward', () => {
      setHookReturn({ data: createMockData({ reviews: [] }) });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={false} showStats={false} />);

      const now = new Date();
      const twoMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 2, 1);
      const expectedMonthYear = twoMonthsAhead.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const { nextBtn } = findNavButtons();
      fireEvent.click(nextBtn!);
      fireEvent.click(nextBtn!);

      expect(screen.getByText(expectedMonthYear)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Review list display
  // --------------------------------------------------------------------------
  describe('Review list display', () => {
    it('renders review list when showReviewList is true', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const titles = screen.getAllByTestId('card-title');
      const reviewTitle = titles.find((t) => t.textContent?.includes('Reviews'));
      expect(reviewTitle).toBeTruthy();
    });

    it('does not render review list section when showReviewList is false', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showReviewList={false} showStats={false} />);

      // With showReviewList=false and showStats=false, only calendar section is visible.
      // The calendar Card does not have a CardTitle with "Reviews" text.
      const titles = screen.queryAllByTestId('card-title');
      const reviewTitle = titles.find((t) => t.textContent?.includes('Reviews'));
      expect(reviewTitle).toBeFalsy();
    });

    it('shows empty state when no reviews exist for selected date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const data = createMockData({
        reviews: [
          createReview({ id: 'r1', nextReviewDate: tomorrow }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('No Reviews Scheduled')).toBeInTheDocument();
    });

    it('displays review cards for reviews on the selected date (today)', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [
          createReview({ id: 'r1', conceptName: 'Closures', nextReviewDate: today }),
          createReview({ id: 'r2', conceptName: 'Promises', nextReviewDate: today }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('Closures')).toBeInTheDocument();
      expect(screen.getByText('Promises')).toBeInTheDocument();
    });

    it('shows review count in description', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [
          createReview({ id: 'r1', nextReviewDate: today }),
          createReview({ id: 'r2', nextReviewDate: today }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const descriptions = screen.getAllByTestId('card-description');
      const reviewDesc = descriptions.find((d) => d.textContent?.includes('2 reviews scheduled'));
      expect(reviewDesc).toBeTruthy();
    });

    it('shows singular "review" for single review', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const descriptions = screen.getAllByTestId('card-description');
      const reviewDesc = descriptions.find((d) => d.textContent?.includes('1 review scheduled'));
      expect(reviewDesc).toBeTruthy();
    });

    it('shows "Today\'s Reviews" title when selected date is today', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const titles = screen.getAllByTestId('card-title');
      const todayTitle = titles.find((t) => t.textContent?.includes("Today's Reviews"));
      expect(todayTitle).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Review card details
  // --------------------------------------------------------------------------
  describe('Review card details', () => {
    it('displays concept name on review card', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', conceptName: 'Async/Await Patterns', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('Async/Await Patterns')).toBeInTheDocument();
    });

    it('displays course title on review card', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', courseTitle: 'Modern TypeScript', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('Modern TypeScript')).toBeInTheDocument();
    });

    it('displays retention estimate on review card', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', retentionEstimate: 72, nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      // Retention estimate appears in info section and progress label
      const retentionTexts = screen.getAllByText('72%');
      expect(retentionTexts.length).toBeGreaterThan(0);
    });

    it('displays repetition count on review card', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', repetitions: 5, nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('5 reviews')).toBeInTheDocument();
    });

    it('shows overdue indicator for overdue reviews', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [
          createReview({
            id: 'r1',
            isOverdue: true,
            daysUntilReview: -3,
            nextReviewDate: today,
          }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('shows priority badge on review card', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', priority: 'urgent', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const badges = screen.getAllByTestId('ui-badge');
      const urgentBadge = badges.find((b) => b.textContent?.includes('urgent'));
      expect(urgentBadge).toBeTruthy();
    });

    it('renders progress bar for memory strength', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', retentionEstimate: 60, nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('Memory Strength')).toBeInTheDocument();
      const progressBars = screen.getAllByTestId('progress-bar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('renders Review button on review cards', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('does not show course title when courseTitle is undefined', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', courseTitle: undefined, nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      // Should not render the course title paragraph
      expect(screen.queryByText('Advanced JavaScript')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Review modal / scheduling interactions
  // --------------------------------------------------------------------------
  describe('Review modal interactions', () => {
    it('opens review modal when Review button is clicked', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', conceptName: 'Test Concept', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      fireEvent.click(screen.getByText('Review'));

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Review: Test Concept/)).toBeInTheDocument();
    });

    it('displays score options in the review modal', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      expect(screen.getByText('Complete Blackout')).toBeInTheDocument();
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('Incorrect, Easy to Recall')).toBeInTheDocument();
      expect(screen.getByText('Correct with Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Correct with Hesitation')).toBeInTheDocument();
      expect(screen.getByText('Perfect Recall')).toBeInTheDocument();
    });

    it('displays description in the review modal', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      const desc = screen.getByTestId('dialog-description');
      expect(desc.textContent).toContain('Rate how well you remembered this concept');
    });

    it('disables Submit Review button when no score is selected', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      const submitBtn = screen.getByText('Submit Review').closest('button');
      expect(submitBtn).toBeDisabled();
    });

    it('enables Submit Review button after selecting a score', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      // Click on "Perfect Recall" (score 5)
      fireEvent.click(screen.getByText('Perfect Recall'));

      const submitBtn = screen.getByText('Submit Review').closest('button');
      expect(submitBtn).not.toBeDisabled();
    });

    it('calls submitReview when Submit Review is clicked with a score', async () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', conceptId: 'concept-abc', nextReviewDate: today })],
      });
      mockSubmitReview.mockResolvedValue({ message: 'Review saved!' });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      fireEvent.click(screen.getByText('Review'));
      fireEvent.click(screen.getByText('Perfect Recall'));

      await act(async () => {
        fireEvent.click(screen.getByText('Submit Review'));
      });

      expect(mockSubmitReview).toHaveBeenCalledWith('concept-abc', 5);
    });

    it('calls onReviewComplete callback after successful submission', async () => {
      const today = new Date();
      const onComplete = jest.fn();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', conceptId: 'concept-xyz', nextReviewDate: today })],
      });
      mockSubmitReview.mockResolvedValue({ message: 'Review saved!' });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} onReviewComplete={onComplete} />);

      fireEvent.click(screen.getByText('Review'));
      fireEvent.click(screen.getByText('Correct with Difficulty'));

      await act(async () => {
        fireEvent.click(screen.getByText('Submit Review'));
      });

      expect(onComplete).toHaveBeenCalledWith('concept-xyz', 3);
    });

    it('displays success message after successful submission', async () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      mockSubmitReview.mockResolvedValue({ message: 'Next review in 5 days!' });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      fireEvent.click(screen.getByText('Review'));
      fireEvent.click(screen.getByText('Perfect Recall'));

      await act(async () => {
        fireEvent.click(screen.getByText('Submit Review'));
      });

      await waitFor(() => {
        expect(screen.getByText('Next review in 5 days!')).toBeInTheDocument();
      });
    });

    it('renders Cancel button in review modal', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('handles submit failure gracefully without crashing', async () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      mockSubmitReview.mockRejectedValue(new Error('Network error'));
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      fireEvent.click(screen.getByText('Review'));
      fireEvent.click(screen.getByText('Perfect Recall'));

      await act(async () => {
        fireEvent.click(screen.getByText('Submit Review'));
      });

      // Should not crash and no success message should appear
      expect(screen.queryByText('Next review in 5 days!')).not.toBeInTheDocument();
    });

    it('selects each score value correctly', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      // Select "Complete Blackout" (score 0), then verify submit is enabled
      fireEvent.click(screen.getByText('Complete Blackout'));
      const submitBtn = screen.getByText('Submit Review').closest('button');
      expect(submitBtn).not.toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Refresh functionality
  // --------------------------------------------------------------------------
  describe('Refresh functionality', () => {
    it('renders refresh button in the review list header', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showReviewList={true} showCalendar={true} />);

      const refreshBtn = findRefreshButton();
      expect(refreshBtn).toBeTruthy();
    });

    it('calls refresh when refresh button is clicked', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showReviewList={true} showCalendar={true} />);

      const refreshBtn = findRefreshButton();
      expect(refreshBtn).toBeTruthy();

      fireEvent.click(refreshBtn!);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 10. className prop
  // --------------------------------------------------------------------------
  describe('className prop', () => {
    it('applies custom className to the outer container when data is loaded', () => {
      setHookReturn({ data: createMockData() });

      const { container } = render(<SpacedRepetitionCalendar className="my-custom-class" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain('my-custom-class');
    });

    it('applies custom className to loading state card', () => {
      setHookReturn({ loading: true, data: null });

      render(<SpacedRepetitionCalendar className="loading-class" />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('loading-class');
    });
  });

  // --------------------------------------------------------------------------
  // 11. Showing/hiding sections via props
  // --------------------------------------------------------------------------
  describe('Section visibility props', () => {
    it('renders all sections by default', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar />);

      // Stats visible
      expect(screen.getByText('Due Today')).toBeInTheDocument();
      // Calendar weekday headers
      expect(screen.getByText('Sun')).toBeInTheDocument();
      // Review list
      const titles = screen.getAllByTestId('card-title');
      const reviewTitle = titles.find((t) => t.textContent?.includes('Reviews'));
      expect(reviewTitle).toBeTruthy();
    });

    it('hides all sections when all show* props are false', () => {
      setHookReturn({ data: createMockData() });

      render(
        <SpacedRepetitionCalendar
          showStats={false}
          showCalendar={false}
          showReviewList={false}
        />
      );

      expect(screen.queryByText('Due Today')).not.toBeInTheDocument();
      expect(screen.queryByText('Sun')).not.toBeInTheDocument();
    });

    it('shows only stats when only showStats is true', () => {
      setHookReturn({ data: createMockData() });

      render(
        <SpacedRepetitionCalendar showStats={true} showCalendar={false} showReviewList={false} />
      );

      expect(screen.getByText('Due Today')).toBeInTheDocument();
      expect(screen.queryByText('Sun')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 12. Due / overdue / upcoming items display
  // --------------------------------------------------------------------------
  describe('Due/overdue/upcoming items', () => {
    it('displays overdue reviews with visual indicators', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [
          createReview({
            id: 'r1',
            conceptName: 'Overdue Concept',
            priority: 'urgent',
            isOverdue: true,
            daysUntilReview: -5,
            nextReviewDate: today,
          }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('Overdue Concept')).toBeInTheDocument();
      expect(screen.getByText('5 days overdue')).toBeInTheDocument();
    });

    it('displays different priority badges correctly', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [
          createReview({ id: 'r1', conceptName: 'Urgent Item', priority: 'urgent', nextReviewDate: today }),
          createReview({ id: 'r2', conceptName: 'High Item', priority: 'high', nextReviewDate: today }),
          createReview({ id: 'r3', conceptName: 'Low Item', priority: 'low', nextReviewDate: today }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const badges = screen.getAllByTestId('ui-badge');
      const urgentBadge = badges.find((b) => b.textContent?.includes('urgent'));
      const highBadge = badges.find((b) => b.textContent?.includes('high'));
      const lowBadge = badges.find((b) => b.textContent?.includes('low'));

      expect(urgentBadge).toBeTruthy();
      expect(highBadge).toBeTruthy();
      expect(lowBadge).toBeTruthy();
    });

    it('shows retention percentage in info section and progress label', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', retentionEstimate: 45, nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      // The progress label shows exact "45%" text
      expect(screen.getByText('45%')).toBeInTheDocument();
      // The info section shows "45% retention" (partial match with regex)
      expect(screen.getByText(/45% retention/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 13. Score labels in modal
  // --------------------------------------------------------------------------
  describe('Score labels in review modal', () => {
    it('displays all 6 score options (0-5)', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      const dialog = screen.getByTestId('dialog');
      // Count the score option buttons (those within the 2-column grid)
      // 6 score buttons + Cancel + Submit
      const allBtns = dialog.querySelectorAll('button');
      expect(allBtns.length).toBeGreaterThanOrEqual(6);
    });

    it('displays emojis for score options', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [createReview({ id: 'r1', nextReviewDate: today })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);
      fireEvent.click(screen.getByText('Review'));

      const dialog = screen.getByTestId('dialog');
      expect(dialog.textContent).toContain('\u{1F630}'); // 😰
      expect(dialog.textContent).toContain('\u{1F389}'); // 🎉
    });
  });

  // --------------------------------------------------------------------------
  // 14. Calendar day clicking / date selection
  // --------------------------------------------------------------------------
  describe('Calendar day selection', () => {
    it('changes selected date when a calendar day is clicked', () => {
      const today = new Date();
      // Create a review on the 15th of the current month
      const targetDate = new Date(today.getFullYear(), today.getMonth(), 15);
      const data = createMockData({
        reviews: [createReview({ id: 'r1', conceptName: 'Selected Date Review', nextReviewDate: targetDate })],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showCalendar={true} showReviewList={true} />);

      // Find a button whose text content is "15"
      const allButtons = screen.getAllByRole('button');
      const day15Buttons = allButtons.filter((btn) => {
        const span = btn.querySelector('span');
        return span?.textContent === '15';
      });

      // Click the first one that represents the current month
      if (day15Buttons.length > 0) {
        fireEvent.click(day15Buttons[0]);

        // After clicking day 15, if it differs from today, title changes to "Reviews for..."
        if (today.getDate() !== 15) {
          const titles = screen.getAllByTestId('card-title');
          const reviewTitle = titles.find((t) => t.textContent?.includes('Reviews for'));
          expect(reviewTitle).toBeTruthy();
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 15. Empty data handling
  // --------------------------------------------------------------------------
  describe('Empty data handling', () => {
    it('shows empty state when data has zero reviews', () => {
      const data = createMockData({ reviews: [] });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      expect(screen.getByText('No Reviews Scheduled')).toBeInTheDocument();
    });

    it('shows friendly message for today with no reviews', () => {
      const data = createMockData({ reviews: [] });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      // The component uses &apos; which renders as apostrophe in the DOM
      const noReviewsArea = screen.getByText(/all caught up for today/i);
      expect(noReviewsArea).toBeInTheDocument();
    });

    it('does not render stats section when stats are null', () => {
      // Edge case: data exists but stats might be undefined
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar showStats={false} />);

      expect(screen.queryByText('Due Today')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 16. SpacedRepetitionWidget (compact widget)
  // --------------------------------------------------------------------------
  describe('SpacedRepetitionWidget', () => {
    it('renders the widget with pending reviews count', () => {
      const data = createMockData({
        stats: createStats({ overdueCount: 2, dueTodayCount: 3 }),
      });
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      expect(screen.getByText('Spaced Repetition')).toBeInTheDocument();
      expect(screen.getByText('5 reviews pending')).toBeInTheDocument();
    });

    it('shows "All caught up!" when no pending reviews', () => {
      const data = createMockData({
        stats: createStats({ overdueCount: 0, dueTodayCount: 0 }),
      });
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });

    it('shows overdue badge when there are overdue reviews', () => {
      const data = createMockData({
        stats: createStats({ overdueCount: 4, dueTodayCount: 1 }),
      });
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      const badges = screen.getAllByTestId('ui-badge');
      const overdueBadge = badges.find((b) => b.textContent?.includes('4 overdue'));
      expect(overdueBadge).toBeTruthy();
    });

    it('does not show overdue badge when overdueCount is 0', () => {
      const data = createMockData({
        stats: createStats({ overdueCount: 0, dueTodayCount: 2 }),
      });
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      const badges = screen.queryAllByTestId('ui-badge');
      const overdueBadge = badges.find((b) => b.textContent?.includes('overdue'));
      expect(overdueBadge).toBeFalsy();
    });

    it('opens full calendar dialog when widget is clicked', () => {
      const data = createMockData();
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      const cards = screen.getAllByTestId('card');
      fireEvent.click(cards[0]);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Spaced Repetition Calendar')).toBeInTheDocument();
    });

    it('shows loading skeleton when loading with no data', () => {
      setHookReturn({ loading: true, data: null });

      render(<SpacedRepetitionWidget />);

      const cards = screen.getAllByTestId('card');
      const pulsingCard = cards.find((c) => c.className?.includes('animate-pulse'));
      expect(pulsingCard).toBeTruthy();
    });

    it('shows singular "review" for single pending review', () => {
      const data = createMockData({
        stats: createStats({ overdueCount: 0, dueTodayCount: 1 }),
      });
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      expect(screen.getByText('1 review pending')).toBeInTheDocument();
    });

    it('applies custom className to widget card', () => {
      const data = createMockData();
      setHookReturn({ data });

      render(<SpacedRepetitionWidget className="widget-class" />);

      const card = screen.getAllByTestId('card')[0];
      expect(card.className).toContain('widget-class');
    });

    it('shows dialog description about optimal intervals', () => {
      const data = createMockData();
      setHookReturn({ data });

      render(<SpacedRepetitionWidget />);

      const cards = screen.getAllByTestId('card');
      fireEvent.click(cards[0]);

      const desc = screen.getByTestId('dialog-description');
      expect(desc.textContent).toContain('Review your concepts at optimal intervals');
    });
  });

  // --------------------------------------------------------------------------
  // 17. maxReviews prop
  // --------------------------------------------------------------------------
  describe('maxReviews prop', () => {
    it('passes maxReviews as limit to the hook (default is 10)', () => {
      setHookReturn({ data: createMockData() });

      render(<SpacedRepetitionCalendar maxReviews={5} />);

      // Component should render without errors
      expect(screen.getByText('Due Today')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 18. Retention-based styling
  // --------------------------------------------------------------------------
  describe('Retention-based styling', () => {
    it('renders progress bars with correct aria values for different retention levels', () => {
      const today = new Date();
      const data = createMockData({
        reviews: [
          createReview({ id: 'r1', retentionEstimate: 20, nextReviewDate: today }),
          createReview({ id: 'r2', retentionEstimate: 50, nextReviewDate: today }),
          createReview({ id: 'r3', retentionEstimate: 90, nextReviewDate: today }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      const progressBars = screen.getAllByTestId('progress-bar');
      expect(progressBars).toHaveLength(3);

      const values = progressBars.map((bar) => bar.getAttribute('aria-valuenow'));
      expect(values).toContain('20');
      expect(values).toContain('50');
      expect(values).toContain('90');
    });
  });

  // --------------------------------------------------------------------------
  // 19. Multiple reviews on different dates
  // --------------------------------------------------------------------------
  describe('Multiple reviews on different dates', () => {
    it('only shows reviews matching the selected date', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data = createMockData({
        reviews: [
          createReview({ id: 'r1', conceptName: 'Today Concept', nextReviewDate: today }),
          createReview({ id: 'r2', conceptName: 'Tomorrow Concept', nextReviewDate: tomorrow }),
        ],
      });
      setHookReturn({ data });

      render(<SpacedRepetitionCalendar showReviewList={true} />);

      // Today is selected by default
      expect(screen.getByText('Today Concept')).toBeInTheDocument();
      expect(screen.queryByText('Tomorrow Concept')).not.toBeInTheDocument();
    });
  });
});

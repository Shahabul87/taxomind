import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCK: framer-motion (Proxy pattern for motion.* elements)
// ============================================================================

jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      (
        { children, ...props }: React.PropsWithChildren<Record<string, unknown>>,
        ref: React.Ref<HTMLElement>
      ) => {
        const {
          initial, animate, exit, transition, variants,
          whileHover, whileTap, whileInView, viewport,
          drag, dragConstraints, dragElastic,
          onAnimationStart, onAnimationComplete, layout, layoutId,
          ...htmlProps
        } = props;
        return ReactFM.createElement(tag, { ...htmlProps, ref }, children);
      }
    );
    Comp.displayName = `motion.${tag}`;
    return Comp;
  };
  return {
    motion: new Proxy(
      {},
      { get: (_t: Record<string, unknown>, prop: string) => makeMotion(prop) }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// ============================================================================
// MOCK: UI components
// ============================================================================

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
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
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
    onClick,
    disabled,
    variant,
    size,
    className,
  }: {
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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <div data-testid="select" data-value={value}>
      {children}
      {/* Render a hidden select for testing filter changes */}
      <select
        data-testid="select-native"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="all">All Types</option>
        <option value="daily_reminder">Daily Reminder</option>
        <option value="progress_check">Progress Check</option>
        <option value="struggle_detection">Support Alert</option>
        <option value="milestone_celebration">Milestone</option>
        <option value="inactivity_reengagement">Re-engagement</option>
        <option value="streak_risk">Streak Risk</option>
        <option value="weekly_summary">Weekly Summary</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="select-trigger" className={className}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================================
// MOCK: CheckInModal (for the CheckInType type - we only need to mock the module)
// ============================================================================

jest.mock('@/components/sam/CheckInModal', () => ({
  __esModule: true,
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import { CheckInHistory } from '@/components/sam/CheckInHistory';
import type {
  CheckInHistoryItem,
  CheckInHistoryProps,
} from '@/components/sam/CheckInHistory';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createHistoryItem(
  overrides: Partial<CheckInHistoryItem> = {}
): CheckInHistoryItem {
  return {
    id: 'item-1',
    type: 'daily_reminder',
    message: 'How is your study session going?',
    status: 'responded',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    respondedAt: new Date(Date.now() - 3500000).toISOString(),
    response: {
      answers: [{ questionId: 'q1', value: 'Good' }],
      selectedActions: ['continue_studying'],
      emotionalState: 'focused',
    },
    ...overrides,
  };
}

function createHistoryItems(count: number): CheckInHistoryItem[] {
  const types: CheckInHistoryItem['type'][] = [
    'daily_reminder',
    'progress_check',
    'struggle_detection',
    'milestone_celebration',
    'inactivity_reengagement',
    'streak_risk',
    'weekly_summary',
  ];
  const statuses: CheckInHistoryItem['status'][] = [
    'responded',
    'dismissed',
    'expired',
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const status = statuses[i % statuses.length];
    return createHistoryItem({
      id: `item-${i + 1}`,
      type,
      status,
      message: `Check-in message ${i + 1}`,
      createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      response:
        status === 'responded'
          ? {
              answers: [{ questionId: `q${i}`, value: `answer-${i}` }],
              selectedActions: [`action-${i}`],
              emotionalState: i % 2 === 0 ? 'focused' : 'stressed',
            }
          : undefined,
    });
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function mockFetchSuccess(
  history: CheckInHistoryItem[],
  additionalData: Record<string, unknown> = {}
): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        success: true,
        data: { history, ...additionalData },
      }),
  });
}

function mockFetchEmpty(): void {
  mockFetchSuccess([]);
}

function mockFetchError(
  status: number = 500,
  errorMessage: string = 'Internal Server Error'
): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    statusText: errorMessage,
    json: () => Promise.resolve({ error: errorMessage }),
  });
}

function mockFetchNetworkError(): void {
  (global.fetch as jest.Mock).mockRejectedValueOnce(
    new Error('Network request failed')
  );
}

async function renderAndWaitForLoad(
  props: Partial<CheckInHistoryProps> = {},
  items: CheckInHistoryItem[] = []
): Promise<ReturnType<typeof render>> {
  mockFetchSuccess(items);
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<CheckInHistory {...props} />);
  });
  return result!;
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('CheckInHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // --------------------------------------------------------------------------
  // 1. LOADING STATE
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton loaders while fetching data', () => {
      // Use a fetch mock that never resolves so the component stays in loading
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

      render(<CheckInHistory />);

      const skeletons = screen.getAllByTestId('skeleton');
      // The component renders 3 HistoryItemSkeleton, each with multiple Skeleton elements
      // Each HistoryItemSkeleton has 5 Skeleton elements (h-8 w-8, h-4 w-24, h-3 w-16, h-5 w-16, h-4 w-full)
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('shows a spinning loader icon on the refresh button while loading', () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

      render(<CheckInHistory />);

      // The refresh button should be disabled while loading
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-size') === 'icon'
      );
      expect(refreshButton).toBeDefined();
      expect(refreshButton).toBeDisabled();
    });

    it('does not show skeleton loaders after data is loaded', async () => {
      await renderAndWaitForLoad({}, createHistoryItems(3));

      // After loading, skeletons should not be present
      const skeletons = screen.queryAllByTestId('skeleton');
      expect(skeletons.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. HISTORY ITEMS DISPLAY
  // --------------------------------------------------------------------------

  describe('history items display', () => {
    it('renders check-in history items after successful fetch', async () => {
      const items = createHistoryItems(3);
      await renderAndWaitForLoad({}, items);

      for (const item of items) {
        expect(screen.getByText(item.message)).toBeInTheDocument();
      }
    });

    it('displays the correct type labels for each check-in type', async () => {
      const types: Array<{
        type: CheckInHistoryItem['type'];
        label: string;
      }> = [
        { type: 'daily_reminder', label: 'Daily Reminder' },
        { type: 'progress_check', label: 'Progress Check' },
        { type: 'struggle_detection', label: 'Support Alert' },
        { type: 'milestone_celebration', label: 'Milestone' },
        { type: 'inactivity_reengagement', label: 'Re-engagement' },
        { type: 'streak_risk', label: 'Streak Risk' },
        { type: 'weekly_summary', label: 'Weekly Summary' },
      ];

      const items = types.map((t, i) =>
        createHistoryItem({
          id: `type-${i}`,
          type: t.type,
          message: `Message for ${t.type}`,
        })
      );

      await renderAndWaitForLoad({}, items);

      // Labels may appear multiple times (in history items AND in the filter Select),
      // so we use getAllByText to confirm at least one instance exists.
      for (const t of types) {
        const elements = screen.getAllByText(t.label);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('displays the correct status labels', async () => {
      const items = [
        createHistoryItem({ id: 'r1', status: 'responded' }),
        createHistoryItem({
          id: 'd1',
          status: 'dismissed',
          message: 'Dismissed check-in',
          response: undefined,
        }),
        createHistoryItem({
          id: 'e1',
          status: 'expired',
          message: 'Expired check-in',
          response: undefined,
        }),
      ];

      await renderAndWaitForLoad({}, items);

      expect(screen.getByText('Responded')).toBeInTheDocument();
      expect(screen.getByText('Dismissed')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('renders the header with title and description', async () => {
      const items = createHistoryItems(5);
      await renderAndWaitForLoad({}, items);

      expect(screen.getByText('Check-In History')).toBeInTheDocument();
      // Stats description: "5 check-ins * XX% response rate"
      const description = screen.getByTestId('card-description');
      expect(description.textContent).toContain('5 check-ins');
      expect(description.textContent).toContain('response rate');
    });

    it('computes response rate correctly in stats', async () => {
      // 2 responded, 1 dismissed = 67% rate
      const items = [
        createHistoryItem({ id: 'r1', status: 'responded' }),
        createHistoryItem({
          id: 'r2',
          status: 'responded',
          message: 'Second responded',
        }),
        createHistoryItem({
          id: 'd1',
          status: 'dismissed',
          message: 'Dismissed one',
          response: undefined,
        }),
      ];

      await renderAndWaitForLoad({}, items);

      const description = screen.getByTestId('card-description');
      expect(description.textContent).toContain('67%');
    });

    it('renders items in a ScrollArea', async () => {
      await renderAndWaitForLoad({}, createHistoryItems(5));

      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. EMPTY STATE
  // --------------------------------------------------------------------------

  describe('empty state', () => {
    it('displays empty state message when no items are returned', async () => {
      await renderAndWaitForLoad({}, []);

      expect(
        screen.getByText('No check-in history yet')
      ).toBeInTheDocument();
    });

    it('shows 0 check-ins and 0% response rate in stats when empty', async () => {
      await renderAndWaitForLoad({}, []);

      const description = screen.getByTestId('card-description');
      expect(description.textContent).toContain('0 check-ins');
      expect(description.textContent).toContain('0%');
    });

    it('shows empty state when API returns success but no history array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {},
          }),
      });

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(
        screen.getByText('No check-in history yet')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. ERROR HANDLING
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('displays error message when API returns non-ok response', async () => {
      mockFetchError(500, 'Server error occurred');

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    });

    it('displays "Try Again" button on error', async () => {
      mockFetchError(500, 'Something went wrong');

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('retries fetch when "Try Again" button is clicked', async () => {
      mockFetchError(500, 'First attempt failed');

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(screen.getByText('First attempt failed')).toBeInTheDocument();

      // Now mock a successful retry
      mockFetchSuccess([
        createHistoryItem({ id: 'retry-1', message: 'Retry success item' }),
      ]);

      const tryAgainButton = screen.getByText('Try Again');
      await act(async () => {
        fireEvent.click(tryAgainButton);
      });

      expect(
        screen.getByText('Retry success item')
      ).toBeInTheDocument();
    });

    it('displays auth error message for 401 status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      });

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(
        screen.getByText('Please sign in to view check-in history')
      ).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      mockFetchNetworkError();

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(
        screen.getByText('Network request failed')
      ).toBeInTheDocument();
    });

    it('handles JSON parse failure in error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await act(async () => {
        render(<CheckInHistory />);
      });

      expect(
        screen.getByText('Failed to fetch check-in history')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 5. DATE FORMATTING / RELATIVE TIME
  // --------------------------------------------------------------------------

  describe('date formatting', () => {
    it('shows "Just now" for items created less than a minute ago', async () => {
      const recentItem = createHistoryItem({
        id: 'recent',
        createdAt: new Date(Date.now() - 10000).toISOString(), // 10 seconds ago
      });
      await renderAndWaitForLoad({}, [recentItem]);

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('shows minutes ago for items created within the last hour', async () => {
      const minutesAgoItem = createHistoryItem({
        id: 'mins-ago',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
      });
      await renderAndWaitForLoad({}, [minutesAgoItem]);

      expect(screen.getByText('25m ago')).toBeInTheDocument();
    });

    it('shows hours ago for items created within the last day', async () => {
      const hoursAgoItem = createHistoryItem({
        id: 'hours-ago',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
      });
      await renderAndWaitForLoad({}, [hoursAgoItem]);

      expect(screen.getByText('5h ago')).toBeInTheDocument();
    });

    it('shows days ago for items created within the last week', async () => {
      const daysAgoItem = createHistoryItem({
        id: 'days-ago',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
      });
      await renderAndWaitForLoad({}, [daysAgoItem]);

      expect(screen.getByText('3d ago')).toBeInTheDocument();
    });

    it('shows formatted date for items older than a week', async () => {
      const oldDate = new Date(Date.now() - 14 * 86400000); // 14 days ago
      const oldItem = createHistoryItem({
        id: 'old',
        createdAt: oldDate.toISOString(),
      });
      await renderAndWaitForLoad({}, [oldItem]);

      // The component calls toLocaleDateString() which returns locale-dependent string
      const expectedDateText = oldDate.toLocaleDateString();
      expect(screen.getByText(expectedDateText)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. MOOD / EMOTIONAL STATE INDICATORS
  // --------------------------------------------------------------------------

  describe('mood indicators', () => {
    it('shows emotional state badge when item is expanded and has emotionalState', async () => {
      const itemWithMood = createHistoryItem({
        id: 'mood-1',
        response: {
          answers: [{ questionId: 'q1', value: 'OK' }],
          selectedActions: [],
          emotionalState: 'motivated',
        },
      });
      await renderAndWaitForLoad({}, [itemWithMood]);

      // Expand the item by clicking the toggle button
      const toggleButton = screen.getByRole('button', { name: /daily reminder/i }) ||
        screen.getAllByRole('button').find((btn) =>
          btn.textContent?.includes('Daily Reminder')
        );

      if (toggleButton) {
        await act(async () => {
          fireEvent.click(toggleButton);
        });
      }

      // After expansion, mood badge should appear
      expect(screen.getByText('motivated')).toBeInTheDocument();
      expect(screen.getByText('Mood:')).toBeInTheDocument();
    });

    it('does not show mood indicator when emotionalState is absent', async () => {
      const itemNoMood = createHistoryItem({
        id: 'no-mood',
        response: {
          answers: [{ questionId: 'q1', value: 'Yes' }],
          selectedActions: ['review'],
          emotionalState: undefined,
        },
      });
      await renderAndWaitForLoad({}, [itemNoMood]);

      // Expand the item
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      if (toggleButton) {
        await act(async () => {
          fireEvent.click(toggleButton);
        });
      }

      expect(screen.queryByText('Mood:')).not.toBeInTheDocument();
    });

    it('shows answer count in expanded item', async () => {
      const itemWithAnswers = createHistoryItem({
        id: 'answers-1',
        response: {
          answers: [
            { questionId: 'q1', value: 'Yes' },
            { questionId: 'q2', value: 3 },
            { questionId: 'q3', value: 'Detailed response' },
          ],
          selectedActions: [],
        },
      });
      await renderAndWaitForLoad({}, [itemWithAnswers]);

      // Expand the item
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      if (toggleButton) {
        await act(async () => {
          fireEvent.click(toggleButton);
        });
      }

      expect(screen.getByText('3 question(s) answered')).toBeInTheDocument();
    });

    it('shows selected actions as badges in expanded item', async () => {
      const itemWithActions = createHistoryItem({
        id: 'actions-1',
        response: {
          answers: [],
          selectedActions: ['take_break', 'review_notes', 'ask_tutor'],
        },
      });
      await renderAndWaitForLoad({}, [itemWithActions]);

      // Expand the item
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      if (toggleButton) {
        await act(async () => {
          fireEvent.click(toggleButton);
        });
      }

      expect(screen.getByText('take_break')).toBeInTheDocument();
      expect(screen.getByText('review_notes')).toBeInTheDocument();
      expect(screen.getByText('ask_tutor')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 7. EXPAND / COLLAPSE (ITEM TOGGLING)
  // --------------------------------------------------------------------------

  describe('item expand and collapse', () => {
    it('expands an item when its toggle button is clicked', async () => {
      const items = [
        createHistoryItem({
          id: 'exp-1',
          message: 'First check-in message expanded',
          response: {
            answers: [{ questionId: 'q1', value: 'Good' }],
            selectedActions: ['study_more'],
            emotionalState: 'happy',
          },
        }),
      ];
      await renderAndWaitForLoad({}, items);

      // Before expansion, the expanded detail section should not show "View Details" or Mood
      // Note: the message appears in the non-compact summary too, so we check for "Mood:"
      expect(screen.queryByText('Mood:')).not.toBeInTheDocument();

      // Click to expand
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      expect(toggleButton).toBeDefined();
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      // After expansion, mood should be visible
      expect(screen.getByText('Mood:')).toBeInTheDocument();
      expect(screen.getByText('happy')).toBeInTheDocument();
    });

    it('collapses an expanded item when toggle is clicked again', async () => {
      const items = [
        createHistoryItem({
          id: 'collapse-1',
          response: {
            answers: [],
            selectedActions: [],
            emotionalState: 'calm',
          },
        }),
      ];
      await renderAndWaitForLoad({}, items);

      // Expand
      const toggleButton1 = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton1!);
      });
      expect(screen.getByText('Mood:')).toBeInTheDocument();

      // Re-query the toggle button after re-render, then collapse
      const toggleButton2 = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton2!);
      });
      expect(screen.queryByText('Mood:')).not.toBeInTheDocument();
    });

    it('only expands one item at a time', async () => {
      const items = [
        createHistoryItem({
          id: 'multi-1',
          type: 'daily_reminder',
          message: 'First item',
          response: {
            answers: [],
            selectedActions: [],
            emotionalState: 'focused',
          },
        }),
        createHistoryItem({
          id: 'multi-2',
          type: 'progress_check',
          message: 'Second item',
          response: {
            answers: [],
            selectedActions: [],
            emotionalState: 'confident',
          },
        }),
      ];
      await renderAndWaitForLoad({}, items);

      // Expand first item
      const firstToggle = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(firstToggle!);
      });
      expect(screen.getByText('focused')).toBeInTheDocument();
      expect(screen.queryByText('confident')).not.toBeInTheDocument();

      // Expand second item (re-query buttons after re-render; first should collapse)
      const secondToggle = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Progress Check')
      );
      await act(async () => {
        fireEvent.click(secondToggle!);
      });
      expect(screen.queryByText('focused')).not.toBeInTheDocument();
      expect(screen.getByText('confident')).toBeInTheDocument();
    });

    it('shows "View Details" button in expanded item when onItemClick is provided', async () => {
      const onItemClick = jest.fn();
      const items = [createHistoryItem({ id: 'detail-1' })];
      await renderAndWaitForLoad({ onItemClick }, items);

      // Expand the item
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('does not show "View Details" button when onItemClick is not provided', async () => {
      const items = [createHistoryItem({ id: 'no-detail-1' })];
      await renderAndWaitForLoad({}, items);

      // Expand the item
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    });

    it('calls onItemClick when "View Details" button is clicked', async () => {
      const onItemClick = jest.fn();
      const item = createHistoryItem({ id: 'click-1' });
      await renderAndWaitForLoad({ onItemClick }, [item]);

      // Expand the item
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      // Click "View Details"
      const viewDetailsButton = screen.getByText('View Details');
      await act(async () => {
        fireEvent.click(viewDetailsButton);
      });

      expect(onItemClick).toHaveBeenCalledWith(item);
    });
  });

  // --------------------------------------------------------------------------
  // 8. FILTERING
  // --------------------------------------------------------------------------

  describe('filtering', () => {
    it('shows filter controls when showFilters is true (default)', async () => {
      await renderAndWaitForLoad({}, createHistoryItems(3));

      expect(screen.getByTestId('select')).toBeInTheDocument();
      expect(screen.getByText('Filter by type')).toBeInTheDocument();
    });

    it('hides filter controls when showFilters is false', async () => {
      await renderAndWaitForLoad({ showFilters: false }, createHistoryItems(3));

      expect(screen.queryByText('Filter by type')).not.toBeInTheDocument();
    });

    it('makes a new API call when filter changes', async () => {
      const items = createHistoryItems(5);
      await renderAndWaitForLoad({}, items);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Change filter to daily_reminder - this triggers a new fetch
      mockFetchSuccess([
        createHistoryItem({ id: 'daily-1', type: 'daily_reminder' }),
      ]);

      const nativeSelect = screen.getByTestId('select-native');
      await act(async () => {
        fireEvent.change(nativeSelect, { target: { value: 'daily_reminder' } });
      });

      // fetch should be called again with the type filter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // The second call URL should include the type parameter
      const secondCallUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(secondCallUrl).toContain('type=daily_reminder');
    });

    it('sends the correct limit parameter in API call', async () => {
      await renderAndWaitForLoad({ limit: 10 }, []);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=10');
    });

    it('does not include type parameter when filter is "all"', async () => {
      await renderAndWaitForLoad({}, []);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).not.toContain('type=');
    });

    it('renders all type options in the filter Select', async () => {
      // Use an empty result to avoid label duplication from history items
      await renderAndWaitForLoad({}, []);

      // All type labels appear in SelectItem elements within the filter
      const selectItems = screen.getAllByTestId('select-item');
      const selectItemLabels = selectItems.map((el) => el.textContent);

      expect(selectItemLabels).toContain('All Types');
      expect(selectItemLabels).toContain('Daily Reminder');
      expect(selectItemLabels).toContain('Progress Check');
      expect(selectItemLabels).toContain('Support Alert');
      expect(selectItemLabels).toContain('Milestone');
      expect(selectItemLabels).toContain('Re-engagement');
      expect(selectItemLabels).toContain('Streak Risk');
      expect(selectItemLabels).toContain('Weekly Summary');
    });
  });

  // --------------------------------------------------------------------------
  // 9. REFRESH
  // --------------------------------------------------------------------------

  describe('refresh functionality', () => {
    it('re-fetches data when refresh button is clicked', async () => {
      await renderAndWaitForLoad({}, createHistoryItems(2));

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Click refresh
      mockFetchSuccess([
        createHistoryItem({ id: 'refreshed-1', message: 'Refreshed data' }),
      ]);

      const refreshButton = screen.getAllByRole('button').find(
        (btn) => btn.getAttribute('data-size') === 'icon'
      );
      expect(refreshButton).toBeDefined();

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      expect(screen.getByText('Refreshed data')).toBeInTheDocument();
    });

    it('disables refresh button while loading', async () => {
      // Start with a never-resolving fetch
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
      render(<CheckInHistory />);

      const refreshButton = screen.getAllByRole('button').find(
        (btn) => btn.getAttribute('data-size') === 'icon'
      );
      expect(refreshButton).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 10. COMPACT MODE
  // --------------------------------------------------------------------------

  describe('compact mode', () => {
    it('does not show message text in the summary area when compact is true', async () => {
      const item = createHistoryItem({
        id: 'compact-1',
        message: 'This message should be hidden in summary',
      });
      await renderAndWaitForLoad({ compact: true }, [item]);

      // In compact mode, the message should only appear in the expanded view, not in the summary
      // The component renders the message in a <p> with line-clamp-2 only when !compact
      // But the message also appears in the expanded section's full text
      // Since the item is not expanded, the message should not be visible at all
      // Wait -- the message still shows in the expanded section. Since the item is collapsed,
      // the expanded section is not rendered, so the message should not appear at all.
      // Actually, re-reading the code: in compact mode, the non-compact <p> is hidden.
      // The message still appears in the expanded section when expanded.
      // When collapsed and compact, the message text should NOT be in the summary section.

      // Get all paragraphs that contain the message text
      const messageElements = screen.queryAllByText(
        'This message should be hidden in summary'
      );
      // In compact mode with no expansion, the message should not be rendered
      expect(messageElements.length).toBe(0);
    });

    it('shows message in expanded view even in compact mode', async () => {
      const item = createHistoryItem({
        id: 'compact-expand-1',
        message: 'Compact expanded message',
      });
      await renderAndWaitForLoad({ compact: true }, [item]);

      // Expand the item
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      // Now the message should be visible in the expanded section
      expect(screen.getByText('Compact expanded message')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 11. className PROP
  // --------------------------------------------------------------------------

  describe('className prop', () => {
    it('applies custom className to the root Card', async () => {
      await renderAndWaitForLoad({ className: 'my-custom-class' }, []);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('my-custom-class');
    });

    it('preserves the default overflow-hidden class alongside custom class', async () => {
      await renderAndWaitForLoad({ className: 'extra-class' }, []);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('overflow-hidden');
      expect(card.className).toContain('extra-class');
    });
  });

  // --------------------------------------------------------------------------
  // 12. API URL CONSTRUCTION
  // --------------------------------------------------------------------------

  describe('API URL construction', () => {
    it('fetches from the correct API endpoint', async () => {
      await renderAndWaitForLoad({}, []);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/sam/agentic/checkins/history');
    });

    it('includes limit as a query parameter', async () => {
      await renderAndWaitForLoad({ limit: 50 }, []);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=50');
    });

    it('defaults limit to 20 when not specified', async () => {
      await renderAndWaitForLoad({}, []);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=20');
    });

    it('includes type filter in URL when a specific type is selected', async () => {
      await renderAndWaitForLoad({ typeFilter: 'progress_check' }, []);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('type=progress_check');
    });
  });

  // --------------------------------------------------------------------------
  // 13. RESPONSE DATA WITH NO RESPONSE FIELD
  // --------------------------------------------------------------------------

  describe('items without response data', () => {
    it('renders dismissed items without response section', async () => {
      const dismissedItem = createHistoryItem({
        id: 'dismissed-1',
        status: 'dismissed',
        message: 'A dismissed check-in',
        response: undefined,
      });
      await renderAndWaitForLoad({}, [dismissedItem]);

      // Expand the item
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      // Should not show mood or answers
      expect(screen.queryByText('Mood:')).not.toBeInTheDocument();
      expect(screen.queryByText(/question\(s\) answered/)).not.toBeInTheDocument();
    });

    it('renders expired items without response section', async () => {
      const expiredItem = createHistoryItem({
        id: 'expired-1',
        status: 'expired',
        message: 'An expired check-in',
        response: undefined,
      });
      await renderAndWaitForLoad({}, [expiredItem]);

      // Expand
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      expect(screen.queryByText('Mood:')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 14. EDGE CASES
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles success response with success=false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: false,
            data: null,
          }),
      });

      await act(async () => {
        render(<CheckInHistory />);
      });

      // Should show empty state since success is false
      expect(
        screen.getByText('No check-in history yet')
      ).toBeInTheDocument();
    });

    it('renders with zero answers and zero selected actions', async () => {
      const item = createHistoryItem({
        id: 'empty-response',
        response: {
          answers: [],
          selectedActions: [],
          emotionalState: 'neutral',
        },
      });
      await renderAndWaitForLoad({}, [item]);

      // Expand
      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.textContent?.includes('Daily Reminder')
      );
      await act(async () => {
        fireEvent.click(toggleButton!);
      });

      // Should show mood but not "0 question(s) answered" (answers.length > 0 check)
      expect(screen.getByText('neutral')).toBeInTheDocument();
      expect(screen.queryByText(/question\(s\) answered/)).not.toBeInTheDocument();
    });

    it('handles large number of items', async () => {
      const manyItems = createHistoryItems(50);
      await renderAndWaitForLoad({}, manyItems);

      // Should render in scroll area
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
      // Check that a few items are rendered
      expect(screen.getByText('Check-in message 1')).toBeInTheDocument();
      expect(screen.getByText('Check-in message 50')).toBeInTheDocument();
    });
  });
});

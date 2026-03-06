import React from 'react';
import { render, screen, fireEvent, waitFor, act, within, cleanup } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock framer-motion - forward all HTML-compatible props including onClick
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

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const ReactLR = require('react');
  const MockIcon = ReactLR.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<SVGSVGElement>) =>
      ReactLR.createElement('svg', { ref, 'data-testid': 'icon', 'aria-hidden': 'true', ...props }),
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
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock Progress
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} />
  ),
}));

// Mock Skeleton
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock Tooltip - render NOTHING for tooltip content to avoid duplicate text
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}));

// Mock Dialog
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean; onOpenChange: (o: boolean) => void }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="dialog-description" className={className}>{children}</p>
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
// IMPORT UNDER TEST (must come after mocks)
// ============================================================================
import { AchievementBadges } from '@/components/sam/AchievementBadges';
import type { Achievement } from '@/components/sam/AchievementBadges';

// ============================================================================
// TEST DATA FACTORY
// ============================================================================

function createBadge(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'badge-1',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: 'star',
    category: 'streak',
    rarity: 'common',
    xpReward: 50,
    progress: 100,
    isUnlocked: true,
    unlockedAt: '2024-01-15T10:30:00Z',
    requirement: 'Complete 1 lesson',
    ...overrides,
  };
}

const mockBadges: Achievement[] = [
  createBadge({
    id: '1',
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'streak',
    rarity: 'common',
    xpReward: 50,
    progress: 100,
    isUnlocked: true,
    unlockedAt: '2024-01-01T00:00:00Z',
    icon: 'star',
  }),
  createBadge({
    id: '2',
    name: 'Quiz Master',
    description: 'Score 100% on a quiz',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 200,
    progress: 100,
    isUnlocked: true,
    unlockedAt: '2024-02-01T00:00:00Z',
    icon: 'trophy',
  }),
  createBadge({
    id: '3',
    name: 'Social Butterfly',
    description: 'Interact with 10 peers',
    category: 'social',
    rarity: 'uncommon',
    xpReward: 100,
    progress: 60,
    isUnlocked: false,
    unlockedAt: undefined,
    icon: 'users',
    requirement: 'Interact with 10 peers in discussions',
  }),
  createBadge({
    id: '4',
    name: 'Speed Demon',
    description: 'Complete a course in record time',
    category: 'milestone',
    rarity: 'epic',
    xpReward: 500,
    progress: 100,
    isUnlocked: true,
    unlockedAt: '2024-03-15T00:00:00Z',
    icon: 'zap',
  }),
  createBadge({
    id: '5',
    name: 'Legendary Scholar',
    description: 'Master every subject',
    category: 'special',
    rarity: 'legendary',
    xpReward: 1000,
    progress: 30,
    isUnlocked: false,
    unlockedAt: undefined,
    icon: 'crown',
    requirement: 'Achieve mastery in all subjects',
  }),
  createBadge({
    id: '6',
    name: 'Bookworm',
    description: 'Read 50 chapters',
    category: 'streak',
    rarity: 'uncommon',
    xpReward: 150,
    progress: 100,
    isUnlocked: true,
    unlockedAt: '2024-01-20T00:00:00Z',
    icon: 'book',
  }),
];

// ============================================================================
// HELPERS
// ============================================================================

/** Create a fresh fetch mock for each test to avoid pollution */
function setupFetchMock(): jest.Mock {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  return fetchMock;
}

function mockFetchSuccess(fetchMock: jest.Mock, badges: Achievement[] = mockBadges): void {
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: { achievements: badges } }),
  });
}

function mockFetchError(fetchMock: jest.Mock): void {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ success: false, error: { message: 'Server error' } }),
  });
}

function mockFetchNetworkError(fetchMock: jest.Mock): void {
  fetchMock.mockRejectedValue(new Error('Network error'));
}

async function renderAndWait(props: Partial<React.ComponentProps<typeof AchievementBadges>> = {}): Promise<void> {
  await act(async () => {
    render(<AchievementBadges {...props} />);
  });
  await waitFor(() => {
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });
}

function getVisibleBadgeNames(): string[] {
  const buttons = screen.getAllByRole('button');
  return buttons
    .map((btn) => {
      const nameSpan = btn.querySelector('span');
      return nameSpan?.textContent ?? '';
    })
    .filter(Boolean);
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('AchievementBadges', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    // Ensure clean DOM between tests to prevent component re-renders
    // from consuming fetch mocks set up for the next test
    cleanup();
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanup();
  });

  // --------------------------------------------------------------------------
  // 1. Loading state
  // --------------------------------------------------------------------------
  describe('Loading state', () => {
    it('shows skeleton loading indicators initially', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<AchievementBadges />);
      });

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(8);
    });

    it('hides skeletons after data loads', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Successful fetch and rendering
  // --------------------------------------------------------------------------
  describe('Successful fetch', () => {
    it('renders badges after successful fetch', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const names = getVisibleBadgeNames();
      expect(names).toContain('First Steps');
      expect(names).toContain('Quiz Master');
    });

    it('calls the correct API endpoint on mount', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(fetchMock).toHaveBeenCalledWith('/api/sam/gamification/achievements');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('renders the Achievements title', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('displays unlocked/total stats badge', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const statsBadges = screen.getAllByTestId('ui-badge');
      const statsText = statsBadges.map((b) => b.textContent).join(' ');
      expect(statsText).toContain('4');
      expect(statsText).toContain('6');
    });

    it('displays total XP earned from badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const description = screen.getByTestId('card-description');
      expect(description.textContent).toContain('900');
      expect(description.textContent).toContain('XP earned from badges');
    });

    it('renders the correct number of badge cards', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Error state
  // --------------------------------------------------------------------------
  describe('Error handling', () => {
    it('shows empty state when fetch returns non-OK response', async () => {
      mockFetchError(fetchMock);
      await renderAndWait();

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });

    it('shows empty state when fetch throws a network error', async () => {
      mockFetchNetworkError(fetchMock);
      await renderAndWait();

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });

    it('shows empty state when API returns success:false', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });
      await renderAndWait();

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Empty state
  // --------------------------------------------------------------------------
  describe('Empty state', () => {
    it('shows empty state message when no badges are returned', async () => {
      mockFetchSuccess(fetchMock, []);
      await renderAndWait();

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
      expect(screen.getByText(/Keep learning to earn badges/)).toBeInTheDocument();
    });

    it('shows 0/0 stats when there are no badges', async () => {
      mockFetchSuccess(fetchMock, []);
      await renderAndWait();

      const statsBadges = screen.getAllByTestId('ui-badge');
      const statsText = statsBadges.map((b) => b.textContent).join('');
      expect(statsText).toContain('0/0');
    });

    it('shows 0 XP when there are no badges', async () => {
      mockFetchSuccess(fetchMock, []);
      await renderAndWait();

      const description = screen.getByTestId('card-description');
      expect(description.textContent).toContain('0');
      expect(description.textContent).toContain('XP earned from badges');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Category filtering
  // --------------------------------------------------------------------------
  describe('Category filtering', () => {
    it('"all" category shows all badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'all' });

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });

    it('filters badges by "mastery" category', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'mastery' });

      const names = getVisibleBadgeNames();
      expect(names).toContain('Quiz Master');
      expect(names).not.toContain('First Steps');
      expect(names).not.toContain('Social Butterfly');
    });

    it('filters badges by "social" category', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'social' });

      const names = getVisibleBadgeNames();
      expect(names).toContain('Social Butterfly');
      expect(names).not.toContain('Quiz Master');
    });

    it('filters badges by "streak" category', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'streak' });

      const names = getVisibleBadgeNames();
      expect(names).toContain('First Steps');
      expect(names).toContain('Bookworm');
      expect(names).not.toContain('Quiz Master');
    });

    it('filters badges by "milestone" category', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'milestone' });

      const names = getVisibleBadgeNames();
      expect(names).toContain('Speed Demon');
      expect(names).not.toContain('First Steps');
    });

    it('filters badges by "special" category', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'special' });

      const names = getVisibleBadgeNames();
      expect(names).toContain('Legendary Scholar');
      expect(names).not.toContain('Quiz Master');
    });

    it('shows empty state when category has no matching badges', async () => {
      mockFetchSuccess(fetchMock, [mockBadges[0]]);
      await renderAndWait({ categoryFilter: 'social' });

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Sorting behavior
  // --------------------------------------------------------------------------
  describe('Sorting', () => {
    it('sorts unlocked badges before locked badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const names = getVisibleBadgeNames();
      const unlockedBadgeSet = new Set(
        mockBadges.filter((b) => b.isUnlocked).map((b) => b.name),
      );
      const lockedBadgeSet = new Set(
        mockBadges.filter((b) => !b.isUnlocked).map((b) => b.name),
      );

      let lastUnlockedIdx = -1;
      let firstLockedIdx = names.length;

      names.forEach((name, idx) => {
        if (unlockedBadgeSet.has(name)) lastUnlockedIdx = idx;
        if (lockedBadgeSet.has(name) && idx < firstLockedIdx) firstLockedIdx = idx;
      });

      expect(lastUnlockedIdx).toBeLessThan(firstLockedIdx);
    });

    it('sorts by rarity within unlocked group (legendary > epic > rare > uncommon > common)', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const names = getVisibleBadgeNames();

      const epicIdx = names.indexOf('Speed Demon');
      const rareIdx = names.indexOf('Quiz Master');
      const uncommonIdx = names.indexOf('Bookworm');
      const commonIdx = names.indexOf('First Steps');

      expect(epicIdx).toBeLessThan(rareIdx);
      expect(rareIdx).toBeLessThan(uncommonIdx);
      expect(uncommonIdx).toBeLessThan(commonIdx);
    });
  });

  // --------------------------------------------------------------------------
  // 7. showLocked prop
  // --------------------------------------------------------------------------
  describe('showLocked prop', () => {
    it('hides locked badges when showLocked is false', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ showLocked: false });

      const names = getVisibleBadgeNames();
      expect(names).not.toContain('Social Butterfly');
      expect(names).not.toContain('Legendary Scholar');
      expect(names).toContain('First Steps');
      expect(names).toContain('Quiz Master');
    });

    it('shows locked badges by default (showLocked=true)', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const names = getVisibleBadgeNames();
      expect(names).toContain('Social Butterfly');
      expect(names).toContain('Legendary Scholar');
    });
  });

  // --------------------------------------------------------------------------
  // 8. limit prop
  // --------------------------------------------------------------------------
  describe('limit prop', () => {
    it('limits the number of displayed badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ limit: 2 });

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('defaults to showing up to 12 badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Badge detail dialog
  // --------------------------------------------------------------------------
  describe('Badge detail dialog', () => {
    it('opens detail dialog when a badge is clicked', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
    });

    it('shows badge name in the dialog title', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        const dialogTitle = screen.getByTestId('dialog-title');
        expect(dialogTitle).toHaveTextContent('Speed Demon');
      });
    });

    it('shows badge description in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        const dialogDesc = screen.getByTestId('dialog-description');
        expect(dialogDesc).toHaveTextContent('Complete a course in record time');
      });
    });

    it('shows rarity label in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Click Quiz Master (index 1 after sorting: epic, rare, ...)
      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[1]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        const badges = within(dialog).getAllByTestId('ui-badge');
        const rarityBadge = badges.find((el) => el.textContent === 'Rare');
        expect(rarityBadge).toBeTruthy();
      });
    });

    it('shows XP reward in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[1]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        const badges = within(dialog).getAllByTestId('ui-badge');
        const xpBadge = badges.find((el) => el.textContent?.includes('200'));
        expect(xpBadge).toBeTruthy();
      });
    });

    it('shows unlock date for unlocked badges in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      const dateStr = new Date('2024-03-15T00:00:00Z').toLocaleDateString();
      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        expect(within(dialog).getByText(`Unlocked on ${dateStr}`)).toBeInTheDocument();
      });
    });

    it('shows progress for locked badges in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Locked badges are after unlocked. Index 4 = Legendary Scholar (30% progress)
      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[4]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        expect(within(dialog).getByText('Progress')).toBeInTheDocument();
        const progressBar = within(dialog).getByTestId('progress-bar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('shows requirement text for locked badges in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Index 5 = Social Butterfly (uncommon locked)
      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[5]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        expect(
          within(dialog).getByText('Interact with 10 peers in discussions'),
        ).toBeInTheDocument();
      });
    });

    it('does not show progress section for unlocked badges in the dialog', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        expect(within(dialog).queryByText('Progress')).not.toBeInTheDocument();
      });
    });

    it('shows badge details in dialog including name, description, rarity, and date', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        expect(within(dialog).getByTestId('dialog-title')).toHaveTextContent('Speed Demon');
        expect(within(dialog).getByTestId('dialog-description')).toHaveTextContent(
          'Complete a course in record time',
        );
        const badges = within(dialog).getAllByTestId('ui-badge');
        expect(badges.some((el) => el.textContent === 'Epic')).toBe(true);
        const dateStr = new Date('2024-03-15T00:00:00Z').toLocaleDateString();
        expect(within(dialog).getByText(`Unlocked on ${dateStr}`)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 10. Rarity configuration labels verified through dialog
  // --------------------------------------------------------------------------
  describe('Rarity configuration', () => {
    it('displays all five rarity labels correctly when badges are clicked', async () => {
      // Use all badges so each rarity is represented. Verify each rarity
      // by clicking the corresponding badge and checking the dialog.
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      // Sort order: unlocked by rarity (epic, rare, uncommon, common), then locked (legendary, uncommon)
      // Index 0: Speed Demon (epic), 1: Quiz Master (rare), 2: Bookworm (uncommon), 3: First Steps (common)
      // Index 4: Legendary Scholar (legendary locked), 5: Social Butterfly (uncommon locked)

      const expectedRarities = [
        { idx: 0, label: 'Epic' },
        { idx: 1, label: 'Rare' },
        { idx: 2, label: 'Uncommon' },
        { idx: 3, label: 'Common' },
        { idx: 4, label: 'Legendary' },
      ];

      for (const { idx, label } of expectedRarities) {
        cleanup();
        fetchMock.mockClear();
        mockFetchSuccess(fetchMock);
        await renderAndWait();

        const btns = screen.getAllByRole('button');
        await act(async () => {
          fireEvent.click(btns[idx]);
        });

        await waitFor(() => {
          const dialog = screen.getByTestId('dialog');
          const badges = within(dialog).getAllByTestId('ui-badge');
          expect(
            badges.some((el) => el.textContent === label),
          ).toBe(true);
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // 11. Compact mode
  // --------------------------------------------------------------------------
  describe('Compact mode', () => {
    it('hides badge names in compact mode', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ compact: true });

      const buttons = screen.getAllByRole('button');
      // In compact mode, no badge name span should be inside buttons
      buttons.forEach((button) => {
        const spans = button.querySelectorAll('span');
        const nameSpans = Array.from(spans).filter(
          (s) => s.classList.contains('font-medium') && s.classList.contains('text-xs'),
        );
        expect(nameSpans).toHaveLength(0);
      });
    });

    it('shows badge names in non-compact mode', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ compact: false });

      const names = getVisibleBadgeNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('Speed Demon'); // First sorted badge
    });
  });

  // --------------------------------------------------------------------------
  // 12. Locked badge visual indicators
  // --------------------------------------------------------------------------
  describe('Locked badge visual state', () => {
    it('renders icons for badges', async () => {
      mockFetchSuccess(fetchMock, [mockBadges[2]]);
      await renderAndWait();

      const icons = screen.getAllByTestId('icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders locked badge with grayscale styling when progress > 0', async () => {
      // Use full badge set and verify the locked badges have correct visual state
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      // After sorting: 4 unlocked (indices 0-3), then 2 locked (indices 4-5)
      // Index 5 = Social Butterfly (uncommon locked, 60% progress)
      const lockedButton = buttons[5];
      const iconContainer = lockedButton.querySelector('div.relative');
      expect(iconContainer).toBeTruthy();
      // Locked badges should have grayscale and opacity-50 classes
      expect(iconContainer?.className).toContain('grayscale');
      expect(iconContainer?.className).toContain('opacity-50');
      // And should NOT have shadow-lg (unlocked-only styling)
      expect(iconContainer?.className).not.toContain('shadow-lg');
    });

    it('does not render progress ring for locked badges with 0 progress', async () => {
      const zeroProgressBadge = createBadge({
        id: 'zero-prog',
        name: 'Zero Progress',
        isUnlocked: false,
        progress: 0,
      });
      mockFetchSuccess(fetchMock, [zeroProgressBadge]);
      await renderAndWait();

      const button = screen.getByRole('button');
      const circles = button.querySelectorAll('circle');
      expect(circles).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 13. Edge cases
  // --------------------------------------------------------------------------
  describe('Edge cases', () => {
    it('handles undefined achievements data gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });
      await renderAndWait();

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });

    it('handles null data field gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });
      await renderAndWait();

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });

    it('applies custom className to the card wrapper', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ className: 'custom-class' });

      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-class');
    });

    it('uses fallback icon when badge icon is not in ICON_MAP', async () => {
      const badgeWithUnknownIcon = createBadge({
        id: 'unknown-icon',
        name: 'Mystery Badge',
        icon: 'nonexistent_icon_xyz',
      });
      mockFetchSuccess(fetchMock, [badgeWithUnknownIcon]);
      await renderAndWait();

      const names = getVisibleBadgeNames();
      expect(names).toContain('Mystery Badge');
    });

    it('handles badge without unlockedAt date', async () => {
      const badgeNoDate = createBadge({
        id: 'no-date',
        name: 'No Date Badge',
        isUnlocked: true,
        unlockedAt: undefined,
      });
      mockFetchSuccess(fetchMock, [badgeNoDate]);
      await renderAndWait();

      const buttons = screen.getAllByRole('button');
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('dialog');
        expect(within(dialog).queryByText(/Unlocked on/)).not.toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 14. Combined filtering and limiting
  // --------------------------------------------------------------------------
  describe('Combined filtering and limiting', () => {
    it('applies category filter and limit together', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'streak', limit: 1 });

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('applies showLocked=false and category filter together', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ categoryFilter: 'social', showLocked: false });

      expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    });
  });
});

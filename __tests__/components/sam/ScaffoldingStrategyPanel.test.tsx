/**
 * Tests for ScaffoldingStrategyPanel component
 *
 * Covers: loading state, error state, null analysis fallback, compact mode,
 * full mode rendering, ZPD visualization, strategy cards, fading progress,
 * effectiveness tracking, metadata footer, interactions, edge cases,
 * refresh/retry behaviour, and onStrategySelect callback.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

// ============================================================================
// UI MOCKS
// ============================================================================

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} role="progressbar" aria-valuenow={value} />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="tooltip-content" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, className }: {
    children: React.ReactNode;
    defaultValue?: string;
    className?: string;
  }) => (
    <div data-testid="tabs" data-default-value={defaultValue} className={className}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="tabs-list" className={className}>{children}</div>
  ),
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button data-testid={`tab-trigger-${value}`} data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) => (
    <div data-testid={`tab-content-${value}`} className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// FETCH MOCK
// ============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ============================================================================
// IMPORT COMPONENT (after mocks)
// ============================================================================

import { ScaffoldingStrategyPanel } from '@/components/sam/ScaffoldingStrategyPanel';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createStrategy(overrides: Partial<{
  id: string;
  name: string;
  type: 'questioning' | 'modeling' | 'hinting' | 'coaching' | 'fading';
  description: string;
  applicability: number;
  effort: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  steps: string[];
}> = {}) {
  return {
    id: 'strategy-1',
    name: 'Guided Questioning',
    type: 'questioning' as const,
    description: 'Ask probing questions to help the student think deeper.',
    applicability: 0.85,
    effort: 'low' as const,
    expectedImpact: 'high' as const,
    steps: [
      'Start with open-ended question',
      'Wait for student response',
      'Provide follow-up cue',
    ],
    ...overrides,
  };
}

function createAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-1',
    courseId: 'course-1',
    conceptId: 'concept-1',
    currentLevel: {
      level: 'medium' as const,
      description: 'Student needs moderate guidance.',
      techniques: ['Think aloud', 'Peer discussion'],
    },
    zpd: {
      currentLevel: 45,
      targetLevel: 80,
      zpdRange: { lower: 40, upper: 75 },
      readinessScore: 0.65,
      confidence: 0.8,
    },
    recommendedStrategies: [
      createStrategy(),
      createStrategy({
        id: 'strategy-2',
        name: 'Concept Modeling',
        type: 'modeling',
        applicability: 0.72,
        effort: 'medium',
        expectedImpact: 'medium',
        description: 'Demonstrate the concept step by step.',
        steps: ['Show example', 'Explain reasoning'],
      }),
    ],
    fading: {
      currentPhase: 'moderate_support' as const,
      nextPhase: 'low_support',
      readyToProgress: false,
      progressionCriteria: [
        'Score above 80% on self-check',
        'Complete 3 independent exercises',
      ],
      estimatedTimeToNextPhase: '2 weeks',
    },
    recentEffectiveness: [
      { strategyId: 'strategy-1', successRate: 0.78, usageCount: 12 },
      { strategyId: 'strategy-2', successRate: 0.55, usageCount: 5 },
    ],
    metadata: {
      analyzedAt: '2026-03-05T10:30:00Z',
      dataPointsUsed: 150,
      confidence: 0.82,
    },
    ...overrides,
  };
}

const mockAnalysis = createAnalysis();

// ============================================================================
// HELPERS
// ============================================================================

function setupFetchSuccess(data = mockAnalysis) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data }),
  });
}

function setupFetchError(errorMessage = 'Server error', ok = false) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve({ error: errorMessage }),
  });
}

function setupFetchNetworkError(message = 'Network error') {
  mockFetch.mockRejectedValueOnce(new Error(message));
}

interface RenderProps {
  userId?: string;
  courseId?: string;
  conceptId?: string;
  className?: string;
  compact?: boolean;
  onStrategySelect?: (strategy: unknown) => void;
}

async function renderAndWait(props: RenderProps = {}) {
  const defaultProps = {
    userId: 'user-1',
    ...props,
  };
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(<ScaffoldingStrategyPanel {...defaultProps} />);
  });
  return result!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('ScaffoldingStrategyPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. LOADING STATE
  // ==========================================================================
  describe('loading state', () => {
    it('renders loading spinner while data is being fetched', () => {
      // Never resolve fetch so loading persists
      mockFetch.mockReturnValue(new Promise(() => {}));
      render(<ScaffoldingStrategyPanel userId="user-1" />);
      // The component renders a Card with a Loader2 icon during loading
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders a card wrapper during loading', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      render(<ScaffoldingStrategyPanel userId="user-1" className="custom-class" />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('shows card-content area during loading', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      render(<ScaffoldingStrategyPanel userId="user-1" />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 2. ERROR STATE
  // ==========================================================================
  describe('error state', () => {
    it('displays error message when fetch fails with server error', async () => {
      setupFetchError('Server error');
      await renderAndWait();
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('displays generic error message on network failure', async () => {
      setupFetchNetworkError('Network error');
      await renderAndWait();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('displays fallback message for non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('some string error');
      await renderAndWait();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('displays Retry button in error state', async () => {
      setupFetchError('Oops');
      await renderAndWait();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retries the fetch when Retry button is clicked', async () => {
      setupFetchError('First fail');
      await renderAndWait();
      expect(screen.getByText('First fail')).toBeInTheDocument();

      // Setup success for retry
      setupFetchSuccess();
      await act(async () => {
        fireEvent.click(screen.getByText('Retry'));
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('uses the error from the response JSON when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Custom API error message' }),
      });
      await renderAndWait();
      expect(screen.getByText('Custom API error message')).toBeInTheDocument();
    });

    it('falls back to generic message when response has no error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await renderAndWait();
      expect(screen.getByText('Failed to fetch analysis')).toBeInTheDocument();
    });

    it('preserves className on error card', async () => {
      setupFetchError('Error');
      await renderAndWait({ className: 'error-class' });
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('error-class');
    });
  });

  // ==========================================================================
  // 3. NULL ANALYSIS (returns null)
  // ==========================================================================
  describe('null analysis', () => {
    it('renders nothing when analysis data is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });
      const { container } = await renderAndWait();
      // Component returns null when analysis is null
      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when analysis data is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      const { container } = await renderAndWait();
      expect(container.innerHTML).toBe('');
    });
  });

  // ==========================================================================
  // 4. FETCH REQUEST
  // ==========================================================================
  describe('fetch request', () => {
    it('calls fetch with userId query param', async () => {
      setupFetchSuccess();
      await renderAndWait({ userId: 'user-42' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=user-42')
      );
    });

    it('includes courseId in fetch params when provided', async () => {
      setupFetchSuccess();
      await renderAndWait({ userId: 'user-1', courseId: 'course-99' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('courseId=course-99')
      );
    });

    it('includes conceptId in fetch params when provided', async () => {
      setupFetchSuccess();
      await renderAndWait({ userId: 'user-1', conceptId: 'concept-5' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('conceptId=concept-5')
      );
    });

    it('omits courseId from params when not provided', async () => {
      setupFetchSuccess();
      await renderAndWait({ userId: 'user-1' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain('courseId');
    });

    it('omits conceptId from params when not provided', async () => {
      setupFetchSuccess();
      await renderAndWait({ userId: 'user-1' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain('conceptId');
    });

    it('fetches from the correct API endpoint', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sam/scaffolding/analyze')
      );
    });
  });

  // ==========================================================================
  // 5. COMPACT MODE
  // ==========================================================================
  describe('compact mode', () => {
    it('renders compact card with scaffolding level title', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.getByText('Scaffolding Level')).toBeInTheDocument();
    });

    it('shows the current support level text in compact mode', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.getByText('medium Support')).toBeInTheDocument();
    });

    it('shows the number of strategies available in compact mode', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.getByText('2 strategies available')).toBeInTheDocument();
    });

    it('shows ZPD percentage badge in compact mode', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.getByText('ZPD: 45%')).toBeInTheDocument();
    });

    it('does not render tabs in compact mode', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
    });

    it('does not render fading progress in compact mode', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.queryByText('Support Fading Progress')).not.toBeInTheDocument();
    });

    it('does not show effectiveness section in compact mode', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true });
      expect(screen.queryByText('Recent Strategy Effectiveness')).not.toBeInTheDocument();
    });

    it('applies className to compact card', async () => {
      setupFetchSuccess();
      await renderAndWait({ compact: true, className: 'compact-class' });
      const cards = screen.getAllByTestId('card');
      expect(cards[0]).toHaveClass('compact-class');
    });
  });

  // ==========================================================================
  // 6. FULL MODE - HEADER
  // ==========================================================================
  describe('full mode header', () => {
    it('renders the main title', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Scaffolding Strategy Panel')).toBeInTheDocument();
    });

    it('renders the subtitle description', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(
        screen.getByText('Personalized teaching recommendations based on student progress')
      ).toBeInTheDocument();
    });

    it('renders a Refresh button', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls fetchAnalysis again when Refresh button is clicked', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      setupFetchSuccess();
      await act(async () => {
        fireEvent.click(screen.getByText('Refresh'));
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // 7. CURRENT SUPPORT LEVEL
  // ==========================================================================
  describe('current support level', () => {
    it('shows the Current Support Level title', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Current Support Level')).toBeInTheDocument();
    });

    it('displays the scaffolding level name', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('displays the level description', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Student needs moderate guidance.')).toBeInTheDocument();
    });

    it('shows Active Techniques heading', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Active Techniques')).toBeInTheDocument();
    });

    it('renders technique badges', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Think aloud')).toBeInTheDocument();
      expect(screen.getByText('Peer discussion')).toBeInTheDocument();
    });

    it('renders correct level for high support', async () => {
      setupFetchSuccess(createAnalysis({
        currentLevel: {
          level: 'high',
          description: 'High support needed.',
          techniques: ['Guided practice'],
        },
      }));
      await renderAndWait();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('renders correct level for minimal support', async () => {
      setupFetchSuccess(createAnalysis({
        currentLevel: {
          level: 'minimal',
          description: 'Almost independent.',
          techniques: ['Self-monitoring'],
        },
      }));
      await renderAndWait();
      expect(screen.getByText('minimal')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 8. ZPD VISUALIZATION
  // ==========================================================================
  describe('ZPD visualization', () => {
    it('shows the Zone of Proximal Development title', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Zone of Proximal Development')).toBeInTheDocument();
    });

    it('displays the current level percentage', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Current: 45%')).toBeInTheDocument();
    });

    it('displays the target level percentage', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Target: 80%')).toBeInTheDocument();
    });

    it('shows the ZPD Zone label', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('ZPD Zone')).toBeInTheDocument();
    });

    it('shows Current Ability label', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Current Ability')).toBeInTheDocument();
    });

    it('shows Target Mastery label', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Target Mastery')).toBeInTheDocument();
    });

    it('displays readiness score percentage', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('displays Readiness Score label', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Readiness Score')).toBeInTheDocument();
    });

    it('renders a progress bar for readiness score', async () => {
      setupFetchSuccess();
      await renderAndWait();
      const progressBars = screen.getAllByTestId('progress');
      // The first progress bar in full mode belongs to readiness
      const readinessBar = progressBars.find(
        (bar) => bar.getAttribute('data-value') === '65'
      );
      expect(readinessBar).toBeDefined();
    });

    it('shows ZPD tooltip content', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(
        screen.getByText(/The ZPD represents the gap between what a learner can do independently/)
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 9. TABS (STRATEGIES)
  // ==========================================================================
  describe('strategies tab', () => {
    it('renders the tabs component with strategies as default value', async () => {
      setupFetchSuccess();
      await renderAndWait();
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-default-value', 'strategies');
    });

    it('shows strategy count in tab trigger text', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText(/Recommended Strategies \(2\)/)).toBeInTheDocument();
    });

    it('renders strategy cards for each strategy', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Guided Questioning')).toBeInTheDocument();
      expect(screen.getByText('Concept Modeling')).toBeInTheDocument();
    });

    it('shows strategy type badges', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('questioning')).toBeInTheDocument();
      expect(screen.getByText('modeling')).toBeInTheDocument();
    });

    it('shows strategy applicability percentage', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('displays match label for applicability', async () => {
      setupFetchSuccess();
      await renderAndWait();
      const matches = screen.getAllByText('match');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('shows strategy description', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(
        screen.getByText('Ask probing questions to help the student think deeper.')
      ).toBeInTheDocument();
    });

    it('shows empty state when no strategies are available', async () => {
      setupFetchSuccess(createAnalysis({ recommendedStrategies: [] }));
      await renderAndWait();
      expect(
        screen.getByText('No specific strategies needed right now.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('The student is progressing well independently.')
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 10. STRATEGY CARD EXPANSION
  // ==========================================================================
  describe('strategy card expansion', () => {
    it('does not show implementation steps before clicking', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.queryByText('Implementation Steps')).not.toBeInTheDocument();
    });

    it('expands strategy card to show details on click', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
    });

    it('shows effort badge after expanding', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Effort:')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('shows impact badge after expanding', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Impact:')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('renders numbered implementation steps', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Start with open-ended question')).toBeInTheDocument();
      expect(screen.getByText('Wait for student response')).toBeInTheDocument();
      expect(screen.getByText('Provide follow-up cue')).toBeInTheDocument();
    });

    it('collapses card when clicked again', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.queryByText('Implementation Steps')).not.toBeInTheDocument();
    });

    it('shows Apply This Strategy button when onStrategySelect is provided', async () => {
      setupFetchSuccess();
      await renderAndWait({ onStrategySelect: jest.fn() });
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Apply This Strategy')).toBeInTheDocument();
    });

    it('does not show Apply button when onStrategySelect is not provided', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.queryByText('Apply This Strategy')).not.toBeInTheDocument();
    });

    it('calls onStrategySelect with the strategy when Apply is clicked', async () => {
      const onSelect = jest.fn();
      setupFetchSuccess();
      await renderAndWait({ onStrategySelect: onSelect });
      fireEvent.click(screen.getByText('Guided Questioning'));
      fireEvent.click(screen.getByText('Apply This Strategy'));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'strategy-1', name: 'Guided Questioning' })
      );
    });

    it('Apply button click does not collapse the card (event propagation stopped)', async () => {
      const onSelect = jest.fn();
      setupFetchSuccess();
      await renderAndWait({ onStrategySelect: onSelect });
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Apply This Strategy'));
      // Should still be expanded
      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 11. FADING TAB
  // ==========================================================================
  describe('fading schedule tab', () => {
    it('renders the Fading Schedule tab trigger', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Fading Schedule')).toBeInTheDocument();
    });

    it('shows Support Fading Progress title', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Support Fading Progress')).toBeInTheDocument();
    });

    it('shows the fading description', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(
        screen.getByText('Gradual reduction of support as the learner gains independence')
      ).toBeInTheDocument();
    });

    it('renders all phase labels', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('high support')).toBeInTheDocument();
      expect(screen.getByText('moderate support')).toBeInTheDocument();
      expect(screen.getByText('low support')).toBeInTheDocument();
      expect(screen.getByText('independence')).toBeInTheDocument();
    });

    it('shows "Not yet" when not ready to progress', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Not yet')).toBeInTheDocument();
    });

    it('shows "Yes" badge when ready to progress', async () => {
      setupFetchSuccess(createAnalysis({
        fading: {
          currentPhase: 'moderate_support',
          nextPhase: 'low_support',
          readyToProgress: true,
          progressionCriteria: ['Hit 90%'],
          estimatedTimeToNextPhase: '1 week',
        },
      }));
      await renderAndWait();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('shows the next phase name', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('low_support')).toBeInTheDocument();
    });

    it('shows estimated time to next phase', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Estimated time: 2 weeks')).toBeInTheDocument();
    });

    it('renders progression criteria', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Score above 80% on self-check')).toBeInTheDocument();
      expect(screen.getByText('Complete 3 independent exercises')).toBeInTheDocument();
    });

    it('shows Progression Criteria heading', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Progression Criteria')).toBeInTheDocument();
    });

    it('does not show criteria section when criteria list is empty', async () => {
      setupFetchSuccess(createAnalysis({
        fading: {
          currentPhase: 'high_support',
          nextPhase: 'moderate_support',
          readyToProgress: false,
          progressionCriteria: [],
          estimatedTimeToNextPhase: '3 weeks',
        },
      }));
      await renderAndWait();
      expect(screen.queryByText('Progression Criteria')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 12. EFFECTIVENESS SECTION
  // ==========================================================================
  describe('strategy effectiveness', () => {
    it('shows Recent Strategy Effectiveness title', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('Recent Strategy Effectiveness')).toBeInTheDocument();
    });

    it('displays strategy IDs in effectiveness rows', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('strategy-1')).toBeInTheDocument();
      expect(screen.getByText('strategy-2')).toBeInTheDocument();
    });

    it('displays success rate percentages', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('55%')).toBeInTheDocument();
    });

    it('displays usage count badges', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText('12 uses')).toBeInTheDocument();
      expect(screen.getByText('5 uses')).toBeInTheDocument();
    });

    it('renders progress bars for each effectiveness row', async () => {
      setupFetchSuccess();
      await renderAndWait();
      const progressBars = screen.getAllByTestId('progress');
      // successRate * 100 may produce floating point like 55.00000000000001
      // so we match by rounding the data-value
      const effectivenessBar78 = progressBars.find(
        (bar) => Math.round(Number(bar.getAttribute('data-value'))) === 78
      );
      const effectivenessBar55 = progressBars.find(
        (bar) => Math.round(Number(bar.getAttribute('data-value'))) === 55
      );
      expect(effectivenessBar78).toBeDefined();
      expect(effectivenessBar55).toBeDefined();
    });

    it('does not render effectiveness section when empty', async () => {
      setupFetchSuccess(createAnalysis({ recentEffectiveness: [] }));
      await renderAndWait();
      expect(screen.queryByText('Recent Strategy Effectiveness')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 13. METADATA FOOTER
  // ==========================================================================
  describe('metadata footer', () => {
    it('shows data points count', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText(/150 data points/)).toBeInTheDocument();
    });

    it('shows confidence percentage', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText(/Confidence: 82%/)).toBeInTheDocument();
    });

    it('shows last analyzed timestamp', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(screen.getByText(/Last analyzed:/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 14. EDGE CASES
  // ==========================================================================
  describe('edge cases', () => {
    it('handles single strategy', async () => {
      setupFetchSuccess(createAnalysis({
        recommendedStrategies: [createStrategy()],
      }));
      await renderAndWait();
      expect(screen.getByText(/Recommended Strategies \(1\)/)).toBeInTheDocument();
    });

    it('handles many strategies', async () => {
      const strategies = Array.from({ length: 10 }, (_, i) =>
        createStrategy({
          id: `strat-${i}`,
          name: `Strategy ${i}`,
          applicability: 0.5 + i * 0.05,
        })
      );
      setupFetchSuccess(createAnalysis({ recommendedStrategies: strategies }));
      await renderAndWait();
      expect(screen.getByText(/Recommended Strategies \(10\)/)).toBeInTheDocument();
    });

    it('handles zero readiness score', async () => {
      setupFetchSuccess(createAnalysis({
        zpd: {
          currentLevel: 0,
          targetLevel: 100,
          zpdRange: { lower: 0, upper: 50 },
          readinessScore: 0,
          confidence: 0.5,
        },
      }));
      await renderAndWait();
      expect(screen.getByText('Current: 0%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles full readiness score', async () => {
      setupFetchSuccess(createAnalysis({
        zpd: {
          currentLevel: 95,
          targetLevel: 100,
          zpdRange: { lower: 90, upper: 100 },
          readinessScore: 1,
          confidence: 0.99,
        },
      }));
      await renderAndWait();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles strategy with empty steps array', async () => {
      setupFetchSuccess(createAnalysis({
        recommendedStrategies: [createStrategy({ steps: [] })],
      }));
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
    });

    it('handles fading phase at independence', async () => {
      setupFetchSuccess(createAnalysis({
        fading: {
          currentPhase: 'independence',
          nextPhase: 'mastery',
          readyToProgress: true,
          progressionCriteria: ['Maintain consistency'],
          estimatedTimeToNextPhase: 'N/A',
        },
      }));
      await renderAndWait();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Estimated time: N/A')).toBeInTheDocument();
    });

    it('handles fading phase at high_support', async () => {
      setupFetchSuccess(createAnalysis({
        fading: {
          currentPhase: 'high_support',
          nextPhase: 'moderate_support',
          readyToProgress: false,
          progressionCriteria: ['Pass basic quiz'],
          estimatedTimeToNextPhase: '4 weeks',
        },
      }));
      await renderAndWait();
      expect(screen.getByText('Estimated time: 4 weeks')).toBeInTheDocument();
    });

    it('renders all strategy types correctly', async () => {
      const types: Array<'questioning' | 'modeling' | 'hinting' | 'coaching' | 'fading'> =
        ['questioning', 'modeling', 'hinting', 'coaching', 'fading'];
      const strategies = types.map((type, i) =>
        createStrategy({ id: `t-${i}`, name: `${type} strategy`, type })
      );
      setupFetchSuccess(createAnalysis({ recommendedStrategies: strategies }));
      await renderAndWait();
      for (const type of types) {
        expect(screen.getByText(type)).toBeInTheDocument();
      }
    });

    it('handles 100% applicability', async () => {
      setupFetchSuccess(createAnalysis({
        recommendedStrategies: [createStrategy({ applicability: 1 })],
      }));
      await renderAndWait();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles 0% applicability', async () => {
      setupFetchSuccess(createAnalysis({
        recommendedStrategies: [createStrategy({ applicability: 0 })],
      }));
      await renderAndWait();
      // 0 applicability results in "0%"
      const zeroElements = screen.getAllByText('0%');
      expect(zeroElements.length).toBeGreaterThanOrEqual(1);
    });

    it('handles single technique in current level', async () => {
      setupFetchSuccess(createAnalysis({
        currentLevel: {
          level: 'low',
          description: 'Almost there.',
          techniques: ['Self-reflection'],
        },
      }));
      await renderAndWait();
      expect(screen.getByText('Self-reflection')).toBeInTheDocument();
    });

    it('handles single effectiveness item', async () => {
      setupFetchSuccess(createAnalysis({
        recentEffectiveness: [{ strategyId: 'only-one', successRate: 0.9, usageCount: 100 }],
      }));
      await renderAndWait();
      expect(screen.getByText('only-one')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('100 uses')).toBeInTheDocument();
    });

    it('does not crash with empty techniques array', async () => {
      setupFetchSuccess(createAnalysis({
        currentLevel: {
          level: 'low',
          description: 'No techniques.',
          techniques: [],
        },
      }));
      await renderAndWait();
      expect(screen.getByText('Active Techniques')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 15. DEFAULT PROP VALUES
  // ==========================================================================
  describe('default props', () => {
    it('defaults compact to false', async () => {
      setupFetchSuccess();
      await renderAndWait();
      // Full mode renders the header title
      expect(screen.getByText('Scaffolding Strategy Panel')).toBeInTheDocument();
    });

    it('passes className to outer wrapper in full mode', async () => {
      setupFetchSuccess();
      const { container } = await renderAndWait({ className: 'full-mode-class' });
      // The outer div should have the class
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain('full-mode-class');
    });
  });

  // ==========================================================================
  // 16. RE-FETCH ON PROP CHANGE
  // ==========================================================================
  describe('re-fetch behavior', () => {
    it('refetches when Refresh button is clicked in full mode', async () => {
      setupFetchSuccess();
      await renderAndWait();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      setupFetchSuccess(createAnalysis({
        currentLevel: {
          level: 'high',
          description: 'Updated.',
          techniques: ['New technique'],
        },
      }));
      await act(async () => {
        fireEvent.click(screen.getByText('Refresh'));
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('shows loading then new data on refresh', async () => {
      setupFetchSuccess();
      await renderAndWait();

      // Create a delayed response for refresh
      let resolveFetch: ((value: unknown) => void) | undefined;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Refresh'));
      });

      // Now resolve
      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ data: createAnalysis() }),
        });
      });

      // After resolve, the data should be displayed again
      expect(screen.getByText('Scaffolding Strategy Panel')).toBeInTheDocument();
    });

    it('can transition from error to success on retry', async () => {
      setupFetchError('First error');
      await renderAndWait();
      expect(screen.getByText('First error')).toBeInTheDocument();

      setupFetchSuccess();
      await act(async () => {
        fireEvent.click(screen.getByText('Retry'));
      });
      expect(screen.getByText('Scaffolding Strategy Panel')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 17. EFFORT/IMPACT BADGE STYLING
  // ==========================================================================
  describe('effort and impact badges', () => {
    it('renders medium effort badge when strategy has medium effort', async () => {
      setupFetchSuccess();
      await renderAndWait();
      fireEvent.click(screen.getByText('Concept Modeling'));
      const badges = screen.getAllByTestId('badge');
      const mediumBadges = badges.filter((b) => b.textContent === 'medium');
      expect(mediumBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders high effort badge correctly', async () => {
      setupFetchSuccess(createAnalysis({
        recommendedStrategies: [createStrategy({ effort: 'high', expectedImpact: 'low' })],
      }));
      await renderAndWait();
      fireEvent.click(screen.getByText('Guided Questioning'));
      expect(screen.getByText('Effort:')).toBeInTheDocument();
    });
  });
});

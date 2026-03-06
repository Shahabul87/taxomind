import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCK: useAgentic hook from @sam-ai/react
// pnpm resolves @sam-ai/react via symlink to packages/react/src/index.ts
// jest.mock must use the resolved filesystem path for proper interception
// ============================================================================

const mockFetchRecommendations = jest.fn().mockResolvedValue(undefined);
const mockDismissRecommendation = jest.fn();
const mockClearError = jest.fn();

// Mutable object - tests modify properties directly before each render
const mockHookReturn: Record<string, unknown> = {
  recommendations: null,
  isLoadingRecommendations: false,
  fetchRecommendations: mockFetchRecommendations,
  dismissRecommendation: mockDismissRecommendation,
  error: null,
  clearError: mockClearError,
};

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
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
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

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENT UNDER TEST (after all mocks)
// ============================================================================

import { RecommendationWidget } from '@/components/sam/recommendation-widget';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

interface MockRecommendation {
  id: string;
  type: 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  targetUrl?: string;
  metadata?: Record<string, unknown>;
}

function createMockRecommendation(overrides: Partial<MockRecommendation> = {}): MockRecommendation {
  return {
    id: `rec-${Math.random().toString(36).slice(2, 8)}`,
    type: 'content',
    title: 'Learn React Hooks',
    description: 'Deep dive into useState, useEffect, and custom hooks.',
    reason: 'Based on your recent course activity.',
    priority: 'medium',
    estimatedMinutes: 30,
    targetUrl: '/courses/react-hooks',
    ...overrides,
  };
}

function createMockBatch(
  recommendations: MockRecommendation[],
  overrides: Record<string, unknown> = {}
) {
  const totalTime = recommendations.reduce((sum, r) => sum + r.estimatedMinutes, 0);
  return {
    recommendations,
    totalEstimatedTime: totalTime,
    generatedAt: '2026-03-05T10:30:00.000Z',
    context: { availableTime: 60 },
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('RecommendationWidget', () => {
  // Store original window.location so we can restore it
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset the mutable hook return to defaults
    mockHookReturn.recommendations = null;
    mockHookReturn.isLoadingRecommendations = false;
    mockHookReturn.error = null;

    mockFetchRecommendations.mockClear();
    mockFetchRecommendations.mockResolvedValue(undefined);
    mockDismissRecommendation.mockClear();
    mockClearError.mockClear();

    // Mock window.location.href assignment
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterAll(() => {
    // Restore window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------

  describe('Loading state', () => {
    it('shows a spinner when loading with no existing recommendations', () => {
      mockHookReturn.isLoadingRecommendations = true;
      mockHookReturn.recommendations = null;

      render(<RecommendationWidget />);

      expect(screen.getByText('Generating personalized recommendations...')).toBeInTheDocument();
    });

    it('shows the compact loading spinner when compact and loading', () => {
      mockHookReturn.isLoadingRecommendations = true;
      mockHookReturn.recommendations = null;

      render(<RecommendationWidget compact />);

      // Compact mode does not show the detailed loading message
      expect(screen.queryByText('Generating personalized recommendations...')).not.toBeInTheDocument();
      // But Recommendations label is shown
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('disables the refresh button while loading', () => {
      mockHookReturn.isLoadingRecommendations = true;
      mockHookReturn.recommendations = null;

      render(<RecommendationWidget />);

      const buttons = screen.getAllByRole('button');
      // The refresh button in the header should be disabled
      const refreshButton = buttons.find(b => b.getAttribute('disabled') !== null);
      expect(refreshButton).toBeTruthy();
      expect(refreshButton).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // RECOMMENDATIONS DISPLAY (full mode)
  // --------------------------------------------------------------------------

  describe('Recommendations display (full mode)', () => {
    const recs = [
      createMockRecommendation({ id: 'rec-1', type: 'content', title: 'Learn React Hooks', estimatedMinutes: 30, priority: 'high' }),
      createMockRecommendation({ id: 'rec-2', type: 'practice', title: 'Practice TypeScript', estimatedMinutes: 20, priority: 'medium' }),
      createMockRecommendation({ id: 'rec-3', type: 'review', title: 'Review JavaScript', estimatedMinutes: 15, priority: 'low' }),
    ];

    beforeEach(() => {
      mockHookReturn.recommendations = createMockBatch(recs);
    });

    it('renders the card title "Learning Recommendations"', () => {
      render(<RecommendationWidget />);

      expect(screen.getByText('Learning Recommendations')).toBeInTheDocument();
    });

    it('displays all recommendation titles', () => {
      render(<RecommendationWidget />);

      expect(screen.getByText('Learn React Hooks')).toBeInTheDocument();
      expect(screen.getByText('Practice TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Review JavaScript')).toBeInTheDocument();
    });

    it('displays recommendation descriptions', () => {
      render(<RecommendationWidget />);

      // All three share the same description from the factory
      const descriptions = screen.getAllByText('Deep dive into useState, useEffect, and custom hooks.');
      expect(descriptions.length).toBe(3);
    });

    it('displays recommendation reasons', () => {
      render(<RecommendationWidget />);

      const reasons = screen.getAllByText('Based on your recent course activity.');
      expect(reasons.length).toBe(3);
    });

    it('displays estimated time for each recommendation', () => {
      render(<RecommendationWidget />);

      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('15 min')).toBeInTheDocument();
    });

    it('displays type badges for each recommendation', () => {
      render(<RecommendationWidget />);

      expect(screen.getByText('content')).toBeInTheDocument();
      expect(screen.getByText('practice')).toBeInTheDocument();
      expect(screen.getByText('review')).toBeInTheDocument();
    });

    it('shows the total estimated time badge when showTotalTime is true', () => {
      render(<RecommendationWidget showTotalTime />);

      expect(screen.getByText('65 min total')).toBeInTheDocument();
    });

    it('hides the total time badge when showTotalTime is false', () => {
      render(<RecommendationWidget showTotalTime={false} />);

      expect(screen.queryByText('65 min total')).not.toBeInTheDocument();
    });

    it('shows the "Updated" timestamp when generatedAt is present', () => {
      render(<RecommendationWidget />);

      // The generatedAt is rendered via toLocaleTimeString()
      const expectedTime = new Date('2026-03-05T10:30:00.000Z').toLocaleTimeString();
      expect(screen.getByText(`Updated ${expectedTime}`)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // maxRecommendations PROP
  // --------------------------------------------------------------------------

  describe('maxRecommendations prop', () => {
    it('limits the number of displayed recommendations', () => {
      const recs = Array.from({ length: 8 }, (_, i) =>
        createMockRecommendation({ id: `rec-${i}`, title: `Recommendation ${i}` })
      );
      mockHookReturn.recommendations = createMockBatch(recs);

      render(<RecommendationWidget maxRecommendations={3} />);

      expect(screen.getByText('Recommendation 0')).toBeInTheDocument();
      expect(screen.getByText('Recommendation 1')).toBeInTheDocument();
      expect(screen.getByText('Recommendation 2')).toBeInTheDocument();
      expect(screen.queryByText('Recommendation 3')).not.toBeInTheDocument();
    });

    it('shows remaining count when there are more recommendations than max', () => {
      const recs = Array.from({ length: 8 }, (_, i) =>
        createMockRecommendation({ id: `rec-${i}`, title: `Rec ${i}` })
      );
      mockHookReturn.recommendations = createMockBatch(recs);

      render(<RecommendationWidget maxRecommendations={5} />);

      expect(screen.getByText('+3 more recommendations')).toBeInTheDocument();
    });

    it('does not show remaining count when all recommendations fit', () => {
      const recs = [
        createMockRecommendation({ id: 'rec-1', title: 'Rec A' }),
        createMockRecommendation({ id: 'rec-2', title: 'Rec B' }),
      ];
      mockHookReturn.recommendations = createMockBatch(recs);

      render(<RecommendationWidget maxRecommendations={5} />);

      expect(screen.queryByText(/more recommendations/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // COMPACT MODE
  // --------------------------------------------------------------------------

  describe('Compact mode', () => {
    const recs = [
      createMockRecommendation({ id: 'rec-1', type: 'content', title: 'Compact Rec 1', estimatedMinutes: 10 }),
      createMockRecommendation({ id: 'rec-2', type: 'practice', title: 'Compact Rec 2', estimatedMinutes: 15 }),
      createMockRecommendation({ id: 'rec-3', type: 'review', title: 'Compact Rec 3', estimatedMinutes: 20 }),
      createMockRecommendation({ id: 'rec-4', type: 'goal', title: 'Compact Rec 4', estimatedMinutes: 25 }),
    ];

    beforeEach(() => {
      mockHookReturn.recommendations = createMockBatch(recs);
    });

    it('renders the "Recommendations" label instead of card title', () => {
      render(<RecommendationWidget compact />);

      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.queryByText('Learning Recommendations')).not.toBeInTheDocument();
    });

    it('shows at most 3 recommendations in compact mode', () => {
      render(<RecommendationWidget compact />);

      expect(screen.getByText('Compact Rec 1')).toBeInTheDocument();
      expect(screen.getByText('Compact Rec 2')).toBeInTheDocument();
      expect(screen.getByText('Compact Rec 3')).toBeInTheDocument();
      expect(screen.queryByText('Compact Rec 4')).not.toBeInTheDocument();
    });

    it('shows abbreviated time (e.g. "10m") in compact mode', () => {
      render(<RecommendationWidget compact />);

      expect(screen.getByText('10m')).toBeInTheDocument();
      expect(screen.getByText('15m')).toBeInTheDocument();
      expect(screen.getByText('20m')).toBeInTheDocument();
    });

    it('does not render descriptions in compact mode', () => {
      render(<RecommendationWidget compact />);

      expect(screen.queryByText('Deep dive into useState, useEffect, and custom hooks.')).not.toBeInTheDocument();
    });

    it('does not render reasons in compact mode', () => {
      render(<RecommendationWidget compact />);

      expect(screen.queryByText('Based on your recent course activity.')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------------------------------

  describe('Empty state', () => {
    it('shows the empty state message when no recommendations are available (full mode)', () => {
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget />);

      expect(screen.getByText('No recommendations available')).toBeInTheDocument();
      expect(screen.getByText('Continue learning and SAM will suggest what to do next!')).toBeInTheDocument();
    });

    it('shows the empty state with a "Check Again" button in full mode', () => {
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget />);

      expect(screen.getByText('Check Again')).toBeInTheDocument();
    });

    it('shows compact empty state when no recommendations and compact mode', () => {
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget compact />);

      expect(screen.getByText('No recommendations right now')).toBeInTheDocument();
    });

    it('shows the empty state when recommendations is null', () => {
      mockHookReturn.recommendations = null;

      render(<RecommendationWidget />);

      expect(screen.getByText('No recommendations available')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------------------------------

  describe('Error handling', () => {
    it('shows an error banner when error is set', () => {
      mockHookReturn.error = new Error('Network failure');
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget />);

      expect(screen.getByText('Failed to load recommendations')).toBeInTheDocument();
    });

    it('does not show error banner when error is null', () => {
      mockHookReturn.error = null;
      mockHookReturn.recommendations = createMockBatch([
        createMockRecommendation({ id: 'rec-1', title: 'Rec A' }),
      ]);

      render(<RecommendationWidget />);

      expect(screen.queryByText('Failed to load recommendations')).not.toBeInTheDocument();
    });

    it('shows recommendations alongside the error banner', () => {
      const recs = [
        createMockRecommendation({ id: 'rec-1', title: 'Still visible rec' }),
      ];
      mockHookReturn.error = new Error('Partial error');
      mockHookReturn.recommendations = createMockBatch(recs);

      render(<RecommendationWidget />);

      expect(screen.getByText('Failed to load recommendations')).toBeInTheDocument();
      expect(screen.getByText('Still visible rec')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // CLICK ACTIONS
  // --------------------------------------------------------------------------

  describe('Click actions', () => {
    it('calls onRecommendationClick when a recommendation is clicked', () => {
      const rec = createMockRecommendation({ id: 'rec-1', title: 'Clickable Rec' });
      mockHookReturn.recommendations = createMockBatch([rec]);

      const handleClick = jest.fn();
      render(<RecommendationWidget onRecommendationClick={handleClick} />);

      fireEvent.click(screen.getByText('Clickable Rec'));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(rec);
    });

    it('navigates via window.location.href when no onRecommendationClick and targetUrl exists', () => {
      const rec = createMockRecommendation({
        id: 'rec-1',
        title: 'Nav Rec',
        targetUrl: '/courses/advanced-ts',
      });
      mockHookReturn.recommendations = createMockBatch([rec]);

      render(<RecommendationWidget />);

      fireEvent.click(screen.getByText('Nav Rec'));

      expect(window.location.href).toBe('/courses/advanced-ts');
    });

    it('does nothing when no onRecommendationClick and no targetUrl', () => {
      const rec = createMockRecommendation({
        id: 'rec-1',
        title: 'No-op Rec',
        targetUrl: undefined,
      });
      mockHookReturn.recommendations = createMockBatch([rec]);

      render(<RecommendationWidget />);

      fireEvent.click(screen.getByText('No-op Rec'));

      // No navigation and no error
      expect(window.location.href).toBe('');
    });

    it('calls onRecommendationClick in compact mode when a recommendation is clicked', () => {
      const rec = createMockRecommendation({ id: 'rec-1', title: 'Compact Click' });
      mockHookReturn.recommendations = createMockBatch([rec]);

      const handleClick = jest.fn();
      render(<RecommendationWidget compact onRecommendationClick={handleClick} />);

      fireEvent.click(screen.getByText('Compact Click'));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(rec);
    });

    it('calls dismissRecommendation when the dismiss button is clicked (full mode)', () => {
      const rec = createMockRecommendation({ id: 'rec-dismiss-1', title: 'Dismissable Rec' });
      mockHookReturn.recommendations = createMockBatch([rec]);

      const handleClick = jest.fn();
      render(<RecommendationWidget onRecommendationClick={handleClick} />);

      // The dismiss button is a <button> inside the recommendation card
      // It has an X icon. Find all buttons and identify the dismiss one.
      const allButtons = screen.getAllByRole('button');
      // The dismiss button is not a Button mock (no data-variant), it is a raw <button>
      const dismissButton = allButtons.find(
        b => !b.hasAttribute('data-variant') && !b.hasAttribute('data-size')
      );
      expect(dismissButton).toBeTruthy();

      fireEvent.click(dismissButton!);

      expect(mockDismissRecommendation).toHaveBeenCalledWith('rec-dismiss-1');
      // Should NOT trigger the card click handler
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // REFRESH
  // --------------------------------------------------------------------------

  describe('Refresh', () => {
    it('calls fetchRecommendations when the header refresh button is clicked', async () => {
      const rec = createMockRecommendation({ id: 'rec-1', title: 'Existing Rec' });
      mockHookReturn.recommendations = createMockBatch([rec]);

      render(<RecommendationWidget />);

      // The refresh button in the header is a Button mock (has data-variant)
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        b => b.getAttribute('data-variant') === 'ghost' && b.getAttribute('data-size') === 'sm'
      );
      expect(refreshButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      expect(mockFetchRecommendations).toHaveBeenCalledWith(60); // default availableTime
    });

    it('calls fetchRecommendations with custom availableTime', async () => {
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget availableTime={120} />);

      const checkAgainButton = screen.getByText('Check Again');

      await act(async () => {
        fireEvent.click(checkAgainButton);
      });

      expect(mockFetchRecommendations).toHaveBeenCalledWith(120);
    });

    it('calls fetchRecommendations via "Check Again" button in empty state', async () => {
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget />);

      const checkAgainButton = screen.getByText('Check Again');

      await act(async () => {
        fireEvent.click(checkAgainButton);
      });

      expect(mockFetchRecommendations).toHaveBeenCalledWith(60);
    });

    it('calls fetchRecommendations from compact mode refresh button', async () => {
      const rec = createMockRecommendation({ id: 'rec-1', title: 'Rec' });
      mockHookReturn.recommendations = createMockBatch([rec]);

      render(<RecommendationWidget compact availableTime={45} />);

      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        b => b.getAttribute('data-variant') === 'ghost' && b.getAttribute('data-size') === 'sm'
      );
      expect(refreshButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      expect(mockFetchRecommendations).toHaveBeenCalledWith(45);
    });
  });

  // --------------------------------------------------------------------------
  // className PROP
  // --------------------------------------------------------------------------

  describe('className prop', () => {
    it('applies custom className to the Card wrapper in full mode', () => {
      mockHookReturn.recommendations = createMockBatch([]);

      render(<RecommendationWidget className="custom-class" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('applies custom className to the wrapper div in compact mode', () => {
      mockHookReturn.recommendations = createMockBatch([]);

      const { container } = render(<RecommendationWidget compact className="compact-custom" />);

      // In compact mode the root element is a <div> with space-y-2 and the custom class
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('compact-custom');
    });
  });

  // --------------------------------------------------------------------------
  // RECOMMENDATION TYPES - ICON MAPPING
  // --------------------------------------------------------------------------

  describe('Recommendation types and icons', () => {
    const types = ['content', 'practice', 'review', 'assessment', 'break', 'goal'] as const;

    types.forEach((type) => {
      it(`renders a recommendation of type "${type}"`, () => {
        const rec = createMockRecommendation({
          id: `rec-${type}`,
          type,
          title: `${type} recommendation`,
        });
        mockHookReturn.recommendations = createMockBatch([rec]);

        render(<RecommendationWidget />);

        expect(screen.getByText(`${type} recommendation`)).toBeInTheDocument();
        // Type badge should render
        expect(screen.getByText(type)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // PRIORITY STYLES
  // --------------------------------------------------------------------------

  describe('Priority styles', () => {
    it('renders high priority recommendation with border styling', () => {
      const rec = createMockRecommendation({
        id: 'rec-high',
        title: 'High Priority',
        priority: 'high',
      });
      mockHookReturn.recommendations = createMockBatch([rec]);

      const { container } = render(<RecommendationWidget />);

      // The recommendation card should have the high priority class
      const recCard = container.querySelector('.border-l-red-500');
      expect(recCard).toBeTruthy();
    });

    it('renders medium priority recommendation with border styling', () => {
      const rec = createMockRecommendation({
        id: 'rec-med',
        title: 'Medium Priority',
        priority: 'medium',
      });
      mockHookReturn.recommendations = createMockBatch([rec]);

      const { container } = render(<RecommendationWidget />);

      const recCard = container.querySelector('.border-l-orange-500');
      expect(recCard).toBeTruthy();
    });

    it('renders low priority recommendation with border styling', () => {
      const rec = createMockRecommendation({
        id: 'rec-low',
        title: 'Low Priority',
        priority: 'low',
      });
      mockHookReturn.recommendations = createMockBatch([rec]);

      const { container } = render(<RecommendationWidget />);

      const recCard = container.querySelector('.border-l-blue-500');
      expect(recCard).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // TOTAL TIME BADGE
  // --------------------------------------------------------------------------

  describe('Total time badge', () => {
    it('does not show total time badge when totalEstimatedTime is 0', () => {
      mockHookReturn.recommendations = createMockBatch([], { totalEstimatedTime: 0 });

      render(<RecommendationWidget showTotalTime />);

      expect(screen.queryByText(/min total/)).not.toBeInTheDocument();
    });

    it('shows total time badge when totalEstimatedTime > 0', () => {
      const recs = [createMockRecommendation({ estimatedMinutes: 45 })];
      mockHookReturn.recommendations = createMockBatch(recs);

      render(<RecommendationWidget showTotalTime />);

      expect(screen.getByText('45 min total')).toBeInTheDocument();
    });
  });
});

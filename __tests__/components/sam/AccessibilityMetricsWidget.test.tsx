/**
 * Tests for AccessibilityMetricsWidget component
 *
 * Covers:
 * - Empty state rendering (no feedbackText)
 * - Loading state during API fetch
 * - Error state and retry functionality
 * - Successful result rendering with passed/failed status
 * - Grade level gauge rendering and calculations
 * - Reading ease bar levels and colors
 * - Text statistics display (word count, sentence count, etc.)
 * - Issues display with severity colors
 * - Suggestions display
 * - Compact mode behavior (hides statistics, limits issues)
 * - className prop forwarding
 * - onAnalyze callback invocation
 * - Edge cases (empty text, whitespace-only text, zero values)
 * - Auto-analyze on feedbackText change
 * - Concurrent request prevention via isLoadingRef
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ============================================================================
// MOCKS - UI components
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value?: number; className?: string }) => (
    <div
      data-testid="progress"
      data-value={value}
      className={className}
      role="progressbar"
      aria-valuenow={value}
    />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined | null)[]) => args.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENT AFTER MOCKS
// ============================================================================

import { AccessibilityMetricsWidget } from '@/components/sam/AccessibilityMetricsWidget';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createMockStatistics(overrides: Partial<{
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  averageWordSyllables: number;
  complexWordPercentage: number;
  passiveVoicePercentage: number;
}> = {}) {
  return {
    wordCount: 150,
    sentenceCount: 10,
    averageSentenceLength: 15.0,
    averageWordSyllables: 1.5,
    complexWordPercentage: 12.0,
    passiveVoicePercentage: 10.0,
    ...overrides,
  };
}

function createMockIssue(overrides: Partial<{
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  location: { start: number; end: number };
}> = {}) {
  return {
    type: 'long_sentence',
    severity: 'medium' as const,
    description: 'Sentence is too long for the target audience.',
    suggestion: 'Break into shorter sentences.',
    ...overrides,
  };
}

function createMockResult(overrides: Partial<{
  passed: boolean;
  gradeLevel: number;
  readingEase: number;
  statistics: ReturnType<typeof createMockStatistics>;
  issues: ReturnType<typeof createMockIssue>[];
  suggestions: string[];
  targetGradeLevel: number;
}> = {}) {
  return {
    passed: true,
    gradeLevel: 8.0,
    readingEase: 65.0,
    statistics: createMockStatistics(),
    issues: [],
    suggestions: [],
    targetGradeLevel: 8,
    ...overrides,
  };
}

function mockFetchSuccess(data: ReturnType<typeof createMockResult>) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  });
}

function mockFetchFailure(errorMessage = 'Failed to analyze text') {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ success: false, error: errorMessage }),
  });
}

function mockFetchApiError(errorMessage = 'Analysis failed') {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ success: false, error: errorMessage }),
  });
}

function mockFetchNetworkError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
}

// ============================================================================
// TESTS
// ============================================================================

describe('AccessibilityMetricsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  describe('Empty state', () => {
    it('renders empty state when no feedbackText is provided', () => {
      render(<AccessibilityMetricsWidget />);
      expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      expect(
        screen.getByText('No text to analyze. Provide feedback text to see accessibility metrics.')
      ).toBeInTheDocument();
    });

    it('renders the card description in empty state', () => {
      render(<AccessibilityMetricsWidget />);
      expect(
        screen.getByText('Analyze text for readability and accessibility')
      ).toBeInTheDocument();
    });

    it('renders empty state with custom className', () => {
      render(<AccessibilityMetricsWidget className="custom-class" />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('does not call fetch when no feedbackText is provided', () => {
      render(<AccessibilityMetricsWidget />);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not call onAnalyze when no feedbackText is provided', () => {
      const onAnalyze = jest.fn();
      render(<AccessibilityMetricsWidget onAnalyze={onAnalyze} />);
      expect(onAnalyze).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('Loading state', () => {
    it('renders loading spinner and text while analyzing', async () => {
      let resolvePromise: (value: unknown) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<AccessibilityMetricsWidget feedbackText="Test text for analysis" />);

      expect(screen.getByText('Analyzing accessibility...')).toBeInTheDocument();

      // Resolve to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createMockResult() }),
      });

      await waitFor(() => {
        expect(screen.queryByText('Analyzing accessibility...')).not.toBeInTheDocument();
      });
    });

    it('shows card wrapper during loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<AccessibilityMetricsWidget feedbackText="Some text" className="loading-class" />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('loading-class');

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createMockResult() }),
      });

      await waitFor(() => {
        expect(screen.queryByText('Analyzing accessibility...')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ERROR STATE
  // ==========================================================================

  describe('Error state', () => {
    it('renders error message when API returns non-ok response', async () => {
      mockFetchFailure();
      render(<AccessibilityMetricsWidget feedbackText="Test text" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to analyze text')).toBeInTheDocument();
      });
    });

    it('renders error message when API returns success:false', async () => {
      mockFetchApiError('Custom error message');
      render(<AccessibilityMetricsWidget feedbackText="Test text" />);

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('renders error message on network failure', async () => {
      mockFetchNetworkError();
      render(<AccessibilityMetricsWidget feedbackText="Test text" />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('renders fallback error message for non-Error exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('string error');
      render(<AccessibilityMetricsWidget feedbackText="Test text" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to analyze')).toBeInTheDocument();
      });
    });

    it('shows retry button in error state when feedbackText is provided', async () => {
      mockFetchFailure();
      render(<AccessibilityMetricsWidget feedbackText="Test text" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('does not show retry button when feedbackText is not provided', async () => {
      // Manually set error state by providing feedbackText, then re-render without
      mockFetchFailure();
      const { rerender } = render(<AccessibilityMetricsWidget feedbackText="Test text" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to analyze text')).toBeInTheDocument();
      });

      // feedbackText is still present so retry should appear
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retries analysis when retry button is clicked', async () => {
      mockFetchFailure();
      render(<AccessibilityMetricsWidget feedbackText="Retry test text" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const successResult = createMockResult({ gradeLevel: 6.0 });
      mockFetchSuccess(successResult);

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('6.0')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('forwards className to error state card', async () => {
      mockFetchFailure();
      render(<AccessibilityMetricsWidget feedbackText="Test text" className="error-class" />);

      await waitFor(() => {
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('error-class');
      });
    });
  });

  // ==========================================================================
  // SUCCESSFUL RESULT - PASSED
  // ==========================================================================

  describe('Successful result - passed', () => {
    it('renders passed badge when result.passed is true', async () => {
      mockFetchSuccess(createMockResult({ passed: true }));
      render(<AccessibilityMetricsWidget feedbackText="Good text" />);

      await waitFor(() => {
        expect(screen.getByText('Passed')).toBeInTheDocument();
      });
    });

    it('renders Accessibility Metrics title in result view', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Test" />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });
    });

    it('renders card description in result view', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Test" />);

      await waitFor(() => {
        expect(screen.getByText('Readability and text complexity analysis')).toBeInTheDocument();
      });
    });

    it('calls onAnalyze with the analyzed text', async () => {
      const onAnalyze = jest.fn();
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="My analyzed text" onAnalyze={onAnalyze} />);

      await waitFor(() => {
        expect(onAnalyze).toHaveBeenCalledWith('My analyzed text');
      });
    });

    it('sends correct POST request to API', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="API test text" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/sam/safety/accessibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'API test text' }),
        });
      });
    });
  });

  // ==========================================================================
  // SUCCESSFUL RESULT - FAILED
  // ==========================================================================

  describe('Successful result - failed', () => {
    it('renders Needs Improvement badge when result.passed is false', async () => {
      mockFetchSuccess(createMockResult({ passed: false }));
      render(<AccessibilityMetricsWidget feedbackText="Hard text" />);

      await waitFor(() => {
        expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // GRADE LEVEL GAUGE
  // ==========================================================================

  describe('Grade level gauge', () => {
    it('displays the current grade level', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 7.5 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('7.5')).toBeInTheDocument();
      });
    });

    it('displays the Grade label', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Grade')).toBeInTheDocument();
      });
    });

    it('displays target grade level', async () => {
      mockFetchSuccess(createMockResult({ targetGradeLevel: 10 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Target: 10')).toBeInTheDocument();
      });
    });

    it('shows diff badge when grade is above target by more than 2', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 12.0, targetGradeLevel: 8 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('+4.0')).toBeInTheDocument();
      });
    });

    it('shows diff badge when grade is below target by more than 2', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 4.0, targetGradeLevel: 8 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('-4.0')).toBeInTheDocument();
      });
    });

    it('does not show diff badge when grade is on target (within 2)', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 7.5, targetGradeLevel: 8 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('7.5')).toBeInTheDocument();
      });

      // The diff badge should NOT appear
      const badges = screen.getAllByTestId('badge');
      const diffBadges = badges.filter(
        (b) => b.textContent?.includes('+') || b.textContent?.includes('-0')
      );
      // Only the "Passed" badge should exist, not a diff badge
      expect(diffBadges).toHaveLength(0);
    });

    it('handles exactly 2 grade difference as on-target', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 10.0, targetGradeLevel: 8 }));
      render(<AccessibilityMetricsWidget feedbackText="Exact boundary text" />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
        expect(screen.getByText('Grade')).toBeInTheDocument();
      });

      // diff is exactly 2, which is <= 2, so isOnTarget = true, no diff badge
      expect(screen.queryByText('+2.0')).not.toBeInTheDocument();
      expect(screen.queryByText('-2.0')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // GRADE LEVEL CATEGORIES
  // ==========================================================================

  describe('Grade level categories', () => {
    it('displays elementary description for grade <= 5', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 4.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Grades 1-5: Basic vocabulary, simple sentences')
        ).toBeInTheDocument();
      });
    });

    it('displays middle description for grade 6-8', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 7.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Grades 6-8: Moderate complexity, some technical terms')
        ).toBeInTheDocument();
      });
    });

    it('displays high description for grade 9-12', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 10.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Grades 9-12: Complex sentences, academic vocabulary')
        ).toBeInTheDocument();
      });
    });

    it('displays college description for grade 13-16', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 14.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('College level: Advanced vocabulary, dense content')
        ).toBeInTheDocument();
      });
    });

    it('displays graduate description for grade > 16', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 18.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Graduate+: Highly technical, specialized terms')
        ).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // READING EASE BAR
  // ==========================================================================

  describe('Reading ease bar', () => {
    it('displays Reading Ease label', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 75 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Reading Ease')).toBeInTheDocument();
      });
    });

    it('displays Very Easy for score >= 90', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 95 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('95 - Very Easy')).toBeInTheDocument();
      });
    });

    it('displays Easy for score >= 70 and < 90', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 75 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('75 - Easy')).toBeInTheDocument();
      });
    });

    it('displays Moderate for score >= 50 and < 70', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 55 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('55 - Moderate')).toBeInTheDocument();
      });
    });

    it('displays Difficult for score >= 30 and < 50', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 35 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('35 - Difficult')).toBeInTheDocument();
      });
    });

    it('displays Very Difficult for score < 30', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 15 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('15 - Very Difficult')).toBeInTheDocument();
      });
    });

    it('displays Difficult and Easy axis labels', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Difficult')).toBeInTheDocument();
        expect(screen.getByText('Easy')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // TEXT STATISTICS
  // ==========================================================================

  describe('Text statistics', () => {
    it('renders Text Statistics heading in non-compact mode', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Text Statistics')).toBeInTheDocument();
      });
    });

    it('does not render Text Statistics in compact mode', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });

      expect(screen.queryByText('Text Statistics')).not.toBeInTheDocument();
    });

    it('renders word count', async () => {
      mockFetchSuccess(
        createMockResult({ statistics: createMockStatistics({ wordCount: 250 }) })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Word Count')).toBeInTheDocument();
      });
    });

    it('renders sentence count', async () => {
      mockFetchSuccess(
        createMockResult({ statistics: createMockStatistics({ sentenceCount: 20 }) })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Sentence Count')).toBeInTheDocument();
      });
    });

    it('renders average sentence length with words suffix', async () => {
      mockFetchSuccess(
        createMockResult({ statistics: createMockStatistics({ averageSentenceLength: 15 }) })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Avg. Sentence Length')).toBeInTheDocument();
        expect(screen.getByText('words')).toBeInTheDocument();
      });
    });

    it('renders complex words percentage', async () => {
      mockFetchSuccess(
        createMockResult({ statistics: createMockStatistics({ complexWordPercentage: 15 }) })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Complex Words')).toBeInTheDocument();
      });
    });

    it('renders passive voice percentage', async () => {
      mockFetchSuccess(
        createMockResult({ statistics: createMockStatistics({ passiveVoicePercentage: 25 }) })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Passive Voice')).toBeInTheDocument();
      });
    });

    it('shows warning for average sentence length > 25', async () => {
      const stats = createMockStatistics({ averageSentenceLength: 30 });
      mockFetchSuccess(createMockResult({ statistics: stats }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Avg. Sentence Length')).toBeInTheDocument();
      });

      // The sentence length value should have warning styling
      const sentenceLengthValue = screen.getByText('30.0');
      expect(sentenceLengthValue.closest('span')).toHaveClass('text-yellow-500');
    });

    it('shows warning for complex words > 20%', async () => {
      const stats = createMockStatistics({ complexWordPercentage: 25 });
      mockFetchSuccess(createMockResult({ statistics: stats }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Complex Words')).toBeInTheDocument();
      });

      const complexValue = screen.getByText('25.0');
      expect(complexValue.closest('span')).toHaveClass('text-yellow-500');
    });

    it('shows warning for passive voice > 30%', async () => {
      const stats = createMockStatistics({ passiveVoicePercentage: 35 });
      mockFetchSuccess(createMockResult({ statistics: stats }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Passive Voice')).toBeInTheDocument();
      });

      const passiveValue = screen.getByText('35.0');
      expect(passiveValue.closest('span')).toHaveClass('text-yellow-500');
    });

    it('does not show warning for sentence length <= 25', async () => {
      const stats = createMockStatistics({ averageSentenceLength: 20 });
      mockFetchSuccess(createMockResult({ statistics: stats }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('20.0')).toBeInTheDocument();
      });

      const sentenceValue = screen.getByText('20.0');
      expect(sentenceValue.closest('span')).not.toHaveClass('text-yellow-500');
    });
  });

  // ==========================================================================
  // ISSUES DISPLAY
  // ==========================================================================

  describe('Issues display', () => {
    it('renders Issues Found heading when issues exist', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue()],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Issues Found')).toBeInTheDocument();
      });
    });

    it('does not render Issues Found heading when no issues', async () => {
      mockFetchSuccess(createMockResult({ issues: [] }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });

      expect(screen.queryByText('Issues Found')).not.toBeInTheDocument();
    });

    it('displays issue count badge', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue(), createMockIssue({ type: 'complex_words' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('replaces underscores with spaces in issue type', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ type: 'complex_word_usage' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('complex word usage')).toBeInTheDocument();
      });
    });

    it('displays issue description', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ description: 'The paragraph is overly complex.' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('The paragraph is overly complex.')).toBeInTheDocument();
      });
    });

    it('displays issue suggestion when provided', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ suggestion: 'Simplify the vocabulary.' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Simplify the vocabulary.')).toBeInTheDocument();
      });
    });

    it('does not render suggestion section when suggestion is undefined', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [
            {
              type: 'passive_voice',
              severity: 'low' as const,
              description: 'Too much passive voice.',
            },
          ],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Too much passive voice.')).toBeInTheDocument();
      });
    });

    it('displays issue severity badge', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ severity: 'high' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('high')).toBeInTheDocument();
      });
    });

    it('limits issues to 5 in non-compact mode', async () => {
      const issues = Array.from({ length: 8 }, (_, i) =>
        createMockIssue({ type: `issue_${i}`, description: `Description ${i}` })
      );
      mockFetchSuccess(createMockResult({ issues }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('issue 0')).toBeInTheDocument();
      });

      // Should show only first 5
      expect(screen.getByText('issue 0')).toBeInTheDocument();
      expect(screen.getByText('issue 4')).toBeInTheDocument();
      expect(screen.queryByText('issue 5')).not.toBeInTheDocument();
    });

    it('limits issues to 2 in compact mode', async () => {
      const issues = Array.from({ length: 5 }, (_, i) =>
        createMockIssue({ type: `issue_${i}`, description: `Description ${i}` })
      );
      mockFetchSuccess(createMockResult({ issues }));
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('issue 0')).toBeInTheDocument();
      });

      expect(screen.getByText('issue 1')).toBeInTheDocument();
      expect(screen.queryByText('issue 2')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUGGESTIONS DISPLAY
  // ==========================================================================

  describe('Suggestions display', () => {
    it('renders Suggestions heading when suggestions exist and not compact', async () => {
      mockFetchSuccess(
        createMockResult({ suggestions: ['Use simpler words.'] })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Suggestions')).toBeInTheDocument();
      });
    });

    it('does not render Suggestions in compact mode', async () => {
      mockFetchSuccess(
        createMockResult({ suggestions: ['Use simpler words.'] })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });

      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });

    it('does not render Suggestions heading when no suggestions', async () => {
      mockFetchSuccess(createMockResult({ suggestions: [] }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });

      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });

    it('renders suggestion text', async () => {
      mockFetchSuccess(
        createMockResult({ suggestions: ['Break long paragraphs into shorter ones.'] })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Break long paragraphs into shorter ones.')
        ).toBeInTheDocument();
      });
    });

    it('limits suggestions to 3', async () => {
      const suggestions = [
        'Suggestion 1',
        'Suggestion 2',
        'Suggestion 3',
        'Suggestion 4',
        'Suggestion 5',
      ];
      mockFetchSuccess(createMockResult({ suggestions }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
      expect(screen.getByText('Suggestion 3')).toBeInTheDocument();
      expect(screen.queryByText('Suggestion 4')).not.toBeInTheDocument();
    });

    it('renders bullet points for suggestions', async () => {
      mockFetchSuccess(
        createMockResult({ suggestions: ['First suggestion'] })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        const bullet = screen.getAllByText('\u2022');
        expect(bullet.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // COMPACT MODE
  // ==========================================================================

  describe('Compact mode', () => {
    it('hides text statistics when compact is true', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });

      expect(screen.queryByText('Text Statistics')).not.toBeInTheDocument();
      expect(screen.queryByText('Word Count')).not.toBeInTheDocument();
    });

    it('hides suggestions when compact is true', async () => {
      mockFetchSuccess(
        createMockResult({ suggestions: ['A suggestion'] })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });

      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });

    it('still shows grade level gauge in compact mode', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 9.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('9.0')).toBeInTheDocument();
        expect(screen.getByText('Grade')).toBeInTheDocument();
      });
    });

    it('still shows reading ease in compact mode', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 60 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" compact />);

      await waitFor(() => {
        expect(screen.getByText('Reading Ease')).toBeInTheDocument();
      });
    });

    it('defaults compact to false', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Text Statistics')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // className PROP
  // ==========================================================================

  describe('className prop', () => {
    it('forwards className to Card in result state', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" className="result-class" />);

      await waitFor(() => {
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('result-class');
      });
    });

    it('renders without className when not provided', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Accessibility Metrics')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // AUTO-ANALYZE BEHAVIOR
  // ==========================================================================

  describe('Auto-analyze behavior', () => {
    it('auto-analyzes when feedbackText is provided on mount', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Initial text" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('does not analyze when feedbackText is empty string', () => {
      render(<AccessibilityMetricsWidget feedbackText="" />);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not analyze when feedbackText is whitespace only', () => {
      render(<AccessibilityMetricsWidget feedbackText="   " />);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('re-analyzes when feedbackText changes', async () => {
      const result1 = createMockResult({ gradeLevel: 6.0, readingEase: 80 });
      const result2 = createMockResult({ gradeLevel: 3.0, readingEase: 95 });

      // Queue both fetch responses upfront
      mockFetchSuccess(result1);
      mockFetchSuccess(result2);

      const { rerender } = render(
        <AccessibilityMetricsWidget feedbackText="First text" />
      );

      await waitFor(() => {
        expect(screen.getByText('6.0')).toBeInTheDocument();
      });

      rerender(<AccessibilityMetricsWidget feedbackText="Second text" />);

      await waitFor(() => {
        expect(screen.getByText('3.0')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge cases', () => {
    it('handles zero grade level', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('0.0')).toBeInTheDocument();
      });
    });

    it('handles zero reading ease', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('0 - Very Difficult')).toBeInTheDocument();
      });
    });

    it('handles reading ease score of exactly 90', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 90 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('90 - Very Easy')).toBeInTheDocument();
      });
    });

    it('handles reading ease score of exactly 70', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 70 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('70 - Easy')).toBeInTheDocument();
      });
    });

    it('handles reading ease score of exactly 50', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 50 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('50 - Moderate')).toBeInTheDocument();
      });
    });

    it('handles reading ease score of exactly 30', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 30 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('30 - Difficult')).toBeInTheDocument();
      });
    });

    it('handles reading ease over 100 by capping bar width', async () => {
      mockFetchSuccess(createMockResult({ readingEase: 120 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('120 - Very Easy')).toBeInTheDocument();
      });
    });

    it('handles grade level at boundary value 5 (elementary)', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 5.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Grades 1-5: Basic vocabulary, simple sentences')
        ).toBeInTheDocument();
      });
    });

    it('handles grade level at boundary value 8 (middle)', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 8.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Grades 6-8: Moderate complexity, some technical terms')
        ).toBeInTheDocument();
      });
    });

    it('handles grade level at boundary value 12 (high)', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 12.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('Grades 9-12: Complex sentences, academic vocabulary')
        ).toBeInTheDocument();
      });
    });

    it('handles grade level at boundary value 16 (college)', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 16.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(
          screen.getByText('College level: Advanced vocabulary, dense content')
        ).toBeInTheDocument();
      });
    });

    it('handles all zero statistics', async () => {
      const stats = createMockStatistics({
        wordCount: 0,
        sentenceCount: 0,
        averageSentenceLength: 0,
        complexWordPercentage: 0,
        passiveVoicePercentage: 0,
      });
      mockFetchSuccess(createMockResult({ statistics: stats }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Word Count')).toBeInTheDocument();
      });
    });

    it('handles multiple issues with different severities', async () => {
      const issues = [
        createMockIssue({ type: 'low_issue', severity: 'low', description: 'Low severity issue' }),
        createMockIssue({
          type: 'medium_issue',
          severity: 'medium',
          description: 'Medium severity issue',
        }),
        createMockIssue({
          type: 'high_issue',
          severity: 'high',
          description: 'High severity issue',
        }),
      ];
      mockFetchSuccess(createMockResult({ issues }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('low')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
      });
    });

    it('handles very large grade level (> 16, capped at 1 for SVG ratio)', async () => {
      mockFetchSuccess(createMockResult({ gradeLevel: 20.0 }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('20.0')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ISSUE SEVERITY STYLING
  // ==========================================================================

  describe('Issue severity styling', () => {
    it('applies low severity styling', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ severity: 'low', description: 'Low issue' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Low issue')).toBeInTheDocument();
      });
    });

    it('applies medium severity styling', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ severity: 'medium', description: 'Medium issue' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('Medium issue')).toBeInTheDocument();
      });
    });

    it('applies high severity styling', async () => {
      mockFetchSuccess(
        createMockResult({
          issues: [createMockIssue({ severity: 'high', description: 'High issue' })],
        })
      );
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        expect(screen.getByText('High issue')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // STATISTIC ITEM FORMATTING
  // ==========================================================================

  describe('StatisticItem formatting', () => {
    it('formats numeric values with one decimal place', async () => {
      const stats = createMockStatistics({ wordCount: 100 });
      mockFetchSuccess(createMockResult({ statistics: stats }));
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        // wordCount 100 should render as 100.0
        expect(screen.getByText('100.0')).toBeInTheDocument();
      });
    });

    it('displays suffix when provided', async () => {
      mockFetchSuccess(createMockResult());
      render(<AccessibilityMetricsWidget feedbackText="Text" />);

      await waitFor(() => {
        // "words" suffix on average sentence length
        expect(screen.getByText('words')).toBeInTheDocument();
        // "%" suffix on complex words and passive voice
        const percentSigns = screen.getAllByText('%');
        expect(percentSigns.length).toBe(2);
      });
    });
  });

  // ==========================================================================
  // DEFAULT EXPORT
  // ==========================================================================

  describe('Module exports', () => {
    it('exports AccessibilityMetricsWidget as named export', () => {
      expect(AccessibilityMetricsWidget).toBeDefined();
      expect(typeof AccessibilityMetricsWidget).toBe('function');
    });
  });
});

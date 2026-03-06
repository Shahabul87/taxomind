/**
 * Tests for DiscouragingLanguageAlert component
 *
 * Covers: hidden by default, loading state, error state, all-clear state,
 * discouraging language found state, severity levels, suggestions,
 * dismiss action, compact mode, score display, className prop, category summary,
 * API request details, and callback invocation.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

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
    children: React.ReactNode; onClick?: () => void; disabled?: boolean;
    variant?: string; size?: string; className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value?: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} role="progressbar" aria-valuenow={value} />
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

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) => (
    <div data-testid="alert" role="alert" className={className} data-variant={variant}>{children}</div>
  ),
  AlertTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h5 data-testid="alert-title" className={className}>{children}</h5>
  ),
  AlertDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="alert-description" className={className}>{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Import the component under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { DiscouragingLanguageAlert } from '@/components/sam/DiscouragingLanguageAlert';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createMatch(overrides: Record<string, unknown> = {}) {
  return {
    phrase: 'you are terrible',
    category: 'personal_attack' as const,
    severity: 'high' as const,
    position: { start: 0, end: 17 },
    alternative: 'Consider providing specific areas for improvement',
    ...overrides,
  };
}

function createResult(overrides: Record<string, unknown> = {}) {
  const defaults = {
    found: true,
    matches: [createMatch()],
    score: 35,
    categoryCounts: {
      absolute_negative: 0,
      personal_attack: 1,
      dismissive: 0,
      comparing_negatively: 0,
      hopelessness: 0,
      labeling: 0,
      sarcasm: 0,
      condescending: 0,
    },
  };
  return { ...defaults, ...overrides };
}

function createApiSuccess(resultOverrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: () => Promise.resolve({ success: true, data: createResult(resultOverrides) }),
  };
}

function createApiAllClear() {
  return {
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: createResult({
        found: false,
        matches: [],
        score: 95,
        categoryCounts: {
          absolute_negative: 0,
          personal_attack: 0,
          dismissive: 0,
          comparing_negatively: 0,
          hopelessness: 0,
          labeling: 0,
          sarcasm: 0,
          condescending: 0,
        },
      }),
    }),
  };
}

function createApiError(message = 'Server error') {
  return {
    ok: false,
    json: () => Promise.resolve({ error: message }),
  };
}

function createApiDataError(message = 'Analysis failed') {
  return {
    ok: true,
    json: () => Promise.resolve({ success: false, error: message }),
  };
}

// ---------------------------------------------------------------------------
// Helper to render and wait for async effects
// ---------------------------------------------------------------------------

async function renderComponent(props: Record<string, unknown> = {}) {
  const defaultProps = {
    feedbackText: 'you are terrible at this',
    ...props,
  };

  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<DiscouragingLanguageAlert {...defaultProps} />);
  });
  return result!;
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

describe('DiscouragingLanguageAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // Hidden by default (no feedbackText)
  // ========================================================================

  describe('hidden by default', () => {
    it('renders nothing when no feedbackText is provided', () => {
      const { container } = render(<DiscouragingLanguageAlert />);
      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when feedbackText is undefined', () => {
      const { container } = render(<DiscouragingLanguageAlert feedbackText={undefined} />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ========================================================================
  // Loading state
  // ========================================================================

  describe('loading state', () => {
    it('shows loading indicator while analyzing', async () => {
      let resolvePromise!: (val: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      await act(async () => {
        render(<DiscouragingLanguageAlert feedbackText="test text" />);
      });

      expect(screen.getByText('Checking language safety...')).toBeInTheDocument();

      // Resolve so the effect completes and we avoid act warnings
      await act(async () => {
        resolvePromise(createApiAllClear());
      });
    });
  });

  // ========================================================================
  // Error state
  // ========================================================================

  describe('error state', () => {
    it('shows error message when API response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(createApiError());
      await renderComponent();
      expect(screen.getByText('Failed to analyze text')).toBeInTheDocument();
    });

    it('shows error when data.success is false', async () => {
      mockFetch.mockResolvedValueOnce(createApiDataError('Custom error message'));
      await renderComponent();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('shows Analysis Failed title on error', async () => {
      mockFetch.mockResolvedValueOnce(createApiError());
      await renderComponent();
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    });

    it('shows retry button when feedbackText exists and error occurs', async () => {
      mockFetch.mockResolvedValueOnce(createApiError());
      await renderComponent();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retries analysis when retry button is clicked', async () => {
      mockFetch.mockResolvedValueOnce(createApiError());
      await renderComponent();

      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await act(async () => {
        fireEvent.click(screen.getByText('Retry'));
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('shows generic error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await renderComponent();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows fallback message for non-Error throws', async () => {
      mockFetch.mockRejectedValueOnce('unknown failure');
      await renderComponent();
      expect(screen.getByText('Failed to analyze')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // All clear (no discouraging language)
  // ========================================================================

  describe('all clear state', () => {
    it('shows passed message when no discouraging language found', async () => {
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await renderComponent();
      expect(screen.getByText('Language Check Passed')).toBeInTheDocument();
    });

    it('shows supportive description when check passes', async () => {
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await renderComponent();
      expect(
        screen.getByText('No discouraging language detected. The feedback is constructive and supportive.')
      ).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Alert message when discouraging language found
  // ========================================================================

  describe('alert message', () => {
    it('shows Language Safety Alert title', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText('Language Safety Alert')).toBeInTheDocument();
    });

    it('shows issue count badge for single issue', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText('1 Issue Found')).toBeInTheDocument();
    });

    it('shows plural issue count for multiple issues', async () => {
      const matches = [
        createMatch({ phrase: 'terrible', severity: 'high' }),
        createMatch({ phrase: 'hopeless', category: 'hopelessness', severity: 'medium' }),
      ];
      mockFetch.mockResolvedValueOnce(createApiSuccess({
        matches,
        categoryCounts: {
          absolute_negative: 0,
          personal_attack: 1,
          dismissive: 0,
          comparing_negatively: 0,
          hopelessness: 1,
          labeling: 0,
          sarcasm: 0,
          condescending: 0,
        },
      }));
      await renderComponent();
      expect(screen.getByText('2 Issues Found')).toBeInTheDocument();
    });

    it('shows critical description when critical issues exist', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'critical' })] })
      );
      await renderComponent();
      expect(
        screen.getByText('Critical issues detected that may negatively impact students.')
      ).toBeInTheDocument();
    });

    it('shows non-critical description when no critical issues', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'medium' })] })
      );
      await renderComponent();
      expect(
        screen.getByText('Some language patterns may be discouraging to students.')
      ).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Suggestion display
  // ========================================================================

  describe('suggestion display', () => {
    it('shows the matched phrase in quotes', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      // The component renders &quot;{match.phrase}&quot; which becomes "phrase"
      expect(screen.getByText(/you are terrible/)).toBeInTheDocument();
    });

    it('shows the alternative suggestion text', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText(/Consider providing specific areas for improvement/)).toBeInTheDocument();
    });

    it('shows Try instead label with alternative', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText('Try instead:')).toBeInTheDocument();
    });

    it('does not show alternative when none is provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ alternative: undefined })] })
      );
      await renderComponent();
      expect(screen.queryByText('Try instead:')).not.toBeInTheDocument();
    });

    it('does not show alternative in compact mode', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent({ compact: true });
      expect(screen.queryByText('Try instead:')).not.toBeInTheDocument();
    });

    it('shows recommendation section', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText('Recommendation')).toBeInTheDocument();
      expect(
        screen.getByText(/Review the highlighted phrases and consider using the suggested alternatives/)
      ).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Severity levels
  // ========================================================================

  describe('severity levels', () => {
    it('displays critical severity badge', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'critical' })] })
      );
      await renderComponent();
      const badges = screen.getAllByTestId('badge');
      const severityBadge = badges.find(b => b.textContent === 'critical');
      expect(severityBadge).toBeTruthy();
    });

    it('displays high severity badge', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'high' })] })
      );
      await renderComponent();
      const badges = screen.getAllByTestId('badge');
      const severityBadge = badges.find(b => b.textContent === 'high');
      expect(severityBadge).toBeTruthy();
    });

    it('displays medium severity badge', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'medium' })] })
      );
      await renderComponent();
      const badges = screen.getAllByTestId('badge');
      const severityBadge = badges.find(b => b.textContent === 'medium');
      expect(severityBadge).toBeTruthy();
    });

    it('displays low severity badge', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'low' })] })
      );
      await renderComponent();
      const badges = screen.getAllByTestId('badge');
      const severityBadge = badges.find(b => b.textContent === 'low');
      expect(severityBadge).toBeTruthy();
    });

    it('shows category label for personal attack', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ category: 'personal_attack' })] })
      );
      await renderComponent();
      expect(screen.getByText('Personal Attack')).toBeInTheDocument();
    });

    it('shows category label for dismissive', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ category: 'dismissive' })] })
      );
      await renderComponent();
      expect(screen.getByText('Dismissive')).toBeInTheDocument();
    });

    it('shows category label for sarcasm', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ category: 'sarcasm' })] })
      );
      await renderComponent();
      expect(screen.getByText('Sarcasm')).toBeInTheDocument();
    });

    it('sorts matches with critical first', async () => {
      const matches = [
        createMatch({ phrase: 'low phrase', severity: 'low', category: 'dismissive' }),
        createMatch({ phrase: 'critical phrase', severity: 'critical', category: 'personal_attack' }),
        createMatch({ phrase: 'medium phrase', severity: 'medium', category: 'sarcasm' }),
      ];
      mockFetch.mockResolvedValueOnce(createApiSuccess({
        matches,
        categoryCounts: {
          absolute_negative: 0,
          personal_attack: 1,
          dismissive: 1,
          comparing_negatively: 0,
          hopelessness: 0,
          labeling: 0,
          sarcasm: 1,
          condescending: 0,
        },
      }));
      await renderComponent();

      // The phrases should appear in severity order: critical, low, medium
      const phraseElements = screen.getAllByText(/phrase/);
      const phrases = phraseElements.map(el => el.textContent);
      // Critical should come before low and medium
      const criticalIdx = phrases.findIndex(t => t?.includes('critical'));
      const lowIdx = phrases.findIndex(t => t?.includes('low'));
      expect(criticalIdx).toBeLessThan(lowIdx);
    });
  });

  // ========================================================================
  // Dismiss action
  // ========================================================================

  describe('dismiss action', () => {
    it('shows dismiss button when dismissible is true and language found', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent({ dismissible: true });
      // The dismiss button has an X icon inside; find buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders nothing after dismiss when dismissible', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      const { container } = await renderComponent({ dismissible: true });

      // Find the dismiss button (it uses variant="ghost" and size="icon")
      const ghostButtons = screen.getAllByRole('button').filter(
        btn => btn.getAttribute('data-variant') === 'ghost'
      );
      expect(ghostButtons.length).toBeGreaterThanOrEqual(1);

      await act(async () => {
        fireEvent.click(ghostButtons[0]);
      });

      expect(container.innerHTML).toBe('');
    });

    it('shows dismiss button on all-clear when dismissible', async () => {
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await renderComponent({ dismissible: true });
      const buttons = screen.getAllByRole('button');
      const ghostButtons = buttons.filter(b => b.getAttribute('data-variant') === 'ghost');
      expect(ghostButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders nothing after dismissing all-clear alert', async () => {
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      const { container } = await renderComponent({ dismissible: true });

      const ghostButtons = screen.getAllByRole('button').filter(
        b => b.getAttribute('data-variant') === 'ghost'
      );

      await act(async () => {
        fireEvent.click(ghostButtons[0]);
      });

      expect(container.innerHTML).toBe('');
    });

    it('does not show dismiss button when dismissible is false', async () => {
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await renderComponent({ dismissible: false });
      const buttons = screen.queryAllByRole('button');
      const ghostButtons = buttons.filter(b => b.getAttribute('data-variant') === 'ghost');
      expect(ghostButtons.length).toBe(0);
    });
  });

  // ========================================================================
  // Score display
  // ========================================================================

  describe('score display', () => {
    it('shows score value when showScore is true (default)', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 35 }));
      await renderComponent();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });

    it('shows Safety Score label', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText('Safety Score')).toBeInTheDocument();
    });

    it('shows Higher is better hint', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(screen.getByText('Higher is better')).toBeInTheDocument();
    });

    it('does not show score when showScore is false', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 35 }));
      await renderComponent({ showScore: false });
      expect(screen.queryByText('Safety Score')).not.toBeInTheDocument();
    });

    it('shows Excellent label for score >= 80', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 85 }));
      await renderComponent();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('shows Good label for score >= 60', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 65 }));
      await renderComponent();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('shows Fair label for score >= 40', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 45 }));
      await renderComponent();
      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('shows Poor label for score >= 20', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 25 }));
      await renderComponent();
      expect(screen.getByText('Poor')).toBeInTheDocument();
    });

    it('shows Critical label for score < 20', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({ score: 10 }));
      await renderComponent();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Category summary
  // ========================================================================

  describe('category summary', () => {
    it('shows category badge with count', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({
        categoryCounts: {
          absolute_negative: 0,
          personal_attack: 2,
          dismissive: 1,
          comparing_negatively: 0,
          hopelessness: 0,
          labeling: 0,
          sarcasm: 0,
          condescending: 0,
        },
      }));
      await renderComponent();
      expect(screen.getByText(/Personal Attack: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Dismissive: 1/)).toBeInTheDocument();
    });

    it('does not show zero-count categories', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess({
        categoryCounts: {
          absolute_negative: 0,
          personal_attack: 1,
          dismissive: 0,
          comparing_negatively: 0,
          hopelessness: 0,
          labeling: 0,
          sarcasm: 0,
          condescending: 0,
        },
      }));
      await renderComponent();
      expect(screen.queryByText(/Dismissive:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sarcasm:/)).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // Compact mode
  // ========================================================================

  describe('compact mode', () => {
    it('limits displayed matches to 3 in compact mode', async () => {
      const matches = Array.from({ length: 5 }, (_, i) =>
        createMatch({
          phrase: `phrase-${i}`,
          severity: 'medium',
          category: 'dismissive',
        })
      );
      mockFetch.mockResolvedValueOnce(createApiSuccess({ matches }));
      await renderComponent({ compact: true });

      // Should show 3 matches and an overflow message
      expect(screen.getByText(/And 2 more issues/)).toBeInTheDocument();
    });

    it('does not show overflow text when matches fit in compact', async () => {
      const matches = [createMatch(), createMatch({ phrase: 'bad' })];
      mockFetch.mockResolvedValueOnce(createApiSuccess({ matches }));
      await renderComponent({ compact: true });
      expect(screen.queryByText(/more issues/)).not.toBeInTheDocument();
    });

    it('limits displayed matches to 10 in full mode', async () => {
      const matches = Array.from({ length: 12 }, (_, i) =>
        createMatch({
          phrase: `phrase-${i}`,
          severity: 'low',
          category: 'dismissive',
        })
      );
      mockFetch.mockResolvedValueOnce(createApiSuccess({ matches }));
      await renderComponent({ compact: false });
      expect(screen.getByText(/And 2 more issues/)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // className prop
  // ========================================================================

  describe('className prop', () => {
    it('applies className to card when language found', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent({ className: 'custom-test-class' });
      expect(screen.getByTestId('card')).toHaveClass('custom-test-class');
    });

    it('applies className to alert when all clear', async () => {
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await renderComponent({ className: 'clear-class' });
      expect(screen.getByTestId('alert')).toHaveClass('clear-class');
    });

    it('applies className to alert on error', async () => {
      mockFetch.mockResolvedValueOnce(createApiError());
      await renderComponent({ className: 'error-class' });
      expect(screen.getByTestId('alert')).toHaveClass('error-class');
    });

    it('applies className to card during loading', async () => {
      let resolvePromise!: (val: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      await act(async () => {
        render(<DiscouragingLanguageAlert feedbackText="test" className="loading-class" />);
      });

      expect(screen.getByTestId('card')).toHaveClass('loading-class');

      await act(async () => {
        resolvePromise(createApiAllClear());
      });
    });
  });

  // ========================================================================
  // API request details
  // ========================================================================

  describe('API request', () => {
    it('sends POST to the correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sam/safety/discouraging-language',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('sends the feedbackText in the request body', async () => {
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent({ feedbackText: 'you should give up' });
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.text).toBe('you should give up');
    });

    it('does not make an API call when feedbackText is empty string', async () => {
      await act(async () => {
        render(<DiscouragingLanguageAlert feedbackText="" />);
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not make an API call when feedbackText is whitespace only', async () => {
      await act(async () => {
        render(<DiscouragingLanguageAlert feedbackText="   " />);
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Callback invocation
  // ========================================================================

  describe('onAnalyze callback', () => {
    it('calls onAnalyze with the result data on success', async () => {
      const onAnalyze = jest.fn();
      mockFetch.mockResolvedValueOnce(createApiSuccess());
      await renderComponent({ onAnalyze });
      expect(onAnalyze).toHaveBeenCalledTimes(1);
      expect(onAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({ found: true, score: 35 })
      );
    });

    it('does not call onAnalyze on API failure', async () => {
      const onAnalyze = jest.fn();
      mockFetch.mockResolvedValueOnce(createApiError());
      await renderComponent({ onAnalyze });
      expect(onAnalyze).not.toHaveBeenCalled();
    });

    it('calls onAnalyze with all-clear result', async () => {
      const onAnalyze = jest.fn();
      mockFetch.mockResolvedValueOnce(createApiAllClear());
      await renderComponent({ onAnalyze });
      expect(onAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({ found: false, score: 95 })
      );
    });
  });

  // ========================================================================
  // Border styling for critical issues
  // ========================================================================

  describe('critical border styling', () => {
    it('applies red border class to card when critical issues exist', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'critical' })] })
      );
      await renderComponent();
      expect(screen.getByTestId('card')).toHaveClass('border-red-500/30');
    });

    it('does not apply red border when no critical issues', async () => {
      mockFetch.mockResolvedValueOnce(
        createApiSuccess({ matches: [createMatch({ severity: 'medium' })] })
      );
      await renderComponent();
      expect(screen.getByTestId('card')).not.toHaveClass('border-red-500/30');
    });
  });
});

/**
 * Tests for MetacognitionPanel component
 *
 * Covers: rendering, phase selection, reflection prompts, response handling,
 * confidence ratings, submit flow, analysis display, cognitive load gauge,
 * study habits, strategy cards, awareness rings, compact mode, error states,
 * loading states, edge cases, and callback invocations.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS - must come before component import
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
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="card-description" className={className}>{children}</p>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
      disabled={disabled as boolean | undefined}
      data-variant={variant}
      data-size={size}
      className={className as string | undefined}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} role="progressbar" aria-valuenow={value} />
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, className }: {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    placeholder?: string;
    className?: string;
  }) => (
    <textarea
      data-testid="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) => classes.filter(Boolean).join(' '),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ============================================================================
// IMPORT UNDER TEST
// ============================================================================

import { MetacognitionPanel } from '@/components/sam/MetacognitionPanel';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createMockAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    overallAwareness: 75,
    selfRegulation: 68,
    strategicPlanning: 82,
    cognitiveLoad: {
      level: 'optimal' as const,
      intrinsicLoad: 45,
      extraneousLoad: 20,
      germaneLoad: 60,
      overallScore: 55,
      recommendations: ['Break complex topics into smaller chunks', 'Use visual aids'],
    },
    habits: [
      {
        id: 'habit-1',
        name: 'Active Recall',
        frequency: 'daily' as const,
        effectiveness: 85,
        trend: 'improving' as const,
        lastPracticed: '2026-03-04T10:00:00Z',
      },
      {
        id: 'habit-2',
        name: 'Spaced Repetition',
        frequency: 'weekly' as const,
        effectiveness: 70,
        trend: 'stable' as const,
      },
      {
        id: 'habit-3',
        name: 'Note Taking',
        frequency: 'occasionally' as const,
        effectiveness: 50,
        trend: 'declining' as const,
      },
    ],
    recommendedStrategies: [
      {
        id: 'strat-1',
        name: 'Elaborative Interrogation',
        description: 'Ask why and how questions while studying',
        suitability: 90,
        evidenceStrength: 'strong' as const,
        timeInvestment: 'low' as const,
        recommended: true,
      },
      {
        id: 'strat-2',
        name: 'Practice Testing',
        description: 'Test yourself on material regularly',
        suitability: 85,
        evidenceStrength: 'strong' as const,
        timeInvestment: 'medium' as const,
        recommended: true,
      },
      {
        id: 'strat-3',
        name: 'Highlighting',
        description: 'Highlight key passages while reading',
        suitability: 40,
        evidenceStrength: 'emerging' as const,
        timeInvestment: 'low' as const,
        recommended: false,
      },
    ],
    insights: [
      'You show strong metacognitive awareness',
      'Your self-monitoring has improved this week',
      'Consider varying your study strategies',
      'Your confidence calibration is well-aligned',
    ],
    actionItems: [
      'Try interleaved practice this week',
      'Set specific learning goals before each session',
      'Review material after 24 hours',
    ],
    ...overrides,
  };
}

function createSuccessResponse(analysis = createMockAnalysis()) {
  return {
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: { analysis },
    }),
  };
}

function createErrorResponse(message = 'Analysis failed') {
  return {
    ok: true,
    json: () => Promise.resolve({
      success: false,
      error: { message },
    }),
  };
}

function createNetworkErrorResponse() {
  return Promise.reject(new Error('Network error'));
}

// Helper to fill in required pre-learning prompts
async function fillRequiredPreLearningPrompts() {
  const textareas = screen.getAllByTestId('textarea');
  // PRE_LEARNING has 3 prompts, first 2 are required
  fireEvent.change(textareas[0], { target: { value: 'I know the basics of this topic' } });
  fireEvent.change(textareas[1], { target: { value: 'I want to learn advanced concepts' } });
}

// Helper to fill all prompts for a phase
async function fillAllPrompts(values: string[] = ['Answer 1', 'Answer 2', 'Answer 3']) {
  const textareas = screen.getAllByTestId('textarea');
  values.forEach((val, idx) => {
    if (textareas[idx]) {
      fireEvent.change(textareas[idx], { target: { value: val } });
    }
  });
}

// ============================================================================
// TESTS
// ============================================================================

describe('MetacognitionPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // --------------------------------------------------------------------------
  // RENDERING
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('renders the card container', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders the title "Metacognition"', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByText('Metacognition')).toBeInTheDocument();
    });

    it('renders the description text', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByText('Reflect on your learning process')).toBeInTheDocument();
    });

    it('renders the card header area', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('renders the card content area', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('applies custom className to the Card', () => {
      render(<MetacognitionPanel className="custom-class" />);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-class');
    });

    it('renders the submit button with "Analyze Reflection" text', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByText('Analyze Reflection')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // PHASE SELECTOR
  // --------------------------------------------------------------------------
  describe('phase selector', () => {
    it('renders three phase buttons', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByText('Before Learning')).toBeInTheDocument();
      expect(screen.getByText('While Learning')).toBeInTheDocument();
      expect(screen.getByText('After Learning')).toBeInTheDocument();
    });

    it('defaults to PRE_LEARNING phase', () => {
      render(<MetacognitionPanel />);
      // PRE_LEARNING description should be visible
      expect(screen.getByText('Set intentions and activate prior knowledge')).toBeInTheDocument();
    });

    it('switches to DURING_LEARNING phase when clicked', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('While Learning'));
      expect(screen.getByText('Monitor comprehension and adjust strategies')).toBeInTheDocument();
    });

    it('switches to POST_LEARNING phase when clicked', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('After Learning'));
      expect(screen.getByText('Evaluate outcomes and plan next steps')).toBeInTheDocument();
    });

    it('shows PRE_LEARNING prompts by default', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByText('What do I already know about this topic?')).toBeInTheDocument();
      expect(screen.getByText('What do I want to learn from this session?')).toBeInTheDocument();
      expect(screen.getByText('What strategies will help me learn this effectively?')).toBeInTheDocument();
    });

    it('shows DURING_LEARNING prompts after switching', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('While Learning'));
      expect(screen.getByText('Am I understanding the main concepts?')).toBeInTheDocument();
      expect(screen.getByText('What questions or confusions do I have?')).toBeInTheDocument();
      expect(screen.getByText('Should I adjust my learning approach?')).toBeInTheDocument();
    });

    it('shows POST_LEARNING prompts after switching', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('After Learning'));
      expect(screen.getByText('What did I learn that was new or surprising?')).toBeInTheDocument();
      expect(screen.getByText('What was difficult or confusing?')).toBeInTheDocument();
      expect(screen.getByText('How can I apply this knowledge?')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // REFLECTION PROMPTS
  // --------------------------------------------------------------------------
  describe('reflection prompts', () => {
    it('renders textareas for each prompt', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByTestId('textarea');
      // PRE_LEARNING has 3 prompts
      expect(textareas).toHaveLength(3);
    });

    it('displays "* Required" for required prompts', () => {
      render(<MetacognitionPanel />);
      const requiredLabels = screen.getAllByText('* Required');
      // PRE_LEARNING has 2 required prompts
      expect(requiredLabels).toHaveLength(2);
    });

    it('shows placeholder text for textareas', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByPlaceholderText('Your reflection...');
      expect(textareas).toHaveLength(3);
    });

    it('updates textarea value on change', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: 'I know basic algebra' } });
      expect(textareas[0]).toHaveValue('I know basic algebra');
    });

    it('renders different prompts counts per phase', () => {
      render(<MetacognitionPanel />);

      // PRE_LEARNING = 3 prompts
      expect(screen.getAllByTestId('textarea')).toHaveLength(3);

      // Switch to DURING_LEARNING
      fireEvent.click(screen.getByText('While Learning'));
      expect(screen.getAllByTestId('textarea')).toHaveLength(3);

      // Switch to POST_LEARNING
      fireEvent.click(screen.getByText('After Learning'));
      expect(screen.getAllByTestId('textarea')).toHaveLength(3);
    });
  });

  // --------------------------------------------------------------------------
  // CONFIDENCE RATINGS
  // --------------------------------------------------------------------------
  describe('confidence ratings', () => {
    it('does NOT show confidence buttons in PRE_LEARNING phase', () => {
      render(<MetacognitionPanel />);
      expect(screen.queryByText('Confidence:')).not.toBeInTheDocument();
    });

    it('shows confidence buttons in DURING_LEARNING phase', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('While Learning'));
      const confidenceLabels = screen.getAllByText('Confidence:');
      expect(confidenceLabels.length).toBeGreaterThan(0);
    });

    it('renders confidence level buttons 1-5 in DURING_LEARNING phase', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('While Learning'));
      // Each of the 3 prompts has confidence buttons 1-5
      const buttons1 = screen.getAllByText('1');
      expect(buttons1.length).toBe(3);
      const buttons5 = screen.getAllByText('5');
      expect(buttons5.length).toBe(3);
    });

    it('does NOT show confidence buttons in POST_LEARNING phase', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('After Learning'));
      expect(screen.queryByText('Confidence:')).not.toBeInTheDocument();
    });

    it('allows clicking a confidence level button', () => {
      render(<MetacognitionPanel />);
      fireEvent.click(screen.getByText('While Learning'));
      // Click confidence level 3 on the first prompt
      const threeButtons = screen.getAllByText('3');
      fireEvent.click(threeButtons[0]);
      // No error thrown, button is interactive
      expect(threeButtons[0]).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // SUBMIT BUTTON VALIDATION
  // --------------------------------------------------------------------------
  describe('submit button validation', () => {
    it('disables submit button when required prompts are not filled', () => {
      render(<MetacognitionPanel />);
      const submitButton = screen.getByText('Analyze Reflection').closest('button');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all required prompts have responses', () => {
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();
      const submitButton = screen.getByText('Analyze Reflection').closest('button');
      expect(submitButton).not.toBeDisabled();
    });

    it('keeps button disabled when only one required prompt is filled', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: 'Some response' } });
      const submitButton = screen.getByText('Analyze Reflection').closest('button');
      expect(submitButton).toBeDisabled();
    });

    it('enables button even if optional prompt is empty', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByTestId('textarea');
      // Fill only the 2 required prompts
      fireEvent.change(textareas[0], { target: { value: 'Answer 1' } });
      fireEvent.change(textareas[1], { target: { value: 'Answer 2' } });
      // Third (optional) left empty
      const submitButton = screen.getByText('Analyze Reflection').closest('button');
      expect(submitButton).not.toBeDisabled();
    });

    it('disables button if required prompt is only whitespace', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: '   ' } });
      fireEvent.change(textareas[1], { target: { value: 'Real answer' } });
      const submitButton = screen.getByText('Analyze Reflection').closest('button');
      expect(submitButton).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // SUBMIT FLOW
  // --------------------------------------------------------------------------
  describe('submit flow', () => {
    it('calls fetch with correct payload on submit', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse());
      render(<MetacognitionPanel sessionId="session-abc" />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sam/metacognition', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.action).toBe('analyze-reflection');
      expect(body.data.sessionId).toBe('session-abc');
      expect(body.data.reflectionType).toBe('PRE_LEARNING');
      expect(body.data.responses.length).toBeGreaterThanOrEqual(2);
    });

    it('sends the correct phase when submitting from DURING_LEARNING', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse());
      render(<MetacognitionPanel />);

      fireEvent.click(screen.getByText('While Learning'));
      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: 'Yes I understand' } });
      fireEvent.change(textareas[1], { target: { value: 'No confusions' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.data.reflectionType).toBe('DURING_LEARNING');
    });

    it('sends the correct phase when submitting from POST_LEARNING', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse());
      render(<MetacognitionPanel />);

      fireEvent.click(screen.getByText('After Learning'));
      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: 'I learned a lot' } });
      fireEvent.change(textareas[1], { target: { value: 'Nothing difficult' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.data.reflectionType).toBe('POST_LEARNING');
    });

    it('filters out empty responses before submitting', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse());
      render(<MetacognitionPanel />);

      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: 'First answer' } });
      fireEvent.change(textareas[1], { target: { value: 'Second answer' } });
      // Third is left empty

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.data.responses).toHaveLength(2);
    });

    it('invokes onReflectionComplete callback with analysis data', async () => {
      const mockAnalysis = createMockAnalysis();
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockAnalysis));
      const onComplete = jest.fn();
      render(<MetacognitionPanel onReflectionComplete={onComplete} />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
        overallAwareness: 75,
        selfRegulation: 68,
        strategicPlanning: 82,
      }));
    });

    it('does not invoke onReflectionComplete on error', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse());
      const onComplete = jest.fn();
      render(<MetacognitionPanel onReflectionComplete={onComplete} />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------------------------------
  describe('error handling', () => {
    it('displays error message when API returns success: false', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Custom error message'));
      render(<MetacognitionPanel />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('displays fallback error message when no error.message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });
      render(<MetacognitionPanel />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });

    it('displays error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      render(<MetacognitionPanel />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('displays generic error for non-Error thrown objects', async () => {
      mockFetch.mockRejectedValueOnce('string error');
      render(<MetacognitionPanel />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('Failed to analyze reflection')).toBeInTheDocument();
    });

    it('clears error on successful subsequent submit', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce(createErrorResponse('First error'));
      render(<MetacognitionPanel />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      expect(screen.getByText('First error')).toBeInTheDocument();

      // Second call succeeds
      mockFetch.mockResolvedValueOnce(createSuccessResponse());

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ANALYSIS DISPLAY
  // --------------------------------------------------------------------------
  describe('analysis display', () => {
    async function renderWithAnalysis(analysisOverrides: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(analysisOverrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('shows awareness rings after successful analysis', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Awareness')).toBeInTheDocument();
      expect(screen.getByText('Self-Regulation')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });

    it('displays correct awareness percentage values', async () => {
      await renderWithAnalysis({ overallAwareness: 75, selfRegulation: 68, strategicPlanning: 82 });
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });

    it('shows "New Reflection" button after analysis', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('New Reflection')).toBeInTheDocument();
    });

    it('returns to prompt view when "New Reflection" is clicked', async () => {
      await renderWithAnalysis();
      fireEvent.click(screen.getByText('New Reflection'));
      // Should be back to prompts
      expect(screen.getByText('What do I already know about this topic?')).toBeInTheDocument();
      expect(screen.queryByText('Awareness')).not.toBeInTheDocument();
    });

    it('hides the phase selector and prompts when analysis is shown', async () => {
      await renderWithAnalysis();
      expect(screen.queryByText('Before Learning')).not.toBeInTheDocument();
      expect(screen.queryByText('What do I already know about this topic?')).not.toBeInTheDocument();
    });

    it('hides the submit button when analysis is shown', async () => {
      await renderWithAnalysis();
      expect(screen.queryByText('Analyze Reflection')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // COGNITIVE LOAD GAUGE
  // --------------------------------------------------------------------------
  describe('cognitive load gauge', () => {
    async function renderWithAnalysis(analysisOverrides: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(analysisOverrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('shows cognitive load section in normal (non-compact) mode', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Cognitive Load')).toBeInTheDocument();
    });

    it('displays the cognitive load level badge', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('optimal')).toBeInTheDocument();
    });

    it('shows intrinsic, extraneous, and germane load values', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Intrinsic')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Extraneous')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('Germane')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('hides cognitive load gauge in compact mode', async () => {
      await renderWithAnalysis({}, { compact: true });
      expect(screen.queryByText('Cognitive Load')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // INSIGHTS
  // --------------------------------------------------------------------------
  describe('insights', () => {
    async function renderWithAnalysis(analysisOverrides: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(analysisOverrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('shows insights section header', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('displays up to 4 insights in normal mode', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('You show strong metacognitive awareness')).toBeInTheDocument();
      expect(screen.getByText('Your self-monitoring has improved this week')).toBeInTheDocument();
      expect(screen.getByText('Consider varying your study strategies')).toBeInTheDocument();
      expect(screen.getByText('Your confidence calibration is well-aligned')).toBeInTheDocument();
    });

    it('displays up to 2 insights in compact mode', async () => {
      await renderWithAnalysis({}, { compact: true });
      expect(screen.getByText('You show strong metacognitive awareness')).toBeInTheDocument();
      expect(screen.getByText('Your self-monitoring has improved this week')).toBeInTheDocument();
      expect(screen.queryByText('Consider varying your study strategies')).not.toBeInTheDocument();
    });

    it('hides insights section when there are no insights', async () => {
      await renderWithAnalysis({ insights: [] });
      expect(screen.queryByText('Insights')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // STUDY HABITS
  // --------------------------------------------------------------------------
  describe('study habits', () => {
    async function renderWithAnalysis(analysisOverrides: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(analysisOverrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('shows study habits section in normal mode', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Study Habits')).toBeInTheDocument();
    });

    it('displays habit names', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Active Recall')).toBeInTheDocument();
      expect(screen.getByText('Spaced Repetition')).toBeInTheDocument();
      expect(screen.getByText('Note Taking')).toBeInTheDocument();
    });

    it('displays habit effectiveness percentages', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays habit frequency', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('occasionally')).toBeInTheDocument();
    });

    it('hides study habits section in compact mode', async () => {
      await renderWithAnalysis({}, { compact: true });
      expect(screen.queryByText('Study Habits')).not.toBeInTheDocument();
    });

    it('hides study habits section when habits array is empty', async () => {
      await renderWithAnalysis({ habits: [] });
      expect(screen.queryByText('Study Habits')).not.toBeInTheDocument();
    });

    it('displays at most 3 habits', async () => {
      const manyHabits = [
        { id: 'h1', name: 'Habit One', frequency: 'daily', effectiveness: 90, trend: 'improving' },
        { id: 'h2', name: 'Habit Two', frequency: 'daily', effectiveness: 80, trend: 'stable' },
        { id: 'h3', name: 'Habit Three', frequency: 'weekly', effectiveness: 70, trend: 'declining' },
        { id: 'h4', name: 'Habit Four', frequency: 'rarely', effectiveness: 30, trend: 'declining' },
      ];
      await renderWithAnalysis({ habits: manyHabits });
      expect(screen.getByText('Habit One')).toBeInTheDocument();
      expect(screen.getByText('Habit Two')).toBeInTheDocument();
      expect(screen.getByText('Habit Three')).toBeInTheDocument();
      expect(screen.queryByText('Habit Four')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // RECOMMENDED STRATEGIES
  // --------------------------------------------------------------------------
  describe('recommended strategies', () => {
    async function renderWithAnalysis(analysisOverrides: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(analysisOverrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('shows recommended strategies section header', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Recommended Strategies')).toBeInTheDocument();
    });

    it('only displays strategies marked as recommended', async () => {
      await renderWithAnalysis();
      // recommended: true
      expect(screen.getByText('Elaborative Interrogation')).toBeInTheDocument();
      expect(screen.getByText('Practice Testing')).toBeInTheDocument();
      // recommended: false - should be filtered out
      expect(screen.queryByText('Highlighting')).not.toBeInTheDocument();
    });

    it('displays strategy descriptions', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Ask why and how questions while studying')).toBeInTheDocument();
      expect(screen.getByText('Test yourself on material regularly')).toBeInTheDocument();
    });

    it('displays evidence strength badges', async () => {
      await renderWithAnalysis();
      const badges = screen.getAllByTestId('badge');
      const badgeTexts = badges.map(b => b.textContent);
      expect(badgeTexts).toContain('strong');
    });

    it('displays suitability and time investment info', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('90% match')).toBeInTheDocument();
      expect(screen.getByText('low effort')).toBeInTheDocument();
    });

    it('shows only 1 strategy in compact mode', async () => {
      await renderWithAnalysis({}, { compact: true });
      expect(screen.getByText('Elaborative Interrogation')).toBeInTheDocument();
      expect(screen.queryByText('Practice Testing')).not.toBeInTheDocument();
    });

    it('hides strategies section when no recommended strategies exist', async () => {
      await renderWithAnalysis({ recommendedStrategies: [] });
      expect(screen.queryByText('Recommended Strategies')).not.toBeInTheDocument();
    });

    it('hides strategies section when all strategies are not recommended', async () => {
      const strategies = [
        {
          id: 's1', name: 'Not Recommended', description: 'desc',
          suitability: 20, evidenceStrength: 'emerging', timeInvestment: 'high', recommended: false,
        },
      ];
      await renderWithAnalysis({ recommendedStrategies: strategies });
      // The section header still appears because the array is non-empty,
      // but no StrategyCards render because none are recommended
      expect(screen.getByText('Recommended Strategies')).toBeInTheDocument();
      expect(screen.queryByText('Not Recommended')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ACTION ITEMS
  // --------------------------------------------------------------------------
  describe('action items', () => {
    async function renderWithAnalysis(analysisOverrides: Record<string, unknown> = {}, panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(analysisOverrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('shows action items section in normal mode', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Action Items')).toBeInTheDocument();
    });

    it('displays action item text', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Try interleaved practice this week')).toBeInTheDocument();
      expect(screen.getByText('Set specific learning goals before each session')).toBeInTheDocument();
      expect(screen.getByText('Review material after 24 hours')).toBeInTheDocument();
    });

    it('hides action items section in compact mode', async () => {
      await renderWithAnalysis({}, { compact: true });
      expect(screen.queryByText('Action Items')).not.toBeInTheDocument();
    });

    it('hides action items section when array is empty', async () => {
      await renderWithAnalysis({ actionItems: [] });
      expect(screen.queryByText('Action Items')).not.toBeInTheDocument();
    });

    it('displays at most 3 action items', async () => {
      const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
      await renderWithAnalysis({ actionItems: items });
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.queryByText('Item 4')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // COMPACT MODE
  // --------------------------------------------------------------------------
  describe('compact mode', () => {
    async function renderWithAnalysis(panelProps: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis();
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel {...panelProps} />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
      return analysis;
    }

    it('still shows awareness rings in compact mode', async () => {
      await renderWithAnalysis({ compact: true });
      expect(screen.getByText('Awareness')).toBeInTheDocument();
      expect(screen.getByText('Self-Regulation')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });

    it('still shows insights (limited) in compact mode', async () => {
      await renderWithAnalysis({ compact: true });
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('still shows strategies (limited) in compact mode', async () => {
      await renderWithAnalysis({ compact: true });
      expect(screen.getByText('Recommended Strategies')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('shows analyzing state while fetch is in progress', async () => {
      let resolvePromise!: (val: unknown) => void;
      mockFetch.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));
      render(<MetacognitionPanel />);

      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      // The button should now be disabled during analysis
      const submitButton = screen.getByText('Analyze Reflection').closest('button');
      expect(submitButton).toBeDisabled();

      // Resolve to clean up
      await act(async () => {
        resolvePromise(createSuccessResponse());
      });
    });

    it('prevents double submission while analyzing', async () => {
      let resolvePromise!: (val: unknown) => void;
      mockFetch.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      // First click
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      // Second click while loading - should be prevented by isLoadingRef
      mockFetch.mockResolvedValueOnce(createSuccessResponse());
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      // Only one fetch call should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve
      await act(async () => {
        resolvePromise(createSuccessResponse());
      });
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles analysis with zero awareness values', async () => {
      const analysis = createMockAnalysis({
        overallAwareness: 0,
        selfRegulation: 0,
        strategicPlanning: 0,
      });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      const zeroValues = screen.getAllByText('0%');
      expect(zeroValues.length).toBe(3);
    });

    it('handles analysis with 100% awareness values', async () => {
      const analysis = createMockAnalysis({
        overallAwareness: 100,
        selfRegulation: 100,
        strategicPlanning: 100,
      });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      const hundredValues = screen.getAllByText('100%');
      expect(hundredValues.length).toBe(3);
    });

    it('renders without sessionId prop', () => {
      render(<MetacognitionPanel />);
      expect(screen.getByText('Metacognition')).toBeInTheDocument();
    });

    it('renders without onReflectionComplete prop', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse());
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      // Should not throw
      expect(screen.getByText('Awareness')).toBeInTheDocument();
    });

    it('handles cognitive load level "overload"', async () => {
      const analysis = createMockAnalysis({
        cognitiveLoad: {
          level: 'overload',
          intrinsicLoad: 90,
          extraneousLoad: 80,
          germaneLoad: 30,
          overallScore: 95,
          recommendations: ['Reduce workload immediately'],
        },
      });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('overload')).toBeInTheDocument();
    });

    it('handles cognitive load level "low"', async () => {
      const analysis = createMockAnalysis({
        cognitiveLoad: {
          level: 'low',
          intrinsicLoad: 10,
          extraneousLoad: 5,
          germaneLoad: 15,
          overallScore: 15,
          recommendations: [],
        },
      });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('handles cognitive load level "high"', async () => {
      const analysis = createMockAnalysis({
        cognitiveLoad: {
          level: 'high',
          intrinsicLoad: 70,
          extraneousLoad: 60,
          germaneLoad: 40,
          overallScore: 75,
          recommendations: [],
        },
      });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('handles switching phases and preserving responses in current phase', () => {
      render(<MetacognitionPanel />);
      const textareas = screen.getAllByTestId('textarea');
      fireEvent.change(textareas[0], { target: { value: 'Pre-learning answer' } });

      // Switch to during and back
      fireEvent.click(screen.getByText('While Learning'));
      fireEvent.click(screen.getByText('Before Learning'));

      const updatedTextareas = screen.getAllByTestId('textarea');
      expect(updatedTextareas[0]).toHaveValue('Pre-learning answer');
    });
  });

  // --------------------------------------------------------------------------
  // AWARENESS RING (SVG rendering)
  // --------------------------------------------------------------------------
  describe('awareness ring SVG', () => {
    async function renderWithAnalysis(overrides: Record<string, unknown> = {}) {
      const analysis = createMockAnalysis(overrides);
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));
      render(<MetacognitionPanel />);
      fillRequiredPreLearningPrompts();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });
    }

    it('renders SVG elements for awareness rings', async () => {
      await renderWithAnalysis();
      const svgs = document.querySelectorAll('svg.w-20');
      expect(svgs.length).toBe(3);
    });

    it('renders circle elements inside SVGs', async () => {
      await renderWithAnalysis();
      const circles = document.querySelectorAll('svg.w-20 circle');
      // Each ring has 2 circles (bg + progress) x 3 rings = 6
      expect(circles.length).toBe(6);
    });
  });

  // --------------------------------------------------------------------------
  // RESPONSE PERSISTENCE ACROSS PHASES
  // --------------------------------------------------------------------------
  describe('response persistence', () => {
    it('preserves responses when switching between phases', () => {
      render(<MetacognitionPanel />);

      // Fill pre-learning
      const preTextareas = screen.getAllByTestId('textarea');
      fireEvent.change(preTextareas[0], { target: { value: 'Pre answer 1' } });

      // Switch to during-learning and fill
      fireEvent.click(screen.getByText('While Learning'));
      const duringTextareas = screen.getAllByTestId('textarea');
      fireEvent.change(duringTextareas[0], { target: { value: 'During answer 1' } });

      // Switch back to pre-learning and verify
      fireEvent.click(screen.getByText('Before Learning'));
      const backTextareas = screen.getAllByTestId('textarea');
      expect(backTextareas[0]).toHaveValue('Pre answer 1');

      // Switch to during and verify
      fireEvent.click(screen.getByText('While Learning'));
      const backDuringTextareas = screen.getAllByTestId('textarea');
      expect(backDuringTextareas[0]).toHaveValue('During answer 1');
    });
  });

  // --------------------------------------------------------------------------
  // FULL WORKFLOW INTEGRATION
  // --------------------------------------------------------------------------
  describe('full workflow', () => {
    it('completes full reflection cycle: fill prompts -> submit -> view analysis -> new reflection', async () => {
      const analysis = createMockAnalysis();
      mockFetch.mockResolvedValueOnce(createSuccessResponse(analysis));

      render(<MetacognitionPanel />);

      // Step 1: Verify initial state
      expect(screen.getByText('Metacognition')).toBeInTheDocument();
      expect(screen.getByText('Before Learning')).toBeInTheDocument();

      // Step 2: Fill prompts
      fillRequiredPreLearningPrompts();

      // Step 3: Submit
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze Reflection'));
      });

      // Step 4: View analysis
      expect(screen.getByText('Awareness')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('New Reflection')).toBeInTheDocument();

      // Step 5: Start new reflection
      fireEvent.click(screen.getByText('New Reflection'));
      expect(screen.getByText('Before Learning')).toBeInTheDocument();
      expect(screen.getByText('Analyze Reflection')).toBeInTheDocument();
    });
  });
});

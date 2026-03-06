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

// Mock lucide-react icons - uses data-testid with icon name for targeted assertions
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
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { variant, size, asChild, ...htmlProps } = props;
    return <button data-variant={variant} data-size={size} {...htmlProps}>{children}</button>;
  },
}));

// Mock Progress
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} role="progressbar" />
  ),
}));

// Mock Tooltip - render nothing for tooltip content to avoid duplicate text
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT UNDER TEST (must come after mocks)
// ============================================================================
import { PredictiveInsights } from '@/components/sam/PredictiveInsights';

// ============================================================================
// TYPES (mirrors component types for test data factories)
// ============================================================================

interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface Prediction {
  id: string;
  type: 'grade' | 'completion' | 'mastery' | 'engagement';
  title: string;
  predictedValue: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
  factors: PredictionFactor[];
  timestamp: string;
}

interface RiskAssessment {
  id: string;
  category: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigations: string[];
  deadline?: string;
}

interface PerformanceForecast {
  period: string;
  predictedScore: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  milestone?: string;
}

interface Intervention {
  id: string;
  type: 'study' | 'practice' | 'review' | 'support';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number;
  timeRequired: number;
  deadline?: string;
}

interface PredictiveInsightsData {
  predictions: Prediction[];
  risks: RiskAssessment[];
  forecasts: PerformanceForecast[];
  interventions: Intervention[];
  overallOutlook: 'positive' | 'neutral' | 'concerning';
  confidenceScore: number;
  lastUpdated: string;
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createPredictionFactor(overrides: Partial<PredictionFactor> = {}): PredictionFactor {
  return {
    name: 'Study Consistency',
    impact: 0.8,
    direction: 'positive',
    description: 'Regular study sessions improve retention',
    ...overrides,
  };
}

function createPrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'pred-1',
    type: 'grade',
    title: 'Expected Grade',
    predictedValue: 85,
    confidence: 92,
    trend: 'improving',
    changePercent: 5,
    factors: [
      createPredictionFactor({ name: 'Study Consistency', direction: 'positive' }),
      createPredictionFactor({ name: 'Quiz Performance', direction: 'positive', impact: 0.6 }),
      createPredictionFactor({ name: 'Attendance Gap', direction: 'negative', impact: -0.3 }),
    ],
    timestamp: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

function createRisk(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    id: 'risk-1',
    category: 'Knowledge Gaps',
    level: 'medium',
    probability: 45,
    impact: 'May struggle with advanced topics without review',
    mitigations: ['Schedule focused review sessions for weak areas'],
    deadline: '2026-03-15T00:00:00Z',
    ...overrides,
  };
}

function createForecast(overrides: Partial<PerformanceForecast> = {}): PerformanceForecast {
  return {
    period: 'Week 1',
    predictedScore: 78,
    confidence: 85,
    trend: 'improving',
    milestone: 'Module Completion',
    ...overrides,
  };
}

function createIntervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: 'interv-1',
    type: 'study',
    title: 'Review Fundamentals',
    description: 'Revisit core concepts to strengthen foundation',
    priority: 'high',
    expectedImpact: 15,
    timeRequired: 30,
    deadline: '2026-03-10T00:00:00Z',
    ...overrides,
  };
}

function createMockData(overrides: Partial<PredictiveInsightsData> = {}): PredictiveInsightsData {
  return {
    predictions: [
      createPrediction({ id: 'pred-1', type: 'grade', title: 'Expected Grade', predictedValue: 85, trend: 'improving', changePercent: 5 }),
      createPrediction({ id: 'pred-2', type: 'completion', title: 'Course Completion', predictedValue: 72, trend: 'stable', changePercent: 0 }),
      createPrediction({ id: 'pred-3', type: 'mastery', title: 'Topic Mastery', predictedValue: 68, trend: 'declining', changePercent: -3 }),
      createPrediction({ id: 'pred-4', type: 'engagement', title: 'Engagement Score', predictedValue: 91, trend: 'improving', changePercent: 8 }),
    ],
    risks: [
      createRisk({ id: 'risk-1', category: 'Knowledge Gaps', level: 'medium', probability: 45 }),
      createRisk({ id: 'risk-2', category: 'Time Management', level: 'high', probability: 65, impact: 'Risk of falling behind schedule' }),
      createRisk({ id: 'risk-3', category: 'Engagement Drop', level: 'low', probability: 20, impact: 'Minor decline in participation' }),
    ],
    forecasts: [
      createForecast({ period: 'Week 1', predictedScore: 78, trend: 'improving' }),
      createForecast({ period: 'Week 2', predictedScore: 82, trend: 'improving' }),
      createForecast({ period: 'Week 3', predictedScore: 80, trend: 'stable' }),
    ],
    interventions: [
      createIntervention({ id: 'interv-1', type: 'study', title: 'Review Fundamentals', priority: 'high', expectedImpact: 15, timeRequired: 30 }),
      createIntervention({ id: 'interv-2', type: 'practice', title: 'Practice Problems', priority: 'medium', expectedImpact: 10, timeRequired: 45, description: 'Work through practice set B' }),
      createIntervention({ id: 'interv-3', type: 'review', title: 'Spaced Review', priority: 'low', expectedImpact: 8, timeRequired: 20, description: 'Review notes from last week' }),
      createIntervention({ id: 'interv-4', type: 'support', title: 'Seek Help', priority: 'high', expectedImpact: 20, timeRequired: 60, description: 'Schedule a tutoring session', deadline: '2026-03-12T00:00:00Z' }),
    ],
    overallOutlook: 'positive',
    confidenceScore: 87,
    lastUpdated: '2026-03-05T14:30:00Z',
    ...overrides,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/** Create a fresh fetch mock for each test to avoid pollution */
function setupFetchMock(): jest.Mock {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  return fetchMock;
}

function mockFetchSuccess(fetchMock: jest.Mock, data: PredictiveInsightsData = createMockData()): void {
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  });
}

function mockFetchError(fetchMock: jest.Mock, message = 'Failed to fetch predictions'): void {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ success: false, error: { message } }),
  });
}

function mockFetchNetworkError(fetchMock: jest.Mock): void {
  fetchMock.mockRejectedValue(new Error('Network error'));
}

/** Render and wait for loading to finish */
async function renderAndWait(
  props: Partial<React.ComponentProps<typeof PredictiveInsights>> = {},
): Promise<void> {
  await act(async () => {
    render(<PredictiveInsights {...props} />);
  });
  // Wait for loading text to disappear
  await waitFor(() => {
    expect(screen.queryByText('Analyzing your learning patterns...')).not.toBeInTheDocument();
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('PredictiveInsights', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
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
    it('shows loading skeleton with spinner and message while fetching', async () => {
      // Return a promise that never resolves to keep the component in loading state
      fetchMock.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<PredictiveInsights />);
      });

      expect(screen.getByText('Analyzing your learning patterns...')).toBeInTheDocument();
      // The Loader2 icon is rendered as an svg via our mock
      const icons = screen.getAllByTestId('icon');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('hides loading state after data loads successfully', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.queryByText('Analyzing your learning patterns...')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Renders data after successful fetch
  // --------------------------------------------------------------------------
  describe('Successful data rendering', () => {
    it('renders the Predictive Insights title and description', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      expect(screen.getByText('AI-powered learning outcome predictions')).toBeInTheDocument();
    });

    it('renders all prediction cards with titles', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Expected Grade')).toBeInTheDocument();
      expect(screen.getByText('Course Completion')).toBeInTheDocument();
      expect(screen.getByText('Topic Mastery')).toBeInTheDocument();
      expect(screen.getByText('Engagement Score')).toBeInTheDocument();
    });

    it('renders prediction values and change percentages', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Predicted values are rendered as "XX%"
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
      // Change percent with + prefix for positive
      expect(screen.getByText('+5%')).toBeInTheDocument();
      // Negative change
      expect(screen.getByText('-3%')).toBeInTheDocument();
    });

    it('renders the Key Predictions section heading', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Key Predictions')).toBeInTheDocument();
    });

    it('renders the Risk Assessment section heading', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('renders the Performance Forecast section heading', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Performance Forecast')).toBeInTheDocument();
    });

    it('renders the Recommended Actions section heading', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Recommended Actions')).toBeInTheDocument();
    });

    it('renders a refresh button in the header', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // There should be a ghost button with a RefreshCw icon in the header
      const buttons = screen.getAllByRole('button');
      // The ghost variant refresh button is present
      const ghostButtons = buttons.filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost',
      );
      expect(ghostButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Error state with retry
  // --------------------------------------------------------------------------
  describe('Error state', () => {
    it('shows error message when fetch returns non-OK response', async () => {
      mockFetchError(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Failed to fetch predictions')).toBeInTheDocument();
    });

    it('shows error message on network failure', async () => {
      mockFetchNetworkError(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows a Retry button in error state', async () => {
      mockFetchError(fetchMock);
      await renderAndWait();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('retries fetch when Retry button is clicked', async () => {
      // First call fails, second succeeds
      mockFetchError(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Failed to fetch predictions')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Set up success for the retry
      mockFetchSuccess(fetchMock);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await act(async () => {
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('displays generic error when error is not an Error instance', async () => {
      // Simulate a throw of a non-Error value
      fetchMock.mockRejectedValue('something went wrong');
      await renderAndWait();

      expect(screen.getByText('Failed to load predictions')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Outlook indicator
  // --------------------------------------------------------------------------
  describe('Outlook indicator', () => {
    it('shows Positive Outlook label and confidence when outlook is positive', async () => {
      mockFetchSuccess(fetchMock, createMockData({ overallOutlook: 'positive', confidenceScore: 87 }));
      await renderAndWait();

      expect(screen.getByText('Positive Outlook')).toBeInTheDocument();
      expect(screen.getByText('87% confidence')).toBeInTheDocument();
    });

    it('shows Neutral Outlook label when outlook is neutral', async () => {
      mockFetchSuccess(fetchMock, createMockData({ overallOutlook: 'neutral', confidenceScore: 60 }));
      await renderAndWait();

      expect(screen.getByText('Neutral Outlook')).toBeInTheDocument();
      expect(screen.getByText('60% confidence')).toBeInTheDocument();
    });

    it('shows Needs Attention label when outlook is concerning', async () => {
      mockFetchSuccess(fetchMock, createMockData({ overallOutlook: 'concerning', confidenceScore: 40 }));
      await renderAndWait();

      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      expect(screen.getByText('40% confidence')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Prediction cards with factors
  // --------------------------------------------------------------------------
  describe('Prediction cards with factors', () => {
    it('renders prediction factor badges on prediction cards', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Factors are shown as Badge components - may appear in multiple predictions
      expect(screen.getAllByText('Study Consistency').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Quiz Performance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Attendance Gap').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Key factors label when factors exist', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Each prediction card with factors has a "Key factors:" label
      const keyFactorsLabels = screen.getAllByText('Key factors:');
      expect(keyFactorsLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('limits displayed factors to 3 per prediction', async () => {
      const manyFactors = [
        createPredictionFactor({ name: 'Factor A' }),
        createPredictionFactor({ name: 'Factor B' }),
        createPredictionFactor({ name: 'Factor C' }),
        createPredictionFactor({ name: 'Factor D' }),
        createPredictionFactor({ name: 'Factor E' }),
      ];
      const data = createMockData({
        predictions: [createPrediction({ id: 'pred-many', factors: manyFactors })],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.getByText('Factor A')).toBeInTheDocument();
      expect(screen.getByText('Factor B')).toBeInTheDocument();
      expect(screen.getByText('Factor C')).toBeInTheDocument();
      expect(screen.queryByText('Factor D')).not.toBeInTheDocument();
      expect(screen.queryByText('Factor E')).not.toBeInTheDocument();
    });

    it('does not show factors section when prediction has no factors', async () => {
      const data = createMockData({
        predictions: [createPrediction({ id: 'pred-no-factors', factors: [] })],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      // "Key factors:" label should not appear
      expect(screen.queryByText('Key factors:')).not.toBeInTheDocument();
    });

    it('renders confidence for each prediction', async () => {
      const data = createMockData({
        predictions: [createPrediction({ id: 'pred-conf', confidence: 92 })],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.getByText('92% confidence')).toBeInTheDocument();
    });

    it('renders progress bars for prediction values', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const progressBars = screen.getAllByTestId('progress-bar');
      // At least prediction progress bars + forecast progress bars
      expect(progressBars.length).toBeGreaterThanOrEqual(4);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Risk assessment cards
  // --------------------------------------------------------------------------
  describe('Risk assessment cards', () => {
    it('renders risk category names', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Knowledge Gaps')).toBeInTheDocument();
      expect(screen.getByText('Time Management')).toBeInTheDocument();
      expect(screen.getByText('Engagement Drop')).toBeInTheDocument();
    });

    it('renders risk level badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Risk levels are rendered as Badge components with capitalize class
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('renders risk probability percentages', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('renders risk impact descriptions', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('May struggle with advanced topics without review')).toBeInTheDocument();
      expect(screen.getByText('Risk of falling behind schedule')).toBeInTheDocument();
    });

    it('renders mitigation text for risks', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // "Mitigation:" label followed by text in same element
      expect(screen.getAllByText('Mitigation:').length).toBeGreaterThanOrEqual(1);
      // Mitigation text is a text node sibling to the <span>, use regex
      expect(screen.getAllByText(/Schedule focused review sessions/).length).toBeGreaterThanOrEqual(1);
    });

    it('does not show mitigation when mitigations array is empty', async () => {
      const data = createMockData({
        risks: [createRisk({ id: 'risk-no-mit', mitigations: [] })],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.queryByText('Mitigation:')).not.toBeInTheDocument();
    });

    it('limits displayed risks to 3', async () => {
      const data = createMockData({
        risks: [
          createRisk({ id: 'risk-1', category: 'Risk A' }),
          createRisk({ id: 'risk-2', category: 'Risk B' }),
          createRisk({ id: 'risk-3', category: 'Risk C' }),
          createRisk({ id: 'risk-4', category: 'Risk D' }),
        ],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.getByText('Risk A')).toBeInTheDocument();
      expect(screen.getByText('Risk B')).toBeInTheDocument();
      expect(screen.getByText('Risk C')).toBeInTheDocument();
      expect(screen.queryByText('Risk D')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Intervention cards
  // --------------------------------------------------------------------------
  describe('Intervention cards', () => {
    it('renders intervention titles', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Review Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Practice Problems')).toBeInTheDocument();
      expect(screen.getByText('Spaced Review')).toBeInTheDocument();
      expect(screen.getByText('Seek Help')).toBeInTheDocument();
    });

    it('renders intervention descriptions', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Revisit core concepts to strengthen foundation')).toBeInTheDocument();
      expect(screen.getByText('Work through practice set B')).toBeInTheDocument();
    });

    it('renders expected impact badges', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('+15% impact')).toBeInTheDocument();
      expect(screen.getByText('+10% impact')).toBeInTheDocument();
      expect(screen.getByText('+8% impact')).toBeInTheDocument();
      expect(screen.getByText('+20% impact')).toBeInTheDocument();
    });

    it('renders time required for interventions', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
    });

    it('renders deadline when present on intervention', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Interventions with deadlines show "Due <date>" inside a span with an icon sibling
      const deadlineDate = new Date('2026-03-10T00:00:00Z').toLocaleDateString();
      // Multiple spans may match since there are multiple interventions; use getAllByText
      const deadlineEls = screen.getAllByText((content, element) => {
        return element?.tagName === 'SPAN' && element?.textContent?.includes(`Due ${deadlineDate}`) || false;
      });
      expect(deadlineEls.length).toBeGreaterThanOrEqual(1);
    });

    it('does not render deadline when not present on intervention', async () => {
      const data = createMockData({
        interventions: [createIntervention({ id: 'no-deadline', deadline: undefined })],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      // No "Due" text should appear when deadline is absent
      expect(screen.queryByText(/^Due /)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Intervention click handler
  // --------------------------------------------------------------------------
  describe('Intervention click handler', () => {
    it('calls onInterventionClick with the correct intervention when clicked', async () => {
      const handleClick = jest.fn();
      mockFetchSuccess(fetchMock);

      await act(async () => {
        render(<PredictiveInsights onInterventionClick={handleClick} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Review Fundamentals')).toBeInTheDocument();
      });

      // Click on the first intervention card
      const interventionCard = screen.getByText('Review Fundamentals').closest('div[class*="cursor-pointer"]');
      expect(interventionCard).toBeTruthy();

      await act(async () => {
        fireEvent.click(interventionCard!);
      });

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'interv-1',
          type: 'study',
          title: 'Review Fundamentals',
        }),
      );
    });

    it('does not throw when intervention is clicked without onInterventionClick handler', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const interventionCard = screen.getByText('Review Fundamentals').closest('div[class*="cursor-pointer"]');
      expect(interventionCard).toBeTruthy();

      // Should not throw
      await act(async () => {
        fireEvent.click(interventionCard!);
      });
    });

    it('calls handler with the correct intervention for each card', async () => {
      const handleClick = jest.fn();
      mockFetchSuccess(fetchMock);

      await act(async () => {
        render(<PredictiveInsights onInterventionClick={handleClick} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Practice Problems')).toBeInTheDocument();
      });

      const practiceCard = screen.getByText('Practice Problems').closest('div[class*="cursor-pointer"]');
      await act(async () => {
        fireEvent.click(practiceCard!);
      });

      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'interv-2',
          type: 'practice',
          title: 'Practice Problems',
        }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // 9. Compact vs full mode
  // --------------------------------------------------------------------------
  describe('Compact vs full mode', () => {
    it('shows only 2 predictions in compact mode', async () => {
      mockFetchSuccess(fetchMock);

      await act(async () => {
        render(<PredictiveInsights compact />);
      });

      await waitFor(() => {
        expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      });

      // In compact mode, predictions.slice(0, 2) -- only first 2
      expect(screen.getByText('Expected Grade')).toBeInTheDocument();
      expect(screen.getByText('Course Completion')).toBeInTheDocument();
      expect(screen.queryByText('Topic Mastery')).not.toBeInTheDocument();
      expect(screen.queryByText('Engagement Score')).not.toBeInTheDocument();
    });

    it('shows up to 4 predictions in full mode', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Expected Grade')).toBeInTheDocument();
      expect(screen.getByText('Course Completion')).toBeInTheDocument();
      expect(screen.getByText('Topic Mastery')).toBeInTheDocument();
      expect(screen.getByText('Engagement Score')).toBeInTheDocument();
    });

    it('hides Risk Assessment section in compact mode', async () => {
      mockFetchSuccess(fetchMock);

      await act(async () => {
        render(<PredictiveInsights compact />);
      });

      await waitFor(() => {
        expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      });

      expect(screen.queryByText('Risk Assessment')).not.toBeInTheDocument();
      // Risk category names should not appear
      expect(screen.queryByText('Knowledge Gaps')).not.toBeInTheDocument();
    });

    it('hides Performance Forecast section in compact mode', async () => {
      mockFetchSuccess(fetchMock);

      await act(async () => {
        render(<PredictiveInsights compact />);
      });

      await waitFor(() => {
        expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      });

      expect(screen.queryByText('Performance Forecast')).not.toBeInTheDocument();
    });

    it('shows only 2 interventions in compact mode', async () => {
      mockFetchSuccess(fetchMock);

      await act(async () => {
        render(<PredictiveInsights compact />);
      });

      await waitFor(() => {
        expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      });

      expect(screen.getByText('Review Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Practice Problems')).toBeInTheDocument();
      expect(screen.queryByText('Spaced Review')).not.toBeInTheDocument();
      expect(screen.queryByText('Seek Help')).not.toBeInTheDocument();
    });

    it('shows Risk Assessment in full mode', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Knowledge Gaps')).toBeInTheDocument();
    });

    it('shows Performance Forecast in full mode', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Performance Forecast')).toBeInTheDocument();
    });

    it('shows up to 4 interventions in full mode', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('Review Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Practice Problems')).toBeInTheDocument();
      expect(screen.getByText('Spaced Review')).toBeInTheDocument();
      expect(screen.getByText('Seek Help')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 10. Empty state when no predictions
  // --------------------------------------------------------------------------
  describe('Empty state', () => {
    it('shows "No Predictions Yet" when data is null (success:true but no data set)', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      await renderAndWait();

      expect(screen.getByText('No Predictions Yet')).toBeInTheDocument();
      expect(screen.getByText(/Continue learning to unlock AI-powered predictions/)).toBeInTheDocument();
    });

    it('shows empty state when API returns success:true but data is not set', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await renderAndWait();

      expect(screen.getByText('No Predictions Yet')).toBeInTheDocument();
    });

    it('does not show prediction sections when predictions array is empty', async () => {
      const data = createMockData({ predictions: [] });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.queryByText('Key Predictions')).not.toBeInTheDocument();
    });

    it('does not show risk section when risks array is empty', async () => {
      const data = createMockData({ risks: [] });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.queryByText('Risk Assessment')).not.toBeInTheDocument();
    });

    it('does not show forecast section when forecasts array is empty', async () => {
      const data = createMockData({ forecasts: [] });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.queryByText('Performance Forecast')).not.toBeInTheDocument();
    });

    it('does not show intervention section when interventions array is empty', async () => {
      const data = createMockData({ interventions: [] });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.queryByText('Recommended Actions')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 11. Correct API endpoint called
  // --------------------------------------------------------------------------
  describe('API endpoint', () => {
    it('calls the correct base API endpoint', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/api/sam/agentic/analytics/predictions');
    });

    it('appends courseId as query parameter when provided', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ courseId: 'course-abc-123' });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('courseId=course-abc-123');
    });

    it('appends userId as query parameter when provided', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ userId: 'user-xyz-456' });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('userId=user-xyz-456');
    });

    it('appends both courseId and userId when both are provided', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ courseId: 'c-1', userId: 'u-2' });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('courseId=c-1');
      expect(calledUrl).toContain('userId=u-2');
    });

    it('does not append query parameters when neither courseId nor userId is provided', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      // URL should end with "predictions?" (empty params) or just "predictions"
      expect(calledUrl).toMatch(/\/api\/sam\/agentic\/analytics\/predictions\??$/);
    });

    it('refetches data when refresh button is clicked', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Click the refresh (ghost) button in the header
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'ghost',
      );
      expect(refreshButton).toBeTruthy();

      mockFetchSuccess(fetchMock);

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 12. Last updated timestamp
  // --------------------------------------------------------------------------
  describe('Last updated timestamp', () => {
    it('displays the formatted last updated timestamp', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // The component renders: "Updated {new Date(data.lastUpdated).toLocaleString()}"
      const expectedDate = new Date('2026-03-05T14:30:00Z').toLocaleString();
      expect(screen.getByText(`Updated ${expectedDate}`)).toBeInTheDocument();
    });

    it('updates the timestamp after a refresh', async () => {
      const firstData = createMockData({ lastUpdated: '2026-03-01T10:00:00Z' });
      const secondData = createMockData({ lastUpdated: '2026-03-05T16:00:00Z' });

      mockFetchSuccess(fetchMock, firstData);
      await renderAndWait();

      const firstDate = new Date('2026-03-01T10:00:00Z').toLocaleString();
      expect(screen.getByText(`Updated ${firstDate}`)).toBeInTheDocument();

      // Click refresh
      mockFetchSuccess(fetchMock, secondData);
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'ghost',
      );

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      const secondDate = new Date('2026-03-05T16:00:00Z').toLocaleString();
      await waitFor(() => {
        expect(screen.getByText(`Updated ${secondDate}`)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Additional edge cases
  // --------------------------------------------------------------------------
  describe('Edge cases', () => {
    it('applies custom className to the card wrapper', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait({ className: 'my-custom-class' });

      const cards = screen.getAllByTestId('card');
      const hasCustomClass = cards.some((card) => card.className.includes('my-custom-class'));
      expect(hasCustomClass).toBe(true);
    });

    it('renders className on loading state card', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<PredictiveInsights className="loading-class" />);
      });

      const card = screen.getByTestId('card');
      expect(card.className).toContain('loading-class');
    });

    it('renders className on error state card', async () => {
      mockFetchError(fetchMock);
      await renderAndWait({ className: 'error-class' });

      const card = screen.getByTestId('card');
      expect(card.className).toContain('error-class');
    });

    it('renders className on empty state card', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });
      await renderAndWait({ className: 'empty-class' });

      const card = screen.getByTestId('card');
      expect(card.className).toContain('empty-class');
    });

    it('handles forecast timeline rendering with all trend types', async () => {
      const data = createMockData({
        forecasts: [
          createForecast({ period: 'Week 1', trend: 'improving', predictedScore: 80 }),
          createForecast({ period: 'Week 2', trend: 'stable', predictedScore: 80 }),
          createForecast({ period: 'Week 3', trend: 'declining', predictedScore: 75 }),
        ],
      });
      mockFetchSuccess(fetchMock, data);
      await renderAndWait();

      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 2')).toBeInTheDocument();
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });

    it('renders forecast scores', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('does not prevent concurrent fetch when loading guard is not active', async () => {
      // Verify the component fetches on mount and calls fetchData only once
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('default compact prop is false', async () => {
      mockFetchSuccess(fetchMock);
      await renderAndWait();

      // Verify Risk Assessment (hidden in compact) is shown by default
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Performance Forecast')).toBeInTheDocument();
    });
  });
});

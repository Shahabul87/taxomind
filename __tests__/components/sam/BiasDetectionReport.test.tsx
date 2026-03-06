/**
 * Tests for BiasDetectionReport component
 *
 * Covers: loading state, error handling, no-evaluation informational message,
 * successful data rendering, fairness score gauge, bias categories, parity metrics,
 * remediation steps, historical comparison, metadata footer, refresh/retry,
 * auto-refresh, className prop, edge cases with empty arrays, expand/collapse
 * interactions on bias category cards, severity colors, trend icons, and more.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

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
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="card-description" className={className}>{children}</p>
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
  TooltipContent: () => null,
}));

// Tabs mock: renders all TabsContent children so all tabs are testable
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    defaultValue,
    className,
  }: {
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

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="accordion" className={className}>{children}</div>
  ),
  AccordionItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`accordion-item-${value}`}>{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="accordion-trigger">{children}</button>
  ),
  AccordionContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-content">{children}</div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT UNDER TEST (must come after mocks)
// ============================================================================

import { BiasDetectionReport } from '@/components/sam/BiasDetectionReport';

// ============================================================================
// TYPES (mirrors component types for test data factories)
// ============================================================================

interface BiasCategory {
  name: string;
  score: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  affectedGroups?: string[];
}

interface ParityMetric {
  name: string;
  value: number;
  threshold: number;
  passed: boolean;
  description: string;
}

interface RemediationStep {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  rationale: string;
  expectedImpact: string;
}

interface FairnessAuditResult {
  auditId: string;
  contentId?: string;
  courseId?: string;
  overallScore: number;
  fairnessLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  biasCategories: BiasCategory[];
  parityMetrics: ParityMetric[];
  remediationSteps: RemediationStep[];
  historicalComparison?: {
    previousScore: number;
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
  };
  metadata: {
    auditedAt: string;
    evaluationsAnalyzed: number;
    confidenceLevel: number;
    auditorVersion: string;
  };
}

interface Evaluation {
  id: string;
  studentId: string;
  score: number;
  demographics?: Record<string, string>;
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createBiasCategory(overrides: Partial<BiasCategory> = {}): BiasCategory {
  return {
    name: 'Demographic',
    score: 72,
    severity: 'medium',
    description: 'Potential demographic bias detected in scoring patterns',
    indicators: ['Score variance exceeds threshold across groups'],
    affectedGroups: ['Group A', 'Group B'],
    ...overrides,
  };
}

function createParityMetric(overrides: Partial<ParityMetric> = {}): ParityMetric {
  return {
    name: 'Statistical Parity',
    value: 0.85,
    threshold: 0.8,
    passed: true,
    description: 'Measures equal prediction rates across groups',
    ...overrides,
  };
}

function createRemediationStep(overrides: Partial<RemediationStep> = {}): RemediationStep {
  return {
    priority: 'high',
    category: 'Content Review',
    action: 'Review assessment questions for cultural bias',
    rationale: 'Some questions may contain culturally specific references',
    expectedImpact: 'Improve fairness score by 10-15%',
    ...overrides,
  };
}

function createAuditResult(overrides: Partial<FairnessAuditResult> = {}): FairnessAuditResult {
  return {
    auditId: 'audit-001',
    overallScore: 78,
    fairnessLevel: 'good',
    biasCategories: [
      createBiasCategory({ name: 'Demographic', severity: 'medium', score: 72 }),
      createBiasCategory({
        name: 'Cognitive',
        severity: 'low',
        score: 88,
        description: 'Minor cognitive bias patterns',
        indicators: ['Slight bias toward certain cognitive styles'],
        affectedGroups: [],
      }),
    ],
    parityMetrics: [
      createParityMetric({ name: 'Statistical Parity', value: 0.85, threshold: 0.8, passed: true }),
      createParityMetric({
        name: 'Equal Opportunity',
        value: 0.65,
        threshold: 0.8,
        passed: false,
        description: 'Measures equal true positive rates',
      }),
      createParityMetric({
        name: 'Predictive Parity',
        value: 0.92,
        threshold: 0.8,
        passed: true,
        description: 'Measures equal precision across groups',
      }),
    ],
    remediationSteps: [
      createRemediationStep({ priority: 'high', category: 'Content Review' }),
      createRemediationStep({
        priority: 'medium',
        category: 'Assessment Design',
        action: 'Add diverse examples to assessments',
        rationale: 'Diversify reference material',
        expectedImpact: 'Moderate improvement in inclusivity',
      }),
    ],
    metadata: {
      auditedAt: '2026-03-05T10:30:00Z',
      evaluationsAnalyzed: 150,
      confidenceLevel: 0.87,
      auditorVersion: '2.1.0',
    },
    ...overrides,
  };
}

function createEvaluations(count = 3): Evaluation[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `eval-${i + 1}`,
    studentId: `student-${i + 1}`,
    score: 70 + i * 5,
    demographics: { gender: i % 2 === 0 ? 'male' : 'female' },
  }));
}

// ============================================================================
// HELPERS
// ============================================================================

function setupFetchMock(): jest.Mock {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  return fetchMock;
}

function mockFetchSuccess(fetchMock: jest.Mock, data: FairnessAuditResult = createAuditResult()): void {
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data }),
  });
}

function mockFetchError(fetchMock: jest.Mock, errorMessage = 'Server error', status = 500): void {
  fetchMock.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMessage }),
  });
}

function mockFetchNetworkError(fetchMock: jest.Mock, message = 'Network error'): void {
  fetchMock.mockRejectedValue(new Error(message));
}

// ============================================================================
// TESTS
// ============================================================================

describe('BiasDetectionReport', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // 1. Loading State
  // --------------------------------------------------------------------------

  describe('Loading State', () => {
    it('renders loading spinner and message while fetching', () => {
      fetchMock.mockReturnValue(new Promise(() => {})); // never resolves
      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      expect(screen.getByText('Running fairness analysis...')).toBeInTheDocument();
    });

    it('renders a card wrapper during loading', () => {
      fetchMock.mockReturnValue(new Promise(() => {}));
      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('applies className to the loading card', () => {
      fetchMock.mockReturnValue(new Promise(() => {}));
      render(<BiasDetectionReport evaluations={createEvaluations()} className="custom-class" />);

      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // 2. No Evaluations - Informational Message
  // --------------------------------------------------------------------------

  describe('No Evaluations Message', () => {
    it('shows informational message when evaluations prop is undefined', async () => {
      render(<BiasDetectionReport />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });
      expect(
        screen.getByText(/Fairness analysis will be available once you have completed assessments/)
      ).toBeInTheDocument();
    });

    it('shows informational message when evaluations array is empty', async () => {
      render(<BiasDetectionReport evaluations={[]} />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });
    });

    it('applies className to the no-evaluations card', async () => {
      render(<BiasDetectionReport evaluations={[]} className="no-eval-class" />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('no-eval-class');
      });
    });

    it('does not make a fetch call when no evaluations are provided', async () => {
      render(<BiasDetectionReport />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Error State
  // --------------------------------------------------------------------------

  describe('Error State', () => {
    it('displays error message when API returns error', async () => {
      mockFetchError(fetchMock, 'Fairness audit failed');

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Fairness audit failed')).toBeInTheDocument();
      });
    });

    it('displays generic error when fetch throws', async () => {
      mockFetchNetworkError(fetchMock, 'Network failure');

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Network failure')).toBeInTheDocument();
      });
    });

    it('displays generic error for non-Error thrown object', async () => {
      fetchMock.mockRejectedValue('string error');

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('An error occurred')).toBeInTheDocument();
      });
    });

    it('renders a Retry button on error', async () => {
      mockFetchError(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries the fetch when Retry button is clicked', async () => {
      mockFetchError(fetchMock, 'First error');

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Now make the second call succeed
      mockFetchSuccess(fetchMock);

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      // Initial call + retry
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('applies className to error card', async () => {
      mockFetchError(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} className="error-class" />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('error-class');
      });
    });
  });

  // --------------------------------------------------------------------------
  // 4. Successful Rendering - Header
  // --------------------------------------------------------------------------

  describe('Successful Rendering - Header', () => {
    it('renders the report title', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });
    });

    it('renders the description', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(
          screen.getByText('Fairness analysis and bias detection for educational content')
        ).toBeInTheDocument();
      });
    });

    it('renders a Re-audit button', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Re-audit')).toBeInTheDocument();
      });
    });

    it('calls fetchAudit when Re-audit is clicked', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Re-audit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Re-audit'));

      // Initial + re-audit
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 5. Fairness Score Display
  // --------------------------------------------------------------------------

  describe('Fairness Score Display', () => {
    it('displays the overall score value', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ overallScore: 85 }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });

    it('displays the fairness level label', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ fairnessLevel: 'good' }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        // The level appears both in the gauge and in the "Fairness Score: good" heading
        const goodElements = screen.getAllByText('good');
        expect(goodElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('displays evaluation count in metadata', async () => {
      const result = createAuditResult({
        metadata: {
          auditedAt: '2026-03-05T10:30:00Z',
          evaluationsAnalyzed: 200,
          confidenceLevel: 0.95,
          auditorVersion: '2.0.0',
        },
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/200 evaluations/)).toBeInTheDocument();
      });
    });

    it('displays parity metrics passed count', async () => {
      // 2 passed out of 3 in default data
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/2\/3 metrics passed/)).toBeInTheDocument();
      });
    });

    it('displays confidence level as percentage', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({
        metadata: {
          auditedAt: '2026-03-05T10:30:00Z',
          evaluationsAnalyzed: 100,
          confidenceLevel: 0.87,
          auditorVersion: '2.1.0',
        },
      }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/Confidence: 87%/)).toBeInTheDocument();
      });
    });

    it('rounds score correctly for fractional values', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ overallScore: 82.7 }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('83')).toBeInTheDocument();
      });
    });

    it('displays excellent fairness level', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ fairnessLevel: 'excellent', overallScore: 95 }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        // Appears in gauge label + Fairness Score heading
        const excellentElements = screen.getAllByText('excellent');
        expect(excellentElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('displays critical fairness level', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ fairnessLevel: 'critical', overallScore: 25 }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        // Appears in gauge label + Fairness Score heading
        const criticalElements = screen.getAllByText('critical');
        expect(criticalElements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 6. Historical Comparison
  // --------------------------------------------------------------------------

  describe('Historical Comparison', () => {
    it('renders historical comparison section when data is present', async () => {
      const result = createAuditResult({
        historicalComparison: {
          previousScore: 72,
          trend: 'improving',
          changePercent: 8.3,
        },
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('vs. Previous Audit')).toBeInTheDocument();
      });
    });

    it('shows positive change percentage with plus sign', async () => {
      const result = createAuditResult({
        historicalComparison: {
          previousScore: 72,
          trend: 'improving',
          changePercent: 8.3,
        },
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('+8.3%')).toBeInTheDocument();
      });
    });

    it('shows negative change percentage without plus sign', async () => {
      const result = createAuditResult({
        historicalComparison: {
          previousScore: 85,
          trend: 'declining',
          changePercent: -5.2,
        },
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('-5.2%')).toBeInTheDocument();
      });
    });

    it('shows previous score', async () => {
      const result = createAuditResult({
        historicalComparison: {
          previousScore: 72,
          trend: 'stable',
          changePercent: 0,
        },
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/Previous: 72/)).toBeInTheDocument();
      });
    });

    it('does not render historical comparison when absent', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ historicalComparison: undefined }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      expect(screen.queryByText('vs. Previous Audit')).not.toBeInTheDocument();
    });

    it('shows zero change percent correctly', async () => {
      const result = createAuditResult({
        historicalComparison: {
          previousScore: 78,
          trend: 'stable',
          changePercent: 0,
        },
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('0.0%')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 7. Bias Categories Tab
  // --------------------------------------------------------------------------

  describe('Bias Categories Tab', () => {
    it('renders tab trigger with category count', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-categories')).toHaveTextContent('Bias Categories (2)');
      });
    });

    it('renders each bias category name', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Demographic')).toBeInTheDocument();
        expect(screen.getByText('Cognitive')).toBeInTheDocument();
      });
    });

    it('renders category descriptions', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Potential demographic bias detected in scoring patterns')).toBeInTheDocument();
      });
    });

    it('renders category scores', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('72')).toBeInTheDocument();
        expect(screen.getByText('88')).toBeInTheDocument();
      });
    });

    it('renders severity badges', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const badgeTexts = badges.map((b) => b.textContent);
        expect(badgeTexts).toContain('medium');
        expect(badgeTexts).toContain('low');
      });
    });

    it('shows "No significant bias detected" when categories array is empty', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ biasCategories: [] }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('No significant bias detected')).toBeInTheDocument();
      });
    });

    it('shows fair message when no bias detected', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ biasCategories: [] }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(
          screen.getByText('The content appears to be fair across all analyzed categories.')
        ).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 8. Bias Category Expand/Collapse
  // --------------------------------------------------------------------------

  describe('Bias Category Card Interactions', () => {
    it('expands category to show indicators when clicked', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Demographic')).toBeInTheDocument();
      });

      // Initially indicators should not be visible (category is collapsed)
      expect(screen.queryByText('Indicators Detected')).not.toBeInTheDocument();

      // Click the Demographic category to expand
      fireEvent.click(screen.getByText('Demographic'));

      // Now indicators should be visible
      expect(screen.getByText('Indicators Detected')).toBeInTheDocument();
      expect(screen.getByText('Score variance exceeds threshold across groups')).toBeInTheDocument();
    });

    it('shows affected groups when expanded', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Demographic')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Demographic'));

      expect(screen.getByText('Affected Groups')).toBeInTheDocument();
      expect(screen.getByText('Group A')).toBeInTheDocument();
      expect(screen.getByText('Group B')).toBeInTheDocument();
    });

    it('collapses category when clicked again', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Demographic')).toBeInTheDocument();
      });

      // Expand
      fireEvent.click(screen.getByText('Demographic'));
      expect(screen.getByText('Indicators Detected')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Demographic'));
      expect(screen.queryByText('Indicators Detected')).not.toBeInTheDocument();
    });

    it('does not show affected groups section when affectedGroups is empty', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Cognitive')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cognitive'));

      // Cognitive category has empty affectedGroups
      expect(screen.queryByText('Affected Groups')).not.toBeInTheDocument();
    });

    it('does not show indicators section when indicators array is empty', async () => {
      const result = createAuditResult({
        biasCategories: [
          createBiasCategory({ name: 'TestCat', indicators: [], affectedGroups: ['X'] }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('TestCat')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('TestCat'));

      expect(screen.queryByText('Indicators Detected')).not.toBeInTheDocument();
      expect(screen.getByText('Affected Groups')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Parity Metrics Tab
  // --------------------------------------------------------------------------

  describe('Parity Metrics Tab', () => {
    it('renders parity metrics tab trigger with pass count', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-parity')).toHaveTextContent('Parity Metrics (2/3)');
      });
    });

    it('renders each metric name', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Statistical Parity')).toBeInTheDocument();
        expect(screen.getByText('Equal Opportunity')).toBeInTheDocument();
        expect(screen.getByText('Predictive Parity')).toBeInTheDocument();
      });
    });

    it('renders metric values with three decimal places', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('0.850')).toBeInTheDocument();
        expect(screen.getByText('0.650')).toBeInTheDocument();
        expect(screen.getByText('0.920')).toBeInTheDocument();
      });
    });

    it('renders threshold values with two decimal places', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        const thresholds = screen.getAllByText('/ 0.80');
        expect(thresholds.length).toBe(3);
      });
    });

    it('renders Pass badge for passing metrics', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        const passBadges = screen.getAllByText('Pass');
        expect(passBadges.length).toBe(2);
      });
    });

    it('renders Fail badge for failing metrics', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        const failBadges = screen.getAllByText('Fail');
        expect(failBadges.length).toBe(1);
      });
    });

    it('renders metric descriptions', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Measures equal prediction rates across groups')).toBeInTheDocument();
        expect(screen.getByText('Measures equal true positive rates')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 10. Remediation Tab
  // --------------------------------------------------------------------------

  describe('Remediation Tab', () => {
    it('renders remediation tab trigger with step count', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-remediation')).toHaveTextContent('Remediation (2)');
      });
    });

    it('renders remediation step actions', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Review assessment questions for cultural bias')).toBeInTheDocument();
        expect(screen.getByText('Add diverse examples to assessments')).toBeInTheDocument();
      });
    });

    it('renders priority badges', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('high priority')).toBeInTheDocument();
        expect(screen.getByText('medium priority')).toBeInTheDocument();
      });
    });

    it('renders category badges', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Content Review')).toBeInTheDocument();
        expect(screen.getByText('Assessment Design')).toBeInTheDocument();
      });
    });

    it('renders rationale text', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Some questions may contain culturally specific references')).toBeInTheDocument();
      });
    });

    it('renders expected impact', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Improve fairness score by 10-15%')).toBeInTheDocument();
      });
    });

    it('shows "No remediation needed" when steps array is empty', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ remediationSteps: [] }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('No remediation needed')).toBeInTheDocument();
      });
    });

    it('shows fairness criteria met message when no remediation needed', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ remediationSteps: [] }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('The content meets all fairness criteria.')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 11. Metadata Footer
  // --------------------------------------------------------------------------

  describe('Metadata Footer', () => {
    it('displays audit ID', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ auditId: 'audit-xyz-123' }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/Audit ID: audit-xyz-123/)).toBeInTheDocument();
      });
    });

    it('displays auditor version', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/Auditor v2.1.0/)).toBeInTheDocument();
      });
    });

    it('displays formatted audit timestamp', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/Audited at:/)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 12. Tabs Structure
  // --------------------------------------------------------------------------

  describe('Tabs Structure', () => {
    it('renders tabs with default value of categories', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        const tabs = screen.getByTestId('tabs');
        expect(tabs).toHaveAttribute('data-default-value', 'categories');
      });
    });

    it('renders three tab triggers', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-categories')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-parity')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-remediation')).toBeInTheDocument();
      });
    });

    it('renders three tab content panels', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-categories')).toBeInTheDocument();
        expect(screen.getByTestId('tab-content-parity')).toBeInTheDocument();
        expect(screen.getByTestId('tab-content-remediation')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 13. Fetch Call Details
  // --------------------------------------------------------------------------

  describe('Fetch Call Details', () => {
    it('sends POST request to correct endpoint', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/sam/safety/fairness-report',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('sends transformed evaluations in request body', async () => {
      mockFetchSuccess(fetchMock);
      const evals = createEvaluations(2);

      render(<BiasDetectionReport evaluations={evals} />);

      await waitFor(() => {
        const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(callBody.quickAudit).toBe(true);
        expect(callBody.evaluations).toHaveLength(2);
        expect(callBody.evaluations[0].id).toBe('eval-1');
        expect(callBody.evaluations[0].studentId).toBe('student-1');
        expect(callBody.evaluations[0].score).toBe(70);
        expect(callBody.evaluations[0].maxScore).toBe(100);
        expect(callBody.evaluations[0].text).toContain('student-1');
      });
    });

    it('includes demographics in transformed evaluations', async () => {
      mockFetchSuccess(fetchMock);
      const evals = [
        { id: 'e1', studentId: 's1', score: 80, demographics: { ethnicity: 'groupA' } },
      ];

      render(<BiasDetectionReport evaluations={evals} />);

      await waitFor(() => {
        const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(callBody.evaluations[0].demographics).toEqual({ ethnicity: 'groupA' });
      });
    });
  });

  // --------------------------------------------------------------------------
  // 14. className Prop
  // --------------------------------------------------------------------------

  describe('className Prop', () => {
    it('applies className to the main wrapper when result is rendered', async () => {
      mockFetchSuccess(fetchMock);

      const { container } = render(
        <BiasDetectionReport evaluations={createEvaluations()} className="custom-wrapper" />
      );

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      // The main wrapper is a div with space-y-6 and className
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-wrapper');
    });
  });

  // --------------------------------------------------------------------------
  // 15. Auto-refresh
  // --------------------------------------------------------------------------

  describe('Auto-refresh', () => {
    it('does not set up interval when autoRefresh is false', async () => {
      mockFetchSuccess(fetchMock);

      render(<BiasDetectionReport evaluations={createEvaluations()} autoRefresh={false} />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      // Initial fetch
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Advance time well past the default interval
      act(() => {
        jest.advanceTimersByTime(600000);
      });

      // Should still be 1 call
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sets up interval when autoRefresh is true', async () => {
      mockFetchSuccess(fetchMock);

      render(
        <BiasDetectionReport
          evaluations={createEvaluations()}
          autoRefresh={true}
          refreshInterval={10000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Advance past the refresh interval
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('uses custom refreshInterval', async () => {
      mockFetchSuccess(fetchMock);

      render(
        <BiasDetectionReport
          evaluations={createEvaluations()}
          autoRefresh={true}
          refreshInterval={5000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Advance 5 seconds - should trigger
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Advance 5 more seconds - should trigger again
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  // --------------------------------------------------------------------------
  // 16. Null result
  // --------------------------------------------------------------------------

  describe('Null Result', () => {
    it('returns null when result is null after successful fetch', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });

      const { container } = render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        // Loading should finish (no "Running fairness analysis...")
        expect(screen.queryByText('Running fairness analysis...')).not.toBeInTheDocument();
      });

      // Component should render nothing
      expect(container.innerHTML).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // 17. Edge Cases
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('handles zero overall score', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({
        overallScore: 0,
        fairnessLevel: 'critical',
        parityMetrics: [createParityMetric({ passed: true })],
      }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        // Score '0' in gauge - use the Fairness Score heading to confirm rendering
        expect(screen.getByText(/Fairness Score:/)).toBeInTheDocument();
        // 'critical' appears in gauge label and heading
        const criticalElements = screen.getAllByText('critical');
        expect(criticalElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('handles perfect score of 100', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ overallScore: 100, fairnessLevel: 'excellent' }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('handles all metrics passing', async () => {
      const result = createAuditResult({
        parityMetrics: [
          createParityMetric({ name: 'Metric A', passed: true }),
          createParityMetric({ name: 'Metric B', passed: true }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/2\/2 metrics passed/)).toBeInTheDocument();
      });
    });

    it('handles all metrics failing', async () => {
      const result = createAuditResult({
        parityMetrics: [
          createParityMetric({ name: 'Metric A', passed: false, value: 0.3 }),
          createParityMetric({ name: 'Metric B', passed: false, value: 0.4 }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText(/0\/2 metrics passed/)).toBeInTheDocument();
      });
    });

    it('handles single bias category', async () => {
      const result = createAuditResult({
        biasCategories: [createBiasCategory({ name: 'Cultural' })],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-categories')).toHaveTextContent('Bias Categories (1)');
      });
    });

    it('handles many remediation steps', async () => {
      const steps = Array.from({ length: 10 }, (_, i) =>
        createRemediationStep({
          category: `Category ${i}`,
          action: `Action step ${i}`,
          priority: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
        })
      );
      mockFetchSuccess(fetchMock, createAuditResult({ remediationSteps: steps }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-remediation')).toHaveTextContent('Remediation (10)');
      });
    });

    it('handles low priority remediation step styling', async () => {
      const result = createAuditResult({
        remediationSteps: [
          createRemediationStep({ priority: 'low', action: 'Low priority action' }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('low priority')).toBeInTheDocument();
        expect(screen.getByText('Low priority action')).toBeInTheDocument();
      });
    });

    it('handles category with many indicators', async () => {
      const indicators = ['Indicator 1', 'Indicator 2', 'Indicator 3', 'Indicator 4'];
      const result = createAuditResult({
        biasCategories: [
          createBiasCategory({ name: 'Language', indicators }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Language')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Language'));

      indicators.forEach((indicator) => {
        expect(screen.getByText(indicator)).toBeInTheDocument();
      });
    });

    it('handles empty parityMetrics array', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ parityMetrics: [] }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-parity')).toHaveTextContent('Parity Metrics (0/0)');
      });
    });

    it('handles API returning error field in failed response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Custom API error' }),
      });

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Custom API error')).toBeInTheDocument();
      });
    });

    it('handles API returning without error field in failed response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to run fairness audit')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 18. Remediation Priority Variants
  // --------------------------------------------------------------------------

  describe('Remediation Priority Variants', () => {
    it('renders all three priority levels correctly', async () => {
      const result = createAuditResult({
        remediationSteps: [
          createRemediationStep({ priority: 'high', action: 'High action' }),
          createRemediationStep({ priority: 'medium', action: 'Medium action' }),
          createRemediationStep({ priority: 'low', action: 'Low action' }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('High action')).toBeInTheDocument();
        expect(screen.getByText('Medium action')).toBeInTheDocument();
        expect(screen.getByText('Low action')).toBeInTheDocument();
      });
    });

    it('renders Expected Impact label for each step', async () => {
      const result = createAuditResult({
        remediationSteps: [
          createRemediationStep({ expectedImpact: 'Major improvement' }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Expected Impact:')).toBeInTheDocument();
        expect(screen.getByText('Major improvement')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 19. Multiple Categories With Different Bias Types
  // --------------------------------------------------------------------------

  describe('Multiple Bias Type Categories', () => {
    it('renders categories with different bias types', async () => {
      const result = createAuditResult({
        biasCategories: [
          createBiasCategory({ name: 'Demographic', severity: 'high', score: 45 }),
          createBiasCategory({ name: 'Cultural', severity: 'critical', score: 20 }),
          createBiasCategory({ name: 'Language', severity: 'none', score: 98 }),
          createBiasCategory({ name: 'Assessment', severity: 'low', score: 90 }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Demographic')).toBeInTheDocument();
        expect(screen.getByText('Cultural')).toBeInTheDocument();
        expect(screen.getByText('Language')).toBeInTheDocument();
        expect(screen.getByText('Assessment')).toBeInTheDocument();
      });
    });

    it('renders severity levels for each category', async () => {
      const result = createAuditResult({
        biasCategories: [
          createBiasCategory({ name: 'Cat1', severity: 'none' }),
          createBiasCategory({ name: 'Cat2', severity: 'critical' }),
        ],
      });
      mockFetchSuccess(fetchMock, result);

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const texts = badges.map((b) => b.textContent);
        expect(texts).toContain('none');
        expect(texts).toContain('critical');
      });
    });
  });

  // --------------------------------------------------------------------------
  // 20. Fairness Level Colors
  // --------------------------------------------------------------------------

  describe('Fairness Level Display', () => {
    const levels: Array<{ level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'; score: number }> = [
      { level: 'excellent', score: 95 },
      { level: 'good', score: 80 },
      { level: 'fair', score: 65 },
      { level: 'poor', score: 45 },
      { level: 'critical', score: 20 },
    ];

    levels.forEach(({ level, score }) => {
      it(`renders ${level} fairness level with score ${score}`, async () => {
        mockFetchSuccess(fetchMock, createAuditResult({ fairnessLevel: level, overallScore: score }));

        render(<BiasDetectionReport evaluations={createEvaluations()} />);

        await waitFor(() => {
          // Level text appears in both gauge label and Fairness Score heading
          const levelElements = screen.getAllByText(level);
          expect(levelElements.length).toBeGreaterThanOrEqual(2);
          expect(screen.getByText(String(score))).toBeInTheDocument();
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // 21. SVG Gauge Rendering
  // --------------------------------------------------------------------------

  describe('FairnessScoreGauge', () => {
    it('renders SVG element for the gauge', async () => {
      mockFetchSuccess(fetchMock);

      const { container } = render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('Bias Detection Report')).toBeInTheDocument();
      });

      // The gauge contains an SVG with two circle elements
      const svgElements = container.querySelectorAll('svg');
      // There will be lucide-react mock svgs AND the gauge svg
      // The gauge svg has circle children
      let gaugeFound = false;
      svgElements.forEach((svg) => {
        if (svg.querySelector('circle')) {
          gaugeFound = true;
        }
      });
      expect(gaugeFound).toBe(true);
    });

    it('renders the score text inside the gauge', async () => {
      mockFetchSuccess(fetchMock, createAuditResult({ overallScore: 78 }));

      render(<BiasDetectionReport evaluations={createEvaluations()} />);

      await waitFor(() => {
        expect(screen.getByText('78')).toBeInTheDocument();
      });
    });
  });
});

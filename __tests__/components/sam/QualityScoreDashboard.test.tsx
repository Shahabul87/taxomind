/**
 * Tests for QualityScoreDashboard component
 *
 * Covers: loading state, data display after API fetch, error handling,
 * score levels/colors, gate details, recommendations display,
 * refresh/retry functionality, className prop, tabs navigation,
 * form inputs, and validation logic.
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
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
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

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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

jest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="select-root" data-value={value}>
      <select
        data-testid="select-native"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option data-testid={`select-item-${value}`} value={value}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value" />,
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

// Tabs mock: renders all TabsContent children so we can test both tabs
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

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// Mock fetch
// ============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ============================================================================
// Import component AFTER mocks
// ============================================================================

import { QualityScoreDashboard } from '@/components/sam/QualityScoreDashboard';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createGateResult(overrides: Partial<{
  gateName: string;
  passed: boolean;
  score: number;
  weight: number;
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location?: string;
    suggestedFix?: string;
  }>;
  suggestions: string[];
  processingTimeMs: number;
}> = {}) {
  return {
    gateName: 'CompletenessGate',
    passed: true,
    score: 85,
    weight: 0.2,
    issues: [],
    suggestions: [],
    processingTimeMs: 120,
    ...overrides,
  };
}

function createValidationResult(overrides: Partial<{
  passed: boolean;
  overallScore: number;
  gateResults: ReturnType<typeof createGateResult>[];
  failedGates: string[];
  criticalIssues: Array<{ severity: string; description: string }>;
  suggestions: string[];
  iterations: number;
  processingTimeMs: number;
  metadata: { timestamp: string; enhancementAttempted: boolean; reason: string } | null;
}> = {}) {
  return {
    passed: true,
    overallScore: 82,
    gateResults: [
      createGateResult({ gateName: 'CompletenessGate', passed: true, score: 85 }),
      createGateResult({
        gateName: 'StructureGate',
        passed: true,
        score: 90,
        processingTimeMs: 80,
      }),
      createGateResult({
        gateName: 'DepthGate',
        passed: false,
        score: 60,
        issues: [
          {
            severity: 'high' as const,
            description: 'Content lacks sufficient depth',
            suggestedFix: 'Add more analysis sections',
          },
        ],
        suggestions: ['Consider adding case studies'],
        processingTimeMs: 200,
      }),
    ],
    failedGates: ['DepthGate'],
    criticalIssues: [],
    suggestions: ['Add more examples', 'Improve transitions between sections'],
    iterations: 1,
    processingTimeMs: 450,
    metadata: {
      timestamp: '2026-03-05T10:00:00Z',
      enhancementAttempted: false,
      reason: 'Validation complete',
    },
    ...overrides,
  };
}

const mockValidationResult = createValidationResult();

function setupFetchSuccess(result = mockValidationResult) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: result }),
  });
}

function setupFetchError(errorMessage = 'Validation failed', status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMessage }),
  });
}

function setupFetchNetworkError(message = 'Network error') {
  mockFetch.mockRejectedValueOnce(new Error(message));
}

// ============================================================================
// TESTS
// ============================================================================

describe('QualityScoreDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Initial render / form display
  // ==========================================================================

  describe('initial render', () => {
    it('renders the header title', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByText('Content Quality Dashboard')).toBeInTheDocument();
    });

    it('renders the header description', () => {
      render(<QualityScoreDashboard />);
      expect(
        screen.getByText('Validate AI-generated educational content through multiple quality gates')
      ).toBeInTheDocument();
    });

    it('renders the content textarea', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });

    it('renders the validate button', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByText('Validate Content')).toBeInTheDocument();
    });

    it('shows character count', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByText(/0 characters/)).toBeInTheDocument();
    });

    it('shows minimum character requirement text', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByText(/Minimum 10 required/)).toBeInTheDocument();
    });

    it('renders quick mode checkbox', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByLabelText(/Quick validation/)).toBeInTheDocument();
    });

    it('does not show the New Validation button before validation', () => {
      render(<QualityScoreDashboard />);
      expect(screen.queryByText('New Validation')).not.toBeInTheDocument();
    });

    it('shows content type select options', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByText('Content Type')).toBeInTheDocument();
    });

    it('shows difficulty select label', () => {
      render(<QualityScoreDashboard />);
      expect(screen.getByText('Target Difficulty')).toBeInTheDocument();
    });

    it('renders the content textarea with placeholder', () => {
      render(<QualityScoreDashboard />);
      expect(
        screen.getByPlaceholderText('Paste your educational content here...')
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // className prop
  // ==========================================================================

  describe('className prop', () => {
    it('applies custom className to the root element', () => {
      const { container } = render(<QualityScoreDashboard className="my-custom-class" />);
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('my-custom-class');
    });

    it('preserves default spacing class alongside custom className', () => {
      const { container } = render(<QualityScoreDashboard className="extra" />);
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).toContain('extra');
    });
  });

  // ==========================================================================
  // Initial content props
  // ==========================================================================

  describe('initial content props', () => {
    it('populates textarea with initialContent', () => {
      render(<QualityScoreDashboard initialContent="Hello world, this is test content." />);
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Hello world, this is test content.');
    });

    it('updates character count with initialContent length', () => {
      const content = 'Some initial content here';
      render(<QualityScoreDashboard initialContent={content} />);
      expect(screen.getByText(new RegExp(`${content.length} characters`))).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Validate button disabled state
  // ==========================================================================

  describe('validate button disabled state', () => {
    it('disables validate button when content is empty', () => {
      render(<QualityScoreDashboard />);
      const button = screen.getByText('Validate Content').closest('button');
      expect(button).toBeDisabled();
    });

    it('disables validate button when content is fewer than 10 characters', () => {
      render(<QualityScoreDashboard initialContent="short" />);
      const button = screen.getByText('Validate Content').closest('button');
      expect(button).toBeDisabled();
    });

    it('enables validate button when content has at least 10 characters', () => {
      render(<QualityScoreDashboard initialContent="This is at least ten characters long" />);
      const button = screen.getByText('Validate Content').closest('button');
      expect(button).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // Input handling
  // ==========================================================================

  describe('input handling', () => {
    it('updates content when user types in textarea', () => {
      render(<QualityScoreDashboard />);
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Updated content for testing purposes' } });
      expect(textarea.value).toBe('Updated content for testing purposes');
    });

    it('updates character count when content changes', () => {
      render(<QualityScoreDashboard />);
      const textarea = screen.getByTestId('textarea');
      const newContent = 'Updated content here';
      fireEvent.change(textarea, { target: { value: newContent } });
      expect(screen.getByText(new RegExp(`${newContent.length} characters`))).toBeInTheDocument();
    });

    it('toggles quick mode checkbox', () => {
      render(<QualityScoreDashboard />);
      const checkbox = screen.getByLabelText(/Quick validation/) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  // ==========================================================================
  // Validation error - content too short
  // ==========================================================================

  describe('client-side validation', () => {
    it('shows error when content is less than 10 characters on submit', async () => {
      render(<QualityScoreDashboard initialContent="short txt" />);
      // Content is 9 chars but the button is disabled so we cannot click.
      // To trigger the validation path with trimmed content, use content
      // that is >= 10 chars but trims to < 10.
      // Actually, the button check is content.length < 10 (raw length),
      // while handleValidate checks content.trim().length >= 10.
      // Let's use spaces that make raw length >= 10 but trimmed < 10.
      const textarea = screen.getByTestId('textarea');
      fireEvent.change(textarea, { target: { value: '          ' } });
      const button = screen.getByText('Validate Content').closest('button') as HTMLButtonElement;
      // length is 10 so button is enabled
      expect(button).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText('Content must be at least 10 characters')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Loading state during validation
  // ==========================================================================

  describe('loading state', () => {
    it('shows loading indicator while validating', async () => {
      let resolveRequest!: (value: { ok: boolean; json: () => Promise<{ data: ReturnType<typeof createValidationResult> }> }) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
      );

      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      const button = screen.getByText('Validate Content').closest('button') as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText('Validating...')).toBeInTheDocument();
      // Button should be disabled during loading
      expect(button).toBeDisabled();

      // Resolve to clean up
      await act(async () => {
        resolveRequest({
          ok: true,
          json: () => Promise.resolve({ data: mockValidationResult }),
        });
      });
    });
  });

  // ==========================================================================
  // Successful validation - data display
  // ==========================================================================

  describe('data display after successful validation', () => {
    async function validateWithResult(result = mockValidationResult) {
      setupFetchSuccess(result);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      const button = screen.getByText('Validate Content').closest('button') as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(button);
      });
    }

    it('shows Content Passed when validation passes', async () => {
      await validateWithResult();
      expect(screen.getByText('Content Passed')).toBeInTheDocument();
    });

    it('shows Content Failed when validation fails', async () => {
      const failedResult = createValidationResult({
        passed: false,
        overallScore: 45,
        failedGates: ['CompletenessGate', 'DepthGate'],
      });
      await validateWithResult(failedResult);
      expect(screen.getByText('Content Failed')).toBeInTheDocument();
    });

    it('displays the overall score number', async () => {
      await validateWithResult();
      expect(screen.getByText('82')).toBeInTheDocument();
    });

    it('shows processing time', async () => {
      await validateWithResult();
      expect(screen.getByText(/Processed in 450ms/)).toBeInTheDocument();
    });

    it('shows metadata reason', async () => {
      await validateWithResult();
      expect(screen.getByText('Validation complete')).toBeInTheDocument();
    });

    it('shows the count of passed gates', async () => {
      await validateWithResult();
      // 2 passed gates out of 3
      expect(screen.getByText('2 Passed')).toBeInTheDocument();
    });

    it('shows the count of failed gates', async () => {
      await validateWithResult();
      expect(screen.getByText('1 Failed')).toBeInTheDocument();
    });

    it('hides iterations text when only 1 iteration', async () => {
      await validateWithResult();
      expect(screen.queryByText(/iterations/)).not.toBeInTheDocument();
    });

    it('shows iterations text when more than 1 iteration', async () => {
      const multiIterResult = createValidationResult({ iterations: 3 });
      await validateWithResult(multiIterResult);
      expect(screen.getByText('3 iterations')).toBeInTheDocument();
    });

    it('hides the input form after successful validation', async () => {
      await validateWithResult();
      expect(screen.queryByTestId('textarea')).not.toBeInTheDocument();
    });

    it('shows the New Validation button after results', async () => {
      await validateWithResult();
      expect(screen.getByText('New Validation')).toBeInTheDocument();
    });

    it('shows default validation text when metadata is null', async () => {
      const noMetaResult = createValidationResult({ metadata: null });
      await validateWithResult(noMetaResult);
      expect(screen.getByText('Validation complete')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Score gauge and colors
  // ==========================================================================

  describe('score gauge colors', () => {
    async function renderWithScore(score: number) {
      const result = createValidationResult({
        overallScore: score,
        // Use a single gate with a different score to avoid collisions
        gateResults: [
          createGateResult({ gateName: 'StructureGate', passed: true, score: 99 }),
        ],
        failedGates: [],
      });
      setupFetchSuccess(result);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
    }

    it('shows green color for high score (>= 80)', async () => {
      await renderWithScore(88);
      const scoreText = screen.getByText('88');
      expect(scoreText.className).toContain('text-green-500');
    });

    it('shows yellow color for medium score (60-79)', async () => {
      await renderWithScore(67);
      const scoreText = screen.getByText('67');
      expect(scoreText.className).toContain('text-yellow-500');
    });

    it('shows red color for low score (< 60)', async () => {
      await renderWithScore(42);
      const scoreText = screen.getByText('42');
      expect(scoreText.className).toContain('text-red-500');
    });
  });

  // ==========================================================================
  // Gate details
  // ==========================================================================

  describe('gate details', () => {
    async function validateAndReturn() {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
    }

    it('renders gate names without "Gate" suffix', async () => {
      await validateAndReturn();
      expect(screen.getByText('Completeness')).toBeInTheDocument();
      expect(screen.getByText('Structure')).toBeInTheDocument();
      expect(screen.getByText('Depth')).toBeInTheDocument();
    });

    it('shows gate scores', async () => {
      await validateAndReturn();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('shows processing time per gate', async () => {
      await validateAndReturn();
      expect(screen.getByText('120ms')).toBeInTheDocument();
      expect(screen.getByText('80ms')).toBeInTheDocument();
      expect(screen.getByText('200ms')).toBeInTheDocument();
    });

    it('renders gate descriptions from GATE_INFO', async () => {
      await validateAndReturn();
      expect(
        screen.getByText('Checks content completeness, sections, and coverage')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Validates formatting and structure')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Checks cognitive depth and critical thinking')
      ).toBeInTheDocument();
    });

    it('shows expand button only for gates with issues or suggestions', async () => {
      await validateAndReturn();
      // DepthGate has issues and suggestions, so it should have an expand button.
      // The expand button renders ChevronDown icon.
      // CompletenessGate and StructureGate have no issues/suggestions, so no expand button.
      const buttons = screen.getAllByRole('button');
      // We have: New Validation, tab triggers (gates, suggestions), and 1 expand button for DepthGate
      const expandButtons = buttons.filter((btn) => {
        // Expand buttons use ghost variant
        return btn.getAttribute('data-variant') === 'ghost';
      });
      expect(expandButtons).toHaveLength(1);
    });

    it('expands gate details when expand button is clicked', async () => {
      await validateAndReturn();
      // Find the ghost button (expand for DepthGate)
      const expandBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      expect(expandBtn).toBeDefined();

      await act(async () => {
        fireEvent.click(expandBtn!);
      });

      // After expansion, issues and suggestions should be visible
      expect(screen.getByText('Content lacks sufficient depth')).toBeInTheDocument();
      expect(screen.getByText('Consider adding case studies')).toBeInTheDocument();
    });

    it('shows issue severity badge in expanded gate', async () => {
      await validateAndReturn();
      const expandBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      await act(async () => {
        fireEvent.click(expandBtn!);
      });
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('shows suggested fix in expanded gate', async () => {
      await validateAndReturn();
      const expandBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      await act(async () => {
        fireEvent.click(expandBtn!);
      });
      expect(screen.getByText(/Add more analysis sections/)).toBeInTheDocument();
    });

    it('shows issue count in expanded gate', async () => {
      await validateAndReturn();
      const expandBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      await act(async () => {
        fireEvent.click(expandBtn!);
      });
      expect(screen.getByText(/Issues \(1\)/)).toBeInTheDocument();
    });

    it('collapses gate details when clicking expand button again', async () => {
      await validateAndReturn();
      const expandBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');

      // Expand
      await act(async () => {
        fireEvent.click(expandBtn!);
      });
      expect(screen.getByText('Content lacks sufficient depth')).toBeInTheDocument();

      // Collapse
      await act(async () => {
        fireEvent.click(expandBtn!);
      });
      expect(screen.queryByText('Content lacks sufficient depth')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Critical issues alert
  // ==========================================================================

  describe('critical issues', () => {
    it('shows critical issues card when there are critical issues', async () => {
      const resultWithCritical = createValidationResult({
        passed: false,
        criticalIssues: [
          { severity: 'critical', description: 'Completely missing key concept' },
          { severity: 'critical', description: 'Incorrect factual information' },
        ],
      });
      setupFetchSuccess(resultWithCritical);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(screen.getByText('Critical Issues Found')).toBeInTheDocument();
      expect(screen.getByText('Completely missing key concept')).toBeInTheDocument();
      expect(screen.getByText('Incorrect factual information')).toBeInTheDocument();
    });

    it('does not show critical issues card when there are none', async () => {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.queryByText('Critical Issues Found')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Suggestions tab
  // ==========================================================================

  describe('suggestions display', () => {
    it('shows suggestions tab with count', async () => {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      // The tab trigger text includes the count
      expect(screen.getByText(/Suggestions \(2\)/)).toBeInTheDocument();
    });

    it('renders suggestion items in suggestions tab', async () => {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      // Since mock renders all TabsContent, suggestions should be visible
      expect(screen.getByText('Add more examples')).toBeInTheDocument();
      expect(
        screen.getByText('Improve transitions between sections')
      ).toBeInTheDocument();
    });

    it('shows no-suggestions message when suggestions array is empty', async () => {
      const noSuggestionsResult = createValidationResult({ suggestions: [] });
      setupFetchSuccess(noSuggestionsResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(screen.getByText('No suggestions - your content looks great!')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Tabs rendering
  // ==========================================================================

  describe('tabs', () => {
    it('renders Gate Results and Suggestions tab triggers', async () => {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(screen.getByTestId('tab-trigger-gates')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-suggestions')).toBeInTheDocument();
    });

    it('renders gate results content area', async () => {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(screen.getByTestId('tab-content-gates')).toBeInTheDocument();
    });

    it('renders suggestions content area', async () => {
      setupFetchSuccess(mockValidationResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(screen.getByTestId('tab-content-suggestions')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Error handling
  // ==========================================================================

  describe('error handling', () => {
    it('shows server error message when API returns error', async () => {
      setupFetchError('Internal server error');
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });

    it('shows network error message when fetch throws', async () => {
      setupFetchNetworkError('Failed to connect');
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.getByText('Failed to connect')).toBeInTheDocument();
    });

    it('shows generic error for non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('Some string error');
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.getByText('Failed to validate content')).toBeInTheDocument();
    });

    it('clears error when validation succeeds after error', async () => {
      // First attempt: error
      setupFetchError('Server error');
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.getByText('Server error')).toBeInTheDocument();

      // Second attempt: success
      setupFetchSuccess();
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.queryByText('Server error')).not.toBeInTheDocument();
    });

    it('keeps the input form visible after error', async () => {
      setupFetchError('Validation failed');
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Refresh / reset functionality
  // ==========================================================================

  describe('refresh/reset functionality', () => {
    it('resets to input form when New Validation is clicked', async () => {
      setupFetchSuccess();
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      // Verify results are shown
      expect(screen.getByText('Content Passed')).toBeInTheDocument();
      expect(screen.queryByTestId('textarea')).not.toBeInTheDocument();

      // Click New Validation
      await act(async () => {
        fireEvent.click(screen.getByText('New Validation'));
      });

      // Should be back to input form
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(screen.queryByText('Content Passed')).not.toBeInTheDocument();
    });

    it('clears content when New Validation is clicked', async () => {
      setupFetchSuccess();
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByText('New Validation'));
      });

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('clears error state when New Validation is clicked after error then result', async () => {
      // First get a result so New Validation button appears
      setupFetchSuccess();
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      // Click New Validation
      await act(async () => {
        fireEvent.click(screen.getByText('New Validation'));
      });

      // No error should be visible
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // API request details
  // ==========================================================================

  describe('API request', () => {
    it('sends POST to /api/sam/quality/validate', async () => {
      setupFetchSuccess();
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sam/quality/validate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('includes content, type, difficulty, and blooms level in request body', async () => {
      setupFetchSuccess();
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.content).toBe('This is some test content for validation');
      expect(callBody.type).toBe('lesson'); // default
      expect(callBody.targetDifficulty).toBe('intermediate'); // default
      expect(callBody.targetBloomsLevel).toBe('UNDERSTAND'); // default
      expect(callBody.quickValidation).toBe(false); // default
    });

    it('sends quickValidation as true when checkbox is checked', async () => {
      setupFetchSuccess();
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);

      const checkbox = screen.getByLabelText(/Quick validation/) as HTMLInputElement;
      fireEvent.click(checkbox);

      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.quickValidation).toBe(true);
    });

    it('uses initialContentType prop for request', async () => {
      setupFetchSuccess();
      render(
        <QualityScoreDashboard
          initialContent="This is some test content for validation"
          initialContentType="quiz"
        />
      );
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('quiz');
    });
  });

  // ==========================================================================
  // onValidationComplete callback
  // ==========================================================================

  describe('onValidationComplete callback', () => {
    it('calls onValidationComplete with the result data', async () => {
      const onValidationComplete = jest.fn();
      setupFetchSuccess(mockValidationResult);
      render(
        <QualityScoreDashboard
          initialContent="This is some test content for validation"
          onValidationComplete={onValidationComplete}
        />
      );
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(onValidationComplete).toHaveBeenCalledTimes(1);
      expect(onValidationComplete).toHaveBeenCalledWith(mockValidationResult);
    });

    it('does not call onValidationComplete on error', async () => {
      const onValidationComplete = jest.fn();
      setupFetchError('Server error');
      render(
        <QualityScoreDashboard
          initialContent="This is some test content for validation"
          onValidationComplete={onValidationComplete}
        />
      );
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      expect(onValidationComplete).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Unknown gate fallback
  // ==========================================================================

  describe('unknown gate fallback', () => {
    it('renders gate with fallback info for unknown gate names', async () => {
      const unknownGateResult = createValidationResult({
        gateResults: [
          createGateResult({ gateName: 'CustomSpecialGate', passed: true, score: 78 }),
        ],
        failedGates: [],
      });
      setupFetchSuccess(unknownGateResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      // Gate name rendered without "Gate" suffix
      expect(screen.getByText('CustomSpecial')).toBeInTheDocument();
      // Fallback description
      expect(screen.getByText('Quality gate')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Gate score colors
  // ==========================================================================

  describe('gate score colors', () => {
    it('shows green for gate score >= 75', async () => {
      const highScoreGate = createValidationResult({
        gateResults: [createGateResult({ gateName: 'CompletenessGate', score: 80, passed: true })],
      });
      setupFetchSuccess(highScoreGate);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const scoreEl = screen.getByText('80');
      expect(scoreEl.className).toContain('text-green-500');
    });

    it('shows red for gate score < 75', async () => {
      const lowScoreGate = createValidationResult({
        gateResults: [createGateResult({ gateName: 'CompletenessGate', score: 50, passed: false })],
      });
      setupFetchSuccess(lowScoreGate);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const scoreEl = screen.getByText('50');
      expect(scoreEl.className).toContain('text-red-500');
    });
  });

  // ==========================================================================
  // Gate border colors based on pass/fail
  // ==========================================================================

  describe('gate card styling based on pass/fail', () => {
    it('applies green border class when gate passed', async () => {
      const result = createValidationResult({
        gateResults: [createGateResult({ gateName: 'StructureGate', passed: true, score: 90 })],
        failedGates: [],
      });
      setupFetchSuccess(result);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const gateCard = screen.getByText('Structure').closest('.border');
      expect(gateCard).not.toBeNull();
      expect(gateCard!.className).toContain('border-green-500/30');
    });

    it('applies red border class when gate failed', async () => {
      const result = createValidationResult({
        gateResults: [createGateResult({ gateName: 'DepthGate', passed: false, score: 40 })],
        failedGates: ['DepthGate'],
      });
      setupFetchSuccess(result);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const gateCard = screen.getByText('Depth').closest('.border');
      expect(gateCard).not.toBeNull();
      expect(gateCard!.className).toContain('border-red-500/30');
    });
  });

  // ==========================================================================
  // Multiple issues in a gate
  // ==========================================================================

  describe('multiple issues in a gate', () => {
    it('renders all issues when gate is expanded', async () => {
      const multiIssueResult = createValidationResult({
        gateResults: [
          createGateResult({
            gateName: 'CompletenessGate',
            passed: false,
            score: 40,
            issues: [
              { severity: 'critical', description: 'Missing introduction' },
              { severity: 'high', description: 'No summary section' },
              { severity: 'medium', description: 'Could use more detail in section 2' },
            ],
            suggestions: ['Add an introduction paragraph'],
          }),
        ],
        failedGates: ['CompletenessGate'],
      });
      setupFetchSuccess(multiIssueResult);
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      // Expand the gate
      const expandBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      await act(async () => {
        fireEvent.click(expandBtn!);
      });

      expect(screen.getByText('Missing introduction')).toBeInTheDocument();
      expect(screen.getByText('No summary section')).toBeInTheDocument();
      expect(screen.getByText('Could use more detail in section 2')).toBeInTheDocument();
      expect(screen.getByText(/Issues \(3\)/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Overall result card border styling
  // ==========================================================================

  describe('overall result card styling', () => {
    it('applies green border when validation passed', async () => {
      setupFetchSuccess(createValidationResult({ passed: true }));
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const resultCard = screen.getByText('Content Passed').closest('[data-testid="card"]');
      expect(resultCard).not.toBeNull();
      expect(resultCard!.className).toContain('border-green-500/30');
    });

    it('applies red border when validation failed', async () => {
      setupFetchSuccess(createValidationResult({ passed: false }));
      render(<QualityScoreDashboard initialContent="This is some test content for validation" />);
      await act(async () => {
        fireEvent.click(
          screen.getByText('Validate Content').closest('button') as HTMLButtonElement
        );
      });

      const resultCard = screen.getByText('Content Failed').closest('[data-testid="card"]');
      expect(resultCard).not.toBeNull();
      expect(resultCard!.className).toContain('border-red-500/30');
    });
  });
});

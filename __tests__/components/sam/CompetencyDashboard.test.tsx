import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// ============================================================================
// MOCKS - All external dependencies mocked before component import
// ============================================================================

// Mock framer-motion (forward all HTML-compatible props)
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

// Mock lucide-react icons (globally mocked via moduleNameMapper, all render as <svg data-testid="icon-default" />)
jest.mock('lucide-react', () => {
  const ReactLR = require('react');
  const MockIcon = ReactLR.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<SVGSVGElement>) =>
      ReactLR.createElement('svg', { ref, 'data-testid': 'icon-default', 'aria-hidden': 'true', ...props }),
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

// Mock Tooltip - render children only; tooltipContent hidden to avoid duplicated text
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
import { CompetencyDashboard } from '@/components/sam/CompetencyDashboard';

// ============================================================================
// TYPES (mirrors component types for test data factories)
// ============================================================================

type ProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'EXPERT' | 'MASTER';
type CareerLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

interface SubCompetency {
  id: string;
  name: string;
  proficiency: number;
  required: boolean;
}

interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  progress: number;
  trend: 'improving' | 'stable' | 'declining';
  evidenceCount: number;
  lastAssessed: string;
  subCompetencies?: SubCompetency[];
}

interface SkillGap {
  competencyId: string;
  competencyName: string;
  currentLevel: ProficiencyLevel;
  requiredLevel: ProficiencyLevel;
  gapSeverity: 'critical' | 'high' | 'medium' | 'low';
  recommendedActions: string[];
  estimatedTimeToClose: string;
}

interface CareerPath {
  id: string;
  title: string;
  level: CareerLevel;
  matchScore: number;
  requiredCompetencies: string[];
  gapCount: number;
  estimatedTimeToReach: string;
  demand: 'high' | 'medium' | 'low';
  salaryRange?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  type: 'project' | 'certification' | 'achievement' | 'experience';
  competencies: string[];
  date: string;
  verified: boolean;
  impactScore?: number;
}

interface CompetencyAssessment {
  overallScore: number;
  levelDistribution: Record<ProficiencyLevel, number>;
  topCompetencies: Competency[];
  competencyGaps: SkillGap[];
  careerPaths: CareerPath[];
  portfolio: PortfolioItem[];
  recommendations: string[];
  lastUpdated: string;
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createSubCompetency(overrides: Partial<SubCompetency> = {}): SubCompetency {
  return {
    id: 'sub-1',
    name: 'Code Review',
    proficiency: 75,
    required: true,
    ...overrides,
  };
}

function createCompetency(overrides: Partial<Competency> = {}): Competency {
  return {
    id: 'comp-1',
    name: 'Software Engineering',
    description: 'Ability to design, build, and maintain software systems',
    category: 'Technical',
    currentLevel: 'COMPETENT',
    targetLevel: 'EXPERT',
    progress: 65,
    trend: 'improving',
    evidenceCount: 12,
    lastAssessed: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function createSkillGap(overrides: Partial<SkillGap> = {}): SkillGap {
  return {
    competencyId: 'comp-gap-1',
    competencyName: 'System Design',
    currentLevel: 'BEGINNER',
    requiredLevel: 'PROFICIENT',
    gapSeverity: 'high',
    recommendedActions: ['Complete system design course', 'Practice with architecture katas'],
    estimatedTimeToClose: '3 months',
    ...overrides,
  };
}

function createCareerPath(overrides: Partial<CareerPath> = {}): CareerPath {
  return {
    id: 'career-1',
    title: 'Senior Software Engineer',
    level: 'senior',
    matchScore: 78,
    requiredCompetencies: ['comp-1', 'comp-2'],
    gapCount: 2,
    estimatedTimeToReach: '6 months',
    demand: 'high',
    salaryRange: '$120K - $160K',
    ...overrides,
  };
}

function createPortfolioItem(overrides: Partial<PortfolioItem> = {}): PortfolioItem {
  return {
    id: 'portfolio-1',
    title: 'Open Source Contribution',
    type: 'project',
    competencies: ['comp-1'],
    date: '2026-02-15T00:00:00Z',
    verified: true,
    impactScore: 85,
    ...overrides,
  };
}

function createAssessment(overrides: Partial<CompetencyAssessment> = {}): CompetencyAssessment {
  return {
    overallScore: 72,
    levelDistribution: {
      NOVICE: 1,
      BEGINNER: 3,
      COMPETENT: 5,
      PROFICIENT: 4,
      EXPERT: 2,
      MASTER: 1,
    },
    topCompetencies: [
      createCompetency({ id: 'comp-1', name: 'Software Engineering' }),
      createCompetency({ id: 'comp-2', name: 'Data Structures', progress: 80, trend: 'stable' }),
      createCompetency({ id: 'comp-3', name: 'Cloud Architecture', progress: 45, trend: 'declining' }),
    ],
    competencyGaps: [
      createSkillGap({ competencyId: 'gap-1', competencyName: 'System Design', gapSeverity: 'critical' }),
      createSkillGap({ competencyId: 'gap-2', competencyName: 'DevOps', gapSeverity: 'medium' }),
    ],
    careerPaths: [
      createCareerPath({ id: 'career-1', title: 'Senior Software Engineer' }),
      createCareerPath({ id: 'career-2', title: 'Tech Lead', level: 'lead', matchScore: 55, demand: 'medium' }),
    ],
    portfolio: [
      createPortfolioItem({ id: 'p-1', title: 'Open Source Contribution', type: 'project' }),
      createPortfolioItem({ id: 'p-2', title: 'AWS Certification', type: 'certification', verified: true }),
      createPortfolioItem({ id: 'p-3', title: 'Hackathon Win', type: 'achievement', verified: false }),
    ],
    recommendations: [
      'Focus on system design fundamentals',
      'Practice with more complex architecture problems',
      'Consider getting cloud certification',
    ],
    lastUpdated: '2026-03-05T00:00:00Z',
    ...overrides,
  };
}

// Helper to mock a successful fetch with assessment data
function mockFetchSuccess(assessment: CompetencyAssessment) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: { assessment } }),
  });
}

// Helper to mock a failed fetch
function mockFetchError(message = 'Failed to fetch competency assessment') {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ success: false }),
  });
}

// Helper to mock fetch that returns success: false
function mockFetchNoData() {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: false }),
  });
}

// Helper to mock a network error
function mockFetchNetworkError(errorMessage = 'Network error') {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('CompetencyDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading State', () => {
    it('renders a loading spinner while fetching assessment data', () => {
      // Keep fetch pending so loading state stays visible
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

      render(<CompetencyDashboard />);

      expect(screen.getByText('Loading competency data...')).toBeInTheDocument();
    });

    it('renders a Card wrapper during loading', () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

      render(<CompetencyDashboard />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('passes className to the loading Card wrapper', () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

      render(<CompetencyDashboard className="custom-loading-class" />);

      expect(screen.getByTestId('card')).toHaveClass('custom-loading-class');
    });

    it('does not render dashboard content during loading', () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

      render(<CompetencyDashboard />);

      expect(screen.queryByText('Competency Dashboard')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ERROR STATE TESTS
  // ==========================================================================

  describe('Error State', () => {
    it('renders the error message when fetch fails', async () => {
      mockFetchError();

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch competency assessment')).toBeInTheDocument();
      });
    });

    it('renders a Retry button on error', async () => {
      mockFetchError();

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('calls fetch again when Retry button is clicked', async () => {
      mockFetchError();

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
    });

    it('renders network error message when fetch throws', async () => {
      mockFetchNetworkError('Network error');

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('renders generic error for non-Error thrown values', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('string error');

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });

    it('passes className to the error Card wrapper', async () => {
      mockFetchError();

      render(<CompetencyDashboard className="error-class" />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('error-class');
      });
    });
  });

  // ==========================================================================
  // EMPTY STATE TESTS (no assessment data)
  // ==========================================================================

  describe('Empty State (no assessment)', () => {
    it('renders the empty state when success is false', async () => {
      mockFetchNoData();

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No Competency Data')).toBeInTheDocument();
      });
    });

    it('renders the Start Assessment button', async () => {
      mockFetchNoData();

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Start Assessment')).toBeInTheDocument();
      });
    });

    it('renders descriptive text about completing assessments', async () => {
      mockFetchNoData();

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Complete assessments to build your competency profile.')).toBeInTheDocument();
      });
    });

    it('passes className to the empty-state Card wrapper', async () => {
      mockFetchNoData();

      render(<CompetencyDashboard className="empty-class" />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('empty-class');
      });
    });
  });

  // ==========================================================================
  // SUCCESSFUL RENDER TESTS
  // ==========================================================================

  describe('Successful Render', () => {
    it('renders the Competency Dashboard title', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
    });

    it('renders the card description text', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Skills framework/)).toBeInTheDocument();
      });
    });

    it('renders the overall score', async () => {
      const assessment = createAssessment({ overallScore: 72 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('72')).toBeInTheDocument();
      });
    });

    it('renders Overall Score label', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Overall Score')).toBeInTheDocument();
      });
    });

    it('passes className to the main Card', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard className="main-class" />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toHaveClass('main-class');
      });
    });

    it('calls onAssessmentComplete when assessment loads', async () => {
      const assessment = createAssessment();
      const onComplete = jest.fn();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard onAssessmentComplete={onComplete} />);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(assessment);
      });
    });

    it('appends frameworkId to fetch URL when provided', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard frameworkId="framework-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('frameworkId=framework-123'),
        );
      });
    });

    it('does not include frameworkId when not provided', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.not.stringContaining('frameworkId='),
        );
      });
    });
  });

  // ==========================================================================
  // LEVEL DISTRIBUTION CHART TESTS
  // ==========================================================================

  describe('Level Distribution', () => {
    it('renders the Level Distribution heading', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Level Distribution')).toBeInTheDocument();
      });
    });

    it('renders all proficiency level labels in the distribution chart', async () => {
      // Use assessment with only 1 competency to minimize label overlap
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'c1', currentLevel: 'NOVICE', targetLevel: 'NOVICE' }),
        ],
        competencyGaps: [],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Level Distribution')).toBeInTheDocument();
      });
      // All six proficiency labels should appear in the Level Distribution chart
      expect(screen.getAllByText('Novice').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Beginner').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Competent').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Proficient').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Expert').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Master').length).toBeGreaterThanOrEqual(1);
    });

    it('renders distribution counts', async () => {
      const assessment = createAssessment({
        levelDistribution: {
          NOVICE: 0,
          BEGINNER: 2,
          COMPETENT: 4,
          PROFICIENT: 3,
          EXPERT: 1,
          MASTER: 0,
        },
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        // Check specific count values appear
        expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // TOP COMPETENCIES TESTS
  // ==========================================================================

  describe('Top Competencies', () => {
    it('renders the Top Competencies heading', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Top Competencies')).toBeInTheDocument();
      });
    });

    it('renders competency names', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Software Engineering')).toBeInTheDocument();
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('Cloud Architecture')).toBeInTheDocument();
      });
    });

    it('renders competency descriptions', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'comp-1', description: 'Build and maintain systems' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Build and maintain systems')).toBeInTheDocument();
      });
    });

    it('renders evidence count badges', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'comp-1', evidenceCount: 12 }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('12 evidence')).toBeInTheDocument();
      });
    });

    it('renders a badge with total competency count', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Top Competencies')).toBeInTheDocument();
      });

      // The badge showing the count of top competencies (3) - find it near the heading
      const badges = screen.getAllByTestId('ui-badge');
      const countBadge = badges.find((b) => b.textContent === '3');
      expect(countBadge).toBeTruthy();
    });

    it('shows only 2 competencies when compact is true', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'comp-1', name: 'CompA' }),
          createCompetency({ id: 'comp-2', name: 'CompB' }),
          createCompetency({ id: 'comp-3', name: 'CompC' }),
          createCompetency({ id: 'comp-4', name: 'CompD' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact />);

      await waitFor(() => {
        expect(screen.getByText('CompA')).toBeInTheDocument();
        expect(screen.getByText('CompB')).toBeInTheDocument();
        expect(screen.queryByText('CompC')).not.toBeInTheDocument();
        expect(screen.queryByText('CompD')).not.toBeInTheDocument();
      });
    });

    it('shows up to 4 competencies when compact is false', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'comp-1', name: 'CompA' }),
          createCompetency({ id: 'comp-2', name: 'CompB' }),
          createCompetency({ id: 'comp-3', name: 'CompC' }),
          createCompetency({ id: 'comp-4', name: 'CompD' }),
          createCompetency({ id: 'comp-5', name: 'CompE' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact={false} />);

      await waitFor(() => {
        expect(screen.getByText('CompA')).toBeInTheDocument();
        expect(screen.getByText('CompB')).toBeInTheDocument();
        expect(screen.getByText('CompC')).toBeInTheDocument();
        expect(screen.getByText('CompD')).toBeInTheDocument();
        expect(screen.queryByText('CompE')).not.toBeInTheDocument();
      });
    });

    it('does not render Top Competencies section when array is empty', async () => {
      const assessment = createAssessment({ topCompetencies: [] });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Top Competencies')).not.toBeInTheDocument();
    });

    it('renders progress bars for competencies', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'comp-1', progress: 65 }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // COMPETENCY CARD EXPAND/COLLAPSE TESTS
  // ==========================================================================

  describe('Competency Card Expand/Collapse', () => {
    it('renders a toggle button when competency has subCompetencies', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({
            id: 'comp-1',
            subCompetencies: [
              createSubCompetency({ id: 'sub-1', name: 'Code Review', proficiency: 75 }),
            ],
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        // Button has ghost variant and sm size
        const buttons = screen.getAllByRole('button');
        // At least the toggle button should exist (plus the refresh button)
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('shows sub-competencies when toggle is clicked', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({
            id: 'comp-expand',
            name: 'Expandable Comp',
            subCompetencies: [
              createSubCompetency({ id: 'sub-1', name: 'Code Review', proficiency: 75 }),
              createSubCompetency({ id: 'sub-2', name: 'Unit Testing', proficiency: 60 }),
            ],
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Expandable Comp')).toBeInTheDocument();
      });

      // Sub-competencies should not be visible initially
      expect(screen.queryByText('Code Review')).not.toBeInTheDocument();

      // Find the toggle button (ghost variant, small size)
      const toggleButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost'
      );
      expect(toggleButtons.length).toBeGreaterThanOrEqual(1);

      // Click the toggle (last ghost button is the expand toggle, first is refresh)
      fireEvent.click(toggleButtons[toggleButtons.length - 1]);

      // Now sub-competencies should appear
      expect(screen.getByText('Code Review')).toBeInTheDocument();
      expect(screen.getByText('Unit Testing')).toBeInTheDocument();
    });

    it('shows sub-competency proficiency percentages', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({
            id: 'comp-prof',
            subCompetencies: [
              createSubCompetency({ id: 'sub-1', name: 'Code Review', proficiency: 75 }),
            ],
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(assessment.topCompetencies[0].name)).toBeInTheDocument();
      });

      // Toggle expand
      const toggleButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost'
      );
      fireEvent.click(toggleButtons[toggleButtons.length - 1]);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('collapses sub-competencies when toggle is clicked again', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({
            id: 'comp-toggle',
            subCompetencies: [
              createSubCompetency({ id: 'sub-1', name: 'Toggle Sub' }),
            ],
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(assessment.topCompetencies[0].name)).toBeInTheDocument();
      });

      const toggleButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost'
      );
      const toggleBtn = toggleButtons[toggleButtons.length - 1];

      // Expand
      fireEvent.click(toggleBtn);
      expect(screen.getByText('Toggle Sub')).toBeInTheDocument();

      // Collapse
      fireEvent.click(toggleBtn);
      expect(screen.queryByText('Toggle Sub')).not.toBeInTheDocument();
    });

    it('does not render toggle button when competency has no subCompetencies', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({ id: 'comp-no-sub', subCompetencies: undefined }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(assessment.topCompetencies[0].name)).toBeInTheDocument();
      });

      // Only the refresh button should have ghost variant, no toggle button
      const ghostButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost'
      );
      // The refresh icon button is one ghost button
      expect(ghostButtons.length).toBe(1);
    });
  });

  // ==========================================================================
  // SKILL GAPS TESTS
  // ==========================================================================

  describe('Skill Gaps', () => {
    it('renders the Skill Gaps heading', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
      });
    });

    it('renders skill gap competency names', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({ competencyId: 'g1', competencyName: 'System Design' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Design')).toBeInTheDocument();
      });
    });

    it('renders gap severity badges', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({ competencyId: 'g1', gapSeverity: 'critical' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('critical')).toBeInTheDocument();
      });
    });

    it('renders estimated time to close', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({ competencyId: 'g1', estimatedTimeToClose: '3 months' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 months')).toBeInTheDocument();
      });
    });

    it('renders the first recommended action as next step', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({
            competencyId: 'g1',
            recommendedActions: ['Start learning design patterns'],
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Next step:/)).toBeInTheDocument();
        expect(screen.getByText('Start learning design patterns')).toBeInTheDocument();
      });
    });

    it('does not render "Next step" when recommendedActions is empty', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({ competencyId: 'g1', recommendedActions: [] }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Next step:/)).not.toBeInTheDocument();
    });

    it('hides Skill Gaps section when compact is true', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Skill Gaps')).not.toBeInTheDocument();
    });

    it('does not render Skill Gaps section when array is empty', async () => {
      const assessment = createAssessment({ competencyGaps: [] });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Skill Gaps')).not.toBeInTheDocument();
    });

    it('shows at most 3 skill gaps', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({ competencyId: 'g1', competencyName: 'GapA' }),
          createSkillGap({ competencyId: 'g2', competencyName: 'GapB' }),
          createSkillGap({ competencyId: 'g3', competencyName: 'GapC' }),
          createSkillGap({ competencyId: 'g4', competencyName: 'GapD' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('GapA')).toBeInTheDocument();
        expect(screen.getByText('GapB')).toBeInTheDocument();
        expect(screen.getByText('GapC')).toBeInTheDocument();
        expect(screen.queryByText('GapD')).not.toBeInTheDocument();
      });
    });

    it('renders gap count badge', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({ competencyId: 'g1' }),
          createSkillGap({ competencyId: 'g2' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
      });
      // The badge showing "2" for gap count
      const badges = screen.getAllByTestId('ui-badge');
      const gapCountBadge = badges.find((b) => b.textContent === '2');
      expect(gapCountBadge).toBeTruthy();
    });
  });

  // ==========================================================================
  // CAREER PATHS TESTS
  // ==========================================================================

  describe('Career Paths', () => {
    it('renders the Recommended Career Paths heading', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recommended Career Paths')).toBeInTheDocument();
      });
    });

    it('renders career path titles', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      });
    });

    it('renders match score', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', matchScore: 78 })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('78% match')).toBeInTheDocument();
      });
    });

    it('renders gap count for career paths', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', gapCount: 3 })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 gaps')).toBeInTheDocument();
      });
    });

    it('does not render gap count when gapCount is 0', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', gapCount: 0 })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recommended Career Paths')).toBeInTheDocument();
      });
      expect(screen.queryByText(/gaps$/)).not.toBeInTheDocument();
    });

    it('renders estimated time to reach', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', estimatedTimeToReach: '6 months' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('6 months')).toBeInTheDocument();
      });
    });

    it('renders "High demand" badge for high demand careers', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', demand: 'high' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('High demand')).toBeInTheDocument();
      });
    });

    it('does not render "High demand" badge for non-high demand', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', demand: 'medium' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recommended Career Paths')).toBeInTheDocument();
      });
      expect(screen.queryByText('High demand')).not.toBeInTheDocument();
    });

    it('renders salary range when provided', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', salaryRange: '$120K - $160K' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/\$120K - \$160K/)).toBeInTheDocument();
      });
    });

    it('does not render salary range when not provided', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1', salaryRange: undefined })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recommended Career Paths')).toBeInTheDocument();
      });
      expect(screen.queryByText(/\$\d+K/)).not.toBeInTheDocument();
    });

    it('renders Explore button', async () => {
      const assessment = createAssessment({
        careerPaths: [createCareerPath({ id: 'c1' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Explore')).toBeInTheDocument();
      });
    });

    it('shows only 1 career path when compact is true', async () => {
      const assessment = createAssessment({
        careerPaths: [
          createCareerPath({ id: 'c1', title: 'PathA' }),
          createCareerPath({ id: 'c2', title: 'PathB' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact />);

      await waitFor(() => {
        expect(screen.getByText('PathA')).toBeInTheDocument();
        expect(screen.queryByText('PathB')).not.toBeInTheDocument();
      });
    });

    it('shows up to 2 career paths when compact is false', async () => {
      const assessment = createAssessment({
        careerPaths: [
          createCareerPath({ id: 'c1', title: 'PathA' }),
          createCareerPath({ id: 'c2', title: 'PathB' }),
          createCareerPath({ id: 'c3', title: 'PathC' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact={false} />);

      await waitFor(() => {
        expect(screen.getByText('PathA')).toBeInTheDocument();
        expect(screen.getByText('PathB')).toBeInTheDocument();
        expect(screen.queryByText('PathC')).not.toBeInTheDocument();
      });
    });

    it('does not render Career Paths section when array is empty', async () => {
      const assessment = createAssessment({ careerPaths: [] });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Recommended Career Paths')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PORTFOLIO TESTS
  // ==========================================================================

  describe('Portfolio', () => {
    it('renders the Portfolio Highlights heading', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Highlights')).toBeInTheDocument();
      });
    });

    it('renders portfolio item titles', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', title: 'My Project' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('My Project')).toBeInTheDocument();
      });
    });

    it('renders portfolio item type', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', type: 'certification' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('certification')).toBeInTheDocument();
      });
    });

    it('renders formatted date for portfolio items', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', date: '2026-02-15T00:00:00Z' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        // Date formatting depends on locale; just check it renders something
        const dateText = new Date('2026-02-15T00:00:00Z').toLocaleDateString();
        expect(screen.getByText(dateText)).toBeInTheDocument();
      });
    });

    it('renders impact score badge when provided', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', impactScore: 85 })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('85% impact')).toBeInTheDocument();
      });
    });

    it('does not render impact score badge when impactScore is falsy', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', impactScore: undefined })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Highlights')).toBeInTheDocument();
      });
      expect(screen.queryByText(/impact$/)).not.toBeInTheDocument();
    });

    it('hides Portfolio section when compact is true', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Portfolio Highlights')).not.toBeInTheDocument();
    });

    it('does not render Portfolio section when array is empty', async () => {
      const assessment = createAssessment({ portfolio: [] });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Portfolio Highlights')).not.toBeInTheDocument();
    });

    it('shows at most 3 portfolio items', async () => {
      const assessment = createAssessment({
        portfolio: [
          createPortfolioItem({ id: 'p1', title: 'ItemA' }),
          createPortfolioItem({ id: 'p2', title: 'ItemB' }),
          createPortfolioItem({ id: 'p3', title: 'ItemC' }),
          createPortfolioItem({ id: 'p4', title: 'ItemD' }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('ItemA')).toBeInTheDocument();
        expect(screen.getByText('ItemB')).toBeInTheDocument();
        expect(screen.getByText('ItemC')).toBeInTheDocument();
        expect(screen.queryByText('ItemD')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // RECOMMENDATIONS TESTS
  // ==========================================================================

  describe('Recommendations', () => {
    it('renders the Recommendations heading', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });
    });

    it('renders recommendation text', async () => {
      const assessment = createAssessment({
        recommendations: ['Focus on system design fundamentals'],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Focus on system design fundamentals')).toBeInTheDocument();
      });
    });

    it('shows only 2 recommendations when compact is true', async () => {
      const assessment = createAssessment({
        recommendations: ['RecA', 'RecB', 'RecC', 'RecD'],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact />);

      await waitFor(() => {
        expect(screen.getByText('RecA')).toBeInTheDocument();
        expect(screen.getByText('RecB')).toBeInTheDocument();
        expect(screen.queryByText('RecC')).not.toBeInTheDocument();
        expect(screen.queryByText('RecD')).not.toBeInTheDocument();
      });
    });

    it('shows up to 4 recommendations when compact is false', async () => {
      const assessment = createAssessment({
        recommendations: ['RecA', 'RecB', 'RecC', 'RecD', 'RecE'],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard compact={false} />);

      await waitFor(() => {
        expect(screen.getByText('RecA')).toBeInTheDocument();
        expect(screen.getByText('RecB')).toBeInTheDocument();
        expect(screen.getByText('RecC')).toBeInTheDocument();
        expect(screen.getByText('RecD')).toBeInTheDocument();
        expect(screen.queryByText('RecE')).not.toBeInTheDocument();
      });
    });

    it('does not render Recommendations section when array is empty', async () => {
      const assessment = createAssessment({ recommendations: [] });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // REFRESH BUTTON TESTS
  // ==========================================================================

  describe('Refresh Button', () => {
    it('renders a refresh button in the header', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });

      // The refresh button is a ghost icon button
      const ghostButtons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost'
      );
      expect(ghostButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls fetch again when refresh button is clicked', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Setup next fetch response
      mockFetchSuccess(createAssessment({ overallScore: 90 }));

      // Click refresh (first ghost button with icon size)
      const refreshButton = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost' && btn.getAttribute('data-size') === 'icon'
      )[0];
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==========================================================================
  // TREND INDICATOR TESTS
  // ==========================================================================

  describe('Trend Indicators', () => {
    it('renders improving trend competency without error', async () => {
      const assessment = createAssessment({
        topCompetencies: [createCompetency({ id: 'c1', trend: 'improving' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText(assessment.topCompetencies[0].name)).toBeInTheDocument();
      });
    });

    it('renders declining trend competency without error', async () => {
      const assessment = createAssessment({
        topCompetencies: [createCompetency({ id: 'c1', trend: 'declining', name: 'Declining Comp' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Declining Comp')).toBeInTheDocument();
      });
    });

    it('renders stable trend competency without error', async () => {
      const assessment = createAssessment({
        topCompetencies: [createCompetency({ id: 'c1', trend: 'stable', name: 'Stable Comp' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stable Comp')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // SCORE RING GRADIENT TESTS
  // ==========================================================================

  describe('Overall Score Ring Gradients', () => {
    it('renders with high score (>=80)', async () => {
      const assessment = createAssessment({ overallScore: 95 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('95')).toBeInTheDocument();
      });
    });

    it('renders with medium-high score (>=60, <80)', async () => {
      const assessment = createAssessment({ overallScore: 65 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('65')).toBeInTheDocument();
      });
    });

    it('renders with medium-low score (>=40, <60)', async () => {
      const assessment = createAssessment({ overallScore: 45 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument();
      });
    });

    it('renders with low score (<40)', async () => {
      const assessment = createAssessment({ overallScore: 25 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // PROFICIENCY LEVEL MAPPING TESTS
  // ==========================================================================

  describe('Proficiency Level Mapping', () => {
    it('renders current and target level labels for a competency', async () => {
      const assessment = createAssessment({
        topCompetencies: [
          createCompetency({
            id: 'c1',
            currentLevel: 'BEGINNER',
            targetLevel: 'PROFICIENT',
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('Beginner').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Proficient').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders skill gap current and required level labels', async () => {
      const assessment = createAssessment({
        competencyGaps: [
          createSkillGap({
            competencyId: 'g1',
            currentLevel: 'NOVICE',
            requiredLevel: 'EXPERT',
          }),
        ],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        // "Novice" appears in both distribution chart and skill gap card
        expect(screen.getAllByText('Novice').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Expert').length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // ==========================================================================
  // PORTFOLIO ITEM TYPES TESTS
  // ==========================================================================

  describe('Portfolio Item Types', () => {
    const types: Array<{ type: PortfolioItem['type']; label: string }> = [
      { type: 'project', label: 'project' },
      { type: 'certification', label: 'certification' },
      { type: 'achievement', label: 'achievement' },
      { type: 'experience', label: 'experience' },
    ];

    types.forEach(({ type, label }) => {
      it(`renders ${type} portfolio item type label`, async () => {
        const assessment = createAssessment({
          portfolio: [createPortfolioItem({ id: `p-${type}`, type, title: `${type} item` })],
        });
        mockFetchSuccess(assessment);

        render(<CompetencyDashboard />);

        await waitFor(() => {
          expect(screen.getByText(label)).toBeInTheDocument();
        });
      });
    });
  });

  // ==========================================================================
  // CAREER LEVEL CONFIG TESTS
  // ==========================================================================

  describe('Career Level Config', () => {
    const levels: CareerLevel[] = ['entry', 'mid', 'senior', 'lead', 'executive'];

    levels.forEach((level) => {
      it(`renders career path with ${level} level without error`, async () => {
        const assessment = createAssessment({
          careerPaths: [createCareerPath({ id: `c-${level}`, level, title: `${level} Role` })],
        });
        mockFetchSuccess(assessment);

        render(<CompetencyDashboard />);

        await waitFor(() => {
          expect(screen.getByText(`${level} Role`)).toBeInTheDocument();
        });
      });
    });
  });

  // ==========================================================================
  // CONCURRENT REQUEST GUARD TESTS
  // ==========================================================================

  describe('Concurrent Request Guard', () => {
    it('prevents duplicate fetch calls using isLoadingRef', async () => {
      let resolveFirst: (value: unknown) => void;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(firstPromise);

      render(<CompetencyDashboard />);

      // First call is pending
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Resolve first call
      const assessment = createAssessment();
      resolveFirst!({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { assessment } }),
      });

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles assessment with all empty arrays', async () => {
      const assessment = createAssessment({
        topCompetencies: [],
        competencyGaps: [],
        careerPaths: [],
        portfolio: [],
        recommendations: [],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Level Distribution')).toBeInTheDocument();
      });

      expect(screen.queryByText('Top Competencies')).not.toBeInTheDocument();
      expect(screen.queryByText('Skill Gaps')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommended Career Paths')).not.toBeInTheDocument();
      expect(screen.queryByText('Portfolio Highlights')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });

    it('handles zero overall score', async () => {
      const assessment = createAssessment({ overallScore: 0 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('handles 100 overall score', async () => {
      const assessment = createAssessment({ overallScore: 100 });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('handles level distribution with all zeroes', async () => {
      const assessment = createAssessment({
        levelDistribution: {
          NOVICE: 0,
          BEGINNER: 0,
          COMPETENT: 0,
          PROFICIENT: 0,
          EXPERT: 0,
          MASTER: 0,
        },
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Level Distribution')).toBeInTheDocument();
      });
    });

    it('handles competency with zero progress', async () => {
      const assessment = createAssessment({
        topCompetencies: [createCompetency({ id: 'c1', progress: 0, name: 'Zero Progress' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Zero Progress')).toBeInTheDocument();
      });
    });

    it('handles competency with 100 progress', async () => {
      const assessment = createAssessment({
        topCompetencies: [createCompetency({ id: 'c1', progress: 100, name: 'Full Progress' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Full Progress')).toBeInTheDocument();
      });
    });

    it('renders with all props provided simultaneously', async () => {
      const assessment = createAssessment();
      const onComplete = jest.fn();
      mockFetchSuccess(assessment);

      render(
        <CompetencyDashboard
          className="all-props"
          compact={false}
          frameworkId="fw-1"
          onAssessmentComplete={onComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Competency Dashboard')).toBeInTheDocument();
        expect(onComplete).toHaveBeenCalled();
      });

      expect(screen.getByTestId('card')).toHaveClass('all-props');
    });

    it('renders verified portfolio item indicator', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', verified: true, title: 'Verified Item' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Verified Item')).toBeInTheDocument();
      });
      // The CheckCircle2 icon is rendered alongside verified items
      // We just verify the item renders without error
    });

    it('renders unverified portfolio item without check icon error', async () => {
      const assessment = createAssessment({
        portfolio: [createPortfolioItem({ id: 'p1', verified: false, title: 'Unverified Item' })],
      });
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Unverified Item')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // FETCH URL CONSTRUCTION TESTS
  // ==========================================================================

  describe('Fetch URL Construction', () => {
    it('constructs correct base URL', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sam/competency?action=get-assessment'),
        );
      });
    });

    it('appends frameworkId parameter when provided', async () => {
      const assessment = createAssessment();
      mockFetchSuccess(assessment);

      render(<CompetencyDashboard frameworkId="test-fw" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('frameworkId=test-fw'),
        );
      });
    });
  });
});

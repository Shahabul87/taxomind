import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// Due to ESM/CJS interop the mock icons render with data-testid="icon-default".
// The framer-motion mock is provided globally via jest.setup.js.
// The logger mock is provided globally via jest.setup.js.

// Mock UI components - consistent with other analytics test files
jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  ),
}));

// Use React Context to propagate onValueChange through arbitrary DOM nesting.
// The component wraps TabsList in a raw <div> for touch handling, which breaks
// React.Children.map-based prop drilling. Context bypasses that.
const TabsContext = React.createContext<{
  onValueChange?: (val: string) => void;
}>({});

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (val: string) => void;
  }) => (
    <TabsContext.Provider value={{ onValueChange }}>
      <div data-testid="tabs" data-value={value}>
        {children}
      </div>
    </TabsContext.Provider>
  ),
  TabsList: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs-list" className={className} role="tablist">
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
    onTouchStart?: (e: React.TouchEvent) => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
  }) => {
    const { onValueChange } = React.useContext(TabsContext);
    return (
      <button
        data-testid={`tab-trigger-${value}`}
        className={className}
        role="tab"
        onClick={() => onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => (
    <div data-testid={`tab-content-${value}`} className={className} role="tabpanel">
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
      style={{ width: `${value}%` }}
    />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    size,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    variant?: string;
    size?: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <button
      data-testid="action-button"
      data-variant={variant}
      data-size={size}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

// Mock child components - capture props to verify correct data is passed
const mockBloomsTaxonomyMap = jest.fn(({ levels }) => (
  <div data-testid="blooms-taxonomy-map" data-levels={JSON.stringify(levels)}>
    BloomsTaxonomyMap
  </div>
));

const mockCognitiveMindMap = jest.fn(({ cognitiveData }) => (
  <div data-testid="cognitive-mind-map" data-cognitive-data={JSON.stringify(cognitiveData)}>
    CognitiveMindMap
  </div>
));

const mockStrengthWeaknessAnalysis = jest.fn(({ cognitiveData }) => (
  <div data-testid="strength-weakness-analysis" data-cognitive-data={JSON.stringify(cognitiveData)}>
    StrengthWeaknessAnalysis
  </div>
));

const mockLearningPathRecommendations = jest.fn(({ cognitiveData }) => (
  <div data-testid="learning-path-recommendations" data-cognitive-data={JSON.stringify(cognitiveData)}>
    LearningPathRecommendations
  </div>
));

jest.mock('@/components/analytics/BloomsTaxonomyMap', () => ({
  BloomsTaxonomyMap: (props: Record<string, unknown>) => mockBloomsTaxonomyMap(props),
}));

jest.mock('@/components/analytics/CognitiveMindMap', () => ({
  CognitiveMindMap: (props: Record<string, unknown>) => mockCognitiveMindMap(props),
}));

jest.mock('@/components/analytics/StrengthWeaknessAnalysis', () => ({
  StrengthWeaknessAnalysis: (props: Record<string, unknown>) => mockStrengthWeaknessAnalysis(props),
}));

jest.mock('@/components/analytics/LearningPathRecommendations', () => ({
  LearningPathRecommendations: (props: Record<string, unknown>) => mockLearningPathRecommendations(props),
}));

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { CognitiveAnalytics } from '@/components/analytics/CognitiveAnalytics';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-123',
    name: 'Test Student',
    email: 'student@test.com',
    image: null,
    ...overrides,
  };
}

/**
 * Creates a successful API response matching the shape returned by
 * /api/sam/blooms-analysis/student
 */
function createSuccessfulApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      studentProgress: {
        bloomsScores: {
          REMEMBER: 92,
          UNDERSTAND: 85,
          APPLY: 74,
          ANALYZE: 68,
          EVALUATE: 62,
          CREATE: 55,
        },
        strengthAreas: ['Strong memory recall', 'Good comprehension'],
        weaknessAreas: ['Critical thinking', 'Creative problem solving'],
      },
      performanceMetrics: {
        REMEMBER: { totalAttempts: 45, successRate: 0.91 },
        UNDERSTAND: { totalAttempts: 38, successRate: 0.84 },
        APPLY: { totalAttempts: 32, successRate: 0.75 },
        ANALYZE: { totalAttempts: 28, successRate: 0.68 },
        EVALUATE: { totalAttempts: 22, successRate: 0.64 },
        CREATE: { totalAttempts: 18, successRate: 0.56 },
      },
      cognitiveProfile: {
        overallCognitiveLevel: 78,
        optimalLearningStyle: 'Visual-Analytical',
        performancePatterns: {
          growthRate: 23,
          consistency: 82,
        },
      },
      ...overrides,
    },
  };
}

/**
 * Creates a mock fetch that returns the given response body.
 */
function mockFetchSuccess(responseBody: Record<string, unknown>) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(responseBody),
  });
}

/**
 * Creates a mock fetch that simulates a non-ok server response.
 */
function mockFetchError(statusCode = 500) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status: statusCode,
    json: () => Promise.resolve({ error: 'Server error' }),
  });
}

/**
 * Creates a mock fetch that rejects (network failure).
 */
function mockFetchReject(message = 'Network error') {
  return jest.fn().mockRejectedValue(new Error(message));
}

// ============================================================================
// TESTS
// ============================================================================

describe('CognitiveAnalytics', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockBloomsTaxonomyMap.mockClear();
    mockCognitiveMindMap.mockClear();
    mockStrengthWeaknessAnalysis.mockClear();
    mockLearningPathRecommendations.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // 1. Shows loading state initially
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows loading state initially before fetch resolves', async () => {
      // Use a fetch that never resolves so we stay in loading state
      global.fetch = jest.fn(
        () => new Promise(() => {/* never resolves */}),
      );

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      expect(
        screen.getByText('Analyzing your cognitive patterns...'),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /Processing learning data through Bloom/,
        ),
      ).toBeInTheDocument();
    });

    it('renders the spinner in loading state', async () => {
      global.fetch = jest.fn(
        () => new Promise(() => {/* never resolves */}),
      );

      let container: HTMLElement;
      await act(async () => {
        const result = render(<CognitiveAnalytics user={createMockUser()} />);
        container = result.container;
      });

      // The spinner has animate-spin class
      const spinner = container!.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();

      // Icon SVGs are present (rendered as data-testid="icon-default" due to ESM/CJS interop)
      const icons = container!.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Renders data after successful fetch
  // --------------------------------------------------------------------------

  describe('successful data rendering', () => {
    it('renders cognitive data after successful API fetch', async () => {
      const apiResponse = createSuccessfulApiResponse();
      global.fetch = mockFetchSuccess(apiResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Analyzing your cognitive patterns...'),
        ).not.toBeInTheDocument();
      });

      // The header section should appear
      expect(screen.getByText('Cognitive Analytics')).toBeInTheDocument();
      expect(
        screen.getByText('Your Learning Intelligence Profile'),
      ).toBeInTheDocument();
    });

    it('displays the overall cognitive score from API', async () => {
      const apiResponse = createSuccessfulApiResponse();
      global.fetch = mockFetchSuccess(apiResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByText('78%')).toBeInTheDocument();
      });

      expect(screen.getByText('Overall Cognitive Score')).toBeInTheDocument();
    });

    it('displays the section title and subtitle', async () => {
      const apiResponse = createSuccessfulApiResponse();
      global.fetch = mockFetchSuccess(apiResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cognitive Development Analysis'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Based on Bloom/),
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Shows error state / fallback on fetch failure
  // --------------------------------------------------------------------------

  describe('error state with fallback mock data', () => {
    it('falls back to mock data when API returns non-ok response', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchError(500);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      // The component uses a 500ms setTimeout before setting mock data
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // After fallback, mock data is set with overallScore = 78
      await waitFor(() => {
        expect(screen.getByText('78%')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('Analyzing your cognitive patterns...'),
      ).not.toBeInTheDocument();
    });

    it('falls back to mock data when fetch rejects entirely', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchReject('Network failure');

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // Fallback mock data has studyEfficiency of 82
      await waitFor(() => {
        expect(screen.getByText('82%')).toBeInTheDocument();
      });
    });

    it('logs error when fetch fails', async () => {
      jest.useFakeTimers();
      const { logger } = require('@/lib/logger');
      global.fetch = mockFetchReject('Test network failure');

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          '[COGNITIVE_ANALYTICS] Error fetching cognitive data:',
          expect.any(Error),
        );
      });
    });

    it('fallback mock data contains all 6 Bloom taxonomy levels', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchError(500);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const callArgs = mockBloomsTaxonomyMap.mock.calls[0][0];
      expect(callArgs.levels).toHaveLength(6);

      const levelNames = callArgs.levels.map(
        (l: { level: string }) => l.level,
      );
      expect(levelNames).toEqual([
        'Remember',
        'Understand',
        'Apply',
        'Analyze',
        'Evaluate',
        'Create',
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Shows empty state when no data (API returns success but no data)
  // --------------------------------------------------------------------------

  describe('empty state', () => {
    it('shows empty state when API returns success: true but no data', async () => {
      global.fetch = mockFetchSuccess({ success: true, data: null });

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cognitive Analysis Unavailable'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          /Complete some assessments to unlock your cognitive analysis/,
        ),
      ).toBeInTheDocument();
    });

    it('shows empty state when API returns success: false', async () => {
      global.fetch = mockFetchSuccess({ success: false });

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cognitive Analysis Unavailable'),
        ).toBeInTheDocument();
      });
    });

    it('logs warning when no cognitive data available', async () => {
      const { logger } = require('@/lib/logger');
      global.fetch = mockFetchSuccess({ success: true, data: null });

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(logger.warn).toHaveBeenCalledWith(
          '[COGNITIVE_ANALYTICS] No cognitive data available',
        );
      });
    });

    it('renders the AlertTriangle icon area in empty state', async () => {
      global.fetch = mockFetchSuccess({ success: false });

      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <CognitiveAnalytics user={createMockUser()} />,
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cognitive Analysis Unavailable'),
        ).toBeInTheDocument();
      });

      // The empty state has an icon area with gradient background
      const iconContainer = container!.querySelector(
        '.bg-gradient-to-br.from-amber-400.to-orange-400',
      );
      expect(iconContainer).toBeTruthy();

      // SVG icon is present in the icon container
      const icon = iconContainer!.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Tab navigation between 4 tabs
  // --------------------------------------------------------------------------

  describe('tab navigation', () => {
    it('renders all 4 tab triggers', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-trigger-mindmap')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-strengths')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-pathway')).toBeInTheDocument();
    });

    it('defaults to the overview tab', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        const tabs = screen.getByTestId('tabs');
        expect(tabs).toHaveAttribute('data-value', 'overview');
      });
    });

    it('switches to mindmap tab when clicked', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-mindmap')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('tab-trigger-mindmap'));
      });

      await waitFor(() => {
        const tabs = screen.getByTestId('tabs');
        expect(tabs).toHaveAttribute('data-value', 'mindmap');
      });
    });

    it('switches to strengths tab when clicked', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-strengths')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('tab-trigger-strengths'));
      });

      await waitFor(() => {
        const tabs = screen.getByTestId('tabs');
        expect(tabs).toHaveAttribute('data-value', 'strengths');
      });
    });

    it('switches to pathway tab when clicked', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-pathway')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('tab-trigger-pathway'));
      });

      await waitFor(() => {
        const tabs = screen.getByTestId('tabs');
        expect(tabs).toHaveAttribute('data-value', 'pathway');
      });
    });

    it('renders all 4 tab content panels', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-content-mindmap')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-strengths')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-pathway')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Passes correct data to child components
  // --------------------------------------------------------------------------

  describe('child component data passing', () => {
    it('passes correct levels to BloomsTaxonomyMap', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const { levels } = mockBloomsTaxonomyMap.mock.calls[0][0];
      expect(levels).toHaveLength(6);

      // Verify each level has the expected structure
      expect(levels[0].level).toBe('Remember');
      expect(levels[0].score).toBe(92);
      expect(levels[0].maxScore).toBe(100);
      expect(levels[0].description).toBe('Recalling facts and basic concepts');

      expect(levels[1].level).toBe('Understand');
      expect(levels[1].score).toBe(85);

      expect(levels[2].level).toBe('Apply');
      expect(levels[2].score).toBe(74);

      expect(levels[3].level).toBe('Analyze');
      expect(levels[3].score).toBe(68);

      expect(levels[4].level).toBe('Evaluate');
      expect(levels[4].score).toBe(62);

      expect(levels[5].level).toBe('Create');
      expect(levels[5].score).toBe(55);
    });

    it('passes cognitiveData to CognitiveMindMap', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockCognitiveMindMap).toHaveBeenCalled();
      });

      const { cognitiveData } = mockCognitiveMindMap.mock.calls[0][0];
      expect(cognitiveData.overallScore).toBe(78);
      expect(cognitiveData.learningStyle).toBe('Visual-Analytical');
      expect(cognitiveData.cognitiveGrowth).toBe(23);
    });

    it('passes cognitiveData to StrengthWeaknessAnalysis', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockStrengthWeaknessAnalysis).toHaveBeenCalled();
      });

      const { cognitiveData } = mockStrengthWeaknessAnalysis.mock.calls[0][0];
      expect(cognitiveData.strengths).toEqual([
        'Strong memory recall',
        'Good comprehension',
      ]);
      expect(cognitiveData.weaknesses).toEqual([
        'Critical thinking',
        'Creative problem solving',
      ]);
    });

    it('passes cognitiveData to LearningPathRecommendations', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockLearningPathRecommendations).toHaveBeenCalled();
      });

      const { cognitiveData } = mockLearningPathRecommendations.mock.calls[0][0];
      expect(cognitiveData.overallScore).toBe(78);
      expect(cognitiveData.bloomsLevels).toHaveLength(6);
    });

    it('computes correct questions and correct counts from API metrics', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const { levels } = mockBloomsTaxonomyMap.mock.calls[0][0];

      // REMEMBER: totalAttempts=45, successRate=0.91 -> correct=Math.round(0.91*45)=41
      expect(levels[0].questions).toBe(45);
      expect(levels[0].correct).toBe(41);

      // UNDERSTAND: totalAttempts=38, successRate=0.84 -> correct=Math.round(0.84*38)=32
      expect(levels[1].questions).toBe(38);
      expect(levels[1].correct).toBe(32);

      // APPLY: totalAttempts=32, successRate=0.75 -> correct=Math.round(0.75*32)=24
      expect(levels[2].questions).toBe(32);
      expect(levels[2].correct).toBe(24);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Shows overview metrics (overall score, growth, study efficiency, retention)
  // --------------------------------------------------------------------------

  describe('overview metrics cards', () => {
    it('displays Study Efficiency metric', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Study Efficiency')).toBeInTheDocument();
      });

      // studyEfficiency = cognitiveProfile.performancePatterns.consistency = 82
      expect(screen.getByText('82%')).toBeInTheDocument();
    });

    it('displays Retention Rate metric', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Retention Rate')).toBeInTheDocument();
      });

      // retentionRate = bloomsScores.REMEMBER = 92
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('displays Understanding metric', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Understanding')).toBeInTheDocument();
      });

      // conceptualUnderstanding = bloomsScores.UNDERSTAND = 85
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays Application metric', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Application')).toBeInTheDocument();
      });

      // applicationSkills = bloomsScores.APPLY = 74
      expect(screen.getByText('74%')).toBeInTheDocument();
    });

    it('renders all 4 metric cards in a grid', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        const labels = [
          'Study Efficiency',
          'Retention Rate',
          'Understanding',
          'Application',
        ];
        for (const label of labels) {
          expect(screen.getByText(label)).toBeInTheDocument();
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 8. Calls correct API endpoint
  // --------------------------------------------------------------------------

  describe('API endpoint invocation', () => {
    it('calls /api/sam/blooms-analysis/student with GET method', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sam/blooms-analysis/student',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      );
    });

    it('calls fetch exactly once on mount', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('includes credentials: include in the fetch request', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].credentials).toBe('include');
    });
  });

  // --------------------------------------------------------------------------
  // 9. Bloom's level transformation logic
  // --------------------------------------------------------------------------

  describe('data transformation from API', () => {
    it('generates improvement messages based on scores above 70', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const { levels } = mockBloomsTaxonomyMap.mock.calls[0][0];

      // REMEMBER score=92 (>70) -> positive improvements
      expect(levels[0].improvements).toContain(
        'Excellent factual recall abilities',
      );

      // UNDERSTAND score=85 (>70) -> positive improvements
      expect(levels[1].improvements).toContain(
        'Good comprehension of material',
      );

      // ANALYZE score=68 (<= 70) -> needs improvement messages
      expect(levels[3].improvements).toContain(
        'Develop analytical thinking skills',
      );

      // CREATE score=55 (<=70) -> needs improvement messages
      expect(levels[5].improvements).toContain('Develop creative thinking');
    });

    it('generates recommendedFocus from weakness areas', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockStrengthWeaknessAnalysis).toHaveBeenCalled();
      });

      const { cognitiveData } = mockStrengthWeaknessAnalysis.mock.calls[0][0];
      expect(cognitiveData.recommendedFocus).toEqual([
        'Improve critical thinking skills',
        'Improve creative problem solving skills',
      ]);
    });

    it('generates nextMilestones from levels below 70', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockCognitiveMindMap).toHaveBeenCalled();
      });

      const { cognitiveData } = mockCognitiveMindMap.mock.calls[0][0];
      // Levels below 70: Analyze(68), Evaluate(62), Create(55) -> first 3
      expect(cognitiveData.nextMilestones).toEqual([
        'Master Analyze level concepts',
        'Master Evaluate level concepts',
        'Master Create level concepts',
      ]);
    });

    it('handles API response with missing optional fields gracefully', async () => {
      const sparseResponse = {
        success: true,
        data: {
          studentProgress: {
            // No bloomsScores, no strengthAreas, no weaknessAreas
          },
          performanceMetrics: {},
          cognitiveProfile: {
            // No overallCognitiveLevel, no optimalLearningStyle, no performancePatterns
          },
        },
      };

      global.fetch = mockFetchSuccess(sparseResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      // Should not crash; should render with zero values
      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const { levels } = mockBloomsTaxonomyMap.mock.calls[0][0];

      // All scores should be 0 when no bloomsScores provided
      for (const level of levels) {
        expect(level.score).toBe(0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 10. Fallback mock data (on error)
  // --------------------------------------------------------------------------

  describe('fallback mock data details', () => {
    it('fallback data has correct overallScore of 78', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchError(500);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByText('78%')).toBeInTheDocument();
      });
    });

    it('fallback data includes strengths and weaknesses', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchError(500);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockStrengthWeaknessAnalysis).toHaveBeenCalled();
      });

      const { cognitiveData } = mockStrengthWeaknessAnalysis.mock.calls[0][0];
      expect(cognitiveData.strengths).toHaveLength(5);
      expect(cognitiveData.strengths[0]).toBe(
        'Strong foundational knowledge (Remember & Understand)',
      );
      expect(cognitiveData.weaknesses).toHaveLength(5);
      expect(cognitiveData.weaknesses[0]).toBe(
        'Higher-order thinking skills need development',
      );
    });

    it('fallback data has expected study metrics', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchError(500);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockCognitiveMindMap).toHaveBeenCalled();
      });

      const { cognitiveData } = mockCognitiveMindMap.mock.calls[0][0];
      expect(cognitiveData.studyEfficiency).toBe(82);
      expect(cognitiveData.retentionRate).toBe(88);
      expect(cognitiveData.conceptualUnderstanding).toBe(79);
      expect(cognitiveData.applicationSkills).toBe(71);
      expect(cognitiveData.learningStyle).toBe('Visual-Analytical');
      expect(cognitiveData.cognitiveGrowth).toBe(23);
    });
  });

  // --------------------------------------------------------------------------
  // className prop
  // --------------------------------------------------------------------------

  describe('className prop', () => {
    it('applies custom className when provided', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <CognitiveAnalytics
            user={createMockUser()}
            className="custom-class"
          />,
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cognitive Analytics'),
        ).toBeInTheDocument();
      });

      // The outermost div should include the custom class
      const outerDiv = container!.firstChild as HTMLElement;
      expect(outerDiv.className).toContain('custom-class');
    });

    it('renders without className when not provided', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <CognitiveAnalytics user={createMockUser()} />,
        );
        container = result.container;
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cognitive Analytics'),
        ).toBeInTheDocument();
      });

      const outerDiv = container!.firstChild as HTMLElement;
      // Should not have 'undefined' or 'null' in className
      expect(outerDiv.className).not.toContain('undefined');
    });
  });

  // --------------------------------------------------------------------------
  // user.id dependency in useEffect
  // --------------------------------------------------------------------------

  describe('useEffect dependency on user.id', () => {
    it('re-fetches when user.id changes via remount', async () => {
      const apiResponse = createSuccessfulApiResponse();
      global.fetch = mockFetchSuccess(apiResponse);

      const { unmount } = render(
        <CognitiveAnalytics user={createMockUser({ id: 'user-1' })} />,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      unmount();

      await act(async () => {
        render(
          <CognitiveAnalytics user={createMockUser({ id: 'user-2' })} />,
        );
      });

      // Should have been called once more for the new user
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // Child component rendering per tab
  // --------------------------------------------------------------------------

  describe('child components rendered in correct tabs', () => {
    it('renders BloomsTaxonomyMap inside the overview tab content', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('blooms-taxonomy-map')).toBeInTheDocument();
      });

      // Verify it is nested within tab-content-overview
      const overviewPanel = screen.getByTestId('tab-content-overview');
      expect(overviewPanel).toContainElement(
        screen.getByTestId('blooms-taxonomy-map'),
      );
    });

    it('renders CognitiveMindMap inside the mindmap tab content', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('cognitive-mind-map')).toBeInTheDocument();
      });

      const mindmapPanel = screen.getByTestId('tab-content-mindmap');
      expect(mindmapPanel).toContainElement(
        screen.getByTestId('cognitive-mind-map'),
      );
    });

    it('renders StrengthWeaknessAnalysis inside the strengths tab content', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('strength-weakness-analysis'),
        ).toBeInTheDocument();
      });

      const strengthsPanel = screen.getByTestId('tab-content-strengths');
      expect(strengthsPanel).toContainElement(
        screen.getByTestId('strength-weakness-analysis'),
      );
    });

    it('renders LearningPathRecommendations inside the pathway tab content', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('learning-path-recommendations'),
        ).toBeInTheDocument();
      });

      const pathwayPanel = screen.getByTestId('tab-content-pathway');
      expect(pathwayPanel).toContainElement(
        screen.getByTestId('learning-path-recommendations'),
      );
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles API response with all zero bloom scores', async () => {
      const zeroResponse = createSuccessfulApiResponse();
      (zeroResponse.data as Record<string, unknown>).studentProgress = {
        bloomsScores: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        strengthAreas: [],
        weaknessAreas: [],
      };
      (zeroResponse.data as Record<string, unknown>).cognitiveProfile = {
        overallCognitiveLevel: 0,
        performancePatterns: { growthRate: 0, consistency: 0 },
      };

      global.fetch = mockFetchSuccess(zeroResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        // overallScore would be 0
        const zeroPercents = screen.getAllByText('0%');
        expect(zeroPercents.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('handles API response with all perfect bloom scores', async () => {
      const perfectResponse = createSuccessfulApiResponse();
      (perfectResponse.data as Record<string, unknown>).studentProgress = {
        bloomsScores: {
          REMEMBER: 100,
          UNDERSTAND: 100,
          APPLY: 100,
          ANALYZE: 100,
          EVALUATE: 100,
          CREATE: 100,
        },
        strengthAreas: [],
        weaknessAreas: [],
      };
      (perfectResponse.data as Record<string, unknown>).cognitiveProfile = {
        overallCognitiveLevel: 100,
        performancePatterns: { growthRate: 100, consistency: 100 },
      };

      global.fetch = mockFetchSuccess(perfectResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      // With all scores at 100, multiple elements contain "100%" text
      // (overall score + 4 metric cards), so use getAllByText
      await waitFor(() => {
        const hundredPercents = screen.getAllByText('100%');
        expect(hundredPercents.length).toBeGreaterThanOrEqual(1);
      });

      // All levels > 70, so no nextMilestones
      const { cognitiveData } = mockCognitiveMindMap.mock.calls[0][0];
      expect(cognitiveData.nextMilestones).toEqual([]);
    });

    it('handles API response with empty weakness areas', async () => {
      const noWeaknessResponse = createSuccessfulApiResponse();
      (noWeaknessResponse.data as Record<string, unknown>).studentProgress = {
        bloomsScores: {
          REMEMBER: 92,
          UNDERSTAND: 85,
          APPLY: 74,
          ANALYZE: 68,
          EVALUATE: 62,
          CREATE: 55,
        },
        strengthAreas: ['Strong memory recall'],
        weaknessAreas: [],
      };

      global.fetch = mockFetchSuccess(noWeaknessResponse);

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockStrengthWeaknessAnalysis).toHaveBeenCalled();
      });

      const { cognitiveData } = mockStrengthWeaknessAnalysis.mock.calls[0][0];
      expect(cognitiveData.weaknesses).toEqual([]);
      expect(cognitiveData.recommendedFocus).toEqual([]);
    });

    it('computes color fields for each Bloom level', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const { levels } = mockBloomsTaxonomyMap.mock.calls[0][0];
      expect(levels[0].color).toBe('from-emerald-500 to-emerald-600');
      expect(levels[1].color).toBe('from-blue-500 to-blue-600');
      expect(levels[2].color).toBe('from-cyan-500 to-cyan-600');
      expect(levels[3].color).toBe('from-amber-500 to-yellow-500');
      expect(levels[4].color).toBe('from-orange-500 to-red-500');
      expect(levels[5].color).toBe('from-purple-500 to-pink-500');
    });

    it('includes examples for each Bloom level', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(mockBloomsTaxonomyMap).toHaveBeenCalled();
      });

      const { levels } = mockBloomsTaxonomyMap.mock.calls[0][0];

      expect(levels[0].examples).toEqual([
        'Historical dates',
        'Scientific formulas',
        'Vocabulary terms',
      ]);
      expect(levels[5].examples).toEqual([
        'Design projects',
        'Creative solutions',
        'Original research',
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // State transitions
  // --------------------------------------------------------------------------

  describe('state transitions', () => {
    it('transitions from loading to data state on successful fetch', async () => {
      global.fetch = mockFetchSuccess(createSuccessfulApiResponse());

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      // Eventually the loading text should disappear and data text should appear
      await waitFor(() => {
        expect(
          screen.queryByText('Analyzing your cognitive patterns...'),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText('Your Learning Intelligence Profile'),
        ).toBeInTheDocument();
      });
    });

    it('transitions from loading to empty state when no data returned', async () => {
      global.fetch = mockFetchSuccess({ success: false });

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Analyzing your cognitive patterns...'),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText('Cognitive Analysis Unavailable'),
        ).toBeInTheDocument();
      });
    });

    it('transitions from loading to fallback data state on error', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetchReject('Connection refused');

      await act(async () => {
        render(<CognitiveAnalytics user={createMockUser()} />);
      });

      // Initially loading
      expect(
        screen.getByText('Analyzing your cognitive patterns...'),
      ).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // After timeout + error handling, fallback data is shown
      await waitFor(() => {
        expect(
          screen.queryByText('Analyzing your cognitive patterns...'),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText('Your Learning Intelligence Profile'),
        ).toBeInTheDocument();
      });
    });
  });
});

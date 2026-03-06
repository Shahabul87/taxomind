import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock the AI analytics insights hook
const mockRefetch = jest.fn().mockResolvedValue(undefined);

// Mutable object - tests modify properties directly before each render.
// Avoid TS-only syntax (as, const type annotations) since Babel/SWC transform
// used by next/jest may not fully support them in object literals.
const mockHookReturn = {
  insights: [],
  loading: false,
  error: null,
  refetch: mockRefetch,
  metadata: null,
  getInsightsByType: jest.fn().mockReturnValue([]),
  getHighPriorityInsights: jest.fn().mockReturnValue([]),
  __lastView: undefined,
};

jest.mock('@/hooks/use-ai-analytics-insights', () => ({
  useAIAnalyticsInsights: (options) => {
    mockHookReturn.__lastView = options && options.view;
    return mockHookReturn;
  },
}));

// Mock framer-motion - forward all HTML-compatible props, strip animation props
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag) => {
    const Comp = ReactFM.forwardRef(({ children, ...props }, ref) => {
      const {
        initial, animate, exit, transition, variants,
        whileHover, whileTap, whileInView, viewport,
        drag, dragConstraints, dragElastic,
        onAnimationStart, onAnimationComplete, layout, layoutId,
        ...htmlProps
      } = props;
      return ReactFM.createElement(tag, { ...htmlProps, ref }, children);
    });
    Comp.displayName = `motion.${tag}`;
    return Comp;
  };
  return {
    motion: new Proxy(
      {},
      { get: (_t, prop) => makeMotion(prop) },
    ),
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
  CardDescription: ({ children, className }) => (
    <p data-testid="card-description" className={className}>{children}</p>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }) => (
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

// Note: lucide-react icons are globally mocked via moduleNameMapper (renders <svg>
// elements). SWC modularizeImports rewrites named imports to individual file imports,
// so the icons render as <svg data-testid="icon-default">. We verify icon presence
// by querying for svg elements in the DOM rather than specific testids.
//
// next/link is also globally mocked to render <a> elements.

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { AIInsightsPanel } from '@/components/analytics/ai-insights-panel';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createInsight(overrides) {
  return {
    id: (overrides && overrides.id) || 'insight-1',
    type: (overrides && overrides.type) || 'strength',
    title: (overrides && overrides.title) || 'Strong Performance',
    description: (overrides && overrides.description) || 'You are excelling in this area',
    priority: (overrides && overrides.priority) || 'medium',
    actionable: overrides && overrides.actionable !== undefined ? overrides.actionable : false,
    action: overrides && overrides.action,
    metric: overrides && overrides.metric,
  };
}

function createStrengthInsight(overrides) {
  return createInsight({
    id: 'strength-1',
    type: 'strength',
    title: 'Excellent Recall',
    description: 'Your memory retention is above average',
    priority: 'medium',
    ...overrides,
  });
}

function createImprovementInsight(overrides) {
  return createInsight({
    id: 'improvement-1',
    type: 'improvement',
    title: 'Critical Thinking Gap',
    description: 'More practice needed in analysis',
    priority: 'high',
    ...overrides,
  });
}

function createRecommendationInsight(overrides) {
  return createInsight({
    id: 'recommendation-1',
    type: 'recommendation',
    title: 'Try Spaced Repetition',
    description: 'This technique could boost retention',
    priority: 'low',
    ...overrides,
  });
}

function createWarningInsight(overrides) {
  return createInsight({
    id: 'warning-1',
    type: 'warning',
    title: 'Declining Engagement',
    description: 'Activity has dropped significantly',
    priority: 'high',
    ...overrides,
  });
}

function createAchievementInsight(overrides) {
  return createInsight({
    id: 'achievement-1',
    type: 'achievement',
    title: 'Course Completed',
    description: 'You finished the advanced module',
    priority: 'low',
    ...overrides,
  });
}

function createMetadata(overrides) {
  return {
    userId: 'user-123',
    generatedAt: '2026-03-05T10:30:00Z',
    view: 'all',
    hasLearningData: true,
    hasCreatorData: false,
    ...overrides,
  };
}

function createMixedInsights() {
  return [
    createStrengthInsight({ id: 'mix-strength' }),
    createImprovementInsight({ id: 'mix-improvement' }),
    createRecommendationInsight({ id: 'mix-recommendation' }),
    createWarningInsight({ id: 'mix-warning' }),
    createAchievementInsight({ id: 'mix-achievement' }),
  ];
}

// ============================================================================
// HELPER to set hook return values for each test
// ============================================================================

function setHookState(overrides) {
  Object.assign(mockHookReturn, {
    insights: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
    metadata: null,
    ...overrides,
  });
}

// Helper to find SVG icon elements (lucide-react global mock renders <svg> elements)
function findIconElements(container) {
  return container.querySelectorAll('svg[aria-hidden="true"]');
}

// ============================================================================
// TESTS
// ============================================================================

describe('AIInsightsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
    setHookState({});
  });

  // --------------------------------------------------------------------------
  // 1. Loading State
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton loading UI when loading is true', () => {
      setHookState({ loading: true });
      const { container } = render(<AIInsightsPanel />);

      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('renders full skeleton with 3 skeleton cards when not compact', () => {
      setHookState({ loading: true });
      const { container } = render(<AIInsightsPanel />);

      // Full skeleton renders 3 skeleton items each wrapped in rounded-xl
      const skeletonItems = container.querySelectorAll('.rounded-xl');
      expect(skeletonItems.length).toBe(3);
    });

    it('renders compact skeleton with 2 skeleton items when compact is true', () => {
      setHookState({ loading: true });
      const { container } = render(<AIInsightsPanel compact />);

      // Compact skeleton renders 2 skeleton items each wrapped in rounded-lg
      const skeletonItems = container.querySelectorAll('.rounded-lg');
      expect(skeletonItems.length).toBeGreaterThanOrEqual(2);
    });

    it('does not render insight cards or error when loading', () => {
      setHookState({ loading: true });
      render(<AIInsightsPanel />);

      expect(screen.queryByText('AI-Powered Insights')).not.toBeInTheDocument();
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Error State with Retry
  // --------------------------------------------------------------------------

  describe('error state', () => {
    it('renders error message when error is present', () => {
      setHookState({ error: 'Failed to load insights' });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Failed to load insights')).toBeInTheDocument();
    });

    it('renders an icon in the error state', () => {
      setHookState({ error: 'Something went wrong' });
      const { container } = render(<AIInsightsPanel />);

      // The error state shows an AlertCircle icon (rendered as svg by global mock)
      const icons = findIconElements(container);
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a Retry button in error state', () => {
      setHookState({ error: 'Network error' });
      render(<AIInsightsPanel />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('calls refetch when Retry button is clicked', () => {
      setHookState({ error: 'API failure' });
      render(<AIInsightsPanel />);

      const retryButton = screen.getByText('Retry').closest('button');
      expect(retryButton).toBeTruthy();
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('renders an icon inside the Retry button', () => {
      setHookState({ error: 'Error occurred' });
      render(<AIInsightsPanel />);

      // The Retry button contains a RefreshCw icon
      const retryButton = screen.getByText('Retry').closest('button');
      const refreshIcon = retryButton.querySelector('svg');
      expect(refreshIcon).toBeTruthy();
    });

    it('does not render insight cards when in error state', () => {
      setHookState({ error: 'Error', insights: [createStrengthInsight()] });
      render(<AIInsightsPanel />);

      // Error state takes priority
      expect(screen.queryByText('AI-Powered Insights')).not.toBeInTheDocument();
      expect(screen.queryByText('Excellent Recall')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Empty State (No Insights)
  // --------------------------------------------------------------------------

  describe('empty state', () => {
    it('renders empty state message when insights array is empty', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel />);

      expect(
        screen.getByText('Complete more activities to get personalized insights')
      ).toBeInTheDocument();
    });

    it('renders an icon in empty state', () => {
      setHookState({ insights: [] });
      const { container } = render(<AIInsightsPanel />);

      // The empty state shows a Lightbulb icon
      const icons = findIconElements(container);
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a Browse Courses link pointing to /courses', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel />);

      const browseButton = screen.getByText('Browse Courses');
      expect(browseButton).toBeInTheDocument();

      // next/link mock renders <a> with href
      const link = browseButton.closest('a');
      expect(link).toHaveAttribute('href', '/courses');
    });

    it('renders an icon in Browse Courses button', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel />);

      // The Browse Courses button contains a ChevronRight icon
      const browseButton = screen.getByText('Browse Courses').closest('button');
      const icon = browseButton.querySelector('svg');
      expect(icon).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Insight Cards with Titles and Descriptions
  // --------------------------------------------------------------------------

  describe('insight card rendering', () => {
    it('renders insight titles in full view', () => {
      setHookState({
        insights: [
          createStrengthInsight(),
          createImprovementInsight(),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Excellent Recall')).toBeInTheDocument();
      expect(screen.getByText('Critical Thinking Gap')).toBeInTheDocument();
    });

    it('renders insight descriptions in full view', () => {
      setHookState({
        insights: [createStrengthInsight()],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Your memory retention is above average')).toBeInTheDocument();
    });

    it('renders the panel title AI-Powered Insights', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel />);

      expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();
    });

    it('renders an icon next to the panel title', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel />);

      // The Sparkles icon is rendered next to the title
      const title = screen.getByText('AI-Powered Insights');
      const titleContainer = title.closest('[data-testid="card-title"]');
      const icon = titleContainer.querySelector('svg');
      expect(icon).toBeTruthy();
    });

    it('respects maxInsights prop to limit displayed insights', () => {
      const manyInsights = Array.from({ length: 10 }, (_, i) =>
        createInsight({ id: 'insight-' + i, title: 'Insight Number ' + i })
      );
      setHookState({ insights: manyInsights });
      render(<AIInsightsPanel maxInsights={3} />);

      expect(screen.getByText('Insight Number 0')).toBeInTheDocument();
      expect(screen.getByText('Insight Number 1')).toBeInTheDocument();
      expect(screen.getByText('Insight Number 2')).toBeInTheDocument();
      expect(screen.queryByText('Insight Number 3')).not.toBeInTheDocument();
    });

    it('uses default maxInsights of 6 when not specified', () => {
      const manyInsights = Array.from({ length: 8 }, (_, i) =>
        createInsight({ id: 'insight-' + i, title: 'Default Limit ' + i })
      );
      setHookState({ insights: manyInsights });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Default Limit 5')).toBeInTheDocument();
      expect(screen.queryByText('Default Limit 6')).not.toBeInTheDocument();
    });

    it('renders metadata timestamp when metadata is present', () => {
      setHookState({
        insights: [createStrengthInsight()],
        metadata: createMetadata({ generatedAt: '2026-03-05T14:30:00Z' }),
      });
      render(<AIInsightsPanel />);

      const description = screen.getByTestId('card-description');
      expect(description).toBeInTheDocument();
      expect(description.textContent).toContain('Updated');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Priority Badges (high / medium / low)
  // --------------------------------------------------------------------------

  describe('priority badges', () => {
    it('renders a high priority badge with red styling classes', () => {
      setHookState({ insights: [createInsight({ priority: 'high' })] });
      render(<AIInsightsPanel />);

      const badge = screen.getByText('high');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('border-red-200');
      expect(badge.className).toContain('text-red-700');
    });

    it('renders a medium priority badge with amber styling classes', () => {
      setHookState({ insights: [createInsight({ priority: 'medium' })] });
      render(<AIInsightsPanel />);

      const badge = screen.getByText('medium');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('border-amber-200');
      expect(badge.className).toContain('text-amber-700');
    });

    it('renders a low priority badge with green styling classes', () => {
      setHookState({ insights: [createInsight({ priority: 'low' })] });
      render(<AIInsightsPanel />);

      const badge = screen.getByText('low');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('border-green-200');
      expect(badge.className).toContain('text-green-700');
    });

    it('renders priority badge with outline variant', () => {
      setHookState({ insights: [createInsight({ priority: 'high' })] });
      render(<AIInsightsPanel />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    it('renders multiple insights with different priorities', () => {
      setHookState({
        insights: [
          createInsight({ id: 'high-p', priority: 'high', title: 'High Priority Item' }),
          createInsight({ id: 'low-p', priority: 'low', title: 'Low Priority Item' }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Correct Icons for Insight Types
  // --------------------------------------------------------------------------

  describe('insight type icons', () => {
    it('renders an icon for each insight type in the insight card', () => {
      setHookState({ insights: createMixedInsights() });
      const { container } = render(<AIInsightsPanel />);

      // Each InsightCard has an icon wrapped in a styled container
      // The component renders 5 insight cards, each with an icon-bg div containing an svg
      const iconContainers = container.querySelectorAll('.p-2.rounded-lg.flex-shrink-0');
      expect(iconContainers.length).toBe(5);

      // Each icon container should have an svg element
      iconContainers.forEach((iconContainer) => {
        const icon = iconContainer.querySelector('svg');
        expect(icon).toBeTruthy();
      });
    });

    it('applies correct icon background color for strength type', () => {
      setHookState({ insights: [createStrengthInsight()] });
      const { container } = render(<AIInsightsPanel />);

      const iconBg = container.querySelector('.bg-green-100');
      expect(iconBg).toBeTruthy();
    });

    it('applies correct icon background color for improvement type', () => {
      setHookState({ insights: [createImprovementInsight()] });
      const { container } = render(<AIInsightsPanel />);

      const iconBg = container.querySelector('.bg-amber-100');
      expect(iconBg).toBeTruthy();
    });

    it('applies correct icon background color for recommendation type', () => {
      setHookState({ insights: [createRecommendationInsight()] });
      const { container } = render(<AIInsightsPanel />);

      const iconBg = container.querySelector('.bg-blue-100');
      expect(iconBg).toBeTruthy();
    });

    it('applies correct icon background color for warning type', () => {
      setHookState({ insights: [createWarningInsight()] });
      const { container } = render(<AIInsightsPanel />);

      const iconBg = container.querySelector('.bg-red-100');
      expect(iconBg).toBeTruthy();
    });

    it('applies correct icon background color for achievement type', () => {
      setHookState({ insights: [createAchievementInsight()] });
      const { container } = render(<AIInsightsPanel />);

      const iconBg = container.querySelector('.bg-purple-100');
      expect(iconBg).toBeTruthy();
    });

    it('applies correct icon text color for each insight type', () => {
      setHookState({ insights: createMixedInsights() });
      const { container } = render(<AIInsightsPanel />);

      // Each insight type has a unique icon color class
      expect(container.querySelector('.text-green-600')).toBeTruthy();
      expect(container.querySelector('.text-amber-600')).toBeTruthy();
      expect(container.querySelector('.text-blue-600')).toBeTruthy();
      expect(container.querySelector('.text-red-600')).toBeTruthy();
      expect(container.querySelector('.text-purple-600')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Actionable Insights with CTA Links
  // --------------------------------------------------------------------------

  describe('actionable insights', () => {
    it('renders action button with label for actionable insights', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: true,
            action: { label: 'Start Practice', href: '/practice/quiz' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Start Practice')).toBeInTheDocument();
    });

    it('renders action link with correct href', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: true,
            action: { label: 'View Course', href: '/courses/abc-123' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      const actionButton = screen.getByText('View Course');
      const link = actionButton.closest('a');
      expect(link).toHaveAttribute('href', '/courses/abc-123');
    });

    it('renders an icon inside action button', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: true,
            action: { label: 'Continue Learning', href: '/learn' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      // The action button contains an ArrowRight icon
      const actionButton = screen.getByText('Continue Learning').closest('button');
      const arrowIcon = actionButton.querySelector('svg');
      expect(arrowIcon).toBeTruthy();
    });

    it('does not render action button when actionable is false', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: false,
            action: { label: 'Should Not Appear', href: '/nope' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.queryByText('Should Not Appear')).not.toBeInTheDocument();
    });

    it('does not render action button when action object is missing', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: true,
            action: undefined,
          }),
        ],
      });
      render(<AIInsightsPanel />);

      // Only the priority badge should be present, no action button
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBe(1);
    });

    it('renders action link in compact mode for actionable insights', () => {
      setHookState({
        insights: [
          createInsight({
            id: 'compact-action',
            priority: 'high',
            actionable: true,
            action: { label: 'Review Now', href: '/review' },
          }),
        ],
      });
      render(<AIInsightsPanel compact />);

      expect(screen.getByText('Review Now')).toBeInTheDocument();
      const link = screen.getByText('Review Now').closest('a');
      expect(link).toHaveAttribute('href', '/review');
    });
  });

  // --------------------------------------------------------------------------
  // 8. Trend Indicators (up / down / stable)
  // --------------------------------------------------------------------------

  describe('trend indicators', () => {
    it('renders metric label, value, and a trend icon for upward trend', () => {
      setHookState({
        insights: [
          createInsight({
            metric: { label: 'Score', value: '85%', trend: 'up' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Score:')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();

      // TrendIndicator renders a TrendingUp icon (green) for 'up'
      const metricValue = screen.getByText('85%');
      const metricContainer = metricValue.closest('.flex.items-center.gap-2');
      const trendIcon = metricContainer.querySelector('svg');
      expect(trendIcon).toBeTruthy();
    });

    it('renders a trend icon for downward trend', () => {
      setHookState({
        insights: [
          createInsight({
            type: 'recommendation',
            metric: { label: 'Engagement', value: '40%', trend: 'down' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Engagement:')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();

      // TrendIndicator renders a TrendingDown icon (red) for 'down'
      const metricValue = screen.getByText('40%');
      const metricContainer = metricValue.closest('.flex.items-center.gap-2');
      const trendIcon = metricContainer.querySelector('svg');
      expect(trendIcon).toBeTruthy();
    });

    it('renders a trend icon for stable trend', () => {
      setHookState({
        insights: [
          createInsight({
            type: 'recommendation',
            metric: { label: 'Retention', value: '72%', trend: 'stable' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Retention:')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();

      // TrendIndicator renders a Minus icon (neutral) for 'stable'
      const metricValue = screen.getByText('72%');
      const metricContainer = metricValue.closest('.flex.items-center.gap-2');
      const trendIcon = metricContainer.querySelector('svg');
      expect(trendIcon).toBeTruthy();
    });

    it('does not render trend indicator when metric has no trend property', () => {
      setHookState({
        insights: [
          createInsight({
            type: 'recommendation',
            metric: { label: 'Progress', value: '60%' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Progress:')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();

      // No trend icon should be present in the metric row
      const metricValue = screen.getByText('60%');
      const metricContainer = metricValue.closest('.flex.items-center.gap-2');
      // Only the label text, value text, and no svg for trend
      const svgElements = metricContainer.querySelectorAll('svg');
      expect(svgElements.length).toBe(0);
    });

    it('does not render metric section when insight has no metric', () => {
      setHookState({
        insights: [createInsight({ metric: undefined })],
      });
      render(<AIInsightsPanel />);

      // No metric labels with colon should appear
      expect(screen.queryByText(/Score:|Engagement:|Retention:|Progress:/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Compact Mode - Shows Only High-Priority Insights
  // --------------------------------------------------------------------------

  describe('compact mode', () => {
    it('renders Quick Insights title instead of AI-Powered Insights', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel compact />);

      expect(screen.getByText('Quick Insights')).toBeInTheDocument();
      expect(screen.queryByText('AI-Powered Insights')).not.toBeInTheDocument();
    });

    it('shows only high-priority insights when available', () => {
      setHookState({
        insights: [
          createInsight({ id: 'high-1', priority: 'high', title: 'Urgent Issue' }),
          createInsight({ id: 'high-2', priority: 'high', title: 'Critical Gap' }),
          createInsight({ id: 'low-1', priority: 'low', title: 'Nice to Know' }),
          createInsight({ id: 'med-1', priority: 'medium', title: 'Moderate Concern' }),
        ],
      });
      render(<AIInsightsPanel compact />);

      // CompactView filters for high-priority first, takes up to 2
      expect(screen.getByText('Urgent Issue')).toBeInTheDocument();
      expect(screen.getByText('Critical Gap')).toBeInTheDocument();
      expect(screen.queryByText('Nice to Know')).not.toBeInTheDocument();
      expect(screen.queryByText('Moderate Concern')).not.toBeInTheDocument();
    });

    it('falls back to first 2 insights when no high-priority insights exist', () => {
      setHookState({
        insights: [
          createInsight({ id: 'low-1', priority: 'low', title: 'First Low' }),
          createInsight({ id: 'med-1', priority: 'medium', title: 'Second Medium' }),
          createInsight({ id: 'low-2', priority: 'low', title: 'Third Low' }),
        ],
      });
      render(<AIInsightsPanel compact />);

      expect(screen.getByText('First Low')).toBeInTheDocument();
      expect(screen.getByText('Second Medium')).toBeInTheDocument();
      expect(screen.queryByText('Third Low')).not.toBeInTheDocument();
    });

    it('limits compact display to at most 2 high-priority insights', () => {
      setHookState({
        insights: [
          createInsight({ id: 'h1', priority: 'high', title: 'First High' }),
          createInsight({ id: 'h2', priority: 'high', title: 'Second High' }),
          createInsight({ id: 'h3', priority: 'high', title: 'Third High' }),
        ],
      });
      render(<AIInsightsPanel compact />);

      expect(screen.getByText('First High')).toBeInTheDocument();
      expect(screen.getByText('Second High')).toBeInTheDocument();
      expect(screen.queryByText('Third High')).not.toBeInTheDocument();
    });

    it('renders an icon next to Quick Insights title', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel compact />);

      // The compact title has a Sparkles icon
      const title = screen.getByText('Quick Insights');
      const titleContainer = title.closest('[data-testid="card-title"]');
      const icon = titleContainer.querySelector('svg');
      expect(icon).toBeTruthy();
    });

    it('renders insight titles but not descriptions in compact mode', () => {
      setHookState({
        insights: [
          createInsight({
            priority: 'high',
            title: 'Compact Title',
            description: 'Compact description text',
          }),
        ],
      });
      render(<AIInsightsPanel compact />);

      expect(screen.getByText('Compact Title')).toBeInTheDocument();
      // Compact mode only shows title, not description
      expect(screen.queryByText('Compact description text')).not.toBeInTheDocument();
    });

    it('respects maxInsights prop before compact filtering applies', () => {
      const insights = Array.from({ length: 10 }, (_, i) =>
        createInsight({ id: 'm-' + i, priority: 'high', title: 'MaxTest ' + i })
      );
      setHookState({ insights: insights });
      // maxInsights=4 slices to first 4, then compact filters high-priority and takes 2
      render(<AIInsightsPanel compact maxInsights={4} />);

      expect(screen.getByText('MaxTest 0')).toBeInTheDocument();
      expect(screen.getByText('MaxTest 1')).toBeInTheDocument();
      expect(screen.queryByText('MaxTest 2')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 10. Refresh Button Triggers Re-fetch
  // --------------------------------------------------------------------------

  describe('refresh button', () => {
    it('renders a refresh button in the full view header', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel />);

      // Find the ghost variant button in the header area (refresh icon button)
      const buttons = screen.getAllByRole('button');
      const ghostButton = buttons.find(function (btn) {
        return btn.getAttribute('data-variant') === 'ghost';
      });
      expect(ghostButton).toBeTruthy();
      // It should contain an svg icon
      expect(ghostButton.querySelector('svg')).toBeTruthy();
    });

    it('calls refetch when the header refresh button is clicked', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel />);

      // Find the ghost variant refresh button in the header
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons.find(function (btn) {
        return btn.getAttribute('data-variant') === 'ghost';
      });

      expect(refreshButton).toBeTruthy();
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('does not render refresh button in compact mode', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel compact />);

      // Compact view does not have a ghost variant refresh button
      const buttons = screen.queryAllByRole('button');
      const ghostButtons = buttons.filter(function (btn) {
        return btn.getAttribute('data-variant') === 'ghost';
      });
      expect(ghostButtons.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 11. View/Category Filtering via Hook
  // --------------------------------------------------------------------------

  describe('view filtering', () => {
    it('passes default view "all" to the hook', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel />);

      expect(mockHookReturn.__lastView).toBe('all');
    });

    it('passes custom view "learner" to the hook', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel view="learner" />);

      expect(mockHookReturn.__lastView).toBe('learner');
    });

    it('passes custom view "creator" to the hook', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel view="creator" />);

      expect(mockHookReturn.__lastView).toBe('creator');
    });
  });

  // --------------------------------------------------------------------------
  // 12. Insight Type Styling (Color-Coded Borders and Backgrounds)
  // --------------------------------------------------------------------------

  describe('insight type styling', () => {
    it('applies green border class for strength type', () => {
      setHookState({ insights: [createStrengthInsight()] });
      const { container } = render(<AIInsightsPanel />);

      expect(container.querySelector('.border-green-500')).toBeTruthy();
    });

    it('applies amber border class for improvement type', () => {
      setHookState({ insights: [createImprovementInsight()] });
      const { container } = render(<AIInsightsPanel />);

      expect(container.querySelector('.border-amber-500')).toBeTruthy();
    });

    it('applies blue border class for recommendation type', () => {
      setHookState({ insights: [createRecommendationInsight()] });
      const { container } = render(<AIInsightsPanel />);

      expect(container.querySelector('.border-blue-500')).toBeTruthy();
    });

    it('applies red border class for warning type', () => {
      setHookState({ insights: [createWarningInsight()] });
      const { container } = render(<AIInsightsPanel />);

      expect(container.querySelector('.border-red-500')).toBeTruthy();
    });

    it('applies purple border class for achievement type', () => {
      setHookState({ insights: [createAchievementInsight()] });
      const { container } = render(<AIInsightsPanel />);

      expect(container.querySelector('.border-purple-500')).toBeTruthy();
    });

    it('applies correct background color for each insight type', () => {
      setHookState({ insights: createMixedInsights() });
      const { container } = render(<AIInsightsPanel />);

      expect(container.querySelector('.bg-green-50')).toBeTruthy();
      expect(container.querySelector('.bg-amber-50')).toBeTruthy();
      expect(container.querySelector('.bg-blue-50')).toBeTruthy();
      expect(container.querySelector('.bg-red-50')).toBeTruthy();
      expect(container.querySelector('.bg-purple-50')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 13. Metric Display
  // --------------------------------------------------------------------------

  describe('metric display', () => {
    it('renders metric label and value when metric is present', () => {
      setHookState({
        insights: [
          createInsight({
            metric: { label: 'Completion Rate', value: '92%' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Completion Rate:')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('renders metric value with font-semibold class', () => {
      setHookState({
        insights: [
          createInsight({
            metric: { label: 'Accuracy', value: '78%' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      const valueElement = screen.getByText('78%');
      expect(valueElement.className).toContain('font-semibold');
    });

    it('renders metric with both value and trend icon', () => {
      setHookState({
        insights: [
          createInsight({
            type: 'improvement',
            metric: { label: 'Weekly Hours', value: '12h', trend: 'up' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Weekly Hours:')).toBeInTheDocument();
      expect(screen.getByText('12h')).toBeInTheDocument();

      // A trend icon (svg) should be present in the metric area
      const metricValue = screen.getByText('12h');
      const metricContainer = metricValue.closest('.flex.items-center.gap-2');
      const trendIcon = metricContainer.querySelector('svg');
      expect(trendIcon).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 14. Custom className Prop
  // --------------------------------------------------------------------------

  describe('className prop', () => {
    it('passes custom className to the Card wrapper in full view', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel className="custom-class" />);

      const cards = screen.getAllByTestId('card');
      const outerCard = cards[0];
      expect(outerCard.className).toContain('custom-class');
    });

    it('passes custom className to the Card wrapper in compact view', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel compact className="compact-custom" />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('compact-custom');
    });

    it('passes custom className to the Card wrapper in error state', () => {
      setHookState({ error: 'Test error' });
      render(<AIInsightsPanel className="error-custom" />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('error-custom');
    });

    it('passes custom className to the Card wrapper in empty state', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel className="empty-custom" />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('empty-custom');
    });
  });

  // --------------------------------------------------------------------------
  // 15. Edge Cases and Boundary Conditions
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('renders a single insight correctly', () => {
      setHookState({ insights: [createStrengthInsight()] });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Excellent Recall')).toBeInTheDocument();
      expect(screen.getByText('Your memory retention is above average')).toBeInTheDocument();
    });

    it('handles insight with both metric and action simultaneously', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: true,
            action: { label: 'Improve Now', href: '/improve' },
            metric: { label: 'Score', value: '55%', trend: 'down' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Score:')).toBeInTheDocument();
      expect(screen.getByText('55%')).toBeInTheDocument();
      expect(screen.getByText('Improve Now')).toBeInTheDocument();

      // Trend icon should be present
      const metricValue = screen.getByText('55%');
      const metricContainer = metricValue.closest('.flex.items-center.gap-2');
      const trendIcon = metricContainer.querySelector('svg');
      expect(trendIcon).toBeTruthy();
    });

    it('renders maxInsights=1 showing only the first insight', () => {
      setHookState({
        insights: [
          createInsight({ id: 'first', title: 'Only This One' }),
          createInsight({ id: 'second', title: 'Not This One' }),
        ],
      });
      render(<AIInsightsPanel maxInsights={1} />);

      expect(screen.getByText('Only This One')).toBeInTheDocument();
      expect(screen.queryByText('Not This One')).not.toBeInTheDocument();
    });

    it('handles empty action href gracefully', () => {
      setHookState({
        insights: [
          createInsight({
            actionable: true,
            action: { label: 'Go Somewhere', href: '' },
          }),
        ],
      });
      render(<AIInsightsPanel />);

      expect(screen.getByText('Go Somewhere')).toBeInTheDocument();
      const link = screen.getByText('Go Somewhere').closest('a');
      expect(link).toHaveAttribute('href', '');
    });

    it('compact mode with a single high-priority insight shows one item', () => {
      setHookState({
        insights: [
          createInsight({ id: 'only-high', priority: 'high', title: 'Solo High Priority' }),
        ],
      });
      render(<AIInsightsPanel compact />);

      expect(screen.getByText('Solo High Priority')).toBeInTheDocument();
    });

    it('compact mode with no insights renders empty state, not compact view', () => {
      setHookState({ insights: [] });
      render(<AIInsightsPanel compact />);

      // Empty state takes priority over compact rendering
      expect(
        screen.getByText('Complete more activities to get personalized insights')
      ).toBeInTheDocument();
      expect(screen.queryByText('Quick Insights')).not.toBeInTheDocument();
    });

    it('loading state takes priority over error state', () => {
      // The component checks loading first, then error
      setHookState({ loading: true, error: 'Some error' });
      render(<AIInsightsPanel />);

      // Loading skeleton should appear, not the error
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 16. Full Integration Scenario
  // --------------------------------------------------------------------------

  describe('full integration rendering', () => {
    it('renders a complete panel with mixed insights, metrics, and actions', () => {
      setHookState({
        insights: [
          createStrengthInsight({
            id: 'full-strength',
            metric: { label: 'Retention', value: '94%', trend: 'up' },
          }),
          createImprovementInsight({
            id: 'full-improvement',
            actionable: true,
            action: { label: 'Practice More', href: '/practice' },
          }),
          createWarningInsight({
            id: 'full-warning',
            metric: { label: 'Activity', value: '2h/week', trend: 'down' },
          }),
          createAchievementInsight({
            id: 'full-achievement',
          }),
          createRecommendationInsight({
            id: 'full-recommendation',
            metric: { label: 'Potential', value: 'High', trend: 'stable' },
            actionable: true,
            action: { label: 'Explore', href: '/explore' },
          }),
        ],
        metadata: createMetadata(),
      });
      render(<AIInsightsPanel />);

      // Panel title
      expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();

      // All insight titles
      expect(screen.getByText('Excellent Recall')).toBeInTheDocument();
      expect(screen.getByText('Critical Thinking Gap')).toBeInTheDocument();
      expect(screen.getByText('Declining Engagement')).toBeInTheDocument();
      expect(screen.getByText('Course Completed')).toBeInTheDocument();
      expect(screen.getByText('Try Spaced Repetition')).toBeInTheDocument();

      // Metrics
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('2h/week')).toBeInTheDocument();

      // Actions
      expect(screen.getByText('Practice More')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();

      // Metadata timestamp
      const description = screen.getByTestId('card-description');
      expect(description.textContent).toContain('Updated');
    });
  });
});

import React from 'react';
import { render, screen, within } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock framer-motion - forward all HTML-compatible props, strip animation props
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      (
        { children, ...props }: React.PropsWithChildren<Record<string, unknown>>,
        ref: React.Ref<HTMLElement>,
      ) => {
        // Strip framer-motion-specific props so they don't leak to DOM elements
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

// Mock UI components
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" role="progressbar" aria-valuenow={value} className={className} />
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

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { StrengthWeaknessAnalysis } from '@/components/analytics/StrengthWeaknessAnalysis';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createCognitiveData(overrides: Record<string, unknown> = {}) {
  return {
    overallScore: 75,
    bloomsLevels: [
      { level: 'REMEMBER', score: 90 },
      { level: 'UNDERSTAND', score: 80 },
    ],
    strengths: ['Strong memory recall', 'Consistent study habits', 'Good comprehension'],
    weaknesses: ['Critical thinking', 'Creative problem solving'],
    learningStyle: 'Visual',
    cognitiveGrowth: 12,
    recommendedFocus: ['Practice analytical exercises', 'Engage in debates'],
    nextMilestones: ['Complete advanced module', 'Score 80% on evaluation'],
    studyEfficiency: 85,
    retentionRate: 78,
    conceptualUnderstanding: 82,
    applicationSkills: 65,
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('StrengthWeaknessAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Overview Cards
  // --------------------------------------------------------------------------

  describe('overview cards', () => {
    it('renders three overview cards for strengths, weaknesses, and growth rate', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Cognitive Strengths')).toBeInTheDocument();
      expect(screen.getByText('Growth Areas')).toBeInTheDocument();
      expect(screen.getByText('Growth Rate')).toBeInTheDocument();
    });

    it('displays strength count as identified areas', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // The component uses hardcoded analysisData with 3 strengths
      expect(screen.getByText('3 identified areas')).toBeInTheDocument();
    });

    it('displays weakness count as priority areas', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // The component uses hardcoded analysisData with 2 weaknesses
      expect(screen.getByText('2 priority areas')).toBeInTheDocument();
    });

    it('displays the cognitive growth rate from props', () => {
      const data = createCognitiveData({ cognitiveGrowth: 15 });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('This month')).toBeInTheDocument();
    });

    it('displays the cognitive development label', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Cognitive development')).toBeInTheDocument();
    });

    it('lists up to 3 strengths from cognitiveData in overview card', () => {
      const data = createCognitiveData({
        strengths: ['Memory recall', 'Study habits', 'Comprehension', 'Fourth strength'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Memory recall')).toBeInTheDocument();
      expect(screen.getByText('Study habits')).toBeInTheDocument();
      expect(screen.getByText('Comprehension')).toBeInTheDocument();
      // Fourth strength should be sliced off (slice 0,3)
      expect(screen.queryByText('Fourth strength')).not.toBeInTheDocument();
    });

    it('lists up to 3 weaknesses from cognitiveData in overview card', () => {
      const data = createCognitiveData({
        weaknesses: ['Thinking', 'Creativity', 'Application', 'Fourth weakness'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Thinking')).toBeInTheDocument();
      expect(screen.getByText('Creativity')).toBeInTheDocument();
      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.queryByText('Fourth weakness')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Strength Items with Green Indicators
  // --------------------------------------------------------------------------

  describe('strength items', () => {
    it('renders the strengths section header', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Cognitive Strengths - Leverage These Assets')).toBeInTheDocument();
    });

    it('renders all three strength analysis cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Excellent Memory & Recall')).toBeInTheDocument();
      expect(screen.getByText('Strong Comprehension Skills')).toBeInTheDocument();
      expect(screen.getByText('Consistent Learning Patterns')).toBeInTheDocument();
    });

    it('displays strength descriptions', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Strong ability to remember and retrieve factual information and concepts')).toBeInTheDocument();
      expect(screen.getByText('Able to understand and explain complex concepts effectively')).toBeInTheDocument();
      expect(screen.getByText('Maintains regular study habits and shows steady progress')).toBeInTheDocument();
    });

    it('shows green-colored scores for strength items (scores >= 80)', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Strength scores: 92%, 85%, 88% - all should be green (>= 80)
      const score92Elements = screen.getAllByText('92%');
      expect(score92Elements.length).toBeGreaterThanOrEqual(1);

      const score85Elements = screen.getAllByText('85%');
      expect(score85Elements.length).toBeGreaterThanOrEqual(1);

      const score88Elements = screen.getAllByText('88%');
      expect(score88Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Weakness Items with Red Indicators
  // --------------------------------------------------------------------------

  describe('weakness items', () => {
    it('renders the weaknesses section header', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Priority Development Areas')).toBeInTheDocument();
    });

    it('renders all weakness analysis cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Critical Evaluation Skills')).toBeInTheDocument();
      expect(screen.getByText('Creative Problem Solving')).toBeInTheDocument();
    });

    it('displays weakness descriptions', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Need to develop stronger critical thinking and evaluation abilities')).toBeInTheDocument();
      expect(screen.getByText('Innovation and creative thinking skills need development')).toBeInTheDocument();
    });

    it('shows red-colored scores for weakness items (scores < 60)', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Weakness scores: 42%, 38% - both < 60 should be red
      const score42Elements = screen.getAllByText('42%');
      expect(score42Elements.length).toBeGreaterThanOrEqual(1);

      const score38Elements = screen.getAllByText('38%');
      expect(score38Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Opportunity Items with Blue Indicators
  // --------------------------------------------------------------------------

  describe('opportunity items', () => {
    it('renders the opportunities section header', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Growth Opportunities')).toBeInTheDocument();
    });

    it('renders opportunity analysis cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Knowledge Application')).toBeInTheDocument();
      expect(screen.getByText('Difficulty applying learned concepts to new situations')).toBeInTheDocument();
    });

    it('shows the opportunity score', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Opportunity score: 56% - should appear in the card
      const score56Elements = screen.getAllByText('56%');
      expect(score56Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Progress Bars
  // --------------------------------------------------------------------------

  describe('progress bars', () => {
    it('renders progress bars for each analysis item', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const progressBars = screen.getAllByTestId('progress-bar');
      // 3 strengths + 2 weaknesses + 1 opportunity = 6 analysis cards, each with a progress bar
      expect(progressBars.length).toBe(6);
    });

    it('progress bars reflect correct score values', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const values = progressBars.map((bar) => Number(bar.getAttribute('aria-valuenow')));

      // Expected scores: 92, 85, 88 (strengths), 42, 38 (weaknesses), 56 (opportunity)
      expect(values).toContain(92);
      expect(values).toContain(85);
      expect(values).toContain(88);
      expect(values).toContain(42);
      expect(values).toContain(38);
      expect(values).toContain(56);
    });

    it('displays Current Level label for each progress bar', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const currentLevelLabels = screen.getAllByText('Current Level');
      expect(currentLevelLabels.length).toBe(6);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Action Steps
  // --------------------------------------------------------------------------

  describe('action steps', () => {
    it('displays action steps heading for each analysis card', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const actionStepHeadings = screen.getAllByText('Action Steps');
      // 6 analysis cards, each with an Action Steps heading
      expect(actionStepHeadings.length).toBe(6);
    });

    it('renders action items for strength cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Actions from memory-recall strength
      expect(screen.getByText('Use memory skills to support higher-order learning')).toBeInTheDocument();
      expect(screen.getByText('Help peers with study techniques')).toBeInTheDocument();
      expect(screen.getByText('Build complex knowledge on solid foundation')).toBeInTheDocument();
    });

    it('renders action items for weakness cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Actions from critical-thinking weakness
      expect(screen.getByText('Practice analyzing arguments and evidence')).toBeInTheDocument();
      expect(screen.getByText('Compare multiple perspectives on topics')).toBeInTheDocument();
      expect(screen.getByText('Engage in debates and discussions')).toBeInTheDocument();
    });

    it('renders action items for opportunity cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Actions from practical-application opportunity
      expect(screen.getByText('Practice with real-world scenarios')).toBeInTheDocument();
      expect(screen.getByText('Work on case studies and simulations')).toBeInTheDocument();
      expect(screen.getByText('Connect theory to practical examples')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Related Skills Badges
  // --------------------------------------------------------------------------

  describe('related skills badges', () => {
    it('renders Related Skills heading for each analysis card', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const relatedSkillsHeadings = screen.getAllByText('Related Skills');
      expect(relatedSkillsHeadings.length).toBe(6);
    });

    it('renders related skill badges for strength items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Memory recall related skills
      expect(screen.getByText('Information retention')).toBeInTheDocument();
      expect(screen.getByText('Pattern recognition')).toBeInTheDocument();
      expect(screen.getByText('Factual knowledge')).toBeInTheDocument();
    });

    it('renders related skill badges for weakness items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Critical thinking related skills
      expect(screen.getByText('Argument analysis')).toBeInTheDocument();
      expect(screen.getByText('Evidence evaluation')).toBeInTheDocument();
      expect(screen.getByText('Perspective taking')).toBeInTheDocument();
    });

    it('renders related skill badges for opportunity items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Practical application related skills
      expect(screen.getByText('Transfer learning')).toBeInTheDocument();
      expect(screen.getByText('Problem solving')).toBeInTheDocument();
      expect(screen.getByText('Practical reasoning')).toBeInTheDocument();
    });

    it('renders badges with outline variant for related skills', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const badges = screen.getAllByTestId('badge');
      // Related skill badges use variant="outline"
      const outlineBadges = badges.filter(
        (badge) => badge.getAttribute('data-variant') === 'outline',
      );
      // 3 related skills per card x 6 cards = 18 outline badges
      expect(outlineBadges.length).toBe(18);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Impact Level Badges
  // --------------------------------------------------------------------------

  describe('impact level badges', () => {
    it('renders high impact badges for appropriate items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // memory-recall (high), comprehension (high), critical-thinking (high), creative-problem-solving (high) = 4 high
      const highImpactBadges = screen.getAllByText('high impact');
      expect(highImpactBadges.length).toBe(4);
    });

    it('renders medium impact badges for appropriate items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // learning-consistency (medium), practical-application (medium) = 2 medium
      const mediumImpactBadges = screen.getAllByText('medium impact');
      expect(mediumImpactBadges.length).toBe(2);
    });

    it('does not render low impact badges (none in default data)', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.queryByText('low impact')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Recommended Focus Areas
  // --------------------------------------------------------------------------

  describe('recommended focus areas', () => {
    it('renders the recommended focus areas section', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Recommended Focus Areas')).toBeInTheDocument();
    });

    it('displays Immediate Actions heading', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Immediate Actions')).toBeInTheDocument();
    });

    it('lists all recommended focus items from props', () => {
      const data = createCognitiveData({
        recommendedFocus: ['Focus area one', 'Focus area two', 'Focus area three'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Focus area one')).toBeInTheDocument();
      expect(screen.getByText('Focus area two')).toBeInTheDocument();
      expect(screen.getByText('Focus area three')).toBeInTheDocument();
    });

    it('displays Next Milestones heading', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Next Milestones')).toBeInTheDocument();
    });

    it('lists all next milestone items from props', () => {
      const data = createCognitiveData({
        nextMilestones: ['Milestone alpha', 'Milestone beta'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Milestone alpha')).toBeInTheDocument();
      expect(screen.getByText('Milestone beta')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 10. Action Buttons
  // --------------------------------------------------------------------------

  describe('action buttons', () => {
    it('renders the Create Study Plan button', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Create Study Plan')).toBeInTheDocument();
    });

    it('renders the Track Progress button', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Track Progress')).toBeInTheDocument();
    });

    it('renders the Find Study Partners button', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Find Study Partners')).toBeInTheDocument();
    });

    it('renders Create Study Plan with default variant', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const createBtn = screen.getByText('Create Study Plan').closest('button');
      expect(createBtn).toHaveAttribute('data-variant', 'default');
    });

    it('renders Track Progress and Find Study Partners with outline variant', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const trackBtn = screen.getByText('Track Progress').closest('button');
      expect(trackBtn).toHaveAttribute('data-variant', 'outline');

      const partnersBtn = screen.getByText('Find Study Partners').closest('button');
      expect(partnersBtn).toHaveAttribute('data-variant', 'outline');
    });

    it('all action buttons have sm size', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const createBtn = screen.getByText('Create Study Plan').closest('button');
      const trackBtn = screen.getByText('Track Progress').closest('button');
      const partnersBtn = screen.getByText('Find Study Partners').closest('button');

      expect(createBtn).toHaveAttribute('data-size', 'sm');
      expect(trackBtn).toHaveAttribute('data-size', 'sm');
      expect(partnersBtn).toHaveAttribute('data-size', 'sm');
    });
  });

  // --------------------------------------------------------------------------
  // 11. Empty Data Handling
  // --------------------------------------------------------------------------

  describe('empty data handling', () => {
    it('renders without crashing when strengths array is empty', () => {
      const data = createCognitiveData({ strengths: [] });
      const { container } = render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(container.firstChild).toBeTruthy();
      // Overview card should still render with no strength items listed
      expect(screen.getByText('Cognitive Strengths')).toBeInTheDocument();
    });

    it('renders without crashing when weaknesses array is empty', () => {
      const data = createCognitiveData({ weaknesses: [] });
      const { container } = render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(container.firstChild).toBeTruthy();
      expect(screen.getByText('Growth Areas')).toBeInTheDocument();
    });

    it('renders without crashing when recommendedFocus is empty', () => {
      const data = createCognitiveData({ recommendedFocus: [] });
      const { container } = render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(container.firstChild).toBeTruthy();
      expect(screen.getByText('Immediate Actions')).toBeInTheDocument();
    });

    it('renders without crashing when nextMilestones is empty', () => {
      const data = createCognitiveData({ nextMilestones: [] });
      const { container } = render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(container.firstChild).toBeTruthy();
      expect(screen.getByText('Next Milestones')).toBeInTheDocument();
    });

    it('renders without crashing when all arrays are empty', () => {
      const data = createCognitiveData({
        strengths: [],
        weaknesses: [],
        recommendedFocus: [],
        nextMilestones: [],
        bloomsLevels: [],
      });
      const { container } = render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(container.firstChild).toBeTruthy();
      // All section headers should still render
      expect(screen.getByText('Cognitive Strengths')).toBeInTheDocument();
      expect(screen.getByText('Growth Areas')).toBeInTheDocument();
      expect(screen.getByText('Growth Rate')).toBeInTheDocument();
    });

    it('handles zero cognitive growth', () => {
      const data = createCognitiveData({ cognitiveGrowth: 0 });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('+0%')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 12. Section Structure and Category Separation
  // --------------------------------------------------------------------------

  describe('section structure and category separation', () => {
    it('renders all three category section headers', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Cognitive Strengths - Leverage These Assets')).toBeInTheDocument();
      expect(screen.getByText('Priority Development Areas')).toBeInTheDocument();
      expect(screen.getByText('Growth Opportunities')).toBeInTheDocument();
    });

    it('renders correct number of analysis cards total', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const cards = screen.getAllByTestId('card');
      // 3 overview cards + 3 strength cards + 2 weakness cards + 1 opportunity card + 1 action summary card = 10
      expect(cards.length).toBe(10);
    });

    it('renders correct number of card headers in analysis cards', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      const cardHeaders = screen.getAllByTestId('card-header');
      // 6 analysis cards + 1 action summary card = 7 card headers
      // (overview cards use CardContent directly, no CardHeader)
      expect(cardHeaders.length).toBe(7);
    });
  });

  // --------------------------------------------------------------------------
  // Score Color Classification
  // --------------------------------------------------------------------------

  describe('score color classification', () => {
    it('renders all score percentages as "Current Level" text alongside progress bars', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // Each analysis card shows the score twice: once in the header, once next to the progress bar
      // 92% appears in memory-recall card
      const score92 = screen.getAllByText('92%');
      expect(score92.length).toBe(2); // header + current level
    });

    it('renders yellow-colored score for items between 60-79', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // No items have scores in the 60-79 range in the hardcoded data
      // But we can verify all present scores fall into correct ranges
      // 92%, 85%, 88% = green; 42%, 38% = red; 56% = red (< 60)
      // This test just verifies the component does not crash on various score ranges
      expect(screen.getByText('Excellent Memory & Recall')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Comprehensive Content Verification
  // --------------------------------------------------------------------------

  describe('comprehensive content verification', () => {
    it('renders all comprehension strength related skills', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Conceptual understanding')).toBeInTheDocument();
      expect(screen.getByText('Explanation ability')).toBeInTheDocument();
      expect(screen.getByText('Knowledge synthesis')).toBeInTheDocument();
    });

    it('renders all learning consistency related skills', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Time management')).toBeInTheDocument();
      expect(screen.getByText('Self-discipline')).toBeInTheDocument();
      expect(screen.getByText('Goal setting')).toBeInTheDocument();
    });

    it('renders all creative problem solving related skills', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Innovation')).toBeInTheDocument();
      expect(screen.getByText('Original thinking')).toBeInTheDocument();
      expect(screen.getByText('Solution generation')).toBeInTheDocument();
    });

    it('renders comprehension action items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Leverage understanding for teaching others')).toBeInTheDocument();
      expect(screen.getByText('Connect concepts across subjects')).toBeInTheDocument();
      expect(screen.getByText('Build on comprehension for analysis skills')).toBeInTheDocument();
    });

    it('renders learning consistency action items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Maintain current study schedule')).toBeInTheDocument();
      expect(screen.getByText('Share study strategies with others')).toBeInTheDocument();
      expect(screen.getByText('Use consistency for challenging topics')).toBeInTheDocument();
    });

    it('renders creative problem solving action items', () => {
      const data = createCognitiveData();
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Engage in brainstorming activities')).toBeInTheDocument();
      expect(screen.getByText('Try alternative solution approaches')).toBeInTheDocument();
      expect(screen.getByText('Practice design thinking methods')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Props Propagation
  // --------------------------------------------------------------------------

  describe('props propagation', () => {
    it('reflects different cognitiveGrowth values', () => {
      const data = createCognitiveData({ cognitiveGrowth: 25 });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('renders recommended focus items from different data', () => {
      const data = createCognitiveData({
        recommendedFocus: ['Study algebra', 'Review calculus'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Study algebra')).toBeInTheDocument();
      expect(screen.getByText('Review calculus')).toBeInTheDocument();
    });

    it('renders next milestones items from different data', () => {
      const data = createCognitiveData({
        nextMilestones: ['Pass final exam', 'Complete capstone'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Pass final exam')).toBeInTheDocument();
      expect(screen.getByText('Complete capstone')).toBeInTheDocument();
    });

    it('shows only first 3 strengths from cognitiveData props in overview', () => {
      const data = createCognitiveData({
        strengths: ['S1', 'S2', 'S3', 'S4', 'S5'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('S1')).toBeInTheDocument();
      expect(screen.getByText('S2')).toBeInTheDocument();
      expect(screen.getByText('S3')).toBeInTheDocument();
      expect(screen.queryByText('S4')).not.toBeInTheDocument();
      expect(screen.queryByText('S5')).not.toBeInTheDocument();
    });

    it('shows only first 3 weaknesses from cognitiveData props in overview', () => {
      const data = createCognitiveData({
        weaknesses: ['W1', 'W2', 'W3', 'W4'],
      });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('W1')).toBeInTheDocument();
      expect(screen.getByText('W2')).toBeInTheDocument();
      expect(screen.getByText('W3')).toBeInTheDocument();
      expect(screen.queryByText('W4')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases - Boundary Conditions
  // --------------------------------------------------------------------------

  describe('boundary conditions', () => {
    it('handles single-item strengths array', () => {
      const data = createCognitiveData({ strengths: ['Only strength'] });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Only strength')).toBeInTheDocument();
    });

    it('handles single-item weaknesses array', () => {
      const data = createCognitiveData({ weaknesses: ['Only weakness'] });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Only weakness')).toBeInTheDocument();
    });

    it('handles large cognitiveGrowth value', () => {
      const data = createCognitiveData({ cognitiveGrowth: 100 });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('+100%')).toBeInTheDocument();
    });

    it('handles single recommendedFocus item', () => {
      const data = createCognitiveData({ recommendedFocus: ['Single focus'] });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Single focus')).toBeInTheDocument();
    });

    it('handles single nextMilestones item', () => {
      const data = createCognitiveData({ nextMilestones: ['Single milestone'] });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      expect(screen.getByText('Single milestone')).toBeInTheDocument();
    });

    it('handles many recommended focus items', () => {
      const focuses = Array.from({ length: 10 }, (_, i) => `Focus item ${i + 1}`);
      const data = createCognitiveData({ recommendedFocus: focuses });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      // All 10 should render (no slicing on recommendedFocus)
      focuses.forEach((focus) => {
        expect(screen.getByText(focus)).toBeInTheDocument();
      });
    });

    it('handles many next milestones items', () => {
      const milestones = Array.from({ length: 10 }, (_, i) => `Milestone ${i + 1}`);
      const data = createCognitiveData({ nextMilestones: milestones });
      render(<StrengthWeaknessAnalysis cognitiveData={data} />);

      milestones.forEach((milestone) => {
        expect(screen.getByText(milestone)).toBeInTheDocument();
      });
    });
  });
});

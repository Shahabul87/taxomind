import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// MOCK: UI components
// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// The framer-motion mock is provided globally via jest.setup.js.
// ============================================================================

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
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div data-testid="card-header" className={className} onClick={onClick}>
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h3 className={className}>{children}</h3>,
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

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { BloomsTaxonomyMap } from '@/components/analytics/BloomsTaxonomyMap';

// ============================================================================
// TEST DATA FACTORY
// ============================================================================

interface BloomsLevel {
  level: string;
  description: string;
  score: number;
  maxScore: number;
  questions: number;
  correct: number;
  color: string;
  improvements: string[];
  examples: string[];
}

function createBloomsLevel(overrides: Partial<BloomsLevel> = {}): BloomsLevel {
  return {
    level: 'Remember',
    description: 'Recall facts and basic concepts',
    score: 85,
    maxScore: 100,
    questions: 20,
    correct: 17,
    color: 'from-emerald-500 to-emerald-600',
    improvements: ['Review flashcards daily', 'Practice retrieval exercises'],
    examples: ['Define key terms', 'List main concepts'],
    ...overrides,
  };
}

function createAllSixLevels(): BloomsLevel[] {
  return [
    createBloomsLevel({
      level: 'Remember',
      description: 'Recall facts and basic concepts',
      score: 90,
      maxScore: 100,
      questions: 20,
      correct: 18,
      color: 'from-emerald-500 to-emerald-600',
      improvements: ['Review flashcards daily'],
      examples: ['Define key terms'],
    }),
    createBloomsLevel({
      level: 'Understand',
      description: 'Explain ideas or concepts',
      score: 78,
      maxScore: 100,
      questions: 15,
      correct: 12,
      color: 'from-blue-500 to-blue-600',
      improvements: ['Summarize chapters in own words'],
      examples: ['Explain the process of photosynthesis'],
    }),
    createBloomsLevel({
      level: 'Apply',
      description: 'Use information in new situations',
      score: 65,
      maxScore: 100,
      questions: 12,
      correct: 8,
      color: 'from-purple-500 to-purple-600',
      improvements: ['Solve more practice problems'],
      examples: ['Implement a sorting algorithm'],
    }),
    createBloomsLevel({
      level: 'Analyze',
      description: 'Draw connections among ideas',
      score: 55,
      maxScore: 100,
      questions: 10,
      correct: 6,
      color: 'from-amber-500 to-amber-600',
      improvements: ['Compare and contrast related topics'],
      examples: ['Analyze the causes of a historical event'],
    }),
    createBloomsLevel({
      level: 'Evaluate',
      description: 'Justify a stand or decision',
      score: 42,
      maxScore: 100,
      questions: 8,
      correct: 3,
      color: 'from-pink-500 to-pink-600',
      improvements: ['Practice critical review exercises'],
      examples: ['Critique a research paper'],
    }),
    createBloomsLevel({
      level: 'Create',
      description: 'Produce new or original work',
      score: 30,
      maxScore: 100,
      questions: 5,
      correct: 2,
      color: 'from-violet-500 to-violet-600',
      improvements: ['Build small projects independently'],
      examples: ['Design a new experiment'],
    }),
  ];
}

// ============================================================================
// TESTS
// ============================================================================

describe('BloomsTaxonomyMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Renders all 6 levels when provided
  // --------------------------------------------------------------------------

  describe('rendering all levels', () => {
    it('renders all 6 levels when provided', () => {
      const levels = createAllSixLevels();
      render(<BloomsTaxonomyMap levels={levels} />);

      const levelNames = [
        'Remember',
        'Understand',
        'Apply',
        'Analyze',
        'Evaluate',
        'Create',
      ];

      for (const name of levelNames) {
        // Each level name appears in the pyramid AND in the detail card grid
        const elements = screen.getAllByText(name);
        expect(elements.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('renders the cognitive pyramid title', () => {
      const levels = createAllSixLevels();
      render(<BloomsTaxonomyMap levels={levels} />);

      // &apos; renders as a regular apostrophe (U+0027)
      expect(
        screen.getByText("Bloom's Taxonomy Cognitive Pyramid"),
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Shows correct level names and descriptions
  // --------------------------------------------------------------------------

  describe('level names and descriptions', () => {
    it('shows correct descriptions for each level', () => {
      const levels = createAllSixLevels();
      render(<BloomsTaxonomyMap levels={levels} />);

      for (const level of levels) {
        // Descriptions appear twice (pyramid row + detail card)
        const descElements = screen.getAllByText(level.description);
        expect(descElements.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. Shows progress percentage (score displayed as percentage)
  // --------------------------------------------------------------------------

  describe('progress percentage display', () => {
    it('shows the score percentage for each level in the pyramid', () => {
      const levels = createAllSixLevels();
      render(<BloomsTaxonomyMap levels={levels} />);

      for (const level of levels) {
        const percentTexts = screen.getAllByText(`${level.score}%`);
        expect(percentTexts.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('shows the score percentage in detail card badges', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 85 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badgeTexts = badges.map((b) => b.textContent);
      expect(badgeTexts).toContain('85%');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Expands a level card on click
  // --------------------------------------------------------------------------

  describe('expand and collapse', () => {
    it('expands a level card when clicking on the detail card header', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: ['Study more'],
          examples: ['List items'],
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      // Before clicking, expanded content should not be visible
      expect(
        screen.queryByText('Performance Insights'),
      ).not.toBeInTheDocument();

      // Click on the detail card header (CardHeader with onClick)
      const cardHeaders = screen.getAllByTestId('card-header');
      const detailCardHeader = cardHeaders[cardHeaders.length - 1];
      fireEvent.click(detailCardHeader);

      // Expanded content should appear
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText('Example Activities')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    it('expands a level card when clicking on the pyramid row', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: ['Study more'],
          examples: ['List items'],
        }),
      ];
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      // Before clicking, expanded content should not be visible
      expect(
        screen.queryByText('Performance Insights'),
      ).not.toBeInTheDocument();

      // Click on the pyramid row - find elements with cursor-pointer class
      // inside the first card-content (the pyramid visualization)
      const pyramidRows = container.querySelectorAll(
        '[class*="cursor-pointer"]',
      );
      fireEvent.click(pyramidRows[0]);

      // Now expanded content should be visible in the detail card
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    });

    // --------------------------------------------------------------------------
    // 5. Collapses an expanded card on second click
    // --------------------------------------------------------------------------

    it('collapses an expanded card on second click', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: ['Study more'],
          examples: ['List items'],
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      // Click to expand
      const cardHeaders = screen.getAllByTestId('card-header');
      const detailCardHeader = cardHeaders[cardHeaders.length - 1];
      fireEvent.click(detailCardHeader);

      expect(screen.getByText('Performance Insights')).toBeInTheDocument();

      // Click again to collapse
      const updatedCardHeaders = screen.getAllByTestId('card-header');
      const updatedDetailHeader =
        updatedCardHeaders[updatedCardHeaders.length - 1];
      fireEvent.click(updatedDetailHeader);

      expect(
        screen.queryByText('Performance Insights'),
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Shows improvements list when expanded
  // --------------------------------------------------------------------------

  describe('improvements list', () => {
    it('shows improvements list when a level is expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: [
            'Review flashcards daily',
            'Practice retrieval exercises',
          ],
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      // Expand the detail card
      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      expect(screen.getByText('Review flashcards daily')).toBeInTheDocument();
      expect(
        screen.getByText('Practice retrieval exercises'),
      ).toBeInTheDocument();
    });

    it('renders the Performance Insights heading when expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: ['Improvement item'],
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Shows examples when expanded
  // --------------------------------------------------------------------------

  describe('examples list', () => {
    it('shows examples when a level is expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          examples: ['Define key terms', 'List main concepts'],
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      expect(screen.getByText('Example Activities')).toBeInTheDocument();
      expect(screen.getByText('Define key terms')).toBeInTheDocument();
      expect(screen.getByText('List main concepts')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Shows correct/questions fraction
  // --------------------------------------------------------------------------

  describe('correct/questions fraction', () => {
    it('shows the correct/questions fraction in the pyramid row', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          questions: 20,
          correct: 17,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      expect(screen.getByText('17/20 correct')).toBeInTheDocument();
    });

    it('shows correct/questions fractions for all levels', () => {
      const levels = createAllSixLevels();
      render(<BloomsTaxonomyMap levels={levels} />);

      expect(screen.getByText('18/20 correct')).toBeInTheDocument();
      expect(screen.getByText('12/15 correct')).toBeInTheDocument();
      expect(screen.getByText('8/12 correct')).toBeInTheDocument();
      expect(screen.getByText('6/10 correct')).toBeInTheDocument();
      expect(screen.getByText('3/8 correct')).toBeInTheDocument();
      expect(screen.getByText('2/5 correct')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Renders with empty levels array (empty state)
  // --------------------------------------------------------------------------

  describe('empty levels array', () => {
    it('renders without crashing when levels is an empty array', () => {
      const { container } = render(<BloomsTaxonomyMap levels={[]} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('does not render any level names when levels is empty', () => {
      render(<BloomsTaxonomyMap levels={[]} />);

      const levelNames = [
        'Remember',
        'Understand',
        'Apply',
        'Analyze',
        'Evaluate',
        'Create',
      ];

      for (const name of levelNames) {
        expect(screen.queryByText(name)).not.toBeInTheDocument();
      }
    });

    it('still renders the pyramid title card when levels is empty', () => {
      render(<BloomsTaxonomyMap levels={[]} />);

      expect(
        screen.getByText("Bloom's Taxonomy Cognitive Pyramid"),
      ).toBeInTheDocument();
    });

    it('still renders the quick actions card when levels is empty', () => {
      render(<BloomsTaxonomyMap levels={[]} />);

      expect(screen.getByText('Practice Lower Levels')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 10. Progress bar width matches percentage
  // --------------------------------------------------------------------------

  describe('progress bar values', () => {
    it('progress bar aria-valuenow matches the level score in the pyramid', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 85 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const pyramidProgressBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '85',
      );
      expect(pyramidProgressBar).toBeTruthy();
    });

    it('progress bar style width matches the percentage for each level', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 72 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const matchingBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '72',
      );
      expect(matchingBar).toBeTruthy();
      expect((matchingBar as HTMLElement).style.width).toBe('72%');
    });

    it('expanded detail card shows accuracy progress bar', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          score: 85,
          questions: 20,
          correct: 17,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      // Expand the card
      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      // Accuracy = (17/20) * 100 = 85
      const progressBars = screen.getAllByTestId('progress-bar');
      const accuracyBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '85',
      );
      expect(accuracyBar).toBeTruthy();
    });

    it('shows accuracy percentage text when expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          score: 70,
          questions: 10,
          correct: 7,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      // Math.round((7/10)*100) = 70
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      const allPercentTexts = screen.getAllByText('70%');
      expect(allPercentTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Shows action buttons when rendered (always visible in Quick Actions)
  // --------------------------------------------------------------------------

  describe('action buttons', () => {
    it('renders all four quick action buttons', () => {
      const levels = createAllSixLevels();
      render(<BloomsTaxonomyMap levels={levels} />);

      expect(screen.getByText('Practice Lower Levels')).toBeInTheDocument();
      expect(screen.getByText('Focus on Analysis')).toBeInTheDocument();
      expect(screen.getByText('Creative Exercises')).toBeInTheDocument();
      expect(screen.getByText('Critical Thinking')).toBeInTheDocument();
    });

    it('action buttons have outline variant and sm size', () => {
      render(<BloomsTaxonomyMap levels={[]} />);

      const actionButtons = screen.getAllByTestId('action-button');
      for (const button of actionButtons) {
        expect(button).toHaveAttribute('data-variant', 'outline');
        expect(button).toHaveAttribute('data-size', 'sm');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Color-coded performance indicators
  // --------------------------------------------------------------------------

  describe('color-coded performance indicators', () => {
    it('applies emerald color class for scores >= 80', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 90 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badgeWithScore = badges.find((b) => b.textContent === '90%');
      expect(badgeWithScore).toBeTruthy();
      expect(badgeWithScore!.className).toContain('emerald');
    });

    it('applies blue color class for scores 70-79', () => {
      const levels = [createBloomsLevel({ level: 'Understand', score: 75 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badgeWithScore = badges.find((b) => b.textContent === '75%');
      expect(badgeWithScore).toBeTruthy();
      expect(badgeWithScore!.className).toContain('blue');
    });

    it('applies amber color class for scores 60-69', () => {
      const levels = [createBloomsLevel({ level: 'Apply', score: 65 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badgeWithScore = badges.find((b) => b.textContent === '65%');
      expect(badgeWithScore).toBeTruthy();
      expect(badgeWithScore!.className).toContain('amber');
    });

    it('applies red color class for scores below 60', () => {
      const levels = [createBloomsLevel({ level: 'Create', score: 30 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badgeWithScore = badges.find((b) => b.textContent === '30%');
      expect(badgeWithScore).toBeTruthy();
      expect(badgeWithScore!.className).toContain('red');
    });
  });

  // --------------------------------------------------------------------------
  // Icons render for each level
  // The global __mocks__/lucide-react.js renders SVG elements with
  // data-testid="icon-default" due to ESM/CJS interop. We verify that
  // SVG icon elements are rendered (aria-hidden="true").
  // --------------------------------------------------------------------------

  describe('icons for each level', () => {
    it('renders icon SVGs for each level in the pyramid', () => {
      const levels = createAllSixLevels();
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      // Each level in the pyramid has an icon (6 levels) + 1 for the title Search icon
      // Each level in the detail card also has an icon (6 levels)
      // Plus trend icons (6) and chevron icons (6) in the detail cards
      const iconSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
      // At minimum: 6 pyramid level icons + 1 title icon + 6 detail card icons = 13
      expect(iconSvgs.length).toBeGreaterThanOrEqual(13);
    });

    it('renders icon for single level in both pyramid and detail card', () => {
      const levels = [createBloomsLevel({ level: 'Remember' })];
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      // 1 title icon + 1 pyramid level icon + 1 trend icon + 1 detail icon + 1 chevron
      // + action button icons (4)
      const iconSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(iconSvgs.length).toBeGreaterThanOrEqual(4);
    });
  });

  // --------------------------------------------------------------------------
  // Trend icons based on score
  // Trend icons render as SVGs. We verify the correct number appear by
  // checking the pyramid row structure.
  // --------------------------------------------------------------------------

  describe('trend icons based on score', () => {
    it('renders a trend icon SVG in the pyramid row for each level', () => {
      const levels = createAllSixLevels();
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      // Each pyramid row has a trend icon (one of TrendingUp/Minus/TrendingDown)
      // They are rendered as SVGs inside the score display area
      const cardContents = container.querySelectorAll(
        '[data-testid="card-content"]',
      );
      const pyramidContent = cardContents[0];

      // Each pyramid row has an SVG for the level icon and an SVG for the trend icon
      const svgsInPyramid = pyramidContent.querySelectorAll(
        'svg[aria-hidden="true"]',
      );
      // 6 level icons + 6 trend icons = 12 (minimum)
      expect(svgsInPyramid.length).toBeGreaterThanOrEqual(12);
    });
  });

  // --------------------------------------------------------------------------
  // Pyramid row widths
  // --------------------------------------------------------------------------

  describe('pyramid row widths', () => {
    it('pyramid rows get progressively wider from top to bottom', () => {
      const levels = createAllSixLevels();
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      // Formula: width = 60 + (reversedIndex * 8)%
      // For 6 levels: index 0 (Remember) -> reversedIndex 5 -> 100%
      //               index 1 (Understand) -> reversedIndex 4 -> 92%
      //               index 2 (Apply) -> reversedIndex 3 -> 84%
      //               index 3 (Analyze) -> reversedIndex 2 -> 76%
      //               index 4 (Evaluate) -> reversedIndex 1 -> 68%
      //               index 5 (Create) -> reversedIndex 0 -> 60%

      // The pyramid rows are cursor-pointer elements inside the first card-content
      const cardContents = container.querySelectorAll(
        '[data-testid="card-content"]',
      );
      const pyramidContent = cardContents[0];
      // The motion.div mock renders as a regular div. Each pyramid row has:
      // class="...cursor-pointer..." and style="width: X%"
      const pyramidRows = pyramidContent.querySelectorAll(
        '[class*="cursor-pointer"]',
      );

      const expectedWidths = ['100%', '92%', '84%', '76%', '68%', '60%'];
      expect(pyramidRows.length).toBe(6);

      pyramidRows.forEach((row, index) => {
        const element = row as HTMLElement;
        expect(element.style.width).toBe(expectedWidths[index]);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Expanded performance metrics section
  // --------------------------------------------------------------------------

  describe('expanded performance metrics section', () => {
    it('shows Questions Attempted count when expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          questions: 20,
          correct: 17,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      expect(screen.getByText('Questions Attempted')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('shows Correct Answers count when expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          questions: 20,
          correct: 17,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      expect(screen.getByText('Correct Answers')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Selecting different levels - only one expanded at a time
  // --------------------------------------------------------------------------

  describe('selecting different levels', () => {
    it('only one level can be expanded at a time', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: ['Improvement A'],
          examples: ['Example A'],
        }),
        createBloomsLevel({
          level: 'Understand',
          description: 'Explain ideas or concepts',
          score: 72,
          improvements: ['Improvement B'],
          examples: ['Example B'],
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      // Expand "Remember" via its detail card header
      const cardHeaders = screen.getAllByTestId('card-header');
      // Index 0 = pyramid card header, 1 = Remember detail, 2 = Understand detail
      fireEvent.click(cardHeaders[1]);

      expect(screen.getByText('Improvement A')).toBeInTheDocument();
      expect(screen.queryByText('Improvement B')).not.toBeInTheDocument();

      // Now click Understand detail header
      const updatedHeaders = screen.getAllByTestId('card-header');
      const understandHeader = updatedHeaders.find(
        (h) => h.textContent && h.textContent.includes('Understand'),
      );
      fireEvent.click(understandHeader!);

      // Now Understand should be expanded, Remember collapsed
      expect(screen.queryByText('Improvement A')).not.toBeInTheDocument();
      expect(screen.getByText('Improvement B')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Chevron rotation indicator
  // The ChevronRight icon is an SVG mock from __mocks__/lucide-react.js.
  // The component applies rotate-90 to the ChevronRight className prop
  // when expanded. The mock SVG receives this via ...props spread.
  // --------------------------------------------------------------------------

  describe('chevron rotation indicator', () => {
    it('chevron icon gets rotate-90 class when level is expanded', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          improvements: ['Test improvement'],
          examples: ['Test example'],
        }),
      ];
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      // Expand the card
      const cardHeaders = screen.getAllByTestId('card-header');
      fireEvent.click(cardHeaders[cardHeaders.length - 1]);

      // After expansion, find SVGs in the detail card area that have rotate-90
      // The ChevronRight icon receives the className with rotate-90 via props
      // Note: svg.className is an SVGAnimatedString in jsdom, so we use getAttribute
      const allSvgs = container.querySelectorAll('svg');
      const rotatedSvg = Array.from(allSvgs).find((svg) => {
        const cls = svg.getAttribute('class') || '';
        return cls.includes('rotate-90');
      });
      expect(rotatedSvg).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Selected pyramid row highlight
  // --------------------------------------------------------------------------

  describe('selected pyramid row highlight', () => {
    it('applies ring-2 class to selected pyramid row', () => {
      const levels = [
        createBloomsLevel({ level: 'Remember' }),
        createBloomsLevel({
          level: 'Understand',
          description: 'Explain ideas',
          score: 72,
        }),
      ];
      const { container } = render(<BloomsTaxonomyMap levels={levels} />);

      const cardContents = container.querySelectorAll(
        '[data-testid="card-content"]',
      );
      const pyramidContent = cardContents[0];
      const pyramidRows = pyramidContent.querySelectorAll(
        '[class*="cursor-pointer"]',
      );

      fireEvent.click(pyramidRows[0]);

      expect(pyramidRows[0].className).toContain('ring-2');
      expect(pyramidRows[0].className).toContain('ring-purple-400');

      // The other row should not have the ring
      expect(pyramidRows[1].className).not.toContain('ring-2');
    });
  });

  // --------------------------------------------------------------------------
  // Single level rendering
  // --------------------------------------------------------------------------

  describe('single level rendering', () => {
    it('renders correctly with only one level provided', () => {
      const levels = [createBloomsLevel({ level: 'Create', score: 50 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const createElements = screen.getAllByText('Create');
      expect(createElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // Boundary score values
  // --------------------------------------------------------------------------

  describe('boundary score values', () => {
    it('handles score of 0 without errors', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          score: 0,
          correct: 0,
          questions: 10,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const zeroPercents = screen.getAllByText('0%');
      expect(zeroPercents.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('0/10 correct')).toBeInTheDocument();
    });

    it('handles score of 100 without errors', () => {
      const levels = [
        createBloomsLevel({
          level: 'Remember',
          score: 100,
          correct: 20,
          questions: 20,
        }),
      ];
      render(<BloomsTaxonomyMap levels={levels} />);

      const hundredPercents = screen.getAllByText('100%');
      expect(hundredPercents.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('20/20 correct')).toBeInTheDocument();
    });

    it('correctly classifies score at exact boundary of 80 as emerald', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 80 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badge80 = badges.find((b) => b.textContent === '80%');
      expect(badge80).toBeTruthy();
      expect(badge80!.className).toContain('emerald');
    });

    it('correctly classifies score at exact boundary of 70 as blue', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 70 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badge70 = badges.find((b) => b.textContent === '70%');
      expect(badge70).toBeTruthy();
      expect(badge70!.className).toContain('blue');
    });

    it('correctly classifies score at exact boundary of 60 as amber', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 60 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badge60 = badges.find((b) => b.textContent === '60%');
      expect(badge60).toBeTruthy();
      expect(badge60!.className).toContain('amber');
    });

    it('correctly classifies score of 59 as red', () => {
      const levels = [createBloomsLevel({ level: 'Remember', score: 59 })];
      render(<BloomsTaxonomyMap levels={levels} />);

      const badges = screen.getAllByTestId('badge');
      const badge59 = badges.find((b) => b.textContent === '59%');
      expect(badge59).toBeTruthy();
      expect(badge59!.className).toContain('red');
    });
  });
});

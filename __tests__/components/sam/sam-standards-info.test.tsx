import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

// Mock framer-motion with Proxy pattern for motion components
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLElement>) => {
        const {
          initial, animate, exit, transition, variants, whileHover, whileTap,
          whileInView, viewport, drag, dragConstraints, dragElastic,
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
    motion: new Proxy({}, { get: (_t: Record<string, unknown>, prop: string) => {
      if (prop === '__esModule') return true;
      return makeMotion(prop);
    }}),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// Mock Dialog components - Dialog renders children when open, DialogTrigger passes onClick
let mockDialogOpen = false;
let mockDialogOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => {
    // Store the callback so we can simulate opening
    mockDialogOnOpenChange = onOpenChange;
    mockDialogOpen = open ?? false;
    return <div data-testid="dialog" data-open={open}>{children}</div>;
  },
  DialogTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          onClick: () => mockDialogOnOpenChange?.(true),
        },
      );
    }
    return (
      <button data-testid="dialog-trigger" onClick={() => mockDialogOnOpenChange?.(true)}>
        {children}
      </button>
    );
  },
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h2 data-testid="dialog-title" className={className}>
      {children}
    </h2>
  ),
  DialogDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p data-testid="dialog-description" className={className}>
      {children}
    </p>
  ),
}));

// Mock Tabs - renders all TabsContent by default so we can assert content
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    defaultValue,
  }: {
    children: React.ReactNode;
    defaultValue?: string;
    className?: string;
  }) => (
    <div data-testid="tabs" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs-list" className={className}>
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
  }) => (
    <button data-testid={`tab-trigger-${value}`} data-value={value} className={className}>
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => (
    <div data-testid={`tab-content-${value}`} data-value={value} className={className}>
      {children}
    </div>
  ),
}));

// Mock Card components
jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div data-testid="card" className={className} onClick={onClick}>
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
  CardDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p data-testid="card-description" className={className}>
      {children}
    </p>
  ),
}));

// Mock Button
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

// Mock Badge
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

// Mock Progress
jest.mock('@/components/ui/progress', () => ({
  Progress: ({
    value,
    className,
  }: {
    value: number;
    className?: string;
  }) => <div data-testid="progress-bar" aria-valuenow={value} className={className} />,
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENTS UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { SamStandardsInfo, SamStandardsBadge } from '@/components/sam/sam-standards-info';

// ============================================================================
// TESTS
// ============================================================================

describe('SamStandardsInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDialogOpen = false;
    mockDialogOnOpenChange = undefined;
  });

  // --------------------------------------------------------------------------
  // Rendering: Trigger button
  // --------------------------------------------------------------------------
  describe('Trigger Button', () => {
    it('renders the trigger button with "How SAM Evaluates" text', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('How SAM Evaluates')).toBeInTheDocument();
    });

    it('renders the trigger button with "Info" text for small screens', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('renders the dialog wrapper', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Rendering: Dialog content
  // --------------------------------------------------------------------------
  describe('Dialog Content', () => {
    it('renders the dialog header with title', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('SAM Enhanced Analysis Engine')).toBeInTheDocument();
    });

    it('renders the dialog description', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('AI-powered course evaluation with 7 analysis engines'),
      ).toBeInTheDocument();
    });

    it('renders the footer with version badge', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('v2.0 Enhanced')).toBeInTheDocument();
    });

    it('renders the footer with "Powered by Claude AI" text', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('Powered by Claude AI with educational research foundations'),
      ).toBeInTheDocument();
    });

    it('also renders the short footer text for mobile', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Powered by Claude AI')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Tabs structure
  // --------------------------------------------------------------------------
  describe('Tabs Structure', () => {
    it('renders all four tab triggers', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByTestId('tab-trigger-features')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-pipeline')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-standards')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-metrics')).toBeInTheDocument();
    });

    it('sets defaultValue to "features"', () => {
      render(<SamStandardsInfo />);
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-default-value', 'features');
    });

    it('renders all four tab content panels', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByTestId('tab-content-features')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-pipeline')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-standards')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-metrics')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Features Tab content
  // --------------------------------------------------------------------------
  describe('Features Tab', () => {
    it('renders all 7 analysis feature names', () => {
      render(<SamStandardsInfo />);
      const expectedFeatures = [
        "Bloom's Taxonomy Analysis",
        "Webb's DOK Integration",
        'Course-Type Adaptive Analysis',
        'SMART Criteria Analysis',
        'Objective Deduplication',
        'Assessment Quality Scoring',
        'Historical Trend Analysis',
      ];
      expectedFeatures.forEach((featureName) => {
        expect(screen.getByText(featureName)).toBeInTheDocument();
      });
    });

    it('renders feature descriptions', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('6-level cognitive complexity framework')).toBeInTheDocument();
      expect(screen.getByText('4-level depth of knowledge framework')).toBeInTheDocument();
      expect(screen.getByText('Intelligent course classification system')).toBeInTheDocument();
      expect(screen.getByText('Learning objective quality assessment')).toBeInTheDocument();
      expect(screen.getByText('Semantic similarity clustering')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive evaluation metrics')).toBeInTheDocument();
      expect(screen.getByText('Progress tracking over time')).toBeInTheDocument();
    });

    it('does not show feature details initially (no active feature)', () => {
      render(<SamStandardsInfo />);
      // Details are hidden behind AnimatePresence when no feature is active
      expect(
        screen.queryByText('Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels'),
      ).not.toBeInTheDocument();
    });

    it('expands feature details when a feature card is clicked', () => {
      render(<SamStandardsInfo />);
      const cards = screen.getAllByTestId('card');
      // The first card in the features tab corresponds to "Bloom's Taxonomy Analysis"
      // Find the card containing the Bloom's feature
      const bloomsCard = cards.find((card) =>
        card.textContent?.includes("Bloom's Taxonomy Analysis"),
      );
      expect(bloomsCard).toBeTruthy();

      fireEvent.click(bloomsCard!);

      // Now the detail items should be visible
      expect(
        screen.getByText(
          'Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Measures cognitive depth and progression through course content'),
      ).toBeInTheDocument();
    });

    it('collapses feature details when the same card is clicked again', () => {
      render(<SamStandardsInfo />);

      // Click to expand Bloom's
      const bloomsCardInitial = screen.getAllByTestId('card').find((card) =>
        card.textContent?.includes("Bloom's Taxonomy Analysis"),
      );
      fireEvent.click(bloomsCardInitial!);
      expect(
        screen.getByText(
          'Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels',
        ),
      ).toBeInTheDocument();

      // Re-query the card after DOM update, then click again to collapse
      const bloomsCardExpanded = screen.getAllByTestId('card').find((card) =>
        card.textContent?.includes("Bloom's Taxonomy Analysis"),
      );
      fireEvent.click(bloomsCardExpanded!);
      expect(
        screen.queryByText(
          'Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels',
        ),
      ).not.toBeInTheDocument();
    });

    it('switches active feature when a different card is clicked', () => {
      render(<SamStandardsInfo />);

      // Expand Bloom's
      const bloomsCard = screen.getAllByTestId('card').find((card) =>
        card.textContent?.includes("Bloom's Taxonomy Analysis"),
      );
      fireEvent.click(bloomsCard!);
      expect(
        screen.getByText(
          'Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels',
        ),
      ).toBeInTheDocument();

      // Re-query after DOM update, then click DOK
      const dokCard = screen.getAllByTestId('card').find((card) =>
        card.textContent?.includes("Webb's DOK Integration"),
      );
      fireEvent.click(dokCard!);
      expect(
        screen.queryByText(
          'Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels',
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('Level 1: Recall - Basic facts and simple procedures'),
      ).toBeInTheDocument();
    });

    it('renders SMART criteria details when that feature is expanded', () => {
      render(<SamStandardsInfo />);
      const cards = screen.getAllByTestId('card');
      const smartCard = cards.find((card) =>
        card.textContent?.includes('SMART Criteria Analysis'),
      );

      fireEvent.click(smartCard!);

      expect(
        screen.getByText('Specific - Clear and unambiguous objective statements'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Measurable - Observable outcomes with assessment criteria'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Achievable - Realistic within course constraints'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Relevant - Aligned with course goals and learner needs'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Time-bound - Clear completion expectations'),
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Pipeline Tab content
  // --------------------------------------------------------------------------
  describe('Pipeline Tab', () => {
    it('renders all 6 pipeline step titles', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Content Extraction')).toBeInTheDocument();
      expect(screen.getByText('Cognitive Analysis')).toBeInTheDocument();
      expect(screen.getByText('Course Type Detection')).toBeInTheDocument();
      expect(screen.getByText('Objective Analysis')).toBeInTheDocument();
      // "Assessment Quality" appears in both pipeline and metrics tabs
      const assessmentQualityElements = screen.getAllByText('Assessment Quality');
      expect(assessmentQualityElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('renders pipeline step descriptions', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('Parse course structure, objectives, chapters, and sections'),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Apply Bloom's Taxonomy and Webb's DOK frameworks"),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Classify and set adaptive targets'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('SMART criteria evaluation and deduplication'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Evaluate question variety and difficulty'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Generate prioritized improvement suggestions'),
      ).toBeInTheDocument();
    });

    it('renders step duration badges', () => {
      render(<SamStandardsInfo />);
      // "~2s" appears for multiple pipeline steps (Content Extraction, Objective Analysis,
      // Assessment Quality, Recommendations), so use getAllByText
      const twoSecBadges = screen.getAllByText('~2s');
      expect(twoSecBadges.length).toBe(4);
      expect(screen.getByText('~3s')).toBeInTheDocument();
      expect(screen.getByText('~1s')).toBeInTheDocument();
    });

    it('renders the total analysis time', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('~12s')).toBeInTheDocument();
      expect(screen.getByText('Total Analysis Time')).toBeInTheDocument();
    });

    it('renders the caching note', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('Smart caching reduces subsequent analyses to under 1 second'),
      ).toBeInTheDocument();
    });

    it('renders step numbers 1 through 6', () => {
      render(<SamStandardsInfo />);
      for (let step = 1; step <= 6; step++) {
        expect(screen.getByText(String(step))).toBeInTheDocument();
      }
    });
  });

  // --------------------------------------------------------------------------
  // Standards Tab content
  // --------------------------------------------------------------------------
  describe('Standards Tab', () => {
    it('renders all 6 standard names', () => {
      render(<SamStandardsInfo />);
      // Full names rendered in CardTitle
      expect(screen.getByText("Bloom's Taxonomy")).toBeInTheDocument();
      expect(screen.getByText("Webb's DOK")).toBeInTheDocument();
      expect(screen.getByText('Quality Matters')).toBeInTheDocument();
      expect(screen.getByText('ADDIE Model')).toBeInTheDocument();
      expect(screen.getByText('Kirkpatrick Model')).toBeInTheDocument();
      expect(screen.getByText('ISO 21001:2018')).toBeInTheDocument();
    });

    it('renders standard short names', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText("Bloom's")).toBeInTheDocument();
      expect(screen.getByText('DOK')).toBeInTheDocument();
      expect(screen.getByText('QM')).toBeInTheDocument();
      expect(screen.getByText('ADDIE')).toBeInTheDocument();
      expect(screen.getByText('Kirkpatrick')).toBeInTheDocument();
      expect(screen.getByText('ISO')).toBeInTheDocument();
    });

    it('renders standard descriptions', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('Six levels of cognitive complexity from Remember to Create'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Four levels of depth of knowledge for cognitive rigor'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nationally recognized quality assurance with 42 standards'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Systematic instructional design process'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Four-level training evaluation framework'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('International standard for educational organizations'),
      ).toBeInTheDocument();
    });

    it('renders standard application descriptions', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('Core framework for analyzing thinking skills progression'),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Complements Bloom's with knowledge depth analysis"),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Ensures course design quality and alignment'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Guides course development through 5 phases'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Measures learning effectiveness to results'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Quality management and learner satisfaction'),
      ).toBeInTheDocument();
    });

    it('renders the "12+ International Standards Integrated" badge', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText('12+ International Standards Integrated'),
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Metrics Tab content
  // --------------------------------------------------------------------------
  describe('Metrics Tab', () => {
    it('renders "Cognitive Metrics" section title', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Cognitive Metrics')).toBeInTheDocument();
    });

    it('renders "Quality Metrics" section title', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
    });

    it('renders cognitive metric labels', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Cognitive Depth')).toBeInTheDocument();
      expect(screen.getByText('Balance Score')).toBeInTheDocument();
      expect(screen.getByText('Complexity Level')).toBeInTheDocument();
      expect(screen.getByText('DOK Distribution')).toBeInTheDocument();
    });

    it('renders quality metric labels', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('SMART Score')).toBeInTheDocument();
      // "Assessment Quality" appears in both pipeline step title and metrics section
      const assessmentQualityElements = screen.getAllByText('Assessment Quality');
      expect(assessmentQualityElements.length).toBe(2);
      expect(screen.getByText('Course Type Match')).toBeInTheDocument();
      expect(screen.getByText('Objective Clarity')).toBeInTheDocument();
    });

    it('renders metric descriptions', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('How deep learners engage with content')).toBeInTheDocument();
      expect(
        screen.getByText("Distribution across Bloom's levels"),
      ).toBeInTheDocument();
      expect(screen.getByText('Overall difficulty assessment')).toBeInTheDocument();
      expect(
        screen.getByText("Webb's Depth of Knowledge spread"),
      ).toBeInTheDocument();
      expect(screen.getByText('Learning objective quality')).toBeInTheDocument();
      expect(screen.getByText('Question variety & rigor')).toBeInTheDocument();
      expect(screen.getByText('Alignment with detected type')).toBeInTheDocument();
      expect(
        screen.getByText('How clear objectives are written'),
      ).toBeInTheDocument();
    });

    it('renders metric range badges', () => {
      render(<SamStandardsInfo />);
      const badges = screen.getAllByTestId('badge');
      const badgeTexts = badges.map((b) => b.textContent);
      expect(badgeTexts).toContain('0-100');
      expect(badgeTexts).toContain('L1-L4');
      expect(badgeTexts).toContain('0-100%');
    });

    it('renders "Adaptive Course Types" section', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Adaptive Course Types')).toBeInTheDocument();
    });

    it('renders the Bloom distribution targets description', () => {
      render(<SamStandardsInfo />);
      expect(
        screen.getByText("Each course type has optimized Bloom\u0027s distribution targets"),
      ).toBeInTheDocument();
    });

    it('renders all 7 course types', () => {
      render(<SamStandardsInfo />);
      const courseTypes = [
        'Foundational',
        'Intermediate',
        'Advanced',
        'Professional',
        'Creative',
        'Technical',
        'Theoretical',
      ];
      courseTypes.forEach((type) => {
        expect(screen.getByText(type)).toBeInTheDocument();
      });
    });

    it('renders course type focus areas', () => {
      render(<SamStandardsInfo />);
      expect(screen.getByText('Remember/Understand')).toBeInTheDocument();
      expect(screen.getByText('Evaluate/Create')).toBeInTheDocument();
      expect(screen.getByText('Create/Evaluate')).toBeInTheDocument();
      expect(screen.getByText('Understand/Analyze')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Dialog open/close behavior
  // --------------------------------------------------------------------------
  describe('Dialog Open/Close', () => {
    it('starts with dialog closed (open=false)', () => {
      render(<SamStandardsInfo />);
      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveAttribute('data-open', 'false');
    });

    it('opens the dialog when the trigger button is clicked', () => {
      render(<SamStandardsInfo />);
      const triggerButton = screen.getByText('How SAM Evaluates').closest('button');
      expect(triggerButton).toBeTruthy();

      fireEvent.click(triggerButton!);

      const dialog = screen.getByTestId('dialog');
      // After clicking, onOpenChange(true) is called which sets isOpen to true
      // The component re-renders with open={true}
      expect(dialog).toHaveAttribute('data-open', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // Tab trigger labels (hidden on small screens but rendered in DOM)
  // --------------------------------------------------------------------------
  describe('Tab Trigger Labels', () => {
    it('renders tab label text for features tab', () => {
      render(<SamStandardsInfo />);
      const featuresTrigger = screen.getByTestId('tab-trigger-features');
      expect(featuresTrigger.textContent).toContain('Features');
    });

    it('renders tab label text for pipeline tab', () => {
      render(<SamStandardsInfo />);
      const pipelineTrigger = screen.getByTestId('tab-trigger-pipeline');
      expect(pipelineTrigger.textContent).toContain('Pipeline');
    });

    it('renders tab label text for standards tab', () => {
      render(<SamStandardsInfo />);
      const standardsTrigger = screen.getByTestId('tab-trigger-standards');
      expect(standardsTrigger.textContent).toContain('Standards');
    });

    it('renders tab label text for metrics tab', () => {
      render(<SamStandardsInfo />);
      const metricsTrigger = screen.getByTestId('tab-trigger-metrics');
      expect(metricsTrigger.textContent).toContain('Metrics');
    });
  });

  // --------------------------------------------------------------------------
  // Pipeline hover interaction
  // --------------------------------------------------------------------------
  describe('Pipeline Step Hover', () => {
    it('renders pipeline steps that respond to mouse events without errors', () => {
      render(<SamStandardsInfo />);
      // The pipeline steps have onMouseEnter and onMouseLeave handlers
      // Since motion.div is mocked, the handlers are passed through as htmlProps
      const pipelineTab = screen.getByTestId('tab-content-pipeline');
      // Find the first step element containing "Content Extraction"
      const stepTitle = screen.getByText('Content Extraction');
      const stepContainer = stepTitle.closest('[class]');

      // Should not throw when hovering
      if (stepContainer) {
        fireEvent.mouseEnter(stepContainer);
        fireEvent.mouseLeave(stepContainer);
      }

      // Verify the component still renders correctly after hover
      expect(screen.getByText('Content Extraction')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// SamStandardsBadge Tests
// ============================================================================

describe('SamStandardsBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the badge with "12+ International Standards" text', () => {
    render(<SamStandardsBadge />);
    expect(screen.getByText('12+ International Standards')).toBeInTheDocument();
  });

  it('renders the short "Standards" text for mobile', () => {
    render(<SamStandardsBadge />);
    expect(screen.getByText('Standards')).toBeInTheDocument();
  });

  it('renders an SVG icon within the badge', () => {
    render(<SamStandardsBadge />);
    // Lucide icons are mocked as SVG elements with data-testid
    const container = screen.getByText('12+ International Standards').closest('div');
    expect(container).toBeTruthy();
    const svgIcon = container!.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });
});

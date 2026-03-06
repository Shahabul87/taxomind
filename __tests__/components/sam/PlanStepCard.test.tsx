import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

// Mock framer-motion with Proxy pattern for motion.* elements
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      (
        { children, ...props }: Record<string, unknown> & { children?: React.ReactNode },
        ref: React.Ref<HTMLElement>,
      ) => {
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
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// Mock UI card components with simple HTML elements
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
  CardFooter: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-footer" className={className}>
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

// Mock Button component
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
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

// Mock Progress component
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

// Mock cn utility - pass through with space join
jest.mock('@/lib/utils', () => ({
  cn: (...inputs: (string | undefined | null | false)[]) =>
    inputs.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORTS - After mocks
// ============================================================================

import {
  PlanStepCard,
  type PlanStep,
  type PlanStepCardProps,
  type Resource,
  type StepDifficulty,
  type StepType,
} from '@/components/sam/PlanStepCard';

// ============================================================================
// TEST FACTORIES
// ============================================================================

/** Create a resource with sensible defaults */
function createResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'res-1',
    title: 'Test Resource',
    type: 'article',
    url: 'https://example.com/resource',
    ...overrides,
  };
}

/** Create a plan step with sensible defaults */
function createStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    id: 'step-1',
    title: 'Learn TypeScript Basics',
    description: 'Understand the fundamentals of TypeScript including types, interfaces, and generics.',
    type: 'learn',
    difficulty: 'medium',
    estimatedMinutes: 30,
    progress: 50,
    resources: [],
    ...overrides,
  };
}

/** Default props factory */
function createDefaultProps(overrides: Partial<PlanStepCardProps> = {}): PlanStepCardProps {
  return {
    step: createStep(),
    stepNumber: 1,
    totalSteps: 5,
    ...overrides,
  };
}

/** Render helper */
function renderCard(overrides: Partial<PlanStepCardProps> = {}) {
  const props = createDefaultProps(overrides);
  return render(<PlanStepCard {...props} />);
}

// ============================================================================
// TESTS
// ============================================================================

describe('PlanStepCard', () => {
  // --------------------------------------------------------------------------
  // Step rendering
  // --------------------------------------------------------------------------
  describe('step rendering', () => {
    it('renders the step title', () => {
      renderCard();
      expect(screen.getByText('Learn TypeScript Basics')).toBeInTheDocument();
    });

    it('renders the step description', () => {
      renderCard();
      expect(
        screen.getByText(
          'Understand the fundamentals of TypeScript including types, interfaces, and generics.',
        ),
      ).toBeInTheDocument();
    });

    it('renders the step number inside the indicator circle', () => {
      renderCard({ stepNumber: 3 });
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders the step number / total steps text', () => {
      renderCard({ stepNumber: 2, totalSteps: 8 });
      expect(screen.getByText(/Step 2 of 8/)).toBeInTheDocument();
    });

    it('renders the time estimate with the estimated minutes', () => {
      renderCard({
        step: createStep({ estimatedMinutes: 45 }),
      });
      expect(screen.getByText(/~45 min/)).toBeInTheDocument();
    });

    it('renders the Card, CardHeader, CardContent, and CardFooter sections', () => {
      renderCard();
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });

    it('renders the card title element', () => {
      renderCard();
      expect(screen.getByTestId('card-title')).toHaveTextContent(
        'Learn TypeScript Basics',
      );
    });

    it('renders the description inside card-description', () => {
      renderCard();
      expect(screen.getByTestId('card-description')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Status display (step type and difficulty badges)
  // --------------------------------------------------------------------------
  describe('status display', () => {
    it('renders two badges - one for step type and one for difficulty', () => {
      renderCard();
      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(2);
    });

    it.each<[StepType, string]>([
      ['learn', 'Learn'],
      ['practice', 'Practice'],
      ['review', 'Review'],
      ['assess', 'Assessment'],
      ['project', 'Project'],
    ])('renders the correct label for step type "%s"', (type, expectedLabel) => {
      renderCard({ step: createStep({ type }) });
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it.each<[StepDifficulty, string]>([
      ['easy', 'Easy'],
      ['medium', 'Medium'],
      ['hard', 'Hard'],
      ['expert', 'Expert'],
    ])(
      'renders the correct label for difficulty "%s"',
      (difficulty, expectedLabel) => {
        renderCard({ step: createStep({ difficulty }) });
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      },
    );

    it('applies the correct color class to the difficulty badge for easy', () => {
      renderCard({ step: createStep({ difficulty: 'easy' }) });
      const badges = screen.getAllByTestId('badge');
      // Second badge is the difficulty badge
      const difficultyBadge = badges[1];
      expect(difficultyBadge.className).toContain('text-green-600');
    });

    it('applies the correct color class to the difficulty badge for hard', () => {
      renderCard({ step: createStep({ difficulty: 'hard' }) });
      const badges = screen.getAllByTestId('badge');
      const difficultyBadge = badges[1];
      expect(difficultyBadge.className).toContain('text-orange-600');
    });

    it('applies the correct color class to the difficulty badge for expert', () => {
      renderCard({ step: createStep({ difficulty: 'expert' }) });
      const badges = screen.getAllByTestId('badge');
      const difficultyBadge = badges[1];
      expect(difficultyBadge.className).toContain('text-red-600');
    });

    it('applies the correct color class to the step type badge for learn', () => {
      renderCard({ step: createStep({ type: 'learn' }) });
      const badges = screen.getAllByTestId('badge');
      const typeBadge = badges[0];
      expect(typeBadge.className).toContain('text-blue-600');
    });

    it('applies the correct color class to the step type badge for practice', () => {
      renderCard({ step: createStep({ type: 'practice' }) });
      const badges = screen.getAllByTestId('badge');
      const typeBadge = badges[0];
      expect(typeBadge.className).toContain('text-green-600');
    });
  });

  // --------------------------------------------------------------------------
  // Progress indicators
  // --------------------------------------------------------------------------
  describe('progress indicators', () => {
    it('renders the progress bar component', () => {
      renderCard();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('passes the correct progress value to the Progress component', () => {
      renderCard({ step: createStep({ progress: 75 }) });
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('displays the progress percentage as text', () => {
      renderCard({ step: createStep({ progress: 75 }) });
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders 0% progress correctly', () => {
      renderCard({ step: createStep({ progress: 0 }) });
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders 100% progress correctly', () => {
      renderCard({ step: createStep({ progress: 100 }) });
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('displays the "Progress" label', () => {
      renderCard();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Expand/collapse - Objectives
  // --------------------------------------------------------------------------
  describe('expand/collapse objectives', () => {
    const stepWithObjectives = createStep({
      objectives: [
        'Understand type annotations',
        'Use interfaces effectively',
        'Apply generics in functions',
      ],
    });

    it('renders the objectives toggle button with count', () => {
      renderCard({ step: stepWithObjectives });
      expect(screen.getByText(/Learning Objectives \(3\)/)).toBeInTheDocument();
    });

    it('does not show objectives content initially', () => {
      renderCard({ step: stepWithObjectives });
      expect(
        screen.queryByText('Understand type annotations'),
      ).not.toBeInTheDocument();
    });

    it('shows objectives when the toggle button is clicked', () => {
      renderCard({ step: stepWithObjectives });

      const toggle = screen.getByText(/Learning Objectives \(3\)/);
      fireEvent.click(toggle);

      expect(screen.getByText('Understand type annotations')).toBeInTheDocument();
      expect(screen.getByText('Use interfaces effectively')).toBeInTheDocument();
      expect(screen.getByText('Apply generics in functions')).toBeInTheDocument();
    });

    it('hides objectives when the toggle button is clicked again', () => {
      renderCard({ step: stepWithObjectives });

      const toggle = screen.getByText(/Learning Objectives \(3\)/);
      // Open
      fireEvent.click(toggle);
      expect(screen.getByText('Understand type annotations')).toBeInTheDocument();

      // Close
      fireEvent.click(toggle);
      expect(
        screen.queryByText('Understand type annotations'),
      ).not.toBeInTheDocument();
    });

    it('does not render objectives section when objectives array is empty', () => {
      renderCard({ step: createStep({ objectives: [] }) });
      expect(
        screen.queryByText(/Learning Objectives/),
      ).not.toBeInTheDocument();
    });

    it('does not render objectives section when objectives is undefined', () => {
      renderCard({ step: createStep({ objectives: undefined }) });
      expect(
        screen.queryByText(/Learning Objectives/),
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Expand/collapse - Hints
  // --------------------------------------------------------------------------
  describe('expand/collapse hints', () => {
    const stepWithHints = createStep({
      hints: [
        'Start with basic types like string and number',
        'Try the TypeScript playground',
      ],
    });

    it('renders the hints toggle button with count', () => {
      renderCard({ step: stepWithHints });
      expect(screen.getByText(/Need a hint\? \(2 available\)/)).toBeInTheDocument();
    });

    it('does not show hints content initially', () => {
      renderCard({ step: stepWithHints });
      expect(
        screen.queryByText(/Start with basic types/),
      ).not.toBeInTheDocument();
    });

    it('shows hints when the toggle button is clicked', () => {
      renderCard({ step: stepWithHints });

      const toggle = screen.getByText(/Need a hint\?/);
      fireEvent.click(toggle);

      expect(
        screen.getByText(/Start with basic types like string and number/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Try the TypeScript playground/),
      ).toBeInTheDocument();
    });

    it('hides hints when the toggle button is clicked again', () => {
      renderCard({ step: stepWithHints });

      const toggle = screen.getByText(/Need a hint\?/);
      // Open
      fireEvent.click(toggle);
      expect(
        screen.getByText(/Start with basic types/),
      ).toBeInTheDocument();

      // Close
      fireEvent.click(toggle);
      expect(
        screen.queryByText(/Start with basic types/),
      ).not.toBeInTheDocument();
    });

    it('does not render hints section when hints array is empty', () => {
      renderCard({ step: createStep({ hints: [] }) });
      expect(screen.queryByText(/Need a hint\?/)).not.toBeInTheDocument();
    });

    it('does not render hints section when hints is undefined', () => {
      renderCard({ step: createStep({ hints: undefined }) });
      expect(screen.queryByText(/Need a hint\?/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Resources
  // --------------------------------------------------------------------------
  describe('resources', () => {
    it('renders resource buttons when resources are provided', () => {
      const resources: Resource[] = [
        createResource({ id: 'r1', title: 'TypeScript Handbook', type: 'article' }),
        createResource({ id: 'r2', title: 'Intro Video', type: 'video' }),
      ];
      renderCard({ step: createStep({ resources }) });

      expect(screen.getByText('TypeScript Handbook')).toBeInTheDocument();
      expect(screen.getByText('Intro Video')).toBeInTheDocument();
    });

    it('renders the "Resources" heading when resources exist', () => {
      renderCard({
        step: createStep({
          resources: [createResource()],
        }),
      });
      expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('does not render the resources section when resources array is empty', () => {
      renderCard({ step: createStep({ resources: [] }) });
      expect(screen.queryByText('Resources')).not.toBeInTheDocument();
    });

    it('renders duration for resources that have one', () => {
      renderCard({
        step: createStep({
          resources: [
            createResource({ id: 'r1', title: 'Long Video', duration: 15 }),
          ],
        }),
      });
      expect(screen.getByText('(15m)')).toBeInTheDocument();
    });

    it('does not render duration text when resource has no duration', () => {
      renderCard({
        step: createStep({
          resources: [
            createResource({ id: 'r1', title: 'Article', duration: undefined }),
          ],
        }),
      });
      // The resource title should be there, but no duration marker
      expect(screen.getByText('Article')).toBeInTheDocument();
      expect(screen.queryByText(/\(\d+m\)/)).not.toBeInTheDocument();
    });

    it('renders multiple resources as individual buttons', () => {
      const resources: Resource[] = [
        createResource({ id: 'r1', title: 'Resource A' }),
        createResource({ id: 'r2', title: 'Resource B' }),
        createResource({ id: 'r3', title: 'Resource C' }),
      ];
      renderCard({ step: createStep({ resources }) });

      // All 3 resource buttons + Skip + Help + Mark Complete = 6 buttons total
      const buttons = screen.getAllByTestId('button');
      // Resource buttons + action buttons (skip, help, complete)
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  });

  // --------------------------------------------------------------------------
  // Action buttons
  // --------------------------------------------------------------------------
  describe('action buttons', () => {
    it('renders the Skip button', () => {
      renderCard();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('renders the Help button', () => {
      renderCard();
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    it('renders the Mark Complete button', () => {
      renderCard();
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });

    it('disables all action buttons when isLoading is true', () => {
      renderCard({ isLoading: true });

      const buttons = screen.getAllByTestId('button');
      // Filter to footer buttons (Skip, Help, Mark Complete)
      const footer = screen.getByTestId('card-footer');
      const footerButtons = footer.querySelectorAll('[data-testid="button"]');

      footerButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it('does not disable action buttons when isLoading is false', () => {
      renderCard({ isLoading: false });

      const footer = screen.getByTestId('card-footer');
      const footerButtons = footer.querySelectorAll('[data-testid="button"]');

      footerButtons.forEach((btn) => {
        expect(btn).not.toBeDisabled();
      });
    });

    it('does not disable action buttons by default (isLoading defaults to false)', () => {
      renderCard();

      const footer = screen.getByTestId('card-footer');
      const footerButtons = footer.querySelectorAll('[data-testid="button"]');

      footerButtons.forEach((btn) => {
        expect(btn).not.toBeDisabled();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------
  describe('callbacks', () => {
    it('calls onComplete when the Mark Complete button is clicked', () => {
      const onComplete = jest.fn();
      renderCard({ onComplete });

      fireEvent.click(screen.getByText('Mark Complete'));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when the Skip button is clicked', () => {
      const onSkip = jest.fn();
      renderCard({ onSkip });

      fireEvent.click(screen.getByText('Skip'));
      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('calls onRequestHelp when the Help button is clicked', () => {
      const onRequestHelp = jest.fn();
      renderCard({ onRequestHelp });

      fireEvent.click(screen.getByText('Help'));
      expect(onRequestHelp).toHaveBeenCalledTimes(1);
    });

    it('calls onResourceClick with the resource when a resource button is clicked', () => {
      const onResourceClick = jest.fn();
      const resource = createResource({
        id: 'r-click',
        title: 'Clickable Resource',
        type: 'video',
        url: 'https://example.com/video',
      });
      renderCard({
        step: createStep({ resources: [resource] }),
        onResourceClick,
      });

      fireEvent.click(screen.getByText('Clickable Resource'));
      expect(onResourceClick).toHaveBeenCalledTimes(1);
      expect(onResourceClick).toHaveBeenCalledWith(resource);
    });

    it('does not throw when onComplete is not provided and button is clicked', () => {
      renderCard({ onComplete: undefined });
      expect(() => {
        fireEvent.click(screen.getByText('Mark Complete'));
      }).not.toThrow();
    });

    it('does not throw when onSkip is not provided and button is clicked', () => {
      renderCard({ onSkip: undefined });
      expect(() => {
        fireEvent.click(screen.getByText('Skip'));
      }).not.toThrow();
    });

    it('does not throw when onRequestHelp is not provided and button is clicked', () => {
      renderCard({ onRequestHelp: undefined });
      expect(() => {
        fireEvent.click(screen.getByText('Help'));
      }).not.toThrow();
    });

    it('does not throw when onResourceClick is not provided and resource is clicked', () => {
      renderCard({
        step: createStep({
          resources: [createResource({ id: 'r1', title: 'Safe Click' })],
        }),
        onResourceClick: undefined,
      });
      expect(() => {
        fireEvent.click(screen.getByText('Safe Click'));
      }).not.toThrow();
    });

    it('does not call callbacks when buttons are disabled', () => {
      const onComplete = jest.fn();
      const onSkip = jest.fn();
      const onRequestHelp = jest.fn();

      renderCard({
        onComplete,
        onSkip,
        onRequestHelp,
        isLoading: true,
      });

      // Attempt to click disabled buttons
      fireEvent.click(screen.getByText('Mark Complete'));
      fireEvent.click(screen.getByText('Skip'));
      fireEvent.click(screen.getByText('Help'));

      expect(onComplete).not.toHaveBeenCalled();
      expect(onSkip).not.toHaveBeenCalled();
      expect(onRequestHelp).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // className prop
  // --------------------------------------------------------------------------
  describe('className prop', () => {
    it('applies a custom className to the root Card', () => {
      renderCard({ className: 'my-custom-card' });
      const card = screen.getByTestId('card');
      expect(card.className).toContain('my-custom-card');
    });

    it('preserves default classes when a custom className is added', () => {
      renderCard({ className: 'extra-class' });
      const card = screen.getByTestId('card');
      expect(card.className).toContain('overflow-hidden');
      expect(card.className).toContain('extra-class');
    });

    it('renders correctly without a className prop', () => {
      renderCard({ className: undefined });
      const card = screen.getByTestId('card');
      expect(card.className).toContain('overflow-hidden');
    });
  });

  // --------------------------------------------------------------------------
  // isActive prop
  // --------------------------------------------------------------------------
  describe('isActive prop', () => {
    it('applies ring classes when isActive is true (default)', () => {
      renderCard({ isActive: true });
      const card = screen.getByTestId('card');
      expect(card.className).toContain('ring-2');
      expect(card.className).toContain('ring-indigo-500');
    });

    it('does not apply ring classes when isActive is false', () => {
      renderCard({ isActive: false });
      const card = screen.getByTestId('card');
      expect(card.className).not.toContain('ring-2');
      expect(card.className).not.toContain('ring-indigo-500');
    });

    it('applies ring classes by default when isActive is not specified', () => {
      // isActive defaults to true
      renderCard();
      const card = screen.getByTestId('card');
      expect(card.className).toContain('ring-2');
    });
  });

  // --------------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('renders a different icon in Mark Complete button when isLoading is true vs false', () => {
      // When isLoading=true, a Loader2 spinner icon is shown instead of CheckCircle2
      const { container: loadingContainer } = renderCard({ isLoading: true });
      const loadingFooter = loadingContainer.querySelector(
        '[data-testid="card-footer"]',
      );
      const loadingMarkCompleteBtn = loadingFooter!.querySelectorAll(
        '[data-testid="button"]',
      );
      // The Mark Complete button is the last button in the footer
      const markCompleteLoading = loadingMarkCompleteBtn[loadingMarkCompleteBtn.length - 1];
      const loadingSvgs = markCompleteLoading.querySelectorAll('svg');
      expect(loadingSvgs.length).toBeGreaterThanOrEqual(1);
      // The loader icon should have animate-spin class
      const spinnerIcon = markCompleteLoading.querySelector('.animate-spin');
      expect(spinnerIcon).toBeInTheDocument();
    });

    it('does not show spinner icon in Mark Complete button when isLoading is false', () => {
      const { container } = renderCard({ isLoading: false });
      const footer = container.querySelector('[data-testid="card-footer"]');
      const footerButtons = footer!.querySelectorAll('[data-testid="button"]');
      const markCompleteBtn = footerButtons[footerButtons.length - 1];
      // No spinner icon should be present
      const spinnerIcon = markCompleteBtn.querySelector('.animate-spin');
      expect(spinnerIcon).not.toBeInTheDocument();
    });

    it('shows Mark Complete text in both loading and non-loading states', () => {
      renderCard({ isLoading: true });
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('renders without crashing with minimal props', () => {
      const minimalStep: PlanStep = {
        id: 'min',
        title: 'Minimal',
        description: 'Minimal step',
        type: 'learn',
        difficulty: 'easy',
        estimatedMinutes: 5,
        progress: 0,
        resources: [],
      };
      const { container } = render(
        <PlanStepCard step={minimalStep} stepNumber={1} totalSteps={1} />,
      );
      expect(container).toBeInTheDocument();
    });

    it('handles a step with all optional fields populated', () => {
      const fullStep = createStep({
        objectives: ['Obj 1', 'Obj 2'],
        hints: ['Hint 1'],
        resources: [
          createResource({ id: 'r1', title: 'Res 1', duration: 10 }),
          createResource({ id: 'r2', title: 'Res 2', type: 'video' }),
        ],
      });
      renderCard({ step: fullStep });

      expect(screen.getByText('Learn TypeScript Basics')).toBeInTheDocument();
      expect(screen.getByText(/Learning Objectives \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Need a hint\?/)).toBeInTheDocument();
      expect(screen.getByText('Res 1')).toBeInTheDocument();
      expect(screen.getByText('Res 2')).toBeInTheDocument();
    });

    it('renders correctly for step 1 of 1', () => {
      renderCard({ stepNumber: 1, totalSteps: 1 });
      expect(screen.getByText(/Step 1 of 1/)).toBeInTheDocument();
    });

    it('renders correctly for a large step number', () => {
      renderCard({ stepNumber: 99, totalSteps: 100 });
      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText(/Step 99 of 100/)).toBeInTheDocument();
    });

    it('handles both objectives and hints expanded simultaneously', () => {
      const step = createStep({
        objectives: ['Objective 1'],
        hints: ['Hint 1'],
      });
      renderCard({ step });

      // Expand objectives
      fireEvent.click(screen.getByText(/Learning Objectives/));
      // Expand hints
      fireEvent.click(screen.getByText(/Need a hint\?/));

      expect(screen.getByText('Objective 1')).toBeInTheDocument();
      expect(screen.getByText(/Hint 1/)).toBeInTheDocument();
    });

    it('renders all resource types correctly', () => {
      const resources: Resource[] = [
        createResource({ id: 'r1', title: 'A Video', type: 'video' }),
        createResource({ id: 'r2', title: 'An Article', type: 'article' }),
        createResource({ id: 'r3', title: 'A Quiz', type: 'quiz' }),
        createResource({ id: 'r4', title: 'An Exercise', type: 'exercise' }),
        createResource({ id: 'r5', title: 'External Link', type: 'external' }),
      ];
      renderCard({ step: createStep({ resources }) });

      expect(screen.getByText('A Video')).toBeInTheDocument();
      expect(screen.getByText('An Article')).toBeInTheDocument();
      expect(screen.getByText('A Quiz')).toBeInTheDocument();
      expect(screen.getByText('An Exercise')).toBeInTheDocument();
      expect(screen.getByText('External Link')).toBeInTheDocument();
    });
  });
});

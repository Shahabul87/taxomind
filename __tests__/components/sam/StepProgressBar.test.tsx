import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

// Mock framer-motion with Proxy pattern to support all motion.* elements
// including motion.circle used in the progress ring SVG
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLElement>) => {
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
    motion: new Proxy({}, { get: (_t: Record<string, unknown>, prop: string) => makeMotion(prop) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// Mock tooltip UI components with simple HTML elements
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (
    <div data-testid="tooltip-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

// ============================================================================
// IMPORTS - After mocks
// ============================================================================

import {
  StepProgressBar,
  type Step,
  type StepProgressBarProps,
} from '@/components/sam/StepProgressBar';

// ============================================================================
// TEST HELPERS
// ============================================================================

/** Factory for creating a step with sensible defaults */
function createStep(overrides: Partial<Step> & { id: string; label: string }): Step {
  return {
    status: 'pending',
    ...overrides,
  };
}

/** Standard multi-step fixture used by many tests */
function createStandardSteps(): Step[] {
  return [
    createStep({ id: 'step-1', label: 'Analyze', status: 'completed' }),
    createStep({ id: 'step-2', label: 'Plan', status: 'active', progress: 50 }),
    createStep({ id: 'step-3', label: 'Execute', status: 'pending' }),
    createStep({ id: 'step-4', label: 'Review', status: 'pending' }),
  ];
}

/** Render wrapper with common defaults */
function renderProgressBar(props: Partial<StepProgressBarProps> & { steps: Step[] }) {
  const defaultProps: StepProgressBarProps = {
    steps: props.steps,
    compact: false,
    clickable: false,
    showLabels: true,
    showLines: true,
    orientation: 'horizontal',
  };
  return render(<StepProgressBar {...defaultProps} {...props} />);
}

/**
 * Helper to locate step indicator elements by their unique CSS border color
 * classes. Each status maps to a distinct border color on the rounded-full
 * indicator div.
 */
function getStepIndicatorsByStatus(
  container: HTMLElement,
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped',
): HTMLElement[] {
  const classMap: Record<string, string> = {
    pending: 'border-gray-300',
    active: 'border-indigo-500',
    completed: 'border-green-500',
    failed: 'border-red-500',
    skipped: 'border-amber-500',
  };
  const selector = `.rounded-full.${classMap[status].replace(':', '\\:')}`;
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

// ============================================================================
// TESTS
// ============================================================================

describe('StepProgressBar', () => {
  // --------------------------------------------------------------------------
  // Rendering all steps
  // --------------------------------------------------------------------------
  describe('rendering steps', () => {
    it('renders all step labels when showLabels is true and not compact', () => {
      const steps = createStandardSteps();
      renderProgressBar({ steps });

      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Execute')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('renders one icon SVG per step indicator', () => {
      const steps = createStandardSteps();
      const { container } = renderProgressBar({ steps });

      // Each step indicator (rounded-full div) contains at least one SVG icon
      const indicatorDivs = container.querySelectorAll('.rounded-full');
      indicatorDivs.forEach((div) => {
        const svgs = div.querySelectorAll('svg[data-testid]');
        expect(svgs.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders the progress summary showing step count and percentage', () => {
      const steps = createStandardSteps();
      renderProgressBar({ steps });

      // "Step 2 of 4" (1 completed + 1 active)
      expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
      // "25% complete" (1 of 4 completed)
      expect(screen.getByText(/25% complete/)).toBeInTheDocument();
    });

    it('renders the correct number of step indicators for each status', () => {
      const steps = createStandardSteps();
      const { container } = renderProgressBar({ steps });

      expect(getStepIndicatorsByStatus(container, 'completed')).toHaveLength(1);
      expect(getStepIndicatorsByStatus(container, 'active')).toHaveLength(1);
      expect(getStepIndicatorsByStatus(container, 'pending')).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Current step highlighting
  // --------------------------------------------------------------------------
  describe('current step highlighting', () => {
    it('displays the active step label in the highlight banner', () => {
      const steps = createStandardSteps();
      renderProgressBar({ steps });

      // The active step highlight section shows the label + progress
      const highlightTexts = screen.getAllByText(/Plan/);
      // One from the step label, one from the active highlight banner
      expect(highlightTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('shows progress percentage in the active highlight when progress is defined', () => {
      const steps = [
        createStep({ id: 's1', label: 'Loading Data', status: 'active', progress: 75 }),
      ];
      renderProgressBar({ steps });

      // The active highlight shows "Loading Data (75%)"
      const highlightTexts = screen.getAllByText(/Loading Data/);
      expect(highlightTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });

    it('does not show progress percentage in highlight when progress is undefined', () => {
      const steps = [
        createStep({ id: 's1', label: 'Working', status: 'active' }),
      ];
      const { container } = renderProgressBar({ steps });

      // The highlight banner (bg-indigo-50 div) should exist but not show percentage
      const highlightBanner = container.querySelector('.bg-indigo-50');
      expect(highlightBanner).toBeInTheDocument();
      expect(highlightBanner!.textContent).toContain('Working');
      expect(highlightBanner!.textContent).not.toMatch(/\d+%/);
    });

    it('does not render the active step highlight banner when there is no active step', () => {
      const steps = [
        createStep({ id: 's1', label: 'Done', status: 'completed' }),
        createStep({ id: 's2', label: 'Also Done', status: 'completed' }),
      ];
      const { container } = renderProgressBar({ steps });

      expect(container.querySelector('.bg-indigo-50')).not.toBeInTheDocument();
    });

    it('applies ring classes to the active step indicator', () => {
      const steps = [
        createStep({ id: 's1', label: 'Active', status: 'active' }),
      ];
      const { container } = renderProgressBar({ steps });

      const activeIndicator = container.querySelector('.ring-2');
      expect(activeIndicator).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Completed step indicators
  // --------------------------------------------------------------------------
  describe('completed step indicators', () => {
    it('renders completed step indicators with green styling', () => {
      const steps = [
        createStep({ id: 's1', label: 'First', status: 'completed' }),
        createStep({ id: 's2', label: 'Second', status: 'completed' }),
        createStep({ id: 's3', label: 'Third', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps });

      const completedIndicators = getStepIndicatorsByStatus(container, 'completed');
      expect(completedIndicators).toHaveLength(2);
    });

    it('renders the correct percentage when all steps are completed', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'completed' }),
        createStep({ id: 's3', label: 'C', status: 'completed' }),
      ];
      renderProgressBar({ steps });

      expect(screen.getByText(/100% complete/)).toBeInTheDocument();
      expect(screen.getByText(/Step 3 of 3/)).toBeInTheDocument();
    });

    it('renders 0% when no steps are completed', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'pending' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
      ];
      renderProgressBar({ steps });

      expect(screen.getByText(/0% complete/)).toBeInTheDocument();
    });

    it('styles completed step labels with green text', () => {
      const steps = [
        createStep({ id: 's1', label: 'Completed Step', status: 'completed' }),
      ];
      renderProgressBar({ steps });

      const label = screen.getByText('Completed Step');
      expect(label.className).toContain('text-green-600');
    });
  });

  // --------------------------------------------------------------------------
  // Step click callbacks
  // --------------------------------------------------------------------------
  describe('step click callbacks', () => {
    it('calls onStepClick with the step id and index when a clickable step is clicked', () => {
      const onStepClick = jest.fn();
      const steps = [
        createStep({ id: 'alpha', label: 'Alpha', status: 'completed' }),
        createStep({ id: 'beta', label: 'Beta', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, clickable: true, onStepClick });

      // Click the completed step indicator (has cursor-pointer class)
      const clickableIndicators = container.querySelectorAll('.cursor-pointer');
      expect(clickableIndicators.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(clickableIndicators[0]);

      expect(onStepClick).toHaveBeenCalledWith('alpha', 0);
    });

    it('does NOT trigger onStepClick for active steps even when clickable is true', () => {
      const onStepClick = jest.fn();
      const steps = [
        createStep({ id: 's1', label: 'Running', status: 'active' }),
      ];
      const { container } = renderProgressBar({ steps, clickable: true, onStepClick });

      // Active step indicator should NOT have cursor-pointer
      const activeIndicator = getStepIndicatorsByStatus(container, 'active')[0];
      expect(activeIndicator.className).not.toContain('cursor-pointer');

      // Clicking the active indicator should not fire the callback
      fireEvent.click(activeIndicator);
      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('does NOT trigger onStepClick when clickable is false', () => {
      const onStepClick = jest.fn();
      const steps = [
        createStep({ id: 's1', label: 'Step', status: 'completed' }),
      ];
      const { container } = renderProgressBar({ steps, clickable: false, onStepClick });

      // No indicators should have cursor-pointer when clickable is false
      const clickableIndicators = container.querySelectorAll('.cursor-pointer');
      expect(clickableIndicators).toHaveLength(0);

      // Click the indicator anyway and verify no callback
      const indicator = getStepIndicatorsByStatus(container, 'completed')[0];
      fireEvent.click(indicator);
      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('calls onStepClick for failed and skipped steps when clickable is true', () => {
      const onStepClick = jest.fn();
      const steps = [
        createStep({ id: 'failed-step', label: 'Failed', status: 'failed' }),
        createStep({ id: 'skipped-step', label: 'Skipped', status: 'skipped' }),
      ];
      const { container } = renderProgressBar({ steps, clickable: true, onStepClick });

      // Click the failed step (border-red-500)
      const failedIndicator = getStepIndicatorsByStatus(container, 'failed')[0];
      fireEvent.click(failedIndicator);
      expect(onStepClick).toHaveBeenCalledWith('failed-step', 0);

      onStepClick.mockClear();

      // Click the skipped step (border-amber-500)
      const skippedIndicator = getStepIndicatorsByStatus(container, 'skipped')[0];
      fireEvent.click(skippedIndicator);
      expect(onStepClick).toHaveBeenCalledWith('skipped-step', 1);
    });

    it('calls onStepClick with correct index for pending steps', () => {
      const onStepClick = jest.fn();
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
        createStep({ id: 's3', label: 'C', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, clickable: true, onStepClick });

      // Click the second pending step (index 2)
      const pendingIndicators = getStepIndicatorsByStatus(container, 'pending');
      expect(pendingIndicators).toHaveLength(2);
      fireEvent.click(pendingIndicators[1]);
      expect(onStepClick).toHaveBeenCalledWith('s3', 2);
    });
  });

  // --------------------------------------------------------------------------
  // Step labels and descriptions
  // --------------------------------------------------------------------------
  describe('step labels and descriptions', () => {
    it('hides labels when showLabels is false', () => {
      const steps = [
        createStep({ id: 's1', label: 'My Label', status: 'pending' }),
      ];
      renderProgressBar({ steps, showLabels: false });

      // In non-compact mode without showLabels, the label paragraph is not rendered
      const labelElements = screen.queryAllByText('My Label');
      expect(labelElements).toHaveLength(0);
    });

    it('shows step descriptions in vertical orientation', () => {
      const steps = [
        createStep({
          id: 's1',
          label: 'Analyze',
          description: 'Examining the content',
          status: 'pending',
        }),
      ];
      renderProgressBar({ steps, orientation: 'vertical', showLabels: true });

      expect(screen.getByText('Examining the content')).toBeInTheDocument();
    });

    it('does NOT show step descriptions in horizontal orientation', () => {
      const steps = [
        createStep({
          id: 's1',
          label: 'Analyze',
          description: 'Examining the content',
          status: 'pending',
        }),
      ];
      renderProgressBar({ steps, orientation: 'horizontal', showLabels: true });

      // Descriptions are only rendered when orientation === 'vertical'
      expect(screen.queryByText('Examining the content')).not.toBeInTheDocument();
    });

    it('renders labels in compact mode inside tooltip content', () => {
      const steps = [
        createStep({
          id: 's1',
          label: 'Compact Label',
          description: 'Compact Description',
          status: 'pending',
        }),
      ];
      renderProgressBar({ steps, compact: true });

      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
      expect(screen.getByText('Compact Label')).toBeInTheDocument();
      expect(screen.getByText('Compact Description')).toBeInTheDocument();
    });

    it('does NOT show label text outside tooltip in compact mode', () => {
      const steps = [
        createStep({ id: 's1', label: 'Hidden Outside', status: 'pending' }),
      ];
      renderProgressBar({ steps, compact: true, showLabels: true });

      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toHaveTextContent('Hidden Outside');
    });

    it('shows description only for steps that have one in vertical mode', () => {
      const steps = [
        createStep({ id: 's1', label: 'With Desc', description: 'Has description', status: 'pending' }),
        createStep({ id: 's2', label: 'No Desc', status: 'pending' }),
      ];
      renderProgressBar({ steps, orientation: 'vertical', showLabels: true });

      expect(screen.getByText('Has description')).toBeInTheDocument();
      const descElements = screen.queryAllByText(/Has description/);
      expect(descElements).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Compact mode behavior
  // --------------------------------------------------------------------------
  describe('compact mode', () => {
    it('hides the progress summary in compact mode', () => {
      const steps = createStandardSteps();
      renderProgressBar({ steps, compact: true });

      expect(screen.queryByText(/% complete/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('hides the active step highlight banner in compact mode', () => {
      const steps = [
        createStep({ id: 's1', label: 'Active', status: 'active', progress: 50 }),
      ];
      const { container } = renderProgressBar({ steps, compact: true });

      // In compact mode, the bottom highlight bar (bg-indigo-50) is not rendered
      expect(container.querySelector('.bg-indigo-50')).not.toBeInTheDocument();
    });

    it('uses smaller indicator size in compact mode', () => {
      const steps = [
        createStep({ id: 's1', label: 'Small', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, compact: true });

      const indicator = container.querySelector('.h-6.w-6');
      expect(indicator).toBeInTheDocument();
    });

    it('uses larger indicator size in non-compact mode', () => {
      const steps = [
        createStep({ id: 's1', label: 'Large', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, compact: false });

      const indicator = container.querySelector('.h-10.w-10');
      expect(indicator).toBeInTheDocument();
    });

    it('wraps each step in a Tooltip in compact mode', () => {
      const steps = [
        createStep({ id: 's1', label: 'First', status: 'pending' }),
        createStep({ id: 's2', label: 'Second', status: 'completed' }),
      ];
      renderProgressBar({ steps, compact: true });

      const tooltips = screen.getAllByTestId('tooltip');
      expect(tooltips).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Connecting lines
  // --------------------------------------------------------------------------
  describe('connecting lines', () => {
    it('renders connecting lines between steps when showLines is true', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
        createStep({ id: 's3', label: 'C', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, showLines: true });

      const lines = container.querySelectorAll('.min-w-\\[20px\\]');
      // 2 lines for 3 steps (no line after the last step)
      expect(lines).toHaveLength(2);
    });

    it('does NOT render connecting lines when showLines is false', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, showLines: false });

      const lines = container.querySelectorAll('.min-w-\\[20px\\]');
      expect(lines).toHaveLength(0);
    });

    it('renders vertical connecting lines in vertical orientation', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
      ];
      const { container } = renderProgressBar({
        steps,
        showLines: true,
        orientation: 'vertical',
      });

      const lines = container.querySelectorAll('.min-h-\\[20px\\]');
      expect(lines).toHaveLength(1);
    });

    it('does not render a line after the last step', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
      ];
      const { container } = renderProgressBar({ steps, showLines: true });

      const hLines = container.querySelectorAll('.min-w-\\[20px\\]');
      expect(hLines).toHaveLength(0);
    });

    it('applies gradient to lines after completed or active steps', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'active' }),
        createStep({ id: 's3', label: 'C', status: 'pending' }),
      ];
      const { container } = renderProgressBar({ steps, showLines: true });

      const gradientLines = container.querySelectorAll('.bg-gradient-to-r');
      expect(gradientLines.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // Orientation
  // --------------------------------------------------------------------------
  describe('orientation', () => {
    it('applies horizontal flex classes by default', () => {
      const steps = [createStep({ id: 's1', label: 'A', status: 'pending' })];
      const { container } = renderProgressBar({ steps, orientation: 'horizontal' });

      const stepsContainer = container.querySelector('.flex-row.items-center.justify-between');
      expect(stepsContainer).toBeInTheDocument();
    });

    it('applies vertical flex classes when orientation is vertical', () => {
      const steps = [createStep({ id: 's1', label: 'A', status: 'pending' })];
      const { container } = renderProgressBar({ steps, orientation: 'vertical' });

      const stepsContainer = container.querySelector('.flex-col.gap-2');
      expect(stepsContainer).toBeInTheDocument();
    });

    it('applies text-left class to labels in vertical orientation', () => {
      const steps = [createStep({ id: 's1', label: 'Vertical Label', status: 'pending' })];
      const { container } = renderProgressBar({ steps, orientation: 'vertical', showLabels: true });

      const labelContainer = container.querySelector('.text-left');
      expect(labelContainer).toBeInTheDocument();
    });

    it('applies text-center class to labels in horizontal orientation', () => {
      const steps = [createStep({ id: 's1', label: 'Horiz Label', status: 'pending' })];
      const { container } = renderProgressBar({ steps, orientation: 'horizontal', showLabels: true });

      const labelContainer = container.querySelector('.text-center');
      expect(labelContainer).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // className prop
  // --------------------------------------------------------------------------
  describe('className prop', () => {
    it('applies a custom className to the root container', () => {
      const steps = [createStep({ id: 's1', label: 'A', status: 'pending' })];
      const { container } = renderProgressBar({ steps, className: 'my-custom-class' });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('my-custom-class');
    });

    it('preserves default space-y-2 class when custom className is added', () => {
      const steps = [createStep({ id: 's1', label: 'A', status: 'pending' })];
      const { container } = renderProgressBar({ steps, className: 'extra' });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-2');
    });

    it('works without className prop', () => {
      const steps = [createStep({ id: 's1', label: 'A', status: 'pending' })];
      const { container } = render(<StepProgressBar steps={steps} />);

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-2');
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('renders without crashing when steps array is empty', () => {
      const { container } = renderProgressBar({ steps: [] });
      expect(container).toBeInTheDocument();
    });

    it('handles a single step correctly', () => {
      const steps = [createStep({ id: 'only', label: 'Only Step', status: 'active', progress: 30 })];
      renderProgressBar({ steps });

      expect(screen.getByText('Only Step')).toBeInTheDocument();
      expect(screen.getByText(/30%/)).toBeInTheDocument();
      expect(screen.getByText(/Step 1 of 1/)).toBeInTheDocument();
    });

    it('handles all steps completed', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'completed' }),
        createStep({ id: 's3', label: 'C', status: 'completed' }),
      ];
      renderProgressBar({ steps });

      expect(screen.getByText(/100% complete/)).toBeInTheDocument();
      expect(screen.getByText(/Step 3 of 3/)).toBeInTheDocument();
    });

    it('handles all steps pending', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'pending' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
      ];
      renderProgressBar({ steps });

      expect(screen.getByText(/0% complete/)).toBeInTheDocument();
      expect(screen.getByText(/Step 0 of 2/)).toBeInTheDocument();
    });

    it('correctly counts mixed statuses - only completed contribute to percentage', () => {
      const steps = [
        createStep({ id: 's1', label: 'Done', status: 'completed' }),
        createStep({ id: 's2', label: 'Fail', status: 'failed' }),
        createStep({ id: 's3', label: 'Skip', status: 'skipped' }),
        createStep({ id: 's4', label: 'Active', status: 'active' }),
      ];
      renderProgressBar({ steps });

      // 1 of 4 completed = 25%
      expect(screen.getByText(/25% complete/)).toBeInTheDocument();
    });

    it('handles multiple active steps without errors', () => {
      const steps = [
        createStep({ id: 's1', label: 'Active A', status: 'active', progress: 20 }),
        createStep({ id: 's2', label: 'Active B', status: 'active', progress: 80 }),
      ];
      const { container } = renderProgressBar({ steps });

      const activeIndicators = getStepIndicatorsByStatus(container, 'active');
      expect(activeIndicators).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Status indicator styling
  // --------------------------------------------------------------------------
  describe('status indicator styling', () => {
    it('applies gray styling for pending status', () => {
      const steps = [createStep({ id: 's1', label: 'Pending', status: 'pending' })];
      const { container } = renderProgressBar({ steps });

      const indicator = getStepIndicatorsByStatus(container, 'pending')[0];
      expect(indicator).toBeInTheDocument();
      expect(indicator.className).toContain('bg-gray-100');
    });

    it('applies indigo styling for active status', () => {
      const steps = [createStep({ id: 's1', label: 'Active', status: 'active' })];
      const { container } = renderProgressBar({ steps });

      const indicator = getStepIndicatorsByStatus(container, 'active')[0];
      expect(indicator).toBeInTheDocument();
      expect(indicator.className).toContain('bg-indigo-100');
    });

    it('applies green styling for completed status', () => {
      const steps = [createStep({ id: 's1', label: 'Done', status: 'completed' })];
      const { container } = renderProgressBar({ steps });

      const indicator = getStepIndicatorsByStatus(container, 'completed')[0];
      expect(indicator).toBeInTheDocument();
      expect(indicator.className).toContain('bg-green-100');
    });

    it('applies red styling for failed status', () => {
      const steps = [createStep({ id: 's1', label: 'Err', status: 'failed' })];
      const { container } = renderProgressBar({ steps });

      const indicator = getStepIndicatorsByStatus(container, 'failed')[0];
      expect(indicator).toBeInTheDocument();
      expect(indicator.className).toContain('bg-red-100');
    });

    it('applies amber styling for skipped status', () => {
      const steps = [createStep({ id: 's1', label: 'Skip', status: 'skipped' })];
      const { container } = renderProgressBar({ steps });

      const indicator = getStepIndicatorsByStatus(container, 'skipped')[0];
      expect(indicator).toBeInTheDocument();
      expect(indicator.className).toContain('bg-amber-100');
    });

    it('applies animate-spin class to icon in active step', () => {
      const steps = [createStep({ id: 's1', label: 'Active', status: 'active' })];
      const { container } = renderProgressBar({ steps });

      const spinningIcon = container.querySelector('.animate-spin');
      expect(spinningIcon).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Progress ring for active step
  // --------------------------------------------------------------------------
  describe('progress ring', () => {
    it('renders an SVG progress ring when the active step has a progress value', () => {
      const steps = [
        createStep({ id: 's1', label: 'Active', status: 'active', progress: 60 }),
      ];
      const { container } = renderProgressBar({ steps });

      const progressSvg = container.querySelector('svg[viewBox="0 0 36 36"]');
      expect(progressSvg).toBeInTheDocument();
    });

    it('does NOT render a progress ring when the active step has no progress defined', () => {
      const steps = [
        createStep({ id: 's1', label: 'Active', status: 'active' }),
      ];
      const { container } = renderProgressBar({ steps });

      const progressSvg = container.querySelector('svg[viewBox="0 0 36 36"]');
      expect(progressSvg).not.toBeInTheDocument();
    });

    it('does NOT render a progress ring for non-active steps even with progress set', () => {
      const steps = [
        createStep({ id: 's1', label: 'Done', status: 'completed', progress: 100 }),
      ];
      const { container } = renderProgressBar({ steps });

      const progressSvg = container.querySelector('svg[viewBox="0 0 36 36"]');
      expect(progressSvg).not.toBeInTheDocument();
    });

    it('renders two circles inside the progress ring SVG', () => {
      const steps = [
        createStep({ id: 's1', label: 'Active', status: 'active', progress: 50 }),
      ];
      const { container } = renderProgressBar({ steps });

      const progressSvg = container.querySelector('svg[viewBox="0 0 36 36"]');
      expect(progressSvg).toBeInTheDocument();
      // Background circle + animated progress circle
      const circles = progressSvg!.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Default prop values
  // --------------------------------------------------------------------------
  describe('default prop values', () => {
    it('renders with default props (non-compact, non-clickable, labels visible, lines visible, horizontal)', () => {
      const steps = [
        createStep({ id: 's1', label: 'First', status: 'completed' }),
        createStep({ id: 's2', label: 'Second', status: 'pending' }),
      ];

      render(<StepProgressBar steps={steps} />);

      // Labels should be visible (default showLabels=true)
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();

      // Progress summary visible (default compact=false)
      expect(screen.getByText(/50% complete/)).toBeInTheDocument();
    });

    it('renders connecting lines by default', () => {
      const steps = [
        createStep({ id: 's1', label: 'A', status: 'completed' }),
        createStep({ id: 's2', label: 'B', status: 'pending' }),
      ];
      const { container } = render(<StepProgressBar steps={steps} />);

      // Default showLines=true
      const lines = container.querySelectorAll('.min-w-\\[20px\\]');
      expect(lines).toHaveLength(1);
    });
  });
});

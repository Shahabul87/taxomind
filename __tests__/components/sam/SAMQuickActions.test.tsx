import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCK: @sam-ai/react hooks
// pnpm resolves @sam-ai/react via symlink to packages/react/src/index.ts
// jest.mock must use the resolved filesystem path for proper interception
// ============================================================================

const mockExecuteAction = jest.fn();
const mockSendMessage = jest.fn();
const mockOpenSAM = jest.fn();

const mockUseSAMActions: Record<string, unknown> = {
  actions: [],
  executeAction: mockExecuteAction,
  isExecuting: false,
};

const mockUseSAMChat: Record<string, unknown> = {
  sendMessage: mockSendMessage,
  isProcessing: false,
};

const mockUseSAM: Record<string, unknown> = {
  isOpen: false,
  open: mockOpenSAM,
  context: null,
};

jest.mock(
  '../../../packages/react/src/index',
  () => ({
    __esModule: true,
    useSAMActions: () => mockUseSAMActions,
    useSAMChat: () => mockUseSAMChat,
    useSAM: () => mockUseSAM,
  })
);

// ============================================================================
// MOCK: framer-motion
// ============================================================================

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

// ============================================================================
// MOCK: UI components
// ============================================================================

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
    asChild?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children, side, className }: { children: React.ReactNode; side?: string; className?: string }) => (
    <div data-testid="tooltip-content" data-side={side} className={className}>{children}</div>
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

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import { SAMQuickActions, DEFAULT_QUICK_ACTIONS } from '@/components/sam/SAMQuickActions';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Reset all hook return values to defaults before each test.
 * We mutate the same object references that the mock closures capture.
 */
function resetHookDefaults(): void {
  mockUseSAMActions.actions = [];
  mockUseSAMActions.executeAction = mockExecuteAction;
  mockUseSAMActions.isExecuting = false;

  mockUseSAMChat.sendMessage = mockSendMessage;
  mockUseSAMChat.isProcessing = false;

  mockUseSAM.isOpen = false;
  mockUseSAM.open = mockOpenSAM;
  mockUseSAM.context = null;
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('SAMQuickActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetHookDefaults();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // 1. INITIAL RENDER - INLINE VARIANT (DEFAULT)
  // --------------------------------------------------------------------------

  describe('inline variant (default)', () => {
    it('renders the heading and subtitle', () => {
      render(<SAMQuickActions />);

      expect(screen.getByText('SAM Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Get instant help with your learning')).toBeInTheDocument();
    });

    it('renders all default quick action buttons', () => {
      render(<SAMQuickActions />);

      for (const action of DEFAULT_QUICK_ACTIONS) {
        expect(screen.getByText(action.label)).toBeInTheDocument();
      }
    });

    it('applies custom className', () => {
      const { container } = render(<SAMQuickActions className="my-custom-class" />);

      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('my-custom-class');
    });

    it('limits visible actions when maxActions is provided', () => {
      render(<SAMQuickActions maxActions={3} />);

      // Only the first 3 actions should be visible
      const firstThreeLabels = DEFAULT_QUICK_ACTIONS.slice(0, 3).map((a) => a.label);
      const remainingLabels = DEFAULT_QUICK_ACTIONS.slice(3).map((a) => a.label);

      for (const label of firstThreeLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      for (const label of remainingLabels) {
        expect(screen.queryByText(label)).not.toBeInTheDocument();
      }
    });

    it('filters actions by categories', () => {
      render(<SAMQuickActions categories={['learning']} />);

      const learningActions = DEFAULT_QUICK_ACTIONS.filter((a) => a.category === 'learning');
      const nonLearningActions = DEFAULT_QUICK_ACTIONS.filter((a) => a.category !== 'learning');

      for (const action of learningActions) {
        expect(screen.getByText(action.label)).toBeInTheDocument();
      }
      for (const action of nonLearningActions) {
        expect(screen.queryByText(action.label)).not.toBeInTheDocument();
      }
    });

    it('includes custom actions alongside defaults', () => {
      const customActions = [
        {
          id: 'custom_1',
          label: 'My Custom Action',
          description: 'A custom action for testing',
          icon: () => <svg data-testid="icon-custom" />,
          category: 'help' as const,
          color: 'from-red-500 to-pink-500',
          prompt: 'Do something custom',
        },
      ];

      render(<SAMQuickActions customActions={customActions} />);

      expect(screen.getByText('My Custom Action')).toBeInTheDocument();
      // Default actions should still be present
      expect(screen.getByText('Explain This')).toBeInTheDocument();
    });

    it('shows grouped actions when showCategories is true', () => {
      render(<SAMQuickActions showCategories />);

      // Category badges should render
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);

      // All category names should appear
      const categoryNames = [...new Set(DEFAULT_QUICK_ACTIONS.map((a) => a.category))];
      for (const name of categoryNames) {
        expect(screen.getByText(name)).toBeInTheDocument();
      }
    });

    it('renders SAM context actions when available', () => {
      mockUseSAMActions.actions = [
        { id: 'ctx-1', type: 'analyze', label: 'Contextual Analyze', payload: {} },
        { id: 'ctx-2', type: 'navigate', label: 'Contextual Navigate', payload: {} },
      ];

      render(<SAMQuickActions />);

      expect(screen.getByText('Suggested by SAM')).toBeInTheDocument();
      expect(screen.getByText('Contextual Analyze')).toBeInTheDocument();
      expect(screen.getByText('Contextual Navigate')).toBeInTheDocument();
    });

    it('does not render SAM context section when no context actions exist', () => {
      mockUseSAMActions.actions = [];

      render(<SAMQuickActions />);

      expect(screen.queryByText('Suggested by SAM')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. FLOATING VARIANT
  // --------------------------------------------------------------------------

  describe('floating variant', () => {
    it('renders a floating action button', () => {
      const { container } = render(<SAMQuickActions variant="floating" />);

      // The FAB should be present (a button element rendered by motion.button)
      const fab = container.querySelector('button');
      expect(fab).toBeInTheDocument();
    });

    it('toggles the action menu when FAB is clicked', () => {
      render(<SAMQuickActions variant="floating" />);

      // Menu should not initially show heading
      // Because AnimatePresence renders children and isOpen is false, the menu panel should not be present
      expect(screen.queryByText('SAM Quick Actions')).not.toBeInTheDocument();

      // Click the FAB to open
      const buttons = screen.getAllByRole('button');
      // The last button is the FAB (motion.button renders as <button>)
      const fab = buttons[buttons.length - 1];
      fireEvent.click(fab);

      expect(screen.getByText('SAM Quick Actions')).toBeInTheDocument();
    });

    it('closes the menu when close button is clicked', () => {
      render(<SAMQuickActions variant="floating" />);

      // Open the menu
      const buttons = screen.getAllByRole('button');
      const fab = buttons[buttons.length - 1];
      fireEvent.click(fab);

      expect(screen.getByText('SAM Quick Actions')).toBeInTheDocument();

      // Find the close button (rendered inside the menu panel)
      // The close button is the first ghost/icon button inside the opened menu
      const allButtons = screen.getAllByRole('button');
      // The close button has the X icon child - find the button with data-variant="ghost" in the menu
      const closeBtn = allButtons.find(
        (btn) => btn.getAttribute('data-variant') === 'ghost' && btn.getAttribute('data-size') === 'icon'
      );
      expect(closeBtn).toBeDefined();
      fireEvent.click(closeBtn!);

      expect(screen.queryByText('SAM Quick Actions')).not.toBeInTheDocument();
    });

    it('applies position classes', () => {
      const { container } = render(
        <SAMQuickActions variant="floating" position="top-left" />
      );

      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('top-4');
      expect(root.className).toContain('left-4');
    });

    it('renders grouped actions in floating menu when showCategories is true', () => {
      render(<SAMQuickActions variant="floating" showCategories />);

      // Open menu
      const buttons = screen.getAllByRole('button');
      const fab = buttons[buttons.length - 1];
      fireEvent.click(fab);

      // Category badges should render
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows SAM context actions in floating menu', () => {
      mockUseSAMActions.actions = [
        { id: 'ctx-float-1', type: 'execute', label: 'Float Action 1', payload: {} },
      ];

      render(<SAMQuickActions variant="floating" />);

      // Open menu
      const buttons = screen.getAllByRole('button');
      const fab = buttons[buttons.length - 1];
      fireEvent.click(fab);

      expect(screen.getByText('From SAM Context')).toBeInTheDocument();
      expect(screen.getByText('Float Action 1')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. COMPACT VARIANT
  // --------------------------------------------------------------------------

  describe('compact variant', () => {
    it('renders at most 5 action buttons', () => {
      render(<SAMQuickActions variant="compact" />);

      // First 5 actions should be visible
      const firstFive = DEFAULT_QUICK_ACTIONS.slice(0, 5);
      for (const action of firstFive) {
        // In compact mode, labels are hidden and only tooltips show them
        // But tooltip content renders the label in a <p> tag
        const tooltipLabels = screen.getAllByText(action.label);
        expect(tooltipLabels.length).toBeGreaterThan(0);
      }
    });

    it('shows a "more" button when there are more than 5 actions', () => {
      render(<SAMQuickActions variant="compact" />);

      // The "More actions" text appears in a tooltip
      expect(screen.getByText('More actions')).toBeInTheDocument();
    });

    it('does not show "more" button when 5 or fewer actions', () => {
      render(<SAMQuickActions variant="compact" maxActions={3} />);

      expect(screen.queryByText('More actions')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SAMQuickActions variant="compact" className="compact-class" />
      );

      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('compact-class');
    });
  });

  // --------------------------------------------------------------------------
  // 4. CLICK HANDLERS AND ACTION EXECUTION
  // --------------------------------------------------------------------------

  describe('action execution', () => {
    it('sends a message via useSAMChat when action has a prompt', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      // Click the "Explain This" button (first learning action)
      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      // Should open SAM
      expect(mockOpenSAM).toHaveBeenCalled();

      // Should send the prompt
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('explain the current concept')
      );
    });

    it('opens SAM when it is not already open', async () => {
      mockUseSAM.isOpen = false;
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      const summarizeBtn = screen.getByText('Summarize');
      await act(async () => {
        fireEvent.click(summarizeBtn);
      });

      expect(mockOpenSAM).toHaveBeenCalledTimes(1);
    });

    it('does not re-open SAM when it is already open', async () => {
      mockUseSAM.isOpen = true;
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      const summarizeBtn = screen.getByText('Summarize');
      await act(async () => {
        fireEvent.click(summarizeBtn);
      });

      expect(mockOpenSAM).not.toHaveBeenCalled();
    });

    it('executes a SAMAction when the action has a predefined action', async () => {
      const samAction = { id: 'ctx-exec', type: 'analyze' as const, label: 'Analyze', payload: {} };
      mockUseSAMActions.actions = [samAction];
      mockExecuteAction.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      const analyzeBtn = screen.getByText('Analyze');
      await act(async () => {
        fireEvent.click(analyzeBtn);
      });

      expect(mockExecuteAction).toHaveBeenCalledWith(samAction);
    });

    it('enriches prompt with topic context', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(
        <SAMQuickActions
          context={{ topicName: 'React Hooks', conceptId: 'concept-123' }}
        />
      );

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('[Topic: React Hooks]')
      );
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining('[Concept ID: concept-123]')
      );
    });

    it('does not send a message for "Ask SAM" action (empty prompt)', async () => {
      // Filter to only help category to get "Ask SAM"
      render(<SAMQuickActions categories={['help']} />);

      const askBtn = screen.getByText('Ask SAM');
      await act(async () => {
        fireEvent.click(askBtn);
      });

      // Should open SAM but NOT send a message
      expect(mockOpenSAM).toHaveBeenCalled();
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('does not execute when isProcessing is true', async () => {
      mockUseSAMChat.isProcessing = true;

      render(<SAMQuickActions />);

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(mockOpenSAM).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 5. LOADING STATES
  // --------------------------------------------------------------------------

  describe('loading states', () => {
    it('disables a button while its action is executing', async () => {
      // Make sendMessage hang (never resolve during the test check)
      let resolveMessage: (() => void) | undefined;
      mockSendMessage.mockImplementation(
        () => new Promise<void>((resolve) => { resolveMessage = resolve; })
      );

      render(<SAMQuickActions />);

      const explainBtn = screen.getByText('Explain This').closest('button')!;
      expect(explainBtn).not.toBeDisabled();

      // Start execution
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      // The button should be disabled while executing
      expect(explainBtn).toBeDisabled();

      // Resolve to clean up
      await act(async () => {
        resolveMessage?.();
      });
    });

    it('disables SAM context action buttons when isExecuting is true', () => {
      mockUseSAMActions.isExecuting = true;
      mockUseSAMActions.actions = [
        { id: 'ctx-dis', type: 'analyze', label: 'Disabled Context Action', payload: {} },
      ];

      render(<SAMQuickActions />);

      const contextBtn = screen.getByText('Disabled Context Action').closest('button')!;
      expect(contextBtn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 6. SUCCESS AND ERROR STATES
  // --------------------------------------------------------------------------

  describe('success and error states', () => {
    it('calls onActionComplete after successful execution', async () => {
      const onActionComplete = jest.fn();
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions onActionComplete={onActionComplete} />);

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      expect(onActionComplete).toHaveBeenCalledWith('explain_concept', { success: true });
    });

    it('resets success state after 2 seconds', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      // After success, the button should not be disabled anymore
      const btn = screen.getByText('Explain This').closest('button')!;
      expect(btn).not.toBeDisabled();

      // Advance timers to clear success state
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Button still works
      expect(btn).not.toBeDisabled();
    });

    it('calls onActionError when action fails', async () => {
      const onActionError = jest.fn();
      const testError = new Error('Network failure');
      mockSendMessage.mockRejectedValueOnce(testError);

      render(<SAMQuickActions onActionError={onActionError} />);

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      expect(onActionError).toHaveBeenCalledWith('explain_concept', testError);
    });

    it('calls onActionError with wrapped Error when non-Error is thrown', async () => {
      const onActionError = jest.fn();
      mockSendMessage.mockRejectedValueOnce('string error');

      render(<SAMQuickActions onActionError={onActionError} />);

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      expect(onActionError).toHaveBeenCalledWith(
        'explain_concept',
        expect.objectContaining({ message: 'string error' })
      );
    });

    it('resets error state after 3 seconds', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('fail'));

      render(<SAMQuickActions />);

      const explainBtn = screen.getByText('Explain This');
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      // Advance 3 seconds to clear error state
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Button should be re-enabled
      const btn = screen.getByText('Explain This').closest('button')!;
      expect(btn).not.toBeDisabled();
    });

    it('re-enables button after action completes (success)', async () => {
      mockSendMessage.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      const btn = screen.getByText('Explain This').closest('button')!;
      await act(async () => {
        fireEvent.click(btn);
      });

      expect(btn).not.toBeDisabled();
    });

    it('re-enables button after action completes (error)', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('oops'));

      render(<SAMQuickActions />);

      const btn = screen.getByText('Explain This').closest('button')!;
      await act(async () => {
        fireEvent.click(btn);
      });

      expect(btn).not.toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 7. CATEGORIES FILTER
  // --------------------------------------------------------------------------

  describe('category filtering', () => {
    it('renders only practice actions when filtered', () => {
      render(<SAMQuickActions categories={['practice']} />);

      const practiceActions = DEFAULT_QUICK_ACTIONS.filter((a) => a.category === 'practice');
      const otherActions = DEFAULT_QUICK_ACTIONS.filter((a) => a.category !== 'practice');

      for (const action of practiceActions) {
        expect(screen.getByText(action.label)).toBeInTheDocument();
      }
      for (const action of otherActions) {
        expect(screen.queryByText(action.label)).not.toBeInTheDocument();
      }
    });

    it('renders multiple categories when provided', () => {
      render(<SAMQuickActions categories={['learning', 'planning']} />);

      const matchingActions = DEFAULT_QUICK_ACTIONS.filter(
        (a) => a.category === 'learning' || a.category === 'planning'
      );
      const otherActions = DEFAULT_QUICK_ACTIONS.filter(
        (a) => a.category !== 'learning' && a.category !== 'planning'
      );

      for (const action of matchingActions) {
        expect(screen.getByText(action.label)).toBeInTheDocument();
      }
      for (const action of otherActions) {
        expect(screen.queryByText(action.label)).not.toBeInTheDocument();
      }
    });

    it('renders all actions when categories is an empty array', () => {
      render(<SAMQuickActions categories={[]} />);

      for (const action of DEFAULT_QUICK_ACTIONS) {
        expect(screen.getByText(action.label)).toBeInTheDocument();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 8. EXPORTS
  // --------------------------------------------------------------------------

  describe('exports', () => {
    it('exports DEFAULT_QUICK_ACTIONS with correct structure', () => {
      expect(Array.isArray(DEFAULT_QUICK_ACTIONS)).toBe(true);
      expect(DEFAULT_QUICK_ACTIONS.length).toBeGreaterThan(0);

      for (const action of DEFAULT_QUICK_ACTIONS) {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('description');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('category');
        expect(action).toHaveProperty('color');
      }
    });

    it('has the expected category values', () => {
      const categories = new Set(DEFAULT_QUICK_ACTIONS.map((a) => a.category));
      expect(categories).toContain('learning');
      expect(categories).toContain('practice');
      expect(categories).toContain('help');
      expect(categories).toContain('analysis');
      expect(categories).toContain('planning');
    });
  });

  // --------------------------------------------------------------------------
  // 9. CONTEXT ACTIONS IN INLINE VARIANT
  // --------------------------------------------------------------------------

  describe('SAM context actions in inline variant', () => {
    it('renders context action buttons with Zap icons', () => {
      mockUseSAMActions.actions = [
        { id: 'ctx-a', type: 'custom', label: 'Custom SAM Action', payload: {} },
      ];

      render(<SAMQuickActions />);

      expect(screen.getByText('Custom SAM Action')).toBeInTheDocument();
    });

    it('clicking a context action executes the SAM action', async () => {
      const samAction = { id: 'ctx-click', type: 'execute' as const, label: 'Execute Me', payload: { foo: 'bar' } };
      mockUseSAMActions.actions = [samAction];
      mockExecuteAction.mockResolvedValueOnce(undefined);

      render(<SAMQuickActions />);

      const btn = screen.getByText('Execute Me');
      await act(async () => {
        fireEvent.click(btn);
      });

      expect(mockExecuteAction).toHaveBeenCalledWith(samAction);
    });

    it('disables context buttons when they are executing or isExecuting', () => {
      mockUseSAMActions.isExecuting = true;
      mockUseSAMActions.actions = [
        { id: 'ctx-dis-2', type: 'analyze', label: 'Disabled Action 2', payload: {} },
      ];

      render(<SAMQuickActions />);

      const btn = screen.getByText('Disabled Action 2').closest('button')!;
      expect(btn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 10. FLOATING VARIANT POSITIONS
  // --------------------------------------------------------------------------

  describe('floating variant positions', () => {
    const positions: Array<{
      pos: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      expected: string[];
    }> = [
      { pos: 'bottom-right', expected: ['bottom-4', 'right-4'] },
      { pos: 'bottom-left', expected: ['bottom-4', 'left-4'] },
      { pos: 'top-right', expected: ['top-4', 'right-4'] },
      { pos: 'top-left', expected: ['top-4', 'left-4'] },
    ];

    for (const { pos, expected } of positions) {
      it(`applies correct classes for position="${pos}"`, () => {
        const { container } = render(
          <SAMQuickActions variant="floating" position={pos} />
        );

        const root = container.firstChild as HTMLElement;
        for (const cls of expected) {
          expect(root.className).toContain(cls);
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // 11. CONCURRENT ACTION EXECUTION
  // --------------------------------------------------------------------------

  describe('concurrent execution', () => {
    it('allows different actions to execute concurrently', async () => {
      let resolveFirst: (() => void) | undefined;
      let resolveSecond: (() => void) | undefined;

      // First call hangs, second call also hangs
      mockSendMessage
        .mockImplementationOnce(() => new Promise<void>((r) => { resolveFirst = r; }))
        .mockImplementationOnce(() => new Promise<void>((r) => { resolveSecond = r; }));

      render(<SAMQuickActions />);

      const explainBtn = screen.getByText('Explain This').closest('button')!;
      const summarizeBtn = screen.getByText('Summarize').closest('button')!;

      // Start first action
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      expect(explainBtn).toBeDisabled();
      expect(summarizeBtn).not.toBeDisabled();

      // Start second action
      await act(async () => {
        fireEvent.click(summarizeBtn);
      });

      expect(summarizeBtn).toBeDisabled();

      // Resolve both
      await act(async () => {
        resolveFirst?.();
        resolveSecond?.();
      });

      expect(explainBtn).not.toBeDisabled();
      expect(summarizeBtn).not.toBeDisabled();
    });

    it('does not allow the same action to execute twice concurrently', async () => {
      let resolveMsg: (() => void) | undefined;
      mockSendMessage.mockImplementation(
        () => new Promise<void>((r) => { resolveMsg = r; })
      );

      render(<SAMQuickActions />);

      const explainBtn = screen.getByText('Explain This').closest('button')!;

      // Start first execution
      await act(async () => {
        fireEvent.click(explainBtn);
      });

      // Try to click again - button should be disabled
      expect(explainBtn).toBeDisabled();

      // sendMessage should only have been called once
      expect(mockSendMessage).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolveMsg?.();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 12. DEFAULT PROPS
  // --------------------------------------------------------------------------

  describe('default props', () => {
    it('defaults to inline variant', () => {
      const { container } = render(<SAMQuickActions />);

      // Inline variant has a rounded-xl border bg-card wrapper
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('rounded-xl');
      expect(root.className).toContain('bg-card');
    });

    it('defaults to bottom-right position for floating variant', () => {
      const { container } = render(<SAMQuickActions variant="floating" />);

      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('bottom-4');
      expect(root.className).toContain('right-4');
    });

    it('defaults showCategories to false', () => {
      render(<SAMQuickActions />);

      // No category badges should appear in default mode
      const badges = screen.queryAllByTestId('badge');
      expect(badges.length).toBe(0);
    });
  });
});

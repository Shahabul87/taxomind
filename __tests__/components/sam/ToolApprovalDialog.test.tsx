import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

// Mock framer-motion (already globally mocked in jest.setup.js, but override
// locally to ensure motion-specific props are stripped cleanly)
jest.mock('framer-motion', () => {
  const ReactActual = require('react');

  const motionHandler: ProxyHandler<Record<string, React.FC>> = {
    get: (_target, prop: string) => {
      if (prop === '__esModule') return true;
      const MotionComp = ReactActual.forwardRef(
        (
          {
            children,
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            variants: _variants,
            whileHover: _whileHover,
            whileTap: _whileTap,
            whileInView: _whileInView,
            viewport: _viewport,
            layout: _layout,
            layoutId: _layoutId,
            ...htmlProps
          }: Record<string, unknown> & { children?: React.ReactNode },
          ref: React.Ref<HTMLElement>
        ) => ReactActual.createElement(prop, { ...htmlProps, ref }, children)
      );
      MotionComp.displayName = `motion.${prop}`;
      return MotionComp;
    },
  };

  return {
    motion: new Proxy({} as Record<string, React.FC>, motionHandler),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(ReactActual.Fragment, null, children),
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn() }),
  };
});

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
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
  DialogFooter: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dialog-footer" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
      {...props}
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

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      data-testid="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | boolean | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import {
  ToolApprovalDialog,
  useToolApproval,
} from '@/components/sam/ToolApprovalDialog';
import type {
  ToolApprovalRequest,
  ToolApprovalDialogProps,
} from '@/components/sam/ToolApprovalDialog';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockRequest(
  overrides: Partial<ToolApprovalRequest> = {}
): ToolApprovalRequest {
  return {
    id: 'req-1',
    toolId: 'tool-blooms-analysis',
    toolName: 'Bloom&apos;s Taxonomy Analyzer',
    description: 'Analyzes course content against Bloom&apos;s taxonomy levels',
    category: 'analysis',
    riskLevel: 'low',
    reason: 'To evaluate the cognitive depth of your study materials',
    parameters: {
      courseId: 'course-123',
      chapterId: 'chapter-456',
      depth: 'comprehensive',
    },
    estimatedDuration: 5000,
    permissions: {
      reads: ['Course content', 'Chapter metadata'],
      writes: ['Analysis results'],
      external: [],
    },
    ...overrides,
  };
}

function createDefaultProps(
  overrides: Partial<ToolApprovalDialogProps> = {}
): ToolApprovalDialogProps {
  return {
    request: createMockRequest(),
    open: true,
    onOpenChange: jest.fn(),
    onApprove: jest.fn(),
    onDeny: jest.fn(),
    isProcessing: false,
    ...overrides,
  };
}

// ============================================================================
// TESTS: ToolApprovalDialog Component
// ============================================================================

describe('ToolApprovalDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering and visibility
  // --------------------------------------------------------------------------

  describe('rendering and visibility', () => {
    it('does not render when open is false', () => {
      const props = createDefaultProps({ open: false });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('does not render when request is null', () => {
      const props = createDefaultProps({ request: null });
      render(<ToolApprovalDialog {...props} />);

      // With request null, the component returns null before reaching Dialog
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('renders the dialog when open is true with a valid request', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Tool information display
  // --------------------------------------------------------------------------

  describe('tool information display', () => {
    it('shows the tool name in the dialog title', () => {
      const props = createDefaultProps({
        request: createMockRequest({ toolName: 'Content Generator' }),
      });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByTestId('dialog-title')).toHaveTextContent(
        'Content Generator'
      );
    });

    it('shows the dialog description text', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByTestId('dialog-description')).toHaveTextContent(
        'SAM wants to use this tool'
      );
    });

    it('shows the tool description', () => {
      const request = createMockRequest({
        description: 'Generates quiz questions from content',
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.getByText('Generates quiz questions from content')
      ).toBeInTheDocument();
    });

    it('shows the reason SAM wants to use the tool', () => {
      const request = createMockRequest({
        reason: 'To help you review chapter material',
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.getByText('To help you review chapter material')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Risk level display
  // --------------------------------------------------------------------------

  describe('risk level display', () => {
    it('shows "Low Risk" badge for low risk tools', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'low' }),
      });
      render(<ToolApprovalDialog {...props} />);

      const badges = screen.getAllByTestId('badge');
      const riskBadge = badges.find((b) =>
        b.textContent?.includes('Low Risk')
      );
      expect(riskBadge).toBeInTheDocument();
    });

    it('shows "Medium Risk" badge for medium risk tools', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'medium' }),
      });
      render(<ToolApprovalDialog {...props} />);

      const badges = screen.getAllByTestId('badge');
      const riskBadge = badges.find((b) =>
        b.textContent?.includes('Medium Risk')
      );
      expect(riskBadge).toBeInTheDocument();
    });

    it('shows "High Risk" badge for high risk tools', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'high' }),
      });
      render(<ToolApprovalDialog {...props} />);

      const badges = screen.getAllByTestId('badge');
      const riskBadge = badges.find((b) =>
        b.textContent?.includes('High Risk')
      );
      expect(riskBadge).toBeInTheDocument();
    });

    it('shows risk description text for low risk', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'low' }),
      });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.getByText('This action is safe and reversible')
      ).toBeInTheDocument();
    });

    it('shows risk description text for medium risk', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'medium' }),
      });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.getByText('This action may modify data')
      ).toBeInTheDocument();
    });

    it('shows risk description text for high risk', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'high' }),
      });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.getByText('This action requires careful consideration')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Category display
  // --------------------------------------------------------------------------

  describe('category display', () => {
    const categoryLabels: Array<{
      category: ToolApprovalRequest['category'];
      label: string;
    }> = [
      { category: 'content', label: 'Content Generation' },
      { category: 'assessment', label: 'Assessment' },
      { category: 'memory', label: 'Memory & Context' },
      { category: 'communication', label: 'Communication' },
      { category: 'analysis', label: 'Analysis' },
      { category: 'course', label: 'Course Management' },
      { category: 'external', label: 'External Service' },
      { category: 'admin', label: 'Administration' },
    ];

    it.each(categoryLabels)(
      'shows "$label" badge for $category category',
      ({ category, label }) => {
        const props = createDefaultProps({
          request: createMockRequest({ category }),
        });
        render(<ToolApprovalDialog {...props} />);

        const badges = screen.getAllByTestId('badge');
        const categoryBadge = badges.find((b) =>
          b.textContent?.includes(label)
        );
        expect(categoryBadge).toBeDefined();
      }
    );
  });

  // --------------------------------------------------------------------------
  // Permissions display
  // --------------------------------------------------------------------------

  describe('permissions display', () => {
    it('shows read permissions', () => {
      const request = createMockRequest({
        permissions: {
          reads: ['User profile', 'Course data'],
          writes: [],
          external: [],
        },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Will Read')).toBeInTheDocument();
      expect(screen.getByText('User profile')).toBeInTheDocument();
      expect(screen.getByText('Course data')).toBeInTheDocument();
    });

    it('shows write permissions', () => {
      const request = createMockRequest({
        permissions: {
          reads: [],
          writes: ['Study plan', 'Progress data'],
          external: [],
        },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Will Modify')).toBeInTheDocument();
      expect(screen.getByText('Study plan')).toBeInTheDocument();
      expect(screen.getByText('Progress data')).toBeInTheDocument();
    });

    it('shows external access permissions', () => {
      const request = createMockRequest({
        permissions: {
          reads: [],
          writes: [],
          external: ['OpenAI API', 'Web search'],
        },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('External Access')).toBeInTheDocument();
      expect(screen.getByText('OpenAI API')).toBeInTheDocument();
      expect(screen.getByText('Web search')).toBeInTheDocument();
    });

    it('does not show permissions section when all permission arrays are empty', () => {
      const request = createMockRequest({
        permissions: {
          reads: [],
          writes: [],
          external: [],
        },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.queryByText('Permissions Required')).not.toBeInTheDocument();
      expect(screen.queryByText('Will Read')).not.toBeInTheDocument();
      expect(screen.queryByText('Will Modify')).not.toBeInTheDocument();
      expect(screen.queryByText('External Access')).not.toBeInTheDocument();
    });

    it('shows "Permissions Required" heading when at least one permission exists', () => {
      const request = createMockRequest({
        permissions: {
          reads: ['Some data'],
          writes: [],
          external: [],
        },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Permissions Required')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Parameters preview
  // --------------------------------------------------------------------------

  describe('parameters preview', () => {
    it('shows "Execution Parameters" heading when parameters exist', () => {
      const request = createMockRequest({
        parameters: { courseId: 'c-1', mode: 'full' },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Execution Parameters')).toBeInTheDocument();
    });

    it('shows parameter count', () => {
      const request = createMockRequest({
        parameters: { a: '1', b: '2', c: '3' },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Parameters (3)')).toBeInTheDocument();
    });

    it('does not show parameters section when parameters are empty', () => {
      const request = createMockRequest({ parameters: {} });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.queryByText('Execution Parameters')
      ).not.toBeInTheDocument();
    });

    it('does not show parameters section when parameters are undefined', () => {
      const request = createMockRequest({ parameters: undefined });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.queryByText('Execution Parameters')
      ).not.toBeInTheDocument();
    });

    it('shows parameter keys and string values', () => {
      const request = createMockRequest({
        parameters: { courseId: 'course-abc' },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('courseId:')).toBeInTheDocument();
      expect(screen.getByText('course-abc')).toBeInTheDocument();
    });

    it('shows JSON-stringified non-string values', () => {
      const request = createMockRequest({
        parameters: { count: 42 },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('count:')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('truncates long string values at 100 characters', () => {
      const longValue = 'x'.repeat(150);
      const request = createMockRequest({
        parameters: { content: longValue },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      // Should truncate to first 100 chars + "..."
      const truncated = `${'x'.repeat(100)}...`;
      expect(screen.getByText(truncated)).toBeInTheDocument();
    });

    it('shows expand/collapse toggle for parameters with more than 3 entries', () => {
      const request = createMockRequest({
        parameters: { a: '1', b: '2', c: '3', d: '4', e: '5' },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Parameters (5)')).toBeInTheDocument();
    });

    it('shows "+N more parameters" text when collapsed with more than 3 params', () => {
      const request = createMockRequest({
        parameters: { a: '1', b: '2', c: '3', d: '4', e: '5' },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      // The ParametersPreview starts collapsed when there are >3 entries.
      // When collapsed and entries.length > 3, the content is NOT shown
      // (only shown when expanded OR entries.length <= 3).
      // Need to click to expand first.
      const toggleButton = screen.getByText('Parameters (5)');
      fireEvent.click(toggleButton);

      // After expanding, all 5 parameters should be visible
      expect(screen.getByText('a:')).toBeInTheDocument();
      expect(screen.getByText('e:')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Estimated duration
  // --------------------------------------------------------------------------

  describe('estimated duration', () => {
    it('shows estimated time in milliseconds for short durations', () => {
      const request = createMockRequest({ estimatedDuration: 500 });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Estimated time: 500ms')).toBeInTheDocument();
    });

    it('shows estimated time in seconds for medium durations', () => {
      const request = createMockRequest({ estimatedDuration: 5000 });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Estimated time: 5s')).toBeInTheDocument();
    });

    it('shows estimated time in minutes for long durations', () => {
      const request = createMockRequest({ estimatedDuration: 120000 });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Estimated time: 2m')).toBeInTheDocument();
    });

    it('does not show estimated time when estimatedDuration is not provided', () => {
      const request = createMockRequest({ estimatedDuration: undefined });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.queryByText(/Estimated time/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Action buttons
  // --------------------------------------------------------------------------

  describe('action buttons', () => {
    it('renders Approve and Deny buttons', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      expect(
        screen.getByRole('button', { name: /approve/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /deny/i })
      ).toBeInTheDocument();
    });

    it('Approve button is not disabled by default', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton).not.toBeDisabled();
    });

    it('Deny button is not disabled by default', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      const denyButton = screen.getByRole('button', { name: /deny/i });
      expect(denyButton).not.toBeDisabled();
    });

    it('calls onApprove with request id and rememberChoice=false when Approve is clicked', () => {
      const onApprove = jest.fn();
      const request = createMockRequest({ id: 'req-42' });
      const props = createDefaultProps({ request, onApprove });
      render(<ToolApprovalDialog {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /approve/i }));

      expect(onApprove).toHaveBeenCalledTimes(1);
      expect(onApprove).toHaveBeenCalledWith('req-42', false);
    });

    it('calls onDeny with request id when Deny is clicked', () => {
      const onDeny = jest.fn();
      const request = createMockRequest({ id: 'req-99' });
      const props = createDefaultProps({ request, onDeny });
      render(<ToolApprovalDialog {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /deny/i }));

      expect(onDeny).toHaveBeenCalledTimes(1);
      expect(onDeny).toHaveBeenCalledWith('req-99');
    });

    it('disables both buttons when isProcessing is true', () => {
      const props = createDefaultProps({ isProcessing: true });
      render(<ToolApprovalDialog {...props} />);

      // When processing, approve button shows "Processing..." text
      const processingButton = screen.getByRole('button', {
        name: /processing/i,
      });
      expect(processingButton).toBeDisabled();

      const denyButton = screen.getByRole('button', { name: /deny/i });
      expect(denyButton).toBeDisabled();
    });

    it('shows "Processing..." text when isProcessing is true', () => {
      const props = createDefaultProps({ isProcessing: true });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('uses amber approve button color for high risk tools', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'high' }),
      });
      render(<ToolApprovalDialog {...props} />);

      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton.className).toContain('bg-amber-600');
    });

    it('uses blue approve button color for non-high risk tools', () => {
      const props = createDefaultProps({
        request: createMockRequest({ riskLevel: 'low' }),
      });
      render(<ToolApprovalDialog {...props} />);

      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton.className).toContain('bg-blue-600');
    });
  });

  // --------------------------------------------------------------------------
  // Remember choice (auto-approve) checkbox
  // --------------------------------------------------------------------------

  describe('remember choice checkbox', () => {
    it('renders the "Always allow this tool" checkbox', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
      expect(
        screen.getByText(/always allow this tool/i)
      ).toBeInTheDocument();
    });

    it('checkbox is unchecked by default', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      const checkbox = screen.getByTestId('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('calls onApprove with rememberChoice=true when checkbox is checked before approving', () => {
      const onApprove = jest.fn();
      const request = createMockRequest({ id: 'req-remember' });
      const props = createDefaultProps({ request, onApprove });
      render(<ToolApprovalDialog {...props} />);

      // Check the "always allow" checkbox
      const checkbox = screen.getByTestId('checkbox');
      fireEvent.click(checkbox);

      // Click approve
      fireEvent.click(screen.getByRole('button', { name: /approve/i }));

      expect(onApprove).toHaveBeenCalledWith('req-remember', true);
    });

    it('checkbox label is associated with the checkbox via htmlFor', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      const label = screen.getByText(/always allow this tool/i);
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'remember-choice');
    });
  });

  // --------------------------------------------------------------------------
  // State reset on new request
  // --------------------------------------------------------------------------

  describe('state reset behavior', () => {
    it('resets rememberChoice when dialog opens with a new request', () => {
      const onApprove = jest.fn();
      const request1 = createMockRequest({ id: 'req-1' });
      const props = createDefaultProps({ request: request1, onApprove });

      const { rerender } = render(<ToolApprovalDialog {...props} />);

      // Check the remember choice checkbox
      fireEvent.click(screen.getByTestId('checkbox'));

      // Close and reopen with a new request
      rerender(<ToolApprovalDialog {...props} open={false} />);
      const request2 = createMockRequest({ id: 'req-2' });
      rerender(
        <ToolApprovalDialog
          {...props}
          request={request2}
          open={true}
        />
      );

      // Checkbox should be reset to unchecked
      const checkbox = screen.getByTestId('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Mixed permission types
  // --------------------------------------------------------------------------

  describe('mixed permission types', () => {
    it('renders all three permission types simultaneously', () => {
      const request = createMockRequest({
        permissions: {
          reads: ['User data'],
          writes: ['Analysis results'],
          external: ['Third-party API'],
        },
      });
      const props = createDefaultProps({ request });
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByText('Will Read')).toBeInTheDocument();
      expect(screen.getByText('Will Modify')).toBeInTheDocument();
      expect(screen.getByText('External Access')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Dialog footer structure
  // --------------------------------------------------------------------------

  describe('footer structure', () => {
    it('renders the dialog footer', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
    });

    it('has Deny button with outline variant', () => {
      const props = createDefaultProps();
      render(<ToolApprovalDialog {...props} />);

      const denyButton = screen.getByRole('button', { name: /deny/i });
      expect(denyButton).toHaveAttribute('data-variant', 'outline');
    });
  });
});

// ============================================================================
// TESTS: useToolApproval Hook
// ============================================================================

describe('useToolApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // Initial state
  // --------------------------------------------------------------------------

  describe('initial state', () => {
    it('has no pending request initially', () => {
      const { result } = renderHook(() => useToolApproval());

      expect(result.current.pendingRequest).toBeNull();
    });

    it('dialog is not open initially', () => {
      const { result } = renderHook(() => useToolApproval());

      expect(result.current.isOpen).toBe(false);
    });

    it('is not processing initially', () => {
      const { result } = renderHook(() => useToolApproval());

      expect(result.current.isProcessing).toBe(false);
    });

    it('has empty auto-approved tools by default', () => {
      const { result } = renderHook(() => useToolApproval());

      expect(result.current.autoApprovedTools).toEqual([]);
    });

    it('initializes with provided auto-approve tools', () => {
      const { result } = renderHook(() =>
        useToolApproval({ autoApproveTools: ['tool-a', 'tool-b'] })
      );

      expect(result.current.autoApprovedTools).toContain('tool-a');
      expect(result.current.autoApprovedTools).toContain('tool-b');
    });
  });

  // --------------------------------------------------------------------------
  // requestApproval
  // --------------------------------------------------------------------------

  describe('requestApproval', () => {
    it('sets pending request and opens dialog', async () => {
      const { result } = renderHook(() => useToolApproval());
      const request = createMockRequest();

      // Start the approval request (do not await, it waits for user action)
      act(() => {
        result.current.requestApproval(request);
      });

      expect(result.current.pendingRequest).not.toBeNull();
      expect(result.current.isOpen).toBe(true);
    });

    it('auto-approves tools that are in the autoApproveTools list', async () => {
      const onApproved = jest.fn();
      const { result } = renderHook(() =>
        useToolApproval({
          autoApproveTools: ['tool-blooms-analysis'],
          onApproved,
        })
      );

      const request = createMockRequest({ toolId: 'tool-blooms-analysis' });

      let approvalResult: boolean | undefined;
      await act(async () => {
        approvalResult = await result.current.requestApproval(request);
      });

      expect(approvalResult).toBe(true);
      expect(onApproved).toHaveBeenCalledWith('req-1', 'tool-blooms-analysis');
      // Should not open dialog for auto-approved tools
      expect(result.current.isOpen).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // handleApprove
  // --------------------------------------------------------------------------

  describe('handleApprove', () => {
    it('resolves requestApproval promise with true', async () => {
      const onApproved = jest.fn();
      const { result } = renderHook(() =>
        useToolApproval({ onApproved })
      );

      const request = createMockRequest({ id: 'req-approve-test' });

      let approvalPromise: Promise<boolean>;
      act(() => {
        approvalPromise = result.current.requestApproval(request);
      });

      // Now approve
      act(() => {
        result.current.handleApprove('req-approve-test', false);
      });

      // Advance timers for the setTimeout in handleApprove
      act(() => {
        jest.advanceTimersByTime(600);
      });

      const approved = await approvalPromise!;
      expect(approved).toBe(true);
      expect(onApproved).toHaveBeenCalledWith(
        'req-approve-test',
        'tool-blooms-analysis'
      );
    });

    it('clears pending request after approval', async () => {
      const { result } = renderHook(() => useToolApproval());
      const request = createMockRequest();

      act(() => {
        result.current.requestApproval(request);
      });

      act(() => {
        result.current.handleApprove('req-1', false);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(result.current.pendingRequest).toBeNull();
      expect(result.current.isOpen).toBe(false);
    });

    it('adds tool to auto-approved list when remember=true', async () => {
      const { result } = renderHook(() => useToolApproval());

      const request = createMockRequest({
        toolId: 'tool-remember-me',
      });

      act(() => {
        result.current.requestApproval(request);
      });

      act(() => {
        result.current.handleApprove('req-1', true);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(result.current.autoApprovedTools).toContain('tool-remember-me');
    });

    it('does not add tool to auto-approved list when remember=false', async () => {
      const { result } = renderHook(() => useToolApproval());

      const request = createMockRequest({
        toolId: 'tool-dont-remember',
      });

      act(() => {
        result.current.requestApproval(request);
      });

      act(() => {
        result.current.handleApprove('req-1', false);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(result.current.autoApprovedTools).not.toContain(
        'tool-dont-remember'
      );
    });

    it('sets isProcessing to true briefly during approval', () => {
      const { result } = renderHook(() => useToolApproval());
      const request = createMockRequest();

      act(() => {
        result.current.requestApproval(request);
      });

      act(() => {
        result.current.handleApprove('req-1', false);
      });

      // isProcessing should be true before the timeout
      expect(result.current.isProcessing).toBe(true);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should be false after the timeout
      expect(result.current.isProcessing).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // handleDeny
  // --------------------------------------------------------------------------

  describe('handleDeny', () => {
    it('resolves requestApproval promise with false', async () => {
      const onDenied = jest.fn();
      const { result } = renderHook(() =>
        useToolApproval({ onDenied })
      );

      const request = createMockRequest({ id: 'req-deny-test' });

      let approvalPromise: Promise<boolean>;
      act(() => {
        approvalPromise = result.current.requestApproval(request);
      });

      act(() => {
        result.current.handleDeny('req-deny-test');
      });

      const approved = await approvalPromise!;
      expect(approved).toBe(false);
      expect(onDenied).toHaveBeenCalledWith(
        'req-deny-test',
        'tool-blooms-analysis'
      );
    });

    it('clears pending request after denial', async () => {
      const { result } = renderHook(() => useToolApproval());
      const request = createMockRequest();

      act(() => {
        result.current.requestApproval(request);
      });

      act(() => {
        result.current.handleDeny('req-1');
      });

      expect(result.current.pendingRequest).toBeNull();
      expect(result.current.isOpen).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Auto-approve tool management
  // --------------------------------------------------------------------------

  describe('auto-approve tool management', () => {
    it('addAutoApprovedTool adds a tool to the list', () => {
      const { result } = renderHook(() => useToolApproval());

      act(() => {
        result.current.addAutoApprovedTool('new-tool');
      });

      expect(result.current.autoApprovedTools).toContain('new-tool');
    });

    it('removeAutoApprovedTool removes a tool from the list', () => {
      const { result } = renderHook(() =>
        useToolApproval({ autoApproveTools: ['tool-to-remove'] })
      );

      expect(result.current.autoApprovedTools).toContain('tool-to-remove');

      act(() => {
        result.current.removeAutoApprovedTool('tool-to-remove');
      });

      expect(result.current.autoApprovedTools).not.toContain('tool-to-remove');
    });

    it('removeAutoApprovedTool is safe when tool is not in the list', () => {
      const { result } = renderHook(() => useToolApproval());

      act(() => {
        result.current.removeAutoApprovedTool('nonexistent');
      });

      expect(result.current.autoApprovedTools).toEqual([]);
    });

    it('adding duplicate tool does not create duplicates', () => {
      const { result } = renderHook(() =>
        useToolApproval({ autoApproveTools: ['tool-a'] })
      );

      act(() => {
        result.current.addAutoApprovedTool('tool-a');
      });

      const count = result.current.autoApprovedTools.filter(
        (t) => t === 'tool-a'
      ).length;
      expect(count).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // setIsOpen
  // --------------------------------------------------------------------------

  describe('setIsOpen', () => {
    it('allows external control of dialog open state', () => {
      const { result } = renderHook(() => useToolApproval());

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setIsOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Return value shape
  // --------------------------------------------------------------------------

  describe('return value shape', () => {
    it('exposes all expected properties', () => {
      const { result } = renderHook(() => useToolApproval());

      expect(result.current).toHaveProperty('pendingRequest');
      expect(result.current).toHaveProperty('isOpen');
      expect(result.current).toHaveProperty('isProcessing');
      expect(result.current).toHaveProperty('requestApproval');
      expect(result.current).toHaveProperty('handleApprove');
      expect(result.current).toHaveProperty('handleDeny');
      expect(result.current).toHaveProperty('setIsOpen');
      expect(result.current).toHaveProperty('autoApprovedTools');
      expect(result.current).toHaveProperty('addAutoApprovedTool');
      expect(result.current).toHaveProperty('removeAutoApprovedTool');
    });

    it('autoApprovedTools is returned as an Array (not a Set)', () => {
      const { result } = renderHook(() =>
        useToolApproval({ autoApproveTools: ['x'] })
      );

      expect(Array.isArray(result.current.autoApprovedTools)).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: Integration (Component + Hook together)
// ============================================================================

describe('ToolApprovalDialog + useToolApproval integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function IntegrationWrapper() {
    const approval = useToolApproval({
      onApproved: jest.fn(),
      onDenied: jest.fn(),
    });

    return (
      <div>
        <button
          data-testid="trigger-approval"
          onClick={() => {
            approval.requestApproval(createMockRequest({ toolName: 'Integration Test Tool' }));
          }}
        >
          Request Approval
        </button>
        <ToolApprovalDialog
          request={approval.pendingRequest}
          open={approval.isOpen}
          onOpenChange={approval.setIsOpen}
          onApprove={approval.handleApprove}
          onDeny={approval.handleDeny}
          isProcessing={approval.isProcessing}
        />
      </div>
    );
  }

  it('opens dialog when requestApproval is called', () => {
    render(<IntegrationWrapper />);

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('trigger-approval'));

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent(
      'Integration Test Tool'
    );
  });

  it('closes dialog when deny is clicked', () => {
    render(<IntegrationWrapper />);

    fireEvent.click(screen.getByTestId('trigger-approval'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /deny/i }));

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('closes dialog after approve completes', () => {
    render(<IntegrationWrapper />);

    fireEvent.click(screen.getByTestId('trigger-approval'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    // Dialog should still be open during processing
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    // Advance past the 500ms timeout
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });
});

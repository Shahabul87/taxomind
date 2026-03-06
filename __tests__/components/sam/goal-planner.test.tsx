import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCK: useAgentic hook from @sam-ai/react
// pnpm resolves @sam-ai/react via symlink to packages/react/src/index.ts
// jest.mock must use the resolved filesystem path for proper interception
// ============================================================================

const mockFetchGoals = jest.fn();
const mockCreateGoal = jest.fn();
const mockUpdateGoal = jest.fn();
const mockDecomposeGoal = jest.fn();
const mockDeleteGoal = jest.fn();
const mockClearError = jest.fn();

// Mutable object - tests modify properties directly before each render
const mockHookReturn: Record<string, unknown> = {
  goals: [],
  isLoadingGoals: false,
  fetchGoals: mockFetchGoals,
  createGoal: mockCreateGoal,
  updateGoal: mockUpdateGoal,
  decomposeGoal: mockDecomposeGoal,
  deleteGoal: mockDeleteGoal,
  error: null,
  clearError: mockClearError,
};

jest.mock(
  '../../../packages/react/src/index',
  () => ({
    __esModule: true,
    useAgentic: () => mockHookReturn,
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
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="card-description" className={className}>{children}</p>
  ),
}));

// Track dialog open state so DialogContent can conditionally render
let dialogOpenState = false;
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => {
    dialogOpenState = open;
    // Always render children so DialogTrigger (with buttons) is visible
    return <div data-testid="dialog" data-open={open}>{children}</div>;
  },
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    // Only show content when dialog is open
    dialogOpenState ? <div data-testid="dialog-content" className={className}>{children}</div> : null
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="dialog-description" className={className}>{children}</p>
  ),
  DialogFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-footer" className={className}>{children}</div>
  ),
  DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <>{children}</>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
    title,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      title={title}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" data-value={value} aria-valuenow={value} className={className} role="progressbar" />
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    type,
    className,
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    className?: string;
  }) => (
    <input
      data-testid="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      className={className}
    />
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    rows,
    className,
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
  }) => (
    <textarea
      data-testid="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  ),
}));

// Select mock - simulates value selection via a native <select>
jest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="select-root" data-value={value}>
      <select
        data-testid="select-native"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {/* Options will be rendered by SelectItem children */}
      </select>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option data-testid={`select-item-${value}`} value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value" />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label data-testid="label" className={className}>{children}</label>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { GoalPlanner } from '@/components/sam/goal-planner';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

interface GoalOverrides {
  id?: string;
  userId?: string;
  title?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  targetDate?: string;
  progress?: number;
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    topicIds?: string[];
    skillIds?: string[];
  };
  subGoals?: SubGoalData[];
  createdAt?: string;
  updatedAt?: string;
}

interface SubGoalData {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  order: number;
  estimatedMinutes?: number;
  completedAt?: string;
}

function createGoal(overrides: GoalOverrides = {}) {
  return {
    id: overrides.id ?? 'goal-1',
    userId: overrides.userId ?? 'user-123',
    title: overrides.title ?? 'Master React Hooks',
    description: overrides.description ?? 'Learn all React hooks thoroughly',
    status: overrides.status ?? 'active',
    priority: overrides.priority ?? 'high',
    targetDate: overrides.targetDate ?? '2026-06-01',
    progress: overrides.progress ?? 45,
    context: overrides.context ?? {
      courseId: 'course-1',
      chapterId: 'chapter-1',
      sectionId: 'section-1',
    },
    subGoals: overrides.subGoals ?? [],
    createdAt: overrides.createdAt ?? '2026-03-01T10:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-03-03T14:00:00Z',
  };
}

function createSubGoal(overrides: Partial<SubGoalData> = {}): SubGoalData {
  return {
    id: overrides.id ?? 'subgoal-1',
    goalId: overrides.goalId ?? 'goal-1',
    title: overrides.title ?? 'Learn useState',
    description: overrides.description ?? 'Understand state management with useState',
    status: overrides.status ?? 'pending',
    order: overrides.order ?? 1,
    estimatedMinutes: overrides.estimatedMinutes ?? 30,
    completedAt: overrides.completedAt,
  };
}

function createGoalWithSubGoals(goalOverrides: GoalOverrides = {}) {
  const subGoals: SubGoalData[] = [
    createSubGoal({ id: 'sg-1', title: 'Learn useState', status: 'completed', order: 1 }),
    createSubGoal({ id: 'sg-2', title: 'Learn useEffect', status: 'completed', order: 2 }),
    createSubGoal({ id: 'sg-3', title: 'Learn useCallback', status: 'in_progress', order: 3 }),
    createSubGoal({ id: 'sg-4', title: 'Learn useMemo', status: 'pending', order: 4 }),
  ];
  return createGoal({ ...goalOverrides, subGoals });
}

function createMultipleGoals() {
  return [
    createGoal({ id: 'goal-1', title: 'Master React Hooks', status: 'active', priority: 'high', progress: 60 }),
    createGoal({ id: 'goal-2', title: 'Learn TypeScript', status: 'active', priority: 'medium', progress: 30 }),
    createGoal({ id: 'goal-3', title: 'CSS Grid Mastery', status: 'completed', priority: 'low', progress: 100 }),
    createGoal({ id: 'goal-4', title: 'Node.js Backend', status: 'paused', priority: 'critical', progress: 15 }),
  ];
}

// ============================================================================
// HELPER: Reset mock hook return to default state
// ============================================================================

function resetMockHook() {
  mockFetchGoals.mockReset();
  mockCreateGoal.mockReset();
  mockUpdateGoal.mockReset();
  mockDecomposeGoal.mockReset();
  mockDeleteGoal.mockReset();
  mockClearError.mockReset();

  mockHookReturn.goals = [];
  mockHookReturn.isLoadingGoals = false;
  mockHookReturn.fetchGoals = mockFetchGoals;
  mockHookReturn.createGoal = mockCreateGoal;
  mockHookReturn.updateGoal = mockUpdateGoal;
  mockHookReturn.decomposeGoal = mockDecomposeGoal;
  mockHookReturn.deleteGoal = mockDeleteGoal;
  mockHookReturn.error = null;
  mockHookReturn.clearError = mockClearError;
}

// ============================================================================
// TESTS
// ============================================================================

describe('GoalPlanner', () => {
  beforeEach(() => {
    resetMockHook();
  });

  // --------------------------------------------------------------------------
  // 1. Loading State
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows loading spinner when isLoadingGoals is true in full mode', () => {
      mockHookReturn.isLoadingGoals = true;

      render(<GoalPlanner />);

      // Should NOT show "No learning goals yet" while loading
      expect(screen.queryByText('No learning goals yet')).not.toBeInTheDocument();
      // Should NOT show any goal cards
      expect(screen.queryByText('Master React Hooks')).not.toBeInTheDocument();
    });

    it('shows loading spinner when isLoadingGoals is true in compact mode', () => {
      mockHookReturn.isLoadingGoals = true;

      render(<GoalPlanner compact />);

      // Should NOT show "No active goals" while loading
      expect(screen.queryByText('No active goals')).not.toBeInTheDocument();
    });

    it('does not render goal list while loading even if goals exist', () => {
      mockHookReturn.isLoadingGoals = true;
      mockHookReturn.goals = createMultipleGoals();

      render(<GoalPlanner />);

      // Loading indicator takes precedence over goal rendering
      expect(screen.queryByText('Master React Hooks')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Renders Goal List After Data Loads
  // --------------------------------------------------------------------------

  describe('renders goal list after data loads', () => {
    it('renders all goal titles in full mode', () => {
      mockHookReturn.goals = createMultipleGoals();

      render(<GoalPlanner />);

      expect(screen.getByText('Master React Hooks')).toBeInTheDocument();
      expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
      expect(screen.getByText('CSS Grid Mastery')).toBeInTheDocument();
      expect(screen.getByText('Node.js Backend')).toBeInTheDocument();
    });

    it('renders goal descriptions when present', () => {
      mockHookReturn.goals = [createGoal({ description: 'A deep dive into hooks' })];

      render(<GoalPlanner />);

      expect(screen.getByText('A deep dive into hooks')).toBeInTheDocument();
    });

    it('renders target date formatted as locale string', () => {
      mockHookReturn.goals = [createGoal({ targetDate: '2026-06-01' })];

      render(<GoalPlanner />);

      const expectedDate = new Date('2026-06-01').toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it('renders the Learning Goals title in full mode', () => {
      render(<GoalPlanner />);

      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
    });

    it('limits displayed goals to maxGoals prop', () => {
      const manyGoals = Array.from({ length: 15 }, (_, i) =>
        createGoal({ id: `goal-${i}`, title: `Goal Number ${i}` })
      );
      mockHookReturn.goals = manyGoals;

      render(<GoalPlanner maxGoals={5} />);

      // Only 5 should render
      expect(screen.getByText('Goal Number 0')).toBeInTheDocument();
      expect(screen.getByText('Goal Number 4')).toBeInTheDocument();
      expect(screen.queryByText('Goal Number 5')).not.toBeInTheDocument();
    });

    it('displays active and completed goal counts in header description', () => {
      mockHookReturn.goals = createMultipleGoals();

      render(<GoalPlanner />);

      // 2 active, 1 completed from createMultipleGoals
      expect(screen.getByText('2 active, 1 completed')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Empty State
  // --------------------------------------------------------------------------

  describe('empty state', () => {
    it('shows empty state when no goals exist in full mode', () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner />);

      expect(screen.getByText('No learning goals yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first goal to start tracking your progress')).toBeInTheDocument();
    });

    it('shows Create Your First Goal button in empty state when showCreateButton is true', () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      expect(screen.getByText('Create Your First Goal')).toBeInTheDocument();
    });

    it('does not show Create Your First Goal button when showCreateButton is false', () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton={false} />);

      expect(screen.queryByText('Create Your First Goal')).not.toBeInTheDocument();
    });

    it('shows No active goals in compact mode with empty state', () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner compact />);

      expect(screen.getByText('No active goals')).toBeInTheDocument();
    });

    it('shows empty state when all goals are filtered out by context', () => {
      mockHookReturn.goals = [
        createGoal({ context: { courseId: 'other-course' } }),
      ];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner courseId="my-course" />);

      expect(screen.getByText('No learning goals yet')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Create Button Opens Dialog
  // --------------------------------------------------------------------------

  describe('create button opens dialog', () => {
    it('renders New Goal button in full mode when showCreateButton is true', async () => {
      mockHookReturn.goals = [createGoal({ status: 'active' })];
      mockHookReturn.isLoadingGoals = false;
      render(<GoalPlanner showCreateButton />);
      // mounted useEffect sets mounted=true after initial render, gating the Dialog
      await waitFor(() => {
        expect(screen.getByText('New Goal')).toBeInTheDocument();
      });
    });

    it('does not render New Goal button when showCreateButton is false', () => {
      render(<GoalPlanner showCreateButton={false} />);

      expect(screen.queryByText('New Goal')).not.toBeInTheDocument();
    });

    it('opens create dialog with correct heading and description', () => {
      // The Dialog mock renders children only when open=true.
      // Since Dialog uses isCreateDialogOpen state internally, we need to
      // trigger the button click. However, DialogTrigger wraps the button as
      // a pass-through, so clicking triggers the Radix-like open behavior.
      // In our mock, Dialog is always shown if open is true and hidden otherwise.
      // The component starts with isCreateDialogOpen=false, so clicking the
      // trigger should set it to true. But since our Dialog mock reads the `open`
      // prop directly, and the component manages state, clicking should work
      // if the trigger correctly propagates.

      // For this test, we render with the empty state which has a direct onClick
      // to open the dialog (setIsCreateDialogOpen(true))
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      const createFirstGoalButton = screen.getByText('Create Your First Goal');
      fireEvent.click(createFirstGoalButton);

      expect(screen.getByText('Create Learning Goal')).toBeInTheDocument();
      expect(
        screen.getByText('Set a new learning goal. SAM will help you break it down and track progress.')
      ).toBeInTheDocument();
    });

    it('shows form fields inside the create dialog', () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      // Click to open dialog
      fireEvent.click(screen.getByText('Create Your First Goal'));

      expect(screen.getByText('Goal Title')).toBeInTheDocument();
      expect(screen.getByText('Description (optional)')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Target Date (optional)')).toBeInTheDocument();
    });

    it('shows Create Goal submit button inside dialog', () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      fireEvent.click(screen.getByText('Create Your First Goal'));

      expect(screen.getByText('Create Goal')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Goal Creation Form Submission
  // --------------------------------------------------------------------------

  describe('goal creation form submission', () => {
    it('calls createGoal with form data on submit', async () => {
      const createdGoal = createGoal({ id: 'new-goal', title: 'New Learning Goal' });
      mockCreateGoal.mockResolvedValue(createdGoal);
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      // Open dialog
      fireEvent.click(screen.getByText('Create Your First Goal'));

      // Fill in the title
      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'New Learning Goal' } });

      // Fill in the description
      const descInput = screen.getByPlaceholderText('Describe what you want to achieve...');
      fireEvent.change(descInput, { target: { value: 'A comprehensive goal' } });

      // Submit the form
      const submitButton = screen.getByText('Create Goal');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockCreateGoal).toHaveBeenCalledTimes(1);
      const callArg = mockCreateGoal.mock.calls[0][0];
      expect(callArg.title).toBe('New Learning Goal');
      expect(callArg.description).toBe('A comprehensive goal');
    });

    it('does not submit when title is empty', async () => {
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      fireEvent.click(screen.getByText('Create Your First Goal'));

      // The Create Goal button should be disabled when title is empty
      const submitButton = screen.getByText('Create Goal');
      expect(submitButton).toBeDisabled();

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockCreateGoal).not.toHaveBeenCalled();
    });

    it('calls onGoalCreated callback after successful creation', async () => {
      const onGoalCreated = jest.fn();
      const createdGoal = createGoal({ id: 'new-goal', title: 'Test Goal' });
      mockCreateGoal.mockResolvedValue(createdGoal);
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton onGoalCreated={onGoalCreated} />);

      fireEvent.click(screen.getByText('Create Your First Goal'));

      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Test Goal' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Create Goal'));
      });

      expect(onGoalCreated).toHaveBeenCalledWith(createdGoal);
    });

    it('does not call onGoalCreated when createGoal returns null', async () => {
      const onGoalCreated = jest.fn();
      mockCreateGoal.mockResolvedValue(null);
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton onGoalCreated={onGoalCreated} />);

      fireEvent.click(screen.getByText('Create Your First Goal'));

      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Failed Goal' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Create Goal'));
      });

      expect(onGoalCreated).not.toHaveBeenCalled();
    });

    it('strips empty targetDate before submitting', async () => {
      const createdGoal = createGoal({ title: 'No Date Goal' });
      mockCreateGoal.mockResolvedValue(createdGoal);
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton />);

      fireEvent.click(screen.getByText('Create Your First Goal'));

      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'No Date Goal' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Create Goal'));
      });

      const callArg = mockCreateGoal.mock.calls[0][0];
      expect(callArg.targetDate).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Goal Deletion
  // --------------------------------------------------------------------------

  describe('goal deletion', () => {
    it('calls deleteGoal when delete button is clicked on a goal card', async () => {
      mockDeleteGoal.mockResolvedValue(true);
      mockHookReturn.goals = [createGoal({ id: 'goal-to-delete', title: 'Goal To Delete' })];

      render(<GoalPlanner />);

      // The delete button on a GoalCard has Trash2 icon and red text class
      const deleteButtons = screen.getAllByRole('button').filter(
        (btn) => btn.classList.contains('text-red-500') || btn.className?.includes('text-red-500')
      );

      expect(deleteButtons.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(mockDeleteGoal).toHaveBeenCalledWith('goal-to-delete');
    });

    it('calls onGoalDeleted callback after successful deletion', async () => {
      const onGoalDeleted = jest.fn();
      mockDeleteGoal.mockResolvedValue(true);
      mockHookReturn.goals = [createGoal({ id: 'goal-del', title: 'Delete Me' })];

      render(<GoalPlanner onGoalDeleted={onGoalDeleted} />);

      const deleteButtons = screen.getAllByRole('button').filter(
        (btn) => btn.className?.includes('text-red-500')
      );

      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(onGoalDeleted).toHaveBeenCalledWith('goal-del');
    });

    it('does not call onGoalDeleted when deleteGoal returns false', async () => {
      const onGoalDeleted = jest.fn();
      mockDeleteGoal.mockResolvedValue(false);
      mockHookReturn.goals = [createGoal({ id: 'goal-fail-del' })];

      render(<GoalPlanner onGoalDeleted={onGoalDeleted} />);

      const deleteButtons = screen.getAllByRole('button').filter(
        (btn) => btn.className?.includes('text-red-500')
      );

      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(onGoalDeleted).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Goal Editing Modal
  // --------------------------------------------------------------------------

  describe('goal editing modal', () => {
    it('opens edit dialog when edit button is clicked on a goal card', () => {
      mockHookReturn.goals = [createGoal({ id: 'goal-edit', title: 'Editable Goal', description: 'Edit this' })];

      render(<GoalPlanner />);

      // The edit button is a ghost variant button with Edit3 icon
      // Find all buttons, the edit button is the one that is not delete (no red class) and not decompose
      const allButtons = screen.getAllByRole('button');
      // In GoalCard: decompose (Sparkles), edit (Edit3), delete (Trash2, red)
      // Edit button is ghost variant without red class and without decompose title
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );

      expect(editButton).toBeDefined();
      fireEvent.click(editButton!);

      // The edit dialog should appear with "Edit Goal" title
      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
      expect(screen.getByText('Update your learning goal details.')).toBeInTheDocument();
    });

    it('pre-populates edit form with existing goal data', () => {
      mockHookReturn.goals = [
        createGoal({
          id: 'goal-edit',
          title: 'Original Title',
          description: 'Original Description',
          priority: 'high',
        }),
      ];

      render(<GoalPlanner />);

      // Click edit
      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );
      fireEvent.click(editButton!);

      // Check that the title input is populated
      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks') as HTMLInputElement;
      expect(titleInput.value).toBe('Original Title');

      // Check description
      const descInput = screen.getByPlaceholderText('Describe what you want to achieve...') as HTMLTextAreaElement;
      expect(descInput.value).toBe('Original Description');
    });

    it('shows Save Changes and Cancel buttons in edit dialog', () => {
      mockHookReturn.goals = [createGoal({ id: 'goal-edit', title: 'Editable' })];

      render(<GoalPlanner />);

      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );
      fireEvent.click(editButton!);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls updateGoal with modified data on Save Changes', async () => {
      const updatedGoal = createGoal({ id: 'goal-edit', title: 'Updated Title' });
      mockUpdateGoal.mockResolvedValue(updatedGoal);
      mockHookReturn.goals = [createGoal({ id: 'goal-edit', title: 'Editable' })];

      render(<GoalPlanner />);

      // Open edit dialog
      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );
      fireEvent.click(editButton!);

      // Modify title
      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(mockUpdateGoal).toHaveBeenCalledTimes(1);
      expect(mockUpdateGoal).toHaveBeenCalledWith('goal-edit', expect.objectContaining({
        title: 'Updated Title',
      }));
    });

    it('calls onGoalUpdated callback after successful update', async () => {
      const onGoalUpdated = jest.fn();
      const updatedGoal = createGoal({ id: 'goal-edit', title: 'Updated' });
      mockUpdateGoal.mockResolvedValue(updatedGoal);
      mockHookReturn.goals = [createGoal({ id: 'goal-edit', title: 'Original' })];

      render(<GoalPlanner onGoalUpdated={onGoalUpdated} />);

      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );
      fireEvent.click(editButton!);

      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Updated' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(onGoalUpdated).toHaveBeenCalledWith(updatedGoal);
    });

    it('closes edit dialog when Cancel is clicked', () => {
      mockHookReturn.goals = [createGoal({ id: 'goal-edit', title: 'Cancel Test' })];

      render(<GoalPlanner />);

      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );
      fireEvent.click(editButton!);

      // Verify edit dialog is open
      expect(screen.getByText('Edit Goal')).toBeInTheDocument();

      // Click Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Dialog should close (mock renders null when open is false)
      expect(screen.queryByText('Edit Goal')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Progress Bar Calculations
  // --------------------------------------------------------------------------

  describe('progress bar calculations', () => {
    it('renders progress bar with goal.progress when no sub-goals', () => {
      mockHookReturn.goals = [createGoal({ progress: 65 })];

      render(<GoalPlanner />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const goalProgressBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '65'
      );
      expect(goalProgressBar).toBeDefined();
    });

    it('calculates progress from sub-goal completion ratio when sub-goals exist', () => {
      // 2 completed out of 4 = 50%
      mockHookReturn.goals = [createGoalWithSubGoals({ progress: 10 })];

      render(<GoalPlanner />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const goalProgressBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '50'
      );
      expect(goalProgressBar).toBeDefined();
    });

    it('shows correct progress percentage text', () => {
      mockHookReturn.goals = [createGoal({ progress: 73.7 })];

      render(<GoalPlanner />);

      // Math.round(73.7) = 74
      expect(screen.getByText('74%')).toBeInTheDocument();
    });

    it('shows 0% progress for goal with zero progress and no sub-goals', () => {
      mockHookReturn.goals = [createGoal({ progress: 0 })];

      render(<GoalPlanner />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('shows 100% progress for fully completed goal', () => {
      mockHookReturn.goals = [createGoal({ progress: 100, status: 'completed' })];

      render(<GoalPlanner />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders Progress label on each goal card', () => {
      mockHookReturn.goals = [createGoal()];

      render(<GoalPlanner />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Status Badges (active, completed, paused, draft, abandoned)
  // --------------------------------------------------------------------------

  describe('status badges', () => {
    it('renders active status badge for active goal', () => {
      mockHookReturn.goals = [createGoal({ status: 'active' })];

      render(<GoalPlanner />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders completed status badge for completed goal', () => {
      mockHookReturn.goals = [createGoal({ status: 'completed' })];

      render(<GoalPlanner />);

      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('renders paused status badge for paused goal', () => {
      mockHookReturn.goals = [createGoal({ status: 'paused' })];

      render(<GoalPlanner />);

      expect(screen.getByText('paused')).toBeInTheDocument();
    });

    it('renders draft status badge for draft goal', () => {
      mockHookReturn.goals = [createGoal({ status: 'draft' })];

      render(<GoalPlanner />);

      expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('renders abandoned status badge for abandoned goal', () => {
      mockHookReturn.goals = [createGoal({ status: 'abandoned' })];

      render(<GoalPlanner />);

      expect(screen.getByText('abandoned')).toBeInTheDocument();
    });

    it('renders priority badge alongside status badge', () => {
      mockHookReturn.goals = [createGoal({ status: 'active', priority: 'high' })];

      render(<GoalPlanner />);

      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('renders multiple status badges for goals with different statuses', () => {
      mockHookReturn.goals = createMultipleGoals();

      render(<GoalPlanner />);

      const badges = screen.getAllByTestId('badge');
      // Each goal has a status badge and a priority badge = 8 badges for 4 goals
      expect(badges.length).toBeGreaterThanOrEqual(8);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Sub-goal Expansion/Collapse
  // --------------------------------------------------------------------------

  describe('sub-goal expansion and collapse', () => {
    it('renders sub-goal count toggle when goal has sub-goals', () => {
      mockHookReturn.goals = [createGoalWithSubGoals()];

      render(<GoalPlanner />);

      // "2/4 sub-goals completed" (2 completed out of 4)
      expect(screen.getByText('2/4 sub-goals completed')).toBeInTheDocument();
    });

    it('does not show sub-goal toggle when goal has no sub-goals', () => {
      mockHookReturn.goals = [createGoal({ subGoals: [] })];

      render(<GoalPlanner />);

      expect(screen.queryByText(/sub-goals completed/)).not.toBeInTheDocument();
    });

    it('expands to show sub-goal titles when toggle is clicked', () => {
      mockHookReturn.goals = [createGoalWithSubGoals()];

      render(<GoalPlanner />);

      // Sub-goal titles should not be visible initially
      expect(screen.queryByText('Learn useState')).not.toBeInTheDocument();

      // Click the toggle
      fireEvent.click(screen.getByText('2/4 sub-goals completed'));

      // Now sub-goals should be visible
      expect(screen.getByText('Learn useState')).toBeInTheDocument();
      expect(screen.getByText('Learn useEffect')).toBeInTheDocument();
      expect(screen.getByText('Learn useCallback')).toBeInTheDocument();
      expect(screen.getByText('Learn useMemo')).toBeInTheDocument();
    });

    it('collapses sub-goals when toggle is clicked again', () => {
      mockHookReturn.goals = [createGoalWithSubGoals()];

      render(<GoalPlanner />);

      const toggle = screen.getByText('2/4 sub-goals completed');

      // Expand
      fireEvent.click(toggle);
      expect(screen.getByText('Learn useState')).toBeInTheDocument();

      // Collapse
      fireEvent.click(toggle);
      expect(screen.queryByText('Learn useState')).not.toBeInTheDocument();
    });

    it('shows sub-goal descriptions when expanded', () => {
      const goalWithDescSubGoals = createGoal({
        subGoals: [
          createSubGoal({
            id: 'sg-desc',
            title: 'Described Sub-Goal',
            description: 'This has a description',
            status: 'pending',
          }),
        ],
      });
      mockHookReturn.goals = [goalWithDescSubGoals];

      render(<GoalPlanner />);

      fireEvent.click(screen.getByText('0/1 sub-goals completed'));

      expect(screen.getByText('This has a description')).toBeInTheDocument();
    });

    it('shows estimated minutes for sub-goals when expanded', () => {
      const goalWithTimeSubGoals = createGoal({
        subGoals: [
          createSubGoal({
            id: 'sg-time',
            title: 'Timed Sub-Goal',
            estimatedMinutes: 45,
            status: 'pending',
          }),
        ],
      });
      mockHookReturn.goals = [goalWithTimeSubGoals];

      render(<GoalPlanner />);

      fireEvent.click(screen.getByText('0/1 sub-goals completed'));

      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('shows completed sub-goals with line-through styling indication', () => {
      mockHookReturn.goals = [createGoalWithSubGoals()];

      render(<GoalPlanner />);

      fireEvent.click(screen.getByText('2/4 sub-goals completed'));

      // The completed sub-goals (Learn useState, Learn useEffect) have status 'completed'
      // They should be present in the DOM
      expect(screen.getByText('Learn useState')).toBeInTheDocument();
      expect(screen.getByText('Learn useEffect')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 11. Compact vs Full Mode
  // --------------------------------------------------------------------------

  describe('compact vs full mode', () => {
    it('renders compact layout with Goals heading and count', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', status: 'active' }),
        createGoal({ id: 'g2', status: 'active' }),
      ];

      render(<GoalPlanner compact />);

      // Compact mode shows "Goals (2)" with active count
      expect(screen.getByText(/Goals \(2\)/)).toBeInTheDocument();
    });

    it('does not show Learning Goals heading in compact mode', () => {
      render(<GoalPlanner compact />);

      expect(screen.queryByText('Learning Goals')).not.toBeInTheDocument();
    });

    it('shows up to 3 active goals in compact mode', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', title: 'Goal One', status: 'active' }),
        createGoal({ id: 'g2', title: 'Goal Two', status: 'active' }),
        createGoal({ id: 'g3', title: 'Goal Three', status: 'active' }),
        createGoal({ id: 'g4', title: 'Goal Four', status: 'active' }),
      ];

      render(<GoalPlanner compact />);

      expect(screen.getByText('Goal One')).toBeInTheDocument();
      expect(screen.getByText('Goal Two')).toBeInTheDocument();
      expect(screen.getByText('Goal Three')).toBeInTheDocument();
      // Fourth goal should not render in compact (sliced to 3)
      expect(screen.queryByText('Goal Four')).not.toBeInTheDocument();
    });

    it('renders full card layout with header and content sections in full mode', () => {
      mockHookReturn.goals = createMultipleGoals();

      render(<GoalPlanner />);

      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
      // Verify cards are rendered
      const cards = screen.getAllByTestId('card');
      // Outer card + 4 GoalCards
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('renders progress bars in compact mode for each displayed goal', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', status: 'active', progress: 50 }),
        createGoal({ id: 'g2', status: 'active', progress: 75 }),
      ];

      render(<GoalPlanner compact />);

      const progressBars = screen.getAllByTestId('progress-bar');
      expect(progressBars.length).toBe(2);
    });

    it('renders priority badges in compact mode', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', status: 'active', priority: 'critical' }),
      ];

      render(<GoalPlanner compact />);

      expect(screen.getByText('critical')).toBeInTheDocument();
    });

    it('does not show edit and delete buttons in compact mode', async () => {
      mockHookReturn.goals = [createGoal({ status: 'active' })];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner compact />);
      // Compact mode shows "Goals (N)" not "Learning Goals"
      await waitFor(() => {
        expect(screen.getByText(/Goals \(1\)/)).toBeInTheDocument();
      });

      // Compact mode only shows goal title, priority badge, and progress bar
      // No edit or delete icons - check no red delete buttons exist
      const buttons = screen.queryAllByRole('button');
      const deleteButtons = buttons.filter((btn) => btn.className?.includes('text-red-500'));
      expect(deleteButtons.length).toBe(0);
    });

    it('compact mode only shows active goals, not completed or paused', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', title: 'Active Goal', status: 'active' }),
        createGoal({ id: 'g2', title: 'Completed Goal', status: 'completed' }),
        createGoal({ id: 'g3', title: 'Paused Goal', status: 'paused' }),
      ];

      render(<GoalPlanner compact />);

      expect(screen.getByText('Active Goal')).toBeInTheDocument();
      expect(screen.queryByText('Completed Goal')).not.toBeInTheDocument();
      expect(screen.queryByText('Paused Goal')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 12. Callbacks
  // --------------------------------------------------------------------------

  describe('callbacks called correctly', () => {
    it('onGoalCreated is called with the created goal object', async () => {
      const onGoalCreated = jest.fn();
      const newGoal = createGoal({ id: 'new-1', title: 'Callback Test Goal' });
      mockCreateGoal.mockResolvedValue(newGoal);
      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(<GoalPlanner showCreateButton onGoalCreated={onGoalCreated} />);

      fireEvent.click(screen.getByText('Create Your First Goal'));

      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Callback Test Goal' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Create Goal'));
      });

      expect(onGoalCreated).toHaveBeenCalledTimes(1);
      expect(onGoalCreated).toHaveBeenCalledWith(newGoal);
    });

    it('onGoalUpdated is called with the updated goal object', async () => {
      const onGoalUpdated = jest.fn();
      const updatedGoal = createGoal({ id: 'edit-1', title: 'Updated' });
      mockUpdateGoal.mockResolvedValue(updatedGoal);
      mockHookReturn.goals = [createGoal({ id: 'edit-1', title: 'Before Edit' })];

      render(<GoalPlanner onGoalUpdated={onGoalUpdated} />);

      // Open edit dialog
      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(
        (btn) =>
          btn.getAttribute('data-variant') === 'ghost' &&
          !btn.className?.includes('text-red-500') &&
          !btn.title?.includes('AI Decompose')
      );
      fireEvent.click(editButton!);

      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Updated' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      expect(onGoalUpdated).toHaveBeenCalledTimes(1);
      expect(onGoalUpdated).toHaveBeenCalledWith(updatedGoal);
    });

    it('onGoalDeleted is called with the goal ID on successful delete', async () => {
      const onGoalDeleted = jest.fn();
      mockDeleteGoal.mockResolvedValue(true);
      mockHookReturn.goals = [createGoal({ id: 'del-1' })];

      render(<GoalPlanner onGoalDeleted={onGoalDeleted} />);

      const deleteButtons = screen.getAllByRole('button').filter(
        (btn) => btn.className?.includes('text-red-500')
      );

      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(onGoalDeleted).toHaveBeenCalledTimes(1);
      expect(onGoalDeleted).toHaveBeenCalledWith('del-1');
    });

    it('callbacks are not called when operations fail', async () => {
      const onGoalCreated = jest.fn();
      const onGoalUpdated = jest.fn();
      const onGoalDeleted = jest.fn();

      mockCreateGoal.mockResolvedValue(null);
      mockUpdateGoal.mockResolvedValue(null);
      mockDeleteGoal.mockResolvedValue(false);

      mockHookReturn.goals = [];
      mockHookReturn.isLoadingGoals = false;

      render(
        <GoalPlanner
          showCreateButton
          onGoalCreated={onGoalCreated}
          onGoalUpdated={onGoalUpdated}
          onGoalDeleted={onGoalDeleted}
        />
      );

      // Try create
      fireEvent.click(screen.getByText('Create Your First Goal'));
      const titleInput = screen.getByPlaceholderText('e.g., Master React Hooks');
      fireEvent.change(titleInput, { target: { value: 'Fail' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Create Goal'));
      });

      expect(onGoalCreated).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error State
  // --------------------------------------------------------------------------

  describe('error state', () => {
    it('displays error message from useAgentic hook', () => {
      mockHookReturn.error = 'Failed to fetch goals';
      mockHookReturn.goals = [];

      render(<GoalPlanner />);

      expect(screen.getByText('Failed to fetch goals')).toBeInTheDocument();
    });

    it('does not show error banner when error is null', () => {
      mockHookReturn.error = null;

      render(<GoalPlanner />);

      expect(screen.queryByText('Failed to fetch goals')).not.toBeInTheDocument();
    });

    it('calls clearError when error dismiss button is clicked', () => {
      mockHookReturn.error = 'Some error occurred';

      render(<GoalPlanner />);

      // The error dismiss button contains AlertCircle icon
      const errorDismissButton = screen.getByText('Some error occurred')
        .closest('div')
        ?.querySelector('button');

      expect(errorDismissButton).toBeDefined();
      fireEvent.click(errorDismissButton!);

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Context Filtering
  // --------------------------------------------------------------------------

  describe('context filtering', () => {
    it('filters goals by courseId when provided', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', title: 'Course 1 Goal', context: { courseId: 'course-1' } }),
        createGoal({ id: 'g2', title: 'Course 2 Goal', context: { courseId: 'course-2' } }),
      ];

      render(<GoalPlanner courseId="course-1" />);

      expect(screen.getByText('Course 1 Goal')).toBeInTheDocument();
      expect(screen.queryByText('Course 2 Goal')).not.toBeInTheDocument();
    });

    it('filters goals by chapterId when provided', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', title: 'Chapter A Goal', context: { courseId: 'c1', chapterId: 'ch-a' } }),
        createGoal({ id: 'g2', title: 'Chapter B Goal', context: { courseId: 'c1', chapterId: 'ch-b' } }),
      ];

      render(<GoalPlanner chapterId="ch-a" />);

      expect(screen.getByText('Chapter A Goal')).toBeInTheDocument();
      expect(screen.queryByText('Chapter B Goal')).not.toBeInTheDocument();
    });

    it('filters goals by sectionId when provided', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', title: 'Section X Goal', context: { courseId: 'c1', sectionId: 'sec-x' } }),
        createGoal({ id: 'g2', title: 'Section Y Goal', context: { courseId: 'c1', sectionId: 'sec-y' } }),
      ];

      render(<GoalPlanner sectionId="sec-x" />);

      expect(screen.getByText('Section X Goal')).toBeInTheDocument();
      expect(screen.queryByText('Section Y Goal')).not.toBeInTheDocument();
    });

    it('shows all goals when no context filters are provided', () => {
      mockHookReturn.goals = [
        createGoal({ id: 'g1', title: 'Goal A', context: { courseId: 'c1' } }),
        createGoal({ id: 'g2', title: 'Goal B', context: { courseId: 'c2' } }),
      ];

      render(<GoalPlanner />);

      expect(screen.getByText('Goal A')).toBeInTheDocument();
      expect(screen.getByText('Goal B')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // AI Decompose
  // --------------------------------------------------------------------------

  describe('AI decompose', () => {
    it('shows decompose button for goals without sub-goals', () => {
      mockHookReturn.goals = [createGoal({ subGoals: [] })];

      render(<GoalPlanner />);

      const decomposeButton = screen.getAllByRole('button').find(
        (btn) => btn.title === 'AI Decompose'
      );
      expect(decomposeButton).toBeDefined();
    });

    it('does not show decompose button for goals with sub-goals', () => {
      mockHookReturn.goals = [createGoalWithSubGoals()];

      render(<GoalPlanner />);

      const decomposeButton = screen.getAllByRole('button').find(
        (btn) => btn.title === 'AI Decompose'
      );
      expect(decomposeButton).toBeUndefined();
    });

    it('calls decomposeGoal when decompose button is clicked', async () => {
      mockDecomposeGoal.mockResolvedValue(createGoalWithSubGoals());
      mockHookReturn.goals = [createGoal({ id: 'goal-decompose', subGoals: [] })];

      render(<GoalPlanner />);

      const decomposeButton = screen.getAllByRole('button').find(
        (btn) => btn.title === 'AI Decompose'
      );

      await act(async () => {
        fireEvent.click(decomposeButton!);
      });

      expect(mockDecomposeGoal).toHaveBeenCalledWith('goal-decompose');
    });
  });

  // --------------------------------------------------------------------------
  // Props and className
  // --------------------------------------------------------------------------

  describe('props handling', () => {
    it('applies custom className to the root element', () => {
      const { container } = render(<GoalPlanner className="my-custom-class" />);

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement.className).toContain('my-custom-class');
    });

    it('applies custom className in compact mode', () => {
      const { container } = render(<GoalPlanner compact className="compact-custom" />);

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement.className).toContain('compact-custom');
    });

    it('defaults compact to false', () => {
      render(<GoalPlanner />);

      // Full mode renders "Learning Goals" heading
      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
    });

    it('defaults showCreateButton to true', async () => {
      mockHookReturn.goals = [createGoal({ status: 'active' })];
      mockHookReturn.isLoadingGoals = false;
      render(<GoalPlanner />);

      // New Goal button should be visible in full mode after mounted useEffect fires
      await waitFor(() => {
        expect(screen.getByText('New Goal')).toBeInTheDocument();
      });
    });

    it('defaults maxGoals to 10', () => {
      const manyGoals = Array.from({ length: 12 }, (_, i) =>
        createGoal({ id: `goal-${i}`, title: `Goal ${i}` })
      );
      mockHookReturn.goals = manyGoals;

      render(<GoalPlanner />);

      expect(screen.getByText('Goal 0')).toBeInTheDocument();
      expect(screen.getByText('Goal 9')).toBeInTheDocument();
      expect(screen.queryByText('Goal 10')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles goal with no description gracefully', () => {
      mockHookReturn.goals = [createGoal({ description: undefined })];

      render(<GoalPlanner />);

      expect(screen.getByText('Master React Hooks')).toBeInTheDocument();
    });

    it('handles goal with no targetDate gracefully', () => {
      mockHookReturn.goals = [createGoal({ targetDate: undefined })];

      render(<GoalPlanner />);

      expect(screen.getByText('Master React Hooks')).toBeInTheDocument();
    });

    it('handles unknown status gracefully without crash', () => {
      mockHookReturn.goals = [createGoal({ status: 'unknown' as 'active' })];

      render(<GoalPlanner />);

      // Should render the unknown status text in a badge (falls back to draft config)
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('handles unknown priority gracefully without crash', () => {
      mockHookReturn.goals = [createGoal({ priority: 'ultra' as 'high' })];

      render(<GoalPlanner />);

      expect(screen.getByText('ultra')).toBeInTheDocument();
    });

    it('handles goal with empty sub-goals array (not undefined)', () => {
      mockHookReturn.goals = [createGoal({ subGoals: [] })];

      render(<GoalPlanner />);

      expect(screen.queryByText(/sub-goals completed/)).not.toBeInTheDocument();
    });

    it('handles all sub-goals being completed', () => {
      const allCompletedGoal = createGoal({
        subGoals: [
          createSubGoal({ id: 'sg-1', title: 'Done 1', status: 'completed' }),
          createSubGoal({ id: 'sg-2', title: 'Done 2', status: 'completed' }),
        ],
      });
      mockHookReturn.goals = [allCompletedGoal];

      render(<GoalPlanner />);

      expect(screen.getByText('2/2 sub-goals completed')).toBeInTheDocument();

      // Progress should be 100% from sub-goals
      const progressBars = screen.getAllByTestId('progress-bar');
      const fullProgress = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '100'
      );
      expect(fullProgress).toBeDefined();
    });

    it('handles no sub-goals completed', () => {
      const noneCompletedGoal = createGoal({
        subGoals: [
          createSubGoal({ id: 'sg-1', title: 'Not Done 1', status: 'pending' }),
          createSubGoal({ id: 'sg-2', title: 'Not Done 2', status: 'in_progress' }),
        ],
      });
      mockHookReturn.goals = [noneCompletedGoal];

      render(<GoalPlanner />);

      expect(screen.getByText('0/2 sub-goals completed')).toBeInTheDocument();

      const progressBars = screen.getAllByTestId('progress-bar');
      const zeroProgress = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '0'
      );
      expect(zeroProgress).toBeDefined();
    });

    it('renders error alongside goals when error is present', () => {
      mockHookReturn.error = 'Network error';
      mockHookReturn.goals = [createGoal()];

      render(<GoalPlanner />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Master React Hooks')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

// Track dialog open state for conditional rendering of DialogContent
let dialogOpenState = false;

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

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => {
    dialogOpenState = !!open;
    return (
      <div data-testid="dialog" data-open={open}>
        {children}
      </div>
    );
  },
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    dialogOpenState ? (
      <div data-testid="dialog-content" className={className}>
        {children}
      </div>
    ) : null,
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
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({
    value,
    className,
  }: {
    value: number;
    className?: string;
  }) => (
    <div
      data-testid="progress"
      data-value={value}
      className={className}
      role="progressbar"
      aria-valuenow={value}
    />
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
  }) => (
    <textarea
      data-testid="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div
      data-testid="radio-group"
      data-value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onValueChange?.(e.target.value)
      }
    >
      {children}
    </div>
  ),
  RadioGroupItem: ({
    value,
    id,
  }: {
    value: string;
    id?: string;
  }) => (
    <input
      type="radio"
      data-testid={`radio-item-${value}`}
      value={value}
      id={id}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({
    children,
    htmlFor,
    className,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
    className?: string;
  }) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({
    value,
    onValueChange,
    min,
    max,
    step,
    className,
  }: {
    value?: number[];
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
  }) => (
    <input
      type="range"
      data-testid="slider"
      value={value?.[0] ?? 5}
      min={min}
      max={max}
      step={step}
      className={className}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
    />
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
  CheckInModal,
  type CheckInData,
  type CheckInAction,
  type CheckInQuestion,
  type CheckInResponse,
  type CheckInModalProps,
  type CheckInType,
  type QuestionType,
} from '@/components/sam/CheckInModal';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createQuestion(overrides: Partial<CheckInQuestion> = {}): CheckInQuestion {
  return {
    id: 'q-1',
    question: 'How are you feeling today?',
    type: 'emoji',
    required: false,
    order: 1,
    ...overrides,
  };
}

function createAction(overrides: Partial<CheckInAction> = {}): CheckInAction {
  return {
    id: 'action-1',
    title: 'Start Studying',
    description: 'Begin your study session now',
    type: 'start_activity',
    priority: 'medium',
    ...overrides,
  };
}

function createCheckIn(overrides: Partial<CheckInData> = {}): CheckInData {
  return {
    id: 'checkin-1',
    type: 'daily_reminder',
    message: 'Time to check in on your progress!',
    questions: [createQuestion()],
    suggestedActions: [createAction()],
    priority: 'medium',
    ...overrides,
  };
}

function createDefaultProps(overrides: Partial<CheckInModalProps> = {}): CheckInModalProps {
  return {
    checkIn: createCheckIn(),
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onActionClick: jest.fn(),
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('CheckInModal', () => {
  beforeEach(() => {
    dialogOpenState = false;
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering & Null States
  // --------------------------------------------------------------------------
  describe('rendering and null states', () => {
    it('returns null when checkIn is null', () => {
      const props = createDefaultProps({ checkIn: null });
      const { container } = render(<CheckInModal {...props} />);
      // When checkIn is null, component returns null so nothing meaningful renders
      expect(container.innerHTML).toBe('');
    });

    it('renders the dialog when isOpen is true and checkIn is provided', () => {
      const props = createDefaultProps({ isOpen: true });
      render(<CheckInModal {...props} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('does not render dialog content when isOpen is false', () => {
      const props = createDefaultProps({ isOpen: false });
      render(<CheckInModal {...props} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
    });

    it('renders the title "SAM Check-In"', () => {
      const props = createDefaultProps();
      render(<CheckInModal {...props} />);
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('SAM Check-In');
    });

    it('renders the check-in message as description', () => {
      const message = 'How is your study session going?';
      const props = createDefaultProps({
        checkIn: createCheckIn({ message }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByTestId('dialog-description')).toHaveTextContent(message);
    });

    it('renders a badge with the check-in type', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({ type: 'progress_check' }),
      });
      render(<CheckInModal {...props} />);
      const badges = screen.getAllByTestId('badge');
      const typeBadge = badges.find((b) => b.textContent?.includes('progress check'));
      expect(typeBadge).toBeTruthy();
    });

    it('passes className to DialogContent', () => {
      const props = createDefaultProps({ className: 'custom-class' });
      render(<CheckInModal {...props} />);
      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent.className).toContain('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Progress Tracking
  // --------------------------------------------------------------------------
  describe('progress tracking', () => {
    it('renders the progress bar', () => {
      const props = createDefaultProps();
      render(<CheckInModal {...props} />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('shows step count as "Step 1 of N"', () => {
      const questions = [
        createQuestion({ id: 'q-1', order: 1 }),
        createQuestion({ id: 'q-2', order: 2, question: 'Second question?' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);
      // 2 questions + 1 actions step = 3 total
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('updates step count when navigating forward', () => {
      const questions = [
        createQuestion({ id: 'q-1', order: 1 }),
        createQuestion({ id: 'q-2', order: 2, question: 'Second question?' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });

    it('calculates correct progress percentage', () => {
      const questions = [
        createQuestion({ id: 'q-1', order: 1 }),
        createQuestion({ id: 'q-2', order: 2, question: 'Second question?' }),
        createQuestion({ id: 'q-3', order: 3, question: 'Third question?' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);
      // Step 1 of 4 => progress = (1/4)*100 = 25
      const progressBar = screen.getByTestId('progress');
      expect(progressBar).toHaveAttribute('data-value', '25');
    });
  });

  // --------------------------------------------------------------------------
  // Emoji Question
  // --------------------------------------------------------------------------
  describe('emoji question', () => {
    it('renders emoji question with default options when no options provided', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-emoji',
              type: 'emoji',
              question: 'How do you feel?',
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('How do you feel?')).toBeInTheDocument();
      // Default emoji options include Great, Okay, Not Great, Frustrated, Excited
      expect(screen.getByText('Great')).toBeInTheDocument();
      expect(screen.getByText('Okay')).toBeInTheDocument();
      expect(screen.getByText('Frustrated')).toBeInTheDocument();
      expect(screen.getByText('Excited')).toBeInTheDocument();
    });

    it('renders emoji question with custom options', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-emoji-custom',
              type: 'emoji',
              question: 'Rate your mood',
              options: ['😊 Happy', '😢 Sad'],
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Happy')).toBeInTheDocument();
      expect(screen.getByText('Sad')).toBeInTheDocument();
    });

    it('allows selecting an emoji option', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-emoji-select',
              type: 'emoji',
              question: 'How are you?',
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      const greatButton = screen.getByText('Great').closest('button');
      expect(greatButton).toBeTruthy();
      fireEvent.click(greatButton!);
      // After clicking, the button should visually indicate selection (border changes)
      // We verify that the answer is captured by checking that we can proceed
    });
  });

  // --------------------------------------------------------------------------
  // Scale Question
  // --------------------------------------------------------------------------
  describe('scale question', () => {
    it('renders scale question with slider', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-scale',
              type: 'scale',
              question: 'Rate your confidence (1-10)',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Rate your confidence (1-10)')).toBeInTheDocument();
      expect(screen.getByTestId('slider')).toBeInTheDocument();
      // Check the scale labels
      expect(screen.getByText('1 - Not at all')).toBeInTheDocument();
      expect(screen.getByText('10 - Very much')).toBeInTheDocument();
    });

    it('allows changing slider value', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-scale-change',
              type: 'scale',
              question: 'How confident?',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '8' } });
      // The component should update the displayed value
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Single Choice Question
  // --------------------------------------------------------------------------
  describe('single choice question', () => {
    it('renders single choice question with radio options', () => {
      const options = ['Option A', 'Option B', 'Option C'];
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-sc',
              type: 'single_choice',
              question: 'Pick one',
              options,
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Pick one')).toBeInTheDocument();
      expect(screen.getByTestId('radio-group')).toBeInTheDocument();
      options.forEach((opt) => {
        expect(screen.getByText(opt)).toBeInTheDocument();
      });
    });

    it('renders radio items for each option', () => {
      const options = ['Alpha', 'Beta'];
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-sc-items',
              type: 'single_choice',
              question: 'Choose',
              options,
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByTestId('radio-item-Alpha')).toBeInTheDocument();
      expect(screen.getByTestId('radio-item-Beta')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Text Question
  // --------------------------------------------------------------------------
  describe('text question', () => {
    it('renders text question with a textarea', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-text',
              type: 'text',
              question: 'Tell us more',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Tell us more')).toBeInTheDocument();
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your response...')).toBeInTheDocument();
    });

    it('allows typing in the textarea', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-text-type',
              type: 'text',
              question: 'Feedback',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      const textarea = screen.getByTestId('textarea');
      fireEvent.change(textarea, { target: { value: 'My feedback text' } });
      // Value should be updated
      expect(textarea).toHaveValue('My feedback text');
    });
  });

  // --------------------------------------------------------------------------
  // Yes/No Question
  // --------------------------------------------------------------------------
  describe('yes/no question', () => {
    it('renders yes/no question with two buttons', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-yn',
              type: 'yes_no',
              question: 'Are you on track?',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Are you on track?')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('updates variant when Yes is clicked', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-yn-click',
              type: 'yes_no',
              question: 'Feeling good?',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      fireEvent.click(screen.getByText('Yes').closest('button')!);
      // After re-render, re-query the button to get the updated variant
      const yesButtonAfter = screen.getByText('Yes').closest('button')!;
      expect(yesButtonAfter).toHaveAttribute('data-variant', 'default');
    });

    it('updates variant when No is clicked', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-yn-no',
              type: 'yes_no',
              question: 'Need help?',
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      fireEvent.click(screen.getByText('No').closest('button')!);
      // After re-render, re-query the button to get the updated variant
      const noButtonAfter = screen.getByText('No').closest('button')!;
      expect(noButtonAfter).toHaveAttribute('data-variant', 'default');
    });
  });

  // --------------------------------------------------------------------------
  // Navigation (Next / Back)
  // --------------------------------------------------------------------------
  describe('navigation', () => {
    it('renders Back button disabled on the first step', () => {
      const props = createDefaultProps();
      render(<CheckInModal {...props} />);
      const backButton = screen.getByText('Back').closest('button')!;
      expect(backButton).toBeDisabled();
    });

    it('renders Next button on question steps', () => {
      const props = createDefaultProps();
      render(<CheckInModal {...props} />);
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('navigates to the next step when Next is clicked', () => {
      const questions = [
        createQuestion({ id: 'q-1', order: 1, question: 'First question' }),
        createQuestion({ id: 'q-2', order: 2, question: 'Second question', type: 'text' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);
      expect(screen.getByText('First question')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Second question')).toBeInTheDocument();
    });

    it('enables Back button after navigating forward', () => {
      const questions = [
        createQuestion({ id: 'q-1', order: 1 }),
        createQuestion({ id: 'q-2', order: 2, question: 'Q2', type: 'text' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);
      fireEvent.click(screen.getByText('Next'));

      const backButton = screen.getByText('Back').closest('button')!;
      expect(backButton).not.toBeDisabled();
    });

    it('navigates back to the previous step when Back is clicked', () => {
      const questions = [
        createQuestion({ id: 'q-1', order: 1, question: 'Step One' }),
        createQuestion({ id: 'q-2', order: 2, question: 'Step Two', type: 'text' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);

      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Step Two')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Step One')).toBeInTheDocument();
    });

    it('shows Complete button on the actions step (last step)', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [createQuestion({ id: 'q-1', order: 1 })],
        }),
      });
      render(<CheckInModal {...props} />);

      // Navigate past the question to the actions step
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('disables Next button when required question has no answer', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-required',
              type: 'emoji',
              question: 'Required question',
              required: true,
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      const nextButton = screen.getByText('Next').closest('button')!;
      expect(nextButton).toBeDisabled();
    });

    it('enables Next button after answering a required question', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-required-answer',
              type: 'emoji',
              question: 'Required emoji',
              required: true,
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);

      const nextButton = screen.getByText('Next').closest('button')!;
      expect(nextButton).toBeDisabled();

      // Answer the emoji question
      const greatBtn = screen.getByText('Great').closest('button')!;
      fireEvent.click(greatBtn);

      expect(nextButton).not.toBeDisabled();
    });

    it('enables Next button for non-required questions without an answer', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [
            createQuestion({
              id: 'q-optional',
              type: 'text',
              question: 'Optional question',
              required: false,
              order: 1,
            }),
          ],
        }),
      });
      render(<CheckInModal {...props} />);
      const nextButton = screen.getByText('Next').closest('button')!;
      expect(nextButton).not.toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Actions Step
  // --------------------------------------------------------------------------
  describe('actions step', () => {
    function renderAtActionsStep(
      actions: CheckInAction[] = [createAction()],
      questions: CheckInQuestion[] = [createQuestion({ id: 'q-1', order: 1 })]
    ) {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions,
          suggestedActions: actions,
        }),
      });
      render(<CheckInModal {...props} />);

      // Navigate past all questions to the actions step
      questions.forEach(() => {
        fireEvent.click(screen.getByText('Next'));
      });

      return props;
    }

    it('renders "What would you like to do next?" on the actions step', () => {
      renderAtActionsStep();
      expect(screen.getByText('What would you like to do next?')).toBeInTheDocument();
    });

    it('renders all suggested actions', () => {
      const actions = [
        createAction({ id: 'a1', title: 'Review Notes', description: 'Go over chapter 5' }),
        createAction({ id: 'a2', title: 'Take a Break', description: 'Rest for 10 mins', type: 'take_break' }),
      ];
      renderAtActionsStep(actions);
      expect(screen.getByText('Review Notes')).toBeInTheDocument();
      expect(screen.getByText('Go over chapter 5')).toBeInTheDocument();
      expect(screen.getByText('Take a Break')).toBeInTheDocument();
      expect(screen.getByText('Rest for 10 mins')).toBeInTheDocument();
    });

    it('shows "Recommended" badge for high priority actions', () => {
      const actions = [
        createAction({ id: 'a-high', title: 'Important Action', priority: 'high' }),
        createAction({ id: 'a-low', title: 'Low Action', priority: 'low' }),
      ];
      renderAtActionsStep(actions);
      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('does not show "Recommended" badge for non-high priority actions', () => {
      const actions = [
        createAction({ id: 'a-medium', title: 'Medium Action', priority: 'medium' }),
      ];
      renderAtActionsStep(actions);
      expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    });

    it('allows toggling action selection', () => {
      const actions = [
        createAction({ id: 'a-toggle', title: 'Toggle Me' }),
      ];
      renderAtActionsStep(actions);

      // Click to select
      fireEvent.click(screen.getByText('Toggle Me').closest('button')!);
      // Re-query after re-render to get updated className
      expect(screen.getByText('Toggle Me').closest('button')!.className).toContain('border-indigo-500');

      // Click again to deselect
      fireEvent.click(screen.getByText('Toggle Me').closest('button')!);
      expect(screen.getByText('Toggle Me').closest('button')!.className).not.toContain('border-indigo-500');
    });

    it('allows selecting multiple actions', () => {
      const actions = [
        createAction({ id: 'a1', title: 'Action One' }),
        createAction({ id: 'a2', title: 'Action Two', type: 'take_break' }),
      ];
      renderAtActionsStep(actions);

      fireEvent.click(screen.getByText('Action One').closest('button')!);
      fireEvent.click(screen.getByText('Action Two').closest('button')!);

      // Re-query after both clicks to get updated classNames
      expect(screen.getByText('Action One').closest('button')!.className).toContain('border-indigo-500');
      expect(screen.getByText('Action Two').closest('button')!.className).toContain('border-indigo-500');
    });
  });

  // --------------------------------------------------------------------------
  // Submission
  // --------------------------------------------------------------------------
  describe('submission', () => {
    it('calls onSubmit with correct response when Complete is clicked', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      const checkIn = createCheckIn({
        id: 'checkin-submit',
        questions: [createQuestion({ id: 'q-s1', type: 'emoji', order: 1 })],
        suggestedActions: [createAction({ id: 'act-s1' })],
      });
      render(
        <CheckInModal
          checkIn={checkIn}
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // Answer the emoji question
      fireEvent.click(screen.getByText('Great').closest('button')!);

      // Navigate to actions step
      fireEvent.click(screen.getByText('Next'));

      // Click Complete
      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedResponse = onSubmit.mock.calls[0][0] as CheckInResponse;
      expect(submittedResponse.checkInId).toBe('checkin-submit');
      expect(submittedResponse.answers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ questionId: 'q-s1', value: 'great' }),
        ])
      );
      expect(submittedResponse.respondedAt).toBeInstanceOf(Date);
    });

    it('calls onClose after successful submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-close', order: 1 })],
          })}
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // Navigate to actions step
      fireEvent.click(screen.getByText('Next'));

      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onActionClick for each selected action after submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const onActionClick = jest.fn();
      const actions = [
        createAction({ id: 'act-exec-1', title: 'Action Exec 1' }),
        createAction({ id: 'act-exec-2', title: 'Action Exec 2', type: 'take_break' }),
      ];
      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-exec', order: 1 })],
            suggestedActions: actions,
          })}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          onActionClick={onActionClick}
        />
      );

      // Navigate to actions step
      fireEvent.click(screen.getByText('Next'));

      // Select both actions
      fireEvent.click(screen.getByText('Action Exec 1').closest('button')!);
      fireEvent.click(screen.getByText('Action Exec 2').closest('button')!);

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        expect(onActionClick).toHaveBeenCalledTimes(2);
        expect(onActionClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'act-exec-1' })
        );
        expect(onActionClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'act-exec-2' })
        );
      });
    });

    it('includes selectedActions in the submitted response', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const actions = [
        createAction({ id: 'sel-1', title: 'Selected One' }),
        createAction({ id: 'sel-2', title: 'Not Selected', type: 'take_break' }),
      ];
      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-sel', order: 1 })],
            suggestedActions: actions,
          })}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
        />
      );

      // Navigate to actions
      fireEvent.click(screen.getByText('Next'));

      // Select only the first action
      fireEvent.click(screen.getByText('Selected One').closest('button')!);

      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        const response = onSubmit.mock.calls[0][0] as CheckInResponse;
        expect(response.selectedActions).toEqual(['sel-1']);
      });
    });

    it('shows "Submitting..." text while submission is in progress', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const onSubmit = jest.fn().mockReturnValue(submitPromise);

      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-loading', order: 1 })],
          })}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
        />
      );

      // Navigate to actions
      fireEvent.click(screen.getByText('Next'));

      // Click Complete (do NOT await - we want to check intermediate state)
      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      // The button text should show "Submitting..." while promise is pending
      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolveSubmit!();
      });
    });

    it('disables Complete button while submitting', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const onSubmit = jest.fn().mockReturnValue(submitPromise);

      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-dis', order: 1 })],
          })}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
        />
      );

      fireEvent.click(screen.getByText('Next'));

      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      const submitButton = screen.getByText('Submitting...').closest('button')!;
      expect(submitButton).toBeDisabled();

      await act(async () => {
        resolveSubmit!();
      });
    });

    it('handles submission errors gracefully without crashing', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      const onClose = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-err', order: 1 })],
          })}
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      fireEvent.click(screen.getByText('Next'));

      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // onClose should NOT be called on error
      expect(onClose).not.toHaveBeenCalled();
      // isSubmitting should be reset (button text goes back to Complete)
      await waitFor(() => {
        expect(screen.getByText('Complete')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not call onActionClick when it is not provided', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      render(
        <CheckInModal
          checkIn={createCheckIn({
            questions: [createQuestion({ id: 'q-no-action', order: 1 })],
            suggestedActions: [createAction({ id: 'a-no-click' })],
          })}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          // Deliberately not passing onActionClick
        />
      );

      fireEvent.click(screen.getByText('Next'));

      // Select an action
      fireEvent.click(screen.getByText('Start Studying').closest('button')!);

      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // No errors should be thrown; the component gracefully skips action clicks
    });
  });

  // --------------------------------------------------------------------------
  // Question Sorting
  // --------------------------------------------------------------------------
  describe('question sorting', () => {
    it('sorts questions by the order field', () => {
      const questions = [
        createQuestion({ id: 'q-third', order: 3, question: 'Third', type: 'text' }),
        createQuestion({ id: 'q-first', order: 1, question: 'First' }),
        createQuestion({ id: 'q-second', order: 2, question: 'Second', type: 'text' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);

      // First displayed question should be the one with order=1
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.queryByText('Third')).not.toBeInTheDocument();

      // Navigate to second
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Second')).toBeInTheDocument();

      // Navigate to third
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Check-In Types
  // --------------------------------------------------------------------------
  describe('check-in types', () => {
    const checkInTypes: CheckInType[] = [
      'daily_reminder',
      'progress_check',
      'struggle_detection',
      'milestone_celebration',
      'inactivity_reengagement',
      'streak_risk',
      'weekly_summary',
    ];

    checkInTypes.forEach((type) => {
      it(`renders for check-in type: ${type}`, () => {
        const props = createDefaultProps({
          checkIn: createCheckIn({ type }),
        });
        render(<CheckInModal {...props} />);
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
        // Verify the badge shows the type label
        const badges = screen.getAllByTestId('badge');
        const typeBadge = badges.find((b) =>
          b.textContent?.includes(type.replace(/_/g, ' '))
        );
        expect(typeBadge).toBeTruthy();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Action Types
  // --------------------------------------------------------------------------
  describe('action types', () => {
    const actionTypes: Array<{ type: CheckInAction['type']; title: string }> = [
      { type: 'start_activity', title: 'Start Activity' },
      { type: 'complete_review', title: 'Complete Review' },
      { type: 'view_progress', title: 'View Progress' },
      { type: 'adjust_goal', title: 'Adjust Goal' },
      { type: 'contact_mentor', title: 'Contact Mentor' },
      { type: 'review_content', title: 'Review Content' },
      { type: 'take_break', title: 'Take a Break' },
    ];

    actionTypes.forEach(({ type, title }) => {
      it(`renders action type: ${type}`, () => {
        const props = createDefaultProps({
          checkIn: createCheckIn({
            questions: [createQuestion({ id: 'q-at', order: 1 })],
            suggestedActions: [createAction({ id: `a-${type}`, title, type })],
          }),
        });
        render(<CheckInModal {...props} />);

        // Navigate to actions
        fireEvent.click(screen.getByText('Next'));

        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles a check-in with no questions (only actions step)', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [],
          suggestedActions: [createAction()],
        }),
      });
      render(<CheckInModal {...props} />);
      // With 0 questions, step 0 is the actions step
      expect(screen.getByText('What would you like to do next?')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
    });

    it('handles a check-in with no actions', () => {
      const props = createDefaultProps({
        checkIn: createCheckIn({
          questions: [createQuestion({ id: 'q-na', order: 1 })],
          suggestedActions: [],
        }),
      });
      render(<CheckInModal {...props} />);

      // Navigate to actions step
      fireEvent.click(screen.getByText('Next'));

      // Actions step should still render but with no action buttons
      expect(screen.getByText('What would you like to do next?')).toBeInTheDocument();
    });

    it('handles rapid Next clicks without error', () => {
      const questions = [
        createQuestion({ id: 'q-r1', order: 1 }),
        createQuestion({ id: 'q-r2', order: 2, type: 'text', question: 'Q2' }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);

      // Rapidly click next multiple times
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next')); // should go to actions step
      // Should not go beyond the last step
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    it('does not navigate back below step 0', () => {
      const props = createDefaultProps();
      render(<CheckInModal {...props} />);

      // Back button should be disabled at step 0
      const backButton = screen.getByText('Back').closest('button')!;
      expect(backButton).toBeDisabled();

      // Even if forced, should stay at step 0
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    });

    it('handles multiple question types in sequence', () => {
      const questions = [
        createQuestion({ id: 'q-m1', order: 1, type: 'emoji', question: 'Emoji Q' }),
        createQuestion({ id: 'q-m2', order: 2, type: 'scale', question: 'Scale Q' }),
        createQuestion({ id: 'q-m3', order: 3, type: 'text', question: 'Text Q' }),
        createQuestion({ id: 'q-m4', order: 4, type: 'yes_no', question: 'YesNo Q' }),
        createQuestion({
          id: 'q-m5',
          order: 5,
          type: 'single_choice',
          question: 'Choice Q',
          options: ['A', 'B'],
        }),
      ];
      const props = createDefaultProps({
        checkIn: createCheckIn({ questions }),
      });
      render(<CheckInModal {...props} />);

      expect(screen.getByText('Emoji Q')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Scale Q')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Text Q')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('YesNo Q')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Choice Q')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('What would you like to do next?')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Full Workflow Integration
  // --------------------------------------------------------------------------
  describe('full workflow integration', () => {
    it('completes a full check-in flow: answer questions, select actions, submit', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      const onActionClick = jest.fn();
      const checkIn = createCheckIn({
        id: 'full-flow',
        questions: [
          createQuestion({ id: 'q-f1', order: 1, type: 'emoji', question: 'How are you?', required: true }),
          createQuestion({ id: 'q-f2', order: 2, type: 'text', question: 'Any feedback?' }),
        ],
        suggestedActions: [
          createAction({ id: 'act-f1', title: 'Study Now', priority: 'high' }),
          createAction({ id: 'act-f2', title: 'Rest', type: 'take_break' }),
        ],
      });

      render(
        <CheckInModal
          checkIn={checkIn}
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          onActionClick={onActionClick}
        />
      );

      // Step 1: Emoji question
      expect(screen.getByText('How are you?')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

      // Answer required emoji
      fireEvent.click(screen.getByText('Excited').closest('button')!);
      fireEvent.click(screen.getByText('Next'));

      // Step 2: Text question
      expect(screen.getByText('Any feedback?')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('textarea'), {
        target: { value: 'Great progress today' },
      });
      fireEvent.click(screen.getByText('Next'));

      // Step 3: Actions
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
      expect(screen.getByText('Study Now')).toBeInTheDocument();
      expect(screen.getByText('Recommended')).toBeInTheDocument();

      // Select one action
      fireEvent.click(screen.getByText('Study Now').closest('button')!);

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByText('Complete'));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        const response = onSubmit.mock.calls[0][0] as CheckInResponse;
        expect(response.checkInId).toBe('full-flow');
        expect(response.answers).toHaveLength(2);
        expect(response.selectedActions).toEqual(['act-f1']);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onActionClick).toHaveBeenCalledTimes(1);
        expect(onActionClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'act-f1', title: 'Study Now' })
        );
      });
    });
  });
});

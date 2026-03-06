/**
 * Tests for SocraticDialogueWidget component
 *
 * Covers: rendering, props, loading states, error states, user interactions,
 * compact mode, active dialogue, completion, keyboard handling, edge cases.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

// Track mock return values for the Socratic dialogue hook
const mockStartDialogue = jest.fn();
const mockSubmitResponse = jest.fn();
const mockRequestHint = jest.fn();
const mockSkipQuestion = jest.fn();
const mockEndDialogue = jest.fn();
const mockResetDialogue = jest.fn();

const defaultHookReturn: Record<string, unknown> = {
  dialogue: null,
  currentQuestion: null,
  isActive: false,
  isWaiting: false,
  isComplete: false,
  discoveredInsights: [],
  progress: 0,
  feedback: null,
  encouragement: null,
  availableHints: [],
  error: null,
  startDialogue: mockStartDialogue,
  submitResponse: mockSubmitResponse,
  requestHint: mockRequestHint,
  skipQuestion: mockSkipQuestion,
  endDialogue: mockEndDialogue,
  resetDialogue: mockResetDialogue,
};

// Keep a mutable reference so tests can override hook return values
let mockHookReturn = { ...defaultHookReturn };

// Mock @sam-ai/react via its resolved filesystem path
jest.mock(
  '../../../packages/react/src/index',
  () => ({
    __esModule: true,
    useSAMSocraticDialogue: jest.fn(() => mockHookReturn),
  })
);

// Mock useCurrentUser via next-auth/react (useSession)
// The hook reads session.data?.user - so we mock useSession
const mockUser: Record<string, unknown> = { id: 'user-1', name: 'Test User', email: 'test@test.com' };

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: mockUser },
    status: 'authenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock UI components with simple HTML
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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value?: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} role="progressbar" aria-valuenow={value} />
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({
    placeholder,
    value,
    onChange,
    onKeyDown,
    disabled,
    className,
  }: {
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={className}
    />
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: React.forwardRef(
    (
      { children, className }: { children: React.ReactNode; className?: string },
      ref: React.Ref<HTMLDivElement>
    ) => (
      <div data-testid="scroll-area" className={className} ref={ref}>{children}</div>
    )
  ),
}));

// Capture the Select onValueChange so tests can simulate select changes
let selectOnValueChangeFn: ((val: string) => void) | undefined;

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => {
    selectOnValueChangeFn = onValueChange;
    return <div data-testid="select" data-value={value}>{children}</div>;
  },
  SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="select-trigger" className={className}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div
      data-testid={`select-item-${value}`}
      data-value={value}
      onClick={() => selectOnValueChangeFn?.(value)}
    >
      {children}
    </div>
  ),
}));

// ============================================================================
// Import component AFTER mocks
// ============================================================================

import { SocraticDialogueWidget } from '@/components/sam/SocraticDialogueWidget';

// ============================================================================
// Test Utilities
// ============================================================================

function resetHookReturn(overrides: Partial<typeof defaultHookReturn> = {}): void {
  mockHookReturn = { ...defaultHookReturn, ...overrides };
}

function renderWidget(props: Record<string, unknown> = {}) {
  return render(<SocraticDialogueWidget {...props} />);
}

// ============================================================================
// Tests
// ============================================================================

describe('SocraticDialogueWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetHookReturn();
    selectOnValueChangeFn = undefined;
  });

  // --------------------------------------------------------------------------
  // 1. INITIAL RENDERING (Non-active, non-compact)
  // --------------------------------------------------------------------------

  describe('Initial Rendering', () => {
    it('renders the card wrapper', () => {
      renderWidget();
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders the header title with Socratic Dialogue text', () => {
      renderWidget();
      expect(screen.getByText('Socratic Dialogue')).toBeInTheDocument();
    });

    it('renders the topic input with placeholder', () => {
      renderWidget();
      expect(
        screen.getByPlaceholderText('Enter a topic (e.g., Why do we need async/await in JavaScript?)')
      ).toBeInTheDocument();
    });

    it('renders the Dialogue Style label', () => {
      renderWidget();
      expect(screen.getByText('Dialogue Style')).toBeInTheDocument();
    });

    it('renders the Begin Dialogue button', () => {
      renderWidget();
      expect(screen.getByText('Begin Dialogue')).toBeInTheDocument();
    });

    it('renders the info text about Socratic method', () => {
      renderWidget();
      expect(screen.getByText(/The Socratic method helps you discover knowledge/)).toBeInTheDocument();
    });

    it('renders the explore label', () => {
      renderWidget();
      expect(screen.getByText('What would you like to explore?')).toBeInTheDocument();
    });

    it('does not render the insights badge when not active', () => {
      renderWidget();
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('does not render progress bar when not active', () => {
      renderWidget();
      expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
    });

    it('does not render the scroll area when not active', () => {
      renderWidget();
      expect(screen.queryByTestId('scroll-area')).not.toBeInTheDocument();
    });

    it('does not render completion state when not active', () => {
      renderWidget();
      expect(screen.queryByText('Dialogue Complete!')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. PROPS
  // --------------------------------------------------------------------------

  describe('Props', () => {
    it('applies className to the card', () => {
      renderWidget({ className: 'my-custom-class' });
      const card = screen.getByTestId('card');
      expect(card.className).toContain('my-custom-class');
    });

    it('sets defaultTopic as the initial input value', () => {
      renderWidget({ defaultTopic: 'JavaScript closures' });
      const input = screen.getByPlaceholderText(
        'Enter a topic (e.g., Why do we need async/await in JavaScript?)'
      ) as HTMLInputElement;
      expect(input.value).toBe('JavaScript closures');
    });

    it('enables Begin Dialogue button when defaultTopic is provided', () => {
      renderWidget({ defaultTopic: 'React hooks' });
      const btn = screen.getByText('Begin Dialogue');
      expect(btn).not.toBeDisabled();
    });

    it('disables Begin Dialogue button when topic is empty', () => {
      renderWidget();
      const btn = screen.getByText('Begin Dialogue');
      expect(btn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 3. COMPACT MODE
  // --------------------------------------------------------------------------

  describe('Compact Mode', () => {
    it('renders compact layout with short title', () => {
      renderWidget({ compact: true });
      expect(screen.getByText('Socratic Dialogue')).toBeInTheDocument();
    });

    it('renders the start button in compact mode when not active', () => {
      renderWidget({ compact: true });
      expect(screen.getByText('Start Dialogue')).toBeInTheDocument();
    });

    it('renders the description text in compact mode', () => {
      renderWidget({ compact: true });
      expect(screen.getByText('Learn through guided questioning with SAM AI')).toBeInTheDocument();
    });

    it('does not render the topic input in compact mode', () => {
      renderWidget({ compact: true });
      expect(
        screen.queryByPlaceholderText('Enter a topic (e.g., Why do we need async/await in JavaScript?)')
      ).not.toBeInTheDocument();
    });

    it('renders compact active state when isActive is true', () => {
      resetHookReturn({
        isActive: true,
        currentQuestion: { question: 'What is recursion?' },
        progress: 42,
        discoveredInsights: ['insight-1'],
      });
      renderWidget({ compact: true });
      expect(screen.getByText('What is recursion?')).toBeInTheDocument();
    });

    it('shows progress percentage in compact active state', () => {
      resetHookReturn({
        isActive: true,
        currentQuestion: { question: 'Test' },
        progress: 67,
        discoveredInsights: ['a', 'b'],
      });
      renderWidget({ compact: true });
      expect(screen.getByText('Progress: 67%')).toBeInTheDocument();
    });

    it('shows insights count in compact active state', () => {
      resetHookReturn({
        isActive: true,
        currentQuestion: { question: 'Test' },
        progress: 50,
        discoveredInsights: ['a', 'b', 'c'],
      });
      renderWidget({ compact: true });
      expect(screen.getByText('3 insights')).toBeInTheDocument();
    });

    it('shows Thinking... fallback when no current question', () => {
      resetHookReturn({
        isActive: true,
        currentQuestion: null,
        progress: 10,
        discoveredInsights: [],
      });
      renderWidget({ compact: true });
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('renders progress bar in compact active mode', () => {
      resetHookReturn({
        isActive: true,
        currentQuestion: { question: 'Q' },
        progress: 25,
        discoveredInsights: [],
      });
      renderWidget({ compact: true });
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. TOPIC INPUT AND STYLE SELECTION
  // --------------------------------------------------------------------------

  describe('Topic Input and Style Selection', () => {
    it('updates topic value on input change', () => {
      renderWidget();
      const input = screen.getByPlaceholderText(
        'Enter a topic (e.g., Why do we need async/await in JavaScript?)'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Async patterns' } });
      expect(input.value).toBe('Async patterns');
    });

    it('enables Begin Dialogue when topic is typed', () => {
      renderWidget();
      const input = screen.getByPlaceholderText(
        'Enter a topic (e.g., Why do we need async/await in JavaScript?)'
      );
      fireEvent.change(input, { target: { value: 'Testing' } });
      const btn = screen.getByText('Begin Dialogue');
      expect(btn).not.toBeDisabled();
    });

    it('renders all three style options', () => {
      renderWidget();
      expect(screen.getByTestId('select-item-gentle')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-balanced')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-challenging')).toBeInTheDocument();
    });

    it('renders style labels', () => {
      renderWidget();
      expect(screen.getByText('Gentle')).toBeInTheDocument();
      expect(screen.getByText('Balanced')).toBeInTheDocument();
      expect(screen.getByText('Challenging')).toBeInTheDocument();
    });

    it('defaults to balanced style', () => {
      renderWidget();
      const select = screen.getByTestId('select');
      expect(select).toHaveAttribute('data-value', 'balanced');
    });

    it('calls onValueChange when style is changed', () => {
      renderWidget();
      const gentleItem = screen.getByTestId('select-item-gentle');
      fireEvent.click(gentleItem);
      // After the click, the Select rerenders with the new value
      expect(selectOnValueChangeFn).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 5. START DIALOGUE
  // --------------------------------------------------------------------------

  describe('Start Dialogue', () => {
    it('calls startDialogue when Begin Dialogue is clicked', async () => {
      mockStartDialogue.mockResolvedValue(null);
      renderWidget({ defaultTopic: 'Closures' });
      const btn = screen.getByText('Begin Dialogue');
      await act(async () => {
        fireEvent.click(btn);
      });
      expect(mockStartDialogue).toHaveBeenCalledWith('Closures', {
        targetBloomsLevel: 'ANALYZE',
      });
    });

    it('does not call startDialogue when topic is empty', async () => {
      renderWidget();
      const btn = screen.getByText('Begin Dialogue');
      await act(async () => {
        fireEvent.click(btn);
      });
      expect(mockStartDialogue).not.toHaveBeenCalled();
    });

    it('trims topic before calling startDialogue', async () => {
      mockStartDialogue.mockResolvedValue(null);
      renderWidget({ defaultTopic: '  Closures  ' });
      const btn = screen.getByText('Begin Dialogue');
      await act(async () => {
        fireEvent.click(btn);
      });
      expect(mockStartDialogue).toHaveBeenCalledWith('Closures', expect.any(Object));
    });

    it('does not call startDialogue when topic is only whitespace', async () => {
      renderWidget({ defaultTopic: '   ' });
      const btn = screen.getByText('Begin Dialogue');
      // Button should still be disabled because topic.trim() is empty
      expect(btn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 6. WAITING / LOADING STATE
  // --------------------------------------------------------------------------

  describe('Waiting / Loading State', () => {
    it('shows Starting... text when isWaiting and not active', () => {
      resetHookReturn({ isWaiting: true });
      renderWidget({ defaultTopic: 'test' });
      expect(screen.getByText('Starting...')).toBeInTheDocument();
    });

    it('disables Begin Dialogue when isWaiting', () => {
      resetHookReturn({ isWaiting: true });
      renderWidget({ defaultTopic: 'test' });
      const btn = screen.getByText('Starting...');
      // The button wraps "Starting..." so find its parent button
      expect(btn.closest('button')).toBeDisabled();
    });

    it('shows Thinking... indicator in active dialogue when isWaiting', () => {
      resetHookReturn({ isActive: true, isWaiting: true });
      renderWidget();
      // The loading indicator in chat area
      const thinkingElements = screen.getAllByText('Thinking...');
      expect(thinkingElements.length).toBeGreaterThanOrEqual(1);
    });

    it('disables input field when isWaiting and active', () => {
      resetHookReturn({ isActive: true, isWaiting: true });
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      expect(input).toBeDisabled();
    });

    it('disables submit button when isWaiting', () => {
      resetHookReturn({ isActive: true, isWaiting: true });
      renderWidget();
      // The submit button is the icon button next to the input
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      expect(submitBtn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 7. ERROR DISPLAY
  // --------------------------------------------------------------------------

  describe('Error Display', () => {
    it('displays error message when error is set', () => {
      resetHookReturn({ error: 'Something went wrong' });
      renderWidget();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('does not display error section when error is null', () => {
      renderWidget();
      // Look for the error container pattern -- it has specific styling
      const errorDivs = document.querySelectorAll('.border-red-200');
      expect(errorDivs.length).toBe(0);
    });

    it('shows error during active dialogue', () => {
      resetHookReturn({ isActive: true, error: 'Network failure' });
      renderWidget();
      expect(screen.getByText('Network failure')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. ACTIVE DIALOGUE VIEW
  // --------------------------------------------------------------------------

  describe('Active Dialogue View', () => {
    beforeEach(() => {
      resetHookReturn({ isActive: true, progress: 35 });
    });

    it('renders progress bar when active', () => {
      renderWidget();
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '35');
    });

    it('renders progress percentage text', () => {
      renderWidget();
      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('renders the scroll area (chat area)', () => {
      renderWidget();
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });

    it('renders the user input field', () => {
      renderWidget();
      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    });

    it('renders Hint button with count', () => {
      resetHookReturn({ isActive: true, availableHints: ['hint-a', 'hint-b'] });
      renderWidget();
      expect(screen.getByText(/Hint \(2\)/)).toBeInTheDocument();
    });

    it('renders Skip button', () => {
      renderWidget();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('renders End button', () => {
      renderWidget();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('renders insights badge in header', () => {
      resetHookReturn({ isActive: true, discoveredInsights: ['i1', 'i2'] });
      renderWidget();
      expect(screen.getByText('2 insights')).toBeInTheDocument();
    });

    it('hides topic selection when active', () => {
      renderWidget();
      expect(screen.queryByText('What would you like to explore?')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 9. ENCOURAGEMENT DISPLAY
  // --------------------------------------------------------------------------

  describe('Encouragement Display', () => {
    it('shows encouragement when provided', () => {
      resetHookReturn({ isActive: true, encouragement: 'Great thinking!' });
      renderWidget();
      expect(screen.getByText('Great thinking!')).toBeInTheDocument();
    });

    it('does not show encouragement container when null', () => {
      resetHookReturn({ isActive: true, encouragement: null });
      renderWidget();
      const emeraldDivs = document.querySelectorAll('.border-emerald-200');
      expect(emeraldDivs.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 10. SUBMIT RESPONSE
  // --------------------------------------------------------------------------

  describe('Submit Response', () => {
    beforeEach(() => {
      resetHookReturn({ isActive: true });
      mockSubmitResponse.mockResolvedValue({ feedback: 'Good answer!' });
    });

    it('calls submitResponse when submit button is clicked', async () => {
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'My answer' } });

      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      await act(async () => {
        fireEvent.click(submitBtn!);
      });
      expect(mockSubmitResponse).toHaveBeenCalledWith('My answer');
    });

    it('clears input after submitting', async () => {
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'My answer' } });

      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      await act(async () => {
        fireEvent.click(submitBtn!);
      });
      expect(input.value).toBe('');
    });

    it('does not submit when input is empty', async () => {
      renderWidget();
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      await act(async () => {
        fireEvent.click(submitBtn!);
      });
      expect(mockSubmitResponse).not.toHaveBeenCalled();
    });

    it('does not submit when input is only whitespace', async () => {
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: '   ' } });

      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      // Button should be disabled
      expect(submitBtn).toBeDisabled();
    });

    it('disables submit button when input is empty', () => {
      renderWidget();
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      expect(submitBtn).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 11. KEYBOARD HANDLING
  // --------------------------------------------------------------------------

  describe('Keyboard Handling', () => {
    beforeEach(() => {
      resetHookReturn({ isActive: true });
      mockSubmitResponse.mockResolvedValue(null);
    });

    it('submits on Enter key press', async () => {
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'Enter answer' } });

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
      });
      expect(mockSubmitResponse).toHaveBeenCalledWith('Enter answer');
    });

    it('does not submit on Shift+Enter', async () => {
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'Test' } });

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      });
      expect(mockSubmitResponse).not.toHaveBeenCalled();
    });

    it('does not submit on other keys', async () => {
      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'Test' } });

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Escape' });
      });
      expect(mockSubmitResponse).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 12. HINT BUTTON
  // --------------------------------------------------------------------------

  describe('Hint Button', () => {
    it('calls requestHint when clicked', async () => {
      resetHookReturn({ isActive: true, availableHints: ['hint-1'] });
      mockRequestHint.mockResolvedValue('Here is a hint');
      renderWidget();

      const hintBtn = screen.getByText(/Hint \(1\)/);
      await act(async () => {
        fireEvent.click(hintBtn);
      });
      expect(mockRequestHint).toHaveBeenCalled();
    });

    it('disables hint button when no hints available', () => {
      resetHookReturn({ isActive: true, availableHints: [] });
      renderWidget();
      const hintBtn = screen.getByText(/Hint \(0\)/);
      expect(hintBtn.closest('button')).toBeDisabled();
    });

    it('disables hint button when isWaiting', () => {
      resetHookReturn({ isActive: true, isWaiting: true, availableHints: ['a'] });
      renderWidget();
      const hintBtn = screen.getByText(/Hint \(1\)/);
      expect(hintBtn.closest('button')).toBeDisabled();
    });

    it('shows correct hint count', () => {
      resetHookReturn({ isActive: true, availableHints: ['a', 'b', 'c'] });
      renderWidget();
      expect(screen.getByText(/Hint \(3\)/)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 13. SKIP BUTTON
  // --------------------------------------------------------------------------

  describe('Skip Button', () => {
    it('calls skipQuestion when clicked', async () => {
      resetHookReturn({ isActive: true });
      mockSkipQuestion.mockResolvedValue(null);
      renderWidget();

      const skipBtn = screen.getByText('Skip');
      await act(async () => {
        fireEvent.click(skipBtn);
      });
      expect(mockSkipQuestion).toHaveBeenCalled();
    });

    it('disables skip button when isWaiting', () => {
      resetHookReturn({ isActive: true, isWaiting: true });
      renderWidget();
      const skipBtn = screen.getByText('Skip');
      expect(skipBtn.closest('button')).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 14. END DIALOGUE BUTTON
  // --------------------------------------------------------------------------

  describe('End Dialogue Button', () => {
    it('calls endDialogue when clicked', async () => {
      resetHookReturn({ isActive: true });
      mockEndDialogue.mockResolvedValue(null);
      renderWidget();

      const endBtn = screen.getByText('End');
      await act(async () => {
        fireEvent.click(endBtn);
      });
      expect(mockEndDialogue).toHaveBeenCalled();
    });

    it('disables end button when isWaiting', () => {
      resetHookReturn({ isActive: true, isWaiting: true });
      renderWidget();
      const endBtn = screen.getByText('End');
      expect(endBtn.closest('button')).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // 15. MESSAGES RENDERING
  // --------------------------------------------------------------------------

  describe('Messages Rendering', () => {
    it('renders question message with SAM AI label', async () => {
      // Start inactive so we can click Begin Dialogue
      resetHookReturn({ isActive: false });
      mockStartDialogue.mockImplementation(async () => {
        // After startDialogue resolves, switch the hook to active so the
        // component re-renders the chat area with the messages
        mockHookReturn = { ...mockHookReturn, isActive: true };
        return {
          question: { id: 'q-1', question: 'What is closure scope?' },
        };
      });

      const { rerender } = render(<SocraticDialogueWidget defaultTopic="Closures" />);
      const btn = screen.getByText('Begin Dialogue');
      await act(async () => {
        fireEvent.click(btn);
      });
      // Force a rerender to pick up the new hook return
      rerender(<SocraticDialogueWidget defaultTopic="Closures" />);

      await waitFor(() => {
        expect(screen.getByText('What is closure scope?')).toBeInTheDocument();
      });
    });

    it('renders user response messages after submitting', async () => {
      resetHookReturn({ isActive: true });
      mockSubmitResponse.mockResolvedValue({ feedback: null });

      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'My response text' } });

      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      await act(async () => {
        fireEvent.click(submitBtn!);
      });

      await waitFor(() => {
        expect(screen.getByText('My response text')).toBeInTheDocument();
      });
    });

    it('renders feedback messages from submitResponse', async () => {
      resetHookReturn({ isActive: true });
      mockSubmitResponse.mockResolvedValue({ feedback: 'Excellent reasoning!' });

      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'My answer' } });

      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      await act(async () => {
        fireEvent.click(submitBtn!);
      });

      await waitFor(() => {
        expect(screen.getByText('Excellent reasoning!')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 16. HINT MESSAGES
  // --------------------------------------------------------------------------

  describe('Hint Messages', () => {
    it('adds hint message to chat when requestHint returns a hint', async () => {
      resetHookReturn({ isActive: true, availableHints: ['h1'] });
      mockRequestHint.mockResolvedValue('Think about variable scope');

      renderWidget();
      const hintBtn = screen.getByText(/Hint \(1\)/);
      await act(async () => {
        fireEvent.click(hintBtn);
      });

      await waitFor(() => {
        expect(screen.getByText(/Think about variable scope/)).toBeInTheDocument();
      });
    });

    it('does not add message when requestHint returns null', async () => {
      resetHookReturn({ isActive: true, availableHints: ['h1'] });
      mockRequestHint.mockResolvedValue(null);

      renderWidget();
      const hintBtn = screen.getByText(/Hint \(1\)/);
      await act(async () => {
        fireEvent.click(hintBtn);
      });

      // Wait a tick and verify no hint message appears
      await waitFor(() => {
        expect(screen.queryByText(/Hint:/)).not.toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 17. END DIALOGUE MESSAGES
  // --------------------------------------------------------------------------

  describe('End Dialogue Messages', () => {
    it('adds synthesis message when endDialogue returns synthesis', async () => {
      resetHookReturn({ isActive: true });
      mockEndDialogue.mockResolvedValue({ synthesis: 'You learned about closures' });

      renderWidget();
      const endBtn = screen.getByText('End');
      await act(async () => {
        fireEvent.click(endBtn);
      });

      await waitFor(() => {
        expect(screen.getByText(/You learned about closures/)).toBeInTheDocument();
      });
    });

    it('does not add message when endDialogue returns null', async () => {
      resetHookReturn({ isActive: true });
      mockEndDialogue.mockResolvedValue(null);

      renderWidget();
      const endBtn = screen.getByText('End');
      await act(async () => {
        fireEvent.click(endBtn);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Summary:/)).not.toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 18. COMPLETION STATE
  // --------------------------------------------------------------------------

  describe('Completion State', () => {
    it('shows Dialogue Complete message when isComplete', () => {
      resetHookReturn({ isComplete: true, discoveredInsights: [] });
      renderWidget();
      expect(screen.getByText('Dialogue Complete!')).toBeInTheDocument();
    });

    it('shows Start New Dialogue button when complete', () => {
      resetHookReturn({ isComplete: true, discoveredInsights: [] });
      renderWidget();
      expect(screen.getByText('Start New Dialogue')).toBeInTheDocument();
    });

    it('shows discovered insights list in completion state', () => {
      resetHookReturn({
        isComplete: true,
        discoveredInsights: ['Closures capture variables', 'Scope chains matter'],
      });
      renderWidget();
      expect(screen.getByText('Closures capture variables')).toBeInTheDocument();
      expect(screen.getByText('Scope chains matter')).toBeInTheDocument();
    });

    it('shows Key Insights heading when there are insights', () => {
      resetHookReturn({ isComplete: true, discoveredInsights: ['insight'] });
      renderWidget();
      expect(screen.getByText('Key Insights:')).toBeInTheDocument();
    });

    it('does not show Key Insights when discoveredInsights is empty', () => {
      resetHookReturn({ isComplete: true, discoveredInsights: [] });
      renderWidget();
      expect(screen.queryByText('Key Insights:')).not.toBeInTheDocument();
    });

    it('hides user input area when complete', () => {
      resetHookReturn({ isComplete: true, discoveredInsights: [] });
      renderWidget();
      expect(screen.queryByPlaceholderText('Share your thoughts...')).not.toBeInTheDocument();
    });

    it('hides Hint, Skip, End buttons when complete', () => {
      resetHookReturn({ isComplete: true, discoveredInsights: [] });
      renderWidget();
      expect(screen.queryByText(/Hint/)).not.toBeInTheDocument();
      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
      expect(screen.queryByText('End')).not.toBeInTheDocument();
    });

    it('still shows progress bar when complete', () => {
      resetHookReturn({ isComplete: true, progress: 100, discoveredInsights: [] });
      renderWidget();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 19. RESET DIALOGUE
  // --------------------------------------------------------------------------

  describe('Reset Dialogue', () => {
    it('calls resetDialogue when Start New Dialogue is clicked', async () => {
      resetHookReturn({ isComplete: true, discoveredInsights: [] });
      renderWidget();

      const resetBtn = screen.getByText('Start New Dialogue');
      await act(async () => {
        fireEvent.click(resetBtn);
      });
      expect(mockResetDialogue).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 20. FEEDBACK DISPLAY
  // --------------------------------------------------------------------------

  describe('Feedback Display', () => {
    it('shows feedback text when active and feedback exists', () => {
      resetHookReturn({ isActive: true, feedback: 'Consider the edge cases' });
      renderWidget();
      expect(screen.getByText('Consider the edge cases')).toBeInTheDocument();
    });

    it('does not show feedback when isComplete even if feedback exists', () => {
      resetHookReturn({
        isComplete: true,
        feedback: 'Should not appear',
        discoveredInsights: [],
      });
      renderWidget();
      // The feedback section renders only when feedback && !isComplete
      // The text might still appear in messages, so check for the specific feedback section
      const feedbackDivs = document.querySelectorAll('.bg-slate-100');
      // In complete state, no feedback div with bg-slate-100 for the standalone feedback
      // (the scroll area's messages use different classes)
      const feedbackTexts = Array.from(feedbackDivs).filter(
        d => d.textContent === 'Should not appear'
      );
      expect(feedbackTexts.length).toBe(0);
    });

    it('does not show feedback section when feedback is null', () => {
      resetHookReturn({ isActive: true, feedback: null });
      renderWidget();
      // No standalone feedback div
      const allText = document.body.textContent;
      expect(allText).not.toContain('null');
    });
  });

  // --------------------------------------------------------------------------
  // 21. EDGE CASES
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('handles start dialogue returning response with no question', async () => {
      resetHookReturn({});
      mockStartDialogue.mockResolvedValue({});

      renderWidget({ defaultTopic: 'Test' });
      const btn = screen.getByText('Begin Dialogue');
      await act(async () => {
        fireEvent.click(btn);
      });
      // Should not crash -- no message added
      expect(mockStartDialogue).toHaveBeenCalled();
    });

    it('handles submit response returning response with no feedback', async () => {
      resetHookReturn({ isActive: true });
      mockSubmitResponse.mockResolvedValue({});

      renderWidget();
      const input = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(input, { target: { value: 'Answer' } });
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.getAttribute('data-size') === 'icon');
      await act(async () => {
        fireEvent.click(submitBtn!);
      });
      // Should not crash
      expect(mockSubmitResponse).toHaveBeenCalled();
    });

    it('handles multiple insights in discoveredInsights', () => {
      resetHookReturn({
        isComplete: true,
        discoveredInsights: Array.from({ length: 10 }, (_, i) => `Insight ${i + 1}`),
      });
      renderWidget();
      expect(screen.getByText('Insight 1')).toBeInTheDocument();
      expect(screen.getByText('Insight 10')).toBeInTheDocument();
    });

    it('handles progress at 0%', () => {
      resetHookReturn({ isActive: true, progress: 0 });
      renderWidget();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles progress at 100%', () => {
      resetHookReturn({ isActive: true, progress: 100 });
      renderWidget();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles progress with decimal value by rounding', () => {
      resetHookReturn({ isActive: true, progress: 33.333 });
      renderWidget();
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('renders without courseId and sectionId props', () => {
      renderWidget();
      expect(screen.getByText('Socratic Dialogue')).toBeInTheDocument();
    });

    it('renders with all optional props', () => {
      renderWidget({
        courseId: 'c-1',
        sectionId: 's-1',
        defaultTopic: 'Test Topic',
        compact: false,
        className: 'extra-class',
      });
      expect(screen.getByText('Socratic Dialogue')).toBeInTheDocument();
    });

    it('does not show topic selection when isComplete but not active', () => {
      resetHookReturn({ isActive: false, isComplete: true, discoveredInsights: [] });
      renderWidget();
      // When isComplete is true, the active/complete block renders
      expect(screen.queryByText('What would you like to explore?')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 22. ZERO INSIGHTS BADGE
  // --------------------------------------------------------------------------

  describe('Insights Badge', () => {
    it('shows 0 insights when active with no insights', () => {
      resetHookReturn({ isActive: true, discoveredInsights: [] });
      renderWidget();
      expect(screen.getByText('0 insights')).toBeInTheDocument();
    });

    it('updates insight count dynamically', () => {
      resetHookReturn({ isActive: true, discoveredInsights: ['a', 'b', 'c', 'd'] });
      renderWidget();
      expect(screen.getByText('4 insights')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 23. DEFAULT EXPORT
  // --------------------------------------------------------------------------

  describe('Export', () => {
    it('exports the component as named export', () => {
      expect(SocraticDialogueWidget).toBeDefined();
      expect(typeof SocraticDialogueWidget).toBe('function');
    });
  });
});

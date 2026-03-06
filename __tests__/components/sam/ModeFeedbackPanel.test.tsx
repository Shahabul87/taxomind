import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ============================================================================
// MOCKS - Must be declared before component imports
// ============================================================================

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// Mock getAllModes to return a controlled set of modes
const MOCK_MODES = [
  {
    id: 'general-assistant',
    label: 'General Assistant',
    category: 'general',
    greeting: 'Hello',
    enginePreset: ['response'],
    systemPromptAddition: '',
    allowedToolCategories: [],
  },
  {
    id: 'blooms-analyzer',
    label: "Bloom's Analyzer",
    category: 'analysis',
    greeting: 'Analyzing...',
    enginePreset: ['blooms', 'response'],
    systemPromptAddition: '',
    allowedToolCategories: [],
  },
  {
    id: 'learning-coach',
    label: 'Learning Coach',
    category: 'learning',
    greeting: 'Coaching...',
    enginePreset: ['response'],
    systemPromptAddition: '',
    allowedToolCategories: [],
  },
  {
    id: 'exam-builder',
    label: 'Exam Builder',
    category: 'assessment',
    greeting: 'Building...',
    enginePreset: ['assessment', 'response'],
    systemPromptAddition: '',
    allowedToolCategories: [],
  },
];

jest.mock('@/lib/sam/modes', () => ({
  getAllModes: jest.fn(() => MOCK_MODES),
}));

// ============================================================================
// IMPORTS - After mocks
// ============================================================================

import { ModeFeedbackPanel } from '@/components/sam/ModeFeedbackPanel';

// ============================================================================
// TEST HELPERS
// ============================================================================

interface RenderPanelOptions {
  modeId?: string;
  modeLabel?: string;
  sessionId?: string;
  onSubmit?: jest.Mock;
  onDismiss?: jest.Mock;
}

function renderPanel(overrides: RenderPanelOptions = {}) {
  const defaultProps = {
    modeId: 'general-assistant',
    modeLabel: 'General Assistant',
    onSubmit: jest.fn(),
    onDismiss: jest.fn(),
  };
  const props = { ...defaultProps, ...overrides };
  return { ...render(<ModeFeedbackPanel {...props} />), props };
}

// ============================================================================
// TESTS
// ============================================================================

describe('ModeFeedbackPanel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // Renders panel
  // --------------------------------------------------------------------------
  describe('renders panel', () => {
    it('renders the panel container', () => {
      const { container } = renderPanel();
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toBeInTheDocument();
      expect(rootDiv.tagName).toBe('DIV');
    });

    it('renders the header with mode label', () => {
      renderPanel({ modeLabel: 'Socratic Tutor' });
      expect(screen.getByText('Socratic Tutor')).toBeInTheDocument();
    });

    it('renders the header question text', () => {
      renderPanel({ modeLabel: 'Study Planner' });
      expect(screen.getByText(/How was/)).toBeInTheDocument();
      expect(screen.getByText(/mode\?/)).toBeInTheDocument();
    });

    it('renders the dismiss button with an icon', () => {
      const { container } = renderPanel();
      // The dismiss button is in the header, next to the mode label question
      const headerDiv = container.querySelector('.flex.items-center.justify-between');
      expect(headerDiv).toBeInTheDocument();
      const buttons = headerDiv!.querySelectorAll('button');
      // There should be exactly one button in the header (the dismiss X button)
      expect(buttons).toHaveLength(1);
      // The button should contain an SVG icon
      const svg = buttons[0].querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders all four rating option buttons', () => {
      renderPanel();
      expect(screen.getByText('Effective')).toBeInTheDocument();
      expect(screen.getByText('Somewhat')).toBeInTheDocument();
      expect(screen.getByText('Not effective')).toBeInTheDocument();
      expect(screen.getByText('Wrong mode')).toBeInTheDocument();
    });

    it('renders an icon SVG inside each rating button', () => {
      const { container } = renderPanel();
      // The rating options container has the flex gap-1.5 class
      const ratingContainer = container.querySelector('.flex.gap-1\\.5');
      expect(ratingContainer).toBeInTheDocument();

      const ratingButtons = ratingContainer!.querySelectorAll('button');
      expect(ratingButtons).toHaveLength(4);

      // Each rating button should contain an SVG icon
      ratingButtons.forEach((button) => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('does not render submit button initially (no rating selected)', () => {
      renderPanel();
      expect(screen.queryByText('Submit Feedback')).not.toBeInTheDocument();
    });

    it('does not render textarea initially (no rating selected)', () => {
      renderPanel();
      expect(screen.queryByPlaceholderText('Optional comment...')).not.toBeInTheDocument();
    });

    it('does not render the mode selector dropdown initially', () => {
      renderPanel();
      expect(screen.queryByText('Select a mode...')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Mode display
  // --------------------------------------------------------------------------
  describe('mode display', () => {
    it('displays the mode label in bold within the header', () => {
      renderPanel({ modeLabel: 'Content Creator' });
      const strongElement = screen.getByText('Content Creator');
      expect(strongElement.tagName).toBe('STRONG');
    });

    it('renders correctly with different mode labels', () => {
      const { unmount } = renderPanel({ modeLabel: 'Exam Builder' });
      expect(screen.getByText('Exam Builder')).toBeInTheDocument();
      unmount();

      renderPanel({ modeLabel: 'Research Assistant' });
      expect(screen.getByText('Research Assistant')).toBeInTheDocument();
    });

    it('filters out the current mode from the alternative modes dropdown', () => {
      renderPanel({ modeId: 'general-assistant', modeLabel: 'General Assistant' });

      // Select "Wrong mode" to reveal the dropdown
      fireEvent.click(screen.getByText('Wrong mode'));

      // The current mode should NOT appear in the dropdown options
      const options = screen.getAllByRole('option');
      const optionValues = options.map((opt) => opt.getAttribute('value'));
      expect(optionValues).not.toContain('general-assistant');

      // But other modes should appear
      expect(optionValues).toContain('blooms-analyzer');
      expect(optionValues).toContain('learning-coach');
      expect(optionValues).toContain('exam-builder');
    });

    it('shows all other modes when a different modeId is the current mode', () => {
      renderPanel({ modeId: 'blooms-analyzer', modeLabel: "Bloom's Analyzer" });

      fireEvent.click(screen.getByText('Wrong mode'));

      const options = screen.getAllByRole('option');
      const optionValues = options.map((opt) => opt.getAttribute('value'));

      // blooms-analyzer should be filtered out
      expect(optionValues).not.toContain('blooms-analyzer');
      // general-assistant should be included
      expect(optionValues).toContain('general-assistant');
    });
  });

  // --------------------------------------------------------------------------
  // Feedback buttons
  // --------------------------------------------------------------------------
  describe('feedback buttons', () => {
    it('shows textarea and submit button after selecting Effective', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      expect(screen.getByPlaceholderText('Optional comment...')).toBeInTheDocument();
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
    });

    it('shows textarea and submit button after selecting Somewhat', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Somewhat'));

      expect(screen.getByPlaceholderText('Optional comment...')).toBeInTheDocument();
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
    });

    it('shows textarea and submit button after selecting Not effective', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Not effective'));

      expect(screen.getByPlaceholderText('Optional comment...')).toBeInTheDocument();
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
    });

    it('shows mode selector dropdown when Wrong mode is selected', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Wrong mode'));

      expect(screen.getByText('Which mode would have been better?')).toBeInTheDocument();
      expect(screen.getByText('Select a mode...')).toBeInTheDocument();
    });

    it('hides the mode selector when switching from Wrong mode to another rating', () => {
      renderPanel();

      // First select Wrong mode
      fireEvent.click(screen.getByText('Wrong mode'));
      expect(screen.getByText('Select a mode...')).toBeInTheDocument();

      // Then switch to Effective
      fireEvent.click(screen.getByText('Effective'));
      expect(screen.queryByText('Select a mode...')).not.toBeInTheDocument();
    });

    it('calls onDismiss when the X button is clicked', () => {
      const { props, container } = renderPanel();
      // The dismiss button is in the header row
      const headerDiv = container.querySelector('.flex.items-center.justify-between');
      const dismissButton = headerDiv!.querySelector('button') as HTMLElement;

      fireEvent.click(dismissButton);
      expect(props.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('displays the character counter for the comment textarea', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      expect(screen.getByText('0/200')).toBeInTheDocument();
    });

    it('updates character counter as user types', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      const textarea = screen.getByPlaceholderText('Optional comment...');
      fireEvent.change(textarea, { target: { value: 'Great mode!' } });

      expect(screen.getByText('11/200')).toBeInTheDocument();
    });

    it('enforces the 200 character maximum on the comment', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      const textarea = screen.getByPlaceholderText('Optional comment...');
      const longText = 'A'.repeat(250);
      fireEvent.change(textarea, { target: { value: longText } });

      // The component slices the value to 200 chars via onChange handler
      expect(screen.getByText('200/200')).toBeInTheDocument();
    });

    it('renders an icon in the submit button', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      const submitButton = screen.getByText('Submit Feedback').closest('button') as HTMLElement;
      const svg = submitButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Submit feedback
  // --------------------------------------------------------------------------
  describe('submit feedback', () => {
    it('calls onSubmit with EFFECTIVE rating and no suggestion', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'EFFECTIVE',
        suggestion: undefined,
        comment: undefined,
      });
    });

    it('calls onSubmit with SOMEWHAT rating', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Somewhat'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'SOMEWHAT',
        suggestion: undefined,
        comment: undefined,
      });
    });

    it('calls onSubmit with NOT_EFFECTIVE rating', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Not effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'NOT_EFFECTIVE',
        suggestion: undefined,
        comment: undefined,
      });
    });

    it('calls onSubmit with WRONG_MODE rating and suggested mode', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Wrong mode'));

      // Select an alternative mode from the dropdown
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'learning-coach' } });

      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'WRONG_MODE',
        suggestion: 'learning-coach',
        comment: undefined,
      });
    });

    it('calls onSubmit with WRONG_MODE but no suggestion when none selected', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Wrong mode'));
      // Do NOT select any mode from dropdown
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'WRONG_MODE',
        suggestion: undefined,
        comment: undefined,
      });
    });

    it('includes the comment when provided', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Effective'));

      const textarea = screen.getByPlaceholderText('Optional comment...');
      fireEvent.change(textarea, { target: { value: 'Very helpful for my studies' } });

      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'EFFECTIVE',
        suggestion: undefined,
        comment: 'Very helpful for my studies',
      });
    });

    it('trims whitespace-only comments to undefined', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Effective'));

      const textarea = screen.getByPlaceholderText('Optional comment...');
      fireEvent.change(textarea, { target: { value: '   ' } });

      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'EFFECTIVE',
        suggestion: undefined,
        comment: undefined,
      });
    });

    it('shows the thank you message after submission', () => {
      renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    });

    it('hides the rating buttons after submission', () => {
      renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(screen.queryByText('Effective')).not.toBeInTheDocument();
      expect(screen.queryByText('Somewhat')).not.toBeInTheDocument();
      expect(screen.queryByText('Not effective')).not.toBeInTheDocument();
      expect(screen.queryByText('Wrong mode')).not.toBeInTheDocument();
    });

    it('hides the submit button after submission', () => {
      renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(screen.queryByText('Submit Feedback')).not.toBeInTheDocument();
    });

    it('auto-dismisses after 1500ms following submission', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      // onDismiss should not be called immediately
      expect(props.onDismiss).not.toHaveBeenCalled();

      // Advance timers by 1500ms
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(props.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss before 1500ms', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(props.onDismiss).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when no rating is selected', () => {
      const { props } = renderPanel();

      // The submit button should not be visible, but verify the callback is not triggered
      expect(screen.queryByText('Submit Feedback')).not.toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('passes the correct modeId from props', () => {
      const { props } = renderPanel({
        modeId: 'exam-builder',
        modeLabel: 'Exam Builder',
      });

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          modeId: 'exam-builder',
        }),
      );
    });

    it('includes both suggestion and comment for WRONG_MODE', () => {
      const { props } = renderPanel();

      fireEvent.click(screen.getByText('Wrong mode'));

      // Select alternative mode
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'exam-builder' } });

      // Add comment
      const textarea = screen.getByPlaceholderText('Optional comment...');
      fireEvent.change(textarea, { target: { value: 'Should have been assessment' } });

      fireEvent.click(screen.getByText('Submit Feedback'));

      expect(props.onSubmit).toHaveBeenCalledWith({
        modeId: 'general-assistant',
        rating: 'WRONG_MODE',
        suggestion: 'exam-builder',
        comment: 'Should have been assessment',
      });
    });
  });

  // --------------------------------------------------------------------------
  // className prop (component does not expose className, but verify structure)
  // --------------------------------------------------------------------------
  describe('panel structure and styling', () => {
    it('applies border-t and bg styling to the root container', () => {
      const { container } = renderPanel();
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('px-4');
      expect(rootDiv.className).toContain('py-3');
      expect(rootDiv.className).toContain('border-t');
    });

    it('applies border-t and bg styling to the submitted state container', () => {
      const { container } = renderPanel();

      fireEvent.click(screen.getByText('Effective'));
      fireEvent.click(screen.getByText('Submit Feedback'));

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('px-4');
      expect(rootDiv.className).toContain('py-3');
      expect(rootDiv.className).toContain('border-t');
    });

    it('renders the mode selector label text correctly', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Wrong mode'));

      expect(screen.getByText('Which mode would have been better?')).toBeInTheDocument();
    });

    it('renders the select with a default empty option', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Wrong mode'));

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('');
      expect(screen.getByText('Select a mode...')).toBeInTheDocument();
    });

    it('renders option labels from getAllModes results', () => {
      renderPanel({ modeId: 'general-assistant' });
      fireEvent.click(screen.getByText('Wrong mode'));

      expect(screen.getByText("Bloom's Analyzer")).toBeInTheDocument();
      expect(screen.getByText('Learning Coach')).toBeInTheDocument();
      expect(screen.getByText('Exam Builder')).toBeInTheDocument();
    });

    it('textarea has maxLength attribute set to 200', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      const textarea = screen.getByPlaceholderText('Optional comment...');
      expect(textarea).toHaveAttribute('maxLength', '200');
    });

    it('textarea has rows set to 2', () => {
      renderPanel();
      fireEvent.click(screen.getByText('Effective'));

      const textarea = screen.getByPlaceholderText('Optional comment...');
      expect(textarea).toHaveAttribute('rows', '2');
    });
  });
});

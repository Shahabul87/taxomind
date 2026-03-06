import React from 'react';
import { render, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

// Mock Alert UI components with simple HTML elements
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="alert" role="alert" className={className} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, className, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="alert-description" className={className} {...props}>
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  SamLoadingState,
  SamSuggestionLoading,
  SamValidationLoading,
  SamGenerationLoading,
  SamTitleGenerationLoading,
} from '@/components/sam/sam-loading-state';

// ---------------------------------------------------------------------------
// Default messages for each loading type (mirroring the source config)
// ---------------------------------------------------------------------------

const DEFAULT_MESSAGES: Record<string, string> = {
  suggestion: 'Sam is analyzing your course...',
  validation: 'Sam is validating your input...',
  generation: 'Sam is crafting your course blueprint...',
  thinking: 'Sam is thinking...',
  'title-generation': 'Sam is crafting perfect titles...',
};

// ---------------------------------------------------------------------------
// SamLoadingState -- Full (non-compact) mode
// ---------------------------------------------------------------------------

describe('SamLoadingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Renders the default message for each loading type
  // -----------------------------------------------------------------------
  describe.each([
    ['suggestion', 'Sam is analyzing your course...'],
    ['validation', 'Sam is validating your input...'],
    ['generation', 'Sam is crafting your course blueprint...'],
    ['thinking', 'Sam is thinking...'],
    ['title-generation', 'Sam is crafting perfect titles...'],
  ] as const)('type="%s"', (type, expectedMessage) => {
    it(`renders the default message: "${expectedMessage}"`, () => {
      render(<SamLoadingState type={type} />);

      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 2. Renders inside an Alert in full (non-compact) mode
  // -----------------------------------------------------------------------
  it('renders an Alert component in full mode', () => {
    render(<SamLoadingState type="thinking" />);

    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByTestId('alert-description')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 3. Displays the "Sam" label in full mode
  // -----------------------------------------------------------------------
  it('displays the "Sam" label in full mode', () => {
    render(<SamLoadingState type="thinking" />);

    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 4. Renders three animated pulse dots in full mode
  // -----------------------------------------------------------------------
  it('renders three animated pulse dots in full mode', () => {
    const { container } = render(<SamLoadingState type="thinking" />);

    const pulseDots = container.querySelectorAll('.animate-pulse');
    expect(pulseDots).toHaveLength(3);
  });

  // -----------------------------------------------------------------------
  // 5. Pulse dots have staggered animation delays
  // -----------------------------------------------------------------------
  it('applies staggered animation delays to pulse dots', () => {
    const { container } = render(<SamLoadingState type="thinking" />);

    const pulseDots = container.querySelectorAll('.animate-pulse');
    expect(pulseDots[0]).toHaveStyle({ animationDelay: '0ms' });
    expect(pulseDots[1]).toHaveStyle({ animationDelay: '150ms' });
    expect(pulseDots[2]).toHaveStyle({ animationDelay: '300ms' });
  });

  // -----------------------------------------------------------------------
  // 6. Renders icon SVGs (type icon + spinner) in full mode
  // -----------------------------------------------------------------------
  it('renders the type icon and a spinner icon in full mode', () => {
    const { container } = render(<SamLoadingState type="suggestion" />);

    // Lucide mock renders <svg> elements with data-testid attributes
    const svgs = container.querySelectorAll('svg');
    // Should have at least 2 SVGs: the type icon (Lightbulb) and the Loader2 spinner
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  // -----------------------------------------------------------------------
  // 7. Custom message overrides the default
  // -----------------------------------------------------------------------
  it('renders a custom message instead of the default', () => {
    const customMessage = 'Preparing your personalized syllabus...';
    render(<SamLoadingState type="generation" message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText(DEFAULT_MESSAGES.generation)).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 8. className prop is applied to the Alert wrapper in full mode
  // -----------------------------------------------------------------------
  it('applies additional className to the Alert wrapper', () => {
    render(<SamLoadingState type="thinking" className="my-custom-class" />);

    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('my-custom-class');
  });

  // -----------------------------------------------------------------------
  // 9. Alert has the correct role for accessibility
  // -----------------------------------------------------------------------
  it('renders with role="alert" for accessibility', () => {
    render(<SamLoadingState type="validation" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 10. Alert includes background and border color classes for "suggestion" type
  // -----------------------------------------------------------------------
  it('applies purple color classes for the "suggestion" type', () => {
    render(<SamLoadingState type="suggestion" />);

    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('bg-purple-50/50');
    expect(alert.className).toContain('border-purple-200/50');
  });

  // -----------------------------------------------------------------------
  // 11. Alert includes blue color classes for "validation" type
  // -----------------------------------------------------------------------
  it('applies blue color classes for the "validation" type', () => {
    render(<SamLoadingState type="validation" />);

    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('bg-blue-50/50');
    expect(alert.className).toContain('border-blue-200/50');
  });

  // -----------------------------------------------------------------------
  // 12. Alert includes indigo color classes for "generation" type
  // -----------------------------------------------------------------------
  it('applies indigo color classes for the "generation" type', () => {
    render(<SamLoadingState type="generation" />);

    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('bg-indigo-50/50');
    expect(alert.className).toContain('border-indigo-200/50');
  });

  // -----------------------------------------------------------------------
  // 13. Alert includes slate color classes for "thinking" type
  // -----------------------------------------------------------------------
  it('applies slate color classes for the "thinking" type', () => {
    render(<SamLoadingState type="thinking" />);

    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('bg-slate-50/50');
    expect(alert.className).toContain('border-slate-200/50');
  });

  // -----------------------------------------------------------------------
  // 14. Alert includes purple color classes for "title-generation" type
  // -----------------------------------------------------------------------
  it('applies purple color classes for the "title-generation" type', () => {
    render(<SamLoadingState type="title-generation" />);

    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('bg-purple-50/50');
    expect(alert.className).toContain('border-purple-200/50');
  });
});

// ---------------------------------------------------------------------------
// SamLoadingState -- Compact mode
// ---------------------------------------------------------------------------

describe('SamLoadingState (compact mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Compact mode does NOT render the Alert wrapper
  // -----------------------------------------------------------------------
  it('does not render an Alert component in compact mode', () => {
    render(<SamLoadingState type="thinking" compact />);

    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-description')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 2. Compact mode renders the default message as a <span>
  // -----------------------------------------------------------------------
  it('renders the default message in compact mode', () => {
    render(<SamLoadingState type="validation" compact />);

    expect(screen.getByText('Sam is validating your input...')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 3. Compact mode supports custom message
  // -----------------------------------------------------------------------
  it('renders a custom message in compact mode', () => {
    render(<SamLoadingState type="suggestion" compact message="Almost there..." />);

    expect(screen.getByText('Almost there...')).toBeInTheDocument();
    expect(screen.queryByText(DEFAULT_MESSAGES.suggestion)).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 4. Compact mode renders a spinner icon
  // -----------------------------------------------------------------------
  it('renders a spinner icon in compact mode', () => {
    const { container } = render(<SamLoadingState type="thinking" compact />);

    const svgs = container.querySelectorAll('svg');
    // The compact mode renders only the Loader2 spinner, not the type icon
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  // -----------------------------------------------------------------------
  // 5. Compact mode does NOT render the "Sam" label
  // -----------------------------------------------------------------------
  it('does not display the "Sam" label in compact mode', () => {
    render(<SamLoadingState type="thinking" compact />);

    expect(screen.queryByText('Sam')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 6. Compact mode does NOT render pulse dots
  // -----------------------------------------------------------------------
  it('does not render pulse dots in compact mode', () => {
    const { container } = render(<SamLoadingState type="thinking" compact />);

    const pulseDots = container.querySelectorAll('.animate-pulse');
    expect(pulseDots).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 7. className prop is applied in compact mode
  // -----------------------------------------------------------------------
  it('applies additional className in compact mode', () => {
    const { container } = render(
      <SamLoadingState type="thinking" compact className="compact-extra" />
    );

    // The top-level <div> in compact mode should have the class
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('compact-extra');
  });

  // -----------------------------------------------------------------------
  // 8. Compact mode applies the correct text color class
  // -----------------------------------------------------------------------
  it('applies the correct text color for the type in compact mode', () => {
    const { container } = render(<SamLoadingState type="suggestion" compact />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('text-purple-600');
  });

  // -----------------------------------------------------------------------
  // 9. compact defaults to false
  // -----------------------------------------------------------------------
  it('defaults to non-compact mode when compact is not specified', () => {
    render(<SamLoadingState type="thinking" />);

    // Full mode renders an Alert
    expect(screen.getByTestId('alert')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Preset loading state components
// ---------------------------------------------------------------------------

describe('Preset loading state components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. SamSuggestionLoading renders with "suggestion" type defaults
  // -----------------------------------------------------------------------
  it('SamSuggestionLoading renders the suggestion default message', () => {
    render(<SamSuggestionLoading />);

    expect(screen.getByText(DEFAULT_MESSAGES.suggestion)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 2. SamSuggestionLoading passes through props
  // -----------------------------------------------------------------------
  it('SamSuggestionLoading accepts and forwards custom message and className', () => {
    render(
      <SamSuggestionLoading message="Custom suggestion" className="extra-class" />
    );

    expect(screen.getByText('Custom suggestion')).toBeInTheDocument();
    const alert = screen.getByTestId('alert');
    expect(alert.className).toContain('extra-class');
  });

  // -----------------------------------------------------------------------
  // 3. SamSuggestionLoading supports compact mode
  // -----------------------------------------------------------------------
  it('SamSuggestionLoading supports compact mode', () => {
    render(<SamSuggestionLoading compact />);

    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    expect(screen.getByText(DEFAULT_MESSAGES.suggestion)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 4. SamValidationLoading renders with "validation" type defaults
  // -----------------------------------------------------------------------
  it('SamValidationLoading renders the validation default message', () => {
    render(<SamValidationLoading />);

    expect(screen.getByText(DEFAULT_MESSAGES.validation)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 5. SamValidationLoading passes through props
  // -----------------------------------------------------------------------
  it('SamValidationLoading accepts and forwards custom message', () => {
    render(<SamValidationLoading message="Checking fields..." />);

    expect(screen.getByText('Checking fields...')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 6. SamGenerationLoading renders with "generation" type defaults
  // -----------------------------------------------------------------------
  it('SamGenerationLoading renders the generation default message', () => {
    render(<SamGenerationLoading />);

    expect(screen.getByText(DEFAULT_MESSAGES.generation)).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 7. SamGenerationLoading passes through props
  // -----------------------------------------------------------------------
  it('SamGenerationLoading accepts and forwards custom message', () => {
    render(<SamGenerationLoading message="Building outline..." />);

    expect(screen.getByText('Building outline...')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 8. SamTitleGenerationLoading renders with "title-generation" type defaults
  // -----------------------------------------------------------------------
  it('SamTitleGenerationLoading renders the title-generation default message', () => {
    render(<SamTitleGenerationLoading />);

    expect(screen.getByText(DEFAULT_MESSAGES['title-generation'])).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 9. SamTitleGenerationLoading passes through props
  // -----------------------------------------------------------------------
  it('SamTitleGenerationLoading accepts and forwards custom message', () => {
    render(<SamTitleGenerationLoading message="Generating title ideas..." />);

    expect(screen.getByText('Generating title ideas...')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 10. SamTitleGenerationLoading supports compact mode
  // -----------------------------------------------------------------------
  it('SamTitleGenerationLoading supports compact mode', () => {
    render(<SamTitleGenerationLoading compact />);

    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    expect(screen.getByText(DEFAULT_MESSAGES['title-generation'])).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Accessibility', () => {
  // -----------------------------------------------------------------------
  // 1. Full mode has role="alert" via the Alert component
  // -----------------------------------------------------------------------
  it('provides role="alert" in full mode for screen readers', () => {
    render(<SamLoadingState type="validation" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 2. The displayed message is accessible as text content
  // -----------------------------------------------------------------------
  it('renders the loading message as accessible text content', () => {
    render(<SamLoadingState type="thinking" message="Processing your request..." />);

    const messageElement = screen.getByText('Processing your request...');
    expect(messageElement).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 3. Icons have proper SVG elements (via lucide-react mock)
  // -----------------------------------------------------------------------
  it('renders SVG icons that are present in the DOM', () => {
    const { container } = render(<SamLoadingState type="generation" />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});

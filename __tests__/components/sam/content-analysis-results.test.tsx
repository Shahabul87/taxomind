import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

// Mock UI components with simple HTML elements
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: string;
      size?: string;
    }
  >(({ children, variant, size, ...props }, ref) =>
    React.createElement(
      'button',
      { ref, 'data-testid': 'ui-button', 'data-variant': variant, 'data-size': size, ...props },
      children,
    ),
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: React.forwardRef<
    HTMLDivElement,
    { value?: number; className?: string }
  >(({ value, className, ...props }, ref) =>
    React.createElement('div', {
      ref,
      'data-testid': 'ui-progress',
      'data-value': value,
      className,
      role: 'progressbar',
      'aria-valuenow': value,
      ...props,
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Import component under test (after mocks)
// ---------------------------------------------------------------------------
import { ContentAnalysisResults } from '@/components/sam/content-analysis-results';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

interface AnalysisData {
  contentType: string;
  qualityScore: number;
  engagementScore: number;
  accessibilityScore: number;
  recommendations: string[];
  warnings?: string[];
  insights: {
    estimatedDuration?: string;
    complexity?: 'Low' | 'Medium' | 'High';
    targetAudience?: string;
    keyTopics?: string[];
  };
}

function createAnalysis(overrides: Partial<AnalysisData> = {}): AnalysisData {
  return {
    contentType: 'text',
    qualityScore: 0.85,
    engagementScore: 0.72,
    accessibilityScore: 0.9,
    recommendations: [
      'Add captions to all images',
      'Break content into smaller sections',
      'Include a summary at the end',
    ],
    warnings: [],
    insights: {
      estimatedDuration: '15 min',
      complexity: 'Medium',
      targetAudience: 'Intermediate learners',
      keyTopics: ['React', 'TypeScript', 'Testing'],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContentAnalysisResults', () => {
  // -----------------------------------------------------------------------
  // Rendering with analysis data
  // -----------------------------------------------------------------------

  describe('rendering with analysis data', () => {
    it('renders the component header', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.getByText('AI Content Analysis Complete')).toBeInTheDocument();
    });

    it('displays content type in the description', () => {
      render(<ContentAnalysisResults analysis={createAnalysis({ contentType: 'video' })} />);

      expect(
        screen.getByText('SAM AI has analyzed your video content'),
      ).toBeInTheDocument();
    });

    it('renders the toggle details button', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      // The toggle button is a UI button with a chevron icon
      const buttons = screen.getAllByTestId('ui-button');
      // First button is the details toggle (ghost variant)
      const toggleButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'ghost',
      );
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders the progress bar', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      const progressBar = screen.getByTestId('ui-progress');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Score display
  // -----------------------------------------------------------------------

  describe('score display', () => {
    it('displays overall score as percentage', () => {
      const analysis = createAnalysis({
        qualityScore: 0.85,
        engagementScore: 0.72,
        accessibilityScore: 0.9,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Overall = (0.85 + 0.72 + 0.9) / 3 = 0.8233... => Math.round(82.33) = 82
      expect(screen.getByText(/82%/)).toBeInTheDocument();
    });

    it('displays "Excellent" label for overall score >= 0.8', () => {
      const analysis = createAnalysis({
        qualityScore: 0.9,
        engagementScore: 0.85,
        accessibilityScore: 0.9,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Overall = (0.9 + 0.85 + 0.9) / 3 = 0.8833...
      expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    });

    it('displays "Good" label for overall score >= 0.6 and < 0.8', () => {
      const analysis = createAnalysis({
        qualityScore: 0.65,
        engagementScore: 0.7,
        accessibilityScore: 0.75,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Overall = (0.65 + 0.7 + 0.75) / 3 = 0.7
      expect(screen.getByText(/Good/)).toBeInTheDocument();
    });

    it('displays "Needs Improvement" label for overall score < 0.6', () => {
      const analysis = createAnalysis({
        qualityScore: 0.3,
        engagementScore: 0.4,
        accessibilityScore: 0.5,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Overall = (0.3 + 0.4 + 0.5) / 3 = 0.4
      expect(screen.getByText(/Needs Improvement/)).toBeInTheDocument();
    });

    it('passes correct value to Progress component', () => {
      const analysis = createAnalysis({
        qualityScore: 0.85,
        engagementScore: 0.72,
        accessibilityScore: 0.9,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      const progress = screen.getByTestId('ui-progress');
      const value = Number(progress.getAttribute('data-value'));
      // Overall = (0.85 + 0.72 + 0.9) / 3 * 100 ~ 82.33
      expect(Math.round(value)).toBe(82);
    });

    it('displays individual quality score as percentage', () => {
      render(
        <ContentAnalysisResults analysis={createAnalysis({ qualityScore: 0.85 })} />,
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays individual engagement score as percentage', () => {
      render(
        <ContentAnalysisResults analysis={createAnalysis({ engagementScore: 0.72 })} />,
      );

      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('displays individual accessibility score as percentage', () => {
      render(
        <ContentAnalysisResults analysis={createAnalysis({ accessibilityScore: 0.9 })} />,
      );

      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('displays metric labels (Quality, Engagement, Accessibility)', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.getByText('Quality')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();
      expect(screen.getByText('Accessibility')).toBeInTheDocument();
    });

    it('renders "Overall Score" label', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.getByText('Overall Score')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Category breakdowns (content type icon selection)
  // -----------------------------------------------------------------------

  describe('content type icons', () => {
    it('renders an icon in the header for video content type', () => {
      render(<ContentAnalysisResults analysis={createAnalysis({ contentType: 'video' })} />);

      // An SVG icon is rendered inside the icon container
      const iconContainer = screen.getByText('AI Content Analysis Complete')
        .closest('.flex.items-center.gap-3');
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(screen.getByText('SAM AI has analyzed your video content')).toBeInTheDocument();
    });

    it('renders an icon in the header for audio content type', () => {
      render(<ContentAnalysisResults analysis={createAnalysis({ contentType: 'audio' })} />);

      const iconContainer = screen.getByText('AI Content Analysis Complete')
        .closest('.flex.items-center.gap-3');
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(screen.getByText('SAM AI has analyzed your audio content')).toBeInTheDocument();
    });

    it('renders an icon in the header for image content type', () => {
      render(<ContentAnalysisResults analysis={createAnalysis({ contentType: 'image' })} />);

      const iconContainer = screen.getByText('AI Content Analysis Complete')
        .closest('.flex.items-center.gap-3');
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(screen.getByText('SAM AI has analyzed your image content')).toBeInTheDocument();
    });

    it('renders an icon in the header for text content type (default)', () => {
      render(<ContentAnalysisResults analysis={createAnalysis({ contentType: 'text' })} />);

      const iconContainer = screen.getByText('AI Content Analysis Complete')
        .closest('.flex.items-center.gap-3');
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(screen.getByText('SAM AI has analyzed your text content')).toBeInTheDocument();
    });

    it('renders an icon for unknown content types and falls back to text', () => {
      render(
        <ContentAnalysisResults analysis={createAnalysis({ contentType: 'spreadsheet' })} />,
      );

      const iconContainer = screen.getByText('AI Content Analysis Complete')
        .closest('.flex.items-center.gap-3');
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(screen.getByText('SAM AI has analyzed your spreadsheet content')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Recommendations / Insights
  // -----------------------------------------------------------------------

  describe('recommendations', () => {
    it('displays the "Recommendations" heading when recommendations exist', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('shows only first 2 recommendations when details are collapsed', () => {
      const analysis = createAnalysis({
        recommendations: ['Rec 1', 'Rec 2', 'Rec 3', 'Rec 4'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText(/Rec 1/)).toBeInTheDocument();
      expect(screen.getByText(/Rec 2/)).toBeInTheDocument();
      expect(screen.queryByText(/Rec 3/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Rec 4/)).not.toBeInTheDocument();
    });

    it('shows "+N more..." text when there are more than 2 recommendations collapsed', () => {
      const analysis = createAnalysis({
        recommendations: ['Rec 1', 'Rec 2', 'Rec 3', 'Rec 4'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText('+2 more...')).toBeInTheDocument();
    });

    it('shows all recommendations when details are expanded', () => {
      const analysis = createAnalysis({
        recommendations: ['Rec 1', 'Rec 2', 'Rec 3', 'Rec 4'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Expand details
      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.getByText(/Rec 1/)).toBeInTheDocument();
      expect(screen.getByText(/Rec 2/)).toBeInTheDocument();
      expect(screen.getByText(/Rec 3/)).toBeInTheDocument();
      expect(screen.getByText(/Rec 4/)).toBeInTheDocument();
      expect(screen.queryByText(/more\.\.\./)).not.toBeInTheDocument();
    });

    it('does not render recommendations section when array is empty', () => {
      const analysis = createAnalysis({ recommendations: [] });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });

    it('does not show "+N more..." when there are 2 or fewer recommendations', () => {
      const analysis = createAnalysis({
        recommendations: ['Rec 1', 'Rec 2'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.queryByText(/more\.\.\./)).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Warnings
  // -----------------------------------------------------------------------

  describe('warnings', () => {
    it('displays warnings when present', () => {
      const analysis = createAnalysis({
        warnings: ['Low contrast detected', 'Missing alt text'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(screen.getByText(/Low contrast detected/)).toBeInTheDocument();
      expect(screen.getByText(/Missing alt text/)).toBeInTheDocument();
    });

    it('does not render warnings section when warnings array is empty', () => {
      const analysis = createAnalysis({ warnings: [] });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
    });

    it('does not render warnings section when warnings is undefined', () => {
      const analysis = createAnalysis();
      delete (analysis as Record<string, unknown>).warnings;
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Detailed insights (shown when expanded)
  // -----------------------------------------------------------------------

  describe('detailed insights', () => {
    it('does not show insights panel by default (collapsed)', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.queryByText('Content Insights')).not.toBeInTheDocument();
    });

    it('shows insights panel after clicking the toggle button', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.getByText('Content Insights')).toBeInTheDocument();
    });

    it('displays estimated duration when provided', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      // Expand
      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('15 min')).toBeInTheDocument();
    });

    it('displays complexity when provided', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.getByText('Complexity:')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('displays target audience when provided', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.getByText('Best for:')).toBeInTheDocument();
      expect(screen.getByText('Intermediate learners')).toBeInTheDocument();
    });

    it('displays key topics when provided', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.getByText('Topics:')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });

    it('hides insights panel when toggled off', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');

      // Open
      fireEvent.click(toggleButton!);
      expect(screen.getByText('Content Insights')).toBeInTheDocument();

      // Close
      fireEvent.click(toggleButton!);
      expect(screen.queryByText('Content Insights')).not.toBeInTheDocument();
    });

    it('does not show duration label when estimatedDuration is absent', () => {
      const analysis = createAnalysis({
        insights: {
          complexity: 'High',
        },
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.queryByText('Duration:')).not.toBeInTheDocument();
    });

    it('does not show topics section when keyTopics is absent', () => {
      const analysis = createAnalysis({
        insights: {
          complexity: 'Low',
        },
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.queryByText('Topics:')).not.toBeInTheDocument();
    });

    it('does not show topics section when keyTopics is empty array', () => {
      const analysis = createAnalysis({
        insights: {
          keyTopics: [],
        },
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      const toggleButton = screen
        .getAllByTestId('ui-button')
        .find((btn) => btn.getAttribute('data-variant') === 'ghost');
      fireEvent.click(toggleButton!);

      expect(screen.queryByText('Topics:')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Action buttons (onAccept / onReject)
  // -----------------------------------------------------------------------

  describe('action buttons', () => {
    it('renders "Accept & Optimize" button when onAccept is provided', () => {
      const onAccept = jest.fn();
      render(<ContentAnalysisResults analysis={createAnalysis()} onAccept={onAccept} />);

      expect(screen.getByText('Accept & Optimize')).toBeInTheDocument();
    });

    it('renders "Upload Different File" button when onReject is provided', () => {
      const onReject = jest.fn();
      render(<ContentAnalysisResults analysis={createAnalysis()} onReject={onReject} />);

      expect(screen.getByText('Upload Different File')).toBeInTheDocument();
    });

    it('does not render accept button when onAccept is not provided', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.queryByText('Accept & Optimize')).not.toBeInTheDocument();
    });

    it('does not render reject button when onReject is not provided', () => {
      render(<ContentAnalysisResults analysis={createAnalysis()} />);

      expect(screen.queryByText('Upload Different File')).not.toBeInTheDocument();
    });

    it('calls onAccept when the accept button is clicked', () => {
      const onAccept = jest.fn();
      render(<ContentAnalysisResults analysis={createAnalysis()} onAccept={onAccept} />);

      fireEvent.click(screen.getByText('Accept & Optimize'));

      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('calls onReject when the reject button is clicked', () => {
      const onReject = jest.fn();
      render(<ContentAnalysisResults analysis={createAnalysis()} onReject={onReject} />);

      fireEvent.click(screen.getByText('Upload Different File'));

      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('disables buttons when isLoading is true', () => {
      const onAccept = jest.fn();
      const onReject = jest.fn();
      render(
        <ContentAnalysisResults
          analysis={createAnalysis()}
          onAccept={onAccept}
          onReject={onReject}
          isLoading={true}
        />,
      );

      const acceptBtn = screen.getByText('Accept & Optimize').closest('button');
      const rejectBtn = screen.getByText('Upload Different File').closest('button');

      expect(acceptBtn).toBeDisabled();
      expect(rejectBtn).toBeDisabled();
    });

    it('does not disable buttons when isLoading is false', () => {
      const onAccept = jest.fn();
      const onReject = jest.fn();
      render(
        <ContentAnalysisResults
          analysis={createAnalysis()}
          onAccept={onAccept}
          onReject={onReject}
          isLoading={false}
        />,
      );

      const acceptBtn = screen.getByText('Accept & Optimize').closest('button');
      const rejectBtn = screen.getByText('Upload Different File').closest('button');

      expect(acceptBtn).not.toBeDisabled();
      expect(rejectBtn).not.toBeDisabled();
    });

    it('renders both buttons when both callbacks are provided', () => {
      render(
        <ContentAnalysisResults
          analysis={createAnalysis()}
          onAccept={jest.fn()}
          onReject={jest.fn()}
        />,
      );

      expect(screen.getByText('Accept & Optimize')).toBeInTheDocument();
      expect(screen.getByText('Upload Different File')).toBeInTheDocument();
    });

    it('passes correct variant to reject button', () => {
      render(
        <ContentAnalysisResults
          analysis={createAnalysis()}
          onReject={jest.fn()}
        />,
      );

      const rejectBtn = screen.getByText('Upload Different File').closest('button');
      expect(rejectBtn).toHaveAttribute('data-variant', 'outline');
    });
  });

  // -----------------------------------------------------------------------
  // Empty / null data handling
  // -----------------------------------------------------------------------

  describe('empty and edge case data handling', () => {
    it('renders with zero scores', () => {
      const analysis = createAnalysis({
        qualityScore: 0,
        engagementScore: 0,
        accessibilityScore: 0,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Each metric should show 0%
      const zeroPercentTexts = screen.getAllByText('0%');
      expect(zeroPercentTexts.length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText(/Needs Improvement/)).toBeInTheDocument();
    });

    it('renders with perfect scores', () => {
      const analysis = createAnalysis({
        qualityScore: 1,
        engagementScore: 1,
        accessibilityScore: 1,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      const hundredPercentTexts = screen.getAllByText('100%');
      expect(hundredPercentTexts.length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    });

    it('renders with empty insights object', () => {
      const analysis = createAnalysis({ insights: {} });
      render(<ContentAnalysisResults analysis={analysis} />);

      // Should still render without errors
      expect(screen.getByText('AI Content Analysis Complete')).toBeInTheDocument();
    });

    it('renders with empty recommendations array', () => {
      const analysis = createAnalysis({ recommendations: [] });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
      expect(screen.getByText('AI Content Analysis Complete')).toBeInTheDocument();
    });

    it('handles boundary score of exactly 0.8 as Excellent', () => {
      const analysis = createAnalysis({
        qualityScore: 0.8,
        engagementScore: 0.8,
        accessibilityScore: 0.8,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    });

    it('handles boundary score of exactly 0.6 as Good', () => {
      const analysis = createAnalysis({
        qualityScore: 0.6,
        engagementScore: 0.6,
        accessibilityScore: 0.6,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText(/Good/)).toBeInTheDocument();
    });

    it('handles score just below 0.6 as Needs Improvement', () => {
      const analysis = createAnalysis({
        qualityScore: 0.59,
        engagementScore: 0.59,
        accessibilityScore: 0.59,
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText(/Needs Improvement/)).toBeInTheDocument();
    });

    it('renders with a single recommendation', () => {
      const analysis = createAnalysis({
        recommendations: ['Only one recommendation'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText(/Only one recommendation/)).toBeInTheDocument();
      expect(screen.queryByText(/more\.\.\./)).not.toBeInTheDocument();
    });

    it('renders with exactly two recommendations without truncation text', () => {
      const analysis = createAnalysis({
        recommendations: ['First rec', 'Second rec'],
      });
      render(<ContentAnalysisResults analysis={analysis} />);

      expect(screen.getByText(/First rec/)).toBeInTheDocument();
      expect(screen.getByText(/Second rec/)).toBeInTheDocument();
      expect(screen.queryByText(/more\.\.\./)).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // isLoading default prop
  // -----------------------------------------------------------------------

  describe('isLoading default behavior', () => {
    it('defaults isLoading to false and does not disable buttons', () => {
      render(
        <ContentAnalysisResults
          analysis={createAnalysis()}
          onAccept={jest.fn()}
          onReject={jest.fn()}
        />,
      );

      const acceptBtn = screen.getByText('Accept & Optimize').closest('button');
      const rejectBtn = screen.getByText('Upload Different File').closest('button');

      expect(acceptBtn).not.toBeDisabled();
      expect(rejectBtn).not.toBeDisabled();
    });
  });

  // -----------------------------------------------------------------------
  // Score color classes
  // -----------------------------------------------------------------------

  describe('score color classes', () => {
    it('applies green color class for scores >= 0.8', () => {
      render(
        <ContentAnalysisResults
          analysis={createAnalysis({ qualityScore: 0.95 })}
        />,
      );

      // The 95% text should be rendered with the green color class
      const scoreElement = screen.getByText('95%');
      expect(scoreElement.className).toContain('text-green-600');
    });

    it('applies yellow color class for scores >= 0.6 and < 0.8', () => {
      render(
        <ContentAnalysisResults
          analysis={createAnalysis({ qualityScore: 0.65 })}
        />,
      );

      const scoreElement = screen.getByText('65%');
      expect(scoreElement.className).toContain('text-yellow-600');
    });

    it('applies red color class for scores < 0.6', () => {
      render(
        <ContentAnalysisResults
          analysis={createAnalysis({ qualityScore: 0.3 })}
        />,
      );

      const scoreElement = screen.getByText('30%');
      expect(scoreElement.className).toContain('text-red-600');
    });
  });
});

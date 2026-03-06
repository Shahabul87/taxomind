/**
 * Tests for BloomsMasteryLoop component
 * Tests course loading, selection, analysis execution, distribution display, and recommendations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} className={className}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, indicatorClassName }: any) => (
    <div data-testid="progress" data-value={value} className={className} data-indicator={indicatorClassName} role="progressbar" aria-valuenow={value} />
  ),
}));

let selectOnValueChange: (val: string) => void = () => {};
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => {
    selectOnValueChange = onValueChange;
    return <div data-testid="select" data-value={value}>{children}</div>;
  },
  SelectTrigger: ({ children, className }: any) => <div data-testid="select-trigger" className={className}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value} onClick={() => selectOnValueChange(value)}>{children}</div>
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { BloomsMasteryLoop } from '@/components/sam/BloomsMasteryLoop';

// ============================================================================
// TEST DATA
// ============================================================================

const mockCourses = [
  { id: 'course-1', title: 'Introduction to AI' },
  { id: 'course-2', title: 'Advanced ML' },
];

const mockAnalysis = {
  data: {
    courseLevel: {
      distribution: {
        REMEMBER: 45,
        UNDERSTAND: 35,
        APPLY: 25,
        ANALYZE: 15,
        EVALUATE: 10,
        CREATE: 5,
      },
      cognitiveDepth: 62,
      balance: 'lower-heavy',
    },
    recommendations: [
      {
        type: 'add_content',
        targetLevel: 'ANALYZE',
        description: 'Add more analytical exercises',
        priority: 'high',
        expectedImpact: 'significant',
      },
      {
        type: 'improve',
        targetLevel: 'CREATE',
        description: 'Include creative projects',
        priority: 'medium',
        expectedImpact: 'moderate',
      },
    ],
  },
};

function setupCourseFetch(courses = mockCourses) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: courses }),
  });
}

function setupAnalysisFetch(data = mockAnalysis) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

async function renderComponent(props: any = {}) {
  setupCourseFetch(props._courses ?? mockCourses);
  await act(async () => {
    render(<BloomsMasteryLoop {...props} />);
  });
}

async function renderWithAnalysis(props: any = {}) {
  await renderComponent(props);
  setupAnalysisFetch(props._analysis ?? mockAnalysis);
  await act(async () => {
    fireEvent.click(screen.getByText('Analyze'));
  });
}

// ============================================================================
// TESTS
// ============================================================================

describe('BloomsMasteryLoop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('renders the component title', async () => {
      await renderComponent();
      // The component uses &apos; which renders as the right single quote
      expect(screen.getByText(/Bloom.*s Mastery Loop/)).toBeInTheDocument();
    });

    it('renders description text', async () => {
      await renderComponent();
      expect(screen.getByText('Track cognitive depth and next-step recommendations.')).toBeInTheDocument();
    });

    it('fetches courses on mount', async () => {
      await renderComponent();
      expect(mockFetch).toHaveBeenCalledWith('/api/sam/courses/accessible');
    });

    it('renders course selector', async () => {
      await renderComponent();
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('renders course items', async () => {
      await renderComponent();
      expect(screen.getByText('Introduction to AI')).toBeInTheDocument();
      expect(screen.getByText('Advanced ML')).toBeInTheDocument();
    });

    it('auto-selects first course', async () => {
      await renderComponent();
      expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'course-1');
    });

    it('shows prompt to run analysis', async () => {
      await renderComponent();
      expect(screen.getByText(/Run the Bloom/)).toBeInTheDocument();
    });

    it('renders analyze button', async () => {
      await renderComponent();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
    });
  });

  describe('empty courses', () => {
    it('handles empty course list', async () => {
      await renderComponent({ _courses: [] });
      expect(screen.queryByTestId('select-item')).not.toBeInTheDocument();
    });

    it('disables analyze button without courses', async () => {
      await renderComponent({ _courses: [] });
      expect(screen.getByText('Analyze').closest('button')).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('shows error when course fetch returns non-OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await act(async () => {
        render(<BloomsMasteryLoop />);
      });
      expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
    });

    it('shows error when course fetch network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await act(async () => {
        render(<BloomsMasteryLoop />);
      });
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows error when analysis fails with non-OK', async () => {
      await renderComponent();
      mockFetch.mockResolvedValueOnce({ ok: false });
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze'));
      });
      expect(screen.getByText(/Failed to analyze Bloom/)).toBeInTheDocument();
    });

    it('shows error when analysis network error', async () => {
      await renderComponent();
      mockFetch.mockRejectedValueOnce(new Error('Analysis failed'));
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze'));
      });
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });
  });

  describe('analysis execution', () => {
    it('sends POST to correct endpoint', async () => {
      await renderComponent();
      setupAnalysisFetch();
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze'));
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sam/blooms-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 'course-1',
          depth: 'detailed',
          includeRecommendations: true,
        }),
      });
    });

    it('disables button while loading', async () => {
      await renderComponent();
      let resolveAnalysis!: (val: any) => void;
      mockFetch.mockReturnValueOnce(new Promise((resolve) => { resolveAnalysis = resolve; }));

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze'));
      });

      expect(screen.getByText('Analyze').closest('button')).toBeDisabled();

      await act(async () => {
        resolveAnalysis({ ok: true, json: () => Promise.resolve(mockAnalysis) });
      });
    });
  });

  describe('distribution display', () => {
    it('shows all 6 Bloom levels', async () => {
      await renderWithAnalysis();
      for (const level of ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']) {
        expect(screen.getByText(level)).toBeInTheDocument();
      }
    });

    it('shows percentages for each level', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('renders progress bars for each level', async () => {
      await renderWithAnalysis();
      const progressBars = screen.getAllByTestId('progress');
      expect(progressBars.length).toBeGreaterThanOrEqual(7); // 6 levels + 1 depth
    });
  });

  describe('course depth', () => {
    it('shows course depth heading', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Course Depth')).toBeInTheDocument();
    });

    it('shows depth score', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Depth score: 62')).toBeInTheDocument();
    });

    it('shows balance badge', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('lower-heavy')).toBeInTheDocument();
    });
  });

  describe('recommendations', () => {
    it('shows recommendations heading', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Next-step recommendations')).toBeInTheDocument();
    });

    it('shows recommendation count', async () => {
      await renderWithAnalysis();
      // Count badge shows "2"
      const badges = screen.getAllByTestId('badge');
      const countBadge = badges.find(b => b.textContent === '2');
      expect(countBadge).toBeTruthy();
    });

    it('shows recommendation descriptions', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('Add more analytical exercises')).toBeInTheDocument();
      expect(screen.getByText('Include creative projects')).toBeInTheDocument();
    });

    it('shows target level and impact', async () => {
      await renderWithAnalysis();
      expect(screen.getByText(/Target level: ANALYZE/)).toBeInTheDocument();
      expect(screen.getByText(/Target level: CREATE/)).toBeInTheDocument();
    });

    it('shows priority badges', async () => {
      await renderWithAnalysis();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('shows empty message when no recommendations', async () => {
      await renderWithAnalysis({
        _analysis: {
          data: {
            courseLevel: { distribution: {}, cognitiveDepth: 0, balance: 'balanced' },
            recommendations: [],
          },
        },
      });
      expect(screen.getByText('No recommendations yet.')).toBeInTheDocument();
    });

    it('limits recommendations to 4', async () => {
      const manyRecs = Array.from({ length: 6 }, (_, i) => ({
        type: 'add',
        targetLevel: 'APPLY',
        description: `Recommendation ${i + 1}`,
        priority: 'low',
        expectedImpact: 'minor',
      }));

      await renderWithAnalysis({
        _analysis: {
          data: {
            courseLevel: { distribution: {}, cognitiveDepth: 50, balance: 'balanced' },
            recommendations: manyRecs,
          },
        },
      });

      expect(screen.getByText('Recommendation 1')).toBeInTheDocument();
      expect(screen.getByText('Recommendation 4')).toBeInTheDocument();
      expect(screen.queryByText('Recommendation 5')).not.toBeInTheDocument();
    });
  });

  describe('course selection', () => {
    it('updates selected course', async () => {
      await renderComponent();
      await act(async () => {
        fireEvent.click(screen.getByText('Advanced ML'));
      });
      expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'course-2');
    });
  });

  describe('className prop', () => {
    it('applies custom className', async () => {
      await renderComponent({ className: 'my-custom-class' });
      expect(screen.getByTestId('card')).toHaveClass('my-custom-class');
    });
  });
});

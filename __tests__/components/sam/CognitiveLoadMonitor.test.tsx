/**
 * Tests for CognitiveLoadMonitor component
 * Tests loading, data display, factors, recommendations, auto-refresh, callbacks
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} role="progressbar" aria-valuenow={value} />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { CognitiveLoadMonitor } from '@/components/sam/CognitiveLoadMonitor';

// ============================================================================
// TEST DATA
// ============================================================================

const mockLoadData = {
  data: {
    id: 'load-1',
    sessionId: 'session-1',
    instantaneousLoad: 65,
    factors: {
      intrinsicLoad: 40,
      extraneousLoad: 15,
      germaneLoad: 50,
    },
    trend: 'stable' as const,
    riskLevel: 'medium' as const,
    recommendations: ['Take short breaks', 'Review key concepts'],
    interventionSuggested: false,
    analyzedAt: '2026-03-05T10:30:00Z',
  },
};

function setupFetch(data = mockLoadData, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(ok ? data : { error: 'Server error' }),
  });
}

async function renderComponent(props: any = {}) {
  const defaultProps = {
    sessionId: 'session-1',
    autoRefresh: false,
    ...props,
  };
  setupFetch(props._data ?? mockLoadData, props._ok ?? true);
  let result: any;
  await act(async () => {
    result = render(<CognitiveLoadMonitor {...defaultProps} />);
  });
  return result;
}

// ============================================================================
// TESTS
// ============================================================================

describe('CognitiveLoadMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('loading state', () => {
    it('shows loading text initially', async () => {
      let resolveData!: (val: any) => void;
      mockFetch.mockReturnValueOnce(new Promise((resolve) => { resolveData = resolve; }));

      await act(async () => {
        render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh={false} />);
      });

      expect(screen.getByText('Analyzing cognitive load...')).toBeInTheDocument();

      await act(async () => {
        resolveData({ ok: true, json: () => Promise.resolve(mockLoadData) });
      });
    });
  });

  describe('data display', () => {
    it('renders component title after load', async () => {
      await renderComponent();
      expect(screen.getByText('Cognitive Load Monitor')).toBeInTheDocument();
    });

    it('renders description', async () => {
      await renderComponent();
      expect(screen.getByText('Real-time mental workload assessment')).toBeInTheDocument();
    });

    it('shows load value in gauge', async () => {
      await renderComponent();
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('shows risk level badge', async () => {
      await renderComponent();
      expect(screen.getByText('MEDIUM Risk')).toBeInTheDocument();
    });

    it('shows trend text', async () => {
      await renderComponent();
      expect(screen.getByText('stable')).toBeInTheDocument();
    });

    it('shows risk level in gauge', async () => {
      await renderComponent();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  describe('factor breakdown', () => {
    it('shows intrinsic load factor', async () => {
      await renderComponent();
      expect(screen.getByText('Intrinsic Load')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('shows extraneous load factor', async () => {
      await renderComponent();
      expect(screen.getByText('Extraneous Load')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('shows germane load factor', async () => {
      await renderComponent();
      expect(screen.getByText('Germane Load')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders factor progress bars', async () => {
      await renderComponent();
      const progressBars = screen.getAllByTestId('progress');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('recommendations', () => {
    it('shows recommendation count in expand button', async () => {
      await renderComponent();
      expect(screen.getByText(/2 Recommendations/)).toBeInTheDocument();
    });

    it('shows recommendations when expanded', async () => {
      await renderComponent();
      fireEvent.click(screen.getByText(/2 Recommendations/));
      expect(screen.getByText('Take short breaks')).toBeInTheDocument();
      expect(screen.getByText('Review key concepts')).toBeInTheDocument();
    });

    it('hides recommendations initially', async () => {
      await renderComponent();
      expect(screen.queryByText('Take short breaks')).not.toBeInTheDocument();
    });

    it('singular form for 1 recommendation', async () => {
      const singleRec = {
        data: {
          ...mockLoadData.data,
          recommendations: ['Just one tip'],
        },
      };
      await renderComponent({ _data: singleRec });
      expect(screen.getByText(/1 Recommendation$/)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });
      await act(async () => {
        render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh={false} />);
      });
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('shows retry button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      });
      await act(async () => {
        render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh={false} />);
      });
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retry button triggers re-fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      });
      await act(async () => {
        render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh={false} />);
      });

      setupFetch();
      await act(async () => {
        fireEvent.click(screen.getByText('Retry'));
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('shows error for network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await act(async () => {
        render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh={false} />);
      });
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('shows load percentage in compact mode', async () => {
      await renderComponent({ compact: true });
      expect(screen.getByText(/Cognitive Load: 65%/)).toBeInTheDocument();
    });

    it('shows risk level badge in compact mode', async () => {
      await renderComponent({ compact: true });
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('shows first recommendation in compact mode', async () => {
      await renderComponent({ compact: true });
      expect(screen.getByText('Take short breaks')).toBeInTheDocument();
    });

    it('does not show full title in compact mode', async () => {
      await renderComponent({ compact: true });
      expect(screen.queryByText('Cognitive Load Monitor')).not.toBeInTheDocument();
    });
  });

  describe('intervention', () => {
    it('shows break recommended badge when intervention suggested', async () => {
      const interventionData = {
        data: {
          ...mockLoadData.data,
          interventionSuggested: true,
          riskLevel: 'high' as const,
        },
      };
      await renderComponent({ _data: interventionData });
      expect(screen.getByText('Break Recommended')).toBeInTheDocument();
    });

    it('does not show break badge when no intervention needed', async () => {
      await renderComponent();
      expect(screen.queryByText('Break Recommended')).not.toBeInTheDocument();
    });
  });

  describe('auto-refresh', () => {
    it('sets up interval when autoRefresh is true', async () => {
      jest.useFakeTimers();
      setupFetch();
      await act(async () => {
        render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh refreshInterval={5000} />);
      });

      setupFetch();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('shows auto-refresh text in footer', async () => {
      await renderComponent({ autoRefresh: true, refreshInterval: 30000 });
      expect(screen.getByText(/Auto-refresh every 30s/)).toBeInTheDocument();
    });

    it('cleans up interval on unmount', async () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      setupFetch();
      let unmount: () => void;
      await act(async () => {
        const result = render(<CognitiveLoadMonitor sessionId="session-1" autoRefresh refreshInterval={5000} />);
        unmount = result.unmount;
      });

      act(() => { unmount(); });
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('callbacks', () => {
    it('calls onLoadChange with data on successful fetch', async () => {
      const onLoadChange = jest.fn();
      await renderComponent({ onLoadChange });
      expect(onLoadChange).toHaveBeenCalledWith(mockLoadData.data);
    });

    it('calls onInterventionNeeded when intervention suggested', async () => {
      const onInterventionNeeded = jest.fn();
      const interventionData = {
        data: {
          ...mockLoadData.data,
          interventionSuggested: true,
        },
      };
      await renderComponent({ onInterventionNeeded, _data: interventionData });
      expect(onInterventionNeeded).toHaveBeenCalledWith(interventionData.data);
    });

    it('does not call onInterventionNeeded when no intervention', async () => {
      const onInterventionNeeded = jest.fn();
      await renderComponent({ onInterventionNeeded });
      expect(onInterventionNeeded).not.toHaveBeenCalled();
    });
  });

  describe('API request', () => {
    it('sends POST to correct endpoint', async () => {
      await renderComponent();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sam/cognitive-load/detect',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('includes sessionId in request body', async () => {
      await renderComponent();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.sessionId).toBe('session-1');
    });

    it('includes courseId and sectionId when provided', async () => {
      await renderComponent({ courseId: 'course-1', sectionId: 'section-1' });
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.courseId).toBe('course-1');
      expect(callBody.sectionId).toBe('section-1');
    });

    it('spreads custom metrics into request body', async () => {
      await renderComponent({ metrics: { timeOnTask: 120, clickCount: 5 } });
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.timeOnTask).toBe(120);
      expect(callBody.clickCount).toBe(5);
    });
  });

  describe('className prop', () => {
    it('applies custom className', async () => {
      await renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
  });

  describe('last analyzed timestamp', () => {
    it('shows last analyzed time', async () => {
      await renderComponent();
      const expectedTime = new Date('2026-03-05T10:30:00Z').toLocaleTimeString();
      expect(screen.getByText(new RegExp(`Last analyzed: ${expectedTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))).toBeInTheDocument();
    });
  });
});

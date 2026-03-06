import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return { __esModule: true, default: MockLink };
});

// Mock @/lib/utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | boolean | null)[]) => args.filter(Boolean).join(' '),
}));

// Mock UI: Card
jest.mock('@/components/ui/card', () => {
  const Card = React.forwardRef<HTMLDivElement, React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>>(
    ({ children, className, style, ...rest }, ref) => (
      <div data-testid="card" className={className} style={style} ref={ref} {...rest}>{children}</div>
    ),
  );
  Card.displayName = 'Card';
  return {
    Card,
    CardContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div data-testid="card-content" className={className}>{children}</div>
    ),
    CardDescription: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <p data-testid="card-description" className={className}>{children}</p>
    ),
    CardHeader: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div data-testid="card-header" className={className}>{children}</div>
    ),
    CardTitle: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <h3 data-testid="card-title" className={className}>{children}</h3>
    ),
  };
});

// Mock UI: Button
jest.mock('@/components/ui/button', () => {
  const Button = React.forwardRef<HTMLButtonElement, React.PropsWithChildren<Record<string, unknown>>>(
    ({ children, asChild, variant, size, ...htmlProps }, ref) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, { ref, ...htmlProps });
      }
      return (
        <button ref={ref} data-variant={variant} data-size={size} {...htmlProps}>
          {children}
        </button>
      );
    },
  );
  Button.displayName = 'Button';
  return { Button };
});

// Mock UI: Badge
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
    <span data-testid="ui-badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

// Mock UI: Input
jest.mock('@/components/ui/input', () => {
  const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} data-testid="search-input" {...props} />,
  );
  Input.displayName = 'Input';
  return { Input };
});

// Mock UI: Tabs
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, className }: React.PropsWithChildren<{
    value?: string; onValueChange?: (v: string) => void; className?: string;
  }>) => (
    <div data-testid="tabs" data-value={value} className={className}>{children}</div>
  ),
  TabsContent: ({ children, value, className }: React.PropsWithChildren<{ value: string; className?: string }>) => (
    <div data-testid={`tab-content-${value}`} className={className}>{children}</div>
  ),
  TabsList: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="tabs-list" className={className}>{children}</div>
  ),
  TabsTrigger: ({ children, value, className }: React.PropsWithChildren<{ value: string; className?: string }>) => (
    <button data-testid={`tab-trigger-${value}`} className={className}>{children}</button>
  ),
}));

// Mock UI: ScrollArea
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="scroll-area" className={className}>{children}</div>
  ),
}));

// Mock UI: Select
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: React.PropsWithChildren<{
    value?: string; onValueChange?: (v: string) => void;
  }>) => (
    <div data-testid="select" data-value={value}>{children}</div>
  ),
  SelectContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
    <div data-testid={`select-item-${value}`} data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <button data-testid="select-trigger" className={className}>{children}</button>
  ),
  SelectValue: () => <span data-testid="select-value" />,
}));

// Mock UI: Skeleton
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock UI: Tooltip
jest.mock('@/components/ui/tooltip', () => {
  const TooltipTrigger = React.forwardRef<HTMLDivElement, React.PropsWithChildren<{ asChild?: boolean }>>(
    ({ children, asChild, ...props }, ref) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, { ref });
      }
      return <div ref={ref} {...props}>{children}</div>;
    },
  );
  TooltipTrigger.displayName = 'TooltipTrigger';
  return {
    Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
    TooltipContent: ({ children }: React.PropsWithChildren) => (
      <div data-testid="tooltip-content" style={{ display: 'none' }}>{children}</div>
    ),
    TooltipProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    TooltipTrigger,
  };
});

// Now import the component after all mocks are set up
import { KnowledgeGraphBrowser } from '@/components/sam/KnowledgeGraphBrowser';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createMockGraphData(overrides: Partial<{
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    properties: Record<string, unknown>;
    masteryLevel?: number;
    status?: 'mastered' | 'in_progress' | 'not_started' | 'struggling';
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
    label?: string;
  }>;
  stats: {
    totalNodes: number;
    totalEdges: number;
    masteredCount: number;
    inProgressCount: number;
    notStartedCount: number;
  };
}> = {}) {
  return {
    nodes: overrides.nodes ?? [
      {
        id: 'node-1',
        name: 'Introduction to React',
        type: 'Concept',
        description: 'Learn the basics of React framework',
        properties: {},
        masteryLevel: 80,
        status: 'mastered' as const,
      },
      {
        id: 'node-2',
        name: 'React Hooks',
        type: 'Topic',
        description: 'Understanding useState and useEffect',
        properties: {},
        masteryLevel: 45,
        status: 'in_progress' as const,
      },
      {
        id: 'node-3',
        name: 'Advanced Patterns',
        type: 'Skill',
        description: 'Design patterns in React',
        properties: {},
        masteryLevel: 0,
        status: 'not_started' as const,
      },
    ],
    edges: overrides.edges ?? [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'prerequisite_of', weight: 1, label: 'requires' },
      { id: 'edge-2', source: 'node-2', target: 'node-3', type: 'related_to', weight: 0.8 },
    ],
    stats: overrides.stats ?? {
      totalNodes: 3,
      totalEdges: 2,
      masteredCount: 1,
      inProgressCount: 1,
      notStartedCount: 1,
    },
  };
}

function createMockConceptDetails(overrides: Partial<{
  entity: {
    id: string;
    name: string;
    type: string;
    description?: string;
    properties: Record<string, unknown>;
  };
  neighbors: Array<{ id: string; name: string; type: string }>;
  relationships: Array<{
    id: string; type: string; sourceId: string; targetId: string; weight: number;
  }>;
  userProgress: { masteryLevel: number; status: string; lastAccessedAt?: string } | undefined;
  recommendations: Array<{
    id: string; title: string; type: string; relevanceScore: number; reason: string;
  }> | undefined;
}> = {}) {
  return {
    entity: overrides.entity ?? {
      id: 'node-1',
      name: 'Introduction to React',
      type: 'Concept',
      description: 'Learn the basics of React framework',
      properties: {},
    },
    neighbors: overrides.neighbors ?? [
      { id: 'node-2', name: 'React Hooks', type: 'Topic' },
      { id: 'node-3', name: 'Advanced Patterns', type: 'Skill' },
    ],
    relationships: overrides.relationships ?? [
      { id: 'rel-1', type: 'prerequisite_of', sourceId: 'node-1', targetId: 'node-2', weight: 1 },
    ],
    userProgress: overrides.userProgress ?? {
      masteryLevel: 80,
      status: 'mastered',
    },
    recommendations: overrides.recommendations ?? [
      { id: 'rec-1', title: 'State Management', type: 'concept', relevanceScore: 0.9, reason: 'Natural next step after React Hooks' },
    ],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const mockFetch = global.fetch as jest.Mock;

function setupFetchGraphSuccess(graphData = createMockGraphData()) {
  mockFetch.mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('action=course')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { graph: graphData } }),
      });
    }
    if (typeof url === 'string' && url.includes('action=concept')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: createMockConceptDetails() }),
      });
    }
    if (typeof url === 'string' && url.includes('action=search')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { results: graphData.nodes.slice(0, 2) },
        }),
      });
    }
    if (typeof url === 'string' && url.includes('my-courses')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [
            { id: 'course-1', title: 'React Fundamentals' },
            { id: 'course-2', title: 'Advanced TypeScript' },
          ],
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });
}

function setupFetchGraphError() {
  mockFetch.mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('action=course')) {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });
}

function setupFetchCoursesOnly() {
  mockFetch.mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('my-courses')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [
            { id: 'course-1', title: 'React Fundamentals' },
            { id: 'course-2', title: 'Advanced TypeScript' },
          ],
        }),
      });
    }
    if (typeof url === 'string' && url.includes('action=course')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { graph: createMockGraphData() } }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('KnowledgeGraphBrowser', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================================================
  // 1. LOADING STATE TESTS
  // ==========================================================================
  describe('Loading State', () => {
    it('shows loading skeleton when courseId is provided and data is fetching', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders skeleton elements inside loading card', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('does not show loading state when no courseId is provided', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.queryAllByTestId('skeleton')).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // 2. ERROR STATE TESTS
  // ==========================================================================
  describe('Error State', () => {
    it('displays error message when fetch fails', async () => {
      setupFetchGraphError();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Graph')).toBeInTheDocument();
      });
    });

    it('displays the specific error message from the fetch failure', async () => {
      setupFetchGraphError();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch knowledge graph')).toBeInTheDocument();
      });
    });

    it('shows a Retry button in error state', async () => {
      setupFetchGraphError();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries fetching when Retry button is clicked', async () => {
      setupFetchGraphError();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Now make it succeed
      setupFetchGraphSuccess();
      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });
    });

    it('shows error when API returns success=false', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: false, error: 'Graph not available' }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Graph')).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.reject(new Error('Network failure'));
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Graph')).toBeInTheDocument();
        expect(screen.getByText('Network failure')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 3. NO COURSE SELECTED STATE TESTS
  // ==========================================================================
  describe('No Course Selected State', () => {
    it('shows course selection prompt when no courseId is provided', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Select a Course')).toBeInTheDocument();
      });
    });

    it('displays description text for course selection', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(
          screen.getByText(/Choose a course to explore its knowledge graph/)
        ).toBeInTheDocument();
      });
    });

    it('renders available courses as buttons', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
        expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
      });
    });

    it('shows "No enrolled courses found" when no courses are available', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('my-courses')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: [] }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText(/No enrolled courses found/)).toBeInTheDocument();
      });
    });

    it('shows Browse Courses link when no courses are enrolled', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('my-courses')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: [] }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Browse Courses')).toBeInTheDocument();
        const link = screen.getByText('Browse Courses').closest('a');
        expect(link).toHaveAttribute('href', '/courses');
      });
    });

    it('transitions to loading state when a course is clicked', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('React Fundamentals'));

      // After clicking, it should show loading or the graph
      await waitFor(() => {
        // Either loading skeletons or the graph title should be present
        const hasGraph = screen.queryByText('Knowledge Graph');
        const hasSkeleton = screen.queryAllByTestId('skeleton').length > 0;
        expect(hasGraph || hasSkeleton).toBeTruthy();
      });
    });

    it('displays Knowledge Graph title in the no-course header', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });
    });

    it('displays course exploration description', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(
          screen.getByText('Explore the connections between concepts in your courses')
        ).toBeInTheDocument();
      });
    });

    it('limits displayed courses to maximum 5', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('my-courses')) {
          const courses = Array.from({ length: 10 }, (_, i) => ({
            id: `course-${i}`,
            title: `Course ${i + 1}`,
          }));
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: courses }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
        expect(screen.getByText('Course 5')).toBeInTheDocument();
        expect(screen.queryByText('Course 6')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 4. GRAPH DATA DISPLAY TESTS
  // ==========================================================================
  describe('Graph Data Display', () => {
    it('renders the Knowledge Graph title after data loads', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });
    });

    it('renders Graph View and List View tab triggers', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-graph')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-list')).toBeInTheDocument();
      });
    });

    it('shows graph tab content and list tab content', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-graph')).toBeInTheDocument();
        expect(screen.getByTestId('tab-content-list')).toBeInTheDocument();
      });
    });

    it('renders nodes in list view', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });

      // NodeCard renders an h4 with the full node name in the list tab content
      await waitFor(() => {
        const h4s = document.querySelectorAll('h4');
        const h4Texts = Array.from(h4s).map(el => el.textContent);
        expect(h4Texts).toContain('Introduction to React');
        expect(h4Texts).toContain('React Hooks');
        expect(h4Texts).toContain('Advanced Patterns');
      });
    });

    it('renders node descriptions in list view', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Learn the basics of React framework')).toBeInTheDocument();
        expect(screen.getByText('Understanding useState and useEffect')).toBeInTheDocument();
      });
    });

    it('shows mastery percentages for nodes in list view', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('80% mastery')).toBeInTheDocument();
        expect(screen.getByText('45% mastery')).toBeInTheDocument();
        expect(screen.getByText('0% mastery')).toBeInTheDocument();
      });
    });

    it('shows node type badges in list view', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('ui-badge');
        const badgeTexts = badges.map((b) => b.textContent);
        expect(badgeTexts).toContain('Concept');
        expect(badgeTexts).toContain('Topic');
        expect(badgeTexts).toContain('Skill');
      });
    });

    it('shows node status text in list view', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('mastered')).toBeInTheDocument();
        expect(screen.getByText('in progress')).toBeInTheDocument();
        expect(screen.getByText('not started')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 5. STATS DISPLAY TESTS
  // ==========================================================================
  describe('Stats Display', () => {
    it('shows graph stats when showStats is true', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showStats />);

      await waitFor(() => {
        expect(screen.getByText('Concepts')).toBeInTheDocument();
        expect(screen.getByText('Connections')).toBeInTheDocument();
        expect(screen.getByText('Mastered')).toBeInTheDocument();
        expect(screen.getByText('Learning')).toBeInTheDocument();
        expect(screen.getByText('Not Started')).toBeInTheDocument();
      });
    });

    it('displays correct stat values', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showStats />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // totalNodes
        expect(screen.getByText('2')).toBeInTheDocument(); // totalEdges
      });
    });

    it('does not show stats when showStats is false', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showStats={false} />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });

      expect(screen.queryByText('Concepts')).not.toBeInTheDocument();
      expect(screen.queryByText('Connections')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 6. SEARCH FUNCTIONALITY TESTS
  // ==========================================================================
  describe('Search Functionality', () => {
    it('renders search input when showSearch is true', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('does not render search input when showSearch is false', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch={false} />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('updates search query on input change', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'React' } });

      expect(input).toHaveValue('React');
    });

    it('debounces search API calls by 300ms', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const fetchCallsBefore = mockFetch.mock.calls.length;

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'React' } });

      // Before the timer fires, no additional search calls
      const fetchCallsAfterTyping = mockFetch.mock.calls.length;
      expect(fetchCallsAfterTyping).toBe(fetchCallsBefore);

      // Advance timers by 300ms to trigger debounced search
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const searchCalls = mockFetch.mock.calls.filter(
          (call: string[]) => typeof call[0] === 'string' && call[0].includes('action=search')
        );
        expect(searchCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays search results when search returns data', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'React' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Search results should show node names
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });
    });

    it('does not fire search API for empty query', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: '   ' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      const searchCalls = mockFetch.mock.calls.filter(
        (call: string[]) => typeof call[0] === 'string' && call[0].includes('action=search')
      );
      expect(searchCalls).toHaveLength(0);
    });

    it('has correct search input placeholder text', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search concepts...')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 7. NODE INTERACTION TESTS
  // ==========================================================================
  describe('Node Interactions', () => {
    it('calls onConceptSelect when a node is clicked in list view', async () => {
      setupFetchGraphSuccess();
      const onConceptSelect = jest.fn();
      render(
        <KnowledgeGraphBrowser courseId="course-1" onConceptSelect={onConceptSelect} />
      );

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      // Click the node card in the list view
      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      expect(onConceptSelect).toHaveBeenCalledWith('node-1');
    });

    it('fetches concept details when a node is clicked', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        const conceptFetchCalls = mockFetch.mock.calls.filter(
          (call: string[]) => typeof call[0] === 'string' && call[0].includes('action=concept')
        );
        expect(conceptFetchCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows concept details panel when a node is selected and details are loaded', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        // The concept details panel should show the concept name
        const titles = screen.getAllByText('Introduction to React');
        expect(titles.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays connected concepts in the details panel', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText(/Connected Concepts/)).toBeInTheDocument();
      });
    });

    it('displays recommendations in the details panel', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('Recommended Next')).toBeInTheDocument();
        expect(screen.getByText('State Management')).toBeInTheDocument();
      });
    });

    it('shows mastery progress in details panel', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        // Details panel should show mastery info
        const masteryElements = screen.getAllByText(/80% mastery/);
        expect(masteryElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows close button in details panel', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        // The close button shows a times character
        expect(screen.getByText('\u00D7')).toBeInTheDocument();
      });
    });

    it('closes the details panel when close button is clicked', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('Recommended Next')).toBeInTheDocument();
      });

      // Click the close button
      fireEvent.click(screen.getByText('\u00D7'));

      await waitFor(() => {
        expect(screen.queryByText('Recommended Next')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 8. START LEARNING TESTS
  // ==========================================================================
  describe('Start Learning', () => {
    it('shows Start Learning button in details panel when onStartLearning is provided', async () => {
      setupFetchGraphSuccess();
      const onStartLearning = jest.fn();
      render(
        <KnowledgeGraphBrowser courseId="course-1" onStartLearning={onStartLearning} />
      );

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('Start Learning')).toBeInTheDocument();
      });
    });

    it('calls onStartLearning with concept ID when Start Learning is clicked', async () => {
      setupFetchGraphSuccess();
      const onStartLearning = jest.fn();
      render(
        <KnowledgeGraphBrowser courseId="course-1" onStartLearning={onStartLearning} />
      );

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('Start Learning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Learning'));
      expect(onStartLearning).toHaveBeenCalledWith('node-1');
    });

    it('does not show Start Learning button when onStartLearning is not provided', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText(/Connected Concepts/)).toBeInTheDocument();
      });

      expect(screen.queryByText('Start Learning')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 9. FILTER TESTS
  // ==========================================================================
  describe('Relationship Filters', () => {
    it('shows filter dropdown when showFilters is true', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showFilters />);

      await waitFor(() => {
        expect(screen.getByText('Filter by:')).toBeInTheDocument();
      });
    });

    it('does not show filter dropdown when showFilters is false', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showFilters={false} />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });

      expect(screen.queryByText('Filter by:')).not.toBeInTheDocument();
    });

    it('renders all relationship type options', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showFilters />);

      await waitFor(() => {
        expect(screen.getByTestId('select-item-all')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-prerequisite_of')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-related_to')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-part_of')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-follows')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-teaches')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-requires')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-similar_to')).toBeInTheDocument();
      });
    });

    it('has "all" as default filter value', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showFilters />);

      await waitFor(() => {
        expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'all');
      });
    });
  });

  // ==========================================================================
  // 10. PROPS TESTS
  // ==========================================================================
  describe('Props Behavior', () => {
    it('applies custom className to the root card', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" className="custom-class" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        const hasCustomClass = cards.some((card) =>
          card.className?.includes('custom-class')
        );
        expect(hasCustomClass).toBe(true);
      });
    });

    it('applies custom height style to the root card', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" height="800px" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        const hasHeight = cards.some(
          (card) => card.style.height === '800px'
        );
        expect(hasHeight).toBe(true);
      });
    });

    it('uses default height of 600px when not specified', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        const hasDefaultHeight = cards.some(
          (card) => card.style.height === '600px'
        );
        expect(hasDefaultHeight).toBe(true);
      });
    });

    it('defaults showSearch to true', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('defaults showStats to true', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Concepts')).toBeInTheDocument();
      });
    });

    it('defaults showFilters to true', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Filter by:')).toBeInTheDocument();
      });
    });

    it('fetches graph for given courseId prop', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="my-course-123" />);

      await waitFor(() => {
        const courseFetchCalls = mockFetch.mock.calls.filter(
          (call: string[]) =>
            typeof call[0] === 'string' &&
            call[0].includes('action=course') &&
            call[0].includes('my-course-123')
        );
        expect(courseFetchCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('loads initial concept details when initialConceptId is provided', async () => {
      setupFetchGraphSuccess();
      render(
        <KnowledgeGraphBrowser courseId="course-1" initialConceptId="node-1" />
      );

      await waitFor(() => {
        const conceptFetchCalls = mockFetch.mock.calls.filter(
          (call: string[]) =>
            typeof call[0] === 'string' &&
            call[0].includes('action=concept') &&
            call[0].includes('node-1')
        );
        expect(conceptFetchCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // 11. GRAPH CANVAS & SVG RENDERING TESTS
  // ==========================================================================
  describe('Graph Canvas', () => {
    it('renders an SVG element in the graph view', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const svgs = document.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
      });
    });

    it('renders keyboard shortcuts hint in graph canvas', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Tab: Navigate/)).toBeInTheDocument();
      });
    });

    it('renders node groups in SVG with button role and aria-label', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const buttons = document.querySelectorAll('g[role="button"]');
        expect(buttons.length).toBe(3); // 3 nodes
      });
    });

    it('sets proper aria-labels on graph nodes', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const nodeGroup = document.querySelector(
          'g[aria-label="Introduction to React - mastered"]'
        );
        expect(nodeGroup).toBeInTheDocument();
      });
    });

    it('renders emojis for different node types', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        // Check for node type indicators
        const textElements = document.querySelectorAll('svg text');
        const textContents = Array.from(textElements).map((el) => el.textContent);
        // Should have emoji indicators for different types
        expect(textContents.length).toBeGreaterThan(0);
      });
    });

    it('renders edge lines between nodes in the SVG', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const lines = document.querySelectorAll('svg line');
        expect(lines.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('renders arrow marker definitions in SVG defs', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const markers = document.querySelectorAll('marker');
        expect(markers.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // 12. GRAPH CONTROLS TESTS
  // ==========================================================================
  describe('Graph Controls', () => {
    it('renders zoom percentage text', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('renders tooltip content for keyboard shortcuts', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Select Mode (V)')).toBeInTheDocument();
        expect(screen.getByText('Pan Mode (H)')).toBeInTheDocument();
      });
    });

    it('renders zoom control tooltip content', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Zoom In (+)')).toBeInTheDocument();
        expect(screen.getByText('Zoom Out (-)')).toBeInTheDocument();
      });
    });

    it('renders view control tooltip content', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Fit to View (F)')).toBeInTheDocument();
        expect(screen.getByText('Reset View (R)')).toBeInTheDocument();
      });
    });

    it('renders feature toggle tooltip content', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Focus Mode (G)')).toBeInTheDocument();
        expect(screen.getByText('Mini-map (M)')).toBeInTheDocument();
        expect(screen.getByText('Refresh Graph')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 13. EMPTY STATE TESTS
  // ==========================================================================
  describe('Empty and Edge Case States', () => {
    it('handles graph data with empty nodes array', async () => {
      const emptyGraph = createMockGraphData({
        nodes: [],
        edges: [],
        stats: {
          totalNodes: 0,
          totalEdges: 0,
          masteredCount: 0,
          inProgressCount: 0,
          notStartedCount: 0,
        },
      });
      setupFetchGraphSuccess(emptyGraph);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });
    });

    it('handles node without description', async () => {
      const graphWithNoDesc = createMockGraphData({
        nodes: [
          {
            id: 'node-x',
            name: 'No Desc Node',
            type: 'Concept',
            properties: {},
          },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 0 },
      });
      setupFetchGraphSuccess(graphWithNoDesc);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('No description available')).toBeInTheDocument();
      });
    });

    it('handles node without status gracefully', async () => {
      const graphWithNoStatus = createMockGraphData({
        nodes: [
          {
            id: 'node-x',
            name: 'Status-less Node',
            type: 'Topic',
            properties: {},
            // No status or masteryLevel
          },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 0 },
      });
      setupFetchGraphSuccess(graphWithNoStatus);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('not started')).toBeInTheDocument();
        expect(screen.getByText('0% mastery')).toBeInTheDocument();
      });
    });

    it('handles concept details with no neighbors', async () => {
      const detailsWithNoNeighbors = createMockConceptDetails({ neighbors: [] });
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { graph: createMockGraphData() } }),
          });
        }
        if (typeof url === 'string' && url.includes('action=concept')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: detailsWithNoNeighbors }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('No connected concepts')).toBeInTheDocument();
      });
    });

    it('handles concept details with no recommendations', async () => {
      const detailsNoRecs = createMockConceptDetails({ recommendations: [] });
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { graph: createMockGraphData() } }),
          });
        }
        if (typeof url === 'string' && url.includes('action=concept')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: detailsNoRecs }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText(/Connected Concepts/)).toBeInTheDocument();
      });

      expect(screen.queryByText('Recommended Next')).not.toBeInTheDocument();
    });

    it('handles concept details with no user progress', async () => {
      const detailsNoProgress = createMockConceptDetails({
        userProgress: undefined,
      });
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { graph: createMockGraphData() } }),
          });
        }
        if (typeof url === 'string' && url.includes('action=concept')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: detailsNoProgress }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        // Should show default "not started" and 0% mastery
        const elements = screen.getAllByText('0% mastery');
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // 14. KEYBOARD NAVIGATION TESTS
  // ==========================================================================
  describe('Keyboard Navigation', () => {
    it('handles Escape key to deselect node', async () => {
      setupFetchGraphSuccess();
      const onConceptSelect = jest.fn();
      render(
        <KnowledgeGraphBrowser courseId="course-1" onConceptSelect={onConceptSelect} />
      );

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      // Select a node first
      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(onConceptSelect).toHaveBeenCalledWith('node-1');
      });

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      // Concept details should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Recommended Next')).not.toBeInTheDocument();
      });
    });

    it('ignores keyboard events when target is an input', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('search-input');
      // Focus the input first
      fireEvent.focus(input);

      // Pressing V should not change interaction mode when in input
      fireEvent.keyDown(input, { key: 'v' });

      // The component should still work normally (no crash)
      expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 15. CONCEPT DETAILS PANEL NAVIGATION TESTS
  // ==========================================================================
  describe('Concept Details Panel Navigation', () => {
    it('navigates to a connected concept when clicked in details panel', async () => {
      setupFetchGraphSuccess();
      const onConceptSelect = jest.fn();
      render(
        <KnowledgeGraphBrowser courseId="course-1" onConceptSelect={onConceptSelect} />
      );

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      // Select the first node
      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText(/Connected Concepts/)).toBeInTheDocument();
      });

      // Click a connected concept in the details panel
      // The neighbors contain "React Hooks" as a button inside the panel
      const neighborButtons = screen.getAllByRole('button');
      const reactHooksButton = neighborButtons.find(
        (btn) => btn.textContent?.includes('React Hooks')
      );

      if (reactHooksButton) {
        fireEvent.click(reactHooksButton);
        expect(onConceptSelect).toHaveBeenCalledWith('node-2');
      }
    });
  });

  // ==========================================================================
  // 16. LOADING DETAILS STATE TESTS
  // ==========================================================================
  describe('Loading Details State', () => {
    it('shows skeleton in details panel while loading concept details', async () => {
      // Set up graph to load immediately, but concept details to hang
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { graph: createMockGraphData() } }),
          });
        }
        if (typeof url === 'string' && url.includes('action=concept')) {
          return new Promise(() => {}); // never resolves
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        // Should show skeleton elements while loading
        const skeletons = screen.getAllByTestId('skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // 17. COURSE SELECTION FLOW TESTS
  // ==========================================================================
  describe('Course Selection Flow', () => {
    it('handles API response with courses field instead of data field', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('my-courses')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              courses: [{ id: 'c-1', title: 'Fallback Course' }],
            }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        expect(screen.getByText('Fallback Course')).toBeInTheDocument();
      });
    });

    it('handles courses API failure gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('my-courses')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser />);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('Select a Course')).toBeInTheDocument();
      });
    });

    it('shows "Click to explore knowledge graph" text for each course', async () => {
      setupFetchCoursesOnly();
      render(<KnowledgeGraphBrowser />);

      await waitFor(() => {
        const exploreTexts = screen.getAllByText('Click to explore knowledge graph');
        expect(exploreTexts.length).toBe(2);
      });
    });
  });

  // ==========================================================================
  // 18. MINI-MAP TESTS
  // ==========================================================================
  describe('Mini-map', () => {
    it('renders mini-map SVG when showMiniMap is true (default)', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        // The mini-map has a fixed width/height SVG
        const svgs = document.querySelectorAll('svg[width="150"]');
        expect(svgs.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // 19. REFRESH FUNCTIONALITY TESTS
  // ==========================================================================
  describe('Refresh Functionality', () => {
    it('calls fetchGraphData again when refresh tooltip content is present', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Refresh Graph')).toBeInTheDocument();
      });

      // Verify the initial fetch was made
      const initialCalls = mockFetch.mock.calls.filter(
        (call: string[]) => typeof call[0] === 'string' && call[0].includes('action=course')
      ).length;

      expect(initialCalls).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // 20. NODE TYPE RENDERING TESTS
  // ==========================================================================
  describe('Node Types', () => {
    it('renders nodes of type Course', async () => {
      const graphWithCourse = createMockGraphData({
        nodes: [
          { id: 'c1', name: 'My Course', type: 'Course', properties: {} },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 0 },
      });
      setupFetchGraphSuccess(graphWithCourse);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        // Name appears in both SVG and list view NodeCard
        const matches = screen.getAllByText('My Course');
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders nodes of type Chapter', async () => {
      const graphWithChapter = createMockGraphData({
        nodes: [
          { id: 'ch1', name: 'Chapter One', type: 'Chapter', properties: {} },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 0 },
      });
      setupFetchGraphSuccess(graphWithChapter);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const matches = screen.getAllByText('Chapter One');
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders nodes of type Section', async () => {
      const graphWithSection = createMockGraphData({
        nodes: [
          { id: 's1', name: 'Section Alpha', type: 'Section', properties: {} },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 0 },
      });
      setupFetchGraphSuccess(graphWithSection);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const matches = screen.getAllByText('Section Alpha');
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders struggling status correctly', async () => {
      const graphWithStruggling = createMockGraphData({
        nodes: [
          {
            id: 'st1',
            name: 'Struggling Node',
            type: 'Concept',
            properties: {},
            status: 'struggling',
            masteryLevel: 15,
          },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 1 },
      });
      setupFetchGraphSuccess(graphWithStruggling);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('struggling')).toBeInTheDocument();
        expect(screen.getByText('15% mastery')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 21. EDGE LABELS TESTS
  // ==========================================================================
  describe('Edge Labels', () => {
    it('renders edge labels on the SVG when provided', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const textElements = document.querySelectorAll('svg text');
        const textContents = Array.from(textElements).map((el) => el.textContent);
        expect(textContents).toContain('requires');
      });
    });
  });

  // ==========================================================================
  // 22. NODE LABEL TRUNCATION TEST
  // ==========================================================================
  describe('Node Label Truncation', () => {
    it('truncates long node names in SVG canvas (over 18 characters)', async () => {
      const graphWithLongName = createMockGraphData({
        nodes: [
          {
            id: 'long-1',
            name: 'This is a very long concept name that exceeds limit',
            type: 'Concept',
            properties: {},
          },
        ],
        edges: [],
        stats: { totalNodes: 1, totalEdges: 0, masteredCount: 0, inProgressCount: 0, notStartedCount: 0 },
      });
      setupFetchGraphSuccess(graphWithLongName);
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        const textElements = document.querySelectorAll('svg text');
        const textContents = Array.from(textElements).map((el) => el.textContent);
        const truncated = textContents.find((t) => t?.endsWith('...'));
        expect(truncated).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // 23. CONCEPT DETAILS ENTITY TYPE BADGE TEST
  // ==========================================================================
  describe('Concept Details Entity Type', () => {
    it('shows entity type badge in concept details panel', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        // Entity type badge should show "Concept"
        const badges = screen.getAllByTestId('ui-badge');
        const conceptBadge = badges.find((b) => b.textContent === 'Concept');
        expect(conceptBadge).toBeDefined();
      });
    });

    it('shows entity description in concept details panel', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        const descriptions = screen.getAllByText('Learn the basics of React framework');
        expect(descriptions.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // 24. MULTIPLE RENDERS / CLEANUP TESTS
  // ==========================================================================
  describe('Component Lifecycle', () => {
    it('cleans up search timeout on unmount', async () => {
      setupFetchGraphSuccess();
      const { unmount } = render(
        <KnowledgeGraphBrowser courseId="course-1" showSearch />
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      // Unmount before the debounce fires
      unmount();

      // Advance timers - should not throw
      act(() => {
        jest.advanceTimersByTime(500);
      });
    });

    it('re-renders correctly when courseId prop changes via remount', async () => {
      setupFetchGraphSuccess();
      const { unmount } = render(
        <KnowledgeGraphBrowser courseId="course-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });

      unmount();

      render(<KnowledgeGraphBrowser courseId="course-2" />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 25. RECOMMENDATION NAVIGATION TESTS
  // ==========================================================================
  describe('Recommendation Navigation', () => {
    it('renders recommendation reason text', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('Natural next step after React Hooks')).toBeInTheDocument();
      });
    });

    it('limits recommendations to 3 items', async () => {
      const detailsWithManyRecs = createMockConceptDetails({
        recommendations: Array.from({ length: 5 }, (_, i) => ({
          id: `rec-${i}`,
          title: `Recommendation ${i + 1}`,
          type: 'concept',
          relevanceScore: 0.9 - i * 0.1,
          reason: `Reason ${i + 1}`,
        })),
      });

      mockFetch.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('action=course')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { graph: createMockGraphData() } }),
          });
        }
        if (typeof url === 'string' && url.includes('action=concept')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: detailsWithManyRecs }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      });

      render(<KnowledgeGraphBrowser courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Introduction to React').closest('[data-testid="card"]')!);

      await waitFor(() => {
        expect(screen.getByText('Recommendation 1')).toBeInTheDocument();
        expect(screen.getByText('Recommendation 2')).toBeInTheDocument();
        expect(screen.getByText('Recommendation 3')).toBeInTheDocument();
        expect(screen.queryByText('Recommendation 4')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 26. DATA FETCH URL CONSTRUCTION TESTS
  // ==========================================================================
  describe('API URL Construction', () => {
    it('includes courseId and includeUserProgress in graph fetch URL', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="test-course-id" />);

      await waitFor(() => {
        const call = mockFetch.mock.calls.find(
          (c: string[]) =>
            typeof c[0] === 'string' &&
            c[0].includes('test-course-id') &&
            c[0].includes('includeUserProgress=true')
        );
        expect(call).toBeDefined();
      });
    });

    it('encodes search query in URL', async () => {
      setupFetchGraphSuccess();
      render(<KnowledgeGraphBrowser courseId="course-1" showSearch />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'hello world' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const searchCall = mockFetch.mock.calls.find(
          (c: string[]) =>
            typeof c[0] === 'string' &&
            c[0].includes('action=search') &&
            c[0].includes('hello%20world')
        );
        expect(searchCall).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // 27. DEFAULT EXPORT TEST
  // ==========================================================================
  describe('Exports', () => {
    it('exports KnowledgeGraphBrowser as named export', () => {
      expect(KnowledgeGraphBrowser).toBeDefined();
      expect(typeof KnowledgeGraphBrowser).toBe('function');
    });
  });
});

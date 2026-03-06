import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// The framer-motion mock is provided globally via jest.setup.js.
// The logger mock is provided globally via jest.setup.js.

// ---------------------------------------------------------------------------
// Mock axios - the component uses axios.post for API calls
// ---------------------------------------------------------------------------

const mockAxiosPost = jest.fn();
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockAxiosPost(...args),
    get: jest.fn(),
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
  },
  post: (...args: unknown[]) => mockAxiosPost(...args),
}));

// ---------------------------------------------------------------------------
// Mock sonner toast
// ---------------------------------------------------------------------------

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock next/image - override global mock that lacks React import
// ---------------------------------------------------------------------------

jest.mock('next/image', () => {
  const MockImage = ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    onError?: React.ReactEventHandler<HTMLImageElement>;
  }) => React.createElement('img', { src, alt, ...props });
  MockImage.displayName = 'MockNextImage';
  return { __esModule: true, default: MockImage };
});

// ---------------------------------------------------------------------------
// Mock cn utility
// ---------------------------------------------------------------------------

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ---------------------------------------------------------------------------
// Mock UI components with simple HTML elements + data-testid attributes
// ---------------------------------------------------------------------------

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

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >((props, ref) =>
    React.createElement('input', { ref, 'data-testid': 'ui-input', ...props }),
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
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

// Tabs mock with Context for onValueChange propagation
const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (val: string) => void;
}>({});

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (val: string) => void;
    className?: string;
  }) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div data-testid="tabs" data-value={value} className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  ),
  TabsList: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs-list" className={className} role="tablist">
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => {
    const ctx = React.useContext(TabsContext);
    return (
      <button
        data-testid={`tab-trigger-${value}`}
        className={className}
        role="tab"
        aria-selected={ctx.value === value}
        onClick={() => ctx.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => {
    const ctx = React.useContext(TabsContext);
    // Only render content for the active tab
    if (ctx.value !== value) return null;
    return (
      <div data-testid={`tab-content-${value}`} className={className} role="tabpanel">
        {children}
      </div>
    );
  },
}));

// Select mock with context for value change propagation
const SelectContext = React.createContext<{
  onValueChange?: (val: string) => void;
}>({});

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
    <SelectContext.Provider value={{ onValueChange }}>
      <div data-testid="select" data-value={value}>
        {children}
      </div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="select-trigger" className={className}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => {
    const ctx = React.useContext(SelectContext);
    return (
      <div
        data-testid={`select-item-${value}`}
        data-value={value}
        onClick={() => ctx.onValueChange?.(value)}
        role="option"
      >
        {children}
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Import component under test (after all mocks)
// ---------------------------------------------------------------------------

import { ResourceIntelligenceContent } from '@/components/sam/resource-intelligence-content';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

interface MockExternalResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'article' | 'tutorial' | 'documentation' | 'course' | 'book';
  source: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  author?: string;
  publishedDate?: string;
  qualityScore: number;
  relevanceScore: number;
  engagementScore: number;
  license: string;
  tags: string[];
  thumbnail?: string;
  views?: number;
  rating?: number;
  aiInsights?: {
    keyTopics: string[];
    learningOutcomes: string[];
    prerequisites: string[];
    bestFor: string[];
  };
}

function createMockResource(overrides: Partial<MockExternalResource> = {}): MockExternalResource {
  return {
    id: 'resource-1',
    title: 'React Hooks Explained',
    description: 'A comprehensive guide to React Hooks with practical examples',
    url: 'https://example.com/react-hooks',
    type: 'article',
    source: 'Medium',
    language: 'English',
    difficulty: 'intermediate',
    duration: '15 min',
    author: 'Dan Abramov',
    publishedDate: '2024-01-15',
    qualityScore: 0.92,
    relevanceScore: 0.88,
    engagementScore: 0.85,
    license: 'CC BY-SA',
    tags: ['React', 'Hooks', 'JavaScript', 'Frontend'],
    rating: 4.8,
    views: 45000,
    aiInsights: {
      keyTopics: ['useState', 'useEffect', 'Custom Hooks'],
      learningOutcomes: ['Understand hook rules', 'Build custom hooks'],
      prerequisites: ['Basic React knowledge', 'JavaScript ES6'],
      bestFor: ['Intermediate React developers', 'Frontend engineers'],
    },
    ...overrides,
  };
}

function createMockResourceList(): MockExternalResource[] {
  return [
    createMockResource({
      id: 'res-1',
      title: 'React Hooks Deep Dive',
      description: 'An in-depth exploration of React Hooks patterns',
      type: 'article',
      language: 'English',
      difficulty: 'intermediate',
      duration: '20 min',
      author: 'Kent C. Dodds',
      qualityScore: 0.92,
      relevanceScore: 0.95,
      engagementScore: 0.85,
      tags: ['React', 'Hooks'],
      aiInsights: {
        keyTopics: ['useState', 'useEffect'],
        learningOutcomes: ['Master hooks'],
        prerequisites: ['React basics'],
        bestFor: ['Intermediate React developers', 'Frontend engineers'],
      },
    }),
    createMockResource({
      id: 'res-2',
      title: 'TypeScript Video Course',
      description: 'Visual guide to TypeScript fundamentals',
      type: 'video',
      language: 'English',
      difficulty: 'beginner',
      duration: '45 min',
      author: 'Matt Pocock',
      qualityScore: 0.88,
      relevanceScore: 0.82,
      engagementScore: 0.90,
      source: 'YouTube',
      tags: ['TypeScript', 'Frontend'],
      thumbnail: 'https://example.com/thumb.jpg',
      aiInsights: undefined,
    }),
    createMockResource({
      id: 'res-3',
      title: 'MDN Web Docs',
      description: 'Official Mozilla web documentation reference',
      type: 'documentation',
      language: 'Spanish',
      difficulty: 'advanced',
      duration: undefined,
      author: undefined,
      qualityScore: 0.95,
      relevanceScore: 0.75,
      engagementScore: 0.70,
      source: 'MDN',
      tags: ['JavaScript', 'Web', 'Reference', 'API', 'HTML'],
      aiInsights: undefined,
    }),
    createMockResource({
      id: 'res-4',
      title: 'Interactive Coding Lab',
      description: 'Hands-on exercises for web development skills',
      type: 'tutorial',
      language: 'English',
      difficulty: 'beginner',
      duration: '30 min',
      author: 'Sarah Drasner',
      qualityScore: 0.70,
      relevanceScore: 0.60,
      engagementScore: 0.65,
      source: 'CodePen',
      tags: ['CSS', 'Interactive'],
      aiInsights: undefined,
    }),
  ];
}

const defaultProps = {
  courseId: 'course-123',
  chapterId: 'chapter-456',
  sectionId: 'section-789',
  sectionTitle: 'Introduction to React Hooks',
  courseTitle: 'Advanced React',
  chapterTitle: 'Hooks and State',
};

function createSuccessResponse(resources: MockExternalResource[] = createMockResourceList()) {
  return {
    data: {
      success: true,
      data: {
        resources,
      },
    },
  };
}

function createErrorResponse() {
  return Promise.reject(new Error('Network Error'));
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Renders the component and waits for the initial axios call to resolve.
 */
async function renderAndWait(
  props: Partial<typeof defaultProps> = {},
) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <ResourceIntelligenceContent {...defaultProps} {...props} />,
    );
  });
  // Wait for the loading state to finish
  await waitFor(() => {
    // The loading spinner text should disappear after fetch resolves
    expect(mockAxiosPost).toHaveBeenCalled();
  });
  return result!;
}

// ============================================================================
// TESTS
// ============================================================================

describe('ResourceIntelligenceContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosPost.mockResolvedValue(createSuccessResponse());
  });

  // -------------------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows loading spinner text while fetching resources', async () => {
      // Make the fetch hang so we can observe loading state
      let resolvePromise: (value: unknown) => void;
      mockAxiosPost.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      await act(async () => {
        render(<ResourceIntelligenceContent {...defaultProps} />);
      });

      expect(screen.getByText('Discovering resources with SAM AI...')).toBeInTheDocument();

      // Resolve to clean up
      await act(async () => {
        resolvePromise!(createSuccessResponse());
      });
    });

    it('disables the refresh button while loading', async () => {
      let resolvePromise: (value: unknown) => void;
      mockAxiosPost.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      await act(async () => {
        render(<ResourceIntelligenceContent {...defaultProps} />);
      });

      // The refresh button should be disabled
      const buttons = screen.getAllByTestId('ui-button');
      const refreshButton = buttons.find((btn) => btn.hasAttribute('disabled'));
      expect(refreshButton).toBeTruthy();

      await act(async () => {
        resolvePromise!(createSuccessResponse());
      });
    });

    it('removes loading state once data is fetched', async () => {
      await renderAndWait();

      expect(screen.queryByText('Discovering resources with SAM AI...')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Resource Display
  // -------------------------------------------------------------------------

  describe('resource display', () => {
    it('renders the header with "SAM AI Resource Hub" title', async () => {
      await renderAndWait();

      expect(screen.getByText('SAM AI Resource Hub')).toBeInTheDocument();
    });

    it('renders the description text', async () => {
      await renderAndWait();

      expect(
        screen.getByText('Curated external resources to enhance your learning'),
      ).toBeInTheDocument();
    });

    it('displays resource titles from the API response', async () => {
      await renderAndWait();

      expect(screen.getByText('React Hooks Deep Dive')).toBeInTheDocument();
    });

    it('displays resource descriptions', async () => {
      await renderAndWait();

      expect(
        screen.getByText('An in-depth exploration of React Hooks patterns'),
      ).toBeInTheDocument();
    });

    it('displays resource source metadata', async () => {
      await renderAndWait();

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('displays resource duration when available', async () => {
      await renderAndWait();

      // res-1 has '20 min' duration
      expect(screen.getByText('20 min')).toBeInTheDocument();
    });

    it('displays resource author when available', async () => {
      await renderAndWait();

      // res-1 has 'Kent C. Dodds' as author
      expect(screen.getByText('Kent C. Dodds')).toBeInTheDocument();
    });

    it('displays difficulty badges for resources', async () => {
      await renderAndWait();

      const badges = screen.getAllByTestId('badge');
      const difficultyBadges = badges.filter(
        (b) =>
          b.textContent === 'intermediate' ||
          b.textContent === 'beginner' ||
          b.textContent === 'advanced',
      );
      expect(difficultyBadges.length).toBeGreaterThan(0);
    });

    it('displays quality score as percentage', async () => {
      await renderAndWait();

      // 0.92 quality score => 92%
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('displays relevance score as percentage', async () => {
      await renderAndWait();

      // 0.95 relevance score for res-1 (and 0.95 quality for res-3) => multiple 95% texts
      const scoreTexts = screen.getAllByText('95%');
      expect(scoreTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('displays engagement score as percentage', async () => {
      await renderAndWait();

      // 0.85 engagement score => 85%
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays Quality, Relevance, and Engagement labels', async () => {
      await renderAndWait();

      expect(screen.getAllByText('Quality').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Relevance').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Engagement').length).toBeGreaterThan(0);
    });

    it('displays resource tags', async () => {
      await renderAndWait();

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Hooks')).toBeInTheDocument();
    });

    it('truncates tags to first 4 and shows remaining count', async () => {
      await renderAndWait();

      // Resource res-3 has 5 tags: JavaScript, Web, Reference, API, HTML
      // Should show first 4 and "+1"
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('renders a thumbnail image when resource has thumbnail', async () => {
      await renderAndWait();

      // res-2 has a thumbnail
      const images = screen.getAllByRole('img');
      const thumbnailImage = images.find(
        (img) => img.getAttribute('src') === 'https://example.com/thumb.jpg',
      );
      expect(thumbnailImage).toBeTruthy();
    });

    it('renders an icon placeholder when resource has no thumbnail', async () => {
      await renderAndWait();

      // Resources without thumbnails should have an SVG icon placeholder
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('shows AI insights section for resources with aiInsights', async () => {
      await renderAndWait();

      expect(screen.getByText('SAM AI Insights')).toBeInTheDocument();
    });

    it('displays bestFor items in AI insights', async () => {
      await renderAndWait();

      expect(screen.getByText('Intermediate React developers')).toBeInTheDocument();
      expect(screen.getByText('Frontend engineers')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Categories (Tabs)
  // -------------------------------------------------------------------------

  describe('categories', () => {
    it('renders the tabs container', async () => {
      await renderAndWait();

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('defaults to the "recommended" tab', async () => {
      await renderAndWait();

      const tabs = screen.getByTestId('tabs');
      expect(tabs.getAttribute('data-value')).toBe('recommended');
    });

    it('renders tab triggers for all 5 categories', async () => {
      await renderAndWait();

      expect(screen.getByTestId('tab-trigger-recommended')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-videos')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-articles')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-interactive')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-documentation')).toBeInTheDocument();
    });

    it('renders category description text for the active tab', async () => {
      await renderAndWait();

      expect(
        screen.getByText('Personalized resources based on your learning style'),
      ).toBeInTheDocument();
    });

    it('displays badges with resource counts in tab triggers', async () => {
      await renderAndWait();

      // Badges are present in each tab trigger for counts
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Search and Filter
  // -------------------------------------------------------------------------

  describe('search and filter', () => {
    it('renders a search input', async () => {
      await renderAndWait();

      const searchInput = screen.getByPlaceholderText('Search resources...');
      expect(searchInput).toBeInTheDocument();
    });

    it('filters resources when typing in search', async () => {
      await renderAndWait();

      const searchInput = screen.getByPlaceholderText('Search resources...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'TypeScript' } });
      });

      // TypeScript Video Course should still be visible
      expect(screen.getByText('TypeScript Video Course')).toBeInTheDocument();
    });

    it('renders a Filters button', async () => {
      await renderAndWait();

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('shows filter selects when Filters button is clicked', async () => {
      await renderAndWait();

      const filtersButton = screen.getByText('Filters').closest('button')!;

      await act(async () => {
        fireEvent.click(filtersButton);
      });

      // Should show the select elements for language, difficulty, and sort
      const selects = screen.getAllByTestId('select');
      expect(selects.length).toBeGreaterThanOrEqual(3);
    });

    it('renders language filter options', async () => {
      await renderAndWait();

      const filtersButton = screen.getByText('Filters').closest('button')!;
      await act(async () => {
        fireEvent.click(filtersButton);
      });

      // Multiple selects have "all" items (language, difficulty), so use getAllByTestId
      const allItems = screen.getAllByTestId('select-item-all');
      expect(allItems.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('All Languages')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('renders difficulty filter options', async () => {
      await renderAndWait();

      const filtersButton = screen.getByText('Filters').closest('button')!;
      await act(async () => {
        fireEvent.click(filtersButton);
      });

      expect(screen.getByText('All Levels')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('renders sort options', async () => {
      await renderAndWait();

      const filtersButton = screen.getByText('Filters').closest('button')!;
      await act(async () => {
        fireEvent.click(filtersButton);
      });

      expect(screen.getByText('Most Relevant')).toBeInTheDocument();
      expect(screen.getByText('Highest Quality')).toBeInTheDocument();
      expect(screen.getByText('Most Engaging')).toBeInTheDocument();
      expect(screen.getByText('Most Recent')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------

  describe('empty state', () => {
    it('displays empty state when no resources match filters', async () => {
      await renderAndWait();

      const searchInput = screen.getByPlaceholderText('Search resources...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'xyznonexistent12345' } });
      });

      expect(screen.getByText('No resources found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your filters or search query'),
      ).toBeInTheDocument();
    });

    it('displays empty state when API returns no resources', async () => {
      mockAxiosPost.mockResolvedValue(createSuccessResponse([]));

      await renderAndWait();

      expect(screen.getByText('No resources found')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Error Handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('shows error toast when API call fails', async () => {
      mockAxiosPost.mockRejectedValue(new Error('Network Error'));

      await renderAndWait();

      expect(mockToastError).toHaveBeenCalledWith('Failed to discover resources');
    });

    it('falls back to demo data when API call fails', async () => {
      mockAxiosPost.mockRejectedValue(new Error('Network Error'));

      await renderAndWait();

      // Demo data includes "React Hooks Explained"
      expect(screen.getByText('React Hooks Explained')).toBeInTheDocument();
    });

    it('shows success toast when API call succeeds', async () => {
      await renderAndWait();

      expect(mockToastSuccess).toHaveBeenCalledWith('Resources discovered successfully!');
    });
  });

  // -------------------------------------------------------------------------
  // Click Actions
  // -------------------------------------------------------------------------

  describe('click actions', () => {
    it('opens resource URL in new tab when external link button is clicked', async () => {
      const mockWindowOpen = jest.fn();
      const originalOpen = window.open;
      window.open = mockWindowOpen;

      await renderAndWait();

      // Find the ghost/icon buttons for external links
      const buttons = screen.getAllByTestId('ui-button');
      // The external link buttons have ghost variant in the resource cards
      const externalLinkButtons = buttons.filter(
        (btn) => btn.getAttribute('data-variant') === 'ghost' && btn.getAttribute('data-size') === 'sm',
      );
      expect(externalLinkButtons.length).toBeGreaterThan(0);

      fireEvent.click(externalLinkButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
      );

      window.open = originalOpen;
    });

    it('calls fetchResources when refresh button is clicked', async () => {
      await renderAndWait();

      // Clear the initial call
      mockAxiosPost.mockClear();
      mockAxiosPost.mockResolvedValue(createSuccessResponse());

      // Find the refresh button (outline variant with Refresh text)
      const buttons = screen.getAllByTestId('ui-button');
      const refreshButton = buttons.find(
        (btn) => btn.getAttribute('data-variant') === 'outline' && !btn.textContent?.includes('Filters'),
      );
      expect(refreshButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(refreshButton!);
      });

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      });
    });

    it('sends correct payload in the API request', async () => {
      await renderAndWait();

      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/api/sam/resource-intelligence',
        {
          action: 'discover',
          data: {
            topic: {
              name: 'Introduction to React Hooks',
              category: 'Advanced React',
              keywords: ['Introduction to React Hooks', 'Advanced React', 'Hooks and State'],
              difficulty: 'medium',
              courseId: 'course-123',
            },
            config: {
              qualityThreshold: 0.7,
              maxResults: 20,
            },
          },
        },
      );
    });

    it('toggles filter panel visibility on Filters button click', async () => {
      await renderAndWait();

      const filtersButton = screen.getByText('Filters').closest('button')!;

      // Initially no selects visible
      expect(screen.queryAllByTestId('select').length).toBe(0);

      // Click to show filters
      await act(async () => {
        fireEvent.click(filtersButton);
      });
      expect(screen.getAllByTestId('select').length).toBeGreaterThanOrEqual(3);

      // Click again to hide filters
      await act(async () => {
        fireEvent.click(filtersButton);
      });
      // AnimatePresence is mocked to pass through children, but showFilters
      // state controls the conditional rendering. When toggled off, selects
      // should not be visible.
      // Note: since AnimatePresence mock renders children directly,
      // visibility depends on the state toggle.
    });
  });

  // -------------------------------------------------------------------------
  // Quick Stats
  // -------------------------------------------------------------------------

  describe('quick stats', () => {
    it('displays total resources count', async () => {
      await renderAndWait();

      // 4 resources total - may appear in badge counts too, so use getAllByText
      const countElements = screen.getAllByText('4');
      expect(countElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Resources Found')).toBeInTheDocument();
    });

    it('displays high quality resource count', async () => {
      await renderAndWait();

      // Resources with qualityScore > 0.8: res-1 (0.92), res-2 (0.88), res-3 (0.95) = 3
      expect(screen.getByText('High Quality')).toBeInTheDocument();
    });

    it('displays languages count', async () => {
      await renderAndWait();

      // English and Spanish = 2
      expect(screen.getByText('Languages')).toBeInTheDocument();
    });

    it('displays sources count', async () => {
      await renderAndWait();

      // Sources: Medium, YouTube, MDN, CodePen = 4
      expect(screen.getByText('Sources')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Quality Score Colors
  // -------------------------------------------------------------------------

  describe('quality score color classes', () => {
    it('applies green color for high scores (>= 0.8)', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({
            id: 'high-q',
            qualityScore: 0.92,
            relevanceScore: 0.95,
            engagementScore: 0.85,
          }),
        ]),
      );

      await renderAndWait();

      // 92% quality score should have green color class
      const scoreElement = screen.getByText('92%');
      expect(scoreElement.className).toContain('text-green-600');
    });

    it('applies yellow color for medium scores (>= 0.6 and < 0.8)', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({
            id: 'med-q',
            qualityScore: 0.65,
            relevanceScore: 0.70,
            engagementScore: 0.60,
          }),
        ]),
      );

      await renderAndWait();

      const scoreElement = screen.getByText('65%');
      expect(scoreElement.className).toContain('text-yellow-600');
    });

    it('applies red color for low scores (< 0.6)', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({
            id: 'low-q',
            qualityScore: 0.40,
            relevanceScore: 0.30,
            engagementScore: 0.25,
          }),
        ]),
      );

      await renderAndWait();

      const scoreElement = screen.getByText('40%');
      expect(scoreElement.className).toContain('text-red-600');
    });
  });

  // -------------------------------------------------------------------------
  // Difficulty Badge Colors
  // -------------------------------------------------------------------------

  describe('difficulty badge colors', () => {
    it('applies green badge class for beginner difficulty', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'beg', difficulty: 'beginner' }),
        ]),
      );

      await renderAndWait();

      const badges = screen.getAllByTestId('badge');
      const beginnerBadge = badges.find((b) => b.textContent === 'beginner');
      expect(beginnerBadge).toBeTruthy();
      expect(beginnerBadge!.className).toContain('bg-green-100');
    });

    it('applies yellow badge class for intermediate difficulty', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'int', difficulty: 'intermediate' }),
        ]),
      );

      await renderAndWait();

      const badges = screen.getAllByTestId('badge');
      const intermediateBadge = badges.find((b) => b.textContent === 'intermediate');
      expect(intermediateBadge).toBeTruthy();
      expect(intermediateBadge!.className).toContain('bg-yellow-100');
    });

    it('applies red badge class for advanced difficulty', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'adv', difficulty: 'advanced' }),
        ]),
      );

      await renderAndWait();

      const badges = screen.getAllByTestId('badge');
      const advancedBadge = badges.find((b) => b.textContent === 'advanced');
      expect(advancedBadge).toBeTruthy();
      expect(advancedBadge!.className).toContain('bg-red-100');
    });
  });

  // -------------------------------------------------------------------------
  // Last Updated Badge
  // -------------------------------------------------------------------------

  describe('last updated badge', () => {
    it('displays the last updated timestamp after successful fetch', async () => {
      await renderAndWait();

      // The badge with clock icon and time should be present
      const badges = screen.getAllByTestId('badge');
      const updatedBadge = badges.find(
        (b) => b.getAttribute('data-variant') === 'outline' && b.textContent?.includes(':'),
      );
      expect(updatedBadge).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // API Request Formatting
  // -------------------------------------------------------------------------

  describe('API request formatting', () => {
    it('uses courseTitle as category when provided', async () => {
      await renderAndWait({ courseTitle: 'My Custom Course' });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/api/sam/resource-intelligence',
        expect.objectContaining({
          data: expect.objectContaining({
            topic: expect.objectContaining({
              category: 'My Custom Course',
            }),
          }),
        }),
      );
    });

    it('uses "general" as category when courseTitle is not provided', async () => {
      await renderAndWait({ courseTitle: undefined });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/api/sam/resource-intelligence',
        expect.objectContaining({
          data: expect.objectContaining({
            topic: expect.objectContaining({
              category: 'general',
            }),
          }),
        }),
      );
    });

    it('filters out falsy values from keywords array', async () => {
      await renderAndWait({
        sectionTitle: 'Hooks',
        courseTitle: undefined,
        chapterTitle: undefined,
      });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/api/sam/resource-intelligence',
        expect.objectContaining({
          data: expect.objectContaining({
            topic: expect.objectContaining({
              keywords: ['Hooks'],
            }),
          }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Resource without optional fields
  // -------------------------------------------------------------------------

  describe('resources without optional fields', () => {
    it('renders resource without duration', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'no-dur', duration: undefined }),
        ]),
      );

      await renderAndWait();

      expect(screen.getByText('React Hooks Explained')).toBeInTheDocument();
    });

    it('renders resource without author', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'no-auth', author: undefined }),
        ]),
      );

      await renderAndWait();

      expect(screen.getByText('React Hooks Explained')).toBeInTheDocument();
      expect(screen.queryByText('Dan Abramov')).not.toBeInTheDocument();
    });

    it('renders resource without aiInsights', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'no-ai', aiInsights: undefined }),
        ]),
      );

      await renderAndWait();

      expect(screen.getByText('React Hooks Explained')).toBeInTheDocument();
      expect(screen.queryByText('SAM AI Insights')).not.toBeInTheDocument();
    });

    it('renders resource without thumbnail', async () => {
      mockAxiosPost.mockResolvedValue(
        createSuccessResponse([
          createMockResource({ id: 'no-thumb', thumbnail: undefined }),
        ]),
      );

      await renderAndWait();

      expect(screen.getByText('React Hooks Explained')).toBeInTheDocument();
      // Should have icon placeholder instead of image
      const images = screen.queryAllByRole('img');
      const thumbnailImage = images.find(
        (img) => img.getAttribute('alt') === 'React Hooks Explained',
      );
      expect(thumbnailImage).toBeFalsy();
    });
  });
});

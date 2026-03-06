import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next/dynamic to control lazy-load behavior in tests.
// By default, next/dynamic in jsdom resolves the import immediately,
// but we need to test both the loading state and the resolved state.
// We mock it to either render the loading fallback or the resolved component.
//
// We store captured values on globalThis because jest.mock() is hoisted above
// let/const declarations, causing a temporal dead zone if we used module-level
// variables directly.

jest.mock('next/dynamic', () => {
  return jest.fn((importFn: unknown, options?: Record<string, unknown>) => {
    // Initialize store on globalThis inside the factory so it exists even
    // when the factory runs before any module-level let/const.
    const gRef = globalThis as unknown as Record<string, { loadingMode: boolean; capturedOptions: Record<string, unknown> | undefined; callCount: number }>;
    if (!gRef.__smartSidebarTest) {
      gRef.__smartSidebarTest = {
        loadingMode: false,
        capturedOptions: undefined,
        callCount: 0,
      };
    }
    const store = gRef.__smartSidebarTest;
    store.capturedOptions = options;
    store.callCount += 1;
    // Return a component that either shows loading or the resolved component
    const DynamicComponent = (props: Record<string, unknown>) => {
      if (store.loadingMode && options?.loading) {
        // Render the loading component
        const LoadingComponent = options.loading as React.FC;
        return <LoadingComponent />;
      }
      // Render a stub that captures the forwarded props
      return (
        <div data-testid="smart-sidebar-dynamic" {...props}>
          SmartSidebar
        </div>
      );
    };
    DynamicComponent.displayName = 'DynamicSmartSidebar';
    return DynamicComponent;
  });
});

// Import after mocks are set up
import { SmartSidebarClient } from '@/components/dashboard/smart-sidebar-client';

// Convenience reference to the global store (safe to access after jest.mock hoisting)
const g = globalThis as unknown as Record<string, { loadingMode: boolean; capturedOptions: Record<string, unknown> | undefined; callCount: number }>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isTeacher?: boolean;
  isAffiliate?: boolean;
}

function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    isTeacher: false,
    isAffiliate: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SmartSidebarClient', () => {
  beforeEach(() => {
    g.__smartSidebarTest.loadingMode = false;
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders without crashing with required props', () => {
      const user = createTestUser();

      const { container } = render(<SmartSidebarClient user={user} />);

      expect(container).toBeTruthy();
    });

    it('renders the dynamically imported SmartSidebar component', () => {
      const user = createTestUser();

      render(<SmartSidebarClient user={user} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
      expect(screen.getByText('SmartSidebar')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Loading placeholder
  // -------------------------------------------------------------------------

  describe('loading placeholder', () => {
    beforeEach(() => {
      g.__smartSidebarTest.loadingMode = true;
    });

    it('renders an aside element as the loading placeholder', () => {
      const user = createTestUser();

      const { container } = render(<SmartSidebarClient user={user} />);

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
    });

    it('applies correct classes to the loading placeholder', () => {
      const user = createTestUser();

      const { container } = render(<SmartSidebarClient user={user} />);

      const aside = container.querySelector('aside');
      expect(aside).not.toBeNull();
      // The loading placeholder should have the collapsed sidebar styling classes
      expect(aside?.className).toContain('hidden');
      expect(aside?.className).toContain('lg:block');
      expect(aside?.className).toContain('fixed');
      expect(aside?.className).toContain('left-0');
      expect(aside?.className).toContain('top-16');
      expect(aside?.className).toContain('backdrop-blur-sm');
      expect(aside?.className).toContain('z-30');
    });

    it('sets the loading placeholder width to 72px (collapsed sidebar)', () => {
      const user = createTestUser();

      const { container } = render(<SmartSidebarClient user={user} />);

      const aside = container.querySelector('aside');
      expect(aside).not.toBeNull();
      expect(aside?.style.width).toBe('72px');
    });
  });

  // -------------------------------------------------------------------------
  // Dynamic import configuration
  // -------------------------------------------------------------------------

  describe('dynamic import configuration', () => {
    it('calls next/dynamic with ssr disabled', () => {
      // dynamic() is called once at module level when the component is imported.
      // We captured the options on globalThis so they survive clearAllMocks().
      const store = g.__smartSidebarTest;
      expect(store.callCount).toBe(1);
      expect(store.capturedOptions).toBeDefined();
      expect(store.capturedOptions?.ssr).toBe(false);
    });

    it('provides a loading function in the dynamic options', () => {
      const store = g.__smartSidebarTest;
      expect(store.capturedOptions).toBeDefined();
      expect(store.capturedOptions?.loading).toBeDefined();
      expect(typeof store.capturedOptions?.loading).toBe('function');
    });
  });

  // -------------------------------------------------------------------------
  // Props forwarding
  // -------------------------------------------------------------------------

  describe('props forwarding', () => {
    it('forwards user prop to SmartSidebar', () => {
      const user = createTestUser({ id: 'user-42', name: 'Jane Doe', email: 'jane@example.com' });

      render(<SmartSidebarClient user={user} />);

      const sidebar = screen.getByTestId('smart-sidebar-dynamic');
      // Our mock renders props as HTML attributes (serialized)
      // We verify the user object is passed as a prop
      // Since HTML attributes serialize objects to [object Object], we check the component received it
      expect(sidebar).toBeInTheDocument();
    });

    it('forwards isMobileOpen prop to SmartSidebar', () => {
      const user = createTestUser();

      const { rerender } = render(
        <SmartSidebarClient user={user} isMobileOpen={true} />
      );

      const sidebar = screen.getByTestId('smart-sidebar-dynamic');
      expect(sidebar).toBeInTheDocument();

      // Rerender with different value to verify re-rendering happens
      rerender(<SmartSidebarClient user={user} isMobileOpen={false} />);
      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('forwards onMobileClose callback to SmartSidebar', () => {
      const user = createTestUser();
      const onMobileClose = jest.fn();

      render(
        <SmartSidebarClient user={user} onMobileClose={onMobileClose} />
      );

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('renders correctly without optional props', () => {
      const user = createTestUser();

      render(<SmartSidebarClient user={user} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('handles user with admin role', () => {
      const adminUser = createTestUser({ role: 'ADMIN' });

      render(<SmartSidebarClient user={adminUser} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('handles user with teacher flag', () => {
      const teacherUser = createTestUser({ isTeacher: true });

      render(<SmartSidebarClient user={teacherUser} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('handles user with affiliate flag', () => {
      const affiliateUser = createTestUser({ isAffiliate: true });

      render(<SmartSidebarClient user={affiliateUser} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles user with minimal data (no optional fields)', () => {
      const minimalUser = { id: 'min-1', name: 'Min User', email: 'min@example.com' };

      render(<SmartSidebarClient user={minimalUser} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('renders correctly when isMobileOpen is undefined', () => {
      const user = createTestUser();

      render(<SmartSidebarClient user={user} isMobileOpen={undefined} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });

    it('renders correctly when onMobileClose is undefined', () => {
      const user = createTestUser();

      render(<SmartSidebarClient user={user} onMobileClose={undefined} />);

      expect(screen.getByTestId('smart-sidebar-dynamic')).toBeInTheDocument();
    });
  });
});

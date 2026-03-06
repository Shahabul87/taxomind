import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react');

// Mock next/navigation redirect - store calls and throw to halt execution
// Next.js redirect() throws a special error to stop rendering
const redirectCalls: string[] = [];
class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT: ${url}`);
    this.name = 'RedirectError';
  }
}
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirectCalls.push(url);
    throw new RedirectError(url);
  },
}));

// Mock AdminRole type to match the actual enum/const object
jest.mock('@/types/admin-role', () => ({
  AdminRole: {
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN',
  },
}));

// Mock AdminSession type (type-only module, no runtime exports needed for guard)
jest.mock('@/types/admin-session', () => ({}));

import { AdminGuard } from '@/components/auth/admin-guard';

const mockUseSession = useSession as jest.Mock;

describe('AdminGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redirectCalls.length = 0;
  });

  // -------------------------------------------------------
  // Loading state
  // -------------------------------------------------------

  it('returns null (renders nothing) when session status is "loading"', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { container } = render(
      <AdminGuard>
        <div data-testid="admin-content">Admin Dashboard</div>
      </AdminGuard>
    );

    // The component returns null during loading
    expect(container.innerHTML).toBe('');
    // Children must not be rendered
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    // No redirect should occur while loading
    expect(redirectCalls).toHaveLength(0);
  });

  // -------------------------------------------------------
  // Unauthenticated - no session
  // -------------------------------------------------------

  it('redirects to /admin/auth/login when session is null (unauthenticated)', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws to halt rendering
    }

    expect(redirectCalls).toContain('/admin/auth/login');
  });

  it('does not render children when session is null', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------
  // Authenticated with session but no user
  // -------------------------------------------------------

  it('redirects to /admin/auth/login when session exists but user is missing', () => {
    mockUseSession.mockReturnValue({
      data: { user: null },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(redirectCalls).toContain('/admin/auth/login');
  });

  // -------------------------------------------------------
  // Unauthorized roles - not ADMIN or SUPERADMIN
  // -------------------------------------------------------

  it('redirects to /unauthorized when user role is "USER" (not admin)', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Regular User', role: 'USER' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws to halt rendering
    }

    expect(redirectCalls).toContain('/unauthorized');
  });

  it('does not render children when user role is "USER"', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Regular User', role: 'USER' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects to /unauthorized when user role is missing (undefined)', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-2', name: 'No Role User' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(redirectCalls).toContain('/unauthorized');
  });

  it('redirects to /unauthorized for unknown roles', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-3', name: 'Unknown Role', role: 'MODERATOR' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(redirectCalls).toContain('/unauthorized');
  });

  it('redirects to /unauthorized for empty string role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-4', name: 'Empty Role', role: '' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Admin Dashboard</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(redirectCalls).toContain('/unauthorized');
  });

  // -------------------------------------------------------
  // Authorized - ADMIN role
  // -------------------------------------------------------

  it('renders children when user role is "ADMIN"', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin User', role: 'ADMIN' } },
      status: 'authenticated',
    });

    render(
      <AdminGuard>
        <div data-testid="admin-content">Admin Dashboard</div>
      </AdminGuard>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    // No redirect should have occurred
    expect(redirectCalls).toHaveLength(0);
  });

  // -------------------------------------------------------
  // Authorized - SUPERADMIN role
  // -------------------------------------------------------

  it('renders children when user role is "SUPERADMIN"', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'superadmin-1', name: 'Super Admin', role: 'SUPERADMIN' } },
      status: 'authenticated',
    });

    render(
      <AdminGuard>
        <div data-testid="admin-content">Super Admin Panel</div>
      </AdminGuard>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Super Admin Panel')).toBeInTheDocument();
    expect(redirectCalls).toHaveLength(0);
  });

  // -------------------------------------------------------
  // Children rendering fidelity
  // -------------------------------------------------------

  it('renders complex nested children for authorized admin', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-2', name: 'Admin', role: 'ADMIN' } },
      status: 'authenticated',
    });

    render(
      <AdminGuard>
        <header data-testid="admin-header">Header</header>
        <main data-testid="admin-main">
          <section data-testid="admin-section">Dashboard Section</section>
        </main>
      </AdminGuard>
    );

    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    expect(screen.getByTestId('admin-main')).toBeInTheDocument();
    expect(screen.getByTestId('admin-section')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Section')).toBeInTheDocument();
  });

  // -------------------------------------------------------
  // Redirect precedence: auth check happens before role check
  // -------------------------------------------------------

  it('prioritizes login redirect over unauthorized redirect when session has no user', () => {
    mockUseSession.mockReturnValue({
      data: { user: undefined },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div>Content</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    // Should redirect to login, not unauthorized, because !session?.user is checked first
    expect(redirectCalls).toContain('/admin/auth/login');
    expect(redirectCalls).not.toContain('/unauthorized');
  });

  // -------------------------------------------------------
  // Redirect consistency - only one target per render
  // -------------------------------------------------------

  it('only redirects to /admin/auth/login for unauthenticated user (no mixed targets)', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    try {
      render(
        <AdminGuard>
          <div>Content</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    // React may retry rendering, causing multiple redirect calls,
    // but all calls must target the same login path
    expect(redirectCalls.length).toBeGreaterThanOrEqual(1);
    expect(redirectCalls.every((url) => url === '/admin/auth/login')).toBe(true);
  });

  it('only redirects to /unauthorized for non-admin role (no mixed targets)', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-5', name: 'Teacher', role: 'TEACHER' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div>Content</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    // React may retry rendering, causing multiple redirect calls,
    // but all calls must target the same unauthorized path
    expect(redirectCalls.length).toBeGreaterThanOrEqual(1);
    expect(redirectCalls.every((url) => url === '/unauthorized')).toBe(true);
  });

  // -------------------------------------------------------
  // Case sensitivity
  // -------------------------------------------------------

  it('rejects lowercase "admin" role (case sensitive match)', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-6', name: 'Lowercase Admin', role: 'admin' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Content</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(redirectCalls).toContain('/unauthorized');
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('rejects lowercase "superadmin" role (case sensitive match)', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-7', name: 'Lowercase Super', role: 'superadmin' } },
      status: 'authenticated',
    });

    try {
      render(
        <AdminGuard>
          <div data-testid="admin-content">Content</div>
        </AdminGuard>
      );
    } catch {
      // Expected - redirect throws
    }

    expect(redirectCalls).toContain('/unauthorized');
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});

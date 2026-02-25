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

// Mock AdminRole type
jest.mock('@/types/admin-role', () => ({
  AdminRole: {
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN',
  },
}));

// Mock AdminSession type
jest.mock('@/types/admin-session', () => ({}));

import { RoleGuard, UserGuard, AdminGuard, AnyAdminGuard } from '@/components/auth/role-guard';

const mockUseSession = useSession as jest.Mock;

describe('RoleGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redirectCalls.length = 0;
  });

  it('renders children when user has matching role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles="ADMIN">
        <div data-testid="protected-content">Protected Content</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('calls redirect when user has wrong role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } },
      status: 'authenticated',
    });

    try {
      render(
        <RoleGuard allowedRoles="SUPERADMIN">
          <div>Protected</div>
        </RoleGuard>
      );
    } catch {
      // Expected - redirect throws to halt rendering
    }

    expect(redirectCalls).toContain('/unauthorized');
  });

  it('shows fallback content instead of redirecting when fallback is provided', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles="SUPERADMIN" fallback={<div data-testid="fallback">Access Denied</div>}>
        <div>Protected</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('fallback')).toHaveTextContent('Access Denied');
  });

  it('handles ADMIN role correctly', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin User', role: 'ADMIN' } },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles="ADMIN">
        <div data-testid="admin-content">Admin Only</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it('handles array of allowed roles', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles={['ADMIN', 'SUPERADMIN']}>
        <div data-testid="multi-role-content">Multi-Role Content</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('multi-role-content')).toBeInTheDocument();
  });

  it('shows loading state while session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(
      <RoleGuard allowedRoles="ADMIN">
        <div>Protected</div>
      </RoleGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    // redirect() throws to halt rendering (like real Next.js behavior)
    // so we need to catch the render error
    try {
      render(
        <RoleGuard allowedRoles="ADMIN">
          <div>Protected</div>
        </RoleGuard>
      );
    } catch {
      // Expected - redirect throws to stop rendering
    }

    expect(redirectCalls).toContain('/admin/auth/login');
  });

  it('uses custom redirect path when provided', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } },
      status: 'authenticated',
    });

    try {
      render(
        <RoleGuard allowedRoles="SUPERADMIN" redirectTo="/custom-unauthorized">
          <div>Protected</div>
        </RoleGuard>
      );
    } catch {
      // Expected - redirect throws to halt rendering
    }

    expect(redirectCalls).toContain('/custom-unauthorized');
  });
});

describe('UserGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redirectCalls.length = 0;
  });

  it('renders children for authenticated user', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Test User' } },
      status: 'authenticated',
    });

    render(
      <UserGuard>
        <div data-testid="user-content">User Content</div>
      </UserGuard>
    );

    expect(screen.getByTestId('user-content')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to login', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    try {
      render(
        <UserGuard>
          <div>Protected</div>
        </UserGuard>
      );
    } catch {
      // Expected - redirect throws to halt rendering
    }

    expect(redirectCalls).toContain('/auth/login');
  });
});

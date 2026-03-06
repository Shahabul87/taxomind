import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// The component casts session.user to AdminSession which expects a `role`
// field. We mock the AdminRole and AdminSession types so the module resolves
// without pulling in Prisma or other heavy dependencies.
jest.mock('@/types/admin-role', () => ({
  AdminRole: {
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN',
  },
}));

jest.mock('@/types/admin-session', () => ({}));

// Permission type comes from @/lib/role-management. We mock the module so it
// resolves without database access. The component itself only uses the
// Permission type at the TypeScript level; at runtime it simply accepts the
// string and renders children for any authenticated admin.
jest.mock('@/lib/role-management', () => ({
  USER_PERMISSIONS: [
    'course:view',
    'course:enroll',
    'course:create',
    'course:edit_own',
    'course:delete_own',
    'exam:take',
    'exam:create',
    'exam:edit_own',
    'progress:view_own',
    'analytics:view_own',
    'analytics:view_students',
    'analytics:view_courses',
  ],
  hasPermission: jest.fn(),
  requirePermission: jest.fn(),
}));

import {
  PermissionGuard,
  ConditionalRender,
} from '@/components/auth/permission-guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock session return value with a given admin role. */
function adminSession(role: string) {
  return {
    data: {
      user: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role,
      },
    },
    status: 'authenticated' as const,
  };
}

/** Build a session with no role (regular user). */
function userSessionNoRole() {
  return {
    data: {
      user: {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
      },
    },
    status: 'authenticated' as const,
  };
}

// ===========================================================================
// PermissionGuard
// ===========================================================================
describe('PermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Loading state ----
  it('shows a loading indicator when session status is "loading"', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <PermissionGuard permission="course:view">
        <p>Protected content</p>
      </PermissionGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  // ---- No session ----
  it('renders nothing when there is no session and no fallback is provided', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const { container } = render(
      <PermissionGuard permission="course:view">
        <p>Protected content</p>
      </PermissionGuard>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  it('renders the fallback when there is no session and a fallback is provided', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    render(
      <PermissionGuard
        permission="course:view"
        fallback={<p data-testid="fallback">Please sign in</p>}
      >
        <p>Protected content</p>
      </PermissionGuard>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  // ---- Session exists but user has no role (regular user, not admin) ----
  it('renders nothing when the user has no admin role and no fallback is provided', () => {
    mockUseSession.mockReturnValue(userSessionNoRole());

    const { container } = render(
      <PermissionGuard permission="course:view">
        <p>Protected content</p>
      </PermissionGuard>
    );

    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders the fallback when the user has no admin role and a fallback is provided', () => {
    mockUseSession.mockReturnValue(userSessionNoRole());

    render(
      <PermissionGuard
        permission="course:view"
        fallback={<p data-testid="fallback">Admin access required</p>}
      >
        <p>Protected content</p>
      </PermissionGuard>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  // ---- Authenticated admin with ADMIN role ----
  it('renders children when the user is an authenticated ADMIN', () => {
    mockUseSession.mockReturnValue(adminSession('ADMIN'));

    render(
      <PermissionGuard permission="course:view">
        <p data-testid="children">Admin content</p>
      </PermissionGuard>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  // ---- Authenticated admin with SUPERADMIN role ----
  it('renders children when the user is an authenticated SUPERADMIN', () => {
    mockUseSession.mockReturnValue(adminSession('SUPERADMIN'));

    render(
      <PermissionGuard permission="course:create">
        <p data-testid="children">Superadmin content</p>
      </PermissionGuard>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  // ---- All authenticated admins pass any permission ----
  it('grants access to any permission for authenticated admin users', () => {
    mockUseSession.mockReturnValue(adminSession('ADMIN'));

    render(
      <PermissionGuard permission="analytics:view_own">
        <p data-testid="children">Analytics</p>
      </PermissionGuard>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  // ---- Default fallback is null ----
  it('defaults the fallback prop to null', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const { container } = render(
      <PermissionGuard permission="course:view">
        <p>Protected content</p>
      </PermissionGuard>
    );

    // No fallback prop, no session => renders nothing
    expect(container.innerHTML).toBe('');
  });
});

// ===========================================================================
// ConditionalRender
// ===========================================================================
describe('ConditionalRender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Loading state ----
  it('shows a loading indicator when session status is "loading"', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <ConditionalRender role="ADMIN">
        <p>Admin section</p>
      </ConditionalRender>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Admin section')).not.toBeInTheDocument();
  });

  // ---- Renders children when role matches (single role) ----
  it('renders children when the user role matches the required role', () => {
    mockUseSession.mockReturnValue(adminSession('ADMIN'));

    render(
      <ConditionalRender role="ADMIN">
        <p data-testid="children">Admin section</p>
      </ConditionalRender>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  // ---- Renders children when role matches one of an array ----
  it('renders children when the user role matches one of multiple allowed roles', () => {
    mockUseSession.mockReturnValue(adminSession('SUPERADMIN'));

    render(
      <ConditionalRender role={['ADMIN', 'SUPERADMIN']}>
        <p data-testid="children">Multi-role content</p>
      </ConditionalRender>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  // ---- Renders fallback when role does NOT match ----
  it('renders fallback when the user role is not in the allowed roles', () => {
    mockUseSession.mockReturnValue(adminSession('ADMIN'));

    render(
      <ConditionalRender
        role="SUPERADMIN"
        fallback={<p data-testid="fallback">Not allowed</p>}
      >
        <p>Superadmin section</p>
      </ConditionalRender>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByText('Superadmin section')).not.toBeInTheDocument();
  });

  // ---- Renders null when role does not match and no fallback ----
  it('renders nothing when the user role is not allowed and no fallback is specified', () => {
    mockUseSession.mockReturnValue(adminSession('ADMIN'));

    const { container } = render(
      <ConditionalRender role="SUPERADMIN">
        <p>Superadmin section</p>
      </ConditionalRender>
    );

    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Superadmin section')).not.toBeInTheDocument();
  });

  // ---- No session ----
  it('renders fallback when there is no session', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    render(
      <ConditionalRender
        role="ADMIN"
        fallback={<p data-testid="fallback">Sign in required</p>}
      >
        <p>Admin section</p>
      </ConditionalRender>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByText('Admin section')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no session and no fallback is provided', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const { container } = render(
      <ConditionalRender role="ADMIN">
        <p>Admin section</p>
      </ConditionalRender>
    );

    expect(container.innerHTML).toBe('');
  });

  // ---- Session exists but user has no role ----
  it('renders fallback when the session user has no role property', () => {
    mockUseSession.mockReturnValue(userSessionNoRole());

    render(
      <ConditionalRender
        role="ADMIN"
        fallback={<p data-testid="fallback">No role</p>}
      >
        <p>Admin section</p>
      </ConditionalRender>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByText('Admin section')).not.toBeInTheDocument();
  });

  // ---- No role prop specified -- any authenticated admin passes ----
  it('renders children for any authenticated admin when no role prop is specified', () => {
    mockUseSession.mockReturnValue(adminSession('ADMIN'));

    render(
      <ConditionalRender>
        <p data-testid="children">Any admin content</p>
      </ConditionalRender>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  // ---- SUPERADMIN with single ADMIN role required ----
  it('renders fallback when SUPERADMIN is not in the single allowed role "ADMIN"', () => {
    mockUseSession.mockReturnValue(adminSession('SUPERADMIN'));

    render(
      <ConditionalRender
        role="ADMIN"
        fallback={<p data-testid="fallback">Admin only</p>}
      >
        <p>Admin section</p>
      </ConditionalRender>
    );

    // SUPERADMIN does NOT equal ADMIN, so fallback should render
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  // ---- Default fallback is null ----
  it('defaults the fallback prop to null', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const { container } = render(
      <ConditionalRender role="ADMIN">
        <p>Admin section</p>
      </ConditionalRender>
    );

    expect(container.innerHTML).toBe('');
  });
});

import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useCurrentUser } from '@/hooks/use-current-user';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data when session exists', () => {
    const mockUser = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'USER',
      isTwoFactorEnabled: false,
      isOAuth: false
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(mockUser);
  });

  it('should return undefined when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when session exists but user is null', () => {
    mockUseSession.mockReturnValue({
      data: { user: null },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeNull();
  });

  it('should handle loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeUndefined();
  });

  it('should update when session changes', () => {
    const mockUser1 = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'USER',
      isTwoFactorEnabled: false,
      isOAuth: false
    };

    const mockUser2 = {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'ADMIN',
      isTwoFactorEnabled: true,
      isOAuth: true
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser1 },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result, rerender } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(mockUser1);

    // Update the mock to return different user
    mockUseSession.mockReturnValue({
      data: { user: mockUser2 },
      status: 'authenticated',
      update: jest.fn()
    });

    rerender();

    expect(result.current).toEqual(mockUser2);
  });
});
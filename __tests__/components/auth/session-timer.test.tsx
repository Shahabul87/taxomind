import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');

const mockUseSession = useSession as jest.Mock;

// Mock window.location
const originalLocation = window.location;

import { SessionTimer } from '@/components/auth/session-timer';

describe('SessionTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('returns null when session is not near expiry', () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test' },
        expires: futureDate,
      },
      update: jest.fn(),
    });

    const { container } = render(<SessionTimer />);
    expect(container.firstChild).toBeNull();
  });

  it('shows warning when time remaining is less than 5 minutes', () => {
    const nearExpiry = new Date(Date.now() + 240000).toISOString(); // 4 minutes from now
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test' },
        expires: nearExpiry,
      },
      update: jest.fn(),
    });

    render(<SessionTimer />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(screen.getByText('Session Timeout Warning')).toBeInTheDocument();
  });

  it('shows urgent state when less than 60 seconds remaining', () => {
    const nearExpiry = new Date(Date.now() + 45000).toISOString(); // 45 seconds from now
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test' },
        expires: nearExpiry,
      },
      update: jest.fn(),
    });

    render(<SessionTimer />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(screen.getByText('Session Expiring Soon!')).toBeInTheDocument();
  });

  it('calls session update when extend button is clicked', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({});
    const nearExpiry = new Date(Date.now() + 180000).toISOString(); // 3 minutes

    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test' },
        expires: nearExpiry,
      },
      update: mockUpdate,
    });

    render(<SessionTimer />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    const extendButton = screen.getByText('Extend Session');
    await act(async () => {
      fireEvent.click(extendButton);
    });

    expect(mockUpdate).toHaveBeenCalled();
  });

  it('returns null when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      update: jest.fn(),
    });

    const { container } = render(<SessionTimer />);
    expect(container.firstChild).toBeNull();
  });

  it('cleans up interval on unmount', () => {
    const nearExpiry = new Date(Date.now() + 180000).toISOString();
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test' },
        expires: nearExpiry,
      },
      update: jest.fn(),
    });

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<SessionTimer />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});

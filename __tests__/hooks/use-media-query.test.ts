/**
 * Tests for useMediaQuery hook
 * Source: hooks/use-media-query.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/use-media-query';

describe('useMediaQuery', () => {
  let addListenerFn: jest.Mock;
  let removeListenerFn: jest.Mock;
  let changeHandler: ((event: { matches: boolean }) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();
    changeHandler = null;
    addListenerFn = jest.fn((event: string, handler: (e: { matches: boolean }) => void) => {
      if (event === 'change') changeHandler = handler;
    });
    removeListenerFn = jest.fn();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: addListenerFn,
        removeEventListener: removeListenerFn,
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('returns false initially (SSR safe)', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('matches media query when matchMedia returns true', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: addListenerFn,
      removeEventListener: removeListenerFn,
    }));

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates on media change event', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it('handles different queries', () => {
    renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    unmount();
    expect(removeListenerFn).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

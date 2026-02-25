/**
 * Tests for useIntersectionObserver hook
 * Source: hooks/use-intersection-observer.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

// Capture IntersectionObserver constructor calls
let observerCallback: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;
let observerInstance: { observe: jest.Mock; unobserve: jest.Mock; disconnect: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();

  observerInstance = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };

  (globalThis as Record<string, unknown>).IntersectionObserver = jest.fn(
    (callback: typeof observerCallback) => {
      observerCallback = callback;
      return observerInstance;
    }
  );
});

function createRef(element: Element | null = document.createElement('div')) {
  return { current: element } as React.RefObject<Element>;
}

describe('useIntersectionObserver', () => {
  it('returns ref and initial inView false', () => {
    const ref = createRef();
    const { result } = renderHook(() => useIntersectionObserver(ref));
    expect(result.current.isIntersecting).toBe(false);
    expect(result.current.hasBeenVisible).toBe(false);
  });

  it('sets isIntersecting true when element becomes visible', () => {
    const ref = createRef();
    const { result } = renderHook(() => useIntersectionObserver(ref));

    act(() => {
      observerCallback([{ isIntersecting: true, target: ref.current! }]);
    });

    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.hasBeenVisible).toBe(true);
  });

  it('sets isIntersecting false when element becomes not visible', () => {
    const ref = createRef();
    const { result } = renderHook(() => useIntersectionObserver(ref));

    act(() => {
      observerCallback([{ isIntersecting: true, target: ref.current! }]);
    });
    expect(result.current.isIntersecting).toBe(true);

    act(() => {
      observerCallback([{ isIntersecting: false, target: ref.current! }]);
    });
    expect(result.current.isIntersecting).toBe(false);
    // hasBeenVisible stays true
    expect(result.current.hasBeenVisible).toBe(true);
  });

  it('respects threshold option', () => {
    const ref = createRef();
    renderHook(() => useIntersectionObserver(ref, { threshold: 0.5 }));
    expect(globalThis.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.5 })
    );
  });

  it('disconnects observer on unmount', () => {
    const ref = createRef();
    const { unmount } = renderHook(() => useIntersectionObserver(ref));
    unmount();
    expect(observerInstance.disconnect).toHaveBeenCalled();
  });
});

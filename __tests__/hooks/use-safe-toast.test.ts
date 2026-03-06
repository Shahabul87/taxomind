/**
 * Tests for useSafeToast hook
 * Source: hooks/use-safe-toast.ts
 *
 * This hook wraps the toast store to provide a convenient API
 * (success, error, info, custom) and processes queued toasts on mount.
 */

import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAddToast = jest.fn();
const mockProcessQueue = jest.fn();

jest.mock('@/store/toast-store', () => ({
  useToastStore: () => ({
    addToast: mockAddToast,
    processQueue: mockProcessQueue,
  }),
}));

// Import AFTER mocks are declared so the module picks up the mocked store
import { useSafeToast } from '@/hooks/use-safe-toast';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('useSafeToast', () => {
  beforeEach(() => {
    mockAddToast.mockClear();
    mockProcessQueue.mockClear();
  });

  // -----------------------------------------------------------------------
  // 1. Return value shape
  // -----------------------------------------------------------------------
  describe('return value', () => {
    it('should return an object with success, error, info, and custom methods', () => {
      const { result } = renderHook(() => useSafeToast());

      expect(result.current).toHaveProperty('success');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('info');
      expect(result.current).toHaveProperty('custom');
    });

    it('should return functions for all four methods', () => {
      const { result } = renderHook(() => useSafeToast());

      expect(typeof result.current.success).toBe('function');
      expect(typeof result.current.error).toBe('function');
      expect(typeof result.current.info).toBe('function');
      expect(typeof result.current.custom).toBe('function');
    });
  });

  // -----------------------------------------------------------------------
  // 2. processQueue on mount
  // -----------------------------------------------------------------------
  describe('processQueue on mount', () => {
    it('should call processQueue when the hook mounts', () => {
      renderHook(() => useSafeToast());

      expect(mockProcessQueue).toHaveBeenCalledTimes(1);
    });

    it('should not call processQueue again on re-render when processQueue reference is stable', () => {
      const { rerender } = renderHook(() => useSafeToast());

      // processQueue is called once on mount
      expect(mockProcessQueue).toHaveBeenCalledTimes(1);

      rerender();

      // The mock function reference is stable, so the effect does not re-run
      expect(mockProcessQueue).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // 3. success()
  // -----------------------------------------------------------------------
  describe('success()', () => {
    it('should call addToast with type "success" and the provided message', () => {
      const { result } = renderHook(() => useSafeToast());

      act(() => {
        result.current.success('Operation completed');
      });

      expect(mockAddToast).toHaveBeenCalledTimes(1);
      expect(mockAddToast).toHaveBeenCalledWith('success', 'Operation completed', undefined);
    });

    it('should forward options to addToast', () => {
      const { result } = renderHook(() => useSafeToast());
      const options = { duration: 5000, description: 'Details here' };

      act(() => {
        result.current.success('Saved', options);
      });

      expect(mockAddToast).toHaveBeenCalledWith('success', 'Saved', options);
    });
  });

  // -----------------------------------------------------------------------
  // 4. error()
  // -----------------------------------------------------------------------
  describe('error()', () => {
    it('should call addToast with type "error" and the provided message', () => {
      const { result } = renderHook(() => useSafeToast());

      act(() => {
        result.current.error('Something went wrong');
      });

      expect(mockAddToast).toHaveBeenCalledTimes(1);
      expect(mockAddToast).toHaveBeenCalledWith('error', 'Something went wrong', undefined);
    });

    it('should forward options to addToast', () => {
      const { result } = renderHook(() => useSafeToast());
      const options = { duration: 10000 };

      act(() => {
        result.current.error('Failed to save', options);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Failed to save', options);
    });
  });

  // -----------------------------------------------------------------------
  // 5. info()
  // -----------------------------------------------------------------------
  describe('info()', () => {
    it('should call addToast with type "info" and the provided message', () => {
      const { result } = renderHook(() => useSafeToast());

      act(() => {
        result.current.info('Heads up');
      });

      expect(mockAddToast).toHaveBeenCalledTimes(1);
      expect(mockAddToast).toHaveBeenCalledWith('info', 'Heads up', undefined);
    });

    it('should forward options to addToast', () => {
      const { result } = renderHook(() => useSafeToast());
      const options = { position: 'top-center' };

      act(() => {
        result.current.info('Update available', options);
      });

      expect(mockAddToast).toHaveBeenCalledWith('info', 'Update available', options);
    });
  });

  // -----------------------------------------------------------------------
  // 6. custom()
  // -----------------------------------------------------------------------
  describe('custom()', () => {
    it('should call addToast with type "custom" and the provided message', () => {
      const { result } = renderHook(() => useSafeToast());

      act(() => {
        result.current.custom('Custom notification');
      });

      expect(mockAddToast).toHaveBeenCalledTimes(1);
      expect(mockAddToast).toHaveBeenCalledWith('custom', 'Custom notification', undefined);
    });

    it('should forward options to addToast', () => {
      const { result } = renderHook(() => useSafeToast());
      const options = { icon: 'star', className: 'custom-toast' };

      act(() => {
        result.current.custom('Special alert', options);
      });

      expect(mockAddToast).toHaveBeenCalledWith('custom', 'Special alert', options);
    });
  });

  // -----------------------------------------------------------------------
  // 7. General behavior
  // -----------------------------------------------------------------------
  describe('general behavior', () => {
    it('should handle multiple toast calls in sequence', () => {
      const { result } = renderHook(() => useSafeToast());

      act(() => {
        result.current.success('First');
        result.current.error('Second');
        result.current.info('Third');
      });

      expect(mockAddToast).toHaveBeenCalledTimes(3);
      expect(mockAddToast).toHaveBeenNthCalledWith(1, 'success', 'First', undefined);
      expect(mockAddToast).toHaveBeenNthCalledWith(2, 'error', 'Second', undefined);
      expect(mockAddToast).toHaveBeenNthCalledWith(3, 'info', 'Third', undefined);
    });

    it('should handle empty string messages', () => {
      const { result } = renderHook(() => useSafeToast());

      act(() => {
        result.current.success('');
      });

      expect(mockAddToast).toHaveBeenCalledWith('success', '', undefined);
    });
  });
});

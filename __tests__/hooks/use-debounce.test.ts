import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/use-debounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value shouldn't change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'first', delay: 1000 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ value: 'second', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should still be initial because we reset the timer
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should be 'second'
    expect(result.current).toBe('second');
  });
});
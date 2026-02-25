/**
 * Tests for useOutsideClick hook
 * Source: hooks/use-outside-click.ts
 */

import { renderHook } from '@testing-library/react';
import { useOutsideClick } from '@/hooks/use-outside-click';

describe('useOutsideClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRef(element: HTMLDivElement | null = document.createElement('div')) {
    return { current: element } as React.RefObject<HTMLDivElement>;
  }

  it('calls handler on outside click (mousedown)', () => {
    const handler = jest.fn();
    const ref = createRef();
    document.body.appendChild(ref.current!);

    renderHook(() => useOutsideClick(ref, handler));

    // Simulate a click outside the ref element
    const outsideElement = document.createElement('span');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref.current!);
    document.body.removeChild(outsideElement);
  });

  it('does not call handler when clicking inside the ref element', () => {
    const handler = jest.fn();
    const container = document.createElement('div');
    const child = document.createElement('button');
    container.appendChild(child);
    document.body.appendChild(container);

    const ref = { current: container } as React.RefObject<HTMLDivElement>;
    renderHook(() => useOutsideClick(ref, handler));

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: child });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('handles null ref gracefully', () => {
    const handler = jest.fn();
    const ref = createRef(null);

    renderHook(() => useOutsideClick(ref, handler));

    const event = new MouseEvent('mousedown', { bubbles: true });
    document.dispatchEvent(event);

    // Should not call handler because ref.current is null
    expect(handler).not.toHaveBeenCalled();
  });

  it('removes listeners on unmount', () => {
    const handler = jest.fn();
    const ref = createRef();
    document.body.appendChild(ref.current!);

    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useOutsideClick(ref, handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    removeEventListenerSpy.mockRestore();
    document.body.removeChild(ref.current!);
  });
});

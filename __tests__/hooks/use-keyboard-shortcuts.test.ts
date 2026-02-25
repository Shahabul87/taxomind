/**
 * Tests for useKeyboardShortcuts hook
 * Source: hooks/use-keyboard-shortcuts.ts
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut } from '@/hooks/use-keyboard-shortcuts';

function fireKeyDown(
  key: string,
  modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean } = {},
  target: HTMLElement = document.createElement('div')
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrlKey ?? false,
    shiftKey: modifiers.shiftKey ?? false,
    altKey: modifiers.altKey ?? false,
    metaKey: modifiers.metaKey ?? false,
    bubbles: true,
  });
  // Override target since KeyboardEvent constructor doesn't set it
  Object.defineProperty(event, 'target', { value: target });
  document.dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers shortcut handler and triggers on correct key', () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'Escape', description: 'Close', handler }],
      })
    );

    fireKeyDown('Escape');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not trigger on wrong key', () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'Escape', description: 'Close', handler }],
      })
    );

    fireKeyDown('Enter');
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles Ctrl modifier key', () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'e', ctrl: true, description: 'Export', handler }],
      })
    );

    // Without Ctrl - should not trigger
    fireKeyDown('e');
    expect(handler).not.toHaveBeenCalled();

    // With Ctrl - should trigger
    fireKeyDown('e', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles Shift modifier key', () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: '?', shift: true, description: 'Help', handler }],
      })
    );

    fireKeyDown('?', { shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('cleans up on unmount', () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'Escape', description: 'Close', handler }],
      })
    );

    unmount();
    fireKeyDown('Escape');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('formatShortcut', () => {
  it('formats a simple key', () => {
    const result = formatShortcut({ key: 'Escape', description: 'Close', handler: jest.fn() });
    expect(result).toBe('Esc');
  });

  it('formats key with Ctrl modifier', () => {
    const result = formatShortcut({ key: 'e', ctrl: true, description: 'Export', handler: jest.fn() });
    // In test environment, navigator.platform is usually empty/Linux-like
    expect(result).toContain('E');
  });
});

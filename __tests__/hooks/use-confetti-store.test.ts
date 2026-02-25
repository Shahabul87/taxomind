/**
 * Tests for useConfettiStore (Zustand store hook)
 * Source: hooks/use-confetti-store.ts
 */

import { act } from '@testing-library/react';
import { useConfettiStore } from '@/hooks/use-confetti-store';

describe('useConfettiStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    act(() => {
      useConfettiStore.setState({ isOpen: false });
    });
  });

  it('should have initial state as closed', () => {
    const state = useConfettiStore.getState();

    expect(state.isOpen).toBe(false);
  });

  it('should open confetti', () => {
    act(() => {
      useConfettiStore.getState().onOpen();
    });

    expect(useConfettiStore.getState().isOpen).toBe(true);
  });

  it('should close confetti', () => {
    // First open, then close
    act(() => {
      useConfettiStore.getState().onOpen();
    });

    expect(useConfettiStore.getState().isOpen).toBe(true);

    act(() => {
      useConfettiStore.getState().onClose();
    });

    expect(useConfettiStore.getState().isOpen).toBe(false);
  });

  it('should toggle between open and close', () => {
    const store = useConfettiStore.getState();

    expect(store.isOpen).toBe(false);

    act(() => {
      useConfettiStore.getState().onOpen();
    });
    expect(useConfettiStore.getState().isOpen).toBe(true);

    act(() => {
      useConfettiStore.getState().onClose();
    });
    expect(useConfettiStore.getState().isOpen).toBe(false);

    act(() => {
      useConfettiStore.getState().onOpen();
    });
    expect(useConfettiStore.getState().isOpen).toBe(true);
  });
});

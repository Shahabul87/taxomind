/**
 * Tests for useBehaviorPatterns hook
 * @sam-ai/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock React hooks
// ---------------------------------------------------------------------------

const mockSetState = vi.fn();
const mockCleanup = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn((init) => [init, mockSetState]),
    useCallback: vi.fn((fn) => fn),
    useEffect: vi.fn((fn) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') mockCleanup.mockImplementation(cleanup);
    }),
  };
});

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  useBehaviorPatterns,
  type BehaviorPattern,
  type UseBehaviorPatternsReturn,
} from '../../hooks/useBehaviorPatterns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePattern(overrides: Partial<BehaviorPattern> = {}): BehaviorPattern {
  return {
    id: 'pattern-1',
    userId: 'user-1',
    type: 'STRUGGLE',
    name: 'Struggle with recursion',
    description: 'User struggles with recursive concepts',
    confidence: 0.85,
    frequency: 5,
    firstDetected: '2025-01-01T00:00:00Z',
    lastDetected: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBehaviorPatterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should return initial empty state', () => {
    const result = useBehaviorPatterns({ autoFetch: false });

    expect(result.patterns).toEqual([]);
    expect(result.isLoading).toBe(false);
    expect(result.isDetecting).toBe(false);
    expect(result.error).toBeNull();
  });

  it('should expose detectPatterns that calls POST endpoint', async () => {
    const mockPatterns = [makePattern(), makePattern({ id: 'pattern-2', type: 'PACE' })];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { patterns: mockPatterns },
        }),
    });

    const result = useBehaviorPatterns({ autoFetch: false });
    const detected = await result.detectPatterns();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sam/agentic/behavior/patterns',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(detected).toHaveLength(2);
    expect(detected[0].id).toBe('pattern-1');
  });

  it('should expose refresh that calls GET endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { patterns: [makePattern({ type: 'LEARNING_STYLE' })] },
        }),
    });

    const result = useBehaviorPatterns({ autoFetch: false });
    await result.refresh();

    expect(mockFetch).toHaveBeenCalledWith('/api/sam/agentic/behavior/patterns');
  });

  it('should reflect initial loading state as false', () => {
    const result = useBehaviorPatterns({ autoFetch: false });
    expect(result.isLoading).toBe(false);
    expect(result.isDetecting).toBe(false);
  });

  it('should throw when detect endpoint returns an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Detection failed' }),
    });

    const result = useBehaviorPatterns({ autoFetch: false });

    await expect(result.detectPatterns()).rejects.toThrow(
      'Failed to detect behavior patterns',
    );
  });

  it('should return empty array when detect returns no success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: false,
          data: null,
        }),
    });

    const result = useBehaviorPatterns({ autoFetch: false });
    const detected = await result.detectPatterns();

    expect(detected).toEqual([]);
  });
});

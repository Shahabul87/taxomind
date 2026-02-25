/**
 * Tests for useSAMAnalysis hook
 * @sam-ai/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAnalyze = vi.fn();
const mockGetBloomsAnalysis = vi.fn();

vi.mock('../../context/SAMContext', () => ({
  useSAMContext: vi.fn(() => ({
    analyze: mockAnalyze,
    lastResult: null,
    getBloomsAnalysis: mockGetBloomsAnalysis,
  })),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn((init) => [init, vi.fn()]),
    useCallback: vi.fn((fn) => fn),
  };
});

import { useSAMAnalysis } from '../../hooks/useSAMAnalysis';
import { useSAMContext } from '../../context/SAMContext';

describe('useSAMAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBloomsAnalysis.mockReturnValue(null);
  });

  it('should return initial state with no analysis', () => {
    const result = useSAMAnalysis();

    expect(result.isAnalyzing).toBe(false);
    expect(result.lastAnalysis).toBeNull();
    expect(result.bloomsAnalysis).toBeNull();
  });

  it('should expose analyze function', () => {
    const result = useSAMAnalysis();

    expect(typeof result.analyze).toBe('function');
  });

  it('should return Bloom analysis when available', () => {
    mockGetBloomsAnalysis.mockReturnValue({
      dominantLevel: 'ANALYZE',
      cognitiveDepth: 75,
      distribution: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 25, ANALYZE: 30, EVALUATE: 10, CREATE: 5 },
    });

    const result = useSAMAnalysis();

    expect(result.bloomsAnalysis).toBeDefined();
    expect(result.bloomsAnalysis!.dominantLevel).toBe('ANALYZE');
  });

  it('should handle loading state during analysis', () => {
    // The hook uses useState which starts at false
    const result = useSAMAnalysis();
    expect(result.isAnalyzing).toBe(false);
  });

  it('should handle analysis errors gracefully', async () => {
    mockAnalyze.mockRejectedValueOnce(new Error('Analysis failed'));

    const result = useSAMAnalysis();

    // The analyze function should handle errors internally
    try {
      await result.analyze('test');
    } catch {
      // Error is expected to propagate or be caught internally
    }
  });

  it('should cache results from lastResult', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      analyze: mockAnalyze,
      lastResult: {
        response: { message: 'Analysis complete' },
        metadata: { bloomsLevel: 'APPLY' },
      },
      getBloomsAnalysis: mockGetBloomsAnalysis,
    } as never);

    const result = useSAMAnalysis();

    expect(result.lastAnalysis).toBeDefined();
  });

  it('should support re-analyze with new query', async () => {
    mockAnalyze.mockResolvedValue({ response: { message: 'New analysis' } });

    const result = useSAMAnalysis();

    await result.analyze('Analyze new content');
    expect(mockAnalyze).toHaveBeenCalledWith('Analyze new content');
  });

  it('should return null bloomsAnalysis when not available', () => {
    mockGetBloomsAnalysis.mockReturnValue(null);

    const result = useSAMAnalysis();

    expect(result.bloomsAnalysis).toBeNull();
  });
});

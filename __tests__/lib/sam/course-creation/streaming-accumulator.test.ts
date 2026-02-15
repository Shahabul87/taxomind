/**
 * Streaming Accumulator with Thinking Extraction Tests
 */

// ============================================================================
// Mocks — must be before imports
// ============================================================================

const mockRunSAMChatStream = jest.fn();
const mockRunSAMChatWithPreference = jest.fn();

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatStream: (...args: unknown[]) => mockRunSAMChatStream(...args),
  runSAMChatWithPreference: (...args: unknown[]) => mockRunSAMChatWithPreference(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { streamWithThinkingExtraction } from '@/lib/sam/course-creation/streaming-accumulator';

// ============================================================================
// Helpers
// ============================================================================

/** Creates a mock async generator that yields the given chunks */
function createMockStream(chunks: string[]) {
  return (async function* () {
    for (const chunk of chunks) {
      yield { content: chunk, done: false };
    }
    yield { content: '', done: true };
  })();
}

function baseOptions(overrides?: Record<string, unknown>) {
  return {
    userId: 'user-1',
    messages: [{ role: 'user' as const, content: 'test' }],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('streamWithThinkingExtraction', () => {
  describe('fallback to runSAMChatWithPreference()', () => {
    it('falls back when streaming throws', async () => {
      mockRunSAMChatStream.mockImplementation(() => {
        throw new Error('Stream unavailable');
      });
      mockRunSAMChatWithPreference.mockResolvedValue(
        '{"thinking":"I am thinking","chapter":{}}'
      );

      const result = await streamWithThinkingExtraction(baseOptions());

      expect(result.fullContent).toBe('{"thinking":"I am thinking","chapter":{}}');
      expect(result.thinkingExtracted).toBe(''); // No extraction in fallback
    });
  });

  // ============================================================================
  // Tests: Streaming with thinking extraction
  // ============================================================================

  describe('streaming with thinking extraction', () => {
    it('accumulates full response', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream(['{"thi', 'nking":', ' "test ', 'thinking",', ' "chapter": {}}'])
      );

      const result = await streamWithThinkingExtraction(baseOptions());

      expect(result.fullContent).toBe('{"thinking": "test thinking", "chapter": {}}');
    });

    it('extracts thinking from single chunk', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream(['{"thinking": "SAM is analyzing the course structure", "chapter": {}}'])
      );

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction(
        baseOptions({ onThinkingChunk: (chunk: string) => chunks.push(chunk) })
      );

      expect(result.thinkingExtracted).toBe('SAM is analyzing the course structure');
      expect(chunks.join('')).toBe('SAM is analyzing the course structure');
    });

    it('extracts thinking across multiple chunks', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream([
          '{"thinking": "First ',
          'part of ',
          'the thinking",',
          ' "chapter": {}}',
        ])
      );

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction(
        baseOptions({ onThinkingChunk: (chunk: string) => chunks.push(chunk) })
      );

      expect(result.thinkingExtracted).toBe('First part of the thinking');
      expect(chunks.join('')).toBe('First part of the thinking');
    });

    it('handles escaped quotes in thinking', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream([
          '{"thinking": "SAM says \\"hello\\" to the student", "chapter": {}}',
        ])
      );

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction(
        baseOptions({ onThinkingChunk: (chunk: string) => chunks.push(chunk) })
      );

      expect(result.thinkingExtracted).toBe('SAM says "hello" to the student');
    });

    it('handles newlines in thinking', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream(['{"thinking": "Line 1\\nLine 2", "chapter": {}}'])
      );

      const result = await streamWithThinkingExtraction(baseOptions());

      expect(result.thinkingExtracted).toBe('Line 1\nLine 2');
    });

    it('handles thinking key split across chunks', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream([
          '{"thin',
          'king": "extracted value", "rest": true}',
        ])
      );

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction(
        baseOptions({ onThinkingChunk: (chunk: string) => chunks.push(chunk) })
      );

      expect(result.thinkingExtracted).toBe('extracted value');
    });

    it('handles no thinking field gracefully', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream(['{"chapter": {"title": "Intro"}, "qualityScore": 75}'])
      );

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction(
        baseOptions({ onThinkingChunk: (chunk: string) => chunks.push(chunk) })
      );

      expect(result.thinkingExtracted).toBe('');
      expect(chunks).toHaveLength(0);
    });

    it('emits thinking chunks incrementally', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream([
          '{"thinking": "A',
          'B',
          'C',
          'D',
          '", "done": true}',
        ])
      );

      const chunks: string[] = [];
      await streamWithThinkingExtraction(
        baseOptions({ onThinkingChunk: (chunk: string) => chunks.push(chunk) })
      );

      // Each chunk should be emitted separately (not accumulated)
      expect(chunks.length).toBeGreaterThanOrEqual(4);
      expect(chunks.join('')).toBe('ABCD');
    });

    it('works without onThinkingChunk callback', async () => {
      mockRunSAMChatStream.mockReturnValue(
        createMockStream(['{"thinking": "no callback", "chapter": {}}'])
      );

      const result = await streamWithThinkingExtraction(baseOptions());

      expect(result.thinkingExtracted).toBe('no callback');
      expect(result.fullContent).toBe('{"thinking": "no callback", "chapter": {}}');
    });
  });
});

/**
 * Streaming Accumulator with Thinking Extraction Tests
 */

import { streamWithThinkingExtraction } from '@/lib/sam/course-creation/streaming-accumulator';
import type { AIAdapter as CoreAIAdapter } from '@sam-ai/core';

// ============================================================================
// Mock Helpers
// ============================================================================

/** Creates a mock AI adapter with optional streaming support */
function createMockAdapter(options: {
  chatResponse?: string;
  streamChunks?: string[];
  hasStream?: boolean;
}): CoreAIAdapter {
  const { chatResponse = '{"thinking":"test"}', streamChunks, hasStream = true } = options;

  const adapter: CoreAIAdapter = {
    name: 'mock',
    version: '1.0.0',

    async chat() {
      return {
        content: chatResponse,
        usage: { inputTokens: 100, outputTokens: 50 },
        finishReason: 'stop' as const,
      };
    },

    isConfigured() { return true; },
    getModel() { return 'mock-model'; },
  };

  if (hasStream && streamChunks) {
    adapter.chatStream = async function* () {
      for (const chunk of streamChunks) {
        yield { content: chunk, done: false };
      }
      yield { content: '', done: true };
    };
  }

  return adapter;
}

// ============================================================================
// Tests: Fallback to chat()
// ============================================================================

describe('streamWithThinkingExtraction', () => {
  describe('fallback to chat()', () => {
    it('falls back when chatStream is not available', async () => {
      const adapter = createMockAdapter({
        chatResponse: '{"thinking":"I am thinking","chapter":{}}',
        hasStream: false,
      });

      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
      });

      expect(result.fullContent).toBe('{"thinking":"I am thinking","chapter":{}}');
      expect(result.thinkingExtracted).toBe(''); // No extraction in fallback
    });
  });

  // ============================================================================
  // Tests: Streaming with thinking extraction
  // ============================================================================

  describe('streaming with thinking extraction', () => {
    it('accumulates full response', async () => {
      const adapter = createMockAdapter({
        streamChunks: ['{"thi', 'nking":', ' "test ', 'thinking",', ' "chapter": {}}'],
      });

      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
      });

      expect(result.fullContent).toBe('{"thinking": "test thinking", "chapter": {}}');
    });

    it('extracts thinking from single chunk', async () => {
      const adapter = createMockAdapter({
        streamChunks: ['{"thinking": "SAM is analyzing the course structure", "chapter": {}}'],
      });

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        onThinkingChunk: (chunk) => chunks.push(chunk),
      });

      expect(result.thinkingExtracted).toBe('SAM is analyzing the course structure');
      expect(chunks.join('')).toBe('SAM is analyzing the course structure');
    });

    it('extracts thinking across multiple chunks', async () => {
      const adapter = createMockAdapter({
        streamChunks: [
          '{"thinking": "First ',
          'part of ',
          'the thinking",',
          ' "chapter": {}}',
        ],
      });

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        onThinkingChunk: (chunk) => chunks.push(chunk),
      });

      expect(result.thinkingExtracted).toBe('First part of the thinking');
      expect(chunks.join('')).toBe('First part of the thinking');
    });

    it('handles escaped quotes in thinking', async () => {
      const adapter = createMockAdapter({
        streamChunks: [
          '{"thinking": "SAM says \\"hello\\" to the student", "chapter": {}}',
        ],
      });

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        onThinkingChunk: (chunk) => chunks.push(chunk),
      });

      expect(result.thinkingExtracted).toBe('SAM says "hello" to the student');
    });

    it('handles newlines in thinking', async () => {
      const adapter = createMockAdapter({
        streamChunks: [
          '{"thinking": "Line 1\\nLine 2", "chapter": {}}',
        ],
      });

      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
      });

      expect(result.thinkingExtracted).toBe('Line 1\nLine 2');
    });

    it('handles thinking key split across chunks', async () => {
      const adapter = createMockAdapter({
        streamChunks: [
          '{"thin',
          'king": "extracted value", "rest": true}',
        ],
      });

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        onThinkingChunk: (chunk) => chunks.push(chunk),
      });

      expect(result.thinkingExtracted).toBe('extracted value');
    });

    it('handles no thinking field gracefully', async () => {
      const adapter = createMockAdapter({
        streamChunks: ['{"chapter": {"title": "Intro"}, "qualityScore": 75}'],
      });

      const chunks: string[] = [];
      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        onThinkingChunk: (chunk) => chunks.push(chunk),
      });

      expect(result.thinkingExtracted).toBe('');
      expect(chunks).toHaveLength(0);
    });

    it('emits thinking chunks incrementally', async () => {
      const adapter = createMockAdapter({
        streamChunks: [
          '{"thinking": "A',
          'B',
          'C',
          'D',
          '", "done": true}',
        ],
      });

      const chunks: string[] = [];
      await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        onThinkingChunk: (chunk) => chunks.push(chunk),
      });

      // Each chunk should be emitted separately (not accumulated)
      expect(chunks.length).toBeGreaterThanOrEqual(4);
      expect(chunks.join('')).toBe('ABCD');
    });

    it('works without onThinkingChunk callback', async () => {
      const adapter = createMockAdapter({
        streamChunks: ['{"thinking": "no callback", "chapter": {}}'],
      });

      const result = await streamWithThinkingExtraction({
        aiAdapter: adapter,
        chatParams: { messages: [{ role: 'user', content: 'test' }] },
        // No onThinkingChunk
      });

      expect(result.thinkingExtracted).toBe('no callback');
      expect(result.fullContent).toBe('{"thinking": "no callback", "chapter": {}}');
    });
  });
});

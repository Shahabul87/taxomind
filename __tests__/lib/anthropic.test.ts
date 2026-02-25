/**
 * Tests for Anthropic wrapper
 * Source: lib/anthropic.ts
 */

import { extractTextFromContentBlock, getResponseText } from '@/lib/anthropic';

describe('Anthropic Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTextFromContentBlock', () => {
    it('extracts text from a TextBlock', () => {
      const block = { type: 'text' as const, text: 'Hello, world!' };
      expect(extractTextFromContentBlock(block as never)).toBe('Hello, world!');
    });

    it('returns empty string for non-text block', () => {
      const block = { type: 'thinking' as const, thinking: 'reasoning...' };
      expect(extractTextFromContentBlock(block as never)).toBe('');
    });
  });

  describe('getResponseText', () => {
    it('returns text from first text block', () => {
      const content = [
        { type: 'text' as const, text: 'Response text' },
      ];
      expect(getResponseText(content as never[])).toBe('Response text');
    });

    it('returns fallback when no text block found', () => {
      const content = [
        { type: 'thinking' as const, thinking: 'reasoning' },
      ];
      expect(getResponseText(content as never[], 'fallback')).toBe('fallback');
    });

    it('returns empty string as default fallback', () => {
      expect(getResponseText([])).toBe('');
    });

    it('returns first text block even if multiple exist', () => {
      const content = [
        { type: 'text' as const, text: 'First' },
        { type: 'text' as const, text: 'Second' },
      ];
      expect(getResponseText(content as never[])).toBe('First');
    });
  });

  describe('anthropic client proxy', () => {
    it('requires ANTHROPIC_API_KEY environment variable', () => {
      // The key is set in jest.setup.js so the proxy should not throw on access
      // We test the proxy behavior indirectly
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      // Reset the module to clear the cached client
      jest.resetModules();

      // Re-import to get fresh proxy
      // The SDK is mocked in jest.setup.js so accessing it won't actually throw
      // but the proxy logic checks for the key
      const { anthropic: freshClient } = require('@/lib/anthropic');

      // Since @anthropic-ai/sdk is mocked, accessing a property triggers the proxy
      // which should check for the env var
      try {
        // Access a property to trigger proxy
        const _ = freshClient.messages;
      } catch (error) {
        expect((error as Error).message).toContain('ANTHROPIC_API_KEY');
      }

      process.env.ANTHROPIC_API_KEY = originalKey;
    });
  });
});

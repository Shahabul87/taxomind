/**
 * Streaming JSON Validator Tests
 *
 * Tests that StreamingJsonValidator correctly tracks brace/bracket depth
 * during streaming to detect truncated JSON responses.
 */

// ============================================================================
// Mocks — must be before imports
// ============================================================================

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatStream: jest.fn(),
  runSAMChatWithPreference: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { StreamingJsonValidator } from '../streaming-accumulator';

// ============================================================================
// StreamingJsonValidator
// ============================================================================

describe('StreamingJsonValidator', () => {
  describe('basic structure tracking', () => {
    it('detects complete simple JSON object', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"key": "value"}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('detects incomplete JSON object (missing closing brace)', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"key": "value"');
      expect(validator.isStructureComplete()).toBe(false);
    });

    it('detects complete nested JSON', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"a": {"b": [1, 2, 3]}, "c": true}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('detects incomplete nested JSON', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"a": {"b": [1, 2, 3]}, "c": true');
      expect(validator.isStructureComplete()).toBe(false);
    });

    it('returns false when no content has been fed', () => {
      const validator = new StreamingJsonValidator();
      expect(validator.isStructureComplete()).toBe(false);
    });

    it('returns false when only whitespace is fed', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('   \n\t  ');
      expect(validator.isStructureComplete()).toBe(false);
    });
  });

  describe('streaming chunks', () => {
    it('tracks structure across multiple chunks', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"title": ');
      expect(validator.isStructureComplete()).toBe(false);

      validator.feed('"Introduction",');
      expect(validator.isStructureComplete()).toBe(false);

      validator.feed(' "chapters": [');
      expect(validator.isStructureComplete()).toBe(false);

      validator.feed('{"name": "Ch1"}');
      expect(validator.isStructureComplete()).toBe(false);

      validator.feed(']}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('handles single-character chunks', () => {
      const json = '{"a":1}';
      const validator = new StreamingJsonValidator();
      for (const char of json) {
        validator.feed(char);
      }
      expect(validator.isStructureComplete()).toBe(true);
    });
  });

  describe('string handling', () => {
    it('ignores braces inside JSON strings', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"content": "This has {braces} and [brackets]"}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('handles escaped quotes inside strings', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"content": "He said \\"hello\\""}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('handles escaped backslashes inside strings', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"path": "C:\\\\Users\\\\test"}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('handles strings with escaped quotes at boundary', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"a": "test\\"');
      validator.feed('value"}');
      expect(validator.isStructureComplete()).toBe(true);
    });
  });

  describe('array tracking', () => {
    it('detects complete array', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"items": [1, 2, 3]}');
      expect(validator.isStructureComplete()).toBe(true);
    });

    it('detects incomplete array', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"items": [1, 2, 3}');
      // bracket depth is 1 (unmatched [), so incomplete
      expect(validator.isStructureComplete()).toBe(false);
    });

    it('tracks nested arrays', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"matrix": [[1, 2], [3, 4]]}');
      expect(validator.isStructureComplete()).toBe(true);
    });
  });

  describe('bytes tracking', () => {
    it('tracks total bytes processed', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('abc');
      validator.feed('defgh');
      expect(validator.getBytesProcessed()).toBe(8);
    });

    it('reports 0 bytes when nothing has been fed', () => {
      const validator = new StreamingJsonValidator();
      expect(validator.getBytesProcessed()).toBe(0);
    });
  });

  describe('truncation detection scenarios', () => {
    it('detects truncation mid-object', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"title": "Introduction to React", "chapters": [{"name": "JSX Basics", "sections": [{"title": "What is JSX"');
      expect(validator.isStructureComplete()).toBe(false);
    });

    it('detects truncation mid-string', () => {
      const validator = new StreamingJsonValidator();
      validator.feed('{"description": "This is a long description that gets cut off');
      expect(validator.isStructureComplete()).toBe(false);
    });

    it('identifies complete complex course-like JSON', () => {
      const validator = new StreamingJsonValidator();
      const courseJson = JSON.stringify({
        thinking: 'I will create a course about React',
        title: 'React Fundamentals',
        chapters: [
          { name: 'Introduction', sections: ['What is React', 'Setup'] },
          { name: 'Components', sections: ['Function Components', 'Props'] },
        ],
      });
      validator.feed(courseJson);
      expect(validator.isStructureComplete()).toBe(true);
    });
  });
});

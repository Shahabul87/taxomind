/**
 * Structure Gate Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StructureGate, createStructureGate } from '../structure-gate';
import type { GeneratedContent } from '../types';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestContent(overrides: Partial<GeneratedContent> = {}): GeneratedContent {
  return {
    content: `
# Introduction

This is an introductory paragraph about the topic at hand. We will explore
various concepts and ideas throughout this lesson.

## Main Section

Here we dive into the main content. There are several key points to understand:

- First point about the topic
- Second point with more detail
- Third point for completeness

### Subsection

More detailed information goes here. The content builds upon previous sections.

## Examples

Consider the following code example:

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

This demonstrates **important** concepts in *programming*.

## Conclusion

In summary, we covered the key aspects of this topic.
    `.trim(),
    type: 'lesson',
    ...overrides,
  };
}

// ============================================================================
// STRUCTURE GATE TESTS
// ============================================================================

describe('StructureGate', () => {
  let gate: StructureGate;

  beforeEach(() => {
    gate = new StructureGate();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const g = new StructureGate();
      expect(g.name).toBe('StructureGate');
      expect(g.defaultWeight).toBe(1.0);
    });

    it('should accept custom config', () => {
      const g = new StructureGate({
        minHeadingDepth: 2,
        requireLists: true,
      });
      expect(g).toBeDefined();
    });
  });

  describe('evaluate basic structure', () => {
    it('should return all required fields', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result).toHaveProperty('gateName', 'StructureGate');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('metadata');
    });

    it('should include structure metrics in metadata', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata).toHaveProperty('headingCount');
      expect(result.metadata).toHaveProperty('headingLevels');
      expect(result.metadata).toHaveProperty('listCount');
      expect(result.metadata).toHaveProperty('codeBlockCount');
      expect(result.metadata).toHaveProperty('paragraphCount');
      expect(result.metadata).toHaveProperty('hasProperHierarchy');
      expect(result.metadata).toHaveProperty('markdownElements');
    });
  });

  describe('heading detection', () => {
    it('should count headings correctly', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata?.headingCount).toBeGreaterThan(0);
    });

    it('should flag missing headings for long content', async () => {
      const longContent = 'This is content. '.repeat(100);
      const content = createTestContent({
        content: longContent,
        type: 'lesson',
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('heading'))).toBe(true);
    });

    it('should not require headings for short content', async () => {
      const content = createTestContent({
        content: 'Short content that does not need headings.',
        type: 'lesson',
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('lacks section headings'))).toBe(
        false
      );
    });

    it('should track heading levels', async () => {
      const content = createTestContent({
        content: `# H1
## H2
### H3
#### H4`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.headingLevels).toEqual([1, 2, 3, 4]);
    });
  });

  describe('heading hierarchy', () => {
    it('should detect proper hierarchy', async () => {
      const content = createTestContent({
        content: `# Main
## Sub
### SubSub
## Another Sub`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.hasProperHierarchy).toBe(true);
    });

    it('should flag improper hierarchy', async () => {
      const content = createTestContent({
        content: `# Main
### Skipped H2
## Then H2`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.hasProperHierarchy).toBe(false);
      expect(result.issues.some((i) => i.description.includes('hierarchy'))).toBe(true);
    });

    it('should check heading depth limits', async () => {
      const g = new StructureGate({ maxHeadingDepth: 3 });
      const content = createTestContent({
        content: `# H1
## H2
### H3
#### H4 - Too Deep
##### H5 - Way Too Deep`,
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('too deep'))).toBe(true);
    });

    it('should check minimum heading depth', async () => {
      const g = new StructureGate({ minHeadingDepth: 2 });
      const content = createTestContent({
        content: `# This is H1
Content here.`,
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('h2') || i.description.includes('h1'))).toBe(true);
    });
  });

  describe('list detection', () => {
    it('should count lists', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata?.listCount).toBeGreaterThan(0);
    });

    it('should detect bullet lists', async () => {
      const content = createTestContent({
        content: `# Topic
- Item 1
- Item 2
* Item 3
+ Item 4`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.listCount).toBe(4);
    });

    it('should detect numbered lists', async () => {
      const content = createTestContent({
        content: `# Topic
1. First item
2. Second item
3. Third item`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.listCount).toBe(3);
    });

    it('should require lists when configured', async () => {
      const g = new StructureGate({ requireLists: true });
      const content = createTestContent({
        content: `# Topic

This content has no lists at all. Just paragraphs of text.
More text here without any list elements.`,
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('list'))).toBe(true);
    });
  });

  describe('code block detection', () => {
    it('should count code blocks', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata?.codeBlockCount).toBeGreaterThan(0);
    });

    it('should detect multiple code blocks', async () => {
      const content = createTestContent({
        content: `# Code Examples

\`\`\`javascript
code1
\`\`\`

\`\`\`python
code2
\`\`\`

\`\`\`
code3
\`\`\``,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.codeBlockCount).toBe(3);
    });

    it('should flag missing code formatting in technical content', async () => {
      const content = createTestContent({
        content: `# Programming Functions

Functions are blocks of code that perform tasks.
The syntax is function name() { body }
You call it with name().

This is technical content without proper code formatting.`,
        context: { topic: 'programming' },
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('code'))).toBe(true);
    });
  });

  describe('paragraph analysis', () => {
    it('should count paragraphs', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata?.paragraphCount).toBeGreaterThan(0);
    });

    it('should measure paragraph lengths', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata?.averageParagraphLength).toBeDefined();
      expect(result.metadata?.longestParagraphLength).toBeDefined();
    });

    it('should flag overly long paragraphs', async () => {
      const longParagraph = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five. This is sentence six. This is sentence seven. This is sentence eight. This is sentence nine. This is sentence ten. This is sentence eleven.';
      const content = createTestContent({
        content: `# Topic\n\n${longParagraph}`,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('long'))).toBe(true);
    });
  });

  describe('markdown element detection', () => {
    it('should detect various markdown elements', async () => {
      const content = createTestContent({
        content: `# Heading

- Bullet list

1. Numbered list

\`\`\`
code block
\`\`\`

\`inline code\`

**bold text**

*italic text*

[link](http://example.com)

> blockquote`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.markdownElements).toContain('headings');
      expect(result.metadata?.markdownElements).toContain('bullet-list');
      expect(result.metadata?.markdownElements).toContain('numbered-list');
      expect(result.metadata?.markdownElements).toContain('code-block');
      expect(result.metadata?.markdownElements).toContain('inline-code');
      expect(result.metadata?.markdownElements).toContain('bold');
      expect(result.metadata?.markdownElements).toContain('link');
      expect(result.metadata?.markdownElements).toContain('blockquote');
    });
  });

  describe('wall of text detection', () => {
    it('should detect wall of text', async () => {
      const longText = 'This is content without any structure. '.repeat(100);
      const content = createTestContent({
        content: longText,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('wall of text'))).toBe(true);
    });

    it('should not flag well-structured content', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('wall of text'))).toBe(false);
    });
  });

  describe('logical flow', () => {
    it('should check for transition words', async () => {
      const content = createTestContent({
        content: `# Topic

${'This is a sentence about the topic. '.repeat(50)}`,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('transition'))).toBe(true);
    });

    it('should pass content with good flow', async () => {
      const content = createTestContent({
        content: `# Topic

First, we introduce the concept. Then, we explore details.
However, there are exceptions. For example, consider this case.
Therefore, we conclude that the approach works.
Finally, in summary, the key points are clear.`,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('transition'))).toBe(false);
    });
  });

  describe('markdown formatting validation', () => {
    it('should detect plain URLs', async () => {
      const g = new StructureGate({ requireMarkdown: true });
      const content = createTestContent({
        content: `# Links

Check out this site: https://example.com for more info.`,
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('URL'))).toBe(true);
    });

    it('should not flag markdown links', async () => {
      const g = new StructureGate({ requireMarkdown: true });
      const content = createTestContent({
        content: `# Links

Check out [this site](https://example.com) for more info.`,
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('plain URL'))).toBe(false);
    });
  });

  describe('formatting consistency', () => {
    it('should detect mixed bullet styles', async () => {
      const content = createTestContent({
        content: `# List

- Item with dash
* Item with asterisk
- Another dash`,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('mixed bullet'))).toBe(true);
    });
  });

  describe('scoring', () => {
    it('should pass well-structured content', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it('should fail poorly structured content', async () => {
      const content = createTestContent({
        content: 'No structure at all. '.repeat(100),
        type: 'lesson',
      });
      const result = await gate.evaluate(content);

      expect(result.score).toBeLessThan(75);
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createStructureGate', () => {
  it('should create gate with default config', () => {
    const gate = createStructureGate();
    expect(gate).toBeInstanceOf(StructureGate);
  });

  it('should create gate with custom config', () => {
    const gate = createStructureGate({
      requireLists: true,
      maxParagraphLength: 5,
    });
    expect(gate).toBeInstanceOf(StructureGate);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  let gate: StructureGate;

  beforeEach(() => {
    gate = new StructureGate();
  });

  it('should handle empty content', async () => {
    const content = createTestContent({ content: '' });
    const result = await gate.evaluate(content);

    expect(result).toBeDefined();
  });

  it('should handle content with only headings', async () => {
    const content = createTestContent({
      content: `# Heading 1
## Heading 2
### Heading 3`,
    });
    const result = await gate.evaluate(content);

    expect(result).toBeDefined();
    expect(result.metadata?.headingCount).toBe(3);
  });

  it('should handle content with only code', async () => {
    const content = createTestContent({
      content: `\`\`\`javascript
function test() {
  return true;
}
\`\`\``,
    });
    const result = await gate.evaluate(content);

    expect(result.metadata?.codeBlockCount).toBe(1);
  });

  it('should handle non-standard content types', async () => {
    const content = createTestContent({
      type: 'quiz',
    });
    const result = await gate.evaluate(content);

    expect(result).toBeDefined();
  });
});

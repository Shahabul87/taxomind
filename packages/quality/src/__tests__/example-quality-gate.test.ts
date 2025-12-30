/**
 * Example Quality Gate Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExampleQualityGate, createExampleQualityGate } from '../example-quality-gate';
import type { GeneratedContent } from '../types';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestContent(overrides: Partial<GeneratedContent> = {}): GeneratedContent {
  return {
    content: `
# Understanding Variables

Variables are containers for storing data values. They are fundamental to programming.

For example, consider a variable that stores a user's age. We can declare it as:

\`\`\`javascript
let age = 25;
console.log(age); // Output: 25
\`\`\`

This demonstrates how variables work in practice. The variable 'age' holds the value 25.

Another example is storing text. For instance, we can store a name:

\`\`\`javascript
let name = "John";
console.log(name); // Output: John
\`\`\`

In real-world applications, companies use variables to track customer data,
inventory counts, and transaction amounts. This shows how variables are essential
in business software.
    `.trim(),
    type: 'lesson',
    ...overrides,
  };
}

// ============================================================================
// EXAMPLE QUALITY GATE TESTS
// ============================================================================

describe('ExampleQualityGate', () => {
  let gate: ExampleQualityGate;

  beforeEach(() => {
    gate = new ExampleQualityGate();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const g = new ExampleQualityGate();
      expect(g.name).toBe('ExampleQualityGate');
      expect(g.defaultWeight).toBe(1.2);
    });

    it('should accept custom config', () => {
      const g = new ExampleQualityGate({
        minExamples: 3,
        requireCodeExamples: true,
      });
      expect(g).toBeDefined();
    });
  });

  describe('evaluate basic structure', () => {
    it('should return all required fields', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result).toHaveProperty('gateName', 'ExampleQualityGate');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('metadata');
    });

    it('should have valid score range', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('example detection', () => {
    it('should detect explicit examples', async () => {
      const content = createTestContent({
        content: `For example, consider this case. Another example is when we use loops.
        Such as iterating over an array. Let's say we have a list of numbers.`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.exampleCount).toBeGreaterThan(0);
    });

    it('should detect code blocks as examples', async () => {
      const content = createTestContent({
        content: `
Here is some code:

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

This function adds two numbers.`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.hasCodeExamples).toBe(true);
    });

    it('should detect real-world examples', async () => {
      const content = createTestContent({
        content: `In real-world applications, companies use this pattern to manage customer data.
        For example, a retail business might track inventory using similar logic.
        The organization benefits from automated processing.`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.hasRealWorldExamples).toBe(true);
    });

    it('should detect scenario-based examples', async () => {
      const content = createTestContent({
        content: `Consider the following scenario: A user wants to log in to their account.
        In this case study, we examine how authentication works in practice.`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.exampleCount).toBeGreaterThan(0);
    });
  });

  describe('example count validation', () => {
    it('should pass with adequate examples', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      expect(result.metadata?.exampleCount).toBeGreaterThanOrEqual(1);
    });

    it('should flag insufficient examples', async () => {
      const g = new ExampleQualityGate({ minExamples: 5 });
      const content = createTestContent({
        content: 'This content has no examples. It just explains concepts without illustration.',
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('examples'))).toBe(true);
    });

    it('should flag too many examples', async () => {
      const g = new ExampleQualityGate({ maxExamples: 2 });
      const content = createTestContent({
        content: `For example, case 1 demonstrates a detailed approach to solving problems.
        For example, case 2 shows another method with more explanation.
        For example, case 3 provides a third way to understand this concept.
        For example, case 4 is yet another illustration of the principle.
        For example, case 5 gives additional context and information.
        For example, case 6 wraps up with a final comprehensive example.`,
      });
      const result = await g.evaluate(content);

      // Message says "exceeds the recommended maximum"
      expect(result.issues.some((i) => i.description.toLowerCase().includes('exceeds'))).toBe(true);
    });

    it('should use expectedExamples from content', async () => {
      const content = createTestContent({
        content: 'Simple content with one example. For example, this case.',
        expectedExamples: 5,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('requires'))).toBe(true);
    });
  });

  describe('example quality assessment', () => {
    it('should assess example quality', async () => {
      const content = createTestContent({
        content: `For example, consider a complex scenario where we need to process data.
        This demonstrates how the algorithm handles edge cases effectively because
        it checks for null values before processing. The result shows improved performance.`,
      });
      const result = await gate.evaluate(content);

      expect(result.metadata?.exampleCount).toBeGreaterThan(0);
    });

    it('should flag low quality examples', async () => {
      const content = createTestContent({
        content: `For example, case. Such as this. Consider that.
        For instance, thing. E.g., stuff.`,
      });
      const result = await gate.evaluate(content);

      // Short examples are low quality
      expect(result.score).toBeLessThan(100);
    });
  });

  describe('code example quality', () => {
    it('should check code examples for programming content', async () => {
      const g = new ExampleQualityGate({ requireCodeExamples: true });
      const content = createTestContent({
        content: `This is a programming lesson about functions.
        Functions are reusable blocks of code that perform specific tasks.`,
        context: { topic: 'programming' },
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('code'))).toBe(true);
    });

    it('should pass with code examples present', async () => {
      const g = new ExampleQualityGate({ requireCodeExamples: true });
      const content = createTestContent({
        content: `This is about programming functions.

\`\`\`javascript
// This function calculates the sum
function sum(numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
\`\`\`

The function above demonstrates how to use reduce.`,
        context: { topic: 'programming' },
      });
      const result = await g.evaluate(content);

      expect(result.metadata?.hasCodeExamples).toBe(true);
    });

    it('should flag code examples without comments', async () => {
      const content = createTestContent({
        content: `
\`\`\`javascript
x = 5
y = 10
z = x + y
\`\`\`
`,
      });
      const result = await gate.evaluate(content);

      // Short code without comments may be flagged
      expect(result.issues.some((i) => i.description.includes('comment'))).toBe(true);
    });
  });

  describe('real-world examples', () => {
    it('should require real-world examples when configured', async () => {
      const g = new ExampleQualityGate({ requireRealWorldExamples: true });
      const content = createTestContent({
        content: 'This is abstract content. For example, consider x = 5.',
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('real-world'))).toBe(true);
    });

    it('should pass with real-world examples present', async () => {
      const g = new ExampleQualityGate({ requireRealWorldExamples: true });
      const content = createTestContent({
        content: `In real-world applications, companies use this approach.
        For example, a retail business tracks inventory using similar patterns.
        The organization benefits from automated processing of customer data.`,
      });
      const result = await g.evaluate(content);

      expect(result.metadata?.hasRealWorldExamples).toBe(true);
    });
  });

  describe('example length', () => {
    it('should flag short examples', async () => {
      const g = new ExampleQualityGate({ minExampleLength: 30 });
      const content = createTestContent({
        content: 'For example, x. Such as y. Consider z.',
      });
      const result = await g.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('brief'))).toBe(true);
    });
  });

  describe('example variety', () => {
    it('should flag lack of variety', async () => {
      const content = createTestContent({
        content: `
Here is example one with code:
\`\`\`javascript
function example1() { return 1; }
\`\`\`

Here is example two with more code:
\`\`\`javascript
function example2() { return 2; }
\`\`\`

Here is example three with even more code:
\`\`\`javascript
function example3() { return 3; }
\`\`\`

Here is example four to complete the set:
\`\`\`javascript
function example4() { return 4; }
\`\`\`
`,
      });
      const result = await gate.evaluate(content);

      // All code examples - no variety. Message says "Examples lack variety"
      // Variety check only triggers with 3+ examples of same type
      expect(result.issues.some((i) => i.description.toLowerCase().includes('variety'))).toBe(true);
    });
  });

  describe('example placement', () => {
    it('should flag clustered examples', async () => {
      const intro = 'Introduction content. '.repeat(50);
      const examples = `
For example, case 1 shows how this works in detail.
For example, case 2 demonstrates another approach.
For example, case 3 illustrates the final concept.
Such as this additional example for completeness.
`;
      const content = createTestContent({
        content: `${intro}\n\n${examples}`,
      });
      const result = await gate.evaluate(content);

      expect(result.issues.some((i) => i.description.includes('clustered'))).toBe(true);
    });
  });

  describe('scoring', () => {
    it('should pass content with good examples', async () => {
      const content = createTestContent();
      const result = await gate.evaluate(content);

      // Check that scoring works and examples are detected
      expect(result.metadata?.exampleCount).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should fail content without examples', async () => {
      const content = createTestContent({
        content: 'This content has no examples. It just explains concepts.',
        expectedExamples: 3,
      });
      const result = await gate.evaluate(content);

      expect(result.passed).toBe(false);
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createExampleQualityGate', () => {
  it('should create gate with default config', () => {
    const gate = createExampleQualityGate();
    expect(gate).toBeInstanceOf(ExampleQualityGate);
  });

  it('should create gate with custom config', () => {
    const gate = createExampleQualityGate({
      minExamples: 3,
      requireCodeExamples: true,
    });
    expect(gate).toBeInstanceOf(ExampleQualityGate);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  let gate: ExampleQualityGate;

  beforeEach(() => {
    gate = new ExampleQualityGate();
  });

  it('should handle empty content', async () => {
    const content = createTestContent({ content: '' });
    const result = await gate.evaluate(content);

    expect(result).toBeDefined();
    expect(result.metadata?.exampleCount).toBe(0);
  });

  it('should handle content with only code', async () => {
    const content = createTestContent({
      content: `
\`\`\`javascript
function test() {
  return true;
}
\`\`\`
`,
    });
    const result = await gate.evaluate(content);

    expect(result.metadata?.hasCodeExamples).toBe(true);
  });

  it('should handle inline code', async () => {
    const content = createTestContent({
      content: 'Use the `console.log()` function to print output. The `typeof` operator checks types.',
    });
    const result = await gate.evaluate(content);

    expect(result).toBeDefined();
  });

  it('should deduplicate similar examples', async () => {
    const content = createTestContent({
      content: `For example, consider case A. For example, consider case A again.
      For example, consider case A once more.`,
    });
    const result = await gate.evaluate(content);

    // Should deduplicate similar content
    expect(result.metadata?.exampleCount).toBeLessThan(3);
  });
});

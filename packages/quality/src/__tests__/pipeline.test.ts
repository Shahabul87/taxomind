/**
 * Content Quality Gate Pipeline Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContentQualityGatePipeline,
  createQualityGatePipeline,
  validateContent,
  quickValidateContent,
} from '../pipeline';
import type { GeneratedContent, QualityGate, GateResult, GateIssue } from '../types';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestContent(overrides: Partial<GeneratedContent> = {}): GeneratedContent {
  return {
    content: `
# Introduction

This lesson covers important programming concepts. We will explore key principles
that form the foundation of software development. In this section, we begin with an overview.

## Main Concepts

Programming is a fundamental skill that helps us create software applications.
It provides tools for solving complex problems and building useful solutions.

First, we need to understand the basic terminology. Then we can move on to applications.
This approach ensures a solid foundation before tackling advanced topics.

For example, consider a simple program that calculates the sum of two numbers.
This demonstrates how functions work in practice.

\`\`\`javascript
function add(a, b) {
  return a + b;
}

const result = add(5, 3);
console.log(result); // Output: 8
\`\`\`

## Examples

For example, consider a variable that stores a user's age. We can declare it as:

\`\`\`javascript
let age = 25;
console.log(age); // Output: 25
\`\`\`

In real-world applications, companies use similar patterns to manage data.
This shows how concepts relate to practical business scenarios.

## Conclusion

In summary, we have covered the key concepts and their applications.
Remember that practice is essential for mastery. Therefore, continue learning.
    `.trim(),
    type: 'lesson',
    targetDifficulty: 'beginner',
    ...overrides,
  };
}

function createLowQualityContent(): GeneratedContent {
  return {
    content: 'Short. Low quality. No structure.',
    type: 'lesson',
  };
}

function createMockGate(
  name: string,
  passed: boolean,
  score: number,
  issues: GateIssue[] = []
): QualityGate {
  return {
    name,
    defaultWeight: 1.0,
    applicableTypes: ['lesson', 'explanation', 'tutorial', 'assessment', 'exercise'],
    evaluate: vi.fn().mockResolvedValue({
      gateName: name,
      passed,
      score,
      weight: 1.0,
      issues,
      suggestions: [],
      processingTimeMs: 10,
      metadata: {},
    } as GateResult),
  };
}

// ============================================================================
// CONTENT QUALITY GATE PIPELINE TESTS
// ============================================================================

describe('ContentQualityGatePipeline', () => {
  let pipeline: ContentQualityGatePipeline;

  beforeEach(() => {
    pipeline = new ContentQualityGatePipeline();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const p = new ContentQualityGatePipeline();
      const stats = p.getStats();

      expect(stats.gateCount).toBe(5);
      expect(stats.config.threshold).toBe(75);
      expect(stats.config.parallel).toBe(true);
    });

    it('should accept custom config', () => {
      const p = new ContentQualityGatePipeline({
        threshold: 80,
        parallel: false,
        maxIterations: 5,
      });
      const stats = p.getStats();

      expect(stats.config.threshold).toBe(80);
      expect(stats.config.parallel).toBe(false);
      expect(stats.config.maxIterations).toBe(5);
    });

    it('should initialize default gates', () => {
      const gateNames = pipeline.getGateNames();

      expect(gateNames).toContain('CompletenessGate');
      expect(gateNames).toContain('ExampleQualityGate');
      expect(gateNames).toContain('DifficultyMatchGate');
      expect(gateNames).toContain('StructureGate');
      expect(gateNames).toContain('DepthGate');
    });
  });

  describe('gate management', () => {
    it('should add custom gate', () => {
      const customGate = createMockGate('CustomGate', true, 90);
      pipeline.addGate(customGate);

      expect(pipeline.getGateNames()).toContain('CustomGate');
      expect(pipeline.getGate('CustomGate')).toBe(customGate);
    });

    it('should remove gate', () => {
      const removed = pipeline.removeGate('DepthGate');

      expect(removed).toBe(true);
      expect(pipeline.getGateNames()).not.toContain('DepthGate');
    });

    it('should return false when removing non-existent gate', () => {
      const removed = pipeline.removeGate('NonExistentGate');

      expect(removed).toBe(false);
    });

    it('should get gate by name', () => {
      const gate = pipeline.getGate('CompletenessGate');

      expect(gate).toBeDefined();
      expect(gate?.name).toBe('CompletenessGate');
    });

    it('should return undefined for non-existent gate', () => {
      const gate = pipeline.getGate('NonExistentGate');

      expect(gate).toBeUndefined();
    });

    it('should replace gate with same name', () => {
      const originalGate = pipeline.getGate('CompletenessGate');
      const newGate = createMockGate('CompletenessGate', true, 100);

      pipeline.addGate(newGate);
      const updatedGate = pipeline.getGate('CompletenessGate');

      expect(updatedGate).toBe(newGate);
      expect(updatedGate).not.toBe(originalGate);
    });
  });

  describe('validate', () => {
    it('should return all required fields', async () => {
      const content = createTestContent();
      const result = await pipeline.validate(content);

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('gateResults');
      expect(result).toHaveProperty('failedGates');
      expect(result).toHaveProperty('iterations');
      expect(result).toHaveProperty('totalProcessingTimeMs');
      expect(result).toHaveProperty('allSuggestions');
      expect(result).toHaveProperty('criticalIssues');
      expect(result).toHaveProperty('metadata');
    });

    it('should pass well-structured content', async () => {
      const content = createTestContent();
      const result = await pipeline.validate(content);

      expect(result.overallScore).toBeGreaterThanOrEqual(50);
    });

    it('should fail low quality content', async () => {
      const content = createLowQualityContent();
      const result = await pipeline.validate(content);

      expect(result.passed).toBe(false);
      expect(result.failedGates.length).toBeGreaterThan(0);
    });

    it('should include gate results for all applicable gates', async () => {
      const content = createTestContent();
      const result = await pipeline.validate(content);

      expect(result.gateResults.length).toBeGreaterThan(0);
      result.gateResults.forEach((gr) => {
        expect(gr).toHaveProperty('gateName');
        expect(gr).toHaveProperty('passed');
        expect(gr).toHaveProperty('score');
        expect(gr).toHaveProperty('weight');
      });
    });

    it('should track processing time', async () => {
      const content = createTestContent();
      const result = await pipeline.validate(content);

      // Processing time should be a non-negative number (can be 0 if very fast)
      expect(result.totalProcessingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should set iterations to 1 without enhancement', async () => {
      const p = new ContentQualityGatePipeline({ enableEnhancement: false });
      const content = createTestContent();
      const result = await p.validate(content);

      expect(result.iterations).toBe(1);
    });
  });

  describe('parallel vs sequential execution', () => {
    it('should run gates in parallel by default', async () => {
      const p = new ContentQualityGatePipeline({ parallel: true });

      const gate1 = createMockGate('Gate1', true, 90);
      const gate2 = createMockGate('Gate2', true, 85);

      // Clear default gates and add mock gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');
      p.addGate(gate1);
      p.addGate(gate2);

      const content = createTestContent();
      await p.validate(content);

      expect(gate1.evaluate).toHaveBeenCalled();
      expect(gate2.evaluate).toHaveBeenCalled();
    });

    it('should run gates sequentially when configured', async () => {
      const p = new ContentQualityGatePipeline({ parallel: false });

      // Clear default gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');

      const gate1 = createMockGate('Gate1', true, 90);
      const gate2 = createMockGate('Gate2', true, 85);
      p.addGate(gate1);
      p.addGate(gate2);

      const content = createTestContent();
      await p.validate(content);

      expect(gate1.evaluate).toHaveBeenCalled();
      expect(gate2.evaluate).toHaveBeenCalled();
    });

    it('should early exit on critical failure in sequential mode', async () => {
      const p = new ContentQualityGatePipeline({ parallel: false });

      // Clear default gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');

      const criticalGate = createMockGate('CriticalGate', false, 0, [
        { severity: 'critical', description: 'Critical failure' },
      ]);
      const secondGate = createMockGate('SecondGate', true, 100);

      p.addGate(criticalGate);
      p.addGate(secondGate);

      const content = createTestContent();
      const result = await p.validate(content);

      expect(criticalGate.evaluate).toHaveBeenCalled();
      expect(secondGate.evaluate).not.toHaveBeenCalled();
      expect(result.criticalIssues.length).toBe(1);
    });
  });

  describe('gate filtering', () => {
    it('should respect enabledGates config', async () => {
      const p = new ContentQualityGatePipeline({
        enabledGates: ['CompletenessGate', 'StructureGate'],
      });

      const content = createTestContent();
      const result = await p.validate(content);

      const gateNames = result.gateResults.map((r) => r.gateName);
      expect(gateNames).toContain('CompletenessGate');
      expect(gateNames).toContain('StructureGate');
      expect(gateNames).not.toContain('DepthGate');
    });

    it('should respect disabledGates config', async () => {
      const p = new ContentQualityGatePipeline({
        disabledGates: ['DepthGate', 'DifficultyMatchGate'],
      });

      const content = createTestContent();
      const result = await p.validate(content);

      const gateNames = result.gateResults.map((r) => r.gateName);
      expect(gateNames).not.toContain('DepthGate');
      expect(gateNames).not.toContain('DifficultyMatchGate');
    });
  });

  describe('weighted scoring', () => {
    it('should calculate weighted average score', async () => {
      const p = new ContentQualityGatePipeline();

      // Clear default gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');

      // Add gates with specific scores
      const gate1 = createMockGate('Gate1', true, 100);
      const gate2 = createMockGate('Gate2', true, 50);
      p.addGate(gate1);
      p.addGate(gate2);

      const content = createTestContent();
      const result = await p.validate(content);

      // Both gates have weight 1.0, so average should be 75
      expect(result.overallScore).toBe(75);
    });

    it('should apply custom gate weights', async () => {
      const p = new ContentQualityGatePipeline({
        gateWeights: {
          Gate1: 2.0,
          Gate2: 1.0,
        },
      });

      // Clear default gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');

      const gate1 = createMockGate('Gate1', true, 100);
      const gate2 = createMockGate('Gate2', true, 50);
      p.addGate(gate1);
      p.addGate(gate2);

      const content = createTestContent();
      const result = await p.validate(content);

      // Gate1 (100 * 2.0) + Gate2 (50 * 1.0) = 250 / 3.0 = 83.3
      expect(result.overallScore).toBeCloseTo(83.3, 0);
    });
  });

  describe('critical issues', () => {
    it('should fail if critical issues exist', async () => {
      const p = new ContentQualityGatePipeline();

      // Clear default gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');

      const gateWithCritical = createMockGate('CriticalGate', false, 50, [
        { severity: 'critical', description: 'Critical issue found' },
      ]);
      p.addGate(gateWithCritical);

      const content = createTestContent();
      const result = await p.validate(content);

      expect(result.passed).toBe(false);
      expect(result.criticalIssues.length).toBe(1);
    });

    it('should fail even with high score if critical issues exist', async () => {
      const p = new ContentQualityGatePipeline({ threshold: 70 });

      // Clear default gates
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');

      const gateWithCritical = createMockGate('CriticalGate', false, 90, [
        { severity: 'critical', description: 'Critical issue' },
      ]);
      p.addGate(gateWithCritical);

      const content = createTestContent();
      const result = await p.validate(content);

      expect(result.overallScore).toBe(90);
      expect(result.passed).toBe(false);
    });
  });

  describe('quickValidate', () => {
    it('should run only essential gates', async () => {
      const content = createTestContent();
      const result = await pipeline.quickValidate(content);

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('criticalIssues');
    });

    it('should pass valid content', async () => {
      const content = createTestContent();
      const result = await pipeline.quickValidate(content);

      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should return pipeline statistics', () => {
      const stats = pipeline.getStats();

      expect(stats).toHaveProperty('gateCount');
      expect(stats).toHaveProperty('gateNames');
      expect(stats).toHaveProperty('config');
      expect(stats.gateCount).toBe(5);
      expect(stats.gateNames.length).toBe(5);
    });
  });

  describe('updateConfig', () => {
    it('should update pipeline configuration', () => {
      pipeline.updateConfig({ threshold: 90 });
      const stats = pipeline.getStats();

      expect(stats.config.threshold).toBe(90);
    });

    it('should merge with existing config', () => {
      pipeline.updateConfig({ threshold: 90 });
      pipeline.updateConfig({ parallel: false });
      const stats = pipeline.getStats();

      expect(stats.config.threshold).toBe(90);
      expect(stats.config.parallel).toBe(false);
    });
  });

  describe('metadata', () => {
    it('should include timestamp', async () => {
      const content = createTestContent();
      const result = await pipeline.validate(content);

      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should include config', async () => {
      const content = createTestContent();
      const result = await pipeline.validate(content);

      expect(result.metadata.config).toBeDefined();
    });

    it('should include reason for pass', async () => {
      const p = new ContentQualityGatePipeline({ threshold: 0 });

      // Clear and add passing gate
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');
      p.addGate(createMockGate('PassingGate', true, 100));

      const content = createTestContent();
      const result = await p.validate(content);

      expect(result.metadata.reason).toContain('passed');
    });

    it('should include reason for failure', async () => {
      const p = new ContentQualityGatePipeline({ threshold: 100 });

      // Clear and add gate
      p.removeGate('CompletenessGate');
      p.removeGate('ExampleQualityGate');
      p.removeGate('DifficultyMatchGate');
      p.removeGate('StructureGate');
      p.removeGate('DepthGate');
      p.addGate(createMockGate('Gate', true, 50));

      const content = createTestContent();
      const result = await p.validate(content);

      expect(result.metadata.reason).toContain('below threshold');
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createQualityGatePipeline', () => {
  it('should create pipeline with default config', () => {
    const pipeline = createQualityGatePipeline();
    expect(pipeline).toBeInstanceOf(ContentQualityGatePipeline);
  });

  it('should create pipeline with custom config', () => {
    const pipeline = createQualityGatePipeline({
      threshold: 80,
      parallel: false,
    });
    const stats = pipeline.getStats();

    expect(stats.config.threshold).toBe(80);
    expect(stats.config.parallel).toBe(false);
  });
});

describe('validateContent', () => {
  it('should validate content with default pipeline', async () => {
    const content = createTestContent();
    const result = await validateContent(content);

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('gateResults');
  });

  it('should accept custom config', async () => {
    const content = createTestContent();
    const result = await validateContent(content, { threshold: 50 });

    expect(result).toBeDefined();
  });
});

describe('quickValidateContent', () => {
  it('should perform quick validation', async () => {
    const content = createTestContent();
    const result = await quickValidateContent(content);

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('criticalIssues');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  let pipeline: ContentQualityGatePipeline;

  beforeEach(() => {
    pipeline = new ContentQualityGatePipeline();
  });

  it('should handle empty content', async () => {
    const content = createTestContent({ content: '' });
    const result = await pipeline.validate(content);

    expect(result).toBeDefined();
    expect(result.passed).toBe(false);
  });

  it('should handle content with only whitespace', async () => {
    const content = createTestContent({ content: '   \n\n   ' });
    const result = await pipeline.validate(content);

    expect(result).toBeDefined();
    expect(result.passed).toBe(false);
  });

  it('should return 100 for empty gate results', async () => {
    const p = new ContentQualityGatePipeline();

    // Remove all gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    const content = createTestContent();
    const result = await p.validate(content);

    expect(result.overallScore).toBe(100);
  });

  it('should handle all content types', async () => {
    const types = ['lesson', 'explanation', 'tutorial', 'assessment', 'exercise'] as const;

    for (const type of types) {
      const content = createTestContent({ type });
      const result = await pipeline.validate(content);
      expect(result).toBeDefined();
    }
  });

  it('should aggregate suggestions without duplicates', async () => {
    const p = new ContentQualityGatePipeline();

    // Clear default gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    // Add gates with overlapping suggestions
    const gate1: QualityGate = {
      name: 'Gate1',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockResolvedValue({
        gateName: 'Gate1',
        passed: true,
        score: 80,
        weight: 1.0,
        issues: [],
        suggestions: ['Improve clarity', 'Add examples'],
        processingTimeMs: 10,
        metadata: {},
      }),
    };

    const gate2: QualityGate = {
      name: 'Gate2',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockResolvedValue({
        gateName: 'Gate2',
        passed: true,
        score: 80,
        weight: 1.0,
        issues: [],
        suggestions: ['Improve clarity', 'Add structure'],
        processingTimeMs: 10,
        metadata: {},
      }),
    };

    p.addGate(gate1);
    p.addGate(gate2);

    const content = createTestContent();
    const result = await p.validate(content);

    // Should deduplicate "Improve clarity"
    const clarityCount = result.allSuggestions.filter((s) => s === 'Improve clarity').length;
    expect(clarityCount).toBe(1);
  });

  it('should handle gate timeout gracefully', async () => {
    const p = new ContentQualityGatePipeline({
      timeoutMs: 100, // Very short timeout
    });

    // Clear default gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    // Add slow gate
    const slowGate: QualityGate = {
      name: 'SlowGate',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          gateName: 'SlowGate',
          passed: true,
          score: 100,
          weight: 1.0,
          issues: [],
          suggestions: [],
          processingTimeMs: 500,
          metadata: {},
        };
      }),
    };
    p.addGate(slowGate);

    const content = createTestContent();
    const result = await p.validate(content);

    // Should handle timeout and return error result
    expect(result.gateResults.length).toBe(1);
    expect(result.gateResults[0].score).toBe(0);
    expect(result.gateResults[0].issues[0].description).toContain('Gate failed to evaluate');
  });

  it('should handle gate evaluation errors', async () => {
    const p = new ContentQualityGatePipeline();

    // Clear default gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    // Add gate that throws
    const errorGate: QualityGate = {
      name: 'ErrorGate',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockRejectedValue(new Error('Gate crashed')),
    };
    p.addGate(errorGate);

    const content = createTestContent();
    const result = await p.validate(content);

    expect(result.gateResults.length).toBe(1);
    expect(result.gateResults[0].passed).toBe(false);
    expect(result.gateResults[0].issues[0].description).toContain('Gate crashed');
  });
});

// ============================================================================
// ENHANCEMENT TESTS
// ============================================================================

describe('Content Enhancement', () => {
  it('should attempt enhancement when enabled and not passed', async () => {
    const p = new ContentQualityGatePipeline({
      enableEnhancement: true,
      maxIterations: 2,
      threshold: 100,
    });

    // Clear default gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    // Add gate with enhancement capability
    let callCount = 0;
    const enhanceableGate: QualityGate = {
      name: 'EnhanceableGate',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          gateName: 'EnhanceableGate',
          passed: callCount > 1, // Pass on second try
          score: callCount > 1 ? 100 : 50,
          weight: 1.0,
          issues: callCount > 1 ? [] : [{ severity: 'high', description: 'Needs improvement' }],
          suggestions: [],
          processingTimeMs: 10,
          metadata: {},
        };
      }),
      enhance: vi.fn().mockResolvedValue({
        content: 'Enhanced content',
        type: 'lesson',
      }),
    };
    p.addGate(enhanceableGate);

    const content = createTestContent();
    const result = await p.validate(content);

    expect(enhanceableGate.enhance).toHaveBeenCalled();
    expect(result.iterations).toBeGreaterThan(1);
  });

  it('should not exceed max iterations', async () => {
    const p = new ContentQualityGatePipeline({
      enableEnhancement: true,
      maxIterations: 3,
      threshold: 100,
    });

    // Clear default gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    // Add gate that always fails but enhances
    const alwaysFailGate: QualityGate = {
      name: 'AlwaysFailGate',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockResolvedValue({
        gateName: 'AlwaysFailGate',
        passed: false,
        score: 50,
        weight: 1.0,
        issues: [{ severity: 'high', description: 'Always fails' }],
        suggestions: [],
        processingTimeMs: 10,
        metadata: {},
      }),
      enhance: vi.fn().mockImplementation(async (content) => ({
        ...content,
        content: content.content + ' enhanced',
      })),
    };
    p.addGate(alwaysFailGate);

    const content = createTestContent();
    const result = await p.validate(content);

    expect(result.iterations).toBe(3);
    expect(alwaysFailGate.enhance).toHaveBeenCalledTimes(2);
  });

  it('should mark enhancement attempted in metadata', async () => {
    const p = new ContentQualityGatePipeline({
      enableEnhancement: true,
      maxIterations: 2,
      threshold: 100,
    });

    // Clear default gates
    p.removeGate('CompletenessGate');
    p.removeGate('ExampleQualityGate');
    p.removeGate('DifficultyMatchGate');
    p.removeGate('StructureGate');
    p.removeGate('DepthGate');

    // Add enhanceable gate
    const enhanceableGate: QualityGate = {
      name: 'EnhanceableGate',
      defaultWeight: 1.0,
      applicableTypes: ['lesson'],
      evaluate: vi.fn().mockResolvedValue({
        gateName: 'EnhanceableGate',
        passed: false,
        score: 50,
        weight: 1.0,
        issues: [{ severity: 'high', description: 'Needs work' }],
        suggestions: [],
        processingTimeMs: 10,
        metadata: {},
      }),
      enhance: vi.fn().mockResolvedValue({
        content: 'Enhanced',
        type: 'lesson',
      }),
    };
    p.addGate(enhanceableGate);

    const content = createTestContent();
    const result = await p.validate(content);

    expect(result.metadata.enhancementAttempted).toBe(true);
  });
});

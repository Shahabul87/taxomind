/**
 * Tests for ObjectiveAnalyzer
 * @sam-ai/educational
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectiveAnalyzer } from '../analyzers/objective-analyzer';

describe('ObjectiveAnalyzer', () => {
  let analyzer: ObjectiveAnalyzer;

  beforeEach(() => {
    analyzer = new ObjectiveAnalyzer();
  });

  it('should classify learning objectives by Bloom level', () => {
    const result = analyzer.analyzeObjective('Evaluate the effectiveness of different testing strategies');

    expect(result.bloomsLevel).toBe('EVALUATE');
    expect(result.actionVerb).toBe('evaluate');
    expect(result.verbStrength).toBe('strong');
  });

  it('should map action verbs to correct Bloom levels', () => {
    const remember = analyzer.analyzeObjective('List the key principles of OOP');
    expect(remember.bloomsLevel).toBe('REMEMBER');

    const understand = analyzer.analyzeObjective('Explain the concept of polymorphism');
    expect(understand.bloomsLevel).toBe('UNDERSTAND');

    const apply = analyzer.analyzeObjective('Apply design patterns to solve common problems');
    expect(apply.bloomsLevel).toBe('APPLY');

    const analyze = analyzer.analyzeObjective('Analyze the trade-offs between microservices and monoliths');
    expect(analyze.bloomsLevel).toBe('ANALYZE');

    const create = analyzer.analyzeObjective('Create a comprehensive testing framework');
    expect(create.bloomsLevel).toBe('CREATE');
  });

  it('should check measurability of objectives', () => {
    const measurable = analyzer.analyzeObjective(
      'Students will correctly solve at least 8 out of 10 calculus problems within 30 minutes'
    );

    expect(measurable.measurability).toBeDefined();
    // The objective has measurable indicators: "correctly", "at least", "within"
  });

  it('should analyze specificity with SMART criteria', () => {
    const specific = analyzer.analyzeObjective(
      'By the end of the module, students will demonstrate proficiency in TypeScript type system concepts'
    );

    expect(specific.smartCriteria).toBeDefined();
    expect(specific.smartCriteria.overallScore).toBeGreaterThan(0);
    // Has time-bound ("By the end of the module") and specific concepts
  });

  it('should detect alignment between objectives and content', () => {
    const vague = analyzer.analyzeObjective('Learn about stuff');
    const precise = analyzer.analyzeObjective('Analyze the structural components of a database schema');

    expect(precise.clarityScore).toBeGreaterThan(vague.clarityScore);
    expect(vague.verbStrength).toBe('weak');
  });

  it('should detect gaps with weak verbs', () => {
    const weakObjective = analyzer.analyzeObjective('Understand the basics of programming');

    expect(weakObjective.verbStrength).toBe('weak');
    expect(weakObjective.suggestions.length).toBeGreaterThan(0);
  });

  it('should score objective quality', () => {
    const highQuality = analyzer.analyzeObjective(
      'By the end of this session, students will design a RESTful API using Express.js that correctly handles CRUD operations for at least 3 resources'
    );

    const lowQuality = analyzer.analyzeObjective('Know things');

    expect(highQuality.clarityScore).toBeGreaterThan(lowQuality.clarityScore);
    expect(highQuality.bloomsLevel).toBe('CREATE');
    expect(lowQuality.verbStrength).toBe('weak');
  });

  it('should handle deduplication of similar objectives', () => {
    const objectives = [
      'Explain the concept of inheritance',
      'Describe how inheritance works in OOP',
      'Create a class hierarchy using inheritance',
      'Evaluate the trade-offs of deep inheritance',
    ];

    const result = analyzer.analyzeAndDeduplicate(objectives);

    expect(result.totalObjectives).toBe(4);
    expect(result.uniqueClusters).toBeGreaterThan(0);
    expect(result.optimizedObjectives).toBeDefined();
  });
});

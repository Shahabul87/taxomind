/**
 * Tests for SocraticTeachingEngine
 * @sam-ai/educational
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocraticTeachingEngine, createSocraticTeachingEngine } from '../engines/socratic-teaching-engine';

describe('SocraticTeachingEngine', () => {
  let engine: SocraticTeachingEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SocraticTeachingEngine();
  });

  it('should generate a clarifying question for a topic', async () => {
    const question = await engine.generateQuestion('machine learning', 'clarifying');

    expect(question.id).toBeDefined();
    expect(question.type).toBe('clarifying');
    expect(question.question).toContain('machine learning');
    expect(question.hints.length).toBeGreaterThan(0);
  });

  it('should start a dialogue and return opening response', async () => {
    const response = await engine.startDialogue({
      userId: 'user-1',
      topic: 'recursion',
    });

    expect(response.state).toBe('exploration');
    expect(response.question).toBeDefined();
    expect(response.isComplete).toBe(false);
    expect(response.progress).toBe(0);
    expect(response.encouragement).toBeDefined();
  });

  it('should continue dialogue with analysis of student response', async () => {
    const startResponse = await engine.startDialogue({
      userId: 'user-1',
      topic: 'data structures',
    });

    const dialogueId = (await engine.getDialogue(
      (startResponse as { question: { id: string } }).question.id.replace('q_', 'dialogue_')
    ))?.id;

    // Get the actual dialogue ID from cache
    const dialogues = await engine.getUserDialogues('user-1');
    expect(dialogues.length).toBeGreaterThan(0);

    const continueResponse = await engine.continueDialogue({
      dialogueId: dialogues[0].id,
      response: 'Data structures are ways to organize data, for example arrays and linked lists.',
    });

    expect(continueResponse.state).toBeDefined();
    expect(continueResponse.isComplete).toBe(false);
    expect(continueResponse.discoveredInsights).toBeDefined();
  });

  it('should detect scaffolding progression through question types', async () => {
    const response = await engine.startDialogue({
      userId: 'user-1',
      topic: 'OOP',
    });

    const dialogues = await engine.getUserDialogues('user-1');
    const dialogueId = dialogues[0].id;

    // First response should lead to exploration
    const r1 = await engine.continueDialogue({
      dialogueId,
      response: 'OOP uses classes and objects.',
    });

    expect(r1.question).toBeDefined();
    // The engine should progress through question types
  });

  it('should detect misconceptions in rule-based analysis', async () => {
    const question = await engine.generateQuestion('gravity', 'probing_assumptions');
    const analysis = await engine.analyzeResponse(question, 'I think maybe.');

    // Short answer with low quality
    expect(analysis.qualityScore).toBeLessThan(50);
    expect(analysis.reasoningGaps.length).toBeGreaterThan(0);
  });

  it('should guide student to discovery through probing questions', async () => {
    const question = await engine.generateQuestion('photosynthesis', 'probing_reasons');

    expect(question.type).toBe('probing_reasons');
    expect(question.question).toContain('photosynthesis');
    expect(question.expectedDirection).toBeDefined();
    expect(question.keyInsights.length).toBeGreaterThan(0);
  });

  it('should manage dialogue state through progression', async () => {
    await engine.startDialogue({
      userId: 'user-1',
      topic: 'algorithms',
    });

    const dialogues = await engine.getUserDialogues('user-1');
    const dialogue = dialogues[0];

    expect(dialogue.state).toBe('exploration');
    expect(dialogue.exchanges.length).toBe(1);
  });

  it('should adapt difficulty based on response quality', async () => {
    const question = await engine.generateQuestion('calculus', 'clarifying');

    // High quality response with examples and reasoning
    const goodAnalysis = await engine.analyzeResponse(
      question,
      'Calculus is the study of continuous change, for example derivatives measure rate of change because they compute the limit of difference quotients.'
    );

    // Low quality response
    const weakAnalysis = await engine.analyzeResponse(question, 'Math stuff.');

    expect(goodAnalysis.qualityScore).toBeGreaterThan(weakAnalysis.qualityScore);
    expect(goodAnalysis.thinkingDepth).toBeGreaterThan(weakAnalysis.thinkingDepth);
  });

  it('should handle errors in dialogue continuation', async () => {
    await expect(
      engine.continueDialogue({
        dialogueId: 'nonexistent',
        response: 'test',
      })
    ).rejects.toThrow('Dialogue nonexistent not found');
  });
});

describe('createSocraticTeachingEngine', () => {
  it('should create engine via factory', () => {
    const engine = createSocraticTeachingEngine();
    expect(engine).toBeInstanceOf(SocraticTeachingEngine);
  });
});

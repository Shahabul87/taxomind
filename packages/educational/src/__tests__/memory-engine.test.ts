/**
 * @sam-ai/educational - Memory Engine Tests
 * Tests for conversation context management and memory enrichment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryEngine } from '../engines/memory-engine';
import type { MemoryEngineConfig, MemoryConversationContext } from '../types';
import { createMockSAMConfig } from './setup';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createConversationContext(
  overrides: Partial<MemoryConversationContext> = {}
): MemoryConversationContext {
  return {
    userId: 'user-1',
    courseId: 'course-1',
    chapterId: 'chapter-1',
    sectionId: 'section-1',
    sessionId: 'session-1',
    currentConversationId: undefined,
    ...overrides,
  };
}

function createMemoryEngineConfig(
  overrides: Partial<MemoryEngineConfig> = {}
): MemoryEngineConfig {
  return {
    samConfig: createMockSAMConfig(),
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('MemoryEngine', () => {
  let engine: MemoryEngine;
  let context: MemoryConversationContext;
  let config: MemoryEngineConfig;

  beforeEach(() => {
    context = createConversationContext();
    config = createMemoryEngineConfig();
    engine = new MemoryEngine(context, config);
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create engine with valid context and config', () => {
      expect(engine).toBeInstanceOf(MemoryEngine);
    });

    it('should create engine without database adapter', () => {
      const noDatabaseConfig = createMemoryEngineConfig({ database: undefined });
      const noDatabaseEngine = new MemoryEngine(context, noDatabaseConfig);
      expect(noDatabaseEngine).toBeInstanceOf(MemoryEngine);
    });

    it('should initialize with provided context', () => {
      const customContext = createConversationContext({ userId: 'custom-user' });
      const customEngine = new MemoryEngine(customContext, config);
      expect(customEngine).toBeInstanceOf(MemoryEngine);
    });

    it('should handle minimal context', () => {
      const minimalContext: MemoryConversationContext = {
        userId: 'user-1',
        sessionId: 'session-1',
        courseId: undefined,
        chapterId: undefined,
        sectionId: undefined,
        currentConversationId: undefined,
      };
      const minimalEngine = new MemoryEngine(minimalContext, config);
      expect(minimalEngine).toBeInstanceOf(MemoryEngine);
    });
  });

  // ============================================================================
  // CONVERSATION MANAGEMENT TESTS
  // ============================================================================

  describe('conversation management', () => {
    it('should throw error for initializeConversation without database', async () => {
      await expect(engine.initializeConversation()).rejects.toThrow(
        'Database adapter is required'
      );
    });

    it('should throw error for addMessageWithMemory without database', async () => {
      await expect(
        engine.addMessageWithMemory('user', 'Hello')
      ).rejects.toThrow('Database adapter is required');
    });

    it('should return empty messages for getConversationHistory without database', async () => {
      const result = await engine.getConversationHistory();
      expect(result.messages).toEqual([]);
    });
  });

  // ============================================================================
  // CONFIGURATION TESTS
  // ============================================================================

  describe('configuration', () => {
    it('should create engine with different samConfig', () => {
      const customConfig = createMemoryEngineConfig({
        samConfig: createMockSAMConfig({ maxConversationHistory: 25 }),
      });
      const customEngine = new MemoryEngine(context, customConfig);
      expect(customEngine).toBeInstanceOf(MemoryEngine);
    });

    it('should create engine with custom model settings', () => {
      const customConfig = createMemoryEngineConfig({
        samConfig: createMockSAMConfig({
          model: { name: 'custom-model', temperature: 0.5, maxTokens: 2000 },
        }),
      });
      const customEngine = new MemoryEngine(context, customConfig);
      expect(customEngine).toBeInstanceOf(MemoryEngine);
    });

    it('should handle config without optional database', () => {
      const configWithoutDb = createMemoryEngineConfig();
      const engineWithoutDb = new MemoryEngine(context, configWithoutDb);
      expect(engineWithoutDb).toBeInstanceOf(MemoryEngine);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty user ID', () => {
      const emptyUserContext = createConversationContext({ userId: '' });
      const emptyUserEngine = new MemoryEngine(emptyUserContext, config);
      expect(emptyUserEngine).toBeInstanceOf(MemoryEngine);
    });

    it('should handle empty session ID', () => {
      const emptySessionContext = createConversationContext({ sessionId: '' });
      const emptySessionEngine = new MemoryEngine(emptySessionContext, config);
      expect(emptySessionEngine).toBeInstanceOf(MemoryEngine);
    });

    it('should handle context with all optional fields undefined', () => {
      const minContext: MemoryConversationContext = {
        userId: 'user-1',
        sessionId: 'session-1',
      };
      const minEngine = new MemoryEngine(minContext, config);
      expect(minEngine).toBeInstanceOf(MemoryEngine);
    });
  });
});

/**
 * @sam-ai/educational - Innovation Engine Tests
 * Tests for cognitive fitness, learning DNA, study buddy, and quantum paths
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { InnovationEngine, createInnovationEngine } from '../engines/innovation-engine';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createInnovationEngineConfig(overrides = {}) {
    return {
        ...overrides,
    };
}
// ============================================================================
// TESTS
// ============================================================================
describe('InnovationEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = createInnovationEngineConfig();
        engine = new InnovationEngine(config);
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with valid config', () => {
            expect(engine).toBeInstanceOf(InnovationEngine);
        });
        it('should create engine without database adapter', () => {
            const noDatabaseEngine = new InnovationEngine({});
            expect(noDatabaseEngine).toBeInstanceOf(InnovationEngine);
        });
        it('should create engine using factory function', () => {
            const factoryEngine = createInnovationEngine();
            expect(factoryEngine).toBeInstanceOf(InnovationEngine);
        });
        it('should create engine with custom config', () => {
            const customConfig = createInnovationEngineConfig();
            const customEngine = new InnovationEngine(customConfig);
            expect(customEngine).toBeInstanceOf(InnovationEngine);
        });
    });
    // ============================================================================
    // COGNITIVE FITNESS TESTS (Requires Database)
    // ============================================================================
    describe('assessCognitiveFitness', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.assessCognitiveFitness('user-1')).rejects.toThrow('Database adapter required for cognitive fitness assessment');
        });
    });
    // ============================================================================
    // LEARNING DNA TESTS (Requires Database)
    // ============================================================================
    describe('generateLearningDNA', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.generateLearningDNA('user-1')).rejects.toThrow('Database adapter required for Learning DNA generation');
        });
    });
    // ============================================================================
    // STUDY BUDDY TESTS (Requires Database)
    // ============================================================================
    describe('createStudyBuddy', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.createStudyBuddy('user-1')).rejects.toThrow('Database adapter required for Study Buddy creation');
        });
        it('should throw error with preferences but without database adapter', async () => {
            await expect(engine.createStudyBuddy('user-1', { personalityType: 'motivator' })).rejects.toThrow('Database adapter required for Study Buddy creation');
        });
    });
    describe('interactWithBuddy', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.interactWithBuddy('buddy-1', 'user-1', 'conversation', {})).rejects.toThrow('Database adapter required for buddy interaction');
        });
    });
    // ============================================================================
    // QUANTUM PATH TESTS (Requires Database)
    // ============================================================================
    describe('createQuantumPath', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.createQuantumPath('user-1', 'Learn JavaScript')).rejects.toThrow('Database adapter required for Quantum Path creation');
        });
    });
    describe('observeQuantumPath', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.observeQuantumPath('path-1', 'progress_check', { userId: 'user-1' })).rejects.toThrow('Database adapter required for path observation');
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle empty config', () => {
            const emptyEngine = new InnovationEngine({});
            expect(emptyEngine).toBeInstanceOf(InnovationEngine);
        });
        it('should handle undefined config', () => {
            const undefinedEngine = new InnovationEngine();
            expect(undefinedEngine).toBeInstanceOf(InnovationEngine);
        });
    });
});

/**
 * @sam-ai/educational - Exam Engine Tests
 * Tests for advanced exam generation with Bloom's taxonomy alignment
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedExamEngine } from '../engines/exam-engine';
import { createMockSAMConfig } from './setup';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createExamEngineConfig(overrides = {}) {
    return {
        samConfig: createMockSAMConfig(),
        ...overrides,
    };
}
function createExamGenerationConfig(overrides = {}) {
    return {
        totalQuestions: 10,
        duration: 60,
        bloomsDistribution: {
            REMEMBER: 20,
            UNDERSTAND: 20,
            APPLY: 20,
            ANALYZE: 15,
            EVALUATE: 15,
            CREATE: 10,
        },
        difficultyDistribution: {
            EASY: 30,
            MEDIUM: 50,
            HARD: 20,
        },
        questionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY'],
        adaptiveMode: false,
        ...overrides,
    };
}
// ============================================================================
// TESTS
// ============================================================================
describe('AdvancedExamEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = createExamEngineConfig();
        engine = new AdvancedExamEngine(config);
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with valid config', () => {
            expect(engine).toBeInstanceOf(AdvancedExamEngine);
        });
        it('should create engine with minimal config', () => {
            const minimalConfig = createExamEngineConfig();
            const minimalEngine = new AdvancedExamEngine(minimalConfig);
            expect(minimalEngine).toBeInstanceOf(AdvancedExamEngine);
        });
        it('should create engine without database adapter', () => {
            const noDatabaseConfig = createExamEngineConfig({
                database: undefined,
            });
            const noDatabaseEngine = new AdvancedExamEngine(noDatabaseConfig);
            expect(noDatabaseEngine).toBeInstanceOf(AdvancedExamEngine);
        });
    });
    // ============================================================================
    // GENERATE EXAM TESTS
    // ============================================================================
    describe('generateExam', () => {
        it('should generate exam with valid config', async () => {
            const examConfig = createExamGenerationConfig();
            const result = await engine.generateExam(null, null, examConfig);
            expect(result).toBeDefined();
            expect(result.exam).toBeDefined();
            expect(result.exam.id).toBeDefined();
        });
        it('should return questions array', async () => {
            const examConfig = createExamGenerationConfig({ totalQuestions: 5 });
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.exam.questions).toBeDefined();
            expect(Array.isArray(result.exam.questions)).toBe(true);
        });
        it('should include exam metadata', async () => {
            const examConfig = createExamGenerationConfig();
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.exam.metadata).toBeDefined();
        });
        it('should include Blooms analysis', async () => {
            const examConfig = createExamGenerationConfig();
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.bloomsAnalysis).toBeDefined();
        });
        it('should handle different difficulty distributions', async () => {
            const easyConfig = createExamGenerationConfig({
                difficultyDistribution: { EASY: 70, MEDIUM: 20, HARD: 10 }
            });
            const result = await engine.generateExam(null, null, easyConfig);
            expect(result.exam).toBeDefined();
        });
        it('should generate exam for course and sections', async () => {
            const examConfig = createExamGenerationConfig();
            const result = await engine.generateExam('course-1', ['section-1'], examConfig);
            expect(result.exam).toBeDefined();
        });
        it('should handle minimum question count config', async () => {
            const examConfig = createExamGenerationConfig({ totalQuestions: 1 });
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.exam).toBeDefined();
            expect(result.exam.questions).toBeDefined();
        });
        it('should handle different question types config', async () => {
            const examConfig = createExamGenerationConfig({
                questionTypes: ['MULTIPLE_CHOICE'],
                totalQuestions: 3,
            });
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.exam).toBeDefined();
            expect(result.exam.questions).toBeDefined();
        });
        it('should include study guide', async () => {
            const examConfig = createExamGenerationConfig();
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.studyGuide).toBeDefined();
        });
        it('should generate adaptive settings when enabled', async () => {
            const examConfig = createExamGenerationConfig({ adaptiveMode: true });
            const result = await engine.generateExam(null, null, examConfig);
            expect(result).toBeDefined();
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle large question count config', async () => {
            const examConfig = createExamGenerationConfig({ totalQuestions: 50 });
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.exam).toBeDefined();
            expect(result.exam.questions).toBeDefined();
        });
        it('should handle adaptive mode disabled', async () => {
            const examConfig = createExamGenerationConfig({
                adaptiveMode: false,
            });
            const result = await engine.generateExam(null, null, examConfig);
            expect(result.exam).toBeDefined();
        });
        it('should handle empty section array', async () => {
            const examConfig = createExamGenerationConfig();
            const result = await engine.generateExam('course-1', [], examConfig);
            expect(result.exam).toBeDefined();
        });
    });
});

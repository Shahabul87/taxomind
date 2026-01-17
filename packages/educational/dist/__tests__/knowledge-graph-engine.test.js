/**
 * KnowledgeGraphEngine Tests
 *
 * Comprehensive tests for the KnowledgeGraphEngine covering:
 * - Concept extraction
 * - Knowledge graph building
 * - Prerequisite analysis
 * - Learning path generation
 * - Mastery tracking
 * - Utility methods
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraphEngine, createKnowledgeGraphEngine, } from '../engines/knowledge-graph-engine';
import { createMockSAMConfig } from './setup';
// ============================================================================
// TEST HELPERS
// ============================================================================
function createEngineConfig(overrides = {}) {
    return {
        samConfig: createMockSAMConfig(),
        enableAIExtraction: false,
        confidenceThreshold: 0.7,
        maxPrerequisiteDepth: 10,
        ...overrides,
    };
}
function createSampleConcept(overrides = {}) {
    const id = overrides.id ?? `concept-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return {
        id,
        name: 'Sample Concept',
        description: 'A sample concept for testing',
        type: 'CONCEPTUAL',
        bloomsLevel: 'UNDERSTAND',
        keywords: ['sample', 'test'],
        confidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
function createSampleRelation(sourceId, targetId, overrides = {}) {
    return {
        id: `rel-${sourceId}-${targetId}`,
        sourceConceptId: sourceId,
        targetConceptId: targetId,
        relationType: 'PREREQUISITE',
        strength: 0.8,
        confidence: 0.9,
        createdAt: new Date(),
        ...overrides,
    };
}
function createConceptHierarchy() {
    const concepts = [
        createSampleConcept({
            id: 'concept-variables',
            name: 'Variables',
            type: 'FOUNDATIONAL',
            bloomsLevel: 'REMEMBER',
        }),
        createSampleConcept({
            id: 'concept-data-types',
            name: 'Data Types',
            type: 'FOUNDATIONAL',
            bloomsLevel: 'UNDERSTAND',
        }),
        createSampleConcept({
            id: 'concept-operators',
            name: 'Operators',
            type: 'PROCEDURAL',
            bloomsLevel: 'APPLY',
        }),
        createSampleConcept({
            id: 'concept-control-flow',
            name: 'Control Flow',
            type: 'CONCEPTUAL',
            bloomsLevel: 'APPLY',
        }),
        createSampleConcept({
            id: 'concept-functions',
            name: 'Functions',
            type: 'PROCEDURAL',
            bloomsLevel: 'ANALYZE',
        }),
        createSampleConcept({
            id: 'concept-recursion',
            name: 'Recursion',
            type: 'CONCEPTUAL',
            bloomsLevel: 'EVALUATE',
        }),
    ];
    const relations = [
        // Variables -> Data Types
        createSampleRelation('concept-variables', 'concept-data-types'),
        // Variables -> Operators
        createSampleRelation('concept-variables', 'concept-operators'),
        // Data Types -> Control Flow
        createSampleRelation('concept-data-types', 'concept-control-flow'),
        // Operators -> Control Flow
        createSampleRelation('concept-operators', 'concept-control-flow'),
        // Control Flow -> Functions
        createSampleRelation('concept-control-flow', 'concept-functions'),
        // Functions -> Recursion
        createSampleRelation('concept-functions', 'concept-recursion'),
    ];
    return { concepts, relations };
}
// ============================================================================
// TESTS
// ============================================================================
describe('KnowledgeGraphEngine', () => {
    let engine;
    beforeEach(() => {
        engine = createKnowledgeGraphEngine(createEngineConfig());
    });
    // ==========================================================================
    // CONSTRUCTOR AND INITIALIZATION TESTS
    // ==========================================================================
    describe('constructor', () => {
        it('should create an engine instance', () => {
            expect(engine).toBeInstanceOf(KnowledgeGraphEngine);
        });
        it('should use default confidence threshold', () => {
            const defaultEngine = createKnowledgeGraphEngine({
                samConfig: createMockSAMConfig(),
            });
            expect(defaultEngine).toBeInstanceOf(KnowledgeGraphEngine);
        });
        it('should accept custom confidence threshold', () => {
            const customEngine = createKnowledgeGraphEngine(createEngineConfig({ confidenceThreshold: 0.5 }));
            expect(customEngine).toBeInstanceOf(KnowledgeGraphEngine);
        });
        it('should accept custom max prerequisite depth', () => {
            const customEngine = createKnowledgeGraphEngine(createEngineConfig({ maxPrerequisiteDepth: 5 }));
            expect(customEngine).toBeInstanceOf(KnowledgeGraphEngine);
        });
    });
    describe('createKnowledgeGraphEngine factory', () => {
        it('should create engine using factory function', () => {
            const factoryEngine = createKnowledgeGraphEngine(createEngineConfig());
            expect(factoryEngine).toBeInstanceOf(KnowledgeGraphEngine);
        });
    });
    // ==========================================================================
    // CONCEPT EXTRACTION TESTS
    // ==========================================================================
    describe('extractConcepts', () => {
        it('should extract concepts from educational content', async () => {
            const result = await engine.extractConcepts({
                content: 'Variables are fundamental containers for storing data. Data types define what kind of data can be stored. Functions are reusable blocks of code.',
                contentType: 'COURSE_DESCRIPTION',
            });
            expect(result).toBeDefined();
            expect(result.concepts).toBeDefined();
            expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
        });
        it('should include confidence score', async () => {
            const result = await engine.extractConcepts({
                content: 'The basic introduction to programming covers variables and functions.',
                contentType: 'CHAPTER',
            });
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
        it('should extract relations between concepts', async () => {
            const result = await engine.extractConcepts({
                content: 'Understanding variables is essential before learning about data types. Functions build upon control flow concepts.',
                contentType: 'SECTION',
            });
            expect(result.relations).toBeDefined();
        });
        it('should detect concept types from content', async () => {
            const result = await engine.extractConcepts({
                content: 'This basic fundamental introduction covers the definition of variables. Learn how to implement functions step by step.',
                contentType: 'LEARNING_OBJECTIVE',
            });
            if (result.concepts.length > 0) {
                expect(['FOUNDATIONAL', 'PROCEDURAL', 'CONCEPTUAL', 'METACOGNITIVE']).toContain(result.concepts[0].type);
            }
        });
        it('should detect Blooms levels from content', async () => {
            const result = await engine.extractConcepts({
                content: 'Define the key terms. Explain how algorithms work. Apply these concepts to solve problems.',
                contentType: 'QUIZ',
            });
            if (result.concepts.length > 0) {
                expect([
                    'REMEMBER',
                    'UNDERSTAND',
                    'APPLY',
                    'ANALYZE',
                    'EVALUATE',
                    'CREATE',
                ]).toContain(result.concepts[0].bloomsLevel);
            }
        });
        it('should handle empty content', async () => {
            const result = await engine.extractConcepts({
                content: '',
                contentType: 'COURSE_DESCRIPTION',
            });
            expect(result.concepts).toEqual([]);
        });
        it('should handle short content', async () => {
            const result = await engine.extractConcepts({
                content: 'Hello',
                contentType: 'COURSE_DESCRIPTION',
            });
            expect(result).toBeDefined();
        });
        it('should accept context with existing concepts', async () => {
            const existingConcepts = [
                createSampleConcept({ name: 'Variables' }),
                createSampleConcept({ name: 'Functions' }),
            ];
            const result = await engine.extractConcepts({
                content: 'Learn about loops and conditionals.',
                contentType: 'CHAPTER',
                context: {
                    courseId: 'course-1',
                    existingConcepts,
                },
            });
            expect(result).toBeDefined();
        });
        it('should deduplicate extracted concepts', async () => {
            const result = await engine.extractConcepts({
                content: 'Variables are important. Variables store data. Variables can change.',
                contentType: 'COURSE_DESCRIPTION',
            });
            const variablesConcepts = result.concepts.filter((c) => c.name.toLowerCase().includes('variables'));
            // Should not have duplicate "Variables" concepts
            expect(variablesConcepts.length).toBeLessThanOrEqual(1);
        });
    });
    // ==========================================================================
    // KNOWLEDGE GRAPH BUILDING TESTS
    // ==========================================================================
    describe('buildGraph', () => {
        it('should build a knowledge graph from concepts', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph).toBeDefined();
            expect(graph.id).toBeDefined();
            expect(graph.courseId).toBe('course-1');
        });
        it('should include all concepts in graph', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.concepts.length).toBe(concepts.length);
        });
        it('should include all relations in graph', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.relations.length).toBe(relations.length);
        });
        it('should identify root concepts', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            // Variables is root (nothing points to it as prerequisite target)
            expect(graph.rootConcepts).toContain('concept-variables');
        });
        it('should identify terminal concepts', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            // Recursion is terminal (not a prerequisite for anything)
            expect(graph.terminalConcepts).toContain('concept-recursion');
        });
        it('should calculate graph statistics', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.stats).toBeDefined();
            expect(graph.stats.totalConcepts).toBe(concepts.length);
            expect(graph.stats.totalRelations).toBe(relations.length);
        });
        it('should calculate average connections', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.stats.averageConnections).toBeGreaterThan(0);
        });
        it('should calculate max depth', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.stats.maxDepth).toBeGreaterThan(0);
        });
        it('should count concepts by type', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.stats.conceptsByType.FOUNDATIONAL).toBeGreaterThan(0);
            expect(graph.stats.conceptsByType.PROCEDURAL).toBeGreaterThan(0);
        });
        it('should count concepts by Blooms level', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.stats.conceptsByBloomsLevel.REMEMBER).toBeGreaterThan(0);
            expect(graph.stats.conceptsByBloomsLevel.APPLY).toBeGreaterThan(0);
        });
        it('should cache the graph', () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            const cached = engine.getGraph('course-1');
            expect(cached).toBeDefined();
            expect(cached?.courseId).toBe('course-1');
        });
        it('should cache individual concepts', () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            const cached = engine.getConcept('concept-variables');
            expect(cached).toBeDefined();
            expect(cached?.name).toBe('Variables');
        });
        it('should set creation timestamps', () => {
            const { concepts, relations } = createConceptHierarchy();
            const graph = engine.buildGraph('course-1', concepts, relations);
            expect(graph.createdAt).toBeInstanceOf(Date);
            expect(graph.updatedAt).toBeInstanceOf(Date);
        });
        it('should handle empty concepts list', () => {
            const graph = engine.buildGraph('course-1', [], []);
            expect(graph.concepts).toEqual([]);
            expect(graph.relations).toEqual([]);
            expect(graph.stats.totalConcepts).toBe(0);
        });
    });
    // ==========================================================================
    // PREREQUISITE ANALYSIS TESTS
    // ==========================================================================
    describe('analyzePrerequisites', () => {
        beforeEach(() => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
        });
        it('should analyze prerequisites for a concept', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-recursion',
            });
            expect(result).toBeDefined();
            expect(result.concept.id).toBe('concept-recursion');
        });
        it('should find direct prerequisites', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-recursion',
            });
            expect(result.directPrerequisites.length).toBeGreaterThan(0);
            expect(result.directPrerequisites[0].concept.id).toBe('concept-functions');
        });
        it('should build prerequisite chain', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-recursion',
            });
            expect(result.prerequisiteChain.length).toBeGreaterThan(0);
        });
        it('should include depth in prerequisite chain', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-recursion',
            });
            for (const node of result.prerequisiteChain) {
                expect(node.depth).toBeGreaterThan(0);
            }
        });
        it('should identify bottleneck concepts', async () => {
            // Add more concepts that depend on control-flow to make it a bottleneck
            const extraConcepts = [
                createSampleConcept({ id: 'concept-loops', name: 'Loops' }),
                createSampleConcept({ id: 'concept-conditionals', name: 'Conditionals' }),
                createSampleConcept({ id: 'concept-switch', name: 'Switch Statements' }),
            ];
            const extraRelations = [
                createSampleRelation('concept-control-flow', 'concept-loops'),
                createSampleRelation('concept-control-flow', 'concept-conditionals'),
                createSampleRelation('concept-control-flow', 'concept-switch'),
            ];
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-2', [...concepts, ...extraConcepts], [
                ...relations,
                ...extraRelations,
            ]);
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-loops',
            });
            // Control flow should be a bottleneck since many things depend on it
            const controlFlowNode = result.prerequisiteChain.find((n) => n.concept.id === 'concept-control-flow');
            if (controlFlowNode) {
                expect(controlFlowNode.isBottleneck).toBe(true);
            }
        });
        it('should estimate learning time', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-recursion',
            });
            expect(result.estimatedLearningTime).toBeGreaterThan(0);
        });
        it('should find dependent concepts', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-functions',
            });
            expect(result.dependentConcepts.length).toBeGreaterThan(0);
            expect(result.dependentConcepts[0].id).toBe('concept-recursion');
        });
        it('should throw error for non-existent concept', async () => {
            await expect(engine.analyzePrerequisites({
                conceptId: 'non-existent',
            })).rejects.toThrow('Concept not found: non-existent');
        });
        it('should respect max depth', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-recursion',
                maxDepth: 1,
            });
            // With maxDepth 1, should only get direct prerequisites
            for (const node of result.prerequisiteChain) {
                expect(node.depth).toBeLessThanOrEqual(1);
            }
        });
        it('should return empty prerequisites for root concept', async () => {
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-variables',
            });
            expect(result.directPrerequisites).toEqual([]);
            expect(result.prerequisiteChain).toEqual([]);
        });
    });
    // ==========================================================================
    // LEARNING PATH GENERATION TESTS
    // ==========================================================================
    describe('generateLearningPath', () => {
        beforeEach(() => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
        });
        it('should generate a learning path', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-recursion'],
                strategy: 'BALANCED',
            });
            expect(path).toBeDefined();
            expect(path.id).toBeDefined();
            expect(path.userId).toBe('user-1');
        });
        it('should include target concepts', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-recursion'],
                strategy: 'BALANCED',
            });
            expect(path.targetConcepts.length).toBeGreaterThan(0);
            expect(path.targetConcepts[0].id).toBe('concept-recursion');
        });
        it('should create ordered sequence', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-recursion'],
                strategy: 'BALANCED',
            });
            expect(path.sequence.length).toBeGreaterThan(0);
            // Each node should have a position
            for (let i = 0; i < path.sequence.length; i++) {
                expect(path.sequence[i].position).toBe(i);
            }
        });
        it('should include prerequisites before targets', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-recursion'],
                strategy: 'BALANCED',
            });
            // Prerequisites should come before targets
            const prereqPositions = path.sequence
                .filter((n) => n.reason === 'PREREQUISITE')
                .map((n) => n.position);
            const targetPositions = path.sequence
                .filter((n) => n.reason === 'TARGET')
                .map((n) => n.position);
            if (prereqPositions.length > 0 && targetPositions.length > 0) {
                expect(Math.max(...prereqPositions)).toBeLessThan(Math.min(...targetPositions));
            }
        });
        it('should calculate total estimated time', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-recursion'],
                strategy: 'BALANCED',
            });
            expect(path.totalEstimatedTime).toBeGreaterThan(0);
        });
        it('should include activities for each node', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'BALANCED',
            });
            for (const node of path.sequence) {
                expect(node.activities.length).toBeGreaterThan(0);
                expect(node.activities[0].type).toBeDefined();
            }
        });
        it('should initialize progress tracking', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-recursion'],
                strategy: 'BALANCED',
            });
            expect(path.progress).toBeDefined();
            expect(path.progress.completedConcepts).toBe(0);
            expect(path.progress.percentComplete).toBe(0);
        });
        it('should use FASTEST strategy', async () => {
            const balancedPath = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'BALANCED',
            });
            const fastPath = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'FASTEST',
            });
            // Fastest should have shorter time or fewer activities
            expect(fastPath.totalEstimatedTime).toBeLessThanOrEqual(balancedPath.totalEstimatedTime);
        });
        it('should use THOROUGH strategy', async () => {
            const balancedPath = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'BALANCED',
            });
            const thoroughPath = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'THOROUGH',
            });
            // Thorough should have longer time
            expect(thoroughPath.totalEstimatedTime).toBeGreaterThanOrEqual(balancedPath.totalEstimatedTime);
        });
        it('should handle multiple target concepts', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions', 'concept-recursion'],
                strategy: 'BALANCED',
            });
            expect(path.targetConcepts.length).toBe(2);
        });
        it('should skip mastered concepts when requested', async () => {
            // First, mark a concept as mastered
            await engine.updateConceptMastery('user-1', 'concept-variables', 95, 'QUIZ');
            await engine.updateConceptMastery('user-1', 'concept-variables', 95, 'QUIZ');
            await engine.updateConceptMastery('user-1', 'concept-variables', 95, 'QUIZ');
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'BALANCED',
                skipMastered: true,
            });
            // Should not include mastered concept
            const hasVariables = path.sequence.some((n) => n.concept.id === 'concept-variables');
            expect(hasVariables).toBe(false);
        });
        it('should set creation timestamp', async () => {
            const path = await engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['concept-functions'],
                strategy: 'BALANCED',
            });
            expect(path.createdAt).toBeInstanceOf(Date);
        });
    });
    // ==========================================================================
    // MASTERY TRACKING TESTS
    // ==========================================================================
    describe('getConceptMastery', () => {
        beforeEach(() => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
        });
        it('should return default mastery for new user', async () => {
            const mastery = await engine.getConceptMastery('new-user', 'concept-variables');
            expect(mastery).toBeDefined();
            expect(mastery.userId).toBe('new-user');
            expect(mastery.conceptId).toBe('concept-variables');
            expect(mastery.masteryLevel).toBe('NOT_STARTED');
        });
        it('should return cached mastery', async () => {
            await engine.getConceptMastery('user-1', 'concept-variables');
            const mastery = await engine.getConceptMastery('user-1', 'concept-variables');
            expect(mastery.masteryLevel).toBe('NOT_STARTED');
        });
        it('should have zero initial score', async () => {
            const mastery = await engine.getConceptMastery('user-1', 'concept-variables');
            expect(mastery.score).toBe(0);
            expect(mastery.practiceCount).toBe(0);
        });
        it('should have empty evidence initially', async () => {
            const mastery = await engine.getConceptMastery('user-1', 'concept-variables');
            expect(mastery.evidence).toEqual([]);
        });
    });
    describe('updateConceptMastery', () => {
        beforeEach(() => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
        });
        it('should update mastery after practice', async () => {
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 80, 'PRACTICE');
            expect(mastery.score).toBe(80);
            expect(mastery.practiceCount).toBe(1);
        });
        it('should add evidence', async () => {
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 80, 'QUIZ');
            expect(mastery.evidence.length).toBe(1);
            expect(mastery.evidence[0].type).toBe('QUIZ');
            expect(mastery.evidence[0].score).toBe(80);
        });
        it('should set INTRODUCED level after first practice', async () => {
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 50, 'PRACTICE');
            expect(mastery.masteryLevel).toBe('INTRODUCED');
        });
        it('should set PRACTICING level with multiple practices', async () => {
            await engine.updateConceptMastery('user-1', 'concept-variables', 60, 'PRACTICE');
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 65, 'PRACTICE');
            expect(mastery.masteryLevel).toBe('PRACTICING');
        });
        it('should set PROFICIENT level with good scores', async () => {
            await engine.updateConceptMastery('user-1', 'concept-variables', 75, 'QUIZ');
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 75, 'QUIZ');
            expect(mastery.masteryLevel).toBe('PROFICIENT');
        });
        it('should set MASTERED level with excellent scores', async () => {
            await engine.updateConceptMastery('user-1', 'concept-variables', 95, 'QUIZ');
            await engine.updateConceptMastery('user-1', 'concept-variables', 95, 'QUIZ');
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 95, 'QUIZ');
            expect(mastery.masteryLevel).toBe('MASTERED');
        });
        it('should calculate average score from recent evidence', async () => {
            await engine.updateConceptMastery('user-1', 'concept-variables', 60, 'PRACTICE');
            await engine.updateConceptMastery('user-1', 'concept-variables', 80, 'PRACTICE');
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 100, 'PRACTICE');
            // Average of 60, 80, 100 = 80
            expect(mastery.score).toBe(80);
        });
        it('should update lastPracticedAt', async () => {
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 80, 'PRACTICE');
            expect(mastery.lastPracticedAt).toBeInstanceOf(Date);
        });
        it('should handle different evidence types', async () => {
            await engine.updateConceptMastery('user-1', 'concept-variables', 80, 'QUIZ');
            await engine.updateConceptMastery('user-1', 'concept-variables', 85, 'ASSIGNMENT');
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 90, 'INTERACTION');
            expect(mastery.evidence.length).toBe(3);
            expect(mastery.evidence.map((e) => e.type)).toEqual([
                'QUIZ',
                'ASSIGNMENT',
                'INTERACTION',
            ]);
        });
    });
    // ==========================================================================
    // UTILITY METHOD TESTS
    // ==========================================================================
    describe('getConcept', () => {
        it('should return cached concept', () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            const concept = engine.getConcept('concept-variables');
            expect(concept).toBeDefined();
            expect(concept?.name).toBe('Variables');
        });
        it('should return undefined for non-existent concept', () => {
            const concept = engine.getConcept('non-existent');
            expect(concept).toBeUndefined();
        });
    });
    describe('getGraph', () => {
        it('should return cached graph', () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            const graph = engine.getGraph('course-1');
            expect(graph).toBeDefined();
            expect(graph?.courseId).toBe('course-1');
        });
        it('should return undefined for non-existent graph', () => {
            const graph = engine.getGraph('non-existent');
            expect(graph).toBeUndefined();
        });
    });
    describe('clearCaches', () => {
        it('should clear all caches', () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            engine.clearCaches();
            expect(engine.getGraph('course-1')).toBeUndefined();
            expect(engine.getConcept('concept-variables')).toBeUndefined();
        });
        it('should clear mastery cache', async () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            await engine.updateConceptMastery('user-1', 'concept-variables', 80, 'QUIZ');
            engine.clearCaches();
            // After clearing, should get default mastery again
            const mastery = await engine.getConceptMastery('user-1', 'concept-variables');
            expect(mastery.masteryLevel).toBe('NOT_STARTED');
        });
    });
    // ==========================================================================
    // EDGE CASE TESTS
    // ==========================================================================
    describe('edge cases', () => {
        it('should handle graph with no relations', () => {
            const concepts = [
                createSampleConcept({ id: 'concept-1', name: 'Concept 1' }),
                createSampleConcept({ id: 'concept-2', name: 'Concept 2' }),
            ];
            const graph = engine.buildGraph('course-1', concepts, []);
            expect(graph.relations).toEqual([]);
            expect(graph.stats.maxDepth).toBe(0);
            expect(graph.stats.averageConnections).toBe(0);
        });
        it('should handle concept with no prerequisites in chain', async () => {
            const concepts = [createSampleConcept({ id: 'concept-solo', name: 'Solo Concept' })];
            engine.buildGraph('course-1', concepts, []);
            const result = await engine.analyzePrerequisites({
                conceptId: 'concept-solo',
            });
            expect(result.directPrerequisites).toEqual([]);
            expect(result.prerequisiteChain).toEqual([]);
        });
        it('should throw error for learning path with non-existent target', async () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            await expect(engine.generateLearningPath({
                userId: 'user-1',
                targetConceptIds: ['non-existent'],
                strategy: 'BALANCED',
            })).rejects.toThrow('Concept not found: non-existent');
        });
        it('should handle content with special characters', async () => {
            const result = await engine.extractConcepts({
                content: 'Learn about C++ & Java: "Object-Oriented" <Programming>!',
                contentType: 'COURSE_DESCRIPTION',
            });
            expect(result).toBeDefined();
        });
        it('should handle very long content', async () => {
            const longContent = 'Programming concepts. '.repeat(1000);
            const result = await engine.extractConcepts({
                content: longContent,
                contentType: 'COURSE_DESCRIPTION',
            });
            expect(result).toBeDefined();
            expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
        });
        it('should handle multiple graphs for different courses', () => {
            const { concepts: concepts1, relations: relations1 } = createConceptHierarchy();
            const concepts2 = [
                createSampleConcept({ id: 'concept-art', name: 'Art History' }),
                createSampleConcept({ id: 'concept-painting', name: 'Painting Techniques' }),
            ];
            const relations2 = [createSampleRelation('concept-art', 'concept-painting')];
            engine.buildGraph('course-programming', concepts1, relations1);
            engine.buildGraph('course-art', concepts2, relations2);
            expect(engine.getGraph('course-programming')).toBeDefined();
            expect(engine.getGraph('course-art')).toBeDefined();
            expect(engine.getGraph('course-programming')?.concepts.length).not.toBe(engine.getGraph('course-art')?.concepts.length);
        });
        it('should handle zero score mastery update', async () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 0, 'QUIZ');
            expect(mastery.score).toBe(0);
            expect(mastery.masteryLevel).toBe('INTRODUCED');
        });
        it('should handle 100 score mastery update', async () => {
            const { concepts, relations } = createConceptHierarchy();
            engine.buildGraph('course-1', concepts, relations);
            await engine.updateConceptMastery('user-1', 'concept-variables', 100, 'QUIZ');
            await engine.updateConceptMastery('user-1', 'concept-variables', 100, 'QUIZ');
            const mastery = await engine.updateConceptMastery('user-1', 'concept-variables', 100, 'QUIZ');
            expect(mastery.score).toBe(100);
            expect(mastery.masteryLevel).toBe('MASTERED');
        });
    });
});

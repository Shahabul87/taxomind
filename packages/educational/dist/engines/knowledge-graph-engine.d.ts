/**
 * @sam-ai/educational - KnowledgeGraphEngine
 *
 * Engine for concept extraction, prerequisite tracking, and knowledge dependency graphs.
 * Enables adaptive learning paths based on concept relationships.
 */
import type { KnowledgeGraphEngineConfig, Concept, ConceptRelation, ConceptMastery, KnowledgeGraph, ConceptExtractionInput, ConceptExtractionResult, PrerequisiteAnalysisInput, PrerequisiteAnalysisResult, LearningPathInput, LearningPath, CourseKnowledgeAnalysisInput, CourseKnowledgeAnalysisResult } from '../types';
export declare class KnowledgeGraphEngine {
    private config;
    private database?;
    private logger;
    private enableAIExtraction;
    private confidenceThreshold;
    private maxPrerequisiteDepth;
    private graphCache;
    private conceptCache;
    private masteryCache;
    constructor(engineConfig: KnowledgeGraphEngineConfig);
    /**
     * Extract concepts from educational content
     */
    extractConcepts(input: ConceptExtractionInput): Promise<ConceptExtractionResult>;
    private extractConceptsWithAI;
    private extractConceptsWithKeywords;
    private detectConceptType;
    private detectBloomsLevel;
    private extractNounPhrases;
    private deduplicateConcepts;
    private titleCase;
    /**
     * Build a knowledge graph from extracted concepts
     */
    buildGraph(courseId: string, concepts: Concept[], relations: ConceptRelation[]): KnowledgeGraph;
    private calculateGraphStats;
    private calculateMaxDepth;
    /**
     * Analyze prerequisites for a concept
     */
    analyzePrerequisites(input: PrerequisiteAnalysisInput): Promise<PrerequisiteAnalysisResult>;
    private buildPrerequisiteChain;
    private isBottleneck;
    private analyzePrerequisiteGaps;
    private generateGapSuggestions;
    /**
     * Generate an optimal learning path to target concepts
     */
    generateLearningPath(input: LearningPathInput): Promise<LearningPath>;
    private createLearningPathNode;
    private applyPathStrategy;
    /**
     * Analyze a course for knowledge graph quality
     */
    analyzeCourse(input: CourseKnowledgeAnalysisInput): Promise<CourseKnowledgeAnalysisResult>;
    private convertToFullConcept;
    private assessStructureQuality;
    private hasCircularDependencies;
    private generateCourseRecommendations;
    private assessCoverage;
    /**
     * Get or create concept mastery for a user
     */
    getConceptMastery(userId: string, conceptId: string): Promise<ConceptMastery>;
    /**
     * Update concept mastery based on performance
     */
    updateConceptMastery(userId: string, conceptId: string, score: number, evidenceType: 'QUIZ' | 'ASSIGNMENT' | 'PRACTICE' | 'INTERACTION'): Promise<ConceptMastery>;
    private determineMasteryLevel;
    private findGraphForConcept;
    /**
     * Get a cached concept by ID
     */
    getConcept(conceptId: string): Concept | undefined;
    /**
     * Get a cached graph by course ID
     */
    getGraph(courseId: string): KnowledgeGraph | undefined;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Find the prerequisite chain for a concept using BFS traversal.
     * Returns all prerequisite concepts in topological order (deepest prerequisites first).
     */
    findPrerequisiteChain(conceptId: string, graph: KnowledgeGraph): Concept[];
    /**
     * Find related concepts within a bounded depth using DFS.
     * Returns concepts reachable within the specified number of hops.
     */
    findRelatedConcepts(conceptId: string, graph: KnowledgeGraph, maxDepth?: number): Array<{
        concept: Concept;
        depth: number;
        relationTypes: string[];
    }>;
    /**
     * Calculate degree centrality for a concept.
     * Higher centrality = more connected = more important in the knowledge graph.
     */
    calculateConceptCentrality(conceptId: string, graph: KnowledgeGraph): {
        inDegree: number;
        outDegree: number;
        totalDegree: number;
        normalizedCentrality: number;
    };
    /**
     * Find all concepts sorted by centrality (most connected first).
     * Useful for identifying key concepts in a course.
     */
    rankConceptsByCentrality(graph: KnowledgeGraph): Array<{
        concept: Concept;
        centrality: number;
    }>;
}
export declare function createKnowledgeGraphEngine(config: KnowledgeGraphEngineConfig): KnowledgeGraphEngine;
//# sourceMappingURL=knowledge-graph-engine.d.ts.map
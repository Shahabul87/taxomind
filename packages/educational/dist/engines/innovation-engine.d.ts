/**
 * Innovation Engine - Portable Version
 *
 * Unique innovation features for SAM AI Tutor:
 * - Cognitive Fitness assessment and training
 * - Learning DNA generation and analysis
 * - Study Buddy AI companion
 * - Quantum Learning Paths
 */
import type { InnovationEngineConfig, CognitiveFitness, LearningDNA, StudyBuddy, BuddyInteraction, BuddyInteractionType, BuddyPreferences, QuantumPath, PathObservation, PathObservationType, InnovationEngine as IInnovationEngine } from '../types';
export declare class InnovationEngine implements IInnovationEngine {
    private config;
    private dbAdapter?;
    constructor(config?: InnovationEngineConfig);
    assessCognitiveFitness(userId: string): Promise<CognitiveFitness>;
    private assessCognitiveDimensions;
    private assessMemory;
    private assessAttention;
    private assessReasoning;
    private assessCreativity;
    private assessProcessingSpeed;
    private calculateOverallFitnessScore;
    private generateFitnessExercises;
    private getExercisesForDimension;
    private getMaintenanceExercises;
    private trackFitnessProgress;
    private getDefaultProgress;
    private calculateStreak;
    private generateFitnessRecommendations;
    generateLearningDNA(userId: string): Promise<LearningDNA>;
    private generateDNASequence;
    private generateCognitiveCode;
    private createCognitiveSegment;
    private createBehavioralSegment;
    private createEnvironmentalSegment;
    private createSocialSegment;
    private identifyGeneExpression;
    private findUniqueMarkers;
    private identifyLearningTraits;
    private traceLearningHeritage;
    private identifyAncestralPatterns;
    private traceEvolution;
    private identifyAdaptations;
    private detectDNAMutations;
    private expressLearningPhenotype;
    private deriveCapabilities;
    private identifyLimitations;
    private assessPotential;
    createStudyBuddy(userId: string, preferences?: BuddyPreferences): Promise<StudyBuddy>;
    private generateBuddyPersonality;
    private generatePersonalityTraits;
    private createBuddyAvatar;
    private generateAppearance;
    private initializeBuddyRelationship;
    private defineBuddyCapabilities;
    private generateBuddyName;
    interactWithBuddy(buddyId: string, userId: string, interactionType: BuddyInteractionType, context: Record<string, unknown>): Promise<BuddyInteraction>;
    private generateConversation;
    private generateQuizInteraction;
    private generateEncouragement;
    private generateChallenge;
    private generateCelebration;
    private updateBuddyRelationship;
    createQuantumPath(userId: string, learningGoal: string): Promise<QuantumPath>;
    private generateQuantumStates;
    private generateTraditionalPath;
    private generateAcceleratedPath;
    private generateExploratoryPath;
    private createSuperposition;
    private identifyEntanglements;
    private calculatePathProbabilities;
    observeQuantumPath(pathId: string, observationType: PathObservationType, observationData: Record<string, unknown>): Promise<PathObservation>;
    private calculateObservationImpact;
    private updateQuantumPath;
    private shouldCollapsePath;
    private collapseQuantumPath;
}
/**
 * Factory function to create an InnovationEngine instance
 */
export declare function createInnovationEngine(config?: InnovationEngineConfig): InnovationEngine;
//# sourceMappingURL=innovation-engine.d.ts.map
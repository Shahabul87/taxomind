/**
 * @sam-ai/react - useInnovationFeatures Hook
 * React hook for SAM AI innovative learning features
 *
 * This hook provides access to innovative learning features:
 * - Cognitive Fitness Assessment
 * - Learning DNA Generation
 * - AI Study Buddy
 * - Quantum Learning Paths
 */
/**
 * Cognitive dimension data
 */
export interface CognitiveDimension {
    name: string;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    description?: string;
}
/**
 * Cognitive fitness assessment result
 */
export interface CognitiveFitnessAssessment {
    dimensions: CognitiveDimension[];
    overallScore: number;
    progress: {
        weeklyCompleted: number;
        weeklyGoal: number;
        streak: number;
    };
    recommendations: string[];
}
/**
 * Fitness exercise details
 */
export interface FitnessExercise {
    id: string;
    name: string;
    instructions: string;
    duration: number;
    difficulty: number;
}
/**
 * Fitness session data
 */
export interface FitnessSession {
    sessionId: string;
    exercise: FitnessExercise;
    startTime: Date;
}
/**
 * Fitness recommendation
 */
export interface FitnessRecommendation {
    type: 'assessment' | 'exercise' | 'frequency';
    dimension?: string;
    message: string;
    exercises?: string[];
    priority: 'high' | 'medium' | 'low';
}
/**
 * Learning DNA trait
 */
export interface LearningTrait {
    traitId: string;
    name: string;
    strength: number;
    malleability: number;
    linkedTraits: string[];
}
/**
 * DNA Phenotype capability
 */
export interface PhenotypeCapability {
    name: string;
    level: number;
    applications: string[];
}
/**
 * Learning DNA result
 */
export interface LearningDNA {
    dnaSequence: {
        cognitiveCode: string;
        segments: Array<{
            segmentId: string;
            type: string;
            expression: number;
        }>;
        uniqueMarkers: string[];
    };
    traits: LearningTrait[];
    phenotype: {
        capabilities: PhenotypeCapability[];
        learningPreferences: string[];
    };
}
/**
 * DNA visualization data
 */
export interface DNAVisualization {
    helixData: Array<{
        position: string;
        expression: number;
        color: string;
    }>;
    traitNetwork: Array<{
        id: string;
        label: string;
        size: number;
        connections: string[];
    }>;
}
/**
 * Study buddy personality
 */
export interface BuddyPersonality {
    type: 'motivator' | 'challenger' | 'supporter' | 'analyst' | 'creative';
    traits: string[];
    communicationStyle: string;
}
/**
 * Study buddy data
 */
export interface StudyBuddyAI {
    buddyId: string;
    name: string;
    personality: BuddyPersonality;
    avatar: {
        type: string;
        color: string;
    };
    relationship: {
        level: number;
        trust: number;
    };
    capabilities: string[];
    isActive: boolean;
}
/**
 * Buddy interaction type
 */
export type BuddyInteractionType = 'conversation' | 'quiz' | 'encouragement' | 'challenge' | 'celebration';
/**
 * Buddy interaction result
 */
export interface BuddyInteraction {
    interactionId: string;
    type: BuddyInteractionType;
    content: string;
    emotionalTone: string;
    effectiveness?: number;
    responseOptions?: string[];
}
/**
 * Buddy effectiveness metrics
 */
export interface BuddyEffectiveness {
    overall: number;
    byType: Record<BuddyInteractionType, number>;
    trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    progressCorrelation: number;
    improvements: string[];
}
/**
 * Quantum state
 */
export interface QuantumState {
    stateId: string;
    probability: number;
    energy: number;
    constraints: string[];
    outcomes: Array<{
        outcomeId: string;
        probability: number;
        description: string;
    }>;
}
/**
 * Quantum learning path
 */
export interface QuantumLearningPath {
    pathId: string;
    learningGoal: string;
    superposition: {
        possibleStates: QuantumState[];
        currentProbabilities: Map<string, number>;
        coherenceLevel: number;
        decoherenceFactors: string[];
    };
    entanglements: Array<{
        entanglementId: string;
        entangledPaths: string[];
        correlationStrength: number;
        type: string;
    }>;
    probability: {
        successProbability: number;
        completionTimeDistribution: Record<string, number>;
        outcomeDistribution: Record<string, number>;
        uncertaintyPrinciple: {
            positionUncertainty: number;
            momentumUncertainty: number;
            product: number;
        };
    };
    collapsed: boolean;
    isActive: boolean;
}
/**
 * Quantum path observation type
 */
export type PathObservationType = 'progress' | 'assessment' | 'decision';
/**
 * Observation result
 */
export interface ObservationResult {
    observationId: string;
    type: PathObservationType;
    impact: {
        probabilityShifts: Map<string, number>;
        collapsedStates: string[];
        decoherence: number;
    };
    timestamp: string;
}
/**
 * Path collapse result
 */
export interface PathCollapseResult {
    finalState: {
        learningPath: Array<{
            id: string;
            content: string;
            duration: number;
        }>;
        outcomes: Array<{
            outcomeId: string;
            description: string;
        }>;
    };
    alternativesLost: string[];
    nextSteps: string[];
}
/**
 * Options for the innovation features hook
 */
export interface UseInnovationFeaturesOptions {
    /** API endpoint for innovation features */
    apiEndpoint?: string;
    /** Auto-load features status on mount */
    autoLoadStatus?: boolean;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Feature status overview
 */
export interface FeaturesStatus {
    hasCognitiveFitness: boolean;
    hasLearningDNA: boolean;
    hasStudyBuddy: boolean;
    activeQuantumPaths: number;
    lastUpdated: {
        fitness?: Date;
        dna?: Date;
        buddy?: Date;
    };
}
/**
 * Return type for the innovation features hook
 */
export interface UseInnovationFeaturesReturn {
    featuresStatus: FeaturesStatus | null;
    isLoadingStatus: boolean;
    cognitiveFitness: CognitiveFitnessAssessment | null;
    isAssessingFitness: boolean;
    assessCognitiveFitness: () => Promise<CognitiveFitnessAssessment | null>;
    startFitnessExercise: (exerciseId: string) => Promise<FitnessSession | null>;
    completeFitnessExercise: (sessionId: string, performance: Record<string, unknown>, duration: number) => Promise<void>;
    getFitnessRecommendations: () => Promise<FitnessRecommendation[]>;
    learningDNA: LearningDNA | null;
    dnaVisualization: DNAVisualization | null;
    isGeneratingDNA: boolean;
    generateLearningDNA: () => Promise<LearningDNA | null>;
    analyzeDNATraits: () => Promise<{
        traits: LearningTrait[];
        interactions: unknown[];
        predictions: unknown;
        strategies: unknown[];
    } | null>;
    trackDNAEvolution: () => Promise<{
        evolution: unknown;
        mutations: unknown[];
        timeline: unknown[];
    } | null>;
    studyBuddy: StudyBuddyAI | null;
    isCreatingBuddy: boolean;
    isInteracting: boolean;
    createStudyBuddy: (preferences: Record<string, unknown>) => Promise<StudyBuddyAI | null>;
    interactWithBuddy: (type: BuddyInteractionType, context: Record<string, unknown>) => Promise<BuddyInteraction | null>;
    updateBuddyPersonality: (personalityUpdates: Partial<BuddyPersonality>, reason?: string) => Promise<boolean>;
    getBuddyEffectiveness: () => Promise<BuddyEffectiveness | null>;
    quantumPaths: QuantumLearningPath[];
    isCreatingPath: boolean;
    createQuantumPath: (learningGoal: string, preferences?: Record<string, unknown>) => Promise<QuantumLearningPath | null>;
    observeQuantumPath: (pathId: string, type: PathObservationType, data: Record<string, unknown>) => Promise<ObservationResult | null>;
    getPathProbabilities: (pathId: string) => Promise<{
        currentProbabilities: Record<string, number>;
        successProbability: number;
        predictions: unknown[];
    } | null>;
    collapseQuantumPath: (pathId: string, reason?: string) => Promise<PathCollapseResult | null>;
    error: string | null;
    loadFeaturesStatus: () => Promise<FeaturesStatus | null>;
    clearError: () => void;
}
/**
 * Hook for SAM AI Innovation Features
 *
 * @example
 * ```tsx
 * function InnovationDashboard() {
 *   const {
 *     featuresStatus,
 *     cognitiveFitness,
 *     learningDNA,
 *     studyBuddy,
 *     quantumPaths,
 *     assessCognitiveFitness,
 *     generateLearningDNA,
 *     createStudyBuddy,
 *     createQuantumPath,
 *     error,
 *   } = useInnovationFeatures({
 *     autoLoadStatus: true,
 *   });
 *
 *   return (
 *     <div>
 *       {!featuresStatus?.hasCognitiveFitness && (
 *         <button onClick={assessCognitiveFitness}>
 *           Start Cognitive Fitness Assessment
 *         </button>
 *       )}
 *       {!featuresStatus?.hasLearningDNA && (
 *         <button onClick={generateLearningDNA}>
 *           Generate Learning DNA
 *         </button>
 *       )}
 *       {!featuresStatus?.hasStudyBuddy && (
 *         <button onClick={() => createStudyBuddy({ type: 'motivator' })}>
 *           Create Study Buddy
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useInnovationFeatures(options?: UseInnovationFeaturesOptions): UseInnovationFeaturesReturn;
export default useInnovationFeatures;
//# sourceMappingURL=useInnovationFeatures.d.ts.map
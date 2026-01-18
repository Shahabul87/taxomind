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

'use client';

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES - COGNITIVE FITNESS
// ============================================================================

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

// ============================================================================
// TYPES - LEARNING DNA
// ============================================================================

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

// ============================================================================
// TYPES - STUDY BUDDY
// ============================================================================

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
export type BuddyInteractionType =
  | 'conversation'
  | 'quiz'
  | 'encouragement'
  | 'challenge'
  | 'celebration';

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

// ============================================================================
// TYPES - QUANTUM PATHS
// ============================================================================

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

// ============================================================================
// TYPES - HOOK OPTIONS & RETURN
// ============================================================================

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
  // Status
  featuresStatus: FeaturesStatus | null;
  isLoadingStatus: boolean;

  // Cognitive Fitness
  cognitiveFitness: CognitiveFitnessAssessment | null;
  isAssessingFitness: boolean;
  assessCognitiveFitness: () => Promise<CognitiveFitnessAssessment | null>;
  startFitnessExercise: (exerciseId: string) => Promise<FitnessSession | null>;
  completeFitnessExercise: (
    sessionId: string,
    performance: Record<string, unknown>,
    duration: number
  ) => Promise<void>;
  getFitnessRecommendations: () => Promise<FitnessRecommendation[]>;

  // Learning DNA
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

  // Study Buddy
  studyBuddy: StudyBuddyAI | null;
  isCreatingBuddy: boolean;
  isInteracting: boolean;
  createStudyBuddy: (preferences: Record<string, unknown>) => Promise<StudyBuddyAI | null>;
  interactWithBuddy: (
    type: BuddyInteractionType,
    context: Record<string, unknown>
  ) => Promise<BuddyInteraction | null>;
  updateBuddyPersonality: (
    personalityUpdates: Partial<BuddyPersonality>,
    reason?: string
  ) => Promise<boolean>;
  getBuddyEffectiveness: () => Promise<BuddyEffectiveness | null>;

  // Quantum Paths
  quantumPaths: QuantumLearningPath[];
  isCreatingPath: boolean;
  createQuantumPath: (learningGoal: string, preferences?: Record<string, unknown>) => Promise<QuantumLearningPath | null>;
  observeQuantumPath: (
    pathId: string,
    type: PathObservationType,
    data: Record<string, unknown>
  ) => Promise<ObservationResult | null>;
  getPathProbabilities: (pathId: string) => Promise<{
    currentProbabilities: Record<string, number>;
    successProbability: number;
    predictions: unknown[];
  } | null>;
  collapseQuantumPath: (pathId: string, reason?: string) => Promise<PathCollapseResult | null>;

  // General
  error: string | null;
  loadFeaturesStatus: () => Promise<FeaturesStatus | null>;
  clearError: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

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
export function useInnovationFeatures(
  options: UseInnovationFeaturesOptions = {}
): UseInnovationFeaturesReturn {
  const {
    apiEndpoint = '/api/sam/innovation-features',
    autoLoadStatus = false,
    onError,
  } = options;

  // Status
  const [featuresStatus, setFeaturesStatus] = useState<FeaturesStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Cognitive Fitness
  const [cognitiveFitness, setCognitiveFitness] = useState<CognitiveFitnessAssessment | null>(null);
  const [isAssessingFitness, setIsAssessingFitness] = useState(false);

  // Learning DNA
  const [learningDNA, setLearningDNA] = useState<LearningDNA | null>(null);
  const [dnaVisualization, setDnaVisualization] = useState<DNAVisualization | null>(null);
  const [isGeneratingDNA, setIsGeneratingDNA] = useState(false);

  // Study Buddy
  const [studyBuddy, setStudyBuddy] = useState<StudyBuddyAI | null>(null);
  const [isCreatingBuddy, setIsCreatingBuddy] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // Quantum Paths
  const [quantumPaths, setQuantumPaths] = useState<QuantumLearningPath[]>([]);
  const [isCreatingPath, setIsCreatingPath] = useState(false);

  // Error
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);

  /**
   * Helper to make API calls
   */
  const apiCall = useCallback(
    async <T>(
      action: string,
      data: Record<string, unknown> = {}
    ): Promise<T | null> => {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, data }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          return result.data as T;
        }

        throw new Error(result.error || 'Request failed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return null;
      }
    },
    [apiEndpoint, onError]
  );

  /**
   * Load features status
   */
  const loadFeaturesStatus = useCallback(async (): Promise<FeaturesStatus | null> => {
    setIsLoadingStatus(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`Failed to load status: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const status: FeaturesStatus = {
          hasCognitiveFitness: data.data.hasCognitiveFitness,
          hasLearningDNA: data.data.hasLearningDNA,
          hasStudyBuddy: data.data.hasStudyBuddy,
          activeQuantumPaths: data.data.activeQuantumPaths,
          lastUpdated: {
            fitness: data.data.lastUpdated?.fitness ? new Date(data.data.lastUpdated.fitness) : undefined,
            dna: data.data.lastUpdated?.dna ? new Date(data.data.lastUpdated.dna) : undefined,
            buddy: data.data.lastUpdated?.buddy ? new Date(data.data.lastUpdated.buddy) : undefined,
          },
        };
        setFeaturesStatus(status);
        return status;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
      return null;
    } finally {
      setIsLoadingStatus(false);
    }
  }, [apiEndpoint, onError]);

  // Auto-load status on mount
  if (autoLoadStatus && !hasLoadedRef.current) {
    hasLoadedRef.current = true;
    loadFeaturesStatus();
  }

  // ============================================================================
  // COGNITIVE FITNESS METHODS
  // ============================================================================

  const assessCognitiveFitness = useCallback(async (): Promise<CognitiveFitnessAssessment | null> => {
    setIsAssessingFitness(true);
    setError(null);

    const result = await apiCall<{ fitness: CognitiveFitnessAssessment }>('assess-cognitive-fitness', {});

    if (result) {
      setCognitiveFitness(result.fitness);
      setIsAssessingFitness(false);
      return result.fitness;
    }

    setIsAssessingFitness(false);
    return null;
  }, [apiCall]);

  const startFitnessExercise = useCallback(
    async (exerciseId: string): Promise<FitnessSession | null> => {
      return apiCall<FitnessSession>('start-fitness-exercise', { exerciseId });
    },
    [apiCall]
  );

  const completeFitnessExercise = useCallback(
    async (sessionId: string, performance: Record<string, unknown>, duration: number): Promise<void> => {
      await apiCall('complete-fitness-exercise', { sessionId, performance, duration });
    },
    [apiCall]
  );

  const getFitnessRecommendations = useCallback(async (): Promise<FitnessRecommendation[]> => {
    const result = await apiCall<{ recommendations: FitnessRecommendation[] }>('get-fitness-recommendations', {});
    return result?.recommendations || [];
  }, [apiCall]);

  // ============================================================================
  // LEARNING DNA METHODS
  // ============================================================================

  const generateLearningDNA = useCallback(async (): Promise<LearningDNA | null> => {
    setIsGeneratingDNA(true);
    setError(null);

    const result = await apiCall<{
      dna: LearningDNA;
      visualization: DNAVisualization;
    }>('generate-learning-dna', {});

    if (result) {
      setLearningDNA(result.dna);
      setDnaVisualization(result.visualization);
      setIsGeneratingDNA(false);
      return result.dna;
    }

    setIsGeneratingDNA(false);
    return null;
  }, [apiCall]);

  const analyzeDNATraits = useCallback(async () => {
    return apiCall<{
      traits: LearningTrait[];
      interactions: unknown[];
      predictions: unknown;
      strategies: unknown[];
    }>('analyze-dna-traits', {});
  }, [apiCall]);

  const trackDNAEvolution = useCallback(async () => {
    return apiCall<{
      evolution: unknown;
      mutations: unknown[];
      timeline: unknown[];
    }>('track-dna-evolution', {});
  }, [apiCall]);

  // ============================================================================
  // STUDY BUDDY METHODS
  // ============================================================================

  const createStudyBuddy = useCallback(
    async (preferences: Record<string, unknown>): Promise<StudyBuddyAI | null> => {
      setIsCreatingBuddy(true);
      setError(null);

      const result = await apiCall<{ buddy: StudyBuddyAI }>('create-study-buddy', { preferences });

      if (result) {
        setStudyBuddy(result.buddy);
        setIsCreatingBuddy(false);
        return result.buddy;
      }

      setIsCreatingBuddy(false);
      return null;
    },
    [apiCall]
  );

  const interactWithBuddy = useCallback(
    async (
      type: BuddyInteractionType,
      context: Record<string, unknown>
    ): Promise<BuddyInteraction | null> => {
      if (!studyBuddy) {
        setError('No study buddy found. Create one first.');
        return null;
      }

      setIsInteracting(true);
      setError(null);

      const result = await apiCall<{ interaction: BuddyInteraction }>('interact-with-buddy', {
        buddyId: studyBuddy.buddyId,
        interactionType: type,
        context,
      });

      setIsInteracting(false);
      return result?.interaction || null;
    },
    [apiCall, studyBuddy]
  );

  const updateBuddyPersonality = useCallback(
    async (personalityUpdates: Partial<BuddyPersonality>, reason?: string): Promise<boolean> => {
      if (!studyBuddy) {
        setError('No study buddy found.');
        return false;
      }

      const result = await apiCall<{ success: boolean; updatedPersonality: BuddyPersonality }>(
        'update-buddy-personality',
        {
          buddyId: studyBuddy.buddyId,
          personalityUpdates,
          reason,
        }
      );

      if (result?.success && result.updatedPersonality) {
        setStudyBuddy((prev) =>
          prev
            ? { ...prev, personality: result.updatedPersonality }
            : null
        );
        return true;
      }

      return false;
    },
    [apiCall, studyBuddy]
  );

  const getBuddyEffectiveness = useCallback(async (): Promise<BuddyEffectiveness | null> => {
    if (!studyBuddy) {
      setError('No study buddy found.');
      return null;
    }

    return apiCall<BuddyEffectiveness>('get-buddy-effectiveness', {
      buddyId: studyBuddy.buddyId,
    });
  }, [apiCall, studyBuddy]);

  // ============================================================================
  // QUANTUM PATHS METHODS
  // ============================================================================

  const createQuantumPath = useCallback(
    async (
      learningGoal: string,
      preferences?: Record<string, unknown>
    ): Promise<QuantumLearningPath | null> => {
      setIsCreatingPath(true);
      setError(null);

      const result = await apiCall<{ quantumPath: QuantumLearningPath }>('create-quantum-path', {
        learningGoal,
        preferences,
      });

      if (result) {
        setQuantumPaths((prev) => [...prev, result.quantumPath]);
        setIsCreatingPath(false);
        return result.quantumPath;
      }

      setIsCreatingPath(false);
      return null;
    },
    [apiCall]
  );

  const observeQuantumPath = useCallback(
    async (
      pathId: string,
      type: PathObservationType,
      data: Record<string, unknown>
    ): Promise<ObservationResult | null> => {
      const result = await apiCall<{ observation: ObservationResult; pathState: unknown }>(
        'observe-quantum-path',
        {
          pathId,
          observationType: type,
          observationData: data,
        }
      );

      return result?.observation || null;
    },
    [apiCall]
  );

  const getPathProbabilities = useCallback(
    async (pathId: string) => {
      return apiCall<{
        currentProbabilities: Record<string, number>;
        successProbability: number;
        predictions: unknown[];
      }>('get-path-probabilities', { pathId });
    },
    [apiCall]
  );

  const collapseQuantumPath = useCallback(
    async (pathId: string, reason?: string): Promise<PathCollapseResult | null> => {
      const result = await apiCall<PathCollapseResult>('collapse-quantum-path', {
        pathId,
        reason,
      });

      if (result) {
        setQuantumPaths((prev) =>
          prev.map((p) =>
            p.pathId === pathId ? { ...p, collapsed: true, isActive: false } : p
          )
        );
      }

      return result;
    },
    [apiCall]
  );

  // ============================================================================
  // GENERAL METHODS
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Status
    featuresStatus,
    isLoadingStatus,

    // Cognitive Fitness
    cognitiveFitness,
    isAssessingFitness,
    assessCognitiveFitness,
    startFitnessExercise,
    completeFitnessExercise,
    getFitnessRecommendations,

    // Learning DNA
    learningDNA,
    dnaVisualization,
    isGeneratingDNA,
    generateLearningDNA,
    analyzeDNATraits,
    trackDNAEvolution,

    // Study Buddy
    studyBuddy,
    isCreatingBuddy,
    isInteracting,
    createStudyBuddy,
    interactWithBuddy,
    updateBuddyPersonality,
    getBuddyEffectiveness,

    // Quantum Paths
    quantumPaths,
    isCreatingPath,
    createQuantumPath,
    observeQuantumPath,
    getPathProbabilities,
    collapseQuantumPath,

    // General
    error,
    loadFeaturesStatus,
    clearError,
  };
}

export default useInnovationFeatures;

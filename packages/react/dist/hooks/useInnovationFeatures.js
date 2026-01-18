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
export function useInnovationFeatures(options = {}) {
    const { apiEndpoint = '/api/sam/innovation-features', autoLoadStatus = false, onError, } = options;
    // Status
    const [featuresStatus, setFeaturesStatus] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    // Cognitive Fitness
    const [cognitiveFitness, setCognitiveFitness] = useState(null);
    const [isAssessingFitness, setIsAssessingFitness] = useState(false);
    // Learning DNA
    const [learningDNA, setLearningDNA] = useState(null);
    const [dnaVisualization, setDnaVisualization] = useState(null);
    const [isGeneratingDNA, setIsGeneratingDNA] = useState(false);
    // Study Buddy
    const [studyBuddy, setStudyBuddy] = useState(null);
    const [isCreatingBuddy, setIsCreatingBuddy] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    // Quantum Paths
    const [quantumPaths, setQuantumPaths] = useState([]);
    const [isCreatingPath, setIsCreatingPath] = useState(false);
    // Error
    const [error, setError] = useState(null);
    const hasLoadedRef = useRef(false);
    /**
     * Helper to make API calls
     */
    const apiCall = useCallback(async (action, data = {}) => {
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
                return result.data;
            }
            throw new Error(result.error || 'Request failed');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            onError?.(message);
            return null;
        }
    }, [apiEndpoint, onError]);
    /**
     * Load features status
     */
    const loadFeaturesStatus = useCallback(async () => {
        setIsLoadingStatus(true);
        setError(null);
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to load status: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.data) {
                const status = {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            onError?.(message);
            return null;
        }
        finally {
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
    const assessCognitiveFitness = useCallback(async () => {
        setIsAssessingFitness(true);
        setError(null);
        const result = await apiCall('assess-cognitive-fitness', {});
        if (result) {
            setCognitiveFitness(result.fitness);
            setIsAssessingFitness(false);
            return result.fitness;
        }
        setIsAssessingFitness(false);
        return null;
    }, [apiCall]);
    const startFitnessExercise = useCallback(async (exerciseId) => {
        return apiCall('start-fitness-exercise', { exerciseId });
    }, [apiCall]);
    const completeFitnessExercise = useCallback(async (sessionId, performance, duration) => {
        await apiCall('complete-fitness-exercise', { sessionId, performance, duration });
    }, [apiCall]);
    const getFitnessRecommendations = useCallback(async () => {
        const result = await apiCall('get-fitness-recommendations', {});
        return result?.recommendations || [];
    }, [apiCall]);
    // ============================================================================
    // LEARNING DNA METHODS
    // ============================================================================
    const generateLearningDNA = useCallback(async () => {
        setIsGeneratingDNA(true);
        setError(null);
        const result = await apiCall('generate-learning-dna', {});
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
        return apiCall('analyze-dna-traits', {});
    }, [apiCall]);
    const trackDNAEvolution = useCallback(async () => {
        return apiCall('track-dna-evolution', {});
    }, [apiCall]);
    // ============================================================================
    // STUDY BUDDY METHODS
    // ============================================================================
    const createStudyBuddy = useCallback(async (preferences) => {
        setIsCreatingBuddy(true);
        setError(null);
        const result = await apiCall('create-study-buddy', { preferences });
        if (result) {
            setStudyBuddy(result.buddy);
            setIsCreatingBuddy(false);
            return result.buddy;
        }
        setIsCreatingBuddy(false);
        return null;
    }, [apiCall]);
    const interactWithBuddy = useCallback(async (type, context) => {
        if (!studyBuddy) {
            setError('No study buddy found. Create one first.');
            return null;
        }
        setIsInteracting(true);
        setError(null);
        const result = await apiCall('interact-with-buddy', {
            buddyId: studyBuddy.buddyId,
            interactionType: type,
            context,
        });
        setIsInteracting(false);
        return result?.interaction || null;
    }, [apiCall, studyBuddy]);
    const updateBuddyPersonality = useCallback(async (personalityUpdates, reason) => {
        if (!studyBuddy) {
            setError('No study buddy found.');
            return false;
        }
        const result = await apiCall('update-buddy-personality', {
            buddyId: studyBuddy.buddyId,
            personalityUpdates,
            reason,
        });
        if (result?.success && result.updatedPersonality) {
            setStudyBuddy((prev) => prev
                ? { ...prev, personality: result.updatedPersonality }
                : null);
            return true;
        }
        return false;
    }, [apiCall, studyBuddy]);
    const getBuddyEffectiveness = useCallback(async () => {
        if (!studyBuddy) {
            setError('No study buddy found.');
            return null;
        }
        return apiCall('get-buddy-effectiveness', {
            buddyId: studyBuddy.buddyId,
        });
    }, [apiCall, studyBuddy]);
    // ============================================================================
    // QUANTUM PATHS METHODS
    // ============================================================================
    const createQuantumPath = useCallback(async (learningGoal, preferences) => {
        setIsCreatingPath(true);
        setError(null);
        const result = await apiCall('create-quantum-path', {
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
    }, [apiCall]);
    const observeQuantumPath = useCallback(async (pathId, type, data) => {
        const result = await apiCall('observe-quantum-path', {
            pathId,
            observationType: type,
            observationData: data,
        });
        return result?.observation || null;
    }, [apiCall]);
    const getPathProbabilities = useCallback(async (pathId) => {
        return apiCall('get-path-probabilities', { pathId });
    }, [apiCall]);
    const collapseQuantumPath = useCallback(async (pathId, reason) => {
        const result = await apiCall('collapse-quantum-path', {
            pathId,
            reason,
        });
        if (result) {
            setQuantumPaths((prev) => prev.map((p) => p.pathId === pathId ? { ...p, collapsed: true, isActive: false } : p));
        }
        return result;
    }, [apiCall]);
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

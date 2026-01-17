/**
 * Innovation Engine Types
 */
export interface InnovationEngineConfig {
    aiProvider?: 'openai' | 'anthropic';
    databaseAdapter?: InnovationDatabaseAdapter;
}
export interface CognitiveFitness {
    userId: string;
    overallScore: number;
    dimensions: CognitiveDimension[];
    exercises: FitnessExercise[];
    progress: FitnessProgress;
    recommendations: FitnessRecommendation[];
}
export type CognitiveDimensionName = 'memory' | 'attention' | 'reasoning' | 'creativity' | 'processing_speed';
export interface CognitiveDimension {
    name: CognitiveDimensionName;
    score: number;
    percentile: number;
    trend: 'improving' | 'stable' | 'declining';
    lastAssessed: Date;
}
export interface FitnessExercise {
    exerciseId: string;
    name: string;
    type: string;
    targetDimension: string;
    difficulty: number;
    duration: number;
    frequency: string;
    completionRate: number;
    effectiveness: number;
}
export interface FitnessProgress {
    weeklyGoal: number;
    weeklyCompleted: number;
    streak: number;
    totalSessions: number;
    improvementRate: number;
    milestones: FitnessMilestone[];
}
export interface FitnessMilestone {
    name: string;
    achievedAt: Date;
    dimensionImproved: string;
    improvementAmount: number;
}
export interface FitnessRecommendation {
    dimension: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    exercises: string[];
    expectedImprovement: number;
}
export interface LearningDNA {
    userId: string;
    dnaSequence: DNASequence;
    traits: LearningTrait[];
    heritage: LearningHeritage;
    mutations: DNAMutation[];
    phenotype: LearningPhenotype;
}
export interface DNASequence {
    cognitiveCode: string;
    segments: DNASegment[];
    dominantGenes: string[];
    recessiveGenes: string[];
    uniqueMarkers: string[];
}
export interface DNASegment {
    segmentId: string;
    type: 'cognitive' | 'behavioral' | 'environmental' | 'social';
    expression: number;
    traits: string[];
    modifiers: string[];
}
export interface LearningTrait {
    traitId: string;
    name: string;
    category: string;
    strength: number;
    heritability: number;
    malleability: number;
    linkedTraits: string[];
}
export interface LearningHeritage {
    ancestralPatterns: AncestralPattern[];
    evolutionPath: EvolutionStage[];
    adaptations: InnovationAdaptation[];
}
export interface AncestralPattern {
    patternId: string;
    origin: string;
    strength: number;
    influence: number;
    active: boolean;
}
export interface EvolutionStage {
    stage: number;
    timestamp: Date;
    changes: string[];
    triggers: string[];
    success: boolean;
}
export interface InnovationAdaptation {
    adaptationId: string;
    trigger: string;
    response: string;
    effectiveness: number;
    frequency: number;
}
export interface DNAMutation {
    mutationId: string;
    type: 'beneficial' | 'neutral' | 'challenging';
    gene: string;
    effect: string;
    stability: number;
    reversible: boolean;
}
export interface LearningPhenotype {
    visibleTraits: string[];
    capabilities: InnovationCapability[];
    limitations: InnovationLimitation[];
    potential: PotentialArea[];
}
export interface InnovationCapability {
    name: string;
    level: number;
    evidence: string[];
    applications: string[];
}
export interface InnovationLimitation {
    name: string;
    severity: number;
    workarounds: string[];
    improvementPath: string[];
}
export interface PotentialArea {
    area: string;
    currentLevel: number;
    potentialLevel: number;
    unlockConditions: string[];
    developmentPath: string[];
}
export interface StudyBuddy {
    buddyId: string;
    name: string;
    personality: BuddyPersonality;
    avatar: BuddyAvatar;
    relationship: BuddyRelationship;
    capabilities: BuddyCapability[];
    interactions: BuddyInteraction[];
    effectiveness: BuddyEffectiveness;
}
export type BuddyPersonalityType = 'motivator' | 'challenger' | 'supporter' | 'analyst' | 'creative';
export interface BuddyPersonality {
    type: BuddyPersonalityType;
    traits: PersonalityTrait[];
    communicationStyle: string;
    humorLevel: number;
    strictnessLevel: number;
    adaptability: number;
}
export interface PersonalityTrait {
    trait: string;
    strength: number;
    expression: string[];
}
export interface BuddyAvatar {
    avatarId: string;
    appearance: string;
    animations: string[];
    expressions: string[];
    customizations: Record<string, unknown>;
}
export interface BuddyRelationship {
    userId: string;
    trustLevel: number;
    rapportScore: number;
    interactionCount: number;
    sharedExperiences: SharedExperience[];
    insideJokes: string[];
    preferredTopics: string[];
}
export interface SharedExperience {
    experienceId: string;
    type: string;
    description: string;
    emotionalImpact: number;
    timestamp: Date;
}
export interface BuddyCapability {
    capability: string;
    proficiency: number;
    specializations: string[];
    limitations: string[];
}
export type BuddyInteractionType = 'conversation' | 'quiz' | 'encouragement' | 'challenge' | 'celebration';
export interface BuddyInteraction {
    interactionId: string;
    type: BuddyInteractionType;
    content: Record<string, unknown>;
    userResponse: string;
    effectiveness: number;
    timestamp: Date;
}
export interface BuddyEffectiveness {
    motivationImpact: number;
    learningImpact: number;
    retentionImpact: number;
    satisfactionScore: number;
    adjustments: BuddyAdjustment[];
}
export interface BuddyAdjustment {
    reason: string;
    parameter: string;
    oldValue: unknown;
    newValue: unknown;
    impact: number;
    timestamp: Date;
}
export interface QuantumPath {
    pathId: string;
    userId: string;
    superposition: PathSuperposition;
    entanglements: PathEntanglement[];
    observations: PathObservation[];
    collapse: PathCollapse | null;
    probability: PathProbability;
}
export interface PathSuperposition {
    possibleStates: QuantumState[];
    currentProbabilities: Map<string, number>;
    coherenceLevel: number;
    decoherenceFactors: string[];
}
export interface QuantumState {
    stateId: string;
    learningPath: QuantumLearningNode[];
    probability: number;
    energy: number;
    outcomes: QuantumPotentialOutcome[];
    constraints: string[];
}
export interface QuantumLearningNode {
    nodeId: string;
    content: string;
    type: string;
    duration: number;
    prerequisites: string[];
    skillsGained: string[];
    quantumProperties: QuantumProperties;
}
export interface QuantumProperties {
    uncertainty: number;
    entanglementStrength: number;
    observationSensitivity: number;
    tunnelingProbability: number;
}
export interface PathEntanglement {
    entanglementId: string;
    entangledPaths: string[];
    correlationStrength: number;
    type: 'positive' | 'negative' | 'neutral';
    effects: EntanglementEffect[];
}
export interface EntanglementEffect {
    targetPath: string;
    effect: string;
    magnitude: number;
    condition: string;
}
export type PathObservationType = 'progress_check' | 'assessment' | 'interaction';
export interface PathObservation {
    observationId: string;
    observer: string;
    observationType: PathObservationType;
    timestamp: Date;
    impact: ObservationImpact;
}
export interface ObservationImpact {
    collapsedStates: string[];
    probabilityShifts: Map<string, number>;
    newEntanglements: string[];
    decoherence: number;
}
export interface PathCollapse {
    collapseId: string;
    finalState: QuantumState;
    timestamp: Date;
    trigger: string;
    confidence: number;
    alternativesLost: string[];
}
export interface PathProbability {
    successProbability: number;
    completionTimeDistribution: TimeDistribution;
    outcomeDistribution: OutcomeDistribution;
    uncertaintyPrinciple: UncertaintyMeasure;
}
export interface TimeDistribution {
    mean: number;
    standardDeviation: number;
    minimum: number;
    maximum: number;
    quantiles: Map<number, number>;
}
export interface OutcomeDistribution {
    outcomes: Map<string, number>;
    expectedValue: number;
    variance: number;
    bestCase: QuantumPotentialOutcome;
    worstCase: QuantumPotentialOutcome;
}
export interface QuantumPotentialOutcome {
    outcomeId: string;
    description: string;
    probability: number;
    value: number;
    requirements: string[];
}
export interface UncertaintyMeasure {
    positionUncertainty: number;
    momentumUncertainty: number;
    product: number;
}
export interface InnovationDatabaseAdapter {
    getUserLearningData(userId: string): Promise<InnovationLearningData>;
    storeCognitiveFitnessAssessment(assessment: CognitiveFitness): Promise<void>;
    getCognitiveFitnessAssessments(userId: string): Promise<CognitiveFitness[]>;
    getFitnessSessions(userId: string, since: Date): Promise<FitnessSession[]>;
    getFitnessMilestones(userId: string): Promise<FitnessMilestone[]>;
    countFitnessSessions(userId: string): Promise<number>;
    storeLearningDNA(dna: LearningDNA): Promise<void>;
    getLearningDNA(userId: string): Promise<LearningDNA | null>;
    createStudyBuddy(buddy: StudyBuddy): Promise<void>;
    getStudyBuddy(buddyId: string): Promise<StudyBuddy | null>;
    updateStudyBuddy(buddyId: string, data: Partial<StudyBuddy>): Promise<void>;
    storeBuddyInteraction(buddyId: string, userId: string, interaction: BuddyInteraction): Promise<void>;
    storeQuantumPath(path: QuantumPath, learningGoal: string): Promise<void>;
    getQuantumPath(pathId: string): Promise<QuantumPath | null>;
    updateQuantumPath(pathId: string, data: Partial<QuantumPath>): Promise<void>;
    storeQuantumObservation(pathId: string, observation: PathObservation): Promise<void>;
    getQuantumObservations(pathId: string): Promise<PathObservation[]>;
    findLearningPeers(userId: string): Promise<{
        pathId: string;
        userId: string;
    }[]>;
}
export interface InnovationLearningData {
    userId: string;
    progress: Array<{
        quizScore?: number;
        progressPercentage?: number;
        timeSpent?: number;
        courseId?: string;
    }>;
    activities: Array<{
        timestamp: Date;
        contentId?: string;
        contentType?: string;
        metadata?: Record<string, unknown>;
    }>;
    achievements: Array<{
        name: string;
        achievedAt: Date;
    }>;
    retentionRate: number;
    recallAccuracy: number;
    spacedRepPerformance: number;
    avgFocusDuration: number;
    taskSwitchingRate: number;
    completionRate: number;
    problemSolvingAccuracy: number;
    logicalProgressionScore: number;
    abstractThinkingScore: number;
    solutionDiversity: number;
    novelApproachRate: number;
    crossDomainScore: number;
    avgResponseTime: number;
    speedImprovementRate: number;
    timedAccuracy: number;
    preferredLearningStyle?: string;
    peakPerformanceTime?: string;
    strongestSubject?: string;
    learningVelocity?: number;
}
export interface FitnessSession {
    sessionId: string;
    userId: string;
    exerciseId: string;
    completedAt: Date;
    duration: number;
    performance: number;
}
export interface BuddyPreferences {
    name?: string;
    personalityType?: BuddyPersonalityType;
    humorLevel?: number;
    strictnessLevel?: number;
    appearance?: string;
    customizations?: Record<string, unknown>;
}
export interface InnovationEngine {
    assessCognitiveFitness(userId: string): Promise<CognitiveFitness>;
    generateLearningDNA(userId: string): Promise<LearningDNA>;
    createStudyBuddy(userId: string, preferences?: BuddyPreferences): Promise<StudyBuddy>;
    interactWithBuddy(buddyId: string, userId: string, interactionType: BuddyInteractionType, context: Record<string, unknown>): Promise<BuddyInteraction>;
    createQuantumPath(userId: string, learningGoal: string): Promise<QuantumPath>;
    observeQuantumPath(pathId: string, observationType: PathObservationType, observationData: Record<string, unknown>): Promise<PathObservation>;
}
//# sourceMappingURL=innovation.types.d.ts.map
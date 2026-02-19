import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createInnovationEngine } from "@sam-ai/educational";
import type { BuddyInteractionType, PathObservationType } from "@sam-ai/educational";
import { logger } from '@/lib/logger';
import { createInnovationAdapter } from '@/lib/adapters';

// ============================================================
// Type definitions for handler data shapes
// ============================================================

/** A cognitive fitness dimension with score and trend data */
interface CognitiveDimension {
  name: string;
  score: number;
  trend: string;
}

/** Cognitive fitness assessment result */
interface CognitiveFitnessResult {
  dimensions: CognitiveDimension[];
  [key: string]: unknown;
}

/** Fitness insights derived from an assessment */
interface FitnessInsights {
  strengths: CognitiveDimension[];
  weaknesses: CognitiveDimension[];
  trends: Array<{
    dimension: string;
    trend: string;
    recommendation: string;
  }>;
}

/** Exercise details returned from getExerciseDetails */
interface ExerciseDetails {
  id: string;
  name: string;
  instructions: string;
  duration: number;
  difficulty: number;
}

/** Performance data submitted when completing an exercise */
interface ExercisePerformance {
  score?: number;
  [key: string]: unknown;
}

/** Data for starting a fitness exercise */
interface StartFitnessExerciseData {
  exerciseId: string;
}

/** Data for completing a fitness exercise */
interface CompleteFitnessExerciseData {
  sessionId: string;
  performance?: ExercisePerformance;
  duration?: number;
}

/** A single DNA segment in the helix */
interface DNASegment {
  segmentId: string;
  expression: number;
  type: string;
}

/** A single trait in the learning DNA */
interface DNATrait {
  traitId: string;
  name: string;
  strength: number;
  malleability: number;
  linkedTraits: string[];
}

/** A phenotype capability */
interface PhenotypeCapability {
  name: string;
  applications: string[];
}

/** DNA sequence data from the innovation engine */
interface DNASequence {
  segments: DNASegment[];
  uniqueMarkers: string[];
  cognitiveCode: string;
}

/** Learning DNA result from the innovation engine */
interface LearningDNAResult {
  dnaSequence: DNASequence;
  traits: DNATrait[];
  phenotype: {
    capabilities: PhenotypeCapability[];
  };
  [key: string]: unknown;
}

/** Parsed DNA data from database for trait analysis */
interface ParsedDNAData {
  traits: DNATrait[];
  phenotype: {
    capabilities: PhenotypeCapability[];
  };
}

/** DNA visualization data */
interface DNAVisualization {
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

/** A DNA mutation record */
interface DNAMutation {
  type: string;
  effect: string;
  [key: string]: unknown;
}

/** Study buddy preferences */
interface StudyBuddyPreferences {
  [key: string]: unknown;
}

/** Data for creating a study buddy */
interface CreateStudyBuddyData {
  preferences: StudyBuddyPreferences;
}

/** Study buddy result from engine */
interface StudyBuddyResult {
  buddyId: string;
  personality: { type: string; [key: string]: unknown };
  [key: string]: unknown;
}

/** Data for interacting with a study buddy */
interface InteractWithBuddyData {
  buddyId: string;
  interactionType: BuddyInteractionType;
  context?: Record<string, unknown>;
}

/** Buddy interaction result */
interface BuddyInteractionResult {
  type: string;
  content: string;
  timestamp?: string;
  buddyId?: string;
  userId?: string;
  [key: string]: unknown;
}

/** Data for updating buddy personality */
interface UpdateBuddyPersonalityData {
  buddyId: string;
  personalityUpdates: Record<string, unknown>;
  reason?: string;
}

/** Data for getting buddy effectiveness */
interface GetBuddyEffectivenessData {
  buddyId: string;
}

/** A buddy interaction record from DB */
interface BuddyInteractionRecord {
  interactionType: string;
  effectiveness?: number;
  createdAt: Date;
  [key: string]: unknown;
}

/** Buddy effectiveness metrics */
interface BuddyEffectivenessMetrics {
  overall: number;
  byType: {
    conversation: number;
    quiz: number;
    encouragement: number;
    challenge: number;
    celebration: number;
  };
  trend: string;
}

/** Data for creating a quantum path */
interface CreateQuantumPathData {
  learningGoal: string;
  preferences?: Record<string, unknown>;
}

/** A quantum state within a superposition */
interface QuantumState {
  stateId: string;
  learningPath?: LearningPathNode[];
  outcomes?: Array<{ type: string; probability: number }>;
  energy?: number;
  probability?: number;
  constraints?: unknown;
}

/** A node in a learning path */
interface LearningPathNode {
  content: string;
  duration: number;
  type: string;
}

/** Quantum path superposition data */
interface QuantumSuperposition {
  possibleStates: QuantumState[];
  currentProbabilities: Map<string, number> | Record<string, number>;
  coherenceLevel?: number;
  decoherenceFactors?: string[];
}

/** Quantum path entanglement data */
interface QuantumEntanglement {
  entanglementId: string;
  entangledPaths: string[];
  correlationStrength: number;
  type: string;
}

/** Quantum path result from the innovation engine */
interface QuantumPathResult {
  superposition: QuantumSuperposition;
  entanglements: QuantumEntanglement[];
  [key: string]: unknown;
}

/** Observation impact data */
interface ObservationImpact {
  probabilityShifts: Map<string, number>;
  collapsedStates: string[];
  decoherence: number;
}

/** Observation result from the innovation engine */
interface ObservationResult {
  type: string;
  timestamp: string;
  pathId: string;
  userId: string;
  impact: ObservationImpact;
  message?: string;
  [key: string]: unknown;
}

/** Data for observing a quantum path */
interface ObserveQuantumPathData {
  pathId: string;
  observationType: PathObservationType;
  observationData?: Record<string, unknown>;
}

/** Data for getting path probabilities */
interface GetPathProbabilitiesData {
  pathId: string;
}

/** Probability data from the database */
interface QuantumProbability {
  successProbability: number;
  completionTimeDistribution?: unknown;
  outcomeDistribution?: unknown;
  uncertaintyPrinciple?: {
    product: number;
    positionUncertainty: number;
    momentumUncertainty: number;
  };
}

/** Data for collapsing a quantum path */
interface CollapseQuantumPathData {
  pathId: string;
  reason?: string;
}

/** Collapse final state data */
interface CollapseFinalState {
  learningPath: LearningPathNode[];
  outcomes: Array<{ type: string; probability: number }>;
  selectedState: string;
}

/** Full collapse result data */
interface CollapseResult {
  timestamp: string;
  observation: { type: string; reason: string };
  finalState: CollapseFinalState;
  alternativesLost: string[];
}

/** Quantum path state parsed from database */
interface ParsedPathState {
  superposition: QuantumSuperposition & { possibleStates: QuantumState[] };
  coherenceLevel: number;
  collapsed: boolean;
}

/** Detailed probability breakdown per state */
interface DetailedProbability {
  stateBreakdown: Array<{
    state: string;
    currentProbability: number;
    successChance: number;
    effortRequired: number | undefined;
    constraints: unknown;
  }>;
  overallSuccess: number;
  riskFactors: string[];
}

/** Probability change tracking */
interface ProbabilityChanges {
  changes: Array<{
    state: string;
    change: number;
    direction: string;
  }>;
  collapsedStates: string[];
  decoherence: number;
}

/** Trait interaction between two traits */
interface TraitInteraction {
  trait1: string;
  trait2: string;
  synergy: number;
  effect: string;
}

/** Trait development prediction */
interface TraitPrediction {
  trait: string;
  currentStrength: number;
  predictedStrength: number;
  developmentTime: number;
  difficulty: string;
}

/** A learning strategy suggestion */
interface LearningStrategy {
  strategy: string;
  description: string;
  applications: string[];
}

/** DNA evolution analysis */
interface DNAEvolution {
  stages: Array<{
    stage: number;
    date: Date;
    dominantChanges: string[];
  }>;
  overallTrend: string;
  stabilityScore: number;
}

/** Next evolution prediction */
interface NextEvolutionPrediction {
  predictedChanges: string[];
  timeframe: string;
  conditions: string[];
  probability: number;
}

/** Quantum visualization data */
interface QuantumVisualization {
  states: Array<{
    id: string;
    label: string;
    probability: number | undefined;
    energy: number | undefined;
    color: string;
  }>;
  entanglements: Array<{
    source: string;
    targets: string[];
    strength: number;
    type: string;
  }>;
  coherence: number | undefined;
}

/** Outcome prediction per state */
interface OutcomePrediction {
  scenario: string;
  likelihood: number;
  confidence: string;
  recommendation: string;
}

/** Uncertainty analysis result */
interface UncertaintyAnalysis {
  interpretation: string;
  positionInsight: string;
  momentumInsight: string;
  recommendation: string;
}

// ============================================================
// Innovation engine setup
// ============================================================

// Create innovation engine singleton
let innovationEngine: ReturnType<typeof createInnovationEngine> | null = null;

function getInnovationEngine() {
  if (!innovationEngine) {
    innovationEngine = createInnovationEngine({
      aiProvider: 'anthropic',
      databaseAdapter: createInnovationAdapter(db),
    });
  }
  return innovationEngine;
}

// Backward compatibility alias
const samInnovationEngine = {
  assessCognitiveFitness: (userId: string) =>
    getInnovationEngine().assessCognitiveFitness(userId),
  generateLearningDNA: (userId: string) =>
    getInnovationEngine().generateLearningDNA(userId),
  createStudyBuddy: (userId: string, preferences: Record<string, unknown>) =>
    getInnovationEngine().createStudyBuddy(userId, preferences),
  interactWithBuddy: (buddyId: string, userId: string, type: BuddyInteractionType, context: Record<string, unknown>) =>
    getInnovationEngine().interactWithBuddy(buddyId, userId, type, context),
  createQuantumPath: (userId: string, learningGoal: string) =>
    getInnovationEngine().createQuantumPath(userId, learningGoal),
  observeQuantumPath: (pathId: string, type: PathObservationType, data: Record<string, unknown>) =>
    getInnovationEngine().observeQuantumPath(pathId, type, data),
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      // Cognitive Fitness actions
      case "assess-cognitive-fitness":
        result = await handleAssessCognitiveFitness(session.user.id);
        break;

      case "start-fitness-exercise":
        result = await handleStartFitnessExercise(data as StartFitnessExerciseData, session.user.id);
        break;

      case "complete-fitness-exercise":
        result = await handleCompleteFitnessExercise(data as CompleteFitnessExerciseData, session.user.id);
        break;

      case "get-fitness-recommendations":
        result = await handleGetFitnessRecommendations(session.user.id);
        break;

      // Learning DNA actions
      case "generate-learning-dna":
        result = await handleGenerateLearningDNA(session.user.id);
        break;

      case "analyze-dna-traits":
        result = await handleAnalyzeDNATraits(session.user.id);
        break;

      case "track-dna-evolution":
        result = await handleTrackDNAEvolution(session.user.id);
        break;

      // Study Buddy actions
      case "create-study-buddy":
        result = await handleCreateStudyBuddy(session.user.id, data as CreateStudyBuddyData);
        break;

      case "interact-with-buddy":
        result = await handleInteractWithBuddy(data as InteractWithBuddyData, session.user.id);
        break;

      case "update-buddy-personality":
        result = await handleUpdateBuddyPersonality(data as UpdateBuddyPersonalityData, session.user.id);
        break;

      case "get-buddy-effectiveness":
        result = await handleGetBuddyEffectiveness((data as GetBuddyEffectivenessData).buddyId);
        break;

      // Quantum Learning Paths actions
      case "create-quantum-path":
        result = await handleCreateQuantumPath(session.user.id, data as CreateQuantumPathData);
        break;

      case "observe-quantum-path":
        result = await handleObserveQuantumPath(data as ObserveQuantumPathData, session.user.id);
        break;

      case "get-path-probabilities":
        result = await handleGetPathProbabilities((data as GetPathProbabilitiesData).pathId);
        break;

      case "collapse-quantum-path":
        result = await handleCollapseQuantumPath(data as CollapseQuantumPathData, session.user.id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });
  } catch (error) {
    logger.error("Innovation features error:", error);
    return NextResponse.json(
      { error: "Failed to process innovation features request" },
      { status: 500 }
    );
  }
}

// === COGNITIVE FITNESS HANDLERS ===
async function handleAssessCognitiveFitness(userId: string) {
  const fitness = await samInnovationEngine.assessCognitiveFitness(userId) as CognitiveFitnessResult;

  // Generate personalized insights
  const insights = generateFitnessInsights(fitness);

  return {
    fitness,
    insights,
    nextAssessmentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };
}

async function handleStartFitnessExercise(data: StartFitnessExerciseData, userId: string) {
  const { exerciseId } = data;

  if (!exerciseId) {
    throw new Error("Exercise ID is required");
  }

  // Create exercise session
  const session = await db.fitnessSession.create({
    data: {
      userId,
      exerciseId,
      startTime: new Date(),
      status: "in_progress",
    },
  });

  return {
    sessionId: session.id,
    exercise: await getExerciseDetails(exerciseId),
    startTime: session.startTime,
  };
}

async function handleCompleteFitnessExercise(data: CompleteFitnessExerciseData, userId: string) {
  const { sessionId, performance, duration } = data;

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  // Update session
  const session = await db.fitnessSession.update({
    where: { id: sessionId },
    data: {
      endTime: new Date(),
      duration,
      performance: performance || {},
      status: "completed",
    },
  });

  // Update cognitive dimensions based on performance
  await updateCognitiveDimensions(userId, session.exerciseId, performance);

  // Check for milestones
  const milestones = await checkFitnessMilestones(userId);

  return {
    session,
    improvement: calculateImprovement(performance),
    milestones,
  };
}

async function handleGetFitnessRecommendations(userId: string) {
  const latestAssessment = await db.cognitiveFitnessAssessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!latestAssessment) {
    return {
      recommendations: [
        {
          type: "assessment",
          message: "Complete your first cognitive fitness assessment",
          priority: "high",
        },
      ],
    };
  }

  const fitness = {
    dimensions: JSON.parse(latestAssessment.dimensions as string) as CognitiveDimension[],
    progress: JSON.parse(latestAssessment.progress as string) as { weeklyCompleted: number; weeklyGoal: number },
  };

  // Generate dynamic recommendations
  const recommendations: Array<{
    type: string;
    dimension?: string;
    message: string;
    exercises?: string[];
    priority: string;
    currentFrequency?: number;
    targetFrequency?: number;
  }> = [];

  // Dimension-based recommendations
  fitness.dimensions.forEach((dim: CognitiveDimension) => {
    if (dim.score < 60) {
      recommendations.push({
        type: "exercise",
        dimension: dim.name,
        message: `Improve your ${dim.name} with targeted exercises`,
        exercises: getRecommendedExercises(dim.name),
        priority: dim.score < 40 ? "high" : "medium",
      });
    }
  });

  // Progress-based recommendations
  if (fitness.progress.weeklyCompleted < fitness.progress.weeklyGoal) {
    recommendations.push({
      type: "frequency",
      message: "Increase your training frequency to meet weekly goals",
      currentFrequency: fitness.progress.weeklyCompleted,
      targetFrequency: fitness.progress.weeklyGoal,
      priority: "medium",
    });
  }

  return { recommendations };
}

// === LEARNING DNA HANDLERS ===
async function handleGenerateLearningDNA(userId: string) {
  const dna = await samInnovationEngine.generateLearningDNA(userId) as LearningDNAResult;

  // Generate visualization data
  const visualization = generateDNAVisualization(dna);

  // Identify unique strengths
  const uniqueStrengths = identifyUniqueStrengths(dna);

  return {
    dna,
    visualization,
    uniqueStrengths,
    shareableCode: generateShareableCode(dna),
  };
}

async function handleAnalyzeDNATraits(userId: string) {
  const latestDNA = await db.learningDNA.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!latestDNA) {
    throw new Error("Learning DNA not found. Generate it first.");
  }

  const dna: ParsedDNAData = {
    traits: JSON.parse(latestDNA.traits as string) as DNATrait[],
    phenotype: JSON.parse(latestDNA.phenotype as string) as { capabilities: PhenotypeCapability[] },
  };

  // Analyze trait interactions
  const traitInteractions = analyzeTraitInteractions(dna.traits);

  // Predict future development
  const developmentPrediction = predictTraitDevelopment(dna.traits);

  // Generate personalized strategies
  const strategies = generateLearningStrategies(dna);

  return {
    traits: dna.traits,
    phenotype: dna.phenotype,
    interactions: traitInteractions,
    predictions: developmentPrediction,
    strategies,
  };
}

async function handleTrackDNAEvolution(userId: string) {
  const dnaHistory = await db.learningDNA.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (dnaHistory.length < 2) {
    return {
      evolution: null,
      message: "Not enough data to track evolution. Generate DNA over time.",
    };
  }

  // Analyze changes over time
  const evolution = analyzeDNAEvolution(dnaHistory);

  // Identify mutations
  const mutations = identifyMutations(dnaHistory);

  // Predict next evolution
  const nextEvolution = predictNextEvolution(evolution, mutations);

  return {
    evolution,
    mutations,
    nextEvolution,
    timeline: dnaHistory.map((d) => ({
      date: d.createdAt,
      majorChanges: extractMajorChanges(d),
    })),
  };
}

// === STUDY BUDDY HANDLERS ===
async function handleCreateStudyBuddy(userId: string, data: CreateStudyBuddyData) {
  const { preferences } = data;

  // Check if user already has an active buddy
  const existingBuddy = await db.studyBuddy.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  if (existingBuddy) {
    return {
      buddy: existingBuddy,
      message: "You already have an active study buddy",
    };
  }

  const buddy = await samInnovationEngine.createStudyBuddy(userId, preferences) as StudyBuddyResult;

  // Create welcome interaction
  const welcomeInteraction = await samInnovationEngine.interactWithBuddy(
    buddy.buddyId,
    userId,
    "conversation",
    {
      topic: "introduction",
      message: "Hello! I'm excited to learn together!",
    }
  ) as BuddyInteractionResult;

  return {
    buddy,
    welcomeMessage: welcomeInteraction.content,
    setupTips: getStudyBuddyTips(buddy.personality.type),
  };
}

async function handleInteractWithBuddy(data: InteractWithBuddyData, userId: string) {
  const { buddyId, interactionType, context } = data;

  if (!buddyId || !interactionType) {
    throw new Error("Buddy ID and interaction type are required");
  }

  let interaction: BuddyInteractionResult;
  try {
    interaction = await samInnovationEngine.interactWithBuddy(
      buddyId,
      userId,
      interactionType,
      context || {}
    ) as BuddyInteractionResult;
  } catch (engineError) {
    // Fallback: Generate a simple interaction response if engine fails
    logger.warn("InnovationEngine interactWithBuddy failed, using fallback:", engineError);
    interaction = {
      type: interactionType,
      content: getDefaultBuddyResponse(interactionType),
      timestamp: new Date().toISOString(),
      buddyId,
      userId,
    };
  }

  // Track interaction effectiveness (non-blocking)
  trackInteractionEffectiveness(buddyId, interaction).catch((err: unknown) =>
    logger.warn("Failed to track interaction effectiveness:", err)
  );

  // Check if buddy needs adjustment (non-blocking, with fallback)
  let adjustmentNeeded = false;
  try {
    adjustmentNeeded = await checkBuddyAdjustment(buddyId);
  } catch (err) {
    logger.warn("Failed to check buddy adjustment:", err);
  }

  return {
    interaction,
    adjustmentSuggested: adjustmentNeeded,
    responseOptions: generateResponseOptions(interaction),
  };
}

function getDefaultBuddyResponse(interactionType: string): string {
  const responses: Record<string, string> = {
    encouragement: "You're doing great! Keep up the amazing work. Every step forward is progress!",
    challenge: "Here's a challenge for you: Try to complete one more learning module today!",
    quiz: "Let's test your knowledge! What's the main concept you learned in your last session?",
    conversation: "I'm here to help! What would you like to discuss about your learning journey?",
    celebration: "Congratulations on your progress! You should be proud of yourself!",
  };
  return responses[interactionType] || "I'm here to support your learning journey!";
}

async function handleUpdateBuddyPersonality(data: UpdateBuddyPersonalityData, userId: string) {
  const { buddyId, personalityUpdates } = data;

  if (!buddyId) {
    throw new Error("Buddy ID is required");
  }

  // Verify ownership
  const buddy = await db.studyBuddy.findFirst({
    where: {
      buddyId,
      userId,
    },
  });

  if (!buddy) {
    throw new Error("Study buddy not found or access denied");
  }

  // Update personality
  const currentPersonality = JSON.parse(buddy.personality as string) as Record<string, unknown>;
  const updatedPersonality = {
    ...currentPersonality,
    ...personalityUpdates,
  };

  await db.studyBuddy.update({
    where: { buddyId },
    data: {
      personality: JSON.stringify(updatedPersonality),
    },
  });

  // Record adjustment
  await db.buddyAdjustment.create({
    data: {
      buddyId,
      adjustmentType: "personality",
      parameters: JSON.stringify(personalityUpdates),
      reason: data.reason || "User preference",
    },
  });

  return {
    success: true,
    updatedPersonality,
    message: "Buddy personality updated successfully",
  };
}

async function handleGetBuddyEffectiveness(buddyId: string) {
  const buddy = await db.studyBuddy.findUnique({
    where: { buddyId },
  });

  if (!buddy) {
    throw new Error("Study buddy not found");
  }

  // Calculate effectiveness metrics
  const interactions = await db.buddyInteraction.findMany({
    where: { buddyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  }) as BuddyInteractionRecord[];

  const effectiveness = calculateBuddyEffectiveness(interactions);

  // Get user progress correlation
  const progressCorrelation = await calculateProgressCorrelation(
    buddy.userId,
    buddy.createdAt
  );

  // Generate improvement suggestions
  const improvements = generateBuddyImprovements(effectiveness, interactions);

  return {
    effectiveness,
    progressCorrelation,
    improvements,
    interactionStats: {
      total: interactions.length,
      byType: groupInteractionsByType(interactions),
      averageEffectiveness: calculateAverageEffectiveness(interactions),
    },
  };
}

// === QUANTUM PATHS HANDLERS ===
async function handleCreateQuantumPath(userId: string, data: CreateQuantumPathData) {
  const { learningGoal } = data;

  if (!learningGoal) {
    throw new Error("Learning goal is required");
  }

  // Check for existing active paths
  const existingPaths = await db.quantumLearningPath.count({
    where: {
      userId,
      isActive: true,
    },
  });

  if (existingPaths >= 3) {
    return {
      error: "Maximum active quantum paths reached",
      message: "Complete or collapse existing paths before creating new ones",
    };
  }

  const quantumPath = await samInnovationEngine.createQuantumPath(
    userId,
    learningGoal
  ) as QuantumPathResult;

  // Generate initial visualization
  const visualization = generateQuantumVisualization(quantumPath);

  return {
    quantumPath,
    visualization,
    tips: getQuantumPathTips(),
  };
}

async function handleObserveQuantumPath(data: ObserveQuantumPathData, userId: string) {
  const { pathId, observationType, observationData } = data;

  if (!pathId || !observationType) {
    throw new Error("Path ID and observation type are required");
  }

  let observation: ObservationResult;
  try {
    observation = await samInnovationEngine.observeQuantumPath(
      pathId,
      observationType,
      { ...observationData, userId }
    ) as ObservationResult;
  } catch (engineError) {
    // Fallback: Generate a simple observation response if engine fails
    logger.warn("InnovationEngine observeQuantumPath failed, using fallback:", engineError);
    observation = {
      type: observationType,
      timestamp: new Date().toISOString(),
      pathId,
      userId,
      impact: {
        probabilityShifts: new Map(),
        collapsedStates: [],
        decoherence: 0,
      },
      message: getDefaultObservationMessage(observationType),
    };
  }

  // Get updated path state
  const updatedPath = await db.quantumLearningPath.findUnique({
    where: { pathId },
  });

  if (!updatedPath) {
    throw new Error("Quantum path not found");
  }

  const pathState: ParsedPathState = {
    superposition: JSON.parse(updatedPath.superposition as string) as QuantumSuperposition & { possibleStates: QuantumState[] },
    coherenceLevel: (updatedPath.coherenceLevel as number) || 1,
    collapsed: updatedPath.collapsed,
  };

  // Safely calculate probability changes with fallback
  let probabilityChanges: ProbabilityChanges;
  try {
    probabilityChanges = calculateProbabilityChanges(observation);
  } catch {
    probabilityChanges = {
      changes: [],
      collapsedStates: [],
      decoherence: 0,
    };
  }

  return {
    observation,
    pathState,
    probabilityChanges,
    recommendations: generatePathRecommendations(pathState),
  };
}

function getDefaultObservationMessage(observationType: string): string {
  const messages: Record<string, string> = {
    assessment: "Your learning progress has been observed and recorded.",
    milestone: "Milestone observation completed. Your path is evolving.",
    interaction: "Interaction recorded. Path probabilities may shift based on your engagement.",
    feedback: "Feedback received. Your path will adjust accordingly.",
    progress: "Progress observed. Keep going!",
  };
  return messages[observationType] || "Observation recorded successfully.";
}

async function handleGetPathProbabilities(pathId: string) {
  const path = await db.quantumLearningPath.findUnique({
    where: { pathId },
  });

  if (!path) {
    throw new Error("Quantum path not found");
  }

  const probability = JSON.parse(path.probability as string) as QuantumProbability;
  const superposition = JSON.parse(path.superposition as string) as QuantumSuperposition & { possibleStates: QuantumState[] };

  // Calculate detailed probabilities
  const detailedProbabilities = calculateDetailedProbabilities(
    superposition,
    probability
  );

  // Generate outcome predictions
  const predictions = generateOutcomePredictions(detailedProbabilities);

  return {
    currentProbabilities: superposition.currentProbabilities,
    successProbability: probability.successProbability,
    timeEstimates: probability.completionTimeDistribution,
    outcomeDistribution: probability.outcomeDistribution,
    predictions,
    uncertaintyAnalysis: probability.uncertaintyPrinciple
      ? analyzeUncertainty(probability.uncertaintyPrinciple)
      : null,
  };
}

async function handleCollapseQuantumPath(data: CollapseQuantumPathData, userId: string) {
  const { pathId, reason } = data;

  if (!pathId) {
    throw new Error("Path ID is required");
  }

  // Helper to safely parse JSON (handles both string and object)
  const safeJsonParse = (value: unknown, fallback: unknown = {}): Record<string, unknown> => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return fallback as Record<string, unknown>;
      }
    }
    return (value || fallback) as Record<string, unknown>;
  };

  // Helper to generate safe next steps
  const safeGenerateNextSteps = (finalState: CollapseFinalState): string[] => {
    try {
      return generateNextSteps(finalState);
    } catch {
      return [
        "1. Review your collapsed learning path",
        "2. Start with the first module",
        "3. Track your progress along the way",
      ];
    }
  };

  // Default fallback response
  const getDefaultCollapseResponse = () => ({
    finalState: {
      finalState: {
        learningPath: [
          { content: "Begin your learning journey", duration: 30, type: "introduction" },
          { content: "Core concepts and fundamentals", duration: 45, type: "lesson" },
          { content: "Practice and application", duration: 60, type: "practice" },
        ],
        outcomes: [{ type: "success", probability: 0.7 }],
        selectedState: "state-traditional",
      },
      alternativesLost: [] as string[],
    },
    learningPath: [
      { content: "Begin your learning journey", duration: 30, type: "introduction" },
      { content: "Core concepts and fundamentals", duration: 45, type: "lesson" },
      { content: "Practice and application", duration: 60, type: "practice" },
    ],
    expectedOutcome: { type: "success", probability: 0.7 },
    alternativesLost: 0,
    nextSteps: [
      "1. Begin your learning journey (30 minutes)",
      "2. Core concepts and fundamentals (45 minutes)",
      "3. Practice and application (60 minutes)",
    ],
  });

  try {
    // Verify ownership
    const path = await db.quantumLearningPath.findFirst({
      where: {
        pathId,
        userId,
      },
    });

    if (!path) {
      throw new Error("Path not found or access denied");
    }

    if (path.collapsed) {
      // Already collapsed - return existing collapse data
      const existingCollapse = safeJsonParse(path.collapse, null) as CollapseResult | null;
      if (existingCollapse) {
        return {
          finalState: existingCollapse,
          learningPath: existingCollapse.finalState?.learningPath || [],
          expectedOutcome: existingCollapse.finalState?.outcomes?.[0] || { type: "success", probability: 0.7 },
          alternativesLost: existingCollapse.alternativesLost?.length || 0,
          nextSteps: existingCollapse.finalState
            ? safeGenerateNextSteps(existingCollapse.finalState)
            : ["1. Review your collapsed learning path"],
        };
      }
      return getDefaultCollapseResponse();
    }

    // Try to collapse via engine
    let engineSucceeded = false;
    try {
      await samInnovationEngine.observeQuantumPath(
        pathId,
        "assessment",
        {
          userId,
          performance: 1.0, // Force collapse
          reason: reason || "Manual collapse",
        }
      );
      engineSucceeded = true;
    } catch (engineError) {
      logger.warn("InnovationEngine observeQuantumPath failed during collapse, using fallback:", engineError);
    }

    // If engine succeeded, try to get the collapsed path
    if (engineSucceeded) {
      const collapsedPath = await db.quantumLearningPath.findUnique({
        where: { pathId },
      });

      if (collapsedPath?.collapse) {
        const finalState = safeJsonParse(collapsedPath.collapse, null) as CollapseResult | null;
        if (finalState?.finalState) {
          return {
            finalState,
            learningPath: finalState.finalState.learningPath || [],
            expectedOutcome: finalState.finalState.outcomes?.[0] || { type: "success", probability: 0.7 },
            alternativesLost: finalState.alternativesLost?.length || 0,
            nextSteps: safeGenerateNextSteps(finalState.finalState),
          };
        }
      }
    }

    // Fallback: Create collapse data manually
    const superposition = safeJsonParse(path.superposition, { possibleStates: [] }) as { possibleStates?: QuantumState[]; [key: string]: unknown };
    const probability = safeJsonParse(path.probability, { successProbability: 0.7 }) as { successProbability?: number; [key: string]: unknown };

    const possibleStates: QuantumState[] = superposition.possibleStates || [];
    const selectedState: QuantumState = possibleStates[0] || {
      stateId: "state-traditional",
      learningPath: [
        { content: "Begin your learning journey", duration: 30, type: "introduction" },
        { content: "Core concepts and fundamentals", duration: 45, type: "lesson" },
        { content: "Practice and application", duration: 60, type: "practice" },
      ],
      outcomes: [{ type: "success", probability: probability.successProbability || 0.7 }],
    };

    const fallbackCollapse: CollapseResult = {
      timestamp: new Date().toISOString(),
      observation: { type: "assessment", reason: reason || "Manual collapse" },
      finalState: {
        learningPath: selectedState.learningPath || [],
        outcomes: selectedState.outcomes || [{ type: "success", probability: 0.7 }],
        selectedState: selectedState.stateId || "state-traditional",
      },
      alternativesLost: possibleStates.slice(1).map((s: QuantumState) => s.stateId || "unknown"),
    };

    // Update the path in the database
    try {
      await db.quantumLearningPath.update({
        where: { pathId },
        data: {
          collapsed: true,
          collapse: JSON.stringify(fallbackCollapse),
          isActive: false,
        },
      });
    } catch (dbError) {
      logger.warn("Failed to update path in database:", dbError);
      // Continue anyway - return the fallback response
    }

    return {
      finalState: fallbackCollapse,
      learningPath: fallbackCollapse.finalState.learningPath,
      expectedOutcome: fallbackCollapse.finalState.outcomes[0],
      alternativesLost: fallbackCollapse.alternativesLost.length,
      nextSteps: safeGenerateNextSteps(fallbackCollapse.finalState),
    };
  } catch (error) {
    // Ultimate fallback - return a valid response even if everything fails
    logger.error("handleCollapseQuantumPath failed completely:", error);
    return getDefaultCollapseResponse();
  }
}

// === HELPER FUNCTIONS ===
function generateFitnessInsights(fitness: CognitiveFitnessResult): FitnessInsights {
  const insights: FitnessInsights = {
    strengths: fitness.dimensions.filter((d: CognitiveDimension) => d.score > 70),
    weaknesses: fitness.dimensions.filter((d: CognitiveDimension) => d.score < 50),
    trends: fitness.dimensions.map((d: CognitiveDimension) => ({
      dimension: d.name,
      trend: d.trend,
      recommendation: d.trend === "declining" ? "Increase focus" : "Maintain",
    })),
  };

  return insights;
}

async function getExerciseDetails(exerciseId: string): Promise<ExerciseDetails> {
  // In a real implementation, this would fetch from a database
  return {
    id: exerciseId,
    name: "Memory Palace Builder",
    instructions: "Create mental associations between items",
    duration: 15,
    difficulty: 3,
  };
}

async function updateCognitiveDimensions(
  userId: string,
  exerciseId: string,
  performance: ExercisePerformance | undefined
): Promise<void> {
  // Update cognitive dimensions based on exercise performance
  // This would involve complex calculations in a real implementation
}

async function checkFitnessMilestones(userId: string): Promise<unknown[]> {
  // Check if user achieved any milestones
  return [];
}

function calculateImprovement(performance: ExercisePerformance | undefined): number {
  // Calculate improvement percentage
  return performance?.score ? performance.score * 0.1 : 0;
}

function getRecommendedExercises(dimension: string): string[] {
  const exerciseMap: Record<string, string[]> = {
    memory: ["Memory Palace Builder", "Pattern Recognition", "Sequence Recall"],
    attention: ["Focus Flow", "Distraction Resistance", "Sustained Attention"],
    reasoning: ["Logic Puzzles", "Problem Decomposition", "Abstract Thinking"],
    creativity: ["Divergent Thinking", "Connection Making", "Idea Generation"],
    processing_speed: ["Speed Reading", "Quick Math", "Reaction Training"],
  };

  return exerciseMap[dimension] || [];
}

function generateDNAVisualization(dna: LearningDNAResult): DNAVisualization {
  // Generate visualization data for DNA
  return {
    helixData: dna.dnaSequence.segments.map((s: DNASegment) => ({
      position: s.segmentId,
      expression: s.expression,
      color: getSegmentColor(s.type),
    })),
    traitNetwork: dna.traits.map((t: DNATrait) => ({
      id: t.traitId,
      label: t.name,
      size: t.strength,
      connections: t.linkedTraits,
    })),
  };
}

function getSegmentColor(type: string): string {
  const colorMap: Record<string, string> = {
    cognitive: "#3B82F6",
    behavioral: "#10B981",
    environmental: "#F59E0B",
    social: "#8B5CF6",
  };
  return colorMap[type] || "#6B7280";
}

function identifyUniqueStrengths(dna: LearningDNAResult): string[] {
  // Identify unique combination of traits
  const strengths: string[] = [];

  if (dna.dnaSequence.uniqueMarkers.length > 0) {
    strengths.push(...dna.dnaSequence.uniqueMarkers);
  }

  dna.traits
    .filter((t: DNATrait) => t.strength > 0.8)
    .forEach((t: DNATrait) => {
      strengths.push(`Strong ${t.name}`);
    });

  return strengths;
}

function generateShareableCode(dna: LearningDNAResult): string {
  // Generate a shareable code for DNA profile
  return Buffer.from(dna.dnaSequence.cognitiveCode).toString("base64").slice(0, 8);
}

function analyzeTraitInteractions(traits: DNATrait[]): TraitInteraction[] {
  // Analyze how traits interact with each other
  const interactions: TraitInteraction[] = [];

  for (let i = 0; i < traits.length; i++) {
    for (let j = i + 1; j < traits.length; j++) {
      if (traits[i].linkedTraits.includes(traits[j].traitId)) {
        interactions.push({
          trait1: traits[i].name,
          trait2: traits[j].name,
          synergy: calculateSynergy(traits[i], traits[j]),
          effect: "positive",
        });
      }
    }
  }

  return interactions;
}

function calculateSynergy(trait1: DNATrait, trait2: DNATrait): number {
  return (trait1.strength + trait2.strength) / 2 * 1.2;
}

function predictTraitDevelopment(traits: DNATrait[]): TraitPrediction[] {
  return traits.map((trait: DNATrait) => ({
    trait: trait.name,
    currentStrength: trait.strength,
    predictedStrength: Math.min(1, trait.strength + trait.malleability * 0.2),
    developmentTime: Math.ceil((1 - trait.malleability) * 30), // days
    difficulty: trait.malleability < 0.3 ? "hard" : trait.malleability < 0.6 ? "medium" : "easy",
  }));
}

function generateLearningStrategies(dna: ParsedDNAData): LearningStrategy[] {
  const strategies: LearningStrategy[] = [];

  // Based on dominant traits
  dna.traits
    .filter((t: DNATrait) => t.strength > 0.7)
    .forEach((trait: DNATrait) => {
      strategies.push({
        strategy: `Leverage your ${trait.name}`,
        description: `Use ${trait.name} as a foundation for learning`,
        applications: getTraitApplications(trait.name),
      });
    });

  // Based on phenotype
  dna.phenotype.capabilities.forEach((cap: PhenotypeCapability) => {
    strategies.push({
      strategy: `Build on ${cap.name}`,
      description: `Expand your ${cap.name} to new areas`,
      applications: cap.applications,
    });
  });

  return strategies;
}

function getTraitApplications(traitName: string): string[] {
  const applicationMap: Record<string, string[]> = {
    "visual-learning": ["Diagrams", "Mind maps", "Video content"],
    "fast-learner": ["Accelerated courses", "Advanced topics", "Multi-tasking"],
    // ... more mappings
  };

  return applicationMap[traitName] || ["General learning"];
}

/** Database record shape for learningDNA entries */
interface LearningDNARecord {
  createdAt: Date;
  traits: unknown;
  mutations: unknown;
  [key: string]: unknown;
}

function analyzeDNAEvolution(dnaHistory: LearningDNARecord[]): DNAEvolution {
  // Analyze how DNA changed over time
  const evolution: DNAEvolution = {
    stages: dnaHistory.map((dna, index) => ({
      stage: index + 1,
      date: dna.createdAt,
      dominantChanges: index > 0 ? identifyDominantChanges(dnaHistory[index - 1], dna) : [],
    })),
    overallTrend: "evolving",
    stabilityScore: 0.7,
  };

  return evolution;
}

function identifyDominantChanges(previousDNA: LearningDNARecord, currentDNA: LearningDNARecord): string[] {
  // Compare two DNA snapshots to find major changes
  const changes: string[] = [];

  const prevTraits = JSON.parse(previousDNA.traits as string) as DNATrait[];
  const currTraits = JSON.parse(currentDNA.traits as string) as DNATrait[];

  // Find new traits
  currTraits.forEach((trait: DNATrait) => {
    if (!prevTraits.find((p: DNATrait) => p.name === trait.name)) {
      changes.push(`New trait: ${trait.name}`);
    }
  });

  return changes;
}

function identifyMutations(dnaHistory: LearningDNARecord[]): DNAMutation[] {
  if (dnaHistory.length < 2) return [];

  const latestDNA = JSON.parse(dnaHistory[dnaHistory.length - 1].mutations as string) as DNAMutation[];
  return latestDNA;
}

function predictNextEvolution(evolution: DNAEvolution, mutations: DNAMutation[]): NextEvolutionPrediction {
  return {
    predictedChanges: ["Enhanced pattern recognition", "Improved learning speed"],
    timeframe: "3-6 months",
    conditions: ["Consistent practice", "Diverse learning experiences"],
    probability: 0.75,
  };
}

function extractMajorChanges(dna: LearningDNARecord): string[] {
  const mutations = JSON.parse(dna.mutations as string) as DNAMutation[];
  return mutations
    .filter((m: DNAMutation) => m.type === "beneficial")
    .map((m: DNAMutation) => m.effect);
}

function getStudyBuddyTips(personalityType: string): string[] {
  const tipsMap: Record<string, string[]> = {
    motivator: [
      "Your buddy thrives on positive energy",
      "Celebrate small wins together",
      "Set ambitious goals",
    ],
    challenger: [
      "Embrace friendly competition",
      "Push yourself to beat challenges",
      "Track your progress metrics",
    ],
    supporter: [
      "Share your struggles openly",
      "Ask for help when needed",
      "Build trust through consistency",
    ],
    analyst: [
      "Request detailed feedback",
      "Analyze your learning patterns",
      "Use data to improve",
    ],
    creative: [
      "Explore unconventional methods",
      "Think outside the box",
      "Make learning fun and engaging",
    ],
  };

  return tipsMap[personalityType] || ["Get to know your buddy", "Be consistent", "Have fun!"];
}

function generateResponseOptions(interaction: BuddyInteractionResult): string[] {
  // Generate contextual response options
  switch (interaction.type) {
    case "question":
      return ["I understand", "Can you explain more?", "Let me think about it"];
    case "encouragement":
      return ["Thanks! I needed that", "You're right!", "Let's keep going"];
    case "challenge":
      return ["Challenge accepted!", "That's tough but I'll try", "Give me a hint"];
    default:
      return ["Continue", "Change topic", "Take a break"];
  }
}

async function trackInteractionEffectiveness(buddyId: string, interaction: BuddyInteractionResult): Promise<void> {
  // Track how effective the interaction was
  // This would update buddy effectiveness metrics
}

async function checkBuddyAdjustment(buddyId: string): Promise<boolean> {
  // Check if buddy personality needs adjustment based on effectiveness
  const recentInteractions = await db.buddyInteraction.findMany({
    where: { buddyId },
    orderBy: { createdAt: "desc" },
    take: 20,
  }) as BuddyInteractionRecord[];

  const avgEffectiveness = calculateAverageEffectiveness(recentInteractions);
  return avgEffectiveness < 0.6;
}

function calculateBuddyEffectiveness(interactions: BuddyInteractionRecord[]): BuddyEffectivenessMetrics {
  return {
    overall: calculateAverageEffectiveness(interactions),
    byType: {
      conversation: calculateTypeEffectiveness(interactions, "conversation"),
      quiz: calculateTypeEffectiveness(interactions, "quiz"),
      encouragement: calculateTypeEffectiveness(interactions, "encouragement"),
      challenge: calculateTypeEffectiveness(interactions, "challenge"),
      celebration: calculateTypeEffectiveness(interactions, "celebration"),
    },
    trend: calculateEffectivenessTrend(interactions),
  };
}

function calculateAverageEffectiveness(interactions: BuddyInteractionRecord[]): number {
  if (interactions.length === 0) return 0;

  const total = interactions.reduce((sum, i) => sum + (i.effectiveness || 0), 0);
  return total / interactions.length;
}

function calculateTypeEffectiveness(interactions: BuddyInteractionRecord[], type: string): number {
  const typeInteractions = interactions.filter((i) => i.interactionType === type);
  return calculateAverageEffectiveness(typeInteractions);
}

function calculateEffectivenessTrend(interactions: BuddyInteractionRecord[]): string {
  if (interactions.length < 10) return "insufficient_data";

  const recent = interactions.slice(0, 10);
  const older = interactions.slice(10, 20);

  const recentAvg = calculateAverageEffectiveness(recent);
  const olderAvg = calculateAverageEffectiveness(older);

  if (recentAvg > olderAvg + 0.1) return "improving";
  if (recentAvg < olderAvg - 0.1) return "declining";
  return "stable";
}

async function calculateProgressCorrelation(userId: string, buddyCreatedAt: Date): Promise<number> {
  // Calculate correlation between buddy usage and learning progress
  const progressBefore = await db.user_progress.findMany({
    where: {
      userId,
      lastAccessedAt: {
        lt: buddyCreatedAt,
      },
    },
  });

  const progressAfter = await db.user_progress.findMany({
    where: {
      userId,
      lastAccessedAt: {
        gte: buddyCreatedAt,
      },
    },
  });

  const avgBefore = progressBefore.reduce((sum, p) => sum + (p.progressPercent || 0), 0) /
    Math.max(1, progressBefore.length);

  const avgAfter = progressAfter.reduce((sum, p) => sum + (p.progressPercent || 0), 0) /
    Math.max(1, progressAfter.length);

  return (avgAfter - avgBefore) / 100; // Normalized improvement
}

function generateBuddyImprovements(effectiveness: BuddyEffectivenessMetrics, interactions: BuddyInteractionRecord[]): string[] {
  const improvements: string[] = [];

  if (effectiveness.overall < 0.6) {
    improvements.push("Consider adjusting buddy personality to better match your style");
  }

  if (effectiveness.byType.quiz < 0.5) {
    improvements.push("Try different quiz difficulty levels");
  }

  if (effectiveness.trend === "declining") {
    improvements.push("Introduce variety in interactions");
    improvements.push("Take a break and return refreshed");
  }

  return improvements;
}

function groupInteractionsByType(interactions: BuddyInteractionRecord[]): Record<string, number> {
  const groups: Record<string, number> = {};

  interactions.forEach((i) => {
    groups[i.interactionType] = (groups[i.interactionType] || 0) + 1;
  });

  return groups;
}

function generateQuantumVisualization(quantumPath: QuantumPathResult): QuantumVisualization {
  return {
    states: quantumPath.superposition.possibleStates.map((state: QuantumState) => ({
      id: state.stateId,
      label: state.stateId.replace("state-", ""),
      probability: quantumPath.superposition.currentProbabilities instanceof Map
        ? quantumPath.superposition.currentProbabilities.get(state.stateId)
        : (quantumPath.superposition.currentProbabilities as Record<string, number>)[state.stateId],
      energy: state.energy,
      color: getStateColor(state.probability || 0),
    })),
    entanglements: quantumPath.entanglements.map((ent: QuantumEntanglement) => ({
      source: ent.entanglementId,
      targets: ent.entangledPaths,
      strength: ent.correlationStrength,
      type: ent.type,
    })),
    coherence: quantumPath.superposition.coherenceLevel,
  };
}

function getStateColor(probability: number): string {
  if (probability > 0.7) return "#10B981"; // Green
  if (probability > 0.4) return "#F59E0B"; // Yellow
  return "#EF4444"; // Red
}

function getQuantumPathTips(): string[] {
  return [
    "Your learning path exists in multiple states until observed",
    "Each assessment or milestone observation affects path probabilities",
    "Entangled paths can boost each other's success rates",
    "High coherence maintains more learning options",
    "Path collapse locks in your learning trajectory",
  ];
}

function calculateProbabilityChanges(observation: ObservationResult): ProbabilityChanges {
  const changes: Array<{ state: string; change: number; direction: string }> = [];

  observation.impact.probabilityShifts.forEach((shift: number, stateId: string) => {
    changes.push({
      state: stateId,
      change: shift,
      direction: shift > 0 ? "increased" : "decreased",
    });
  });

  return {
    changes,
    collapsedStates: observation.impact.collapsedStates,
    decoherence: observation.impact.decoherence,
  };
}

function generatePathRecommendations(pathState: ParsedPathState): string[] {
  const recommendations: string[] = [];

  if (pathState.coherenceLevel < 0.5) {
    recommendations.push("Consider making a decisive choice to prevent random collapse");
  }

  const currentProbs = pathState.superposition.currentProbabilities;
  const probabilities: number[] = currentProbs instanceof Map
    ? Array.from(currentProbs.values())
    : Object.values(currentProbs as Record<string, number>);
  const maxProb = Math.max(...probabilities);

  if (maxProb > 0.8) {
    recommendations.push("One path is becoming dominant - prepare for potential collapse");
  }

  if (pathState.superposition.possibleStates.length === 1) {
    recommendations.push("Only one path remains - focus on optimizing this trajectory");
  }

  return recommendations;
}

function calculateDetailedProbabilities(
  superposition: QuantumSuperposition & { possibleStates: QuantumState[] },
  probability: QuantumProbability
): DetailedProbability {
  return {
    stateBreakdown: superposition.possibleStates.map((state: QuantumState) => ({
      state: state.stateId,
      currentProbability: superposition.currentProbabilities instanceof Map
        ? (superposition.currentProbabilities.get(state.stateId) || 0)
        : ((superposition.currentProbabilities as Record<string, number>)[state.stateId] || 0),
      successChance: state.outcomes?.[0]?.probability || 0,
      effortRequired: state.energy,
      constraints: state.constraints,
    })),
    overallSuccess: probability.successProbability,
    riskFactors: identifyRiskFactors(superposition),
  };
}

function identifyRiskFactors(superposition: QuantumSuperposition): string[] {
  const risks: string[] = [];

  if ((superposition.coherenceLevel || 0) < 0.3) {
    risks.push("Low coherence - high uncertainty");
  }

  if ((superposition.decoherenceFactors || []).length > 3) {
    risks.push("Multiple decoherence factors present");
  }

  return risks;
}

function generateOutcomePredictions(probabilities: DetailedProbability): OutcomePrediction[] {
  return probabilities.stateBreakdown.map((state) => ({
    scenario: state.state,
    likelihood: state.currentProbability * state.successChance,
    confidence: calculateConfidence(state.currentProbability, state.successChance),
    recommendation: state.currentProbability > 0.5 ? "Primary path" : "Alternative path",
  }));
}

function calculateConfidence(probability: number, successChance: number): string {
  const combined = probability * successChance;
  if (combined > 0.7) return "high";
  if (combined > 0.4) return "medium";
  return "low";
}

function analyzeUncertainty(uncertaintyPrinciple: NonNullable<QuantumProbability['uncertaintyPrinciple']>): UncertaintyAnalysis {
  return {
    interpretation: interpretUncertainty(uncertaintyPrinciple.product),
    positionInsight: `Your current position in the learning path has ${
      uncertaintyPrinciple.positionUncertainty > 0.5 ? "high" : "low"
    } uncertainty`,
    momentumInsight: `Your learning speed has ${
      uncertaintyPrinciple.momentumUncertainty > 0.5 ? "high" : "low"
    } uncertainty`,
    recommendation: uncertaintyPrinciple.product > 0.25
      ? "High uncertainty - maintain flexibility"
      : "Low uncertainty - you can plan ahead",
  };
}

function interpretUncertainty(product: number): string {
  if (product < 0.1) return "Very certain path - limited flexibility";
  if (product < 0.25) return "Balanced certainty and flexibility";
  return "High uncertainty - many possibilities remain open";
}

function generateNextSteps(finalState: CollapseFinalState): string[] {
  const steps: string[] = [];

  finalState.learningPath.forEach((node: LearningPathNode, index: number) => {
    if (index < 3) { // First 3 steps
      steps.push(`${index + 1}. ${node.content} (${node.duration} minutes)`);
    }
  });

  steps.push(`Total path duration: ${
    finalState.learningPath.reduce((sum: number, node: LearningPathNode) => sum + node.duration, 0) / 60
  } hours`);

  return steps;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const feature = searchParams.get("feature");
    const userId = searchParams.get("userId") || session.user.id;

    let result;
    switch (feature) {
      case "cognitive-fitness":
        result = await db.cognitiveFitnessAssessment.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            dimensions: JSON.parse(result.dimensions as string),
            exercises: JSON.parse(result.exercises as string),
            progress: JSON.parse(result.progress as string),
            recommendations: JSON.parse(result.recommendations as string),
          };
        }
        break;

      case "learning-dna":
        result = await db.learningDNA.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            dnaSequence: JSON.parse(result.dnaSequence as string),
            traits: JSON.parse(result.traits as string),
            heritage: JSON.parse(result.heritage as string),
            mutations: JSON.parse(result.mutations as string),
            phenotype: JSON.parse(result.phenotype as string),
          };
        }
        break;

      case "study-buddy":
        result = await db.studyBuddy.findFirst({
          where: {
            userId,
            isActive: true,
          },
        });
        if (result) {
          result = {
            ...result,
            personality: JSON.parse(result.personality as string),
            avatar: JSON.parse(result.avatar as string),
            relationship: JSON.parse(result.relationship as string),
            capabilities: JSON.parse(result.capabilities as string),
          };
        }
        break;

      case "quantum-paths": {
        const paths = await db.quantumLearningPath.findMany({
          where: {
            userId,
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
        });
        result = paths.map((path) => ({
          ...path,
          superposition: JSON.parse(path.superposition as string),
          entanglements: JSON.parse(path.entanglements as string),
          probability: JSON.parse(path.probability as string),
        }));
        break;
      }

      default: {
        // Overview of all innovation features
        const [fitness, dna, buddy, quantumPaths] = await Promise.all([
          db.cognitiveFitnessAssessment.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
          }),
          db.learningDNA.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
          }),
          db.studyBuddy.findFirst({
            where: { userId, isActive: true },
          }),
          db.quantumLearningPath.count({
            where: { userId, isActive: true },
          }),
        ]);

        result = {
          hasCognitiveFitness: !!fitness,
          hasLearningDNA: !!dna,
          hasStudyBuddy: !!buddy,
          activeQuantumPaths: quantumPaths,
          lastUpdated: {
            fitness: fitness?.createdAt,
            dna: dna?.createdAt,
            buddy: buddy?.createdAt,
          },
        };
        break;
      }
    }

    return NextResponse.json({
      success: true,
      feature,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching innovation features:", error);
    return NextResponse.json(
      { error: "Failed to fetch innovation features" },
      { status: 500 }
    );
  }
}

/**
 * Exam Creation Orchestrator
 *
 * 5-stage pipeline for generating Bloom&apos;s Taxonomy-aligned exams:
 *   Stage 1: Topic Decomposition (5-15 concepts)
 *   Stage 2: Bloom&apos;s Distribution Planning (questions per level per concept)
 *   Stage 3: Question Generation (per question with quality retry)
 *   Stage 4: Exam Assembly & Balancing (7 validation checks)
 *   Stage 5: Rubric & Cognitive Profile (diagnostic mapping)
 *
 * Follows the same agentic pattern as the course creation orchestrator:
 *   - SAM Goal/Plan lifecycle
 *   - SSE streaming events
 *   - Quality scoring with retry
 *   - Fire-and-forget memory persistence
 *   - AbortSignal support
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import type { BloomsLevel, QuestionDifficulty } from '@prisma/client';
import type {
  ExamOrchestrationConfig,
  ExamOrchestrationResult,
  DecomposedConcept,
  PlannedQuestion,
  GeneratedQuestion,
  ExamQualityScore,
  AssemblyValidation,
  CognitiveProfileTemplate,
} from './agentic-types';
import { QUALITY_RETRY_THRESHOLD, MAX_QUALITY_RETRIES } from './agentic-types';
import {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
  buildStage4Prompt,
  buildStage5Prompt,
} from './prompts';
import {
  parseConceptDecomposition,
  parseBloomsDistribution,
  parseGeneratedQuestion,
  parseAssemblyValidation,
  parseCognitiveProfile,
  buildFallbackConcepts,
  buildFallbackDistribution,
  buildFallbackQuestion,
  scoreQuestion,
  BLOOM_DISTRIBUTION_PROFILES,
  BLOOMS_LEVEL_CONFIG,
} from './helpers';
import {
  initializeExamCreationGoal,
  advanceExamStage,
  completeExamStep,
  completeExamCreation,
  failExamCreation,
} from './exam-creation-controller';
import {
  persistExamConceptsBackground,
  persistExamQualityBackground,
} from './exam-memory-persistence';

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export async function orchestrateExamCreation(
  options: ExamOrchestrationConfig
): Promise<ExamOrchestrationResult> {
  const { params, userId, onSSEEvent, abortSignal } = options;
  const startTime = Date.now();

  let goalId = '';
  let planId = '';
  let stepIds: string[] = [];
  let examId = '';

  try {
    // ----- Check abort before starting -----
    if (abortSignal?.aborted) {
      return { success: false, error: 'Exam creation was cancelled' };
    }

    // ----- Create Exam record in DB -----
    const examTitle = `${params.topic} - ${params.examPurpose} Exam`;
    const exam = await createExamRecord(userId, params, examTitle);
    examId = exam.id;

    // ----- Initialize SAM Goal/Plan -----
    const goalPlan = await initializeExamCreationGoal(
      userId,
      examTitle,
      examId
    );
    goalId = goalPlan.goalId;
    planId = goalPlan.planId;
    stepIds = goalPlan.stepIds;

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 5, message: 'Exam creation initialized', stage: 0 },
    });

    // =====================================================================
    // STAGE 1: TOPIC DECOMPOSITION
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceExamStage(planId, stepIds, 1);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 1, stageName: 'Topic Decomposition', message: 'Analyzing topic and identifying key concepts...' },
    });

    const concepts = await runStage1(params, userId, onSSEEvent);

    onSSEEvent?.({
      type: 'concept_map',
      data: {
        concepts: concepts.map((c) => ({
          name: c.name,
          prerequisites: c.prerequisites,
          misconceptions: c.commonMisconceptions,
          importance: c.importance,
        })),
      },
    });

    await completeExamStep(planId, stepIds, 1, [
      `${concepts.length} concepts identified`,
    ]);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 1, message: `${concepts.length} concepts identified`, itemCount: concepts.length },
    });

    // Fire-and-forget memory persistence
    persistExamConceptsBackground(userId, examId, concepts, 1);

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 15, message: 'Concepts analyzed', stage: 1 },
    });

    // =====================================================================
    // STAGE 2: BLOOM'S DISTRIBUTION PLANNING
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceExamStage(planId, stepIds, 2);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 2, stageName: 'Bloom&apos;s Distribution Planning', message: 'Planning question distribution across cognitive levels...' },
    });

    const questionPlan = await runStage2(params, concepts, userId, onSSEEvent);

    // Emit bloom distribution event
    const bloomsCounts: Record<string, number> = {};
    for (const q of questionPlan) {
      bloomsCounts[q.bloomsLevel] = (bloomsCounts[q.bloomsLevel] ?? 0) + 1;
    }

    onSSEEvent?.({
      type: 'bloom_distribution',
      data: { planned: bloomsCounts, purpose: params.examPurpose },
    });

    await completeExamStep(planId, stepIds, 2, [
      `${questionPlan.length} questions planned`,
    ]);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 2, message: `${questionPlan.length} questions planned`, itemCount: questionPlan.length },
    });

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 25, message: 'Distribution planned', stage: 2 },
    });

    // =====================================================================
    // STAGE 3: QUESTION GENERATION
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceExamStage(planId, stepIds, 3);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 3, stageName: 'Question Generation', message: `Generating ${questionPlan.length} questions with quality scoring...` },
    });

    const { questions, qualityScores } = await runStage3(
      params,
      questionPlan,
      concepts,
      userId,
      examId,
      onSSEEvent,
      abortSignal
    );

    await completeExamStep(planId, stepIds, 3, [
      `${questions.length} questions generated`,
    ]);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 3, message: `${questions.length} questions generated`, itemCount: questions.length },
    });

    // Fire-and-forget quality persistence
    persistExamQualityBackground(userId, examId, qualityScores, 3);

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 70, message: 'Questions generated', stage: 3 },
    });

    // =====================================================================
    // STAGE 4: EXAM ASSEMBLY & BALANCING
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceExamStage(planId, stepIds, 4);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 4, stageName: 'Exam Assembly & Balancing', message: 'Validating exam balance and coverage...' },
    });

    const validation = await runStage4(params, questions, concepts, userId, onSSEEvent);

    onSSEEvent?.({
      type: 'validation_result',
      data: {
        checks: Object.entries(validation).map(([name, check]) => ({
          name,
          passed: check.passed,
          message: check.message,
        })),
        overallPass: Object.values(validation).every((c) => c.passed),
      },
    });

    await completeExamStep(planId, stepIds, 4, ['Validation complete']);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 4, message: 'Exam validated' },
    });

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 85, message: 'Exam validated', stage: 4 },
    });

    // =====================================================================
    // STAGE 5: RUBRIC & COGNITIVE PROFILE
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceExamStage(planId, stepIds, 5);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 5, stageName: 'Rubric & Cognitive Profile', message: 'Generating rubric and cognitive profile template...' },
    });

    const cognitiveProfile = await runStage5(
      params,
      questions,
      concepts,
      userId,
      examId,
      onSSEEvent
    );

    await completeExamStep(planId, stepIds, 5, ['Rubric generated']);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 5, message: 'Rubric and cognitive profile generated' },
    });

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 95, message: 'Finalizing exam', stage: 5 },
    });

    // =====================================================================
    // COMPLETION
    // =====================================================================
    const totalPoints = questions.reduce((s, q) => s + q.points, 0);
    const estimatedDuration = Math.round(
      questions.reduce((s, q) => s + q.estimatedTimeSeconds, 0) / 60
    );
    const avgQuality =
      qualityScores.length > 0
        ? Math.round(
            qualityScores.reduce((s, q) => s + q.overall, 0) /
              qualityScores.length
          )
        : 0;

    const bloomsProfile: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    for (const q of questions) {
      bloomsProfile[q.bloomsLevel]++;
    }

    const bloomsLevelsCovered = Object.values(bloomsProfile).filter(
      (v) => v > 0
    ).length;
    const conceptsCovered = new Set(questions.map((q) => q.concept)).size;

    const stats = {
      totalQuestions: questions.length,
      totalPoints,
      estimatedDuration,
      averageQualityScore: avgQuality,
      conceptsCovered,
      bloomsLevelsCovered,
    };

    await completeExamCreation(goalId, planId, {
      totalQuestions: stats.totalQuestions,
      totalPoints: stats.totalPoints,
      estimatedDuration: stats.estimatedDuration,
      averageQualityScore: stats.averageQualityScore,
    });

    const totalTime = Date.now() - startTime;
    logger.info('[ExamOrchestrator] Exam creation completed', {
      examId,
      ...stats,
      totalTimeMs: totalTime,
    });

    return {
      success: true,
      examId,
      questionCount: questions.length,
      bloomsProfile,
      cognitiveProfileTemplate: cognitiveProfile,
      stats,
      goalId,
      planId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[ExamOrchestrator] Exam creation failed', {
      error: msg,
      examId,
      goalId,
    });

    await failExamCreation(goalId, planId, msg);

    return {
      success: false,
      error: msg,
      examId: examId || undefined,
      goalId: goalId || undefined,
      planId: planId || undefined,
    };
  }
}

// =============================================================================
// STAGE IMPLEMENTATIONS
// =============================================================================

async function runStage1(
  params: ExamOrchestrationConfig['params'],
  userId: string,
  onSSEEvent?: ExamOrchestrationConfig['onSSEEvent']
): Promise<DecomposedConcept[]> {
  onSSEEvent?.({
    type: 'thinking',
    data: { stage: 1, message: 'Breaking topic into key concepts with prerequisites and misconceptions...' },
  });

  const prompt = buildStage1Prompt(params);

  const response = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    systemPrompt: prompt.systemPrompt,
    messages: [{ role: 'user', content: prompt.userPrompt }],
    maxTokens: prompt.maxTokens,
    temperature: prompt.temperature,
  });

  let concepts = parseConceptDecomposition(response);

  // Fallback if parsing fails
  if (concepts.length === 0) {
    logger.warn('[ExamOrchestrator] Stage 1 parse failed, using fallback');
    const subtopics =
      params.subtopics === 'auto' ? [params.topic] : params.subtopics;
    concepts = buildFallbackConcepts(params.topic, subtopics);
  }

  return concepts;
}

async function runStage2(
  params: ExamOrchestrationConfig['params'],
  concepts: DecomposedConcept[],
  userId: string,
  onSSEEvent?: ExamOrchestrationConfig['onSSEEvent']
): Promise<PlannedQuestion[]> {
  onSSEEvent?.({
    type: 'thinking',
    data: { stage: 2, message: 'Calculating question distribution across Bloom&apos;s levels and concepts...' },
  });

  const prompt = buildStage2Prompt(params, concepts);

  const response = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    systemPrompt: prompt.systemPrompt,
    messages: [{ role: 'user', content: prompt.userPrompt }],
    maxTokens: prompt.maxTokens,
    temperature: prompt.temperature,
  });

  let plan = parseBloomsDistribution(response, params);

  // Fallback if parsing fails or count mismatch
  if (plan.length === 0 || plan.length < params.questionCount) {
    logger.warn('[ExamOrchestrator] Stage 2 parse failed or incomplete, using fallback');
    plan = buildFallbackDistribution(params, concepts);
  }

  // Trim to exact count
  return plan.slice(0, params.questionCount);
}

async function runStage3(
  params: ExamOrchestrationConfig['params'],
  questionPlan: PlannedQuestion[],
  concepts: DecomposedConcept[],
  userId: string,
  examId: string,
  onSSEEvent?: ExamOrchestrationConfig['onSSEEvent'],
  abortSignal?: AbortSignal
): Promise<{ questions: GeneratedQuestion[]; qualityScores: ExamQualityScore[] }> {
  const questions: GeneratedQuestion[] = [];
  const qualityScores: ExamQualityScore[] = [];
  const totalQuestions = questionPlan.length;

  for (let i = 0; i < totalQuestions; i++) {
    if (abortSignal?.aborted) throw new Error('Cancelled');

    const plan = questionPlan[i];
    const concept = concepts.find((c) => c.name === plan.concept) ?? concepts[0];

    onSSEEvent?.({
      type: 'item_generating',
      data: {
        stage: 3,
        concept: plan.concept,
        bloomsLevel: plan.bloomsLevel,
        questionNumber: i + 1,
        message: `Generating question ${i + 1}/${totalQuestions}: ${plan.bloomsLevel} on ${plan.concept}`,
      },
    });

    let bestQuestion: GeneratedQuestion | null = null;
    let bestScore: ExamQualityScore = {
      bloomsAlignment: 0,
      clarity: 0,
      distractorQuality: 0,
      diagnosticValue: 0,
      cognitiveRigor: 0,
      overall: 0,
    };

    // Generate with retry (up to 3 attempts, keep best)
    const maxAttempts = MAX_QUALITY_RETRIES + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const prompt = buildStage3Prompt(
          params,
          plan,
          concept,
          questions,
          i,
          totalQuestions
        );

        const response = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          systemPrompt: prompt.systemPrompt,
          messages: [{ role: 'user', content: prompt.userPrompt }],
          maxTokens: prompt.maxTokens,
          temperature: prompt.temperature + attempt * 0.1, // Increase creativity on retry
        });

        const parsed = parseGeneratedQuestion(response, plan);
        if (!parsed) {
          logger.warn('[ExamOrchestrator] Question parse failed', {
            attempt,
            questionIndex: i,
          });
          continue;
        }

        const score = scoreQuestion(parsed, plan);

        if (score.overall > bestScore.overall) {
          bestQuestion = parsed;
          bestScore = score;
        }

        // Good enough — no need to retry
        if (score.overall >= QUALITY_RETRY_THRESHOLD) break;

        logger.info('[ExamOrchestrator] Quality below threshold, retrying', {
          attempt,
          score: score.overall,
          threshold: QUALITY_RETRY_THRESHOLD,
          questionIndex: i,
        });
      } catch (error) {
        logger.warn('[ExamOrchestrator] Question generation attempt failed', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Use fallback if all attempts failed
    if (!bestQuestion) {
      bestQuestion = buildFallbackQuestion(plan);
      bestScore = scoreQuestion(bestQuestion, plan);
    }

    questions.push(bestQuestion);
    qualityScores.push(bestScore);

    // Save to DB immediately
    await saveQuestionToDb(examId, bestQuestion, i);

    onSSEEvent?.({
      type: 'item_complete',
      data: {
        stage: 3,
        concept: plan.concept,
        bloomsLevel: plan.bloomsLevel,
        questionId: bestQuestion.id,
        qualityScore: bestScore.overall,
      },
    });

    // Progress update
    const stageProgress = 25 + Math.round((i / totalQuestions) * 45);
    onSSEEvent?.({
      type: 'progress',
      data: {
        percentage: stageProgress,
        message: `Generated question ${i + 1}/${totalQuestions}`,
        stage: 3,
      },
    });
  }

  return { questions, qualityScores };
}

async function runStage4(
  params: ExamOrchestrationConfig['params'],
  questions: GeneratedQuestion[],
  concepts: DecomposedConcept[],
  userId: string,
  onSSEEvent?: ExamOrchestrationConfig['onSSEEvent']
): Promise<AssemblyValidation> {
  onSSEEvent?.({
    type: 'thinking',
    data: { stage: 4, message: 'Running 7 balance validation checks...' },
  });

  const prompt = buildStage4Prompt(params, questions, concepts);

  const response = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    systemPrompt: prompt.systemPrompt,
    messages: [{ role: 'user', content: prompt.userPrompt }],
    maxTokens: prompt.maxTokens,
    temperature: prompt.temperature,
  });

  return parseAssemblyValidation(response);
}

async function runStage5(
  params: ExamOrchestrationConfig['params'],
  questions: GeneratedQuestion[],
  concepts: DecomposedConcept[],
  userId: string,
  examId: string,
  onSSEEvent?: ExamOrchestrationConfig['onSSEEvent']
): Promise<CognitiveProfileTemplate> {
  onSSEEvent?.({
    type: 'thinking',
    data: { stage: 5, message: 'Generating cognitive profile template and remediation map...' },
  });

  const prompt = buildStage5Prompt(params, questions, concepts);

  const response = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    systemPrompt: prompt.systemPrompt,
    messages: [{ role: 'user', content: prompt.userPrompt }],
    maxTokens: prompt.maxTokens,
    temperature: prompt.temperature,
  });

  const profile = parseCognitiveProfile(response);

  // Populate actual question IDs into the profile
  for (const q of questions) {
    const levelEntry = profile.bloomsLevelScoring[q.bloomsLevel];
    if (levelEntry) {
      levelEntry.questionIds.push(q.id);
      levelEntry.maxPoints += q.points;
    }
  }

  // Save ExamBloomsProfile to DB
  await saveExamBloomsProfile(examId, params, questions, profile);

  return profile;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function createExamRecord(
  userId: string,
  params: ExamOrchestrationConfig['params'],
  examTitle: string
): Promise<{ id: string }> {
  // If sectionId is provided, use it. Otherwise create a standalone section.
  let sectionId = params.sectionId;

  if (!sectionId) {
    // Find or create a "Standalone Exams" section for the user
    const standaloneSection = await getOrCreateStandaloneSection(userId, params.topic);
    sectionId = standaloneSection.id;
  }

  const exam = await db.exam.create({
    data: {
      title: examTitle,
      description: `${params.examPurpose} exam covering ${params.topic} at ${params.studentLevel} level`,
      sectionId,
      timeLimit: params.timeLimit,
      passingScore: 70,
      shuffleQuestions: false,
      isPublished: false,
      isActive: true,
    },
  });

  return exam;
}

async function getOrCreateStandaloneSection(
  userId: string,
  topic: string
): Promise<{ id: string }> {
  // Look for an existing "AI Exams" course for this user
  let course = await db.course.findFirst({
    where: {
      userId,
      title: 'AI-Generated Exams',
    },
    include: {
      Chapter: {
        include: {
          Section: true,
        },
        take: 1,
      },
    },
  });

  if (!course) {
    course = await db.course.create({
      data: {
        title: 'AI-Generated Exams',
        description: 'Auto-generated exams from the Bloom&apos;s Exam Builder',
        userId,
        categoryId: null,
        Chapter: {
          create: {
            title: 'Exam Collection',
            position: 0,
            Section: {
              create: {
                title: topic,
                position: 0,
              },
            },
          },
        },
      },
      include: {
        Chapter: {
          include: { Section: true },
          take: 1,
        },
      },
    });
  }

  const chapter = course.Chapter[0];
  if (!chapter) {
    throw new Error('Failed to create exam course structure');
  }

  // Create a new section for this exam topic
  const section = await db.section.create({
    data: {
      title: topic,
      chapterId: chapter.id,
      position: (chapter.Section?.length ?? 0),
    },
  });

  return section;
}

async function saveQuestionToDb(
  examId: string,
  question: GeneratedQuestion,
  order: number
): Promise<void> {
  try {
    // Map question format to Prisma QuestionType
    const questionTypeMap: Record<string, string> = {
      mcq: 'MULTIPLE_CHOICE',
      short_answer: 'SHORT_ANSWER',
      long_answer: 'ESSAY',
      design_problem: 'ESSAY',
      code_challenge: 'SHORT_ANSWER',
    };

    // Map difficulty 1-5 to Prisma QuestionDifficulty
    const difficultyMap: Record<number, QuestionDifficulty> = {
      1: 'EASY',
      2: 'EASY',
      3: 'MEDIUM',
      4: 'HARD',
      5: 'HARD',
    };

    // Save ExamQuestion
    await db.examQuestion.create({
      data: {
        id: question.id,
        examId,
        question: question.stem,
        options: question.options
          ? question.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            }))
          : null,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: question.points,
        order,
        questionType: (questionTypeMap[question.questionType] ?? 'MULTIPLE_CHOICE') as never,
        bloomsLevel: question.bloomsLevel as never,
        difficulty: difficultyMap[question.difficulty] as never,
        updatedAt: new Date(),
      },
    });

    // Save EnhancedQuestion with rich metadata
    await db.enhancedQuestion.create({
      data: {
        examId,
        question: question.stem,
        questionType: (questionTypeMap[question.questionType] ?? 'MULTIPLE_CHOICE') as never,
        points: question.points,
        order,
        options: question.options
          ? question.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              diagnosticNote: o.diagnosticNote,
            }))
          : null,
        correctAnswer: question.correctAnswer,
        bloomsLevel: question.bloomsLevel as never,
        cognitiveSkills: question.cognitiveSkills,
        hint: question.hint ?? null,
        explanation: question.explanation,
        commonMisconceptions: question.options
          ? question.options
              .filter((o) => !o.isCorrect && o.diagnosticNote)
              .map((o) => o.diagnosticNote)
          : null,
        difficulty: difficultyMap[question.difficulty] as never,
        estimatedTime: question.estimatedTimeSeconds,
        prerequisites: question.relatedConcepts,
        relatedConcepts: question.relatedConcepts,
        generationMode: 'AI_GUIDED' as never,
      },
    });
  } catch (error) {
    logger.error('[ExamOrchestrator] Failed to save question to DB', {
      error: error instanceof Error ? error.message : String(error),
      questionId: question.id,
      examId,
    });
  }
}

async function saveExamBloomsProfile(
  examId: string,
  params: ExamOrchestrationConfig['params'],
  questions: GeneratedQuestion[],
  profile: CognitiveProfileTemplate
): Promise<void> {
  try {
    // Calculate actual distribution
    const actualDistribution: Record<string, number> = {};
    const targetDistribution =
      params.bloomsDistribution !== 'auto'
        ? params.bloomsDistribution
        : BLOOM_DISTRIBUTION_PROFILES[params.examPurpose];

    for (const q of questions) {
      actualDistribution[q.bloomsLevel] =
        (actualDistribution[q.bloomsLevel] ?? 0) + 1;
    }

    // Build difficulty matrix
    const difficultyMatrix: Record<string, Record<number, number>> = {};
    for (const q of questions) {
      if (!difficultyMatrix[q.bloomsLevel]) {
        difficultyMatrix[q.bloomsLevel] = {};
      }
      difficultyMatrix[q.bloomsLevel][q.difficulty] =
        (difficultyMatrix[q.bloomsLevel][q.difficulty] ?? 0) + 1;
    }

    // Skills assessed
    const allSkills = new Set<string>();
    for (const q of questions) {
      for (const skill of q.cognitiveSkills) {
        allSkills.add(skill);
      }
    }

    // Coverage map
    const coverageMap: Record<string, string[]> = {};
    for (const q of questions) {
      if (!coverageMap[q.concept]) {
        coverageMap[q.concept] = [];
      }
      coverageMap[q.concept].push(q.bloomsLevel);
    }

    await db.examBloomsProfile.create({
      data: {
        examId,
        targetDistribution,
        actualDistribution,
        difficultyMatrix,
        skillsAssessed: Array.from(allSkills),
        coverageMap,
      },
    });
  } catch (error) {
    logger.error('[ExamOrchestrator] Failed to save ExamBloomsProfile', {
      error: error instanceof Error ? error.message : String(error),
      examId,
    });
  }
}

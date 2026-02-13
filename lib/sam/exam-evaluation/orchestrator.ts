/**
 * Exam Evaluation Orchestrator
 *
 * 5-stage pipeline for DIAGNOSE framework evaluation:
 *   Stage 1: Load & Prepare (fetch attempt, questions, answers, exam metadata)
 *   Stage 2: Per-Answer DIAGNOSE Evaluation (7 layers per answer)
 *   Stage 3: Echo-Back Teaching (top 3 most impactful answers)
 *   Stage 4: Cognitive Profile Generation (aggregate all diagnoses)
 *   Stage 5: Improvement Roadmap (priority-ordered interventions)
 *
 * Follows the same agentic pattern as the exam creation orchestrator:
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
import type { BloomsLevel } from '@prisma/client';
import type {
  EvalOrchestrationConfig,
  EvalOrchestrationResult,
  AnswerDiagnosis,
  EchoBack,
  CognitiveProfile,
  ImprovementRoadmap,
  MisconceptionEntry,
} from './agentic-types';
import { QUALITY_RETRY_THRESHOLD, MAX_QUALITY_RETRIES, BLOOMS_LEVELS } from './agentic-types';
import {
  buildStage2Prompt,
  buildStage3Prompt,
  buildStage4Prompt,
  buildStage5Prompt,
} from './prompts';
import {
  parseDiagnosis,
  parseEchoBack,
  parseCognitiveProfile,
  parseImprovementRoadmap,
  buildFallbackDiagnosis,
  buildFallbackEchoBack,
  buildFallbackCognitiveProfile,
  buildFallbackRoadmap,
  calculateCompositeScore,
  scoreDiagnosisQuality,
  selectEchoBackTargets,
} from './helpers';
import {
  initializeEvaluationGoal,
  advanceEvaluationStage,
  completeEvaluationStep,
  completeEvaluation,
  failEvaluation,
} from './evaluation-controller';
import {
  persistDiagnosticInsightsBackground,
  persistMisconceptionsBackground,
} from './evaluation-memory-persistence';

// =============================================================================
// DATA TYPES FOR DATABASE RESULTS
// =============================================================================

interface LoadedQuestion {
  id: string;
  stem: string;
  correctAnswer: string;
  bloomsLevel: BloomsLevel;
  questionType: string;
  points: number;
  explanation: string | null;
  options: Array<{ text: string; isCorrect: boolean; diagnosticNote?: string }> | null;
  concept?: string;
}

interface LoadedAnswer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  timeSpent: number | null;
}

interface LoadedAttempt {
  id: string;
  examId: string;
  userId: string;
  status: string;
  totalQuestions: number;
  examTitle: string;
  examTopic?: string;
  questions: LoadedQuestion[];
  answers: LoadedAnswer[];
}

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export async function orchestrateExamEvaluation(
  options: EvalOrchestrationConfig
): Promise<EvalOrchestrationResult> {
  const { params, userId, onSSEEvent, abortSignal } = options;
  const startTime = Date.now();

  let goalId = '';
  let planId = '';
  let stepIds: string[] = [];

  try {
    // ----- Check abort before starting -----
    if (abortSignal?.aborted) {
      return { success: false, error: 'Evaluation was cancelled' };
    }

    // =====================================================================
    // STAGE 1: LOAD & PREPARE
    // =====================================================================
    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 1, stageName: 'Load & Prepare', message: 'Loading exam attempt and preparing evaluation context...' },
    });

    onSSEEvent?.({
      type: 'thinking',
      data: { stage: 1, message: 'Fetching attempt data, questions, and answers from database...' },
    });

    const attempt = await loadAttemptData(params.attemptId, userId);
    if (!attempt) {
      return { success: false, error: 'Exam attempt not found or does not belong to this user' };
    }

    if (attempt.answers.length === 0) {
      return { success: false, error: 'No answers found for this attempt' };
    }

    // Initialize SAM Goal/Plan
    const goalPlan = await initializeEvaluationGoal(userId, attempt.examTitle, params.attemptId);
    goalId = goalPlan.goalId;
    planId = goalPlan.planId;
    stepIds = goalPlan.stepIds;

    await advanceEvaluationStage(planId, stepIds, 1);
    await completeEvaluationStep(planId, stepIds, 1, [
      `${attempt.answers.length} answers loaded`,
    ]);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 1, message: `${attempt.answers.length} answers loaded from "${attempt.examTitle}"`, itemCount: attempt.answers.length },
    });

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 10, message: 'Attempt loaded', stage: 1 },
    });

    // =====================================================================
    // STAGE 2: PER-ANSWER DIAGNOSE EVALUATION (THE CORE)
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceEvaluationStage(planId, stepIds, 2);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 2, stageName: 'DIAGNOSE Evaluation', message: `Evaluating ${attempt.answers.length} answers through 7-layer diagnostic framework...` },
    });

    const diagnoses = await runStage2(
      attempt,
      params.evaluationMode,
      userId,
      onSSEEvent,
      abortSignal
    );

    await completeEvaluationStep(planId, stepIds, 2, [
      `${diagnoses.length} answers diagnosed`,
    ]);

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 2, message: `${diagnoses.length} answers diagnosed`, itemCount: diagnoses.length },
    });

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 55, message: 'DIAGNOSE evaluation complete', stage: 2 },
    });

    // =====================================================================
    // STAGE 3: ECHO-BACK TEACHING
    // =====================================================================
    let echoBackCount = 0;

    if (params.evaluationMode !== 'quick_grade' && params.enableEchoBack) {
      if (abortSignal?.aborted) throw new Error('Cancelled');
      await advanceEvaluationStage(planId, stepIds, 3);

      onSSEEvent?.({
        type: 'stage_start',
        data: { stage: 3, stageName: 'Echo-Back Teaching', message: 'Generating echo-back teaching for most impactful answers...' },
      });

      const echoBackResults = await runStage3(
        attempt,
        diagnoses,
        userId,
        onSSEEvent
      );
      echoBackCount = echoBackResults.length;

      await completeEvaluationStep(planId, stepIds, 3, [
        `${echoBackCount} echo-back teachings generated`,
      ]);

      onSSEEvent?.({
        type: 'stage_complete',
        data: { stage: 3, message: `${echoBackCount} echo-back teachings generated`, itemCount: echoBackCount },
      });
    } else {
      await advanceEvaluationStage(planId, stepIds, 3);
      await completeEvaluationStep(planId, stepIds, 3, ['Skipped (quick_grade mode or disabled)']);

      onSSEEvent?.({
        type: 'stage_complete',
        data: { stage: 3, message: 'Echo-back skipped' },
      });
    }

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 70, message: 'Echo-back teaching complete', stage: 3 },
    });

    // =====================================================================
    // STAGE 4: COGNITIVE PROFILE GENERATION
    // =====================================================================
    if (abortSignal?.aborted) throw new Error('Cancelled');
    await advanceEvaluationStage(planId, stepIds, 4);

    onSSEEvent?.({
      type: 'stage_start',
      data: { stage: 4, stageName: 'Cognitive Profile', message: 'Generating cognitive profile from all diagnoses...' },
    });

    const cognitiveProfile = await runStage4(
      diagnoses,
      attempt,
      userId,
      onSSEEvent
    );

    await completeEvaluationStep(planId, stepIds, 4, ['Cognitive profile generated']);

    onSSEEvent?.({
      type: 'cognitive_profile',
      data: {
        stage: 4,
        bloomsMap: cognitiveProfile.bloomsCognitiveMap,
        ceiling: cognitiveProfile.cognitiveCeiling,
        growthEdge: cognitiveProfile.growthEdge,
        reasoningDistribution: cognitiveProfile.reasoningPathDistribution,
      },
    });

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 4, message: 'Cognitive profile generated' },
    });

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 85, message: 'Cognitive profile generated', stage: 4 },
    });

    // =====================================================================
    // STAGE 5: IMPROVEMENT ROADMAP
    // =====================================================================
    let improvementRoadmap: ImprovementRoadmap;

    if (params.evaluationMode !== 'quick_grade') {
      if (abortSignal?.aborted) throw new Error('Cancelled');
      await advanceEvaluationStage(planId, stepIds, 5);

      onSSEEvent?.({
        type: 'stage_start',
        data: { stage: 5, stageName: 'Improvement Roadmap', message: 'Generating improvement roadmap with ARROW phase prescriptions...' },
      });

      improvementRoadmap = await runStage5(
        cognitiveProfile,
        diagnoses,
        attempt,
        userId,
        onSSEEvent
      );

      onSSEEvent?.({
        type: 'improvement_roadmap',
        data: {
          stage: 5,
          priorities: improvementRoadmap.priorities,
          verificationQuestions: improvementRoadmap.verificationQuestions,
          estimatedTimeToNextLevel: improvementRoadmap.estimatedTimeToNextLevel,
        },
      });

      await completeEvaluationStep(planId, stepIds, 5, ['Improvement roadmap generated']);

      onSSEEvent?.({
        type: 'stage_complete',
        data: { stage: 5, message: 'Improvement roadmap generated' },
      });
    } else {
      improvementRoadmap = buildFallbackRoadmap(cognitiveProfile);
      await advanceEvaluationStage(planId, stepIds, 5);
      await completeEvaluationStep(planId, stepIds, 5, ['Skipped (quick_grade mode)']);

      onSSEEvent?.({
        type: 'stage_complete',
        data: { stage: 5, message: 'Roadmap skipped (quick_grade)' },
      });
    }

    onSSEEvent?.({
      type: 'progress',
      data: { percentage: 95, message: 'Finalizing evaluation', stage: 5 },
    });

    // =====================================================================
    // POST-PIPELINE: Update DB, persist memory, bridge features
    // =====================================================================

    // Update UserExamAttempt status to GRADED
    const avgComposite =
      diagnoses.reduce((s, d) => s + d.scores.composite, 0) / diagnoses.length;
    const avgGap =
      diagnoses.reduce((s, d) => s + Math.abs(d.bloomsGap), 0) / diagnoses.length;
    const allMisconceptions = diagnoses.flatMap((d) => d.misconceptions);
    const fragileCount = diagnoses.filter((d) => d.reasoningPath === 'fragile').length;

    await updateAttemptStatus(
      params.attemptId,
      avgComposite,
      diagnoses.length
    );

    // Update CognitiveSkillProgress per Bloom's level
    await updateCognitiveSkillProgress(userId, attempt.examId, cognitiveProfile);

    const stats = {
      totalAnswers: diagnoses.length,
      averageComposite: Math.round(avgComposite * 10) / 10,
      bloomsGapAverage: Math.round(avgGap * 10) / 10,
      misconceptionsFound: allMisconceptions.length,
      fragileCorrectCount: fragileCount,
    };

    // Fire-and-forget memory persistence
    persistDiagnosticInsightsBackground(userId, params.attemptId, diagnoses, cognitiveProfile);
    persistMisconceptionsBackground(userId, params.attemptId, allMisconceptions);

    // Complete SAM Goal
    await completeEvaluation(goalId, planId, stats);

    const totalTime = Date.now() - startTime;
    logger.info('[EvalOrchestrator] Evaluation completed', {
      attemptId: params.attemptId,
      ...stats,
      echoBackCount,
      totalTimeMs: totalTime,
    });

    return {
      success: true,
      attemptId: params.attemptId,
      cognitiveProfile,
      improvementRoadmap,
      echoBackCount,
      stats,
      goalId,
      planId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[EvalOrchestrator] Evaluation failed', {
      error: msg,
      attemptId: params.attemptId,
      goalId,
    });

    await failEvaluation(goalId, planId, msg);

    return {
      success: false,
      error: msg,
      attemptId: params.attemptId,
      goalId: goalId || undefined,
      planId: planId || undefined,
    };
  }
}

// =============================================================================
// STAGE IMPLEMENTATIONS
// =============================================================================

async function runStage2(
  attempt: LoadedAttempt,
  evaluationMode: EvalOrchestrationConfig['params']['evaluationMode'],
  userId: string,
  onSSEEvent?: EvalOrchestrationConfig['onSSEEvent'],
  abortSignal?: AbortSignal
): Promise<AnswerDiagnosis[]> {
  const diagnoses: AnswerDiagnosis[] = [];
  const totalAnswers = attempt.answers.length;

  for (let i = 0; i < totalAnswers; i++) {
    if (abortSignal?.aborted) throw new Error('Cancelled');

    const answer = attempt.answers[i];
    const question = attempt.questions.find((q) => q.id === answer.questionId);

    if (!question) {
      logger.warn('[EvalOrchestrator] Question not found for answer', {
        answerId: answer.id,
        questionId: answer.questionId,
      });
      continue;
    }

    onSSEEvent?.({
      type: 'answer_evaluating',
      data: {
        stage: 2,
        questionId: question.id,
        questionNumber: i + 1,
        totalQuestions: totalAnswers,
        message: `Diagnosing answer ${i + 1}/${totalAnswers}: ${question.bloomsLevel} level question`,
      },
    });

    let bestDiagnosis: AnswerDiagnosis | null = null;
    let bestQuality = 0;

    // Generate with quality retry (up to 3 attempts, keep best)
    const maxAttempts = MAX_QUALITY_RETRIES + 1;
    for (let attempt_num = 0; attempt_num < maxAttempts; attempt_num++) {
      try {
        const prompt = buildStage2Prompt(
          {
            stem: question.stem,
            correctAnswer: question.correctAnswer,
            bloomsLevel: question.bloomsLevel,
            questionType: question.questionType,
            points: question.points,
            explanation: question.explanation ?? undefined,
            concept: question.concept,
            options: question.options ?? undefined,
          },
          answer.answer,
          evaluationMode,
          diagnoses // Cross-reference previous diagnoses
        );

        const response = await runSAMChatWithPreference({
          userId,
          capability: 'analysis',
          systemPrompt: prompt.systemPrompt,
          messages: [{ role: 'user', content: prompt.userPrompt }],
          maxTokens: prompt.maxTokens,
          temperature: prompt.temperature + attempt_num * 0.05,
        });

        const diagnosis = parseDiagnosis(response, question.id, question.bloomsLevel);
        const quality = scoreDiagnosisQuality(diagnosis);

        if (quality > bestQuality) {
          bestDiagnosis = diagnosis;
          bestQuality = quality;
        }

        if (quality >= QUALITY_RETRY_THRESHOLD) break;

        logger.info('[EvalOrchestrator] Diagnosis quality below threshold, retrying', {
          attempt: attempt_num,
          quality,
          threshold: QUALITY_RETRY_THRESHOLD,
          questionIndex: i,
        });
      } catch (error) {
        logger.warn('[EvalOrchestrator] Diagnosis attempt failed', {
          attempt: attempt_num,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Use fallback if all attempts failed
    if (!bestDiagnosis) {
      bestDiagnosis = buildFallbackDiagnosis(question.id, question.bloomsLevel);
    }

    diagnoses.push(bestDiagnosis);

    // Save to DB (AIEvaluationRecord with DIAGNOSE data in JSON columns)
    await saveEvaluationRecord(answer.id, question.id, bestDiagnosis);

    // Update EnhancedAnswer
    await updateEnhancedAnswer(answer.id, bestDiagnosis);

    onSSEEvent?.({
      type: 'answer_diagnosed',
      data: {
        stage: 2,
        questionId: question.id,
        bloomsGap: bestDiagnosis.bloomsGap,
        reasoningPath: bestDiagnosis.reasoningPath,
        tripleAccuracy: bestDiagnosis.tripleAccuracyDiagnosis,
        score: bestDiagnosis.scores.composite,
      },
    });

    // Progress update
    const stageProgress = 10 + Math.round((i / totalAnswers) * 45);
    onSSEEvent?.({
      type: 'progress',
      data: {
        percentage: stageProgress,
        message: `Diagnosed answer ${i + 1}/${totalAnswers}`,
        stage: 2,
      },
    });
  }

  return diagnoses;
}

async function runStage3(
  attempt: LoadedAttempt,
  diagnoses: AnswerDiagnosis[],
  userId: string,
  onSSEEvent?: EvalOrchestrationConfig['onSSEEvent']
): Promise<EchoBack[]> {
  const targetIds = selectEchoBackTargets(diagnoses, 3);
  const echoBackResults: EchoBack[] = [];

  for (const questionId of targetIds) {
    const diagnosis = diagnoses.find((d) => d.questionId === questionId);
    const question = attempt.questions.find((q) => q.id === questionId);
    const answer = attempt.answers.find((a) => a.questionId === questionId);

    if (!diagnosis || !question || !answer) continue;

    try {
      const prompt = buildStage3Prompt(
        {
          stem: question.stem,
          correctAnswer: question.correctAnswer,
          bloomsLevel: question.bloomsLevel,
          questionType: question.questionType,
          explanation: question.explanation ?? undefined,
        },
        answer.answer,
        diagnosis
      );

      const response = await runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        systemPrompt: prompt.systemPrompt,
        messages: [{ role: 'user', content: prompt.userPrompt }],
        maxTokens: prompt.maxTokens,
        temperature: prompt.temperature,
      });

      const echoBack = parseEchoBack(response, questionId);
      echoBackResults.push(echoBack);

      onSSEEvent?.({
        type: 'echo_back_generated',
        data: {
          stage: 3,
          questionId,
          echoBack,
        },
      });
    } catch (error) {
      logger.warn('[EvalOrchestrator] Echo-back generation failed', {
        error: error instanceof Error ? error.message : String(error),
        questionId,
      });
      echoBackResults.push(buildFallbackEchoBack(questionId));
    }
  }

  return echoBackResults;
}

async function runStage4(
  diagnoses: AnswerDiagnosis[],
  attempt: LoadedAttempt,
  userId: string,
  onSSEEvent?: EvalOrchestrationConfig['onSSEEvent']
): Promise<CognitiveProfile> {
  onSSEEvent?.({
    type: 'thinking',
    data: { stage: 4, message: 'Aggregating diagnoses into cognitive profile...' },
  });

  try {
    const prompt = buildStage4Prompt(diagnoses, {
      topic: attempt.examTopic ?? attempt.examTitle,
    });

    const response = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      systemPrompt: prompt.systemPrompt,
      messages: [{ role: 'user', content: prompt.userPrompt }],
      maxTokens: prompt.maxTokens,
      temperature: prompt.temperature,
    });

    const profile = parseCognitiveProfile(response);
    if (profile) return profile;
  } catch (error) {
    logger.warn('[EvalOrchestrator] AI cognitive profile generation failed, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fallback: aggregate from helpers
  return buildFallbackCognitiveProfile(diagnoses);
}

async function runStage5(
  profile: CognitiveProfile,
  diagnoses: AnswerDiagnosis[],
  attempt: LoadedAttempt,
  userId: string,
  onSSEEvent?: EvalOrchestrationConfig['onSSEEvent']
): Promise<ImprovementRoadmap> {
  onSSEEvent?.({
    type: 'thinking',
    data: { stage: 5, message: 'Generating improvement roadmap with ARROW phase prescriptions...' },
  });

  try {
    const prompt = buildStage5Prompt(profile, diagnoses, {
      topic: attempt.examTopic ?? attempt.examTitle,
    });

    const response = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      systemPrompt: prompt.systemPrompt,
      messages: [{ role: 'user', content: prompt.userPrompt }],
      maxTokens: prompt.maxTokens,
      temperature: prompt.temperature,
    });

    const roadmap = parseImprovementRoadmap(response);
    if (roadmap) return roadmap;
  } catch (error) {
    logger.warn('[EvalOrchestrator] AI roadmap generation failed, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return buildFallbackRoadmap(profile);
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function loadAttemptData(
  attemptId: string,
  userId: string
): Promise<LoadedAttempt | null> {
  try {
    const attempt = await db.userExamAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        Exam: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        enhancedAnswers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                correctAnswer: true,
                bloomsLevel: true,
                questionType: true,
                points: true,
                explanation: true,
                options: true,
                relatedConcepts: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) return null;

    const questions: LoadedQuestion[] = [];
    const answers: LoadedAnswer[] = [];
    const seenQuestionIds = new Set<string>();

    for (const ea of attempt.enhancedAnswers) {
      // Build answer
      answers.push({
        id: ea.id,
        questionId: ea.questionId,
        answer: ea.answer,
        isCorrect: ea.isCorrect,
        pointsEarned: ea.pointsEarned,
        timeSpent: ea.timeSpent,
      });

      // Build question (deduplicate)
      if (!seenQuestionIds.has(ea.questionId) && ea.question) {
        seenQuestionIds.add(ea.questionId);
        const q = ea.question;
        const parsedOptions = parseQuestionOptions(q.options);
        const concepts = (q.relatedConcepts as string[] | null) ?? [];

        questions.push({
          id: q.id,
          stem: q.question,
          correctAnswer: q.correctAnswer ?? '',
          bloomsLevel: q.bloomsLevel,
          questionType: q.questionType,
          points: q.points,
          explanation: q.explanation,
          options: parsedOptions,
          concept: concepts[0],
        });
      }
    }

    return {
      id: attempt.id,
      examId: attempt.examId,
      userId: attempt.userId,
      status: attempt.status,
      totalQuestions: attempt.totalQuestions,
      examTitle: attempt.Exam?.title ?? 'Untitled Exam',
      examTopic: attempt.Exam?.description?.split(' ').slice(0, 5).join(' '),
      questions,
      answers,
    };
  } catch (error) {
    logger.error('[EvalOrchestrator] Failed to load attempt data', {
      error: error instanceof Error ? error.message : String(error),
      attemptId,
    });
    return null;
  }
}

function parseQuestionOptions(
  options: unknown
): Array<{ text: string; isCorrect: boolean; diagnosticNote?: string }> | null {
  if (!options || !Array.isArray(options)) return null;
  return options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const o = opt as Record<string, unknown>;
      return {
        text: String(o.text ?? ''),
        isCorrect: Boolean(o.isCorrect),
        diagnosticNote: o.diagnosticNote ? String(o.diagnosticNote) : undefined,
      };
    }
    return { text: String(opt), isCorrect: false };
  });
}

async function saveEvaluationRecord(
  answerId: string,
  questionId: string,
  diagnosis: AnswerDiagnosis
): Promise<void> {
  try {
    await db.aIEvaluationRecord.create({
      data: {
        answerId,
        enhancedQuestionId: questionId,
        score: diagnosis.scores.composite,
        maxScore: 10,
        targetBloomsLevel: diagnosis.targetBloomsLevel,
        demonstratedLevel: diagnosis.demonstratedLevel,
        bloomsEvidence: {
          gap: diagnosis.bloomsGap,
          severity: diagnosis.gapSeverity,
          evidence: diagnosis.bloomsEvidence,
        },
        accuracy: diagnosis.scores.factualAccuracyScore * 10,
        completeness: diagnosis.scores.depthScore * 10,
        relevance: diagnosis.scores.bloomsLevelMatchScore * 10,
        depth: diagnosis.scores.logicalCoherenceScore * 10,
        conceptsUnderstood: diagnosis.solidFoundation,
        misconceptions: diagnosis.misconceptions.map((m) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          description: m.description,
        })),
        knowledgeGaps: {
          breakdownPoint: diagnosis.breakdownPoint,
          breakdownType: diagnosis.breakdownType,
          contaminatedSteps: diagnosis.contaminatedSteps,
          reasoningPath: diagnosis.reasoningPath,
          tripleAccuracy: diagnosis.tripleAccuracyDiagnosis,
          interventionSteps: diagnosis.interventionSteps,
          verificationQuestion: diagnosis.verificationQuestion,
        },
        feedback: diagnosis.feedback,
        strengths: diagnosis.strengths,
        improvements: diagnosis.interventionSteps.map((s) => s.action),
        nextSteps: [diagnosis.currentState, diagnosis.targetState],
        evaluationModel: 'diagnose-7-layer',
        confidence: diagnosis.scores.composite * 10,
        flaggedForReview: diagnosis.reasoningPath === 'fragile' || diagnosis.scores.composite < 3,
      },
    });
  } catch (error) {
    logger.error('[EvalOrchestrator] Failed to save AIEvaluationRecord', {
      error: error instanceof Error ? error.message : String(error),
      answerId,
    });
  }
}

async function updateEnhancedAnswer(
  answerId: string,
  diagnosis: AnswerDiagnosis
): Promise<void> {
  try {
    await db.enhancedAnswer.update({
      where: { id: answerId },
      data: {
        pointsEarned: diagnosis.scores.composite,
        evaluationType: 'AI_EVALUATED',
      },
    });
  } catch (error) {
    logger.error('[EvalOrchestrator] Failed to update EnhancedAnswer', {
      error: error instanceof Error ? error.message : String(error),
      answerId,
    });
  }
}

async function updateAttemptStatus(
  attemptId: string,
  avgComposite: number,
  totalAnswers: number
): Promise<void> {
  try {
    const scorePercentage = Math.round(avgComposite * 10);
    await db.userExamAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'GRADED',
        scorePercentage,
        isPassed: scorePercentage >= 70,
        correctAnswers: totalAnswers, // All evaluated
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('[EvalOrchestrator] Failed to update attempt status', {
      error: error instanceof Error ? error.message : String(error),
      attemptId,
    });
  }
}

async function updateCognitiveSkillProgress(
  userId: string,
  examId: string,
  profile: CognitiveProfile
): Promise<void> {
  try {
    const existing = await db.cognitiveSkillProgress.findFirst({
      where: { userId, conceptId: examId },
    });

    const data = {
      rememberMastery: profile.bloomsCognitiveMap.REMEMBER.score,
      understandMastery: profile.bloomsCognitiveMap.UNDERSTAND.score,
      applyMastery: profile.bloomsCognitiveMap.APPLY.score,
      analyzeMastery: profile.bloomsCognitiveMap.ANALYZE.score,
      evaluateMastery: profile.bloomsCognitiveMap.EVALUATE.score,
      createMastery: profile.bloomsCognitiveMap.CREATE.score,
      overallMastery: Object.values(profile.bloomsCognitiveMap).reduce(
        (s, e) => s + e.score, 0
      ) / 6,
      currentBloomsLevel: profile.cognitiveCeiling,
      lastAttemptDate: new Date(),
    };

    if (existing) {
      await db.cognitiveSkillProgress.update({
        where: { id: existing.id },
        data: {
          ...data,
          totalAttempts: { increment: 1 },
        },
      });
    } else {
      await db.cognitiveSkillProgress.create({
        data: {
          userId,
          conceptId: examId,
          ...data,
          totalAttempts: 1,
        },
      });
    }
  } catch (error) {
    logger.error('[EvalOrchestrator] Failed to update CognitiveSkillProgress', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      examId,
    });
  }
}

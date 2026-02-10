"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import type { BloomsLevel as PrismaBloomsLevel, QuestionType as PrismaQuestionType } from "@prisma/client";
import type { EnhancedQuestionFormData, GeneratedQuestion } from "../enhanced-exam-creator/types";
import {
  unifiedExamReducer,
  initialUnifiedExamState,
} from "./unified-exam-reducer";
import type {
  UnifiedQuestion,
  ExamBuilderMode,
  ExamMetadata,
  ExamEvaluationReport,
  AIGenerationConfig,
  SectionContext,
  Exam,
  ExamQuestion,
} from "./types";

// ============================================================================
// HOOK
// ============================================================================

export function useUnifiedExamBuilder(sectionContext: SectionContext) {
  const router = useRouter();
  const [state, dispatch] = useReducer(unifiedExamReducer, initialUnifiedExamState);

  // Refs for stable callbacks
  const sectionContextRef = useRef(sectionContext);
  sectionContextRef.current = sectionContext;

  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Fetch existing exams on mount ──────────────────────────────────────
  const fetchExams = useCallback(async () => {
    try {
      const { courseId, chapterId, sectionId } = sectionContextRef.current;
      const response = await axios.get(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/exams`
      );
      if (response.data.success) {
        dispatch({ type: "SET_EXISTING_EXAMS", payload: response.data.exams });
      }
    } catch (error) {
      logger.error("Failed to fetch exams:", error);
    } finally {
      dispatch({ type: "SET_LOADING_EXAMS", payload: false });
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // ── Mode ───────────────────────────────────────────────────────────────
  const setMode = useCallback((mode: ExamBuilderMode) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  // ── Question CRUD ──────────────────────────────────────────────────────

  /** Add a question from ManualQuestionCreator (convert EnhancedQuestionFormData) */
  const addManualQuestion = useCallback((formData: EnhancedQuestionFormData) => {
    const question: UnifiedQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      question: formData.question,
      questionType: formData.questionType,
      bloomsLevel: formData.bloomsLevel,
      difficulty: formData.difficulty,
      points: formData.points,
      estimatedTime: formData.estimatedTime,
      options: formData.options,
      correctAnswer: formData.correctAnswer,
      acceptableVariations: formData.acceptableVariations,
      hint: formData.hint,
      explanation: formData.explanation,
      commonMisconceptions: formData.commonMisconceptions,
      cognitiveSkills: formData.cognitiveSkills,
      relatedConcepts: formData.relatedConcepts,
      learningObjectiveId: formData.learningObjectiveId,
      generationMode: "MANUAL",
      confidence: 1.0,
      needsReview: false,
      answerVisibility: "hidden",
    };
    dispatch({ type: "ADD_QUESTION", payload: question });
    toast.success("Question added");
  }, []);

  /** Add AI-generated questions (convert GeneratedQuestion array) */
  const addGeneratedQuestions = useCallback((generated: GeneratedQuestion[]) => {
    const questions: UnifiedQuestion[] = generated.map((g) => ({
      id: g.id,
      question: g.question,
      questionType: g.questionType,
      bloomsLevel: g.bloomsLevel,
      difficulty: g.difficulty,
      points: g.points,
      estimatedTime: g.estimatedTime,
      options: g.options,
      correctAnswer: g.correctAnswer,
      acceptableVariations: g.acceptableVariations,
      hint: g.hint,
      explanation: g.explanation,
      commonMisconceptions: g.commonMisconceptions,
      cognitiveSkills: g.cognitiveSkills,
      relatedConcepts: g.relatedConcepts,
      learningObjectiveId: g.learningObjectiveId,
      generationMode: g.generationMode,
      confidence: g.confidence,
      needsReview: g.needsReview,
      answerVisibility: "hidden" as const,
    }));
    dispatch({ type: "ADD_QUESTIONS", payload: questions });
    toast.success(`${questions.length} questions generated`);
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<UnifiedQuestion>) => {
    dispatch({ type: "UPDATE_QUESTION", payload: { id, updates } });
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    dispatch({ type: "DELETE_QUESTION", payload: id });
    toast.success("Question removed");
  }, []);

  const reorderQuestions = useCallback((dragIndex: number, hoverIndex: number) => {
    dispatch({ type: "REORDER_QUESTIONS", payload: { dragIndex, hoverIndex } });
  }, []);

  /** Replace the full question list (e.g. after drag-reorder from Reorder.Group) */
  const setQuestions = useCallback((questions: UnifiedQuestion[]) => {
    dispatch({ type: "SET_QUESTIONS", payload: questions });
  }, []);

  // ── Answer visibility ──────────────────────────────────────────────────
  const revealAnswer = useCallback((questionId: string) => {
    dispatch({ type: "REVEAL_ANSWER", payload: questionId });
  }, []);

  const hideAnswer = useCallback((questionId: string) => {
    dispatch({ type: "HIDE_ANSWER", payload: questionId });
  }, []);

  const revealAllAnswers = useCallback(() => {
    dispatch({ type: "REVEAL_ALL_ANSWERS" });
  }, []);

  const hideAllAnswers = useCallback(() => {
    dispatch({ type: "HIDE_ALL_ANSWERS" });
  }, []);

  // ── Exam metadata ─────────────────────────────────────────────────────
  const updateExamMetadata = useCallback((updates: Partial<ExamMetadata>) => {
    dispatch({ type: "SET_EXAM_METADATA", payload: updates });
  }, []);

  // ── AI Generation ──────────────────────────────────────────────────────
  const generateQuestions = useCallback(async (config: AIGenerationConfig) => {
    dispatch({ type: "SET_GENERATING", payload: true });
    try {
      const ctx = sectionContextRef.current;
      const response = await axios.post("/api/sam/exam-builder/generate", {
        config,
        sectionContext: {
          courseId: ctx.courseId,
          chapterId: ctx.chapterId,
          sectionId: ctx.sectionId,
          courseTitle: ctx.courseTitle,
          chapterTitle: ctx.chapterTitle,
          sectionTitle: ctx.sectionTitle,
          sectionContent: ctx.sectionContent,
          learningObjectives: ctx.learningObjectives,
        },
      });

      if (response.data.success && response.data.questions) {
        const questions: UnifiedQuestion[] = response.data.questions.map(
          (q: UnifiedQuestion) => ({
            ...q,
            answerVisibility: "hidden" as const,
          })
        );
        dispatch({ type: "ADD_QUESTIONS", payload: questions });
        toast.success(`${questions.length} questions generated by AI`);
      } else {
        throw new Error(response.data.error || "Generation failed");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate questions";
      toast.error(msg);
      logger.error("AI generation error:", error);
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false });
    }
  }, []);

  // ── AI Evaluation ──────────────────────────────────────────────────────
  const evaluateExam = useCallback(async () => {
    const currentQuestions = stateRef.current.questions;
    if (currentQuestions.length === 0) {
      toast.error("Add at least one question before evaluating");
      return;
    }

    dispatch({ type: "SET_EVALUATING", payload: true });
    try {
      const ctx = sectionContextRef.current;
      const response = await axios.post("/api/sam/exam-builder/evaluate", {
        questions: currentQuestions,
        sectionContext: {
          courseId: ctx.courseId,
          chapterId: ctx.chapterId,
          sectionId: ctx.sectionId,
          courseTitle: ctx.courseTitle,
          chapterTitle: ctx.chapterTitle,
          sectionTitle: ctx.sectionTitle,
        },
      });

      if (response.data.success && response.data.report) {
        const report = response.data.report as ExamEvaluationReport;
        dispatch({ type: "SET_EVALUATION_REPORT", payload: report });

        // Apply per-question evaluation data
        if (report.questionAnalyses) {
          currentQuestions.forEach((q, index) => {
            if (report.questionAnalyses[index]) {
              dispatch({
                type: "UPDATE_QUESTION",
                payload: {
                  id: q.id,
                  updates: { evaluationData: report.questionAnalyses[index] },
                },
              });
            }
          });
        }

        toast.success("Exam evaluation complete");
      } else {
        throw new Error(response.data.error || "Evaluation failed");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to evaluate exam";
      toast.error(msg);
      logger.error("AI evaluation error:", error);
    } finally {
      dispatch({ type: "SET_EVALUATING", payload: false });
    }
  }, []);

  /** Apply a suggested rewrite from evaluation */
  const applySuggestion = useCallback(
    (questionId: string, suggestedRewrite: string) => {
      dispatch({
        type: "APPLY_EVALUATION_SUGGESTIONS",
        payload: { questionId, suggestedRewrite },
      });
      toast.success("Suggestion applied");
    },
    []
  );

  // ── Save exam ──────────────────────────────────────────────────────────
  const saveExam = useCallback(async () => {
    const { questions, examMetadata } = stateRef.current;
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }
    if (!examMetadata.title.trim()) {
      toast.error("Please enter an exam title");
      return;
    }

    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const ctx = sectionContextRef.current;
      const examData = {
        title: examMetadata.title,
        description: examMetadata.description,
        timeLimit: examMetadata.timeLimit?.toString(),
        passingScore: examMetadata.passingScore,
        questions: questions.map((q, index) => ({
          id: q.id,
          question: q.question,
          questionType: q.questionType,
          bloomsLevel: q.bloomsLevel,
          difficulty: q.difficulty,
          points: q.points,
          estimatedTime: q.estimatedTime,
          // Send both text-only (for ExamQuestion) and full objects (for EnhancedQuestion)
          options: q.options?.map((o) => o.text) ?? [],
          optionsFull: q.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) ?? [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
          cognitiveSkills: q.cognitiveSkills,
          relatedConcepts: q.relatedConcepts,
          generationMode: q.generationMode ?? "MANUAL",
          orderIndex: index,
        })),
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      };

      const response = await axios.post(
        `/api/courses/${ctx.courseId}/chapters/${ctx.chapterId}/sections/${ctx.sectionId}/exams`,
        examData
      );

      if (response.data.success) {
        toast.success(
          `Exam "${examMetadata.title}" created with ${questions.length} questions`
        );
        dispatch({ type: "RESET_BUILDER" });

        // Refresh exams list
        const examsResponse = await axios.get(
          `/api/courses/${ctx.courseId}/chapters/${ctx.chapterId}/sections/${ctx.sectionId}/exams`
        );
        if (examsResponse.data.success) {
          dispatch({ type: "SET_EXISTING_EXAMS", payload: examsResponse.data.exams });
        }
        router.refresh();
      } else {
        throw new Error(response.data.error || "Failed to save exam");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save exam";
      toast.error(msg);
      logger.error("Save exam error:", error);
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [router]);

  // ── Publish toggle ─────────────────────────────────────────────────────
  const togglePublish = useCallback(
    async (examId: string, isCurrentlyPublished: boolean) => {
      try {
        dispatch({ type: "SET_PUBLISHING_EXAM_ID", payload: examId });
        const ctx = sectionContextRef.current;
        const endpoint = isCurrentlyPublished ? "unpublish" : "publish";
        const response = await axios.patch(
          `/api/courses/${ctx.courseId}/chapters/${ctx.chapterId}/sections/${ctx.sectionId}/exams/${examId}/${endpoint}`
        );

        if (response.data) {
          toast.success(
            `Exam ${isCurrentlyPublished ? "unpublished" : "published"} successfully`
          );
          dispatch({
            type: "UPDATE_EXAM_PUBLISH_STATUS",
            payload: { examId, isPublished: !isCurrentlyPublished },
          });
          router.refresh();
        }
      } catch (error) {
        logger.error("Publish toggle error:", error);
        toast.error(
          `Failed to ${isCurrentlyPublished ? "unpublish" : "publish"} exam`
        );
      } finally {
        dispatch({ type: "SET_PUBLISHING_EXAM_ID", payload: null });
      }
    },
    [router]
  );

  // ── Preview existing exam ──────────────────────────────────────────────
  const previewExam = useCallback((exam: Exam) => {
    dispatch({ type: "SET_PREVIEWING_EXAM", payload: exam });
  }, []);

  const clearPreview = useCallback(() => {
    dispatch({ type: "SET_PREVIEWING_EXAM", payload: null });
  }, []);

  // ── Edit existing exam ─────────────────────────────────────────────────
  const editExam = useCallback((exam: Exam) => {
    dispatch({
      type: "SET_EXAM_METADATA",
      payload: {
        title: exam.title,
        description: exam.description || "",
        timeLimit: exam.timeLimit ?? 60,
      },
    });

    const questions: UnifiedQuestion[] = exam.questions.map((q: ExamQuestion) => ({
      id: q.id,
      question: q.question,
      questionType: mapQuestionType(q.questionType),
      bloomsLevel: mapBloomsLevel(q.bloomsLevel),
      difficulty: mapDifficulty(q.difficulty),
      points: q.points,
      estimatedTime: 60,
      options: q.options?.map((text, i) => ({
        id: `opt-${i}`,
        text,
        isCorrect: text === q.correctAnswer,
      })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      generationMode: "MANUAL" as const,
      confidence: 1.0,
      needsReview: false,
      answerVisibility: "hidden" as const,
    }));

    dispatch({ type: "SET_QUESTIONS", payload: questions });
    dispatch({ type: "SET_CREATING", payload: true });
    toast.success(`Editing exam: ${exam.title}`);
  }, []);

  // ── Delete existing exam ───────────────────────────────────────────────
  const deleteExam = useCallback(
    async (examId: string) => {
      if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
        return;
      }

      try {
        const ctx = sectionContextRef.current;
        const response = await axios.delete(
          `/api/courses/${ctx.courseId}/chapters/${ctx.chapterId}/sections/${ctx.sectionId}/exams/${examId}`
        );

        if (response.data) {
          toast.success("Exam deleted successfully");
          const currentExams = stateRef.current.existingExams;
          dispatch({
            type: "SET_EXISTING_EXAMS",
            payload: currentExams.filter((e) => e.id !== examId),
          });
          router.refresh();
        }
      } catch (error) {
        logger.error("Delete exam error:", error);
        toast.error("Failed to delete exam");
      }
    },
    [router]
  );

  // ── Builder toggle ─────────────────────────────────────────────────────
  const setCreating = useCallback((creating: boolean) => {
    dispatch({ type: "SET_CREATING", payload: creating });
  }, []);

  const resetBuilder = useCallback(() => {
    dispatch({ type: "RESET_BUILDER" });
  }, []);

  // ── Editing question ───────────────────────────────────────────────────
  const setEditingQuestion = useCallback((id: string | null) => {
    dispatch({ type: "SET_EDITING_QUESTION", payload: id });
  }, []);

  return {
    state,
    // Mode
    setMode,
    // Question CRUD
    addManualQuestion,
    addGeneratedQuestions,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    setQuestions,
    // Answer visibility
    revealAnswer,
    hideAnswer,
    revealAllAnswers,
    hideAllAnswers,
    // Metadata
    updateExamMetadata,
    // AI
    generateQuestions,
    evaluateExam,
    applySuggestion,
    // Save / Publish
    saveExam,
    togglePublish,
    // Exam management
    previewExam,
    clearPreview,
    editExam,
    deleteExam,
    // Builder
    setCreating,
    resetBuilder,
    setEditingQuestion,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function mapQuestionType(raw: string): PrismaQuestionType {
  const map: Record<string, PrismaQuestionType> = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    SHORT_ANSWER: "SHORT_ANSWER",
    ESSAY: "ESSAY",
    FILL_IN_BLANK: "FILL_IN_BLANK",
    MATCHING: "MATCHING",
    ORDERING: "ORDERING",
    "multiple-choice": "MULTIPLE_CHOICE",
    "true-false": "TRUE_FALSE",
    "short-answer": "SHORT_ANSWER",
  };
  return map[raw] ?? "MULTIPLE_CHOICE";
}

function mapBloomsLevel(raw?: string): PrismaBloomsLevel {
  if (!raw) return "UNDERSTAND";
  const map: Record<string, PrismaBloomsLevel> = {
    REMEMBER: "REMEMBER",
    UNDERSTAND: "UNDERSTAND",
    APPLY: "APPLY",
    ANALYZE: "ANALYZE",
    EVALUATE: "EVALUATE",
    CREATE: "CREATE",
    remember: "REMEMBER",
    understand: "UNDERSTAND",
    apply: "APPLY",
    analyze: "ANALYZE",
    evaluate: "EVALUATE",
    create: "CREATE",
  };
  return map[raw] ?? "UNDERSTAND";
}

function mapDifficulty(raw: string): PrismaQuestionDifficulty {
  const map: Record<string, PrismaQuestionDifficulty> = {
    EASY: "EASY",
    MEDIUM: "MEDIUM",
    HARD: "HARD",
    easy: "EASY",
    medium: "MEDIUM",
    hard: "HARD",
  };
  return map[raw] ?? "MEDIUM";
}

import type {
  UnifiedQuestion,
  ExamBuilderMode,
  AnswerVisibility,
  ExamMetadata,
  ExamEvaluationReport,
  Exam,
} from "./types";

// ============================================================================
// STATE
// ============================================================================

export interface UnifiedExamState {
  /** Current builder mode */
  mode: ExamBuilderMode;
  /** Questions in the builder */
  questions: UnifiedQuestion[];
  /** Exam metadata (title, settings, etc.) */
  examMetadata: ExamMetadata;
  /** AI evaluation report */
  evaluationReport: ExamEvaluationReport | null;
  /** Answer visibility per question */
  answerVisibility: Record<string, AnswerVisibility>;
  /** Loading states */
  isGenerating: boolean;
  isEvaluating: boolean;
  isSaving: boolean;
  /** Question currently being edited */
  editingQuestionId: string | null;
  /** Existing exams for this section */
  existingExams: Exam[];
  isLoadingExams: boolean;
  /** Exam being previewed */
  previewingExam: Exam | null;
  /** Publishing state */
  publishingExamId: string | null;
  /** Whether the builder form is open */
  isCreating: boolean;
}

// ============================================================================
// ACTIONS
// ============================================================================

export type UnifiedExamAction =
  | { type: "SET_MODE"; payload: ExamBuilderMode }
  | { type: "SET_QUESTIONS"; payload: UnifiedQuestion[] }
  | { type: "ADD_QUESTION"; payload: UnifiedQuestion }
  | { type: "ADD_QUESTIONS"; payload: UnifiedQuestion[] }
  | { type: "UPDATE_QUESTION"; payload: { id: string; updates: Partial<UnifiedQuestion> } }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "REORDER_QUESTIONS"; payload: { dragIndex: number; hoverIndex: number } }
  | { type: "SET_EXAM_METADATA"; payload: Partial<ExamMetadata> }
  | { type: "SET_EVALUATION_REPORT"; payload: ExamEvaluationReport | null }
  | { type: "APPLY_EVALUATION_SUGGESTIONS"; payload: { questionId: string; suggestedRewrite: string } }
  | { type: "REVEAL_ANSWER"; payload: string }
  | { type: "HIDE_ANSWER"; payload: string }
  | { type: "REVEAL_ALL_ANSWERS" }
  | { type: "HIDE_ALL_ANSWERS" }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_EVALUATING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_EDITING_QUESTION"; payload: string | null }
  | { type: "SET_EXISTING_EXAMS"; payload: Exam[] }
  | { type: "SET_LOADING_EXAMS"; payload: boolean }
  | { type: "SET_PREVIEWING_EXAM"; payload: Exam | null }
  | { type: "UPDATE_EXAM_PUBLISH_STATUS"; payload: { examId: string; isPublished: boolean } }
  | { type: "SET_PUBLISHING_EXAM_ID"; payload: string | null }
  | { type: "SET_CREATING"; payload: boolean }
  | { type: "RESET_BUILDER" };

// ============================================================================
// INITIAL STATE
// ============================================================================

export const initialUnifiedExamState: UnifiedExamState = {
  mode: "manual",
  questions: [],
  examMetadata: {
    title: "",
    description: "",
    timeLimit: 60,
    passingScore: 70,
    attempts: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: true,
    showCorrectAnswers: true,
    showExplanations: true,
    allowReview: true,
    isPublished: false,
    proctoring: false,
    randomizeFromPool: false,
    poolSize: null,
  },
  evaluationReport: null,
  answerVisibility: {},
  isGenerating: false,
  isEvaluating: false,
  isSaving: false,
  editingQuestionId: null,
  existingExams: [],
  isLoadingExams: true,
  previewingExam: null,
  publishingExamId: null,
  isCreating: false,
};

// ============================================================================
// REDUCER
// ============================================================================

export function unifiedExamReducer(
  state: UnifiedExamState,
  action: UnifiedExamAction
): UnifiedExamState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.payload };

    case "SET_QUESTIONS": {
      const visibility: Record<string, AnswerVisibility> = {};
      action.payload.forEach((q) => {
        visibility[q.id] = q.answerVisibility ?? "hidden";
      });
      return { ...state, questions: action.payload, answerVisibility: visibility };
    }

    case "ADD_QUESTION": {
      return {
        ...state,
        questions: [...state.questions, action.payload],
        answerVisibility: {
          ...state.answerVisibility,
          [action.payload.id]: action.payload.answerVisibility ?? "hidden",
        },
      };
    }

    case "ADD_QUESTIONS": {
      const newVisibility = { ...state.answerVisibility };
      action.payload.forEach((q) => {
        newVisibility[q.id] = q.answerVisibility ?? "hidden";
      });
      return {
        ...state,
        questions: [...state.questions, ...action.payload],
        answerVisibility: newVisibility,
      };
    }

    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        ),
      };

    case "DELETE_QUESTION": {
      const { [action.payload]: _removed, ...remainingVisibility } = state.answerVisibility;
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
        answerVisibility: remainingVisibility,
      };
    }

    case "REORDER_QUESTIONS": {
      const newQuestions = [...state.questions];
      const draggedQuestion = newQuestions[action.payload.dragIndex];
      newQuestions.splice(action.payload.dragIndex, 1);
      newQuestions.splice(action.payload.hoverIndex, 0, draggedQuestion);
      return { ...state, questions: newQuestions };
    }

    case "SET_EXAM_METADATA":
      return {
        ...state,
        examMetadata: { ...state.examMetadata, ...action.payload },
      };

    case "SET_EVALUATION_REPORT":
      return { ...state, evaluationReport: action.payload };

    case "APPLY_EVALUATION_SUGGESTIONS":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.questionId
            ? { ...q, question: action.payload.suggestedRewrite }
            : q
        ),
      };

    case "REVEAL_ANSWER":
      return {
        ...state,
        answerVisibility: { ...state.answerVisibility, [action.payload]: "revealed" },
      };

    case "HIDE_ANSWER":
      return {
        ...state,
        answerVisibility: { ...state.answerVisibility, [action.payload]: "hidden" },
      };

    case "REVEAL_ALL_ANSWERS": {
      const allRevealed: Record<string, AnswerVisibility> = {};
      state.questions.forEach((q) => {
        allRevealed[q.id] = "revealed";
      });
      return { ...state, answerVisibility: allRevealed };
    }

    case "HIDE_ALL_ANSWERS": {
      const allHidden: Record<string, AnswerVisibility> = {};
      state.questions.forEach((q) => {
        allHidden[q.id] = "hidden";
      });
      return { ...state, answerVisibility: allHidden };
    }

    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };

    case "SET_EVALUATING":
      return { ...state, isEvaluating: action.payload };

    case "SET_SAVING":
      return { ...state, isSaving: action.payload };

    case "SET_EDITING_QUESTION":
      return { ...state, editingQuestionId: action.payload };

    case "SET_EXISTING_EXAMS":
      return { ...state, existingExams: action.payload };

    case "SET_LOADING_EXAMS":
      return { ...state, isLoadingExams: action.payload };

    case "SET_PREVIEWING_EXAM":
      return { ...state, previewingExam: action.payload };

    case "UPDATE_EXAM_PUBLISH_STATUS":
      return {
        ...state,
        existingExams: state.existingExams.map((exam) =>
          exam.id === action.payload.examId
            ? { ...exam, isPublished: action.payload.isPublished }
            : exam
        ),
      };

    case "SET_PUBLISHING_EXAM_ID":
      return { ...state, publishingExamId: action.payload };

    case "SET_CREATING":
      return { ...state, isCreating: action.payload };

    case "RESET_BUILDER":
      return {
        ...state,
        questions: [],
        examMetadata: initialUnifiedExamState.examMetadata,
        evaluationReport: null,
        answerVisibility: {},
        editingQuestionId: null,
        isCreating: false,
        previewingExam: null,
      };

    default:
      return state;
  }
}

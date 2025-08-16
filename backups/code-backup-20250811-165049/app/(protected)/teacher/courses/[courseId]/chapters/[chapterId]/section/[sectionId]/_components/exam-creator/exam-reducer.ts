import { Question, Exam } from './types';

export interface ExamState {
  isCreating: boolean;
  questions: Question[];
  editingQuestion: string | null;
  isPreviewVisible: boolean;
  previewingExam: Exam | null;
  existingExams: Exam[];
  isLoadingExams: boolean;
  publishingExamId: string | null;
  activeBloomsTab: string;
  questionValidationResults: Record<string, any>;
  selectedBloomsLevel: string | null;
}

export type ExamAction =
  | { type: 'SET_CREATING'; payload: boolean }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'ADD_QUESTIONS'; payload: Question[] }
  | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'MOVE_QUESTION'; payload: { dragIndex: number; hoverIndex: number } }
  | { type: 'SET_EDITING_QUESTION'; payload: string | null }
  | { type: 'SET_PREVIEW_VISIBLE'; payload: boolean }
  | { type: 'SET_PREVIEWING_EXAM'; payload: Exam | null }
  | { type: 'SET_EXISTING_EXAMS'; payload: Exam[] }
  | { type: 'UPDATE_EXAM_PUBLISH_STATUS'; payload: { examId: string; isPublished: boolean } }
  | { type: 'SET_LOADING_EXAMS'; payload: boolean }
  | { type: 'SET_PUBLISHING_EXAM_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_BLOOMS_TAB'; payload: string }
  | { type: 'SET_QUESTION_VALIDATION'; payload: { questionId: string; result: any } }
  | { type: 'SET_SELECTED_BLOOMS_LEVEL'; payload: string | null }
  | { type: 'RESET_FORM' };

export const initialExamState: ExamState = {
  isCreating: false,
  questions: [],
  editingQuestion: null,
  isPreviewVisible: true,
  previewingExam: null,
  existingExams: [],
  isLoadingExams: true,
  publishingExamId: null,
  activeBloomsTab: 'creation',
  questionValidationResults: {},
  selectedBloomsLevel: null,
};

export function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'SET_CREATING':
      return { ...state, isCreating: action.payload };
    
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    
    case 'ADD_QUESTIONS':
      return { ...state, questions: [...state.questions, ...action.payload] };
    
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        ),
      };
    
    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter(q => q.id !== action.payload),
      };
    
    case 'MOVE_QUESTION': {
      const newQuestions = [...state.questions];
      const draggedQuestion = newQuestions[action.payload.dragIndex];
      newQuestions.splice(action.payload.dragIndex, 1);
      newQuestions.splice(action.payload.hoverIndex, 0, draggedQuestion);
      return { ...state, questions: newQuestions };
    }
    
    case 'SET_EDITING_QUESTION':
      return { ...state, editingQuestion: action.payload };
    
    case 'SET_PREVIEW_VISIBLE':
      return { ...state, isPreviewVisible: action.payload };
    
    case 'SET_PREVIEWING_EXAM':
      return { ...state, previewingExam: action.payload };
    
    case 'SET_EXISTING_EXAMS':
      return { ...state, existingExams: action.payload };
    
    case 'UPDATE_EXAM_PUBLISH_STATUS':
      return {
        ...state,
        existingExams: state.existingExams.map(exam =>
          exam.id === action.payload.examId
            ? { ...exam, isPublished: action.payload.isPublished }
            : exam
        ),
      };
    
    case 'SET_LOADING_EXAMS':
      return { ...state, isLoadingExams: action.payload };
    
    case 'SET_PUBLISHING_EXAM_ID':
      return { ...state, publishingExamId: action.payload };
    
    case 'SET_ACTIVE_BLOOMS_TAB':
      return { ...state, activeBloomsTab: action.payload };
    
    case 'SET_QUESTION_VALIDATION':
      return {
        ...state,
        questionValidationResults: {
          ...state.questionValidationResults,
          [action.payload.questionId]: action.payload.result,
        },
      };
    
    case 'SET_SELECTED_BLOOMS_LEVEL':
      return { ...state, selectedBloomsLevel: action.payload };
    
    case 'RESET_FORM':
      return {
        ...state,
        isCreating: false,
        questions: [],
        editingQuestion: null,
        previewingExam: null,
      };
    
    default:
      return state;
  }
}
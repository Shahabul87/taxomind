/**
 * @sam-ai/react - useQuestionBank Hook
 * React hook for SAM AI question bank management
 *
 * This hook provides access to the portable @sam-ai/educational
 * Question Bank for storing, retrieving, and managing exam questions.
 */
import type { BloomsLevel, QuestionType, QuestionDifficulty } from '@prisma/client';
/**
 * Question option data
 */
export interface QuestionOption {
    text: string;
    isCorrect: boolean;
}
/**
 * Question input data for adding to bank
 */
export interface QuestionInput {
    text: string;
    type: QuestionType;
    bloomsLevel: BloomsLevel;
    difficulty: QuestionDifficulty;
    subtopic?: string;
    tags?: string[];
    options?: QuestionOption[];
    explanation?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Question from the bank
 */
export interface BankQuestion {
    id: string;
    question: string;
    questionType: QuestionType;
    bloomsLevel: BloomsLevel;
    difficulty: QuestionDifficulty;
    subject?: string;
    topic?: string;
    subtopic?: string;
    tags: string[];
    usageCount: number;
    avgTimeSpent: number;
}
/**
 * Question bank statistics
 */
export interface QuestionBankStats {
    bloomsDistribution: Record<BloomsLevel, number>;
    difficultyDistribution: Record<QuestionDifficulty, number>;
    typeDistribution: Record<QuestionType, number>;
    totalUsage: number;
    averageDifficulty: number;
}
/**
 * Pagination info
 */
export interface Pagination {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
/**
 * Question bank query filters
 */
export interface QuestionBankQuery {
    courseId?: string;
    subject?: string;
    topic?: string;
    bloomsLevel?: BloomsLevel;
    difficulty?: QuestionDifficulty;
    questionType?: QuestionType;
    limit?: number;
    offset?: number;
}
/**
 * Options for the question bank hook
 */
export interface UseQuestionBankOptions {
    /** API endpoint for question bank */
    apiEndpoint?: string;
    /** Course ID for scoping */
    courseId?: string;
    /** Default subject */
    subject?: string;
    /** Default topic */
    topic?: string;
    /** Items per page */
    pageSize?: number;
    /** Callback when questions are loaded */
    onQuestionsLoaded?: (questions: BankQuestion[]) => void;
    /** Callback when questions are added */
    onQuestionsAdded?: (count: number) => void;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Return type for the question bank hook
 */
export interface UseQuestionBankReturn {
    /** Questions from the bank */
    questions: BankQuestion[];
    /** Question bank statistics */
    stats: QuestionBankStats | null;
    /** Pagination information */
    pagination: Pagination | null;
    /** Whether questions are loading */
    isLoading: boolean;
    /** Whether questions are being added */
    isAdding: boolean;
    /** Whether question is being updated */
    isUpdating: boolean;
    /** Whether question is being deleted */
    isDeleting: boolean;
    /** Error message if any */
    error: string | null;
    /** Get questions from the bank */
    getQuestions: (query?: QuestionBankQuery) => Promise<BankQuestion[]>;
    /** Add questions to the bank */
    addQuestions: (questions: QuestionInput[], subject?: string, topic?: string) => Promise<number>;
    /** Update a question */
    updateQuestion: (questionId: string, updates: Partial<QuestionInput>) => Promise<boolean>;
    /** Delete a question */
    deleteQuestion: (questionId: string) => Promise<boolean>;
    /** Load more questions (pagination) */
    loadMore: () => Promise<void>;
    /** Refresh questions */
    refresh: () => Promise<void>;
    /** Clear state */
    reset: () => void;
}
/**
 * Hook for SAM AI Question Bank
 *
 * @example
 * ```tsx
 * function QuestionBankManager() {
 *   const {
 *     questions,
 *     stats,
 *     pagination,
 *     isLoading,
 *     isAdding,
 *     error,
 *     getQuestions,
 *     addQuestions,
 *     deleteQuestion,
 *     loadMore,
 *   } = useQuestionBank({
 *     courseId: course.id,
 *     pageSize: 20,
 *     onQuestionsLoaded: (qs) => {
 *       console.log('Loaded questions:', qs.length);
 *     },
 *   });
 *
 *   useEffect(() => {
 *     getQuestions({ bloomsLevel: 'APPLY' });
 *   }, [getQuestions]);
 *
 *   const handleAddQuestions = async () => {
 *     const newQuestions = [
 *       {
 *         text: 'What is React?',
 *         type: 'MULTIPLE_CHOICE',
 *         bloomsLevel: 'UNDERSTAND',
 *         difficulty: 'MEDIUM',
 *         options: [
 *           { text: 'A JavaScript library', isCorrect: true },
 *           { text: 'A programming language', isCorrect: false },
 *         ],
 *       },
 *     ];
 *     await addQuestions(newQuestions, 'Web Development', 'React');
 *   };
 *
 *   return (
 *     <div>
 *       {isLoading && <p>Loading...</p>}
 *       {questions.map(q => (
 *         <div key={q.id}>
 *           <p>{q.question}</p>
 *           <span>{q.bloomsLevel}</span>
 *           <button onClick={() => deleteQuestion(q.id)}>Delete</button>
 *         </div>
 *       ))}
 *       {pagination?.hasMore && (
 *         <button onClick={loadMore}>Load More</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useQuestionBank(options?: UseQuestionBankOptions): UseQuestionBankReturn;
export default useQuestionBank;
//# sourceMappingURL=useQuestionBank.d.ts.map
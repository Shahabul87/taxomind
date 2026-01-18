/**
 * @sam-ai/react - useQuestionBank Hook
 * React hook for SAM AI question bank management
 *
 * This hook provides access to the portable @sam-ai/educational
 * Question Bank for storing, retrieving, and managing exam questions.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { BloomsLevel, QuestionType, QuestionDifficulty } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

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
export function useQuestionBank(
  options: UseQuestionBankOptions = {}
): UseQuestionBankReturn {
  const {
    apiEndpoint = '/api/sam/exam-engine/question-bank',
    courseId,
    subject,
    topic,
    pageSize = 50,
    onQuestionsLoaded,
    onQuestionsAdded,
    onError,
  } = options;

  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [stats, setStats] = useState<QuestionBankStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of current query for loadMore
  const currentQueryRef = useRef<QuestionBankQuery>({});
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Get questions from the bank
   */
  const getQuestions = useCallback(
    async (query: QuestionBankQuery = {}): Promise<BankQuestion[]> => {
      setIsLoading(true);
      setError(null);
      currentQueryRef.current = query;

      try {
        const params = new URLSearchParams();
        if (query.courseId || courseId) params.append('courseId', query.courseId || courseId || '');
        if (query.subject || subject) params.append('subject', query.subject || subject || '');
        if (query.topic || topic) params.append('topic', query.topic || topic || '');
        if (query.bloomsLevel) params.append('bloomsLevel', query.bloomsLevel);
        if (query.difficulty) params.append('difficulty', query.difficulty);
        if (query.questionType) params.append('questionType', query.questionType);
        params.append('limit', String(query.limit || pageSize));
        params.append('offset', String(query.offset || 0));

        const response = await fetch(`${apiEndpoint}?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get questions: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const loadedQuestions = data.data.questions as BankQuestion[];
          setQuestions(loadedQuestions);
          setStats(data.data.stats || null);
          setPagination(data.data.pagination || null);
          onQuestionsLoaded?.(loadedQuestions);
          return loadedQuestions;
        }

        throw new Error(data.error || 'Failed to get questions');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, courseId, subject, topic, pageSize, onQuestionsLoaded, onError]
  );

  /**
   * Add questions to the bank
   */
  const addQuestions = useCallback(
    async (newQuestions: QuestionInput[], subjectOverride?: string, topicOverride?: string): Promise<number> => {
      setIsAdding(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            subject: subjectOverride || subject,
            topic: topicOverride || topic,
            questions: newQuestions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to add questions: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const count = data.data.count || 0;
          onQuestionsAdded?.(count);
          return count;
        }

        throw new Error(data.error || 'Failed to add questions');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return 0;
      } finally {
        setIsAdding(false);
      }
    },
    [apiEndpoint, courseId, subject, topic, onQuestionsAdded, onError]
  );

  /**
   * Update a question
   */
  const updateQuestion = useCallback(
    async (questionId: string, updates: Partial<QuestionInput>): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            updates,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update question: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          // Update local state
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? { ...q, ...data.data }
                : q
            )
          );
          return true;
        }

        throw new Error(data.error || 'Failed to update question');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [apiEndpoint, onError]
  );

  /**
   * Delete a question
   */
  const deleteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      try {
        const params = new URLSearchParams({ id: questionId });
        const response = await fetch(`${apiEndpoint}?${params}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete question: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          // Remove from local state
          setQuestions((prev) => prev.filter((q) => q.id !== questionId));
          return true;
        }

        throw new Error(data.error || 'Failed to delete question');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [apiEndpoint, onError]
  );

  /**
   * Load more questions (pagination)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!pagination?.hasMore || isLoading) return;

    const newOffset = pagination.offset + pagination.limit;
    const query = { ...currentQueryRef.current, offset: newOffset };

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.courseId || courseId) params.append('courseId', query.courseId || courseId || '');
      if (query.subject || subject) params.append('subject', query.subject || subject || '');
      if (query.topic || topic) params.append('topic', query.topic || topic || '');
      if (query.bloomsLevel) params.append('bloomsLevel', query.bloomsLevel);
      if (query.difficulty) params.append('difficulty', query.difficulty);
      if (query.questionType) params.append('questionType', query.questionType);
      params.append('limit', String(query.limit || pageSize));
      params.append('offset', String(newOffset));

      const response = await fetch(`${apiEndpoint}?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to load more questions: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const loadedQuestions = data.data.questions as BankQuestion[];
        setQuestions((prev) => [...prev, ...loadedQuestions]);
        setPagination(data.data.pagination || null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, courseId, subject, topic, pageSize, pagination, isLoading, onError]);

  /**
   * Refresh questions
   */
  const refresh = useCallback(async (): Promise<void> => {
    await getQuestions(currentQueryRef.current);
  }, [getQuestions]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setQuestions([]);
    setStats(null);
    setPagination(null);
    setError(null);
    currentQueryRef.current = {};
  }, []);

  return {
    questions,
    stats,
    pagination,
    isLoading,
    isAdding,
    isUpdating,
    isDeleting,
    error,
    getQuestions,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    loadMore,
    refresh,
    reset,
  };
}

export default useQuestionBank;

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionCard } from './question-card';
import { AskQuestionForm } from './ask-question-form';
import { QASearchFilter, SortBy } from './qa-search-filter';
import { toast } from 'sonner';

interface Question {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isAnswered: boolean;
  isPinned: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  section?: {
    id: string;
    title: string;
  } | null;
  _count: {
    answers: number;
    votes: number;
  };
  userVote?: number;
}

interface QuestionListProps {
  courseId: string;
  sections?: Array<{
    id: string;
    title: string;
  }>;
}

export const QuestionList = ({ courseId, sections = [] }: QuestionListProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [sectionId, setSectionId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [votingQuestionId, setVotingQuestionId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
      });

      if (search) params.append('search', search);
      if (sectionId) params.append('sectionId', sectionId);

      const response = await fetch(
        `/api/courses/${courseId}/questions?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to fetch questions');
      }

      setQuestions(data.data.questions);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, page, sortBy, search, sectionId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleVote = async (questionId: string, value: number) => {
    setVotingQuestionId(questionId);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/questions/${questionId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to vote');
      }

      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                upvotes: data.data.upvotes,
                downvotes: data.data.downvotes,
                userVote: data.data.userVote,
              }
            : q
        )
      );
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
      throw error;
    } finally {
      setVotingQuestionId(null);
    }
  };

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page
  }, []);

  const handleSortChange = useCallback((newSort: SortBy) => {
    setSortBy(newSort);
    setPage(1); // Reset to first page
  }, []);

  const handleSectionChange = useCallback((newSectionId: string) => {
    setSectionId(newSectionId);
    setPage(1); // Reset to first page
  }, []);

  const handleQuestionSuccess = () => {
    // Refresh questions after posting
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Q&A Discussion
          </h2>
        </div>
        <Button onClick={() => setIsAskDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ask Question
        </Button>
      </div>

      {/* Search and Filters */}
      <QASearchFilter
        sections={sections}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onSectionChange={handleSectionChange}
        defaultSort={sortBy}
      />

      {/* Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No questions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Be the first to ask a question about this course!
          </p>
          <Button onClick={() => setIsAskDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ask the First Question
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onClick={() => {
                // TODO: Navigate to question detail page
                window.location.href = `/courses/${courseId}/questions/${question.id}`;
              }}
              onVote={(value) => handleVote(question.id, value)}
              isVoting={votingQuestionId === question.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Ask Question Dialog */}
      <AskQuestionForm
        courseId={courseId}
        sections={sections}
        open={isAskDialogOpen}
        onOpenChange={setIsAskDialogOpen}
        onSuccess={handleQuestionSuccess}
      />
    </div>
  );
};

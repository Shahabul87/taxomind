'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  hasInstructorAnswer?: boolean;
  isSubscribed?: boolean;
}

interface QuestionListProps {
  courseId: string;
  sections?: Array<{
    id: string;
    title: string;
  }>;
  userId?: string;
  isInstructor?: boolean;
}

export const QuestionList = ({ courseId, sections = [], userId, isInstructor = false }: QuestionListProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [sectionId, setSectionId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [votingQuestionId, setVotingQuestionId] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'unanswered' | 'mine' | 'pinned'>('all');
  const [sseConnected, setSseConnected] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // URL sync
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track whether this is the initial mount for URL initialization
  const isInitialMountRef = useRef(true);

  // Initialize state from URL (runs once on mount)
  useEffect(() => {
    if (!isInitialMountRef.current) return;
    isInitialMountRef.current = false;

    const qp = searchParams;
    const q = qp?.get('q') || '';
    const s = (qp?.get('sortBy') as SortBy) || 'recent';
    const sec = qp?.get('sectionId') || '';
    const v = (qp?.get('qaView') as 'all' | 'unanswered' | 'mine' | 'pinned') || 'all';
    setSearch(q);
    setSortBy(['recent','top','unanswered'].includes(s) ? s : 'recent');
    setSectionId(sec);
    setView(['all','unanswered','mine','pinned'].includes(v) ? v : 'all');
    setPage(1);
  }, [searchParams]);

  // Ref to read the latest searchParams without adding it as a dep
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Push state to URL
  useEffect(() => {
    if (!pathname) return;
    const currentParams = searchParamsRef.current?.toString() || '';
    const qp = new URLSearchParams(currentParams);

    if (search) qp.set('q', search); else qp.delete('q');
    qp.set('sortBy', sortBy);
    if (sectionId) qp.set('sectionId', sectionId); else qp.delete('sectionId');
    qp.set('qaView', view);

    const newParamsString = qp.toString();

    // Only update if params actually changed
    if (currentParams !== newParamsString) {
      router.replace(`${pathname}?${newParamsString}`, { scroll: false });
    }
  }, [search, sortBy, sectionId, view, pathname, router]);

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
        // Handle authentication errors silently - user might not be logged in
        if (response.status === 401 || data.error?.message?.includes('logged in')) {
          setQuestions([]);
          setTotalPages(1);
          setTotalCount(0);
          return;
        }
        throw new Error(data.error?.message || 'Failed to fetch questions');
      }

      // Append when loading subsequent pages for infinite scroll
      setQuestions((prev) => {
        if (page === 1) return data.data.questions as Question[];
        const map = new Map(prev.map((q: Question) => [q.id, q] as const));
        for (const q of data.data.questions as Question[]) {
          map.set(q.id, q);
        }
        return Array.from(map.values());
      });
      setTotalPages(data.data.pagination.totalPages);
      if (typeof data.data.pagination.totalItems === 'number') {
        setTotalCount(data.data.pagination.totalItems as number);
      }
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

  // Live updates via SSE
  useEffect(() => {
    try {
      const es = new EventSource(`/api/courses/${courseId}/questions/sse`);
      es.onopen = () => setSseConnected(true);
      es.onerror = () => setSseConnected(false);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === 'connected') { setSseConnected(true); return; }
          if (data?.type === 'vote_updated' && data?.payload && !data?.payload?.answerId && data?.questionId) {
            // Update question vote counts in place
            const { questionId: qid, upvotes, downvotes } = data.payload;
            setQuestions((prev) => prev.map((q) => q.id === qid ? { ...q, upvotes, downvotes } : q));
            return;
          }
          if (data?.type === 'answer_created' || data?.type === 'question_updated' || data?.type === 'answer_marked_best') {
            // Trigger a refresh by updating a flag instead of calling fetchQuestions directly
            setPage((p) => p); // Force re-fetch
          }
        } catch {}
      };
      return () => es.close();
    } catch {
      // no-op
    }
  }, [courseId]);

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

  // Derived stats (from loaded questions)
  const loadedTotal = questions.length;
  const loadedUnanswered = questions.filter(q => !q.isAnswered).length;
  const loadedPinned = questions.filter(q => q.isPinned).length;
  const loadedMine = userId ? questions.filter(q => q.user.id === userId).length : 0;

  // Client-side filter for view toggles
  const visibleQuestions = questions.filter((q) => {
    switch (view) {
      case 'unanswered':
        return !q.isAnswered;
      case 'pinned':
        return q.isPinned;
      case 'mine':
        return userId ? q.user.id === userId : true;
      default:
        return true;
    }
  });

  // Infinite scroll sentinel
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !isLoading && page < totalPages) {
          setPage((p) => Math.min(totalPages, p + 1));
        }
      }
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [isLoading, page, totalPages]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with stats and action buttons */}
      <div className="flex flex-col gap-4">
        {/* Top row: Title, Stats, Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Q&A</h2>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sseConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {sseConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ReportsButton courseId={courseId} />
            <Button size="sm" onClick={() => setIsAskDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Ask Question
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            Total: {totalCount ?? `${loadedTotal}+`}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300">
            Unanswered: {loadedUnanswered}
          </span>
          {loadedPinned > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
              Pinned: {loadedPinned}
            </span>
          )}
          {userId && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              My Questions: {loadedMine}
            </span>
          )}
        </div>

        {/* View toggle buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all','unanswered','mine','pinned'] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                if (v === 'unanswered') setSortBy('unanswered');
                if (v === 'all' && sortBy === 'unanswered') setSortBy('recent');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                view === v
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-600'
              }`}
            >
              {v === 'all' ? 'All' : v === 'unanswered' ? 'Unanswered' : v === 'mine' ? 'My Questions' : 'Pinned'}
            </button>
          ))}
        </div>
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
      ) : visibleQuestions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {!userId ? 'Sign in to view questions' : 'No questions yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {!userId
              ? 'Please sign in to view and participate in course discussions.'
              : 'Be the first to ask a question about this course!'}
          </p>
          {userId && (
            <Button onClick={() => setIsAskDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ask the First Question
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              courseId={courseId}
              isInstructor={isInstructor}
              onPinChange={(newPinned) => {
                setQuestions((prev) => prev.map((q) => (q.id === question.id ? { ...q, isPinned: newPinned } : q)));
              }}
              onClick={() => {
                // TODO: Navigate to question detail page
                window.location.href = `/courses/${courseId}/questions/${question.id}`;
              }}
              onVote={(value) => handleVote(question.id, value)}
              isVoting={votingQuestionId === question.id}
            />
          ))}
          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="h-12 flex items-center justify-center text-xs text-gray-500">
            {page < totalPages ? 'Loading more…' : '— End —'}
          </div>
        </div>
      )}

      {/* Pagination */}
      {/* Fallback pagination controls */}
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

// Instructor reports panel (self-contained minimal UI)
const ReportsButton: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    // Probe instructor-hood by attempting to load; on 403, hide button
    const check = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/questions/reports`);
        if (res.status === 403 || res.status === 401) {
          setIsInstructor(false);
          return;
        }
        const data = await res.json();
        if (data?.success) {
          setIsInstructor(true);
          setReports(data.data.reports || []);
        }
      } catch {
        setIsInstructor(false);
      }
    };
    check().catch(() => {});
  }, [courseId]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/reports`);
      const data = await res.json();
      if (data?.success) setReports(data.data.reports || []);
    } finally {
      setIsLoading(false);
    }
  };

  const dismiss = async (reportId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/reports/${reportId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {}
  };

  if (!isInstructor) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); loadReports(); }}>
        Reports
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Question Reports</h3>
              <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400" onClick={() => setOpen(false)}>✕</button>
            </div>
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
            ) : reports.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No reports</div>
            ) : (
              <div className="max-h-[60vh] overflow-auto divide-y divide-gray-200 dark:divide-gray-800">
                {reports.map((r) => (
                  <div key={r.id} className="py-3 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.question?.title || 'Question'}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Reported by {r.user?.name || 'User'} • {new Date(r.createdAt).toLocaleString()}</div>
                      {r.reason && <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{r.reason}</div>}
                    </div>
                    <button className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => dismiss(r.id)}>Dismiss</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

"use client";

import ContentViewer from '@/components/tiptap/content-viewer';
import Image from 'next/image';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

interface ClientAnswerCardProps {
  courseId: string;
  questionId: string;
  answer: {
    id: string;
    content: string;
    createdAt: Date;
    isBestAnswer: boolean;
    isInstructor: boolean;
    user: { id: string; name: string | null; image: string | null };
    upvotes?: number;
    downvotes?: number;
    userVote?: number;
  };
  canMarkBest?: boolean;
}

export default function ClientAnswerCard({ courseId, questionId, answer, canMarkBest = false }: ClientAnswerCardProps): JSX.Element {
  const [isBest, setIsBest] = useState(answer.isBestAnswer);
  const [userVote, setUserVote] = useState<number>(answer.userVote || 0);
  const [upvotes, setUpvotes] = useState<number>(answer.upvotes || 0);
  const [downvotes, setDownvotes] = useState<number>(answer.downvotes || 0);
  const markBest = async (best: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/${questionId}/answers/${answer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBestAnswer: best }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed');
      setIsBest(best);
      toast.success(best ? 'Marked as accepted' : 'Unmarked accepted');
    } catch (e) {
      toast.error('Failed to update answer');
    }
  };

  const vote = async (value: number) => {
    const prev = userVote;
    const next = prev === value ? 0 : value;
    let up = upvotes;
    let down = downvotes;
    if (prev === 1) up -= 1; if (prev === -1) down -= 1;
    if (next === 1) up += 1; if (next === -1) down += 1;
    setUserVote(next); setUpvotes(up); setDownvotes(down);
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/${questionId}/answers/${answer.id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: next }) });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error('Vote failed');
      // Sync counts to server response if provided
      if (typeof data.data?.upvotes === 'number') setUpvotes(data.data.upvotes);
      if (typeof data.data?.downvotes === 'number') setDownvotes(data.data.downvotes);
    } catch (e) {
      // revert
      setUserVote(prev); setUpvotes(answer.upvotes || 0); setDownvotes(answer.downvotes || 0);
      toast.error('Failed to vote');
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${isBest ? 'border-green-400 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          {answer.user.image ? (
            <Image src={answer.user.image} alt={answer.user.name || 'User'} width={28} height={28} className="rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">{answer.user.name || 'Anonymous'}</span>
          {answer.isInstructor && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Instructor</span>
          )}
          {isBest && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">Accepted</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{new Date(answer.createdAt).toLocaleString()}</span>
          {canMarkBest && (
            isBest ? (
              <button
                onClick={() => markBest(false)}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Unmark accepted"
              >
                Unmark
              </button>
            ) : (
              <button
                onClick={() => markBest(true)}
                className="text-xs px-2 py-1 rounded border border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Mark as accepted"
              >
                Accept
              </button>
            )
          )}
        </div>
      </div>
      <ContentViewer content={answer.content} />
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => vote(1)} className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded border ${userVote === 1 ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <ThumbsUp className="w-4 h-4" /> {upvotes}
        </button>
        <button onClick={() => vote(-1)} className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded border ${userVote === -1 ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <ThumbsDown className="w-4 h-4" /> {downvotes}
        </button>
      </div>
    </div>
  );
}

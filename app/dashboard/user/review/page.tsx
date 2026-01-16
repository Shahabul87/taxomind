import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { ReviewClient } from './_components/ReviewClient';

export const metadata: Metadata = {
  title: 'Review Queue | Taxomind',
  description: 'Practice and strengthen your knowledge with spaced repetition reviews',
};

/**
 * Spaced Repetition Review Page
 *
 * A dedicated page for learners to review concepts using the SM-2 algorithm.
 * Features flashcard-style reviews with quality ratings for optimal retention.
 *
 * Route: /dashboard/user/review
 */
export default async function ReviewPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  return <ReviewClient user={user} />;
}

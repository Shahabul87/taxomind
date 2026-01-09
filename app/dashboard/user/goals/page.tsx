import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { GoalsClient } from './_components/GoalsClient';

export const metadata: Metadata = {
  title: 'Learning Goals | Taxomind',
  description: 'Set, track, and achieve your learning goals with SAM AI Tutor',
};

export default async function GoalsPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  return <GoalsClient user={user} />;
}

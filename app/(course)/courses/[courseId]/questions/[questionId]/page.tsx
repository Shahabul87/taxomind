import { Metadata } from 'next';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ContentViewer from '@/components/tiptap/content-viewer';
import ClientAnswerCard from './_components/client-answer-card';
import Image from 'next/image';

type Props = { params: Promise<{ courseId: string; questionId: string }>; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, questionId } = await params;
  const question = await db.courseQuestion.findFirst({ where: { id: questionId, courseId }, select: { title: true } });
  return { title: question?.title ? `${question.title} | Q&A` : 'Q&A Question' };
}

export default async function QuestionDetailPage({ params }: Props): Promise<JSX.Element> {
  const user = await currentUser();
  if (!user?.id) redirect('/auth/login');

  const { courseId, questionId } = await params;
  const course = await db.course.findUnique({ where: { id: courseId }, select: { userId: true, title: true } });

  const question = await db.courseQuestion.findFirst({
    where: { id: questionId, courseId },
    include: {
      user: { select: { id: true, name: true, image: true } },
      section: { select: { id: true, title: true } },
      answers: {
        include: { user: { select: { id: true, name: true, image: true } }, _count: { select: { votes: true } } },
        orderBy: [{ isBestAnswer: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
      },
      _count: { select: { answers: true, votes: true } },
    },
  });

  if (!question) redirect(`/courses/${courseId}?tab=qa`);

  const isInstructor = course?.userId === user.id;
  const hasInstructorAnswer = question.answers.some((a) => a.isInstructor);
  // Fetch user's votes on answers to prefill userVote
  const answerIds = question.answers.map((a) => a.id);
  const userAnswerVotes = await db.answerVote.findMany({ where: { userId: user.id, answerId: { in: answerIds } } });
  const userVotesMap = new Map(userAnswerVotes.map(v => [v.answerId, v.value]));

  return (
    <div className="container mx-auto px-4 py-8 scroll-mt-sticky">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{question.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {question.isPinned && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">Pinned</span>
            )}
            {question.isAnswered && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">Answered</span>
            )}
            {hasInstructorAnswer && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Instructor Answered</span>
            )}
            {question.section && (
              <span className="px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">{question.section.title}</span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            {question.user.image ? (
              <Image src={question.user.image} alt={question.user.name || 'User'} width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            )}
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">{question.user.name || 'Anonymous'}</span>
              <span>{new Date(question.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <ContentViewer content={question.content} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Answers ({question._count.answers})</h2>
          <div className="space-y-4">
            {question.answers.map((ans) => (
              <ClientAnswerCard
                key={ans.id}
                courseId={courseId}
                questionId={questionId}
                answer={{
                  id: ans.id,
                  content: ans.content,
                  createdAt: ans.createdAt,
                  isBestAnswer: ans.isBestAnswer,
                  isInstructor: ans.isInstructor,
                  user: ans.user,
                  upvotes: ans.upvotes,
                  downvotes: ans.downvotes,
                  userVote: userVotesMap.get(ans.id) || 0,
                }}
                canMarkBest={isInstructor || question.userId === user.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

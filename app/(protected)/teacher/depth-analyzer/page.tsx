import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { CourseQualityAnalyzer } from './_components/CourseQualityAnalyzer';

interface PageProps {
  searchParams: Promise<{
    courseId?: string;
  }>;
}

export default async function DepthAnalyzerPage({ searchParams }: PageProps) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user?.id) {
    return redirect('/auth/login');
  }

  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      isPublished: true,
      updatedAt: true,
      chapters: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          sections: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
            },
          },
        },
      },
    },
  });

  // Fetch recent V2 analysis history for all user courses
  const recentAnalyses = await db.courseDepthAnalysisV2.findMany({
    where: {
      course: { userId: user.id },
    },
    orderBy: { analyzedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      courseId: true,
      overallScore: true,
      analyzedAt: true,
      version: true,
      status: true,
    },
  });

  // Build a map of courseId -> latest analysis summary
  const analysisMap: Record<string, { id: string; overallScore: number; analyzedAt: Date; version: number }> = {};
  for (const analysis of recentAnalyses) {
    if (!analysisMap[analysis.courseId]) {
      analysisMap[analysis.courseId] = {
        id: analysis.id,
        overallScore: analysis.overallScore,
        analyzedAt: analysis.analyzedAt,
        version: analysis.version,
      };
    }
  }

  const coursesWithAnalysis = courses.map((course) => ({
    ...course,
    latestAnalysis: analysisMap[course.id] ?? null,
  }));

  return (
    <div className="min-h-screen">
      <CourseQualityAnalyzer
        courses={coursesWithAnalysis}
        userId={user.id}
        initialCourseId={params.courseId}
      />
    </div>
  );
}

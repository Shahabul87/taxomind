import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DepthAnalyzerClient } from "./_components/depth-analyzer-client";

interface PageProps {
  searchParams: Promise<{
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }>;
}

export default async function DepthAnalyzerPage({ searchParams }: PageProps) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Fetch user's courses with chapters and sections for the selector
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      isPublished: true,
      updatedAt: true,
      whatYouWillLearn: true,
      chapters: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          isPublished: true,
          position: true,
          sections: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              isPublished: true,
              position: true,
            },
          },
        },
      },
    },
  });

  // Fetch recent analysis data for quick access cards
  const recentAnalyses = await db.courseBloomsAnalysis.findMany({
    where: {
      course: { userId: user.id },
    },
    orderBy: { analyzedAt: "desc" },
    take: 5,
    select: {
      id: true,
      courseId: true,
      cognitiveDepth: true,
      analyzedAt: true,
      course: {
        select: {
          title: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen">
      <DepthAnalyzerClient
        courses={courses}
        userId={user.id}
        recentAnalyses={recentAnalyses}
        initialCourseId={params.courseId}
        initialChapterId={params.chapterId}
        initialSectionId={params.sectionId}
      />
    </div>
  );
}

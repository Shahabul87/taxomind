import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getLatestAnalysisForCourse } from "@/lib/sam/depth-analysis-v2/analysis-status";
import { EnterpriseCourseSetupClient } from "./_components/enterprise-course-setup-client";

interface CourseIdPageProps {
  params: Promise<{courseId: string}>;
}

export default async function CourseIdPage({ params: paramsPromise }: CourseIdPageProps) {
  const params = await paramsPromise;

  const user = await currentUser();

  if(!user?.id){
      return redirect("/");
  }

  const userId = user?.id;

  const course = await db.course.findUnique({
   where: {
     id: params.courseId,
     userId
   },
   include: {
     chapters: {
       orderBy: {
         position: "asc",
       },
       include: {
         sections: {
           orderBy: {
             position: "asc",
           },
         },
       },
     },
     attachments: {
       orderBy: {
         createdAt: "desc",
       },
     },
   },
 });

  //console.log(course)

  // Fetch all categories
  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!course) {
   return redirect("/");
 }

  // Fetch latest depth analysis status (for quality score banner)
  const analysisStatus = await getLatestAnalysisForCourse(course.id);

  // Define sections as individual items for tracking completion
  const completionStatus = {
    titleDesc: Boolean(course.title && course.description),
    learningObj: Boolean(course.whatYouWillLearn && course.whatYouWillLearn.length > 0),
    image: Boolean(course.imageUrl),
    price: Boolean(course.price !== null && course.price !== undefined),
    category: Boolean(course.categoryId),
    chapters: Boolean(course.chapters.length > 0),
    attachments: Boolean(course.attachments.length > 0)
  };

  return (
    <EnterpriseCourseSetupClient
      course={course}
      categories={categories.map((category) => ({
        label: category.name,
        value: category.id,
      }))}
      userId={userId}
      completionStatus={completionStatus}
      depthAnalysis={analysisStatus.hasAnalysis ? {
        overallScore: analysisStatus.overallScore ?? 0,
        totalIssues: analysisStatus.totalIssues ?? 0,
        analysisMethod: analysisStatus.analysisMethod ?? 'rule-based',
        isStale: analysisStatus.isStale ?? false,
      } : undefined}
    />
  );
}
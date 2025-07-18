import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CircleDollarSign, File, LayoutDashboard, ListChecks, AlertTriangle, CheckCircle2, Brain, Target, FileQuestion, Lightbulb, Sparkles, BarChart3 } from "lucide-react";
import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";

import { CategoryForm } from "./_components/category-form";
import { PriceForm } from "./_components/price-form";
import { AttachmentForm } from "./_components/attachment-form";
import { ChaptersForm } from "./_components/chapters-form";
import { Actions } from "./_components/actions";
import { IconBadge } from "@/components/icon-badge";

import { cn } from "@/lib/utils";
import { CourseImageUpload } from "./_components/course-image-upload";
import { CourseLearningOutcomeForm } from "./_components/course-learning-outcome-form";
import { BloomsTaxonomyGuide } from "./chapters/[chapterId]/section/[sectionId]/_components/blooms-taxonomy-guide";
import { ContextAwareFeatureRevealer } from "@/components/ui/context-aware-feature-revealer";
import { BlueprintIntegration } from "./_components/blueprint-integration";
import { CourseDepthAnalyzer } from "./_components/course-depth-analyzer";
import { SamIntegration } from "./_components/sam-integration-example";
// import { CoursePageSamIntegration } from "./_components/course-page-sam-integration";
import { SimpleCourseContext } from "@/app/(protected)/teacher/_components/simple-course-context";
// import { TestComponent } from "@/app/(protected)/teacher/_components/test-component";

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

  const categories = await db.category.findMany({
   orderBy: {
     name: "asc",
   },
 });

  if (!course) {
   return redirect("/");
 }

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

  // Log sections status to help debug
  console.log("Sections status:", completionStatus);
  console.log("Completed sections:", Object.values(completionStatus).filter(Boolean).length);

  // Calculate completed sections
  const sectionValues = Object.values(completionStatus);
  const completedSections = sectionValues.filter(Boolean).length;
  const totalSections = sectionValues.length;
  
  // Allow publishing if at least 2 sections are completed
  const minSectionsRequired = 2;
  const isPublishable = completedSections >= minSectionsRequired;
  
  const completionText = `(${completedSections}/${totalSections})`;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced SAM Context Injection */}
      <SimpleCourseContext
        course={{
          id: course.id,
          title: course.title,
          description: course.description,
          whatYouWillLearn: course.whatYouWillLearn || [],
          isPublished: course.isPublished,
          categoryId: course.categoryId,
          price: course.price,
          imageUrl: course.imageUrl,
          chapters: course.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            description: chapter.description,
            isPublished: chapter.isPublished,
            isFree: chapter.isFree,
            position: chapter.position,
            sections: chapter.sections?.map(section => ({
              id: section.id,
              title: section.title,
              isPublished: section.isPublished
            }))
          }))
        }}
        completionStatus={completionStatus}
      />

      {/* Floating Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
      
      <div className="pt-6 pb-16 relative">
        {/* Full-Width Course Setup Header with Glass Effects */}
        <div className="w-full mb-8">
          {/* Banner for unpublished status */}
          {!course.isPublished && (
            <div className="w-full mb-6">
              <div className="mx-4 md:mx-6 lg:mx-8">
                <div className="w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-orange-300/60 dark:border-orange-600/60 shadow-xl p-4 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 backdrop-blur-sm shadow-lg">
                      <AlertTriangle className="h-5 w-5 text-white flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                        This course is unpublished. It will not be visible to students.
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Complete at least {minSectionsRequired} sections and click publish to make it available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Course Setup Header - Full Width */}
          <div className="w-full">
            <div className="mx-4 md:mx-6 lg:mx-8">
              <div className="relative group w-full">
                {/* Floating background orb for the header */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40 rounded-3xl blur-2xl group-hover:blur-xl transition-all duration-500"></div>
                
                {/* Main glass container */}
                <div className="relative w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-3xl border border-slate-300/60 dark:border-slate-600/60 shadow-xl p-6 md:p-8 lg:p-10">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
                    {/* Left: Icon and Title */}
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 backdrop-blur-sm shadow-xl">
                        <LayoutDashboard className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-center lg:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Course Setup
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">
                          Configure your course settings and content
                        </p>
                      </div>
                    </div>
                    
                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                      <Actions
                        disabled={!isPublishable}
                        courseId={params.courseId}
                        isPublished={course.isPublished}
                      />
                    </div>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="w-full bg-white/90 dark:bg-slate-700/90 backdrop-blur-md rounded-2xl border border-slate-300/50 dark:border-slate-500/50 shadow-lg p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Progress Info */}
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 backdrop-blur-sm shadow-xl">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Progress {completionText}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {completionPercentage}% complete
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 min-w-0 max-w-md">
                        <div className="w-full h-3 bg-slate-300/70 dark:bg-slate-600/70 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-700 shadow-md",
                              completionPercentage < 30 ? "bg-gradient-to-r from-amber-500 to-orange-600" : 
                              completionPercentage < 70 ? "bg-gradient-to-r from-blue-500 to-indigo-600" : 
                              "bg-gradient-to-r from-emerald-500 to-teal-600"
                            )}
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Publication Status */}
                      <div className="flex items-center gap-2">
                        {isPublishable ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 border border-emerald-500/40 dark:border-emerald-400/40 backdrop-blur-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Ready to publish</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 dark:bg-amber-400/20 border border-amber-500/40 dark:border-amber-400/40 backdrop-blur-sm">
                            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Needs more content</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progressive Feature Discovery */}
        <div className="px-4 md:px-6 mb-4">
          <ContextAwareFeatureRevealer
            userId={userId}
            currentPage="course-creation"
            contextualData={{
              coursesCreated: 1,
              chaptersCreated: course.chapters.length,
              studentsEnrolled: 0,
              examAttempts: 0,
              bloomsLevels: 3
            }}
          />
        </div>

        {/* Blueprint Integration */}
        <div className="px-4 md:px-6 mb-4">
          <BlueprintIntegration 
            courseId={params.courseId}
            currentCourse={{
              title: course.title,
              description: course.description || undefined,
              chapters: course.chapters
            }}
          />
        </div>

        {/* Course Structure - Two Column Layout */}
        <div className="px-4 md:px-6 mb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                    <LayoutDashboard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Basic Information
                  </h2>
                  {completionStatus.titleDesc && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                
                <div className="space-y-4">
                  <TitleForm initialData={{ title: course.title ?? undefined, description: course.description ?? undefined }} courseId={course.id} />
                  <DescriptionForm initialData={course} courseId={course.id} />
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Learning Objectives
                      {completionStatus.learningObj && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </h3>
                    <CourseLearningOutcomeForm
                      initialData={{ 
                        whatYouWillLearn: course.whatYouWillLearn || [],
                        title: course.title ?? undefined,
                        description: course.description ?? undefined
                      }}
                      courseId={course.id}
                    />
                  </div>
                </div>
              </div>

              {/* Course Settings */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                    <LayoutDashboard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Course Settings
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      Category
                      {completionStatus.category && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </h3>
                    <CategoryForm
                      initialData={course}
                      courseId={course.id}
                      options={categories.map((category) => ({
                        label: category.name,
                        value: category.id,
                      }))}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <File className="h-4 w-4" />
                      Course Image
                      {completionStatus.image && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </h3>
                    <CourseImageUpload 
                      courseId={params.courseId}
                      initialImage={course.imageUrl}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Chapters */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                    <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Course Chapters
                  </h2>
                  {completionStatus.chapters && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <ChaptersForm initialData={course} courseId={course.id} />
              </div>

              {/* Pricing & Resources */}
              <div className="space-y-4">
                {/* Price */}
                <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                      <CircleDollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Pricing
                    </h2>
                    {completionStatus.price && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <PriceForm initialData={course} courseId={course.id} />
                </div>

                {/* Attachments */}
                <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                      <File className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Resources
                    </h2>
                    {completionStatus.attachments && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <AttachmentForm initialData={course} courseId={course.id} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Depth Analyzer Section */}
        <div className="px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Colored Box Header */}
            <div className="mb-8 flex justify-center">
              <div className="relative group">
                {/* Floating background orb for the header */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 to-indigo-600/40 rounded-2xl blur-xl group-hover:blur-lg transition-all duration-300"></div>
                
                {/* Main colored box */}
                <div className="relative backdrop-blur-md bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-blue-600/90 border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-center gap-4">
                    {/* Icon with enhanced styling */}
                    <div className="p-3 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-lg">
                      <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    
                    {/* Header content */}
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                        Course Depth Analysis
                      </h2>
                      <p className="text-sm text-white/90 mt-2 font-medium drop-shadow-sm">
                        AI-powered insights into your course&apos;s cognitive depth and learning taxonomy
                      </p>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="hidden md:flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse delay-200"></div>
                      <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse delay-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Depth Analyzer */}
            <CourseDepthAnalyzer
              courseId={params.courseId}
              courseData={{
                id: course.id,
                title: course.title || "Untitled Course",
                description: course.description || "",
                whatYouWillLearn: course.whatYouWillLearn || [],
                chapters: course.chapters.map(chapter => ({
                  id: chapter.id,
                  title: chapter.title || "Untitled Chapter",
                  description: chapter.description || "",
                  isPublished: chapter.isPublished,
                  isFree: chapter.isFree,
                  position: chapter.position,
                  sections: chapter.sections?.map(section => ({
                    id: section.id,
                    title: section.title || "Untitled Section",
                    description: section.description || "",
                    position: section.position,
                    isPublished: section.isPublished
                  })) || []
                }))
              }}
              completionStatus={completionStatus}
            />
          </div>
        </div>
      </div>

      {/* Improved SAM Assistant */}
      <SamIntegration 
          courseId={params.courseId}
          courseData={{
            id: course.id,
            title: course.title || "Untitled Course",
            description: course.description,
            isPublished: course.isPublished,
            categoryId: course.categoryId,
            whatYouWillLearn: course.whatYouWillLearn || [],
            chapters: course.chapters.map(chapter => ({
              id: chapter.id,
            title: chapter.title,
            isPublished: chapter.isPublished,
            sections: chapter.sections?.map(section => ({
              id: section.id,
              title: section.title,
              isPublished: section.isPublished
            })) || []
          }))
        }}
        completionStatus={completionStatus}
        variant="floating"
      />
    </div>
  );
}
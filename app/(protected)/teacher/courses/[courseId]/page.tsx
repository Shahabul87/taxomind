import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CircleDollarSign, File, LayoutDashboard, ListChecks, AlertTriangle, CheckCircle2, Brain, Target, FileQuestion, Lightbulb, Sparkles, BarChart3 } from "lucide-react";
import { TitleFormEnhanced } from "./_components/title-form-enhanced";
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
// SAM Integration removed - using global SAM assistant instead
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
    <div className="min-h-screen dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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


      <div className="pt-3 sm:pt-4 md:pt-6 pb-8 sm:pb-12 md:pb-16 relative px-2 sm:px-0">
        {/* Full-Width Course Setup Header with Glass Effects */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8">
          {/* Banner for unpublished status */}
          {!course.isPublished && (
            <div className="w-full mb-4 sm:mb-6">
              <div className="mx-2 sm:mx-4 md:mx-6 lg:mx-8">
                <div className="w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl sm:rounded-2xl border border-orange-300/60 dark:border-orange-600/60 shadow-xl p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 backdrop-blur-sm shadow-lg flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-300">
                        This course is unpublished. It will not be visible to students.
                      </p>
                      <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 mt-0.5 sm:mt-1 hidden sm:block">
                        Complete at least {minSectionsRequired} sections and click publish to make it available.
                      </p>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5 sm:hidden">
                        Complete {minSectionsRequired}+ sections to publish
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Course Setup Header - Full Width */}
          <div className="w-full">
            <div className="mx-2 sm:mx-4 md:mx-6 lg:mx-8">
              <div className="w-full">
                {/* Main glass container */}
                <div className="w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-300/60 dark:border-slate-600/60 shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
                    {/* Left: Icon and Title */}
                    <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-1 min-w-0">
                      <div className="p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 backdrop-blur-sm shadow-xl flex-shrink-0">
                        <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                          Course Setup
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base hidden sm:block">
                          Configure your course settings and content
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[10px] sm:hidden">
                          Configure settings
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto flex-shrink-0">
                      <Actions
                        disabled={!isPublishable}
                        courseId={params.courseId}
                        isPublished={course.isPublished}
                      />
                    </div>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="w-full bg-white/90 dark:bg-slate-700/90 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-300/50 dark:border-slate-500/50 shadow-lg p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      {/* Progress Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 backdrop-blur-sm shadow-xl">
                          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Progress {completionText}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300">
                            {completionPercentage}% complete
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 w-full sm:w-auto min-w-0 sm:max-w-md">
                        <div className="w-full h-2.5 sm:h-3 bg-slate-300/70 dark:bg-slate-600/70 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
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
                      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                        {isPublishable ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 border border-emerald-500/40 dark:border-emerald-400/40 backdrop-blur-sm w-full sm:w-auto justify-center sm:justify-start">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-300 truncate">Ready to publish</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/20 dark:bg-amber-400/20 border border-amber-500/40 dark:border-amber-400/40 backdrop-blur-sm w-full sm:w-auto justify-center sm:justify-start">
                            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 dark:text-amber-300 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-300 truncate">Needs more content</span>
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
        <div className="px-2 sm:px-4 md:px-6 mb-3 sm:mb-4">
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
        <div className="px-2 sm:px-4 md:px-6 mb-3 sm:mb-4">
          <BlueprintIntegration
            courseId={params.courseId}
            currentCourse={{
              title: course.title,
              description: course.description || undefined,
              chapters: course.chapters
            }}
          />
        </div>

        {/* Course Information - Two Column Layout */}
        <div className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Left Column - Course Title and Description */}
            <div className="space-y-3 sm:space-y-4">
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex-1 truncate">
                    Course Title & Description
                  </h2>
                  {completionStatus.titleDesc && (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="space-y-4">
                  <TitleFormEnhanced 
                    initialData={{ 
                      title: course.title ?? undefined, 
                      description: course.description ?? undefined,
                      category: course.categoryId ? { id: course.categoryId, name: categories.find(cat => cat.id === course.categoryId)?.name || '' } : undefined,
                      learningObjectives: course.whatYouWillLearn || []
                    }} 
                    courseId={course.id} 
                  />
                  <DescriptionForm initialData={course} courseId={course.id} />
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex-1 truncate">
                    Learning Objectives
                  </h2>
                  {completionStatus.learningObj && (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                
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

            {/* Right Column - Category, Price, Image */}
            <div className="space-y-3 sm:space-y-4">
              {/* Course Category */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                    <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex-1 truncate">
                    Course Category
                  </h2>
                  {completionStatus.category && (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                
                <CategoryForm
                  initialData={course}
                  courseId={course.id}
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                />
              </div>

              {/* Course Price */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                    <CircleDollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex-1 truncate">
                    Course Price
                  </h2>
                  {completionStatus.price && (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                
                <PriceForm initialData={course} courseId={course.id} />
              </div>

              {/* Course Image */}
              <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                    <File className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex-1 truncate">
                    Course Image
                  </h2>
                  {completionStatus.image && (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                
                <CourseImageUpload 
                  courseId={params.courseId}
                  initialImage={course.imageUrl}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Chapters - Single Column */}
        <div className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
          <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex-1 truncate">
                Course Chapters
              </h2>
              {completionStatus.chapters && (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            <ChaptersForm initialData={course} courseId={course.id} />
          </div>
        </div>

        {/* Resources - Single Column */}
        <div className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
          <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                <File className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex-1 truncate">
                Course Resources
              </h2>
              {completionStatus.attachments && (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>
            <AttachmentForm initialData={course} courseId={course.id} />
          </div>
        </div>

        {/* Course Depth Analysis - Single Column */}
        <div className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
          <div className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl rounded-lg sm:rounded-xl p-3 sm:p-4">
            {/* Header Section */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex-1 truncate">
                Course Depth Analysis
              </h2>
            </div>
            
            {/* Course Depth Analyzer */}
            <CourseDepthAnalyzer
              courseId={params.courseId}
              courseData={course as any}
              completionStatus={completionStatus}
            />
          </div>
        </div>
      </div>

      {/* Global SAM Assistant is available via the floating button in the bottom-right corner */}
      {/* SimpleCourseContext provides course data to the global SAM */}
    </div>
  );
}
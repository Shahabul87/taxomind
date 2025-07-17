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
import { BloomsTaxonomyProgressTracker } from "./_components/blooms-taxonomy-progress-tracker";
import { AdvancedAnalyticsDashboard } from "./_components/advanced-analytics-dashboard";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-850 dark:to-gray-800">
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
      
      <div className="pt-8 pb-20">
        {/* Header Section with integrated Banner and Course Setup */}
        <div className="px-4 md:px-8 mb-8">
          <div className={cn(
            "relative overflow-hidden rounded-2xl",
            "border border-gray-200/70 dark:border-gray-700/50",
            "bg-white dark:bg-gray-800",
            "shadow-lg"
          )}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 dark:bg-purple-900/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
            
            {/* Banner for unpublished status */}
            {!course.isPublished && (
              <div className="relative border-b border-orange-200 dark:border-orange-800/30">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    </div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                      This course is unpublished. It will not be visible to students.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Course Setup Header */}
            <div className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 shadow-md">
                      <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      Course Setup
                    </h1>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Completion {completionText}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          completionPercentage < 30 ? "bg-amber-500" : 
                          completionPercentage < 70 ? "bg-indigo-500" : 
                          "bg-emerald-500"
                        )}
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    
                    {/* Publication status */}
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      {isPublishable && <CheckCircle2 className="h-4 w-4" />}
                      <span className="text-xs font-medium">
                        {completedSections >= totalSections 
                          ? "All sections completed!" 
                          : isPublishable 
                            ? `${completedSections}/${minSectionsRequired}+ sections complete - Ready to publish` 
                            : `${completedSections}/${minSectionsRequired} sections needed to publish`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Actions
                  disabled={!isPublishable}
                  courseId={params.courseId}
                  isPublished={course.isPublished}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progressive Feature Discovery */}
        <div className="px-4 md:px-8 mb-6">
          <ContextAwareFeatureRevealer
            userId={userId}
            currentPage="course-creation"
            contextualData={{
              coursesCreated: 1,
              chaptersCreated: course.chapters.length,
              studentsEnrolled: 0, // This would come from actual enrollment data
              examAttempts: 0, // This would come from actual exam data
              bloomsLevels: 3 // This would be calculated from actual exam questions
            }}
          />
        </div>

        {/* Blueprint Integration - Shows AI-generated course structure if available */}
        <div className="px-4 md:px-8 mb-6">
          <BlueprintIntegration 
            courseId={params.courseId}
            currentCourse={{
              title: course.title,
              description: course.description || undefined,
              chapters: course.chapters
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="px-4 md:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-6 md:space-y-8">
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md p-5 md:p-7",
                completionStatus.titleDesc ? "border-l-4 border-emerald-500" : ""
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={LayoutDashboard} variant={completionStatus.titleDesc ? "success" : "default"} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Basic Information
                    {completionStatus.titleDesc && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                        (Completed)
                      </span>
                    )}
                  </h2>
                </div>
                
                <div className="space-y-6">
                  <TitleForm initialData={{ title: course.title ?? undefined, description: course.description ?? undefined }} courseId={course.id} />
                  <div className={cn(
                    "rounded-md overflow-hidden",
                    completionStatus.titleDesc ? "border-l-4 border-emerald-500" : ""
                  )}>
                    <DescriptionForm initialData={course} courseId={course.id} />
                  </div>
                  <div className={cn(
                    completionStatus.learningObj ? "border-l-4 border-emerald-500 pl-4 py-2" : ""
                  )}>
                    <div className="flex items-start gap-x-2">
                      {completionStatus.learningObj && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                      )}
                      <div className="w-full">
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          Learning Objectives
                          {completionStatus.learningObj && (
                            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                              (Completed)
                            </span>
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
                </div>
              </div>


              {/* Bloom's Taxonomy Progress Tracker */}
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md overflow-hidden"
              )}>
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                  <div className="bg-white dark:bg-gray-800 p-5 md:p-7">
                    <BloomsTaxonomyProgressTracker 
                      courseId={params.courseId}
                      courseStructure={{
                        id: course.id,
                        title: course.title || "Untitled Course",
                        chapters: course.chapters.map(chapter => ({
                          id: chapter.id,
                          title: chapter.title,
                          bloomsLevel: undefined, // TODO: Add bloomsLevel to chapter model
                          sections: chapter.sections.map(section => ({
                            id: section.id,
                            title: section.title,
                            bloomsLevel: undefined, // TODO: Add bloomsLevel to section model
                            contentType: undefined, // TODO: Add contentType to section model
                            isPublished: section.isPublished
                          }))
                        }))
                      }}
                      view="teacher"
                    />
                  </div>
                </div>
              </div>

              {/* Bloom's Taxonomy Educational Design Guide */}
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md overflow-hidden"
              )}>
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                  <div className="bg-white dark:bg-gray-800 p-5 md:p-7">
                    <div className="flex items-center gap-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Educational Design Assistant
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          AI-powered Bloom&apos;s taxonomy guide for cognitive learning design
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-1">Smart Course Design</h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                              Use our comprehensive Bloom&apos;s taxonomy guide to design cognitively progressive learning experiences. 
                              Create questions and assessments that build from basic recall to advanced creative thinking.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1">
                        <BloomsTaxonomyGuide
                          showQuestionExamples={true}
                          isInteractive={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 md:space-y-8">

              {/* Chapters Section */}
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md p-5 md:p-7",
                completionStatus.chapters ? "border-l-4 border-emerald-500" : ""
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={ListChecks} variant={completionStatus.chapters ? "success" : "default"} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Course Chapters
                    {completionStatus.chapters && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                        (Completed)
                      </span>
                    )}
                  </h2>
                </div>
                <ChaptersForm initialData={course} courseId={course.id} />
              </div>

              {/* Price Section */}
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md p-5 md:p-7",
                completionStatus.price ? "border-l-4 border-emerald-500" : ""
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={CircleDollarSign} variant={completionStatus.price ? "success" : "default"} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Sell your course
                    {completionStatus.price && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                        (Completed)
                      </span>
                    )}
                  </h2>
                </div>
                <PriceForm initialData={course} courseId={course.id} />
              </div>

              {/* Course Settings Section - Moved from left column */}
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md p-5 md:p-7"
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={LayoutDashboard} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Course Settings
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* Category */}
                  <div className={cn(
                    "p-4 rounded-md",
                    completionStatus.category ? "border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/5" : "bg-gray-50 dark:bg-gray-800/60"
                  )}>
                    <div className="flex items-center gap-x-3 mb-4">
                      <IconBadge icon={ListChecks} size="sm" variant={completionStatus.category ? "success" : "default"} />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Category
                        {completionStatus.category && (
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                            (Completed)
                          </span>
                        )}
                      </h3>
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
                  
                  {/* Course Image */}
                  <div className={cn(
                    "p-4 rounded-md",
                    completionStatus.image ? "border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/5" : "bg-gray-50 dark:bg-gray-800/60"
                  )}>
                    <div className="flex items-center gap-x-3 mb-4">
                      <IconBadge icon={File} size="sm" variant={completionStatus.image ? "success" : "default"} />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Course Image
                        {completionStatus.image && (
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                            (Completed)
                          </span>
                        )}
                      </h3>
                    </div>
                    <CourseImageUpload 
                      courseId={params.courseId}
                      initialImage={course.imageUrl}
                    />
                  </div>
                </div>
              </div>
              
              {/* Attachments Section */}
              <div className={cn(
                "rounded-xl",
                "border border-gray-200/70 dark:border-gray-700/50",
                "bg-white dark:bg-gray-800",
                "shadow-md p-5 md:p-7",
                completionStatus.attachments ? "border-l-4 border-emerald-500" : ""
              )}>
                <div className="flex items-center gap-x-3 mb-6">
                  <IconBadge icon={File} variant={completionStatus.attachments ? "success" : "default"} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Resources & Attachments
                    {completionStatus.attachments && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                        (Completed)
                      </span>
                    )}
                  </h2>
                </div>
                <AttachmentForm initialData={course} courseId={course.id} />
              </div>

              {/* Advanced Analytics Dashboard */}
              {completionStatus.titleDesc && completionStatus.learningObj && completionStatus.chapters && (
                <div className="backdrop-blur-md bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-white/20 shadow-xl rounded-xl relative overflow-hidden">
                  {/* Background Orbs */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-cyan-400/20 rounded-full blur-xl transform -translate-x-12 translate-y-12"></div>
                  
                  <div className="relative z-10 p-5 md:p-7">
                    <div className="flex items-center gap-x-3 mb-6">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                        Advanced Course Analytics
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                          (Premium Feature)
                        </span>
                      </h2>
                    </div>
                    <AdvancedAnalyticsDashboard 
                      courseId={params.courseId}
                      courseTitle={course.title || "Your Course"}
                    />
                  </div>
                </div>
              )}
            </div>
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
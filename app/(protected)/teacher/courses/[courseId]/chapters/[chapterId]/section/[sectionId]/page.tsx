"use server";

import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, LayoutDashboard, Video, PlusCircle, Code2 } from "lucide-react";
import { db } from "@/lib/db";
import { Banner } from "@/components/banner"
import { SectionTitleForm } from "./_components/section-title-form";
import { SectionAccessForm } from "./_components/section-access-form";
import { SectionYoutubeVideoForm } from "./_components/section-video-form";
import { SectionActions } from "./_components/sections-actions";
import { cn } from "@/lib/utils";
import { CodeExplanationForm } from "./_components/_explanations/code-explanation-form";
import { ExplanationActions } from "./_components/explanation-actions";
import { VideoResourcesCard } from "./_components/VideoResourcesCard";
import { BlogResourcesCard } from "./_components/BlogResourcesCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InteractiveSections } from "./_components/interactive-sections";
import { TabsContainer } from "./_components/TabsContainer";

const SectionIdPage = async (
  props: {
    params: Promise<{ courseId: string; chapterId: string; sectionId: string }>
  }
) => {
  const params = await props.params;
  const user = await currentUser();

  if (!user?.id) {
      return redirect("/");
    }

  const section = await db.section.findFirst({
    where: {
      id: params.sectionId,
      chapterId: params.chapterId,
    },
    include: {
      videos: true,
      blogs: true,
      articles: true,
      notes: true,
      codeExplanations: {
        select: {
          id: true,
          heading: true,
          code: true,
          explanation: true,
        }
      },
      mathExplanations: {
        select: {
          id: true,
          title: true,
          content: true,
          latex: true,
          equation: true,
          imageUrl: true,
          mode: true,
        }
      }
    },
  });

  const chapter = await db.chapter.findFirst({
    where: {
      id: params.chapterId,
      courseId: params.courseId,
    },
    include: {
      sections: {
        orderBy: {
          position: "asc",
        },
        include: {
          videos: true,
          blogs: true,
          articles: true,
          notes: true,
          codeExplanations: true,
          mathExplanations: true,
        },
      },
    },
  });

  if (!section) {
    return redirect("/")
  }

  if (!chapter) {
    return redirect("/")
  }

  const requiredFields = [
    section.title,
    section.videoUrl,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <div className={cn(
      "w-full min-h-[calc(100vh-4rem)]",
      "transition-colors duration-300"
    )}>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Unified header section with banner and navigation */}
        <div className={cn(
          "relative overflow-hidden",
          "rounded-xl border border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800",
          "shadow-sm"
        )}>
          {/* Back button */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`}
              className={cn(
                "inline-flex items-center",
                "px-3 py-2 text-sm font-medium",
                "bg-gray-50 dark:bg-gray-700",
                "hover:bg-gray-100 dark:hover:bg-gray-600",
                "text-gray-700 dark:text-gray-200",
                "rounded-lg",
                "border border-gray-200 dark:border-gray-600",
                "transition-all duration-200"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to chapter
            </Link>
          </div>
          
          {/* Section card */}
          <div className="pt-16 pb-6 px-6">
            <div className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center justify-between",
              "w-full"
            )}>
              <div className="flex flex-col gap-y-2 mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  Section Creation
                </h1>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Complete all fields {completionText}
                </span>
              </div>
              <SectionActions
                disabled={!isComplete}
                courseId={params.courseId}
                chapterId={params.chapterId}
                sectionId={params.sectionId}
                isPublished={section.isPublished}
              />
            </div>
          </div>
          
          {/* Publication status banner */}
          {!section.isPublished && (
            <div className={cn(
              "p-3 border-t border-gray-200 dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-900",
              "flex items-center justify-center"
            )}>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">This section is unpublished. It will not be visible in the course</span>
              </div>
            </div>
          )}
        </div>

        {/* Basic Section Information - Modern Layout */}
        <div className="mt-8">
          {/* Header with improved typography */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                Basic Section Information
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
              Configure essential settings for your section
            </p>
          </div>
          
          {/* Cards Grid with improved spacing and styling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Section Title Card */}
            <div className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-white via-gray-50 to-white",
              "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
              "border border-gray-200/60 dark:border-gray-700/60",
              "rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300 ease-out",
              "hover:border-gray-300 dark:hover:border-gray-600"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <SectionTitleForm
                  initialData={section}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                />
              </div>
            </div>

            {/* Access Settings Card */}
            <div className={cn(
              "group relative overflow-hidden",
              "bg-gradient-to-br from-white via-gray-50 to-white",
              "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
              "border border-gray-200/60 dark:border-gray-700/60",
              "rounded-xl shadow-sm hover:shadow-md",
              "transition-all duration-300 ease-out",
              "hover:border-gray-300 dark:hover:border-gray-600"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <SectionAccessForm
                  initialData={section}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  sectionId={params.sectionId}
                />
              </div>
            </div>
          </div>

          {/* Section Video Card - Full Width */}
          <div className={cn(
            "group relative overflow-hidden",
            "bg-gradient-to-br from-white via-gray-50 to-white",
            "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
            "border border-gray-200/60 dark:border-gray-700/60",
            "rounded-xl shadow-sm hover:shadow-md",
            "transition-all duration-300 ease-out",
            "hover:border-gray-300 dark:hover:border-gray-600"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "p-3 rounded-xl",
                  "bg-gradient-to-br from-violet-100 to-purple-100",
                  "dark:from-violet-900/50 dark:to-purple-900/50",
                  "border border-violet-200/50 dark:border-violet-700/50"
                )}>
                  <Video className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Section Video
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add a video to help students understand this section
                  </p>
                </div>
              </div>
              <SectionYoutubeVideoForm
                initialData={section}
                courseId={params.courseId}
                chapterId={params.chapterId}
                sectionId={params.sectionId}
              />
            </div>
          </div>
        </div>

        {/* Interactive Learning Content with TabsContainer */}
        <div className="mt-16">
          {/* Section Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              Interactive Learning Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Create interactive learning materials to help students understand complex concepts
            </p>
          </div>
            
          {/* Use the new TabsContainer component */}
          <TabsContainer 
            courseId={params.courseId} 
            chapterId={params.chapterId} 
            sectionId={params.sectionId}
            initialData={{
              chapter,
              codeExplanations: section.codeExplanations || [],
              mathExplanations: section.mathExplanations || [],
              videos: section.videos || [],
              blogs: section.blogs || [],
              articles: section.articles || [],
              notes: section.notes || []
            }}
          />
        </div>

        {/* Add vertical spacing */}
        <div className="mt-16 mb-8"></div>
        
      </div>
    </div>
  );
}

export default SectionIdPage;
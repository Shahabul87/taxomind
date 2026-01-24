"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CreateCourseInputSection } from "./create-course-input";
import { CourseCreatorSelection } from "./_components/course-creator-selection";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type CreatorMode = "selection" | "classic" | "ai";

export const CreateNewCoursePage = () => {
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get("title") || "";
  const [creatorMode, setCreatorMode] = useState<CreatorMode>("selection");

  const handleSelectAI = () => {
    // Pass the title param to AI creator if present
    const titleParam = initialTitle ? `?title=${encodeURIComponent(initialTitle)}` : "";
    window.location.href = `/teacher/create/ai-creator${titleParam}`;
  };

  const handleBack = () => {
    setCreatorMode("selection");
  };

  return (
    <section className="w-full">
      {/* Header - Only show when in classic mode */}
      <AnimatePresence mode="wait">
        {creatorMode === "classic" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6"
          >
            <button
              onClick={handleBack}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "text-sm text-slate-600 dark:text-slate-400",
                "hover:text-slate-900 dark:hover:text-white",
                "hover:bg-slate-100 dark:hover:bg-slate-700/50",
                "transition-colors"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Change method
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title - Always visible */}
      <div className="px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 border border-blue-200/30 dark:border-blue-700/20">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Create a Course
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {creatorMode === "selection"
                ? "Choose how you want to build your course"
                : "Manual course creation"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {creatorMode === "selection" && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <CourseCreatorSelection
              onSelectClassic={() => setCreatorMode("classic")}
              onSelectAI={handleSelectAI}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {creatorMode === "classic" && (
          <motion.div
            key="classic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CreateCourseInputSection onBack={handleBack} initialTitle={initialTitle} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

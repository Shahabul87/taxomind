"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GraduationCap, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimplifiedCourseWizard } from "../_components/simplified-course-wizard";
import Link from "next/link";
import { logger } from '@/lib/logger';

export const EnhancedCourseCreationPage = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCourseComplete = async (courseData: any) => {
    setIsCreating(true);
    
    try {
      // Simulate course creation with AI

      // Here you would typically make an API call to create the course
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success("Course created successfully with AI assistance!");
      
      // Redirect to the new course or courses list
      router.push("/teacher/courses");
      
    } catch (error) {
      logger.error("Course creation error:", error);
      toast.error("Failed to create course. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 dark:from-blue-600/10 dark:to-purple-700/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-bl from-indigo-400/15 to-pink-500/15 dark:from-indigo-600/8 dark:to-pink-700/8 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-gradient-to-tr from-purple-400/20 to-blue-500/20 dark:from-purple-600/10 dark:to-blue-700/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[length:32px_32px] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.02)_1px,transparent_1px)]"></div>
        
        {/* Moving gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent dark:via-blue-600/3 transform rotate-12 scale-150 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-500/5 to-transparent dark:via-purple-600/3 transform -rotate-12 scale-150 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 p-8 shadow-2xl shadow-blue-500/5 dark:shadow-blue-500/10">
          {/* Glass morphism effect overlays */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent dark:from-slate-700/20 pointer-events-none rounded-3xl"></div>
          <div className="absolute -top-px left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent dark:via-blue-500/30"></div>
          
          {/* Floating accent elements */}
          <div className="absolute top-4 right-8 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 dark:from-blue-500/20 dark:to-purple-600/20 blur-sm animate-pulse"></div>
          <div className="absolute bottom-6 right-16 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400/30 to-pink-500/30 dark:from-indigo-500/20 dark:to-pink-600/20 blur-sm animate-pulse animation-delay-2000"></div>
          <div className="absolute top-8 left-20 w-3 h-3 rounded-full bg-gradient-to-br from-purple-400/30 to-blue-500/30 dark:from-purple-500/20 dark:to-blue-600/20 blur-sm animate-pulse animation-delay-4000"></div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 dark:from-purple-600 dark:via-indigo-700 dark:to-blue-700 shadow-xl shadow-purple-500/25 dark:shadow-purple-500/20">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                {/* Floating micro-elements around icon */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 animate-pulse animation-delay-2000"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-800 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight">
                  AI-Enhanced Course Creator
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                  Create comprehensive courses with intelligent AI assistance
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100/80 via-yellow-100/80 to-orange-100/80 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 border border-amber-200/60 dark:border-amber-700/40 backdrop-blur-sm shadow-lg shadow-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  AI-Powered
                </span>
              </div>
              
              <Link href="/teacher/create">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-lg">
                  <ArrowLeft className="h-4 w-4" />
                  Classic Creator
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Course Creation Wizard */}
        <div className="relative">
          {/* Additional floating elements for depth */}
          <div className="absolute -top-20 left-1/4 w-60 h-60 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 dark:from-blue-600/5 dark:to-indigo-700/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 right-1/4 w-52 h-52 bg-gradient-to-bl from-purple-400/10 to-pink-500/10 dark:from-purple-600/5 dark:to-pink-700/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-indigo-400/8 to-blue-500/8 dark:from-indigo-600/4 dark:to-blue-700/4 rounded-full blur-2xl animate-pulse animation-delay-4000"></div>
          
          {/* Main content container with enhanced glass effect */}
          <div className="relative z-10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/30 shadow-2xl shadow-indigo-500/5 dark:shadow-indigo-500/10 overflow-hidden">
            {/* Top gradient border */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent dark:via-indigo-500/40"></div>
            
            {/* Content */}
            <div className="relative z-10 p-8">
              <SimplifiedCourseWizard
                onComplete={handleCourseComplete}
                isCreating={isCreating}
              />
            </div>
            
            {/* Bottom subtle glow */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent dark:via-blue-500/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from "react";
import Link from "next/link";
import { CreateBlogInputSection } from "./create-blog-input";
import { Sparkles, Lightbulb, BookOpenCheck, Brain, Zap, ArrowRight, PenLine, Feather } from "lucide-react";
import { cn } from "@/lib/utils";

export const CreateNewBlogPage = () => {
  return (
    <section className={cn(
      "min-h-[calc(100vh-8rem)] flex flex-col",
      "overflow-hidden rounded-xl shadow-2xl",
      "border border-indigo-200/30 dark:border-indigo-800/30",
      "relative"
    )}>
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-300/20 to-pink-300/10 dark:from-purple-900/20 dark:to-pink-900/10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-300/20 to-teal-300/10 dark:from-blue-900/20 dark:to-teal-900/10 blur-3xl transform -translate-x-1/3 translate-y-1/2"></div>
        
        {/* Animated floating elements */}
        <div className="absolute top-[10%] left-[15%] w-6 h-6 rounded-full bg-indigo-400/30 dark:bg-indigo-600/30 animate-float-slow"></div>
        <div className="absolute top-[30%] right-[10%] w-4 h-4 rounded-full bg-purple-400/30 dark:bg-purple-600/30 animate-float-medium"></div>
        <div className="absolute bottom-[20%] left-[25%] w-8 h-8 rounded-full bg-pink-400/20 dark:bg-pink-600/20 animate-float-fast"></div>
        
        {/* Decorative lines */}
        <div className="absolute top-[15%] left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-300/20 dark:via-indigo-600/20 to-transparent"></div>
        <div className="absolute top-[85%] left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300/20 dark:via-purple-600/20 to-transparent"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 md:px-10 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg blur opacity-30 animate-pulse-slow"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-indigo-200/50 dark:border-indigo-800/50">
              <Feather className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Create New Blog
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Express your ideas with the world</p>
          </div>
        </div>
        
        <div className={cn(
          "px-3 py-1.5 rounded-full text-xs",
          "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40",
          "text-indigo-600 dark:text-indigo-300",
          "border border-indigo-200 dark:border-indigo-700/50",
          "flex items-center gap-1.5 shadow-sm"
        )}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Creative Mode</span>
        </div>
      </div>

      {/* Timeline Steps - Redesigned */}
      <div className="relative z-10 flex items-center justify-center px-6 md:px-10 py-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between relative">
            <div className="h-1 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 absolute left-0 right-0 top-1/2 transform -translate-y-1/2 z-0 rounded-full"></div>
            {[
              { name: "Title", icon: PenLine, active: true },
              { name: "Content", icon: BookOpenCheck, active: false },
              { name: "Publish", icon: Zap, active: false }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "transition-all duration-300 shadow-md",
                  step.active 
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110" 
                    : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  step.active 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 px-6 md:px-10 py-6">
        {/* Form Container with Animation */}
        <div className={cn(
          "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md",
          "border border-gray-100/80 dark:border-gray-800/80",
          "rounded-2xl shadow-xl overflow-hidden",
          "transition-all duration-300 transform hover:shadow-2xl",
          "mx-auto w-full max-w-3xl"
        )}>
          <div className="p-6 md:p-8">
            <div className="mb-6 relative">
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 pl-3">
                What&apos;s your blog title?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm pl-3">
                Choose a title that captures attention and reflects your content.
              </p>
            </div>
            <CreateBlogInputSection />
          </div>
        </div>

        {/* Inspiration Cards - Redesigned */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto w-full max-w-3xl">
          {[
            { icon: Brain, title: "Knowledge Sharing", desc: "Share your expertise with people around the world." },
            { icon: Lightbulb, title: "Inspire Others", desc: "Your insights can spark ideas and change perspectives." },
            { icon: Zap, title: "Build Your Brand", desc: "Establish your reputation as a thought leader." }
          ].map((card, i) => (
            <div 
              key={i} 
              className={cn(
                "flex flex-col gap-3 p-4 rounded-xl",
                "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
                "border border-gray-100/80 dark:border-gray-700/80",
                "hover:shadow-md transition-all duration-300",
                "group"
              )}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 group-hover:from-indigo-200 group-hover:to-purple-200 dark:group-hover:from-indigo-800/40 dark:group-hover:to-purple-800/40 transition-colors duration-300">
                <card.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">{card.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-10 mt-auto border-t border-gray-200/50 dark:border-gray-800/50 p-4 flex justify-between items-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <Link href="/" className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          Cancel
        </Link>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Step 1 of 3: Set your title
        </span>
      </div>
    </section>
  );
}

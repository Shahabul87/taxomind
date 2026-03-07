"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Users,
  Star,
  ChevronDown,
  Sparkles,
  GraduationCap,
  Brain,
  Code2,
  BarChart3,
  Palette,
  Cloud,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedHeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
  userId?: string;
  categories?: Array<{ id: string; name: string; count: number }>;
}

const ROTATING_WORDS = ["your potential", "new skills", "your career", "with AI"];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Python": Code2,
  "AI/ML": Brain,
  "Web Development": Code2,
  "Machine Learning": Brain,
  "Data": BarChart3,
  "Design": Palette,
  "Cloud": Cloud,
  "business": BarChart3,
};

export function EnhancedHero({ statistics, userId, categories = [] }: EnhancedHeroProps) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setWordIndex((p) => (p + 1) % ROTATING_WORDS.length),
      3000,
    );
    return () => clearInterval(id);
  }, []);

  const showStats = statistics.totalCourses > 0;
  const hasLearners = statistics.totalEnrollments > 5;
  const hasRating = statistics.averageRating > 0;

  // Use real categories if available, otherwise show nothing
  const displayCategories = categories
    .filter((c) => c.count > 0)
    .slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-24 sm:pt-28 lg:pt-20 pb-12 sm:pb-16 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left: Headline + CTA */}
            <div className="max-w-xl">
              {/* Pill badge */}
              <div>
                <Badge
                  className="mb-6 px-4 py-1.5 bg-violet-500/15 text-violet-300 border-violet-500/25 backdrop-blur-sm text-xs font-medium"
                  variant="outline"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  AI-Powered Adaptive Learning
                </Badge>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Discover courses{" "}
                <br className="hidden sm:block" />
                that unlock{" "}
                <span className="relative inline-flex items-baseline">
                  {/* Invisible sizer to prevent layout shift — uses longest word */}
                  <span className="invisible" aria-hidden="true">your potential</span>
                  <span
                    key={wordIndex}
                    className="absolute left-0 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap transition-opacity duration-300"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-md">
                Learn at your own pace with personalized recommendations, expert instructors, and AI that adapts to how you learn.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-8">
                <Link
                  href={userId ? "/dashboard/user" : "/auth/register"}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 transition-all duration-200"
                >
                  {userId ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("main-content")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-500/30 text-slate-300 font-medium text-sm sm:text-base hover:bg-white/5 hover:border-slate-400/40 transition-all duration-200"
                >
                  <ChevronDown className="w-4 h-4" />
                  Browse Courses
                </button>
              </div>

              {/* Compact stats row - only show meaningful numbers */}
              {showStats && (
                <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-700/50">

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/15">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{statistics.totalCourses}</p>
                      <p className="text-xs text-slate-400">Courses</p>
                    </div>
                  </div>

                  {hasLearners && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/15">
                        <Users className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">
                          {statistics.totalEnrollments.toLocaleString()}+
                        </p>
                        <p className="text-xs text-slate-400">Learners</p>
                      </div>
                    </div>
                  )}

                  {hasRating && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/15">
                        <Star className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">
                          {statistics.averageRating.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-400">Avg. Rating</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Category quick-access cards */}
            <div className="hidden lg:block">
              {displayCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {displayCategories.map((category) => {
                    const IconComponent = CATEGORY_ICONS[category.name] || GraduationCap;
                    return (
                      <div key={category.id}>
                        <div
                          className="group relative p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.08] hover:border-violet-500/30 transition-all duration-300 cursor-pointer"
                          onClick={() =>
                            document
                              .getElementById("main-content")
                              ?.scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-colors">
                              <IconComponent className="w-5 h-5 text-violet-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-white truncate group-hover:text-violet-200 transition-colors capitalize">
                                {category.name}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {category.count} {category.count === 1 ? "course" : "courses"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Explore all card */}
                  <div className={cn(displayCategories.length % 2 === 0 && "col-span-2")}>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("main-content")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="w-full p-5 rounded-2xl border border-dashed border-violet-500/25 text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      Explore All Courses
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Illustration fallback when no categories */
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-sm aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl blur-2xl" />
                    <div className="relative p-8 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm flex flex-col items-center justify-center gap-4 h-full">
                      <GraduationCap className="w-16 h-16 text-violet-400/60" />
                      <p className="text-slate-400 text-center text-sm leading-relaxed">
                        Expert-crafted courses with adaptive AI tutoring to guide your learning journey
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

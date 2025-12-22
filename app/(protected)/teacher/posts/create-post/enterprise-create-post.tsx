"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreateBlogInputSection } from "./create-blog-input";
import {
  FileText,
  Save,
  X,
  Check,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Circle,
  CheckCircle2,
  Lock,
  Lightbulb,
  Target,
  AlertTriangle,
} from "lucide-react";

/**
 * Enterprise Create Post - Editorial Design System
 *
 * Design Philosophy:
 * - Clean, magazine-inspired typography
 * - Restrained color palette with purposeful accents
 * - Generous whitespace for visual breathing room
 * - Subtle animations that enhance, not distract
 * - Professional confidence without visual clutter
 */

interface StepConfig {
  id: number;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "complete" | "current" | "locked";
}

export default function EnterpriseCreatePost() {
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Step configuration
  const steps: StepConfig[] = useMemo(() => [
    {
      id: 1,
      label: "Title & Categories",
      description: "Define your post",
      icon: FileText,
      status: isValid ? "complete" : "current",
    },
    {
      id: 2,
      label: "Content",
      description: "Write your story",
      icon: Sparkles,
      status: "locked",
    },
    {
      id: 3,
      label: "Review & Publish",
      description: "Final review",
      icon: Target,
      status: "locked",
    },
  ], [isValid]);

  const currentStep = steps.find(s => s.status === "current") || steps[0];
  const completedSteps = steps.filter(s => s.status === "complete").length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  const handleSaveDraft = useCallback(() => {
    window.dispatchEvent(new Event("save-create-post-draft"));
    setLastSaved(new Date());
  }, []);

  const handleClearDraft = useCallback(() => {
    if (window.confirm("Clear all content? This cannot be undone.")) {
      window.dispatchEvent(new Event("clear-create-post-draft"));
    }
  }, []);

  // Listen for validity and submitting events from the form
  useEffect(() => {
    const onValidity = (e: Event) => {
      const detail = (e as CustomEvent).detail as { valid?: boolean };
      if (typeof detail?.valid === "boolean") setIsValid(detail.valid);
    };
    const onSubmitting = (e: Event) => {
      const detail = (e as CustomEvent).detail as { submitting?: boolean };
      if (typeof detail?.submitting === "boolean") setIsSubmitting(detail.submitting);
    };
    const onDraftSaved = () => setLastSaved(new Date());

    window.addEventListener("create-post-validity", onValidity);
    window.addEventListener("create-post-submitting", onSubmitting);
    window.addEventListener("draft-saved", onDraftSaved);

    return () => {
      window.removeEventListener("create-post-validity", onValidity);
      window.removeEventListener("create-post-submitting", onSubmitting);
      window.removeEventListener("draft-saved", onDraftSaved);
    };
  }, []);

  const triggerSubmit = useCallback(() => {
    const submitBtn = document.getElementById("create-post-submit") as HTMLButtonElement | null;
    if (submitBtn) submitBtn.click();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Subtle background texture */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIi8+Cjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+Cjwvc3ZnPg==')] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
        {/* Header */}
        <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Back Navigation */}
          <Link
            href="/teacher/posts/all-posts"
            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Posts</span>
          </Link>

          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-slate-900 dark:text-white tracking-tight">
                Create New Post
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400">
                Craft compelling content that engages your audience
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDraft}
                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Draft</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Progress Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-semibold transition-all",
                  progress > 0
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  {progress > 0 ? <Check className="w-5 h-5" /> : `${currentStep.id}`}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Step {currentStep.id} of {steps.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentStep.label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                  {progress}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>

            {/* Auto-save Indicator */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-save enabled</span>
              </div>
              {lastSaved && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Last saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          {/* Sidebar - Steps */}
          <aside className="hidden lg:block animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            <div className="sticky top-6 space-y-6">
              {/* Steps Card */}
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                  Progress
                </h3>
                <nav className="space-y-1">
                  {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div className={cn(
                          "absolute left-5 top-12 w-0.5 h-8 transition-colors",
                          step.status === "complete"
                            ? "bg-emerald-300 dark:bg-emerald-700"
                            : "bg-slate-200 dark:bg-slate-700"
                        )} />
                      )}

                      <button
                        disabled={step.status === "locked"}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                          step.status === "current" && "bg-slate-50 dark:bg-slate-800/50",
                          step.status === "locked" && "opacity-50 cursor-not-allowed",
                          step.status !== "locked" && "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                          step.status === "complete" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                          step.status === "current" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20",
                          step.status === "locked" && "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                        )}>
                          {step.status === "complete" ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : step.status === "locked" ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <step.icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            step.status === "current"
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-600 dark:text-slate-400"
                          )}>
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {step.status === "complete" ? "Completed" : step.status === "locked" ? "Coming soon" : step.description}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Pro Tips
                  </h3>
                </div>
                <ul className="space-y-2.5 text-xs text-amber-800 dark:text-amber-300/80">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>Use 5-9 words for optimal titles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>Select 3-5 relevant categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>Avoid emojis in titles</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Form Area */}
          <main className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Title & Categories
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Define the foundation of your post
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <CreateBlogInputSection />
              </div>
            </div>

            {/* Coming Soon Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-100/50 to-transparent dark:from-violet-900/20 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-tr-full" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-600 dark:text-violet-400 mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Rich Content Editor
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  A powerful WYSIWYG editor with AI assistance, media management,
                  and real-time collaboration is coming soon.
                </p>
                <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-xs font-medium text-violet-700 dark:text-violet-300">
                  <Circle className="w-2 h-2 fill-current animate-pulse" />
                  In Development
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Step Info - Mobile */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  {currentStep.id}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {currentStep.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step {currentStep.id} of {steps.length}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Link
                  href="/teacher/posts/all-posts"
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="hidden sm:flex gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={triggerSubmit}
                  disabled={!isValid || isSubmitting}
                  className={cn(
                    "gap-2 min-w-[120px] transition-all",
                    isValid
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                      : ""
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

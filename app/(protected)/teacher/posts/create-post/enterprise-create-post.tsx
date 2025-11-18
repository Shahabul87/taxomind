"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreateBlogInputSection } from "./create-blog-input";
import {
  FilePlus2,
  ShieldCheck,
  Save,
  XCircle,
  CheckCircle2,
  NotebookPen,
  ListChecks,
  Rocket,
  ChevronRight,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";

const steps = [
  { label: "Title & Categories", icon: NotebookPen, active: true, done: false },
  { label: "Content (Coming Soon)", icon: ListChecks, active: false, done: false },
  { label: "Review & Publish", icon: Rocket, active: false, done: false },
];

export default function EnterpriseCreatePost() {
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = useCallback(() => {
    window.dispatchEvent(new Event("save-create-post-draft"));
  }, []);

  const handleClearDraft = useCallback(() => {
    window.dispatchEvent(new Event("clear-create-post-draft"));
  }, []);

  const progress = useMemo(() => {
    const total = steps.length;
    const completed = isValid ? 1 : 0;
    const pct = Math.round((completed / total) * 100);
    return { total, completed, pct };
  }, [isValid]);

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
    window.addEventListener("create-post-validity", onValidity);
    window.addEventListener("create-post-submitting", onSubmitting);
    return () => {
      window.removeEventListener("create-post-validity", onValidity);
      window.removeEventListener("create-post-submitting", onSubmitting);
    };
  }, []);

  const triggerSubmit = useCallback(() => {
    try {
      (document.getElementById("create-post-submit") as HTMLButtonElement | null)?.click();
    } catch {}
  }, []);

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 max-w-7xl mx-auto">
      {/* Mobile Stepper - Only visible on mobile */}
      <div className="lg:hidden mb-3 sm:mb-4">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      step.active
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-md shadow-blue-500/30"
                        : step.done
                        ? "bg-emerald-500 border-emerald-400 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <step.icon className={cn(
                        "w-3.5 h-3.5 sm:w-4 sm:h-4",
                        step.active ? "text-white" : "text-slate-400 dark:text-slate-500"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] sm:text-xs mt-1.5 text-center font-medium",
                    step.active ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                  )}>
                    Step {idx + 1}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 sm:mx-2 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500",
                        step.done ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Mobile Header */}
      <div className="mb-3 sm:mb-4 md:mb-6">
        {/* Breadcrumb & Title */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link href="/teacher/posts/all-posts" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Posts
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 dark:text-slate-300">Create</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-indigo-500/40 blur-lg rounded-lg" />
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 shadow-lg">
                <FilePlus2 className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create New Post
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Build engaging content for your audience
              </p>
            </div>
          </div>
        </div>

        {/* Status & Actions Bar */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
          {/* Top section - Status badges and actions */}
          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Status indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200/60 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300 dark:border-amber-800/40 text-xs font-medium px-2.5 py-0.5 shadow-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  Draft
                </Badge>
                {isValid && (
                  <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200/60 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 dark:border-emerald-800/40 text-xs font-medium px-2.5 py-0.5 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Valid
                  </Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm flex-1 sm:flex-initial shadow-sm hover:shadow transition-all"
                >
                  <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                  <span className="hidden xs:inline">Save </span>Draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraft}
                  className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs sm:text-sm px-3 transition-all"
                >
                  <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Progress section */}
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Overall Progress
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {progress.pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${progress.pct}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Autosave info */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Auto-save enabled • Secure browser storage
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-3 sm:gap-4 md:gap-6">
        {/* Desktop Stepper - Hidden on mobile, visible on lg+ */}
        <aside className="hidden lg:block rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md p-4 h-fit sticky top-20">
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800" />
          </div>
          <div className="space-y-4 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    step.active
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/40"
                      : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 shadow-sm"
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn("text-sm font-semibold", step.active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {idx === 0 ? (isValid ? "Complete ✓" : "In progress...") : "Locked"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main form */}
        <main className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Main content card */}
          <section className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/30 dark:to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/50" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Title & Categories
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Craft a compelling title and select relevant categories to maximize discoverability.
              </p>
            </div>
            <div className="p-4 sm:p-5 md:p-6">
              <CreateBlogInputSection />
            </div>
          </section>

          {/* Upcoming features card */}
          <section className="rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 dark:from-blue-950/10 dark:via-indigo-950/10 dark:to-purple-950/10 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                  Content Editor Coming Soon
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  We&apos;re building a powerful rich-text editor with live preview, AI assistance, and media management. Stay tuned!
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Desktop Help Panel - Hidden on mobile, visible on lg+ */}
        <aside className="hidden lg:block rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md p-4 h-fit space-y-4 sticky top-20">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Quality Tips</h4>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Use 5–9 word titles with clear benefit</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Limit to 3–5 precise categories</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Avoid emojis or excessive punctuation</span>
              </li>
            </ul>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">SEO Optimization</h4>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
              <strong className="text-slate-700 dark:text-slate-300">Title length:</strong> Aim for 35–60 characters. Keep it descriptive and unique for better search rankings.
            </div>
          </div>
        </aside>
      </div>

      {/* Premium Sticky Footer */}
      <div className="sticky bottom-0 z-50 mt-4 sm:mt-6 -mx-3 sm:-mx-4 md:mx-0">
        <div className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Step 1 of 3
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Title & Categories
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5">
                <Link
                  href="/teacher/posts/all-posts"
                  className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm shadow-sm hover:shadow transition-all font-medium"
                >
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={triggerSubmit}
                  disabled={!isValid || isSubmitting}
                  className="text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-6"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
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

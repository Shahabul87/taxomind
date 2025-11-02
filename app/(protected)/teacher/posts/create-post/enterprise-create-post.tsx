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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div
        className={cn(
          "mb-6 rounded-3xl border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden",
          "border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
        )}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-lg" />
              <div className="relative w-12 h-12 rounded-lg border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
                <FilePlus2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Link href="/teacher/posts/all-posts" className="hover:text-slate-800 dark:hover:text-white transition-colors">Posts</Link>
                <ChevronRight className="w-3 h-3" />
                <span>Create</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Create New Post</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Set your title and categories. Content and publish steps coming soon.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40">Draft</Badge>
            <Button variant="outline" onClick={handleSaveDraft} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button variant="ghost" onClick={handleClearDraft} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50">
              <XCircle className="w-4 h-4 mr-2" /> Clear Draft
            </Button>
          </div>
        </div>
        <Separator className="opacity-50" />
        <div className="px-4 md:px-6 pb-2">
          <div className="h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 with-progress-shimmer"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">Progress: {progress.pct}%</div>
        </div>
        <div className="flex items-center gap-3 p-4 md:p-6">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <p className="text-xs text-slate-600 dark:text-slate-300">Autosave is enabled. Drafts are stored securely in your browser.</p>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_280px] gap-6">
        {/* Stepper */}
        <aside className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg p-4 h-fit">
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800" />
          </div>
          <div className="space-y-4 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border",
                    step.active
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-transparent shadow"
                      : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn("text-sm font-medium", step.active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>{step.label}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{idx === 0 ? (isValid ? "Complete" : "In progress") : "Locked"}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main form */}
        <main className="space-y-6">
          <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Title & Categories</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Craft a concise, descriptive title and add relevant categories to help discovery.</p>
            </div>
            <div className="p-5 md:p-6">
              <CreateBlogInputSection />
            </div>
          </section>

          <section className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Upcoming: Content editor & preview</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">We're bringing a full-featured editor and live preview next. For now, create your post with a strong title and categories.</p>
              </div>
            </div>
          </section>
        </main>

        {/* Right help panel */}
        <aside className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg p-4 h-fit space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Quality Tips</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              <li>Use 5–9 word titles with clear benefit.</li>
              <li>Limit to 3–5 precise categories.</li>
              <li>Avoid emojis or excessive punctuation in the title.</li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">SEO Readiness</h4>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Title length: Best between 35–60 chars. Keep it descriptive and unique.
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 z-40 mt-6">
        <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-t border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Step 1 of 3: Title & Categories
            </div>
            <div className="flex items-center gap-2">
              <Link href="/teacher/posts/all-posts" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:underline transition-colors">Cancel</Link>
              <Button variant="outline" onClick={handleSaveDraft} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm">
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button onClick={triggerSubmit} disabled={!isValid || isSubmitting} className="text-sm bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                {isSubmitting ? "Creating..." : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

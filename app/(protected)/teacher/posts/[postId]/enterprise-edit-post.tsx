"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PostActions } from "./_components/post-actions";
import { PostTitleForm } from "./_components/post-title-form";
import { PostCategory } from "./_components/post-category";
import { PostDescription } from "./_components/post-description";
import { PostChaptersForm } from "./_components/post-section-creation";
import { PostImageUpload } from "./_components/post-image-upload";
import { ReactErrorBoundary } from "@/components/react-error-boundary";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  Layout,
  PenLine,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Save,
  AlertTriangle,
} from "lucide-react";

interface ChapterLite {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  postId: string;
}

interface EnterpriseEditPostProps {
  postId: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  published: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  postChapters: ChapterLite[];
}

interface StepConfig {
  id: number;
  label: string;
  description: string;
  icon: React.ElementType;
  done: boolean;
}

export default function EnterpriseEditPost(props: EnterpriseEditPostProps) {
  const {
    postId,
    title,
    description,
    imageUrl,
    category,
    published,
    createdAt,
    updatedAt,
    postChapters,
  } = props;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Step configuration with completion status
  const steps: StepConfig[] = useMemo(() => {
    const hasTitle = !!title;
    const hasCategory = !!(category && category.length > 0);
    const hasDescription = !!description;
    const hasImage = !!imageUrl;
    const hasPublishedSection = postChapters.some((c) => c.isPublished);

    return [
      {
        id: 1,
        label: "Title & Category",
        description: hasTitle && hasCategory ? "Complete" : "Required fields",
        icon: PenLine,
        done: hasTitle && hasCategory,
      },
      {
        id: 2,
        label: "Description",
        description: hasDescription ? "Complete" : "Add a summary",
        icon: Layout,
        done: hasDescription,
      },
      {
        id: 3,
        label: "Content",
        description: hasPublishedSection ? "Has chapters" : "Add chapters",
        icon: FileText,
        done: hasPublishedSection,
      },
      {
        id: 4,
        label: "Cover Image",
        description: hasImage ? "Uploaded" : "Add cover",
        icon: ImageIcon,
        done: hasImage,
      },
    ];
  }, [title, category, description, imageUrl, postChapters]);

  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = completedSteps === totalSteps;

  const formatDate = (d?: string | Date) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Listen for save events
  useEffect(() => {
    const handleSave = () => setLastSaved(new Date());
    window.addEventListener("post-saved", handleSave);
    return () => window.removeEventListener("post-saved", handleSave);
  }, []);

  // Prepare initial data for forms
  const initialData = useMemo(
    () => ({
      id: postId,
      title: title ?? "",
      description: description ?? "",
      imageUrl: imageUrl ?? "",
      category: category ?? "",
      published,
      PostChapterSection: postChapters,
    }),
    [postId, title, description, imageUrl, category, published, postChapters]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-28">
        {/* Header Section */}
        <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Back Navigation */}
          <Link
            href="/teacher/posts/all-posts"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Posts</span>
          </Link>

          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="space-y-2">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <span>Posts</span>
                <ChevronRight className="w-3 h-3" />
                <span>Edit</span>
                <ChevronRight className="w-3 h-3" />
                <span className="truncate max-w-[200px] text-slate-600 dark:text-slate-400">
                  {title || "Untitled"}
                </span>
              </div>

              {/* Title */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Edit Post
                </h1>
                <Badge
                  className={cn(
                    "rounded-full text-xs font-medium px-3 py-1",
                    published
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                  )}
                >
                  {published ? "Published" : "Draft"}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs"
                >
                  {completedSteps}/{totalSteps}
                </Badge>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Updated {formatDate(updatedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Previewable
                </span>
                {lastSaved && (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <Save className="w-3.5 h-3.5" />
                    Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href={`/blog/${postId}`}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Preview
              </Link>
              <PostActions
                disabled={!isComplete}
                postId={postId}
                isPublished={published}
              />
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-semibold transition-all",
                    isComplete
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-violet-500/10 text-violet-600"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span>{completedSteps}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {isComplete ? "Ready to publish" : `${completedSteps} of ${totalSteps} complete`}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isComplete ? "All requirements met" : "Complete all sections to publish"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                  {progress}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                  isComplete
                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                    : "bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400"
                )}
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
          </div>

          {/* Unpublished Banner */}
          {!published && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 dark:border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This post is unpublished. It will not be visible to readers until you publish it.
              </p>
            </div>
          )}
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6 lg:gap-8">
          {/* Left Sidebar - Steps */}
          <aside className="hidden lg:block animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            <div className="sticky top-6 space-y-6">
              {/* Steps Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">
                  Completion
                </h3>
                <nav className="space-y-1">
                  {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-5 top-12 w-0.5 h-6 transition-colors",
                            step.done
                              ? "bg-emerald-500/50"
                              : "bg-slate-200 dark:bg-slate-700"
                          )}
                        />
                      )}

                      <div
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          step.done
                            ? "bg-emerald-500/5"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                            step.done
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {step.done ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <step.icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              step.done
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            {/* Title & Category Section */}
            <ReactErrorBoundary name="Title & Category">
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600">
                      <PenLine className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Title & Category
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Define your post&apos;s identity
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <PostTitleForm initialData={initialData} postId={postId} />
                  <PostCategory initialData={initialData} postId={postId} />
                </div>
              </section>
            </ReactErrorBoundary>

            {/* Description Section */}
            <ReactErrorBoundary name="Description">
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Description
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Write a compelling summary
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <PostDescription initialData={initialData} postId={postId} />
                </div>
              </section>
            </ReactErrorBoundary>

            {/* Content Section */}
            <ReactErrorBoundary name="Post Content">
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Post Content
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Create and organize chapters
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <PostChaptersForm
                    initialData={{ ...initialData, postchapter: postChapters }}
                    postId={postId}
                  />
                </div>
              </section>
            </ReactErrorBoundary>

            {/* Cover Image Section */}
            <ReactErrorBoundary name="Cover Image">
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Cover Image
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Upload an eye-catching cover
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <PostImageUpload initialData={initialData} postId={postId} />
                </div>
              </section>
            </ReactErrorBoundary>
          </main>

          {/* Right Sidebar - Info Panel */}
          <aside className="hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
            <div className="sticky top-6 space-y-6">
              {/* Post Info */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                  Post Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Created</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatDate(createdAt)}
                    </span>
                  </div>
                  <Separator className="bg-slate-200 dark:bg-slate-800" />
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Updated</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatDate(updatedAt)}
                    </span>
                  </div>
                  <Separator className="bg-slate-200 dark:bg-slate-800" />
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Chapters</span>
                    <span className="text-slate-900 dark:text-white">
                      {postChapters.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Tips */}
              <div className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-2xl border border-violet-500/20 dark:border-violet-500/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Quality Tips
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <span>Clear titles beat clever ones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <span>Keep descriptions under 160 characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <span>Use consistent chapter naming</span>
                  </li>
                </ul>
              </div>

              {/* Save Note */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Changes are saved automatically when you click Save on each section.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Progress Info */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold",
                    isComplete
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-violet-500/10 text-violet-600"
                  )}
                >
                  {completedSteps}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {isComplete ? "Ready to publish" : `${completedSteps} of ${totalSteps} complete`}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {progress}% progress
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
                <Link
                  href={`/blog/${postId}`}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Preview
                </Link>
                <PostActions
                  disabled={!isComplete}
                  postId={postId}
                  isPublished={published}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

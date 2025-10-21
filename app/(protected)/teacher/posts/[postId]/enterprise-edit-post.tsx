"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Banner } from "@/components/banner";
import { PostActions } from "./_components/post-actions";
import { PostTitleForm } from "./_components/post-title-form";
import { PostCategory } from "./_components/post-category";
import { PostDescription } from "./_components/post-description";
import { PostChaptersForm } from "./_components/post-section-creation";
import { PostImageUpload } from "./_components/post-image-upload";
import { CheckCircle2, ChevronRight, Circle, Clock, Eye, FileText, Image, Layout, NotebookPen } from "lucide-react";

type ChapterLite = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  postId: string;
};

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

export default function EnterpriseEditPost(props: EnterpriseEditPostProps) {
  const { postId, title, description, imageUrl, category, published, createdAt, updatedAt, postChapters } = props;

  const steps = useMemo(() => {
    const hasTitle = !!title;
    const hasCategory = !!(category && category.length > 0);
    const hasDescription = !!description;
    const hasImage = !!imageUrl;
    const hasPublishedSection = postChapters.some((c) => c.isPublished);
    return [
      { label: "Title & Category", icon: NotebookPen, done: hasTitle && hasCategory },
      { label: "Description", icon: Layout, done: hasDescription },
      { label: "Content", icon: FileText, done: hasPublishedSection },
      { label: "Cover Image", icon: Image, done: hasImage },
    ];
  }, [title, category, description, imageUrl, postChapters]);

  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / total) * 100);
  const completionText = `(${completed}/${total})`;

  const formattedDate = (d?: string | Date) => (d ? new Date(d).toLocaleString() : "");

  const initialData: any = {
    id: postId,
    title: title ?? "",
    description: description ?? "",
    imageUrl: imageUrl ?? "",
    category: category ?? "",
    published,
    PostChapterSection: postChapters,
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 rounded-xl border bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200/70 dark:border-gray-800/70 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/teacher/posts/all-posts" className="hover:text-gray-700 dark:hover:text-gray-300">Posts</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Edit</span>
              <ChevronRight className="w-3 h-3" />
              <span className="truncate max-w-[24ch]" title={title ?? postId}>{title || postId}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">Edit Post</h1>
              <Badge className={cn(
                "rounded-full",
                published
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40"
                  : "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40"
              )}>
                {published ? "Published" : "Draft"}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs">{completionText}</Badge>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Updated {formattedDate(updatedAt)}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Previewable</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/blog/${postId}`} className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Preview</Link>
            <PostActions disabled={completed !== total} postId={postId} isPublished={published} />
          </div>
        </div>
        {/* Progress Bar */}
        <div className="px-4 md:px-6 pb-4">
          <div className="h-1.5 w-full rounded-full bg-gray-200/70 dark:bg-gray-800/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Progress: {pct}%</div>
        </div>
        {!published && (
          <div className="px-4 md:px-6 pb-4">
            <Banner label="This post is unpublished. It will not be visible to readers." />
          </div>
        )}
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_280px] gap-6">
        {/* Stepper */}
        <aside className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-4 h-fit">
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800" />
          </div>
          <div className="space-y-4 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border",
                  step.done
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent"
                    : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                )}>
                  {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className={cn("text-sm font-medium", step.done ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300")}>{step.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{step.done ? "Complete" : "Pending"}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* Title & Category */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Title & Category</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your title and categories for better discovery.</p>
            </div>
            <div className="p-5 md:p-6 space-y-6">
              <PostTitleForm initialData={initialData} postId={postId} />
              <PostCategory initialData={initialData} postId={postId} />
            </div>
          </section>

          {/* Description */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Write a concise summary to entice readers.</p>
            </div>
            <div className="p-5 md:p-6">
              <PostDescription initialData={initialData} postId={postId} />
            </div>
          </section>

          {/* Content Sections */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Post Content</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and reorder chapters to structure your post.</p>
            </div>
            <div className="p-5 md:p-6">
              <PostChaptersForm initialData={{ ...initialData, postchapter: postChapters }} postId={postId} />
            </div>
          </section>

          {/* Image */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-200/70 dark:border-gray-800/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Cover Image</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload or change your post cover image.</p>
            </div>
            <div className="p-5 md:p-6">
              <PostImageUpload initialData={initialData} postId={postId} />
            </div>
          </section>
        </main>

        {/* Right info panel */}
        <aside className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-4 h-fit space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Post Info</h4>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div>Created: {formattedDate(createdAt)}</div>
              <div>Updated: {formattedDate(updatedAt)}</div>
              <div>Sections: {postChapters.length}</div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quality Tips</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc pl-5">
              <li>Title clarity beats cleverness; avoid jargon.</li>
              <li>Keep description under 160 characters for SEO.</li>
              <li>Use consistent chapter naming and order.</li>
            </ul>
          </div>
          <Separator />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Changes save per section when you click Save.
          </div>
        </aside>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-40 mt-6">
        <div className="backdrop-blur bg-white/70 dark:bg-gray-900/70 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">Completion {completionText}</div>
            <div className="flex items-center gap-2">
              <Link href="/teacher/posts/all-posts" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Cancel</Link>
              <Link href={`/blog/${postId}`} className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Preview</Link>
              <PostActions disabled={completed !== total} postId={postId} isPublished={published} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


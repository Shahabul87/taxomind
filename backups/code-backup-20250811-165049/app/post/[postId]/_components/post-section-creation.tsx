"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, LayoutList, BookOpen, FileText, GripVertical, Sparkles } from "lucide-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Post, Chapter } from "@prisma/client";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PostChapterList from "./post-chapter-list";

interface ChaptersFormProps {
  initialData: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    postchapter: {
      id: string;
      title: string;
      description: string | null;
      position: number;
      isPublished: boolean;
      createdAt: Date;
      updatedAt: Date;
      isFree: boolean;
      postId: string;
    }[];
  };
  postId: string;
}

const formSchema = z.object({
  title: z.string().min(1),
});

export const PostChaptersForm = ({
  initialData,
  postId
}: ChaptersFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  // Reset form when entering creation mode
  useEffect(() => {
    if (isCreating) {
      form.reset({ title: "" });
    }
  }, [isCreating, form]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/posts/${postId}/postchapters`, values);
      toast.success("Chapter created");
      setIsCreating(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  }, [postId, router]);

  const toggleCreating = useCallback(() => {
    setIsCreating((current) => !current);
  }, []);

  const onReorder = useCallback(async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/posts/${postId}/postchapters/reorder`, {
        list: updateData
      });
      
      toast.success("Chapters reordered");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  }, [postId, router]);

  const onEdit = useCallback((postchapterId: string) => {
    router.push(`/post/${postId}/postchapters/${postchapterId}`);
  }, [postId, router]);

  const onDelete = useCallback(async (postchapterId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}/postchapters/${postchapterId}`);
      toast.success("Chapter deleted");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  }, [postId, router]);

  const chapterList = useMemo(() => (
    <PostChapterList
      onEdit={onEdit}
      onReorder={onReorder}
      onDelete={onDelete}
      items={initialData.postchapter || []}
    />
  ), [initialData.postchapter, onEdit, onReorder, onDelete]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-300/30 dark:border-violet-700/30 backdrop-blur-sm shadow-2xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-50 to-violet-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950/20">
      {/* Futuristic decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Geometric shapes */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-violet-200/20 to-indigo-200/10 dark:from-violet-800/10 dark:to-indigo-900/5 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-pink-200/10 to-cyan-200/10 dark:from-pink-900/5 dark:to-cyan-900/5 blur-3xl"></div>
        
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(120,86,255,0.05)_90deg,transparent_180deg)] dark:bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(120,86,255,0.08)_90deg,transparent_180deg)]"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: "linear-gradient(to right, rgba(120,86,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,86,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px" 
        }}></div>
        
        {/* Floating dots (simulating particles) */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-violet-400/40 dark:bg-violet-400/20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-indigo-400/40 dark:bg-indigo-400/20 animate-pulse" style={{ animationDelay: "1.2s" }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 rounded-full bg-sky-400/40 dark:bg-sky-400/20 animate-pulse" style={{ animationDelay: "0.8s" }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-purple-400/40 dark:bg-purple-400/20 animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      </div>
      
      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="relative px-6 py-4 rounded-xl overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border border-violet-200/50 dark:border-violet-800/30">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-indigo-500/10 animate-gradient-x"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-violet-700 dark:text-violet-300">Processing Changes</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Reordering your chapters...</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 p-6 sm:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-start gap-5">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg transform perspective-800 group-hover:rotate-y-12 transition-transform duration-300">
                <BookOpen className="h-7 w-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Post Chapters
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">
                  {initialData.postchapter.length || 0} Sections
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                Craft your content narrative with interactive, drag-and-drop sections
              </p>
            </div>
          </div>
          <div className="relative group">
            <div className={cn(
              "absolute -inset-0.5 rounded-xl blur-sm group-hover:blur transition-all duration-300",
              isCreating ? "bg-gray-300 dark:bg-gray-700" : "bg-gradient-to-r from-violet-400 to-indigo-400 opacity-70"
            )}></div>
            <Button
              onClick={toggleCreating}
              variant={isCreating ? "secondary" : "default"}
              className={cn(
                "relative rounded-xl transition-all duration-300 z-10 border-0",
                isCreating 
                  ? "bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200" 
                  : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
              )}
            >
              <span className="relative flex items-center">
                {isCreating ? (
                  <>Cancel</>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                    <span>Add Chapter</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>

        {/* Creation Form */}
        {isCreating && (
          <div className="mb-8 relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-300/20 via-purple-300/20 to-indigo-300/20 dark:from-violet-900/10 dark:via-purple-900/10 dark:to-indigo-900/10 blur-lg"></div>
            <div className="relative backdrop-blur-sm rounded-2xl p-6 border border-violet-200/50 dark:border-violet-800/30 bg-white/80 dark:bg-gray-900/80 shadow-lg">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 flex items-center justify-center border border-violet-200 dark:border-violet-800/50">
                  <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-base font-medium bg-gradient-to-r from-violet-700 to-indigo-600 dark:from-violet-500 dark:to-indigo-400 bg-clip-text text-transparent">Create New Chapter</h3>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-violet-500/30 to-indigo-500/30 dark:from-violet-500/20 dark:to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder="Enter chapter title..."
                              className="relative border-violet-200 dark:border-violet-800/50 focus:border-violet-300 dark:focus:border-violet-700 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-200 rounded-lg py-2.5 px-4"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-xs mt-1.5" />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={toggleCreating}
                      className="text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-300"
                    >
                      Cancel
                    </Button>
                    <div className="relative group">
                      <div className={cn(
                        "absolute -inset-0.5 rounded-md bg-gradient-to-r from-violet-500 to-indigo-500 blur-sm group-hover:blur-md transition-all duration-300",
                        !isValid || isSubmitting ? "opacity-30" : "opacity-70"
                      )}></div>
                      <Button
                        disabled={!isValid || isSubmitting}
                        type="submit"
                        className="relative bg-white dark:bg-gray-950 hover:bg-white dark:hover:bg-gray-950 text-violet-700 dark:text-violet-300 border-0 shadow-md z-10"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Create Chapter</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}

        {/* Chapters List */}
        <div className={cn(
          "relative",
          !initialData.postchapter.length ? "text-sm italic text-gray-500 dark:text-gray-400 text-center py-10" : ""
        )}>
          {!initialData.postchapter.length ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-300/10 via-purple-300/10 to-indigo-300/10 dark:from-violet-900/5 dark:via-purple-900/5 dark:to-indigo-900/5 blur-lg"></div>
              <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl py-12 px-8 border border-dashed border-violet-200 dark:border-violet-800/30 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400/30 to-indigo-400/30 dark:from-violet-400/20 dark:to-indigo-400/20 blur-md animate-pulse"></div>
                  <div className="relative rounded-full bg-gradient-to-br from-white to-violet-50 dark:from-gray-900 dark:to-violet-950/50 p-5 border border-violet-200/50 dark:border-violet-800/30 shadow-inner shadow-violet-200/30 dark:shadow-violet-900/10">
                    <Sparkles className="h-12 w-12 text-violet-500 dark:text-violet-400" />
                  </div>
                </div>
                <div className="text-center max-w-sm space-y-2">
                  <h3 className="text-xl font-medium bg-gradient-to-r from-violet-700 to-indigo-600 dark:from-violet-500 dark:to-indigo-400 bg-clip-text text-transparent">
                    Start Your Content Journey
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create your first chapter to begin structuring your post content
                  </p>
                </div>
                <div className="relative mt-6 group">
                  <div className="absolute -inset-0.5 rounded-md bg-gradient-to-r from-violet-500 to-indigo-500 opacity-70 blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <Button 
                    onClick={toggleCreating}
                    variant="outline" 
                    className="relative bg-white dark:bg-gray-950 hover:bg-white/90 dark:hover:bg-gray-900/90 text-violet-700 dark:text-violet-300 border-0 shadow-md z-10"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Chapter
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-300/10 via-purple-300/10 to-indigo-300/10 dark:from-violet-900/5 dark:via-purple-900/5 dark:to-indigo-900/5 blur-lg"></div>
              <div className="relative backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-violet-200/50 dark:border-violet-800/30 bg-white/70 dark:bg-gray-900/70 shadow-lg">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-violet-100 dark:border-violet-900/20">
                  <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Chapter Organization</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Drag and drop to rearrange your content flow</p>
                  </div>
                </div>
                <div className="relative">
                  {chapterList}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
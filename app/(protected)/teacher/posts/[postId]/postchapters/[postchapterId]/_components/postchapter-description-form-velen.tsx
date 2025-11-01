"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Edit3, Check, X, Loader2, FileText } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";

interface PostChapterDescriptionFormVelenProps {
  initialData: {
    description: string | null;
  };
  postchapterId: string;
  postId: string;
}

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

export const PostchapterDescriptionFormVelen = ({
  initialData,
  postchapterId,
  postId,
}: PostChapterDescriptionFormVelenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);
      await axios.patch(`/api/posts/${postId}/postchapters/${postchapterId}`, values);

      toast.success("Description updated", {
        description: "Your changes have been saved",
        icon: <Check className="h-4 w-4" />
      });

      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update description", {
        description: "Please try again"
      });
    } finally {
      setIsSaving(false);
    }
  }, [postId, postchapterId, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && isValid) {
          form.handleSubmit(onSubmit)();
        }
      }
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
        form.reset({ description: initialData?.description || "" });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isValid, form, initialData, onSubmit]);

  return (
    <div className="mt-4">
      {!isEditing ? (
        <div className="group flex flex-col gap-4">
          <div className="flex-1">
            {!initialData.description ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <FileText className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No description yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Add detailed content to help readers understand this chapter
                  </p>
                </div>
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="p-5 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <Preview value={initialData.description} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg",
                "text-sm font-medium",
                "text-slate-600 dark:text-slate-400",
                "hover:text-violet-600 dark:hover:text-violet-400",
                "hover:bg-violet-50 dark:hover:bg-violet-950/30",
                "transition-all duration-200"
              )}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              {initialData.description ? "Edit Description" : "Add Description"}
            </Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                      <Editor
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-sm text-rose-500 dark:text-rose-400" />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  disabled={!isValid || isSubmitting || isSaving}
                  type="submit"
                  size="sm"
                  className={cn(
                    "h-9 px-4 rounded-lg",
                    "bg-violet-500 hover:bg-violet-600",
                    "text-white font-medium",
                    "shadow-sm shadow-violet-500/20",
                    "hover:shadow-md hover:shadow-violet-500/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200"
                  )}
                >
                  {(isSubmitting || isSaving) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset({ description: initialData?.description || "" });
                  }}
                  disabled={isSubmitting || isSaving}
                  className={cn(
                    "h-9 px-4 rounded-lg",
                    "text-slate-600 dark:text-slate-400",
                    "hover:text-slate-900 dark:hover:text-slate-100",
                    "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>

              {/* Keyboard hint */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono">
                  ⌘S
                </kbd>
                <span>to save</span>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

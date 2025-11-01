"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Edit3, Check, X, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PostchapterTitleFormVelenProps {
  initialData: {
    title: string;
  };
  postId: string;
  chapterId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }).max(100, {
    message: "Title must be less than 100 characters"
  }),
});

export const PostchapterTitleFormVelen = ({
  initialData,
  postId,
  chapterId,
}: PostchapterTitleFormVelenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);
      await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}`, values);

      toast.success("Title updated", {
        description: "Your changes have been saved",
        icon: <Check className="h-4 w-4" />
      });

      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update title", {
        description: "Please try again"
      });
    } finally {
      setIsSaving(false);
    }
  }, [postId, chapterId, router]);

  // Auto-save on Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && isValid) {
          form.handleSubmit(onSubmit)();
        }
      }
      // Escape to cancel
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
        form.reset(initialData);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isValid, form, initialData, onSubmit]);

  return (
    <div className="mt-4">
      {!isEditing ? (
        <div className="group flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {initialData.title ? (
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 break-words">
                {initialData.title}
              </p>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No title provided yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Click &quot;Add Title&quot; to get started
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-shrink-0 opacity-0 group-hover:opacity-100",
              "h-8 px-3 rounded-lg",
              "text-sm font-medium",
              "text-slate-600 dark:text-slate-400",
              "hover:text-violet-600 dark:hover:text-violet-400",
              "hover:bg-violet-50 dark:hover:bg-violet-950/30",
              "transition-all duration-200"
            )}
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            {initialData.title ? "Edit" : "Add Title"}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="Enter a compelling chapter title..."
                        autoFocus
                        className={cn(
                          "h-11 pl-4 pr-4",
                          "text-base font-medium",
                          "bg-white dark:bg-slate-900",
                          "border-slate-300 dark:border-slate-700",
                          "focus:border-violet-500 dark:focus:border-violet-500",
                          "focus:ring-2 focus:ring-violet-500/20",
                          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          "transition-all duration-200"
                        )}
                      />
                      {/* Character count */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className={cn(
                          "text-xs font-medium tabular-nums",
                          field.value?.length > 90 ? "text-amber-500" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {field.value?.length || 0}/100
                        </span>
                      </div>
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
                      Save
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset(initialData);
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
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono">
                  Esc
                </kbd>
                <span>to cancel</span>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

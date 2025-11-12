"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TitleFormProps {
  initialData: {
    title: string;
    description?: string;
  };
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }).max(100, {
    message: "Title must be less than 100 characters",
  }),
});

export const TitleForm = ({
  initialData,
  courseId
}: TitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingSamData, setPendingSamData] = useState<{ title?: string; name?: string; courseTitle?: string } | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  // Listen for SAM form population events
  useEffect(() => {
    const handleSamFormPopulation = (event: CustomEvent) => {
      if (event.detail?.formId === 'course-title-form' ||
          event.detail?.formId === 'course-title' ||
          event.detail?.formId === 'update-course-title' ||
          event.detail?.formId === 'update-title' ||
          event.detail?.formId === 'title-form') {

        // Auto-open edit mode when SAM tries to populate
        setIsEditing(true);

        // Store the data to be populated
        if (event.detail?.data?.title || event.detail?.data?.name || event.detail?.data?.courseTitle) {
          setPendingSamData(event.detail.data);
        }
      }
    };

    window.addEventListener('sam-populate-form', handleSamFormPopulation as EventListener);

    return () => {
      window.removeEventListener('sam-populate-form', handleSamFormPopulation as EventListener);
    };
  }, []);

  // Handle pending SAM data when form is ready
  useEffect(() => {
    if (pendingSamData && isEditing && form) {
      const titleValue = pendingSamData.title || pendingSamData.name || pendingSamData.courseTitle;
      if (titleValue) {
        form.setValue("title", titleValue);
        form.trigger("title");

        // Dispatch success event
        window.dispatchEvent(new CustomEvent('sam-form-populated', {
          detail: {
            formId: 'course-title-form',
            success: true
          }
        }));

        // Clear pending data
        setPendingSamData(null);
      }
    }
  }, [pendingSamData, isEditing, form]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course title updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      logger.error("Title update error:", error);
      toast.error("Failed to update course title");
    }
  }, [courseId, router]);

  const characterCount = form.watch("title")?.length || 0;
  const maxCharacters = 100;

  // Keyboard shortcut handler (Cmd/Ctrl + S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        if (isValid && !isSubmitting) {
          form.handleSubmit(onSubmit)();
        }
      }
      // ESC to cancel
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
        form.reset();
      }
    };

    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, isValid, isSubmitting, form, onSubmit]);

  return (
    <div className="space-y-4">
      {/* Hidden metadata for SAM to detect the form even when not in edit mode */}
      <div
        data-sam-form-metadata="course-title"
        data-form-id="course-title-form"
        data-form-purpose="update-course-title"
        data-form-alternate-id="update-title"
        data-form-type="title"
        data-entity-type="course"
        data-entity-id={courseId}
        data-current-value={initialData?.title || ""}
        data-is-editing={isEditing.toString()}
        data-field-name="title"
        data-field-type="text"
        style={{ display: 'none' }}
      />

      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-300">
            <div className="flex-1 min-w-0">
              {initialData.title ? (
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-medium leading-relaxed tracking-normal break-words text-slate-700 dark:text-slate-300">
                    {initialData.title}
                  </h3>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 shadow-sm">
                    <span className="font-semibold tabular-nums">{characterCount}</span>
                    <span className="opacity-70">/ 100 chars</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-3 rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 px-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                      No title set
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-3">
                    Add a clear, descriptive title that captures what students will learn. Make it compelling and searchable.
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className={cn(
                "flex-shrink-0 h-9 px-4",
                "bg-white/80 dark:bg-slate-800/80",
                "border-slate-200 dark:border-slate-700",
                "text-slate-700 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "hover:border-purple-300 dark:hover:border-purple-600",
                "hover:text-purple-600 dark:hover:text-purple-400",
                "font-semibold text-sm",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                "backdrop-blur-sm"
              )}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <Form {...form}>
            <form
              id="course-title-form"
              data-form="course-title"
              data-purpose="update-course-title"
              data-entity-type="course"
              data-entity-id={courseId}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          name="title"
                          disabled={isSubmitting}
                          placeholder="e.g., Advanced Web Development with React"
                          autoFocus
                          data-field-purpose="course-title"
                          data-validation="required,min:1,max:100"
                          data-content-type="course-title"
                          className={cn(
                            "pr-20",
                            "bg-white dark:bg-slate-900",
                            "border border-slate-300/60 dark:border-slate-600/60",
                            "text-slate-900 dark:text-slate-100",
                            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                            "focus:border-slate-400/70 dark:focus:border-slate-500/70",
                            "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                            "text-base font-normal",
                            "h-11",
                            "rounded-md",
                            "transition-all duration-200"
                          )}
                        />
                        <div
                          className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            "px-2.5 py-1 rounded-md text-xs font-bold",
                            "transition-colors duration-200",
                            characterCount > maxCharacters
                              ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                              : characterCount > maxCharacters * 0.8
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {characterCount}/{maxCharacters}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-rose-600 dark:text-rose-400 text-sm font-medium" />
                  </FormItem>
                )}
              />

              {/* Action buttons with keyboard shortcuts hint */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    disabled={!isValid || isSubmitting}
                    type="submit"
                    size="sm"
                    className={cn(
                      "flex-1 sm:flex-initial h-10",
                      "bg-gradient-to-r from-purple-600 to-indigo-600",
                      "hover:from-purple-700 hover:to-indigo-700",
                      "text-white font-bold",
                      "shadow-lg hover:shadow-xl",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                      "rounded-lg"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 sm:flex-initial h-10",
                      "text-slate-700 dark:text-slate-300",
                      "border-slate-300 dark:border-slate-600",
                      "bg-white dark:bg-slate-800",
                      "hover:bg-slate-50 dark:hover:bg-slate-700",
                      "hover:border-slate-400 dark:hover:border-slate-500",
                      "font-semibold",
                      "transition-all duration-200",
                      "rounded-lg"
                    )}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <kbd className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">
                    {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+S
                  </kbd>
                  <span>to save</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <kbd className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">
                    Esc
                  </kbd>
                  <span>to cancel</span>
                </div>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

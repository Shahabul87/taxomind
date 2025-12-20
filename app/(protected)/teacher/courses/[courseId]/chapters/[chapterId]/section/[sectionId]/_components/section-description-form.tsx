"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TipTapEditor from "@/components/tiptap/editor";
import { AISectionContentGenerator } from "./ai-section-content-generator";

interface CourseContext {
  title: string;
  description: string | null;
  whatYouWillLearn: string[];
  courseGoals: string | null;
  difficulty: string | null;
  category: string | null;
}

interface ChapterContext {
  description: string | null;
  learningOutcomes: string | null;
  position: number;
}

interface SectionContext {
  position: number;
  existingDescription: string | null;
  existingObjectives: string | null;
}

interface SectionDescriptionFormProps {
  initialData: {
    description: string | null;
    title: string;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
  chapterTitle: string;
  courseContext?: CourseContext;
  chapterContext?: ChapterContext;
  sectionContext?: SectionContext;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const SectionDescriptionForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
  chapterTitle,
  courseContext,
  chapterContext,
  sectionContext,
}: SectionDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncatedContent, setTruncatedContent] = useState("");
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  // Prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle content truncation
  useEffect(() => {
    if (!isMounted) return;

    const truncateHtml = (html: string, maxLength: number) => {
      if (typeof window === 'undefined') return html;

      const div = document.createElement('div');
      div.innerHTML = html || '';
      const text = div.textContent || div.innerText;
      if (text.length <= maxLength) return html;
      return text.substring(0, maxLength).trim() + '...';
    };

    if (initialData.description) {
      setTruncatedContent(isExpanded
        ? initialData.description
        : truncateHtml(initialData.description, 300)
      );
    }
  }, [isExpanded, initialData.description, isMounted]);

  const handleAIGenerate = (content: string) => {
    form.setValue("description", content);
    form.trigger("description");
    if (!isEditing) {
      setIsEditing(true);
    }
    toast.success("Description generated! You can edit it before saving.");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`, values);
      toast.success("Section updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Description content - full width */}
            <div className="flex-1 min-w-0 w-full">
              {!initialData.description ? (
                <div className="space-y-2 sm:space-y-2.5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 px-2.5 sm:px-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No description set
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-2.5 sm:px-3">
                    Provide a detailed description of what this section covers and what students will learn.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5 w-full">
                  <div
                    className={cn(
                      "prose prose-sm max-w-none w-full",
                      "text-slate-700 dark:text-slate-300",
                      "[&_p]:text-xs sm:[&_p]:text-sm [&_p]:text-slate-700 dark:[&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-2 sm:[&_p]:mb-3",
                      "[&_h1]:text-base sm:[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-800 dark:[&_h1]:text-slate-200 [&_h1]:mb-2 sm:[&_h1]:mb-3",
                      "[&_h2]:text-sm sm:[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-800 dark:[&_h2]:text-slate-200 [&_h2]:mb-1.5 sm:[&_h2]:mb-2",
                      "[&_h3]:text-xs sm:[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-800 dark:[&_h3]:text-slate-200 [&_h3]:mb-1.5 sm:[&_h3]:mb-2",
                      "[&_strong]:font-semibold [&_strong]:text-xs sm:[&_strong]:text-sm [&_strong]:text-slate-800 dark:[&_strong]:text-slate-200",
                      "[&_ul]:list-disc [&_ul]:pl-4 sm:[&_ul]:pl-5 [&_ul]:mb-2 sm:[&_ul]:mb-3 [&_ul]:space-y-1",
                      "[&_ol]:list-decimal [&_ol]:pl-4 sm:[&_ol]:pl-5 [&_ol]:mb-2 sm:[&_ol]:mb-3 [&_ol]:space-y-1",
                      "[&_li]:text-xs sm:[&_li]:text-sm [&_li]:text-slate-700 dark:[&_li]:text-slate-300",
                      "[&_a]:text-xs sm:[&_a]:text-sm [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline",
                      "[&>*:last-child]:mb-0"
                    )}
                    dangerouslySetInnerHTML={{ __html: truncatedContent || initialData.description }}
                  />
                  {initialData.description && initialData.description.length > 300 && (
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-0 h-auto text-[10px] sm:text-xs font-medium"
                    >
                      {isExpanded ? "Show Less" : "Show More"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Buttons below description - responsive layout */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-end gap-2 sm:gap-2.5">
              <AISectionContentGenerator
                sectionTitle={initialData.title}
                chapterTitle={chapterTitle}
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                contentType="description"
                onGenerate={handleAIGenerate}
                disabled={!initialData.title}
                existingContent={initialData.description}
                courseContext={courseContext}
                chapterContext={chapterContext}
                sectionContext={sectionContext}
                trigger={
                  <Button
                    size="sm"
                    disabled={!initialData.title}
                    className={cn(
                      "h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto",
                      "bg-gradient-to-r from-sky-500 to-blue-500",
                      "hover:from-sky-600 hover:to-blue-600",
                      "text-white font-semibold text-xs sm:text-sm",
                      "shadow-md hover:shadow-lg",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "justify-center xs:justify-start"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="whitespace-nowrap">Generate with AI</span>
                  </Button>
                }
              />
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto",
                  "bg-white/80 dark:bg-slate-800/80",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-800",
                  "hover:border-purple-300 dark:hover:border-purple-600",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "font-semibold text-xs sm:text-sm",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md",
                  "justify-center xs:justify-start"
                )}
              >
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 sm:space-y-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className={cn(
                      "rounded-lg sm:rounded-xl",
                      "border border-slate-200 dark:border-slate-700",
                      "bg-white dark:bg-slate-900",
                      "overflow-hidden"
                    )}>
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write a comprehensive description for your section. Include:

• What students will learn
• Key topics covered
• Prerequisites if any
• What makes it valuable"
                        editorClassName="prose prose-sm max-w-none
                          [&_.tiptap]:min-h-[180px] sm:[&_.tiptap]:min-h-[200px] md:[&_.tiptap]:min-h-[220px]
                          [&_.tiptap]:text-slate-800 dark:[&_.tiptap]:text-slate-200
                          [&_.tiptap]:text-xs sm:[&_.tiptap]:text-sm md:[&_.tiptap]:text-base
                          [&_.tiptap]:px-2 sm:[&_.tiptap]:px-4 [&_.tiptap]:py-2 sm:[&_.tiptap]:py-3
                          [&_ul]:list-disc [&_ul]:pl-4 sm:[&_ul]:pl-6 [&_ul]:mb-2 sm:[&_ul]:mb-3 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-4 sm:[&_ol]:pl-6 [&_ol]:mb-2 sm:[&_ol]:mb-3 [&_ol]:space-y-1
                          [&_li]:mb-1 [&_li]:text-slate-800 [&_li]:dark:text-slate-200 [&_li]:leading-relaxed
                          [&_li]:text-xs sm:[&_li]:text-sm
                          [&_li]:marker:text-slate-600 [&_li]:dark:marker:text-slate-400
                          [&_p]:text-slate-800 dark:[&_p]:text-slate-200 [&_p]:leading-relaxed
                          [&_p]:text-xs sm:[&_p]:text-sm md:[&_p]:text-base
                          [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_strong]:font-semibold
                          [&_h1]:text-lg sm:[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-slate-100
                          [&_h2]:text-base sm:[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100
                          [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2 sm:gap-x-2">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-10 sm:h-9 px-4 w-full xs:w-auto",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-700",
                  "hover:text-slate-900 dark:hover:text-slate-100",
                  "hover:border-slate-400 dark:hover:border-slate-500",
                  "font-semibold text-xs sm:text-sm",
                  "transition-all duration-200",
                  "justify-center xs:justify-start"
                )}
              >
                Cancel
              </Button>
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                className={cn(
                  "h-10 sm:h-9 px-4 w-full xs:w-auto",
                  "bg-emerald-600 hover:bg-emerald-700 text-white",
                  "font-semibold text-xs sm:text-sm",
                  "justify-center xs:justify-start",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                size="sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-1.5 sm:gap-x-2">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

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
import ContentViewer from "@/components/tiptap/content-viewer";
import { AISectionContentGenerator } from "./ai-section-content-generator";

interface SectionLearningObjectivesFormProps {
  initialData: {
    learningObjectives: string | null;
    title: string;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
  chapterTitle: string;
}

const formSchema = z.object({
  learningObjectives: z.string().min(1, {
    message: "Learning objectives are required",
  }),
});

export const SectionLearningObjectivesForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
  chapterTitle,
}: SectionLearningObjectivesFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      learningObjectives: initialData.learningObjectives || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const [isExpanded, setIsExpanded] = useState(false);
  const [learningObjectivesArray, setLearningObjectivesArray] = useState<string[]>([]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`, values);
      toast.success("Section updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleAIGenerate = (content: string) => {
    form.setValue("learningObjectives", content);
    form.trigger("learningObjectives");
    if (!isEditing) {
      setIsEditing(true);
    }
    toast.success("Learning objectives generated! You can edit them before saving.");
  };

  // Parse HTML content to extract learning objectives as array
  useEffect(() => {
    if (!isMounted || !initialData.learningObjectives) return;

    if (typeof window !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = initialData.learningObjectives;

      const listItems = div.querySelectorAll('li');
      const paragraphs = div.querySelectorAll('p');

      let objectives: string[] = [];

      if (listItems.length > 0) {
        objectives = Array.from(listItems).map(li => li.textContent?.trim() || '').filter(text => text);
      } else if (paragraphs.length > 0) {
        objectives = Array.from(paragraphs).map(p => p.textContent?.trim() || '').filter(text => text);
      } else {
        const textContent = div.textContent || '';
        objectives = textContent.split('\n').map(line => line.trim()).filter(line => line);
      }

      setLearningObjectivesArray(objectives);
    }
  }, [initialData.learningObjectives, isMounted]);

  if (!isMounted) {
    return (
      <div className={cn(
        "p-4 rounded-xl",
        "border border-slate-200 dark:border-slate-700",
        "bg-white/50 dark:bg-slate-800/40",
        "transition-all duration-200",
        "backdrop-blur-sm"
      )}>
        <div className="animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col gap-4">
            {/* Learning objectives content - full width with nice bullet points */}
            <div className="flex-1 min-w-0 w-full">
              {learningObjectivesArray.length === 0 ? (
                <div className="space-y-2 py-3 rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 px-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No learning objectives set
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-3">
                    Define what students will achieve by completing this section. Use bullet points to clearly outline the key learning objectives.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {/* Display learning objectives as numbered list with nice formatting */}
                  <ul className="space-y-3">
                    {learningObjectivesArray.slice(0, isExpanded ? learningObjectivesArray.length : 3).map((objective, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          {index + 1}
                        </span>
                        <span className="flex-1 pt-0.5">{objective}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Show More/Less button if more than 3 objectives */}
                  {learningObjectivesArray.length > 3 && (
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-0 h-auto text-xs font-medium"
                    >
                      {isExpanded ? "Show Less" : `Show More (${learningObjectivesArray.length - 3} more)`}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Buttons below objectives - aligned to right */}
            <div className="flex items-center justify-end gap-2">
              <AISectionContentGenerator
                sectionTitle={initialData.title}
                chapterTitle={chapterTitle}
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                contentType="learningObjectives"
                onGenerate={handleAIGenerate}
                disabled={!initialData.title}
                existingContent={initialData.learningObjectives}
                trigger={
                  <Button
                    size="sm"
                    disabled={!initialData.title}
                    className={cn(
                      "h-9 px-4",
                      "bg-gradient-to-r from-sky-500 to-blue-500",
                      "hover:from-sky-600 hover:to-blue-600",
                      "text-white font-semibold",
                      "shadow-md hover:shadow-lg",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                }
              />
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 px-4",
                  "bg-white/80 dark:bg-slate-800/80",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-800",
                  "hover:border-purple-300 dark:hover:border-purple-600",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "font-semibold",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <Pencil className="h-4 w-4 mr-2" />
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
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="learningObjectives"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className={cn(
                      "rounded-lg",
                      "border border-slate-200 dark:border-slate-700",
                      "bg-white dark:bg-slate-900"
                    )}>
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Define what students will achieve by completing this section. Use bullet points for clarity:

• Master core concepts and principles
• Apply practical skills in real-world scenarios
• Build confidence through hands-on exercises
• Develop relevant expertise"
                        editorClassName="prose prose-sm max-w-none
                          [&_.tiptap]:min-h-[200px]
                          [&_.tiptap]:text-slate-800 dark:[&_.tiptap]:text-slate-200
                          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
                          [&_li]:mb-1 [&_li]:text-slate-800 [&_li]:dark:text-slate-200 [&_li]:leading-relaxed
                          [&_li]:marker:text-slate-600 [&_li]:dark:marker:text-slate-400
                          [&_p]:text-slate-800 dark:[&_p]:text-slate-200 [&_p]:leading-relaxed
                          [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_strong]:font-semibold
                          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-slate-100
                          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100
                          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-x-2">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-9 px-4",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-700",
                  "hover:text-slate-900 dark:hover:text-slate-100",
                  "hover:border-slate-400 dark:hover:border-slate-500",
                  "font-semibold",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </Button>
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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

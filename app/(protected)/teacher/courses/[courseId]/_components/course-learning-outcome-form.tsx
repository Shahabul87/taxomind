"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
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
import { TipTapEditor } from "@/components/lazy-imports";
import { UnifiedAIGenerator } from "@/components/ai/unified-ai-generator";
import { useIsPremium } from "@/hooks/use-premium-status";

interface CourseLearningOutcomeFormProps {
  initialData: {
    whatYouWillLearn?: string[] | null;
    title?: string;
    description?: string;
  };
  courseId: string;
}

const formSchema = z.object({
  whatYouWillLearn: z.string().min(1, {
    message: "Learning outcomes are required",
  }),
});

export const CourseLearningOutcomeForm = ({
  initialData,
  courseId,
}: CourseLearningOutcomeFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const isPremium = useIsPremium();

  // Convert array to HTML string for editor
  const learningOutcomesHtml = (initialData?.whatYouWillLearn?.length ?? 0) > 0
    ? `<ul class="list-disc pl-6 space-y-1 mb-3">${initialData.whatYouWillLearn!.map(item => `<li class="text-slate-800 dark:text-slate-200 leading-relaxed">${item}</li>`).join('')}</ul>`
    : "";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      whatYouWillLearn: learningOutcomesHtml,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const handleAIGenerate = (content: string) => {
    form.setValue("whatYouWillLearn", content);
    form.trigger("whatYouWillLearn"); // Trigger validation
    if (!isEditing) {
      setIsEditing(true);
    }
    toast.success("Learning objectives generated! You can edit them before saving.");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convert HTML content to array of strings for API compatibility
      const htmlContent = values.whatYouWillLearn;
      let learningOutcomes: string[] = [];
      
      if (htmlContent && typeof window !== 'undefined') {
        // Parse HTML to extract text content
        const div = document.createElement('div');
        div.innerHTML = htmlContent;
        
        // Extract list items or paragraphs
        const listItems = div.querySelectorAll('li');
        const paragraphs = div.querySelectorAll('p');
        
        if (listItems.length > 0) {
          // If there are list items, use them
          learningOutcomes = Array.from(listItems).map(li => li.textContent?.trim() || '').filter(text => text);
        } else if (paragraphs.length > 0) {
          // If there are paragraphs, use them
          learningOutcomes = Array.from(paragraphs).map(p => p.textContent?.trim() || '').filter(text => text);
        } else {
          // If no structured content, split by line breaks
          const textContent = div.textContent || '';
          learningOutcomes = textContent.split('\n').map(line => line.trim()).filter(line => line);
        }
      }
      
      await axios.patch(`/api/courses/${courseId}`, {
        whatYouWillLearn: learningOutcomes
      });
      toast.success("Course updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (!isMounted) {
    return (
      <div className={cn(
        "p-4 rounded-xl",
        "border border-gray-200 dark:border-gray-700/50",
        "bg-white/50 dark:bg-gray-800/40",
        "transition-all duration-200",
        "backdrop-blur-sm"
      )}>
        <div className="animate-pulse">
          <div className="flex items-center gap-x-2 mb-2">
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
            <div className="h-6 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Learning objectives content - full width with nice bullet points */}
            <div className="flex-1 min-w-0 w-full">
              {!learningOutcomesHtml ? (
                <div className="space-y-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No learning objectives set
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-2 sm:px-3 break-words">
                    Define what students will learn from this course. Use bullet points to clearly outline the key learning objectives.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 w-full">
                  {/* Display learning objectives as numbered list with nice formatting */}
                  <ul className="space-y-2 sm:space-y-3">
                    {initialData.whatYouWillLearn?.slice(0, isExpanded ? initialData.whatYouWillLearn.length : 3).map((objective, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] sm:text-xs">
                          {index + 1}
                        </span>
                        <span className="flex-1 pt-0.5 min-w-0">{objective}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Show More/Less button if more than 3 objectives */}
                  {initialData.whatYouWillLearn && initialData.whatYouWillLearn.length > 3 && (
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto text-[10px] sm:text-xs font-medium"
                    >
                      {isExpanded ? "Show Less" : `Show More (${initialData.whatYouWillLearn.length - 3} more)`}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Buttons below objectives - aligned to right */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-end gap-2">
              <UnifiedAIGenerator
                contentType="learningObjectives"
                entityLevel="course"
                entityTitle={initialData.title || "Untitled Course"}
                context={{
                  course: {
                    title: initialData.title || "",
                    description: initialData.description || null,
                    whatYouWillLearn: initialData.whatYouWillLearn || [],
                    courseGoals: null,
                    difficulty: null,
                    category: null,
                  },
                }}
                courseId={courseId}
                onGenerate={(content) => handleAIGenerate(content as string)}
                disabled={!initialData.title}
                isPremium={isPremium}
                premiumRequired={true}
                triggerVariant="sky-gradient"
                size="sm"
                buttonText="Generate with AI"
                bloomsTaxonomy={{ enabled: true }}
              />
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm",
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
            id="course-learning-outcomes-form"
            data-form="course-learning-outcomes"
            data-purpose="update-learning-outcomes"
            data-entity-type="course"
            data-entity-id={courseId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="whatYouWillLearn"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className={cn(
                      "rounded-lg",
                      "border border-gray-200 dark:border-gray-700/50",
                      "bg-white dark:bg-gray-900/50"
                    )}>
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Define what students will achieve by completing this course. Use bullet points for clarity:

• Master core concepts and principles
• Apply practical skills in real-world scenarios
• Build confidence through hands-on projects
• Develop industry-relevant expertise"
                        editorClassName="prose prose-xs sm:prose-sm max-w-none
                          [&_.tiptap]:min-h-[180px] sm:[&_.tiptap]:min-h-[200px] md:[&_.tiptap]:min-h-[220px]
                          [&_.tiptap]:text-slate-800 dark:[&_.tiptap]:text-slate-200
                          [&_.tiptap]:px-2 sm:[&_.tiptap]:px-4 [&_.tiptap]:py-2 sm:[&_.tiptap]:py-3
                          [&_ul]:list-disc [&_ul]:pl-4 sm:[&_ul]:pl-6 [&_ul]:mb-2 sm:[&_ul]:mb-3 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-4 sm:[&_ol]:pl-6 [&_ol]:mb-2 sm:[&_ol]:mb-3 [&_ol]:space-y-1
                          [&_li]:mb-1 [&_li]:text-xs sm:[&_li]:text-sm [&_li]:text-slate-800 [&_li]:dark:text-slate-200 [&_li]:leading-relaxed
                          [&_li]:marker:text-slate-600 [&_li]:dark:marker:text-slate-400
                          [&_p]:text-xs sm:[&_p]:text-sm [&_p]:text-slate-800 dark:[&_p]:text-slate-200 [&_p]:leading-relaxed
                          [&_strong]:text-xs sm:[&_strong]:text-sm [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_strong]:font-semibold
                          [&_h1]:text-lg sm:[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-slate-100
                          [&_h2]:text-base sm:[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100
                          [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100"
                        data-field-purpose="learning-outcomes"
                        data-validation="required,min:10"
                        data-content-type="learning-objectives"
                        data-blooms-taxonomy="true"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 dark:text-rose-400 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-10 sm:h-9 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-700",
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-9 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
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
"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { AICourseAssistant } from "./ai-course-assistant";
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
import TipTapEditor from "@/components/tiptap/editor";
import ContentViewer from "@/components/tiptap/content-viewer";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncatedContent, setTruncatedContent] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  // Convert array to HTML string for display
  const learningOutcomesHtml = (initialData?.whatYouWillLearn?.length ?? 0) > 0 
    ? `<ul class="list-disc pl-6 space-y-1 mb-3">${initialData.whatYouWillLearn!.map(item => `<li class="text-slate-800 dark:text-slate-200 leading-relaxed">${item}</li>`).join('')}</ul>`
    : "";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    if (learningOutcomesHtml) {
      setTruncatedContent(isExpanded 
        ? learningOutcomesHtml 
        : truncateHtml(learningOutcomesHtml, 200)
      );
    }
  }, [isExpanded, learningOutcomesHtml, isMounted]);

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
    <div className={cn(
      "p-4 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/40",
      "hover:bg-gray-50 dark:hover:bg-gray-800/60",
      "transition-all duration-200",
      "backdrop-blur-sm"
    )}>
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-x-2">
            <div className="p-2 w-fit rounded-md bg-purple-50 dark:bg-purple-500/10">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Learning Outcomes
            </p>
          </div>
          {!isEditing && (
            <div className="mt-2">
              {!learningOutcomesHtml ? (
                <div className="space-y-2">
                  <p className="text-sm italic text-slate-600 dark:text-slate-400">
                    No learning outcomes defined yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Define what students will learn from this course. Use bullet points, numbered lists, or formatted text to clearly outline the key learning objectives.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ContentViewer 
                    content={truncatedContent}
                    className={cn(
                      "text-slate-800 dark:text-slate-200 prose prose-sm max-w-none",
                      "prose-headings:text-slate-900 dark:prose-headings:text-slate-100",
                      "prose-p:text-slate-800 dark:prose-p:text-slate-200",
                      "prose-strong:text-slate-900 dark:prose-strong:text-white",
                      "prose-ul:list-disc prose-ul:pl-5 prose-ul:text-slate-800 dark:prose-ul:text-slate-200",
                      "prose-li:text-slate-800 dark:prose-li:text-slate-200 prose-li:mb-1",
                      "prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-slate-800 dark:prose-ol:text-slate-200",
                      "prose-a:text-purple-600 dark:prose-a:text-purple-400",
                      "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1",
                      "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1",
                      "[&_li]:mb-1 [&_li]:text-slate-800 [&_li]:dark:text-slate-200 [&_li]:leading-relaxed",
                      "[&_li]:marker:text-slate-600 [&_li]:dark:marker:text-slate-400"
                    )}
                  />
                  {learningOutcomesHtml && learningOutcomesHtml.length > 200 && (
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-purple-700 dark:text-purple-300",
                        "hover:text-purple-800 dark:hover:text-purple-200",
                        "p-0 h-auto",
                        "text-sm font-medium"
                      )}
                    >
                      {isExpanded ? "Show Less" : "Show More"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <AICourseAssistant
            courseTitle={initialData.title || ""}
            type="objectives"
            onGenerate={handleAIGenerate}
            disabled={!initialData.title}
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={!initialData.title}
                className={cn(
                  "text-purple-700 dark:text-purple-300",
                  "border-purple-200 dark:border-purple-700",
                  "hover:text-purple-800 dark:hover:text-purple-200",
                  "hover:bg-purple-50 dark:hover:bg-purple-500/10",
                  "w-full sm:w-auto",
                  "justify-center",
                  "transition-all duration-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Generate with AI</span>
                </div>
              </Button>
            }
          />
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
            className={cn(
              "text-purple-700 dark:text-purple-300",
              "border-purple-200 dark:border-purple-700",
              "hover:text-purple-800 dark:hover:text-purple-200",
              "hover:bg-purple-50 dark:hover:bg-purple-500/10",
              "w-full sm:w-auto",
              "justify-center",
              "transition-all duration-200"
            )}
          >
            {isEditing ? (
              <span className="text-rose-700 dark:text-rose-300">Cancel</span>
            ) : (
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </div>
            )}
          </Button>
        </div>
      </div>
      {isEditing && (
        <Form {...form}>
          <form
            id="course-learning-outcomes-form"
            data-form="course-learning-outcomes"
            data-purpose="update-learning-outcomes"
            data-entity-type="course"
            data-entity-id={courseId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
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
                        placeholder="Define what students will achieve by completing this course. Use bullet points or numbered lists for clarity:

• Master core concepts and principles
• Apply practical skills in real-world scenarios  
• Build confidence through hands-on projects
• Develop industry-relevant expertise"
                        editorClassName="prose prose-sm max-w-none 
                          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
                          [&_li]:mb-1 [&_li]:text-slate-800 [&_li]:dark:text-slate-200 [&_li]:leading-relaxed
                          [&_li]:marker:text-slate-600 [&_li]:dark:marker:text-slate-400"
                        name="whatYouWillLearn"
                        data-field-purpose="learning-outcomes"
                        data-validation="required,min:10"
                        data-content-type="learning-objectives"
                        data-blooms-taxonomy="true"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                variant="ghost"
                size="sm"
                className={cn(
                  "bg-purple-50 dark:bg-purple-500/10",
                  "text-purple-700 dark:text-purple-300",
                  "hover:bg-purple-100 dark:hover:bg-purple-500/20",
                  "hover:text-purple-800 dark:hover:text-purple-200",
                  "border border-purple-200/20 dark:border-purple-500/20",
                  "w-full sm:w-auto",
                  "justify-center",
                  "transition-all duration-200"
                )}
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
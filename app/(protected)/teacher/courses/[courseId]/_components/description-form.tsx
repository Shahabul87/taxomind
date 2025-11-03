"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Sparkles, Loader2, FileText } from "lucide-react";
import { AICourseAssistant } from "./ai-course-assistant";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import { useSAMFormSync } from "@/hooks/use-sam-form-sync";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";
import TipTapEditor from "@/components/tiptap/editor";
import ContentViewer from "@/components/tiptap/content-viewer";

interface DescriptionFormProps {
  initialData: Course & { title?: string };
  courseId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const DescriptionForm = ({
  initialData,
  courseId,
}: DescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [samTriggerEdit, setSamTriggerEdit] = useState(false);
  const [pendingSamData, setPendingSamData] = useState<{ description?: string; content?: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncatedContent, setTruncatedContent] = useState("");

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  // Enable SAM AI Assistant context awareness for course description
  useSAMFormSync(`course-description-form-${courseId}`, form.watch, {
    formName: 'Edit Course Description',
    metadata: {
      formType: 'course-description',
      purpose: 'Update course description with rich text editor',
      entityType: 'course',
      courseId,
      courseTitle: initialData?.title,
      hasContent: !!initialData?.description
    }
  });

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

  // Listen for SAM form population events
  useEffect(() => {
    const handleSamFormPopulation = (event: CustomEvent) => {

      if (event.detail?.formId === 'course-description-form' || 
          event.detail?.formId === 'course-description' ||
          event.detail?.formId === 'update-course-description' ||
          event.detail?.formId === 'update-description' ||
          event.detail?.formId === 'general-form') {

        // Auto-open edit mode when SAM tries to populate
        setIsEditing(true);
        setSamTriggerEdit(true);
        
        // Store the data to be populated
        if (event.detail?.data?.description || event.detail?.data?.content) {
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
      const descriptionValue = pendingSamData.description || pendingSamData.content;
      if (descriptionValue) {
        console.log('📝 Setting description value:', descriptionValue.substring(0, 100) + '...');
        form.setValue("description", descriptionValue);
        form.trigger("description");
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('sam-form-populated', {
          detail: {
            formId: 'course-description-form',
            success: true
          }
        }));
        
        // Clear pending data
        setPendingSamData(null);
      }
    }
  }, [pendingSamData, isEditing, form]);

  // Update form when SAM triggers edit mode with pre-existing description
  useEffect(() => {
    if (samTriggerEdit && initialData?.description) {
      form.setValue("description", initialData.description);
    }
  }, [samTriggerEdit, initialData?.description, form]);

  const { isValid } = form.formState;

  const handleAIGenerate = (content: string) => {
    form.setValue("description", content);
    form.trigger("description"); // Trigger validation
    if (!isEditing) {
      setIsEditing(true);
    }
    toast.success("Description generated! You can edit it before saving.");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const response = await axios.post(`/api/course-update`, {
        courseId: courseId,
        description: values.description
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      toast.success("Course description updated");
      toggleEdit();
      router.refresh();
    } catch (error: any) {
      logger.error("Description update error:", error);
      
      if (error.response) {
        logger.error("Error response status:", error.response.status);
        logger.error("Error response data:", error.response.data);
        
        if (error.response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (error.response.status === 404) {
          toast.error("Course not found.");
        } else if (error.response.status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(`Error: ${error.response.data || 'Something went wrong'}`);
        }
      } else if (error.request) {
        logger.error("No response received:", error.request);
        toast.error("Network error. Please check your connection.");
      } else {
        logger.error("Request setup error:", error.message);
        toast.error("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  // Prevent form submission on button click inside TipTap editor
  const handleSubmit = (e: React.FormEvent) => {
    if (isSubmitting) e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Hidden metadata for SAM to detect the form even when not in edit mode */}
      <div
        data-sam-form-metadata="course-description"
        data-form-id="course-description-form"
        data-form-purpose="update-course-description"
        data-form-alternate-id="update-description"
        data-form-type="description"
        data-entity-type="course"
        data-entity-id={courseId}
        data-current-value={initialData?.description || ""}
        data-is-editing={isEditing.toString()}
        data-field-name="description"
        data-field-type="rich-text"
        style={{ display: 'none' }}
      />

      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col gap-4">
            {/* Description content - full width */}
            <div className="flex-1 min-w-0 w-full">
              {!initialData.description ? (
                <div className="space-y-2 py-3 rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 px-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No description set
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-3">
                    Provide a detailed description of what this course covers, who it&apos;s for, and what makes it valuable.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 w-full">
                  <ContentViewer
                    content={truncatedContent || initialData.description}
                    className={cn(
                      "text-slate-700 dark:text-slate-300 prose prose-sm max-w-none w-full",
                      "prose-headings:text-sm prose-headings:text-slate-800 dark:prose-headings:text-slate-200",
                      "prose-p:text-sm prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed",
                      "prose-strong:text-sm prose-strong:text-slate-800 dark:prose-strong:text-slate-200",
                      "prose-ul:list-disc prose-ul:pl-5 prose-ul:text-sm",
                      "prose-li:text-sm prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:mb-1",
                      "prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-sm",
                      "prose-a:text-sm prose-a:text-blue-600 dark:prose-a:text-blue-400"
                    )}
                  />
                  {initialData.description && initialData.description.length > 300 && (
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto text-xs font-medium"
                    >
                      {isExpanded ? "Show Less" : "Show More"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Buttons below description - aligned to right */}
            <div className="flex items-center justify-end gap-2">
              <ErrorBoundary
                fallback={
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    disabled
                    className="h-9"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Error
                  </Button>
                }
              >
                <AICourseAssistant
                  courseTitle={initialData.title || ""}
                  type="description"
                  onGenerate={handleAIGenerate}
                  disabled={!initialData.title}
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
              </ErrorBoundary>
              <Button
                onClick={toggleEdit}
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
            id="course-description-form"
            data-form="course-description"
            data-purpose="update-course-description"
            data-entity-type="course"
            data-entity-id={courseId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLButtonElement) {
                e.preventDefault();
              }
            }}
          >
            <FormField
              control={form.control}
              name="description"
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
                        placeholder="Write a comprehensive description for your course. Include:

• What students will learn
• Course prerequisites
• Who this course is for
• What makes it unique"
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
                        data-field-purpose="course-description"
                        data-validation="required,min:10"
                        data-content-type="course-description"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-x-2">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-9 px-4",
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
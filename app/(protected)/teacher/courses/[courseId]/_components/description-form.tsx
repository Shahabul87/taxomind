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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";
import { SAMEnhancedEditor } from "@/components/tiptap/sam-enhanced-editor";
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
    <div className={cn(
      "p-4 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/40",
      "hover:bg-gray-50 dark:hover:bg-gray-800/60",
      "transition-all duration-200",
      "backdrop-blur-sm"
    )}>
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
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-x-2">
            <div className="p-2 w-fit rounded-md bg-purple-50 dark:bg-purple-500/10">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Course Description
            </p>
          </div>
          {!isEditing && (
            <div className="mt-2">
              {!initialData.description ? (
                <div className="space-y-2">
                  <p className="text-sm italic text-slate-600 dark:text-slate-400">
                    No course description yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Provide a detailed description of what this course covers, who it&apos;s for, and what makes it valuable.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ContentViewer 
                    content={truncatedContent || initialData.description} 
                    className={cn(
                      "text-slate-800 dark:text-slate-200 prose prose-sm max-w-none",
                      "prose-headings:text-slate-900 dark:prose-headings:text-slate-100",
                      "prose-p:text-slate-800 dark:prose-p:text-slate-200",
                      "prose-strong:text-slate-900 dark:prose-strong:text-white",
                      "prose-ul:list-disc prose-ul:pl-5 prose-ul:text-slate-800 dark:prose-ul:text-slate-200",
                      "prose-li:text-slate-800 dark:prose-li:text-slate-200 prose-li:mb-1",
                      "prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-slate-800 dark:prose-ol:text-slate-200",
                      "prose-a:text-purple-600 dark:prose-a:text-purple-400"
                    )}
                  />
                  {initialData.description && initialData.description.length > 300 && (
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
          <ErrorBoundary
            fallback={
              <Button 
                variant="outline"
                type="button"
                size="sm"
                disabled
                className="text-xs h-8"
              >
                <Sparkles className="h-3 w-3 mr-1" />
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
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              }
            />
          </ErrorBoundary>
          <Button 
            onClick={toggleEdit} 
            variant="outline"
            type="button"
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
              <>Cancel</>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>
      {isEditing && (
        <Form {...form}>
          <form
            id="course-description-form"
            data-form="course-description"
            data-purpose="update-course-description"
            data-entity-type="course"
            data-entity-id={courseId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
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
                    <div className="bg-white dark:bg-slate-800 rounded-md" data-form="course-description">
                      <SAMEnhancedEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write a description for your course..."
                        editorClassName="[&_.tiptap]:!text-black dark:[&_.tiptap]:!text-gray-200 min-h-[150px]"
                        samEnabled={true}
                        context={{
                          courseId,
                          formType: 'description',
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end gap-x-2">
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
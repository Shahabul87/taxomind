"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Sparkles, Loader2 } from "lucide-react";
import { AIGenerationPreferencesDialog, type AIGenerationPreferences } from "./ai-generation-preferences";
import { useState, useEffect } from "react";
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
  }),
});

export const TitleForm = ({
  initialData,
  courseId
}: TitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingSamData, setPendingSamData] = useState<{ title?: string; name?: string; courseTitle?: string } | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  // Listen for SAM form population events
  useEffect(() => {
    const handleSamFormPopulation = (event: CustomEvent) => {
      console.log('📥 Title form received SAM populate event:', event.detail);
      
      if (event.detail?.formId === 'course-title-form' || 
          event.detail?.formId === 'course-title' ||
          event.detail?.formId === 'update-course-title' ||
          event.detail?.formId === 'update-title' ||
          event.detail?.formId === 'title-form') {
        
        console.log('✅ Matched form ID, opening edit mode');
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
        console.log('📝 Setting title value:', titleValue);
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

  const generateTitle = async (preferences: AIGenerationPreferences) => {
    if (!initialData.description) {
      toast.error("Please add a course description first to generate a title");
      return;
    }

    setIsGenerating(true);
    try {
      // Build enhanced prompt with preferences
      const targetAudience = preferences.targetAudience || "Students";
      const focusAreas = preferences.focusAreas.length > 0 
        ? `Focus on: ${preferences.focusAreas.join(", ")}`
        : "";
      
      const keywords = preferences.includeKeywords 
        ? `Include these keywords: ${preferences.includeKeywords}`
        : "";
      
      const additionalInstructions = preferences.additionalInstructions || "";
      
      const enhancedDescription = [
        `Generate a course title with a ${preferences.tone} tone.`,
        focusAreas,
        keywords,
        additionalInstructions
      ].filter(Boolean).join(" ");

      const response = await fetch('/api/ai/course-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: initialData.title || "Course",
          targetAudience,
          duration: "4 weeks",
          difficulty: "intermediate",
          learningGoals: ["Learn key concepts"],
          description: `${initialData.description} ${enhancedDescription}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const data = await response.json();
      
      if (data.success && data.data.title) {
        form.setValue("title", data.data.title);
        form.trigger("title"); // Trigger validation
        toast.success("Title generated! You can edit it before saving.");
        if (!isEditing) {
          setIsEditing(true);
        }
      } else {
        throw new Error('No title generated');
      }
    } catch (error: any) {
      console.error('Title generation error:', error);
      toast.error("Failed to generate title. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className={cn(
      "p-4 mt-6 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/50",
      "hover:bg-gray-50 dark:hover:bg-gray-800/70",
      "backdrop-blur-sm",
      "transition-all duration-200"
    )}>
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
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Course Title
            </p>
            {!initialData.title && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                "text-rose-700 dark:text-rose-400",
                "bg-rose-100 dark:bg-rose-500/10"
              )}>
                Required
              </span>
            )}
          </div>
          {!isEditing && (
            <p className={cn(
              "text-sm sm:text-base font-medium",
              "text-gray-700 dark:text-gray-300",
              !initialData.title && "text-gray-500 dark:text-gray-400 italic"
            )}>
              {initialData.title || "No title set"}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <AIGenerationPreferencesDialog
            type="title"
            onGenerate={generateTitle}
            isGenerating={isGenerating}
            disabled={!initialData.description}
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isGenerating || !initialData.description}
                className={cn(
                  "text-purple-700 dark:text-purple-300",
                  "border-purple-200 dark:border-purple-700",
                  "hover:text-purple-800 dark:hover:text-purple-200",
                  "hover:bg-purple-50 dark:hover:bg-purple-500/10",
                  "w-full sm:w-auto",
                  "justify-center"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            }
          />
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
            className={cn(
              "text-purple-700 dark:text-purple-300",
              "hover:text-purple-800 dark:hover:text-purple-200",
              "hover:bg-purple-50 dark:hover:bg-purple-500/10",
              "w-full sm:w-auto",
              "justify-center"
            )}
          >
            {isEditing ? (
              "Cancel"
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
            id="course-title-form"
            data-form="course-title"
            data-purpose="update-course-title"
            data-entity-type="course"
            data-entity-id={courseId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      name="title"
                      disabled={isSubmitting}
                      placeholder="e.g. 'Advanced Web Development'"
                      data-field-purpose="course-title"
                      data-validation="required,min:3,max:100"
                      data-content-type="course-title"
                      className={cn(
                        "bg-white dark:bg-gray-900/50",
                        "border-gray-200 dark:border-gray-700/50",
                        "text-gray-900 dark:text-gray-200",
                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                        "focus:border-purple-500/50 focus:ring-purple-500/20",
                        "text-sm sm:text-base font-medium",
                        "transition-all duration-200"
                      )}
                    />
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
                  "w-full sm:w-auto",
                  "justify-center",
                  "transition-all duration-200"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
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
}
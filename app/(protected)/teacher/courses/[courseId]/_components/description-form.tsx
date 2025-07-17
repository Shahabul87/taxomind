"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Sparkles, Loader2 } from "lucide-react";
import { AICourseAssistant } from "./ai-course-assistant";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

  // Prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

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
      console.log("Submitting description update:", values);
      console.log("Course ID:", courseId);
      
      const response = await axios.post(`/api/course-update`, {
        courseId: courseId,
        description: values.description
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log("Description update response:", response.data);
      toast.success("Course description updated");
      toggleEdit();
      router.refresh();
    } catch (error: any) {
      console.error("Description update error:", error);
      
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        
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
        console.error("No response received:", error.request);
        toast.error("Network error. Please check your connection.");
      } else {
        console.error("Request setup error:", error.message);
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
      "rounded-md",
      isEditing ? "p-0" : "p-4 bg-slate-50 dark:bg-slate-800/50"
    )}>
      <div className="font-medium flex items-center justify-between">
        Course description
        <div className="flex gap-2">
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
                  type="button"
                  size="sm"
                  disabled={!initialData.title}
                  className="text-xs h-8"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate with AI
                </Button>
              }
            />
          </ErrorBoundary>
          <Button 
            onClick={toggleEdit} 
            variant="ghost"
            type="button"
            className="text-xs h-8"
          >
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>
      {!isEditing ? (
        <div className={cn(
          "text-sm mt-2",
          !initialData.description && "text-slate-500 italic"
        )}>
          {initialData.description ? (
            <ContentViewer 
              content={initialData.description} 
              className="text-black dark:text-gray-200 prose-sm max-w-full"
            />
          ) : (
            <p>No description</p>
          )}
        </div>
      ) : (
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
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write a description for your course..."
                        editorClassName="[&_.tiptap]:!text-black dark:[&_.tiptap]:!text-gray-200 min-h-[150px]"
                        name="description"
                        data-field-purpose="course-description"
                        data-validation="required,min:10"
                        data-content-type="rich-text"
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
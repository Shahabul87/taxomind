"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Chapter, Course } from "@prisma/client";
import { logger } from '@/lib/logger';
import { UnifiedAIGenerator } from "@/components/ai/unified-ai-generator";
import { useIsPremium } from "@/hooks/use-premium-status";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChaptersList } from "./chapters-list";

interface ChaptersFormProps {
  initialData: Course & { chapters: Chapter[] };
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export const ChaptersForm = ({
  initialData,
  courseId,
}: ChaptersFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const router = useRouter();
  const isPremium = useIsPremium();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {

      const response = await axios.post(`/api/courses/${courseId}/chapters`, values, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 30000, // 30 second timeout
      });

      toast.success("Chapter created");
      setIsCreating(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      logger.error("[CHAPTERS_FORM] Chapter creation failed:");
      logger.error("[CHAPTERS_FORM] Error details:", error);
      logger.error("[CHAPTERS_FORM] Response status:", error?.response?.status);
      logger.error("[CHAPTERS_FORM] Response data:", error?.response?.data);
      
      // Provide more specific error messages
      let errorMessage = "Something went wrong";
      
      if (error?.response?.status === 401) {
        errorMessage = "You are not authorized to create chapters for this course";
      } else if (error?.response?.status === 403) {
        errorMessage = "Access denied. Please check your permissions";
      } else if (error?.response?.status === 404) {
        errorMessage = "Course not found";
      } else if (error?.response?.status === 503) {
        errorMessage = "Service temporarily unavailable. Please try again";
      } else if (error?.response?.data && typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      logger.error("[CHAPTERS_FORM] Showing error message:", errorMessage);
      toast.error(errorMessage);
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData
      });
      toast.success("Chapters reordered");
      router.refresh();
    } catch (error: any) {
      logger.error("Error reordering chapters:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    router.push(`/teacher/courses/${courseId}/chapters/${id}`);
  };

  const onDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/courses/${courseId}/chapters/${id}`);
      toast.success("Chapter deleted");
      router.refresh();
    } catch (error: any) {
      logger.error("Error deleting chapter:", error);
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAIGenerateChapters = async (content: string | string[] | object) => {
    if (!initialData.title || !initialData.description) {
      toast.error("Please add course title and description first to generate chapters with AI");
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Parse the AI response - can be JSON string of titles or array
      let chapters: Array<{ title: string; description?: string }> = [];

      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          // Convert array of strings or objects to unified format
          if (Array.isArray(parsed)) {
            chapters = parsed.map((item: string | { title: string; description?: string }) =>
              typeof item === 'string' ? { title: item.trim() } : { title: item.title?.trim() || '', description: item.description }
            );
          } else {
            throw new Error('Expected array');
          }
        } catch {
          // If not valid JSON, try to extract titles from the response
          const lines = content.split('\n').filter(line => line.trim());
          chapters = lines
            .map(line => line.trim())
            .filter(line => line.length > 0 && line !== '[' && line !== ']' && !line.startsWith('```'))
            .map(line => ({
              title: line
                .replace(/^["']|["'],?$/g, '') // Remove quotes and trailing comma
                .replace(/^\d+\.\s*/, '') // Remove numbering
                .trim()
            }));
        }
      } else if (Array.isArray(content)) {
        chapters = content.map((item: string | { title: string; description?: string }) =>
          typeof item === 'string' ? { title: item.trim() } : { title: item.title?.trim() || '', description: item.description }
        );
      }

      // Filter out any chapters with empty titles
      chapters = chapters.filter(ch => ch.title && ch.title.length > 0);

      if (chapters.length === 0) {
        throw new Error('No valid chapter titles received');
      }

      logger.info(`[CHAPTERS_FORM] Creating ${chapters.length} chapters:`, chapters.map(c => c.title));

      // Create chapters in database
      const createdChapters = [];
      for (let i = 0; i < chapters.length; i++) {
        const chapterData = chapters[i];
        try {
          const createResponse = await axios.post(`/api/courses/${courseId}/chapters`, {
            title: chapterData.title
          }, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
            timeout: 30000
          });

          createdChapters.push(createResponse.data);
        } catch (error) {
          logger.error(`[CHAPTERS_FORM] Failed to create chapter ${i + 1} "${chapterData.title}":`, error);
          // Continue with remaining chapters instead of failing completely
        }
      }

      if (createdChapters.length > 0) {
        toast.success(`Successfully generated ${createdChapters.length} chapters with AI!`);
        router.refresh();
      } else {
        throw new Error('No chapters were created successfully');
      }

    } catch (error) {
      logger.error('[CHAPTERS_FORM] AI chapter generation failed:', error);
      toast.error("Failed to generate chapters with AI. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className={cn(
      "relative p-2.5 sm:p-3 md:p-4 mt-3 sm:mt-4 md:mt-6 rounded-lg sm:rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/50",
      "hover:bg-gray-50 dark:hover:bg-gray-800/70",
      "backdrop-blur-sm",
      "transition-all duration-200"
    )}>
      {(isUpdating || isDeleting || isGeneratingAI) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin text-purple-600 dark:text-purple-400" />
        </div>
      )}
      <div className="font-medium flex flex-col gap-2.5 sm:gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-2">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-x-1.5 sm:gap-x-2">
              <div className="p-1 sm:p-1.5 md:p-2 w-fit rounded-md bg-purple-50 dark:bg-purple-500/10">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Course Chapters
                </p>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Organize your course content
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <UnifiedAIGenerator
              contentType="chapters"
              entityLevel="course"
              entityTitle={initialData.title || "Untitled Course"}
              context={{
                course: {
                  title: initialData.title || "",
                  description: initialData.description || null,
                  whatYouWillLearn: initialData.whatYouWillLearn || [],
                  courseGoals: initialData.courseGoals || null,
                  difficulty: initialData.difficulty || null,
                  category: initialData.categoryId || null,
                },
              }}
              courseId={courseId}
              onGenerate={handleAIGenerateChapters}
              disabled={!initialData.title || !initialData.description || isGeneratingAI}
              isPremium={isPremium}
              premiumRequired={true}
              triggerVariant="sky-gradient"
              size="sm"
              buttonText="Generate with AI"
              bloomsTaxonomy={{ enabled: false }}
              chapterOptions={{ defaultCount: 5, minCount: 3, maxCount: 10 }}
            />
            <Button
            onClick={() => setIsCreating(!isCreating)}
            variant="ghost"
            size="sm"
            className={cn(
              "text-purple-700 dark:text-purple-300",
              "hover:text-purple-800 dark:hover:text-purple-200",
              "hover:bg-purple-50 dark:hover:bg-purple-500/10",
              "w-full sm:w-auto",
              "justify-center",
              "h-9 sm:h-10",
              "text-xs sm:text-sm"
            )}
          >
            {isCreating ? (
              "Cancel"
            ) : (
              <>
                <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Add chapter</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </Button>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 sm:space-y-4 mt-3 sm:mt-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          placeholder="e.g. 'Introduction to the course'"
                          data-form="chapter-title"
                          className={cn(
                            "bg-white dark:bg-gray-900/50",
                            "border-gray-200 dark:border-gray-700/50",
                            "text-gray-900 dark:text-gray-200",
                            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                            "focus:ring-purple-500/20",
                            "text-sm sm:text-base font-medium",
                            "h-9 sm:h-10",
                            "transition-all duration-200"
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 dark:text-rose-400 text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />
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
                    "h-9 sm:h-10",
                    "text-xs sm:text-sm",
                    "transition-all duration-200"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-x-1.5 sm:gap-x-2">
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create"
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>

      {!isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 sm:mt-4"
        >
          <ChaptersList
            onEdit={onEdit}
            onReorder={onReorder}
            onDelete={onDelete}
            items={initialData.chapters || []}
          />
          {initialData.chapters.length === 0 && (
            <div className="mt-3 sm:mt-4 text-center space-y-1.5 sm:space-y-2 px-2">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                No chapters yet
              </p>
              {(!initialData.title || !initialData.description) && (
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                  Add course title and description to use AI generation
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
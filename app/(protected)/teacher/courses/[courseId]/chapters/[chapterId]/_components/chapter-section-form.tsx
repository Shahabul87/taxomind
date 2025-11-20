"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, LayoutGrid, Sparkles } from "lucide-react";
import { AISectionGenerator } from "./ai-section-generator";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Chapter, Section } from "@prisma/client";
import { logger } from '@/lib/logger';

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
import { ChapterSectionList } from "./chapter-section-list";

interface ChaptersSectionFormProps {
  chapter: Chapter & { 
    sections: Section[] 
  };
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export const ChaptersSectionForm = ({
  chapter,
  courseId,
  chapterId,
}: ChaptersSectionFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {

      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections`, 
        values
      );

      toast.success("Section created");
      setIsCreating(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      logger.error("Section creation error:", error);
      toast.error("Something went wrong");
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/sections/reorder`, {
        list: updateData
      });
      toast.success("Sections reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (sectionId: string) => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}/section/${sectionId}`);
  };

  const onDelete = async (sectionId: string) => {
    try {

      const response = await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`
      );

      toast.success("Section deleted");
      router.refresh();
    } catch (error: any) {
      logger.error("Delete error:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Failed to delete section");
    }
  };

  const generateSectionsWithAI = async (sections: any[]) => {
    if (!chapter.title) {
      toast.error("Chapter title is required to generate sections with AI");
      return;
    }

    setIsGeneratingAI(true);
    try {

      // Create sections in database
      const createdSections = [];
      for (let i = 0; i < sections.length; i++) {
        const sectionData = sections[i];
        try {
          const createResponse = await axios.post(
            `/api/courses/${courseId}/chapters/${chapterId}/sections`,
            {
              title: sectionData.title
            }
          );
          
          createdSections.push(createResponse.data);

        } catch (error: any) {
          logger.error(`[SECTIONS_FORM] Failed to create section ${i + 1}:`, error);
          // Continue with remaining sections instead of failing completely
        }
      }

      if (createdSections.length > 0) {
        toast.success(`Successfully generated ${createdSections.length} sections with AI!`);
        router.refresh();
      } else {
        throw new Error('No sections were created successfully');
      }
      
    } catch (error: any) {
      logger.error('[SECTIONS_FORM] AI section generation failed:', error);
      toast.error("Failed to generate sections with AI. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className={cn(
      "relative p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
      "border border-slate-200 dark:border-slate-700",
      "bg-white dark:bg-slate-900",
      "transition-all duration-200"
    )}>
      {(isUpdating || isGeneratingAI) && (
        <div className="absolute h-full w-full bg-white/80 dark:bg-slate-900/80 top-0 right-0 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-400 animate-spin" />
        </div>
      )}
      <div className="font-medium flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
          <div className="space-y-0.5 sm:space-y-1">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Chapter Sections
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Add and organize your course content
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2">
            <AISectionGenerator
              chapterTitle={chapter.title}
              courseId={courseId}
              chapterId={chapterId}
              onGenerate={generateSectionsWithAI}
              disabled={isGeneratingAI || !chapter.title}
            />
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant="outline"
              size="sm"
              className={cn(
                "h-9 sm:h-10 px-3 sm:px-4",
                "transition-all duration-200",
                "w-full xs:w-auto",
                "justify-center",
                "font-semibold text-xs sm:text-sm",
                isCreating
                  ? "text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-700"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              )}
            >
              {isCreating ? (
                "Cancel"
              ) : (
                <div className="flex items-center gap-x-1.5 sm:gap-x-2">
                  <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Add Section</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Horizontal separator */}
        <div className="my-3 sm:my-4 border-b border-slate-200 dark:border-slate-700" />

        <AnimatePresence mode="wait">
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-3 sm:mt-4"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-3 sm:space-y-4"
                  data-form="chapter-sections"
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
                            placeholder="e.g. 'Introduction to the topic'"
                            className={cn(
                              "bg-white dark:bg-slate-900",
                              "border border-slate-300/60 dark:border-slate-600/60",
                              "text-slate-900 dark:text-slate-100",
                              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                              "focus:border-slate-400/70 dark:focus:border-slate-500/70",
                              "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                              "text-sm sm:text-base",
                              "h-10 sm:h-11",
                              "transition-all duration-200",
                              "w-full"
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
                    size="sm"
                    className={cn(
                      "bg-emerald-600 hover:bg-emerald-700",
                      "text-white",
                      "w-full xs:w-auto",
                      "h-10 sm:h-9 px-4",
                      "justify-center",
                      "font-semibold text-xs sm:text-sm",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
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
            <ChapterSectionList
              onEdit={onEdit}
              onReorder={onReorder}
              onDelete={onDelete}
              items={chapter.sections || []}
            />
            {chapter.sections.length === 0 && (
              <div className="space-y-2 sm:space-y-2.5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 px-2.5 sm:px-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No sections yet
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-2.5 sm:px-3">
                  Add sections to organize your chapter content. {!chapter.title && "Add chapter title to use AI generation."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

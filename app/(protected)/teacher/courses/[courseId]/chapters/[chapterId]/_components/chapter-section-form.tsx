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
      console.log("Submitting section:", values);
      
      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections`, 
        values
      );
      
      console.log("Section creation response:", response.data);
      
      toast.success("Section created");
      setIsCreating(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error("Section creation error:", error);
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
      console.log("Deleting section:", sectionId);
      
      const response = await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`
      );
      
      console.log("Delete response:", response.data);
      toast.success("Section deleted");
      router.refresh();
    } catch (error: any) {
      console.error("Delete error:", error.response?.data || error.message);
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
      console.log('[SECTIONS_FORM] Starting AI section generation:', { chapterId, sections: sections.length });
      
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
          console.log(`[SECTIONS_FORM] Created section ${i + 1}:`, createResponse.data.title);
        } catch (error: any) {
          console.error(`[SECTIONS_FORM] Failed to create section ${i + 1}:`, error);
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
      console.error('[SECTIONS_FORM] AI section generation failed:', error);
      toast.error("Failed to generate sections with AI. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className={cn(
      "relative p-4 sm:p-6 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/40",
      "hover:bg-gray-50 dark:hover:bg-gray-800/60",
      "transition-all duration-200",
      "backdrop-blur-sm",
      "overflow-x-auto",
      "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
      "scrollbar-track-transparent"
    )}>
      <div className="min-w-[600px] sm:min-w-full">
        {(isUpdating || isGeneratingAI) && (
          <div className="absolute h-full w-full bg-white/10 dark:bg-gray-900/20 top-0 right-0 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-6 w-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
          </div>
        )}
        <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-x-2">
              <div className="p-2 w-fit rounded-md bg-cyan-50 dark:bg-cyan-500/10">
                <LayoutGrid className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Chapter Sections
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium tracking-wide">
                  Add and organize your course content
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <AISectionGenerator
              chapterTitle={chapter.title}
              courseId={courseId}
              chapterId={chapterId}
              onGenerate={generateSectionsWithAI}
              disabled={isGeneratingAI || !chapter.title}
            />
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant="ghost"
              size="sm"
              className={cn(
                "transition-all duration-200",
                "w-full sm:w-auto",
                "justify-center",
                isCreating
                  ? "text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  : "text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
              )}
            >
              {isCreating ? (
                "Cancel"
              ) : (
                <div className="flex items-center gap-x-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Section</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
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
                              "bg-white dark:bg-gray-900/50",
                              "border-gray-200 dark:border-gray-700/50",
                              "text-gray-900 dark:text-gray-200",
                              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                              "focus:ring-cyan-500/20",
                              "text-sm sm:text-base font-medium",
                              "transition-all duration-200"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={!isValid || isSubmitting}
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "bg-cyan-50 dark:bg-cyan-500/10",
                      "text-cyan-700 dark:text-cyan-300",
                      "hover:bg-cyan-100 dark:hover:bg-cyan-500/20",
                      "hover:text-cyan-800 dark:hover:text-cyan-200",
                      "border border-cyan-200/20 dark:border-cyan-500/20",
                      "w-full sm:w-auto",
                      "justify-center",
                      "transition-all duration-200"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
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
            className="mt-4"
          >
            <ChapterSectionList
              onEdit={onEdit}
              onReorder={onReorder}
              onDelete={onDelete}
              items={chapter.sections || []}
            />
            {chapter.sections.length === 0 && (
              <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  No sections yet
                </p>
                {!chapter.title && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Add chapter title to use AI generation
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

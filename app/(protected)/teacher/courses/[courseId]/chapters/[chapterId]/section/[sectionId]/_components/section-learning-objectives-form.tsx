"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Target, Loader2 } from "lucide-react";
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

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-lg",
            "bg-gradient-to-br from-indigo-500/10 to-purple-500/10",
            "dark:from-indigo-500/20 dark:to-purple-500/20",
            "border border-indigo-500/20 dark:border-indigo-500/30"
          )}>
            <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Learning Objectives
            </h3>
            <p className="text-xs text-muted-foreground">
              Define what students will learn in this section
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <AISectionContentGenerator
            sectionTitle={initialData.title}
            chapterTitle={chapterTitle}
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
            contentType="learningObjectives"
            onGenerate={(content) => {
              form.setValue('learningObjectives', content);
              setIsEditing(true);
            }}
            disabled={!initialData.title}
            existingContent={initialData.learningObjectives}
          />
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
            className={cn(
              "bg-indigo-500/5 dark:bg-indigo-500/10",
              "text-indigo-600 dark:text-indigo-400",
              "hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20",
              "border border-indigo-500/20 dark:border-indigo-500/30",
              "flex-1 sm:flex-none justify-center",
              "transition-all duration-200",
              "h-9 px-4 text-xs font-medium"
            )}
          >
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <Pencil className="h-3 w-3 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "px-3 py-2.5 rounded-lg",
            "bg-muted/30",
            "border border-border"
          )}
        >
          {!initialData.learningObjectives ? (
            <p className="text-sm italic text-muted-foreground">
              No learning objectives defined yet
            </p>
          ) : (
            <ContentViewer
              content={initialData.learningObjectives}
              className={cn(
                "text-foreground prose prose-sm max-w-none",
                "prose-headings:text-foreground",
                "prose-p:text-foreground",
                "prose-strong:text-foreground",
                "prose-ul:text-foreground",
                "prose-li:text-foreground",
                "prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
              )}
            />
          )}
        </motion.div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="learningObjectives"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className={cn(
                      "rounded-lg",
                      "border border-border",
                      "bg-background"
                    )}>
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="List the learning objectives for this section..."
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                size="sm"
                className={cn(
                  "bg-indigo-600 dark:bg-indigo-500",
                  "text-white",
                  "hover:bg-indigo-700 dark:hover:bg-indigo-600",
                  "w-full sm:w-auto justify-center",
                  "transition-all duration-200",
                  "shadow-sm",
                  "h-9 px-4 text-xs font-medium",
                  !isValid && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-3 w-3" />
                    </motion.div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

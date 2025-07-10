"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, AlignLeft, FileText } from "lucide-react";
import { AIChapterAssistant } from "./ai-chapter-assistant";
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

interface ChapterDescriptionFormProps {
  initialData: {
    description: string | null;
    title: string;
  };
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const ChapterDescriptionForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncatedContent, setTruncatedContent] = useState(initialData.description || "");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const truncateHtml = (html: string, maxLength: number) => {
      const div = document.createElement('div');
      div.innerHTML = html || '';
      const text = div.textContent || div.innerText;
      if (text.length <= maxLength) return html;
      return text.substring(0, maxLength).trim() + '...';
    };

    if (initialData.description) {
      setTruncatedContent(isExpanded 
        ? initialData.description 
        : truncateHtml(initialData.description, 150)
      );
    }
  }, [isExpanded, initialData.description]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, values);
      toast.success("Chapter updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleAIGenerate = (content: string) => {
    form.setValue("description", content);
    form.trigger("description");
    if (!isEditing) {
      setIsEditing(true);
    }
    toast.success("Description generated! You can edit it before saving.");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={cn(
      "p-4 mt-6 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/40",
      "hover:bg-gray-50 dark:hover:bg-gray-800/60",
      "transition-all duration-200",
      "backdrop-blur-sm",
      "group"
    )}>
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-x-2">
            <div className="p-2 w-fit rounded-md bg-cyan-50 dark:bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
              Chapter Description
            </p>
          </div>
          {!isEditing && (
            <div className="mt-2">
              {!initialData.description ? (
                <p className="text-sm italic text-gray-600 dark:text-gray-400">
                  No description provided yet
                </p>
              ) : (
                <div className="space-y-2">
                  <ContentViewer 
                    content={truncatedContent}
                    className={cn(
                      "text-gray-700 dark:text-gray-300 prose prose-sm max-w-none",
                      "prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
                      "prose-p:text-gray-700 dark:prose-p:text-gray-300",
                      "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
                      "prose-ul:text-gray-700 dark:prose-ul:text-gray-300"
                    )}
                  />
                  {initialData.description.length > 150 && (
                    <Button
                      onClick={() => setIsExpanded(!isExpanded)}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-cyan-700 dark:text-cyan-300",
                        "hover:text-cyan-800 dark:hover:text-cyan-200",
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
          <AIChapterAssistant
            chapterTitle={initialData.title}
            type="description"
            onGenerate={handleAIGenerate}
            disabled={!initialData.title}
          />
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
            className={cn(
              "text-cyan-700 dark:text-cyan-300",
              "hover:text-cyan-800 dark:hover:text-cyan-200",
              "hover:bg-cyan-50 dark:hover:bg-cyan-500/10",
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
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className={cn(
                      "rounded-lg shadow-lg",
                      "border border-gray-200 dark:border-gray-700/50",
                      "bg-white dark:bg-gray-900/50"
                    )}>
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write a detailed description of your chapter..."
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
                  "bg-cyan-50 dark:bg-cyan-500/10",
                  "text-cyan-700 dark:text-cyan-300",
                  "hover:bg-cyan-100 dark:hover:bg-cyan-500/20",
                  "hover:text-cyan-800 dark:hover:text-cyan-200",
                  "border border-cyan-200/20 dark:border-cyan-500/20",
                  "w-full sm:w-auto",
                  "justify-center",
                  "transition-all duration-200",
                  "shadow-lg"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent" />
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
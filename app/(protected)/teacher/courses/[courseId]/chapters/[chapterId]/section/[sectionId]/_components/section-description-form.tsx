"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, FileText, Loader2 } from "lucide-react";
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

interface SectionDescriptionFormProps {
  initialData: {
    description: string | null;
    title: string;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const SectionDescriptionForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
}: SectionDescriptionFormProps) => {
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
            "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
            "dark:from-blue-500/20 dark:to-cyan-500/20",
            "border border-blue-500/20 dark:border-blue-500/30"
          )}>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Section Description
            </h3>
            <p className="text-xs text-muted-foreground">
              Provide a detailed overview of this section
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="ghost"
          size="sm"
          className={cn(
            "bg-blue-500/5 dark:bg-blue-500/10",
            "text-blue-600 dark:text-blue-400",
            "hover:bg-blue-500/10 dark:hover:bg-blue-500/20",
            "border border-blue-500/20 dark:border-blue-500/30",
            "w-full sm:w-auto justify-center",
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
          {!initialData.description ? (
            <p className="text-sm italic text-muted-foreground">
              No description provided yet
            </p>
          ) : (
            <div className="space-y-2">
              <ContentViewer
                content={truncatedContent}
                className={cn(
                  "text-foreground prose prose-sm max-w-none",
                  "prose-headings:text-foreground",
                  "prose-p:text-foreground",
                  "prose-strong:text-foreground",
                  "prose-ul:text-foreground",
                  "prose-li:text-foreground",
                  "prose-a:text-blue-600 dark:prose-a:text-blue-400"
                )}
              />
              {initialData.description.length > 150 && (
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-blue-700 dark:text-blue-300",
                    "hover:text-blue-800 dark:hover:text-blue-200",
                    "p-0 h-auto",
                    "text-sm font-medium"
                  )}
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>
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
              name="description"
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
                        placeholder="Write a detailed description of this section..."
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
                  "bg-blue-600 dark:bg-blue-500",
                  "text-white",
                  "hover:bg-blue-700 dark:hover:bg-blue-600",
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

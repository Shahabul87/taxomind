"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionTitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export const SectionTitleForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
}: SectionTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-lg",
            "bg-gradient-to-br from-blue-500/10 to-indigo-500/10",
            "dark:from-blue-500/20 dark:to-indigo-500/20",
            "border border-blue-500/20 dark:border-blue-500/30"
          )}>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Section Title
            </h3>
            <p className="text-xs text-muted-foreground">
              Give your section a clear, descriptive title
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
            "h-8 px-3 text-xs font-medium"
          )}
        >
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-3 w-3 mr-1.5" />
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
          <p className="text-sm font-medium text-foreground">
            {initialData.title || "No title set"}
          </p>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      placeholder="e.g. 'Introduction to the topic'"
                      data-form="section-title"
                      className={cn(
                        "bg-background",
                        "border-border",
                        "text-sm",
                        "h-9",
                        "transition-all duration-200"
                      )}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2 pt-2">
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
                  "h-8 px-3 text-xs font-medium",
                  !isValid && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-1.5">
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
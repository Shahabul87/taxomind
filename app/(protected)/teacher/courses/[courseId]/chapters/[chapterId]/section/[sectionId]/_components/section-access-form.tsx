"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lock, Unlock, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface SectionAccessFormProps {
  initialData: {
    isFree: boolean;
    isPublished: boolean;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

const formSchema = z.object({
  isFree: z.boolean().default(false),
});

export const SectionAccessForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
}: SectionAccessFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFree: !!initialData.isFree
    },
  });

  const { isSubmitting } = form.formState;

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`,
        values
      );
      toast.success("Section access updated");
      toggleEdit();
      router.refresh();
    } catch (error: any) {
      logger.error("Section access update error:", error);
      toast.error(error.response?.data || "Failed to update section access");
    }
  };

  return (
    <div className="space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col gap-4">
            {/* Access status display */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <div className={cn(
                  "p-2 rounded-md",
                  initialData.isFree
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-purple-100 dark:bg-purple-900/30"
                )}>
                  {initialData.isFree ? (
                    <Unlock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-semibold text-sm",
                    initialData.isFree
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-purple-700 dark:text-purple-300"
                  )}>
                    {initialData.isFree ? "Free Preview" : "Premium Content"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                    {initialData.isFree
                      ? "This section is available as a free preview to attract students"
                      : "Students need to enroll in the course to access this section"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Edit button - aligned to right */}
            <div className="flex items-center justify-end">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 px-4",
                  "bg-white/80 dark:bg-slate-800/80",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-800",
                  "hover:border-purple-300 dark:hover:border-purple-600",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "font-semibold",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className={cn(
                  "p-4 rounded-lg",
                  "border border-slate-200 dark:border-slate-700",
                  "bg-slate-50 dark:bg-slate-900/50"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
                    <div className="space-y-1 flex-1">
                      <p className={cn(
                        "font-semibold text-sm",
                        field.value
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-purple-700 dark:text-purple-300"
                      )}>
                        Free Preview
                      </p>
                      <FormDescription className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        Enable this to make the section available as a free preview. This helps attract potential students by giving them a taste of your course content.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className={cn(
                          "data-[state=checked]:bg-emerald-600"
                        )}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-x-2">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-9 px-4",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-700",
                  "hover:text-slate-900 dark:hover:text-slate-100",
                  "hover:border-slate-400 dark:hover:border-slate-500",
                  "font-semibold",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
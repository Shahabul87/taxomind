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

  const toggleEdit = () => setIsEditing((current) => !current);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 sm:gap-4 transition-all duration-300">
            <div className="flex-1 min-w-0 w-full xs:w-auto">
              {initialData.title ? (
                <p className="text-sm sm:text-base md:text-lg font-medium text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                  {initialData.title}
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-2.5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 px-2.5 sm:px-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No title set
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-2.5 sm:px-3">
                    Add a clear, descriptive title for your section
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={toggleEdit}
              variant="outline"
              size="sm"
              className={cn(
                "flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto",
                "bg-white/80 dark:bg-slate-800/80",
                "border-slate-200 dark:border-slate-700",
                "text-slate-700 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "hover:border-purple-300 dark:hover:border-purple-600",
                "hover:text-purple-600 dark:hover:text-purple-400",
                "font-semibold text-xs sm:text-sm",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                "backdrop-blur-sm",
                "justify-center xs:justify-start"
              )}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 sm:space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="e.g. 'Introduction to the topic'"
                        className={cn(
                          "pr-3 sm:pr-20",
                          "bg-white dark:bg-slate-900",
                          "border border-slate-300/60 dark:border-slate-600/60",
                          "text-slate-900 dark:text-slate-100",
                          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          "focus:border-slate-400/70 dark:focus:border-slate-500/70",
                          "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                          "text-sm sm:text-base font-normal",
                          "h-10 sm:h-11",
                          "rounded-md",
                          "transition-all duration-200",
                          "w-full"
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2 sm:gap-x-2">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-10 sm:h-9 px-4 w-full xs:w-auto",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-700",
                  "hover:text-slate-900 dark:hover:text-slate-100",
                  "hover:border-slate-400 dark:hover:border-slate-500",
                  "font-semibold text-xs sm:text-sm",
                  "transition-all duration-200",
                  "justify-center xs:justify-start"
                )}
              >
                Cancel
              </Button>
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                size="sm"
                className={cn(
                  "h-10 sm:h-9 px-4 w-full xs:w-auto",
                  "bg-emerald-600 hover:bg-emerald-700 text-white",
                  "font-semibold text-xs sm:text-sm",
                  "justify-center xs:justify-start",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
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
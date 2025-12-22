"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useSAMFormSync } from "@/hooks/use-sam-form-sync";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
});

interface CreateCourseInputSectionProps {
  onBack?: () => void;
}

const titleSuggestions = [
  "Introduction to Machine Learning",
  "Advanced Web Development with React",
  "Data Science Fundamentals",
  "Digital Marketing Masterclass",
  "Financial Analysis for Beginners",
];

export const CreateCourseInputSection = ({ onBack }: CreateCourseInputSectionProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid, errors } = form.formState;
  const titleValue = form.watch("title");
  const characterCount = titleValue?.length || 0;

  // Enable SAM AI Assistant context awareness for course creation
  useSAMFormSync("create-course-form", form.watch, {
    formName: "Create Course",
    metadata: {
      formType: "course-creation",
      purpose: "Create new course with AI assistance",
      entityType: "course",
      userRole: "teacher",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("/api/courses", values);
      router.push(`/teacher/courses/${response.data.id}`);
      toast.success("Course created successfully!");
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: string; statusText?: string }; request?: unknown; message?: string };
      logger.error("Course creation error:", error);

      if (axiosError.response) {
        const errorMessage =
          axiosError.response.data || axiosError.response.statusText || "Unknown error";
        logger.error(
          `Server error response: ${axiosError.response.status} - ${errorMessage}`
        );

        if (axiosError.response.status === 401) {
          toast.error("You need to be logged in as a teacher to create courses");
        } else if (axiosError.response.status === 403) {
          toast.error("You don't have permission to create courses");
        } else if (axiosError.response.status === 400) {
          toast.error(`Validation error: ${errorMessage}`);
        } else {
          toast.error(`Server error: ${errorMessage}`);
        }
      } else if (axiosError.request) {
        logger.error("Network error:", axiosError.request);
        toast.error("Network error - please check your connection");
      } else {
        logger.error("Request setup error:", axiosError.message);
        toast.error("Something went wrong with the request");
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue("title", suggestion, { shouldValidate: true });
  };

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Name Your Course
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Start with a compelling title
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            id="create-course-form"
            data-form="create-course"
            data-purpose="create-new-course"
            data-entity-type="course"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Course Title
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g. 'Introduction to Python Programming'"
                        {...field}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        name="title"
                        data-field-purpose="course-title"
                        data-validation="required,min:3,max:100"
                        data-content-type="course-title"
                        className={cn(
                          "h-12 sm:h-14 text-base sm:text-lg font-medium transition-all duration-300",
                          "bg-white dark:bg-slate-900/50",
                          "border-2 rounded-xl",
                          "text-slate-900 dark:text-white",
                          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          isFocused
                            ? "border-blue-500 ring-4 ring-blue-500/10"
                            : "border-slate-200 dark:border-slate-700",
                          errors.title && "border-red-500 ring-4 ring-red-500/10"
                        )}
                      />

                      {/* Character counter */}
                      <div
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors",
                          characterCount > 80
                            ? "text-amber-500"
                            : characterCount > 0
                            ? "text-slate-400"
                            : "text-transparent"
                        )}
                      >
                        {characterCount}/100
                      </div>
                    </div>
                  </FormControl>

                  {/* Validation feedback */}
                  <AnimatePresence mode="wait">
                    {titleValue && titleValue.length >= 3 && !errors.title && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Great title!</span>
                      </motion.div>
                    )}
                    {errors.title && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <FormMessage />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FormDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Choose a clear, descriptive title that tells learners what they&apos;ll achieve.
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Suggestions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Need inspiration?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {titleSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "px-3 py-1.5 text-xs sm:text-sm rounded-lg",
                      "bg-slate-100 dark:bg-slate-800",
                      "text-slate-600 dark:text-slate-300",
                      "border border-slate-200 dark:border-slate-700",
                      "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700",
                      "dark:hover:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:text-blue-300",
                      "transition-all duration-200"
                    )}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 text-sm",
                    "text-slate-600 dark:text-slate-400",
                    "hover:text-slate-900 dark:hover:text-white",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "transition-colors"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to options
                </Button>
              )}

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  "flex-1 sm:flex-none sm:ml-auto h-11 px-6 text-sm font-semibold",
                  "bg-gradient-to-r from-blue-600 to-indigo-600",
                  "hover:from-blue-700 hover:to-indigo-700",
                  "text-white rounded-xl",
                  "shadow-lg shadow-blue-500/25",
                  "hover:shadow-xl hover:shadow-blue-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "disabled:shadow-none",
                  "transition-all duration-300"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Course
                  </>
                )}
              </Button>
            </div>

            {/* Info box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/10 border border-slate-200/50 dark:border-slate-700/50"
            >
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  What&apos;s next?
                </span>{" "}
                After creating your course, you&apos;ll be able to add chapters, upload content, set pricing, and customize every aspect of your learning experience.
              </p>
            </motion.div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
};

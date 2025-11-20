"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';
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
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

interface CreateCourseInputSectionProps {
  onBack?: () => void;
}

export const CreateCourseInputSection = ({ onBack }: CreateCourseInputSectionProps) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ""
    },
  });

  const { isSubmitting, isValid } = form.formState;

  // Enable SAM AI Assistant context awareness for course creation
  useSAMFormSync('create-course-form', form.watch, {
    formName: 'Create Course',
    metadata: {
      formType: 'course-creation',
      purpose: 'Create new course with AI assistance',
      entityType: 'course',
      userRole: 'teacher'
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {

      const response = await axios.post("/api/courses", values);

      router.push(`/teacher/courses/${response.data.id}`);
      toast.success("Course created successfully!");
    } catch (error: any) {
      logger.error('Course creation error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        const errorMessage = error.response.data || error.response.statusText || "Unknown error";
        logger.error(`Server error response: ${error.response.status} - ${errorMessage}`);
        
        if (error.response.status === 401) {
          toast.error("You need to be logged in as a teacher to create courses");
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to create courses");
        } else if (error.response.status === 400) {
          toast.error(`Validation error: ${errorMessage}`);
        } else {
          toast.error(`Server error: ${errorMessage}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        logger.error('Network error:', error.request);
        toast.error("Network error - please check your connection");
      } else {
        // Something happened in setting up the request
        logger.error('Request setup error:', error.message);
        toast.error("Something went wrong with the request");
      }
    }
  }

  return ( 
    <div className="p-3 sm:p-4 md:p-6">
      <Form {...form}>
        <form
          id="create-course-form"
          data-form="create-course"
          data-purpose="create-new-course"
          data-entity-type="course"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 sm:space-y-8"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base text-gray-900 dark:text-gray-200 font-semibold">
                  Course Title
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. 'Advanced Web Development with Next.js'"
                    {...field}
                    name="title"
                    data-field-purpose="course-title"
                    data-validation="required,min:3,max:100"
                    data-content-type="course-title"
                    className={cn(
                      "text-sm sm:text-base font-medium transition-all duration-200 h-10 sm:h-11",
                      "bg-white dark:bg-gray-900/50",
                      "border-gray-200 dark:border-gray-700/50",
                      "text-gray-900 dark:text-gray-200",
                      "placeholder:text-gray-500/80 dark:placeholder:text-gray-500/80",
                      "focus:ring-purple-500/20"
                    )}
                  />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Choose a clear and engaging title that describes your course content.
                </FormDescription>
                <FormMessage className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm" />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-x-2">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className={cn(
                  "flex items-center justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm",
                  "text-gray-600 dark:text-gray-400",
                  "hover:text-gray-900 dark:hover:text-white",
                  "transition-colors w-full sm:w-auto"
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Back to selection</span>
                <span className="xs:hidden">Back</span>
              </Button>
            ) : (
              <Link href="/teacher/courses" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "flex items-center justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto",
                    "text-gray-600 dark:text-gray-400",
                    "hover:text-gray-900 dark:hover:text-white",
                    "transition-colors"
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Back to courses</span>
                  <span className="xs:hidden">Back</span>
                </Button>
              </Link>
            )}
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "w-full sm:w-auto sm:ml-auto transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm",
                "bg-purple-600 hover:bg-purple-700",
                "dark:bg-purple-500 dark:hover:bg-purple-600",
                "text-white"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
   );
}
 
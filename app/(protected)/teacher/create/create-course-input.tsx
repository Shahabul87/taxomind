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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log('Submitting course creation with:', values);
      const response = await axios.post("/api/courses", values);
      console.log('Course creation response:', response.data);
      router.push(`/teacher/courses/${response.data.id}`);
      toast.success("Course created successfully!");
    } catch (error: any) {
      console.error('Course creation error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        const errorMessage = error.response.data || error.response.statusText || "Unknown error";
        console.error('Server error response:', error.response.status, errorMessage);
        
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
        console.error('Network error:', error.request);
        toast.error("Network error - please check your connection");
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        toast.error("Something went wrong with the request");
      }
    }
  }

  return ( 
    <div className="p-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-200 font-semibold">
                  Course Title
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. 'Advanced Web Development with Next.js'"
                    {...field}
                    className={cn(
                      "text-base font-medium transition-all duration-200",
                      "bg-white dark:bg-gray-900/50",
                      "border-gray-200 dark:border-gray-700/50",
                      "text-gray-900 dark:text-gray-200",
                      "placeholder:text-gray-500/80 dark:placeholder:text-gray-500/80",
                      "focus:ring-purple-500/20"
                    )}
                  />
                </FormControl>
                <FormDescription className="text-gray-600 dark:text-gray-400">
                  Choose a clear and engaging title that describes your course content.
                </FormDescription>
                <FormMessage className="text-rose-600 dark:text-rose-400" />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-x-2">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className={cn(
                  "flex items-center gap-2",
                  "text-gray-600 dark:text-gray-400",
                  "hover:text-gray-900 dark:hover:text-white",
                  "transition-colors"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to selection
              </Button>
            ) : (
              <Link href="/teacher/courses">
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2",
                    "text-gray-600 dark:text-gray-400",
                    "hover:text-gray-900 dark:hover:text-white",
                    "transition-colors"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to courses
                </Button>
              </Link>
            )}
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "ml-auto transition-all duration-200",
                "bg-purple-600 hover:bg-purple-700",
                "dark:bg-purple-500 dark:hover:bg-purple-600",
                "text-white"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
 
"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Type, Check, X, RefreshCw, Heading, BookText } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PostchapterTitleFormProps {
  initialData: {
    title: string;
  };
  postId: string;
  chapterId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export const PostchapterTitleForm = ({
  initialData,
  postId,
  chapterId,
}: PostchapterTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<{
    success?: boolean;
    error?: boolean;
    message?: string;
  }>({});
  
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  // Handle form submission status updates with useEffect instead of in render
  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message || "Title updated");
      setFormState({});
    } else if (formState.error) {
      toast.error(formState.message || "Something went wrong");
      setFormState({});
    }
  }, [formState]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}`, values);
      setFormState({ success: true, message: "Title updated" });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setFormState({ error: true, message: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  }, [postId, chapterId, router]);

  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl transition-all duration-300">
      {/* Background design elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/30 -z-10"></div>
      
      {/* Shape decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-100/20 to-violet-200/20 blur-3xl dark:from-blue-900/10 dark:to-violet-900/10 -z-5"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-100/20 to-blue-200/20 blur-3xl dark:from-indigo-900/10 dark:to-blue-900/10 -z-5"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.100/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.100/10)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,theme(colors.gray.800/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.800/10)_1px,transparent_1px)] -z-5"></div>

      <div className="relative border border-gray-200/70 dark:border-gray-800/50 shadow-lg dark:shadow-blue-500/5 transition-all duration-300 backdrop-blur-sm">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200/70 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/50 px-7 py-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 opacity-70 blur-md group-hover:opacity-100 transition duration-200"></div>
              <div className="relative flex items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800">
                <BookText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                Chapter Title
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create a compelling title for your chapter
              </p>
            </div>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0 gap-2 self-end sm:self-auto">
            <Button
              onClick={handleToggleEdit}
              variant={isEditing ? "outline" : "default"}
              size="sm"
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                isEditing 
                  ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20"
              )}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Heading className="h-3.5 w-3.5" />
                  <span>Edit Title</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm p-7">
          {/* Current Title Display */}
          {!isEditing && (
            <div className="rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800/50 shadow-sm">
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-800/50">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Current Title</h4>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-6">
                {initialData.title ? (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                    {initialData.title}
                  </h2>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                      <Type className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No title provided yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto mt-2">
                      Add a compelling title to help readers understand what this chapter is about.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editor Form */}
          {isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800/50 shadow-sm">
                  <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <Heading className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Chapter Title</h4>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                disabled={isSubmitting || isLoading}
                                placeholder="Enter an engaging chapter title..."
                                className={cn(
                                  "bg-white dark:bg-gray-900/50",
                                  "border-gray-200/70 dark:border-gray-700/50",
                                  "text-gray-900 dark:text-gray-100",
                                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                  "focus:ring-2 focus:ring-offset-1",
                                  "focus:ring-blue-500/30 dark:focus:ring-blue-500/20",
                                  "focus:border-blue-500/50 dark:focus:border-blue-500/50",
                                  "font-medium text-lg py-6",
                                  "shadow-sm"
                                )}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                <Type className="h-4 w-4" />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage className="mt-2 text-rose-500 dark:text-rose-400 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleEdit}
                    className="border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={isSubmitting || isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting || isLoading}
                    className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
                  >
                    {(isSubmitting || isLoading) ? (
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}; 
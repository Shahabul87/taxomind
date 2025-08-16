"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, FileText, Check, X, RefreshCw, Book, Star, Sparkles, Lightbulb, PenTool } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
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
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";

interface PostChapterDescriptionFormProps {
  initialData: {
    description: string | null;
  };
  postchapterId: string;
  postId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const PostchapterDescriptionForm = ({
  initialData,
  postchapterId,
  postId,
}: PostChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inspirationOpen, setInspirationOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const toggleEdit = () => {
    setIsEditing((current) => !current);
    setInspirationOpen(false);
  };

  const toggleInspiration = () => {
    setInspirationOpen(prev => !prev);
  };

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isEditing]);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/posts/${postId}/postchapters/${postchapterId}`, values);
      toast.success("Chapter description updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const inspirationTips = [
    { icon: Book, text: "Begin with a compelling hook that draws readers in" },
    { icon: Star, text: "Include key takeaways that readers will learn" },
    { icon: Lightbulb, text: "Present a problem and explain how this chapter addresses it" },
    { icon: PenTool, text: "Use descriptive language that engages the senses" }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl transition-all duration-300">
      {/* Background design elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950/30 -z-10"></div>
      
      {/* Shape decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-100/20 to-indigo-200/20 blur-3xl dark:from-blue-900/10 dark:to-indigo-900/10 -z-5"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-pink-100/20 to-purple-200/20 blur-3xl dark:from-pink-900/10 dark:to-purple-900/10 -z-5"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.100/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.100/10)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,theme(colors.gray.800/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.800/10)_1px,transparent_1px)] -z-5"></div>

      <div className="relative border border-gray-200/70 dark:border-gray-800/50 shadow-lg dark:shadow-indigo-500/5 transition-all duration-300 backdrop-blur-sm">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200/70 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/50 px-7 py-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 opacity-70 blur-md group-hover:opacity-100 transition duration-200"></div>
              <div className="relative flex items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-indigo-600 to-blue-600 dark:from-pink-400 dark:via-indigo-400 dark:to-blue-400">
                Chapter Content
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create engaging content for your readers
              </p>
            </div>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0 gap-2 self-end sm:self-auto">
            {!isEditing && (
              <Button
                onClick={toggleInspiration}
                variant="outline"
                size="sm"
                className="border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                <span>Tips</span>
              </Button>
            )}
            <Button
              onClick={toggleEdit}
              variant={isEditing ? "outline" : "default"}
              size="sm"
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                isEditing 
                  ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20" 
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20"
              )}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Content</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm p-7">
          {/* Inspiration Tips */}
          {inspirationOpen && !isEditing && (
            <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
              <div className="px-5 py-4 bg-indigo-600/10 border-b border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-medium text-indigo-900 dark:text-indigo-300">Writing Inspiration</h4>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {inspirationTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <tip.icon className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview */}
          {!isEditing && (
            <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800/50 p-7 overflow-auto max-h-[600px] shadow-sm">
              {!initialData.description && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                    No content yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                    Get started by adding compelling content that will engage your readers.
                  </p>
                </div>
              )}
              {initialData.description && (
                <div className="prose prose-indigo dark:prose-invert prose-headings:font-display max-w-none">
                  <Preview value={initialData.description} />
                </div>
              )}
            </div>
          )}

          {/* Editor Form */}
          {isEditing && (
            <div ref={editorRef}>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800/50 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all duration-200">
                    <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-800/50 px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Editor</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="min-h-[400px] bg-white dark:bg-gray-900">
                              <Editor
                                onChange={field.onChange}
                                value={field.value}
                                placeholder="Write compelling content for your chapter..."
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="px-4 py-2 text-red-500 dark:text-red-400 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleEdit}
                      className="border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      disabled={isSubmitting || isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isValid || isSubmitting || isLoading}
                      className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/20"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
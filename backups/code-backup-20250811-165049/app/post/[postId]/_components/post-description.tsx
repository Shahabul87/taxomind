"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, AlignLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Post } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TipTapEditor from "@/components/tiptap/editor";
import ContentViewer from "@/components/tiptap/content-viewer";

interface DescriptionFormProps {
  initialData: Post;
  postId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

export const PostDescription = ({
  initialData,
  postId
}: DescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Description updated");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-white/50 dark:bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-all duration-200">
      {!isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-x-2">
              <AlignLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-gray-900 dark:text-gray-200 text-sm sm:text-base">
                Description
              </span>
              {!initialData.description && (
                <span className="text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Required
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {initialData.description ? (
                <ContentViewer 
                  content={initialData.description} 
                  className="prose-sm dark:prose-invert max-w-none" 
                />
              ) : (
                <p className="italic text-gray-500 dark:text-gray-400">
                  No description provided. Click edit to add one.
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            className="w-full sm:w-auto text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:text-purple-300 dark:hover:bg-purple-500/10"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLButtonElement) {
                e.preventDefault();
              }
            }}
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Write a compelling description for your post
                  </FormDescription>
                  <FormControl>
                    <div className="bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg overflow-hidden">
                      <TipTapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write a compelling description for your post..."
                        editorClassName="[&_.tiptap]:!text-gray-900 dark:[&_.tiptap]:!text-gray-200 min-h-[200px]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                variant="ghost"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 dark:hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TitleFormProps {
  initialData: {
    title: string;
  };
  postId: string;
};

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export const PostTitleForm = ({
  initialData,
  postId
}: TitleFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveKey, setSaveKey] = useState(0);

  const savedText = useMemo(() => {
    if (!savedAt) return "";
    const d = savedAt;
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `Saved at ${hh}:${mm}`;
  }, [savedAt]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Post updated");
      setIsEditing(false);
      setSavedAt(new Date());
      setSaveKey((k) => k + 1);
      router.refresh();
    } catch (error: any) {
      logger.error("Error updating post:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-white/50 dark:bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-all duration-200">
      {!isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-x-2 text-sm sm:text-base">
              <span>Post Title</span>
              {!initialData.title && (
                <span className="text-xs text-rose-500 dark:text-rose-400">
                  (required)
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
              {initialData.title || "No title set"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span key={saveKey} className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
                {savedText}
              </span>
            )}
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              className="w-full sm:w-auto text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:text-purple-300 dark:hover:bg-purple-500/10"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
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
                      placeholder="e.g. 'Introduction to Programming'"
                      className="bg-white dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-200 focus:ring-purple-500/20 dark:focus:ring-purple-500/30 focus:border-purple-500/30 dark:focus:border-purple-500/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
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
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 w-full sm:w-auto"
              >
                Cancel
              </Button>
              {savedAt && (
                <span key={`edit-${saveKey}`} className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
                  {savedText}
                </span>
              )}
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

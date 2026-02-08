"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Type, Check, X } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

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

interface TitleFormProps {
  initialData: {
    title: string;
  };
  postId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const PostTitleForm = ({ initialData, postId }: TitleFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = useCallback(() => {
    setIsEditing((current) => !current);
    if (!isEditing) {
      form.reset(initialData);
    }
  }, [isEditing, form, initialData]);

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Title updated successfully");
      setIsEditing(false);

      // Dispatch custom event for parent component
      window.dispatchEvent(new CustomEvent("post-saved"));
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Error updating post title:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to update title");
      } else {
        logger.error("Unexpected error:", error);
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div
      className={cn(
        "group relative",
        "bg-white dark:bg-slate-900/50",
        "border border-slate-200/80 dark:border-slate-800",
        "rounded-xl overflow-hidden",
        "transition-all duration-200",
        isEditing && "ring-2 ring-violet-500/20"
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                "bg-violet-500/10 text-violet-600"
              )}
            >
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Post Title
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData.title ? "Click edit to modify" : "Required field"}
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button
              onClick={toggleEdit}
              variant="ghost"
              size="sm"
              className={cn(
                "text-violet-600 hover:text-violet-700",
                "hover:bg-violet-500/10"
              )}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {!isEditing ? (
          <div className="space-y-1">
            {initialData.title ? (
              <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                {initialData.title}
              </p>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No title set - click edit to add one
                </p>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="e.g. 'Introduction to Machine Learning'"
                        data-form="post-title"
                        className={cn(
                          "bg-white dark:bg-slate-900",
                          "border-slate-200 dark:border-slate-700",
                          "text-slate-800 dark:text-slate-200",
                          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          "focus:ring-violet-500/20 focus:border-violet-500/50",
                          "text-base py-3"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  size="sm"
                  className={cn(
                    "bg-violet-600 hover:bg-violet-700 text-white",
                    "shadow-sm"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleEdit}
                  disabled={isSubmitting}
                  className={cn(
                    "text-slate-600 dark:text-slate-400",
                    "hover:text-slate-800 dark:hover:text-slate-200",
                    "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

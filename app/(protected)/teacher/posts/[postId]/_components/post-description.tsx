"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, AlignLeft, Check, X } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DescriptionFormProps {
  initialData: { description: string | null };
  postId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const PostDescription = ({
  initialData,
  postId,
}: DescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = useCallback(() => {
    setIsEditing((current) => !current);
    if (!isEditing) {
      form.reset({ description: initialData.description || "" });
    }
  }, [isEditing, form, initialData.description]);

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Description updated successfully");
      setIsEditing(false);

      window.dispatchEvent(new CustomEvent("post-saved"));
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Error updating description:", error.response?.data);
        toast.error(
          error.response?.data?.message || "Failed to update description"
        );
      } else {
        logger.error("Unexpected error:", error);
        toast.error("Something went wrong");
      }
    }
  };

  // Word count for SEO hint
  const wordCount = initialData.description
    ? initialData.description.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div
      className={cn(
        "group relative",
        "bg-white dark:bg-slate-900/50",
        "border border-slate-200/80 dark:border-slate-800",
        "rounded-xl overflow-hidden",
        "transition-all duration-200",
        isEditing && "ring-2 ring-[#C65D3B]/20"
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                "bg-[#C4A35A]/10 text-[#C4A35A]"
              )}
            >
              <AlignLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white font-[family-name:var(--font-ui)]">
                Description
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-ui)]">
                {initialData.description
                  ? `${wordCount} words`
                  : "Required field"}
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button
              onClick={toggleEdit}
              variant="ghost"
              size="sm"
              className={cn(
                "text-[#C65D3B] hover:text-[#A84D32]",
                "hover:bg-[#C65D3B]/10",
                "font-[family-name:var(--font-ui)]"
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
            {initialData.description ? (
              <div
                className={cn(
                  "text-sm text-slate-600 dark:text-slate-300",
                  "leading-[1.8] font-[family-name:var(--font-body)]",
                  "prose prose-sm dark:prose-invert max-w-none"
                )}
              >
                <p className="whitespace-pre-wrap">{initialData.description}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-sm text-slate-500 dark:text-slate-400 italic font-[family-name:var(--font-body)]">
                  No description provided - click edit to add one
                </p>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-ui)] mb-2">
                      Write a compelling description for your post (aim for
                      150-300 words for SEO)
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isSubmitting}
                        placeholder="e.g. 'This post explores the fascinating world of...'"
                        className={cn(
                          "bg-white dark:bg-slate-900",
                          "border-slate-200 dark:border-slate-700",
                          "text-slate-800 dark:text-slate-200",
                          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          "focus:ring-[#C65D3B]/20 focus:border-[#C65D3B]/50",
                          "font-[family-name:var(--font-body)]",
                          "min-h-[180px] resize-y leading-[1.8]"
                        )}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage className="text-rose-500 text-xs font-[family-name:var(--font-ui)]" />
                      <span
                        className={cn(
                          "text-xs font-[family-name:var(--font-ui)]",
                          field.value?.trim().split(/\s+/).filter(Boolean)
                            .length >= 150
                            ? "text-[#87A878]"
                            : "text-slate-400"
                        )}
                      >
                        {field.value?.trim().split(/\s+/).filter(Boolean)
                          .length || 0}{" "}
                        words
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  size="sm"
                  className={cn(
                    "bg-[#C65D3B] hover:bg-[#A84D32] text-white",
                    "font-[family-name:var(--font-ui)]",
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
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "font-[family-name:var(--font-ui)]"
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

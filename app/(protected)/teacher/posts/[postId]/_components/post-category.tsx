"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Tag, Check, X } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CategoryFormProps {
  initialData: { category: string | null };
  postId: string;
}

const formSchema = z.object({
  category: z.string().min(1, {
    message: "Category is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const categories = [
  { label: "AI & ML", value: "ai-ml" },
  { label: "Architecture", value: "architecture" },
  { label: "Art & Design", value: "art-design" },
  { label: "Biology", value: "biology" },
  { label: "Blockchain", value: "blockchain" },
  { label: "Business & Entrepreneurship", value: "business" },
  { label: "Chemistry", value: "chemistry" },
  { label: "Cloud Computing", value: "cloud" },
  { label: "Cybersecurity", value: "cybersecurity" },
  { label: "Data Science", value: "data-science" },
  { label: "DevOps", value: "devops" },
  { label: "Digital Marketing", value: "digital-marketing" },
  { label: "Engineering", value: "engineering" },
  { label: "Environmental Science", value: "environmental" },
  { label: "Game Development", value: "game-dev" },
  { label: "Health & Medicine", value: "health" },
  { label: "IoT", value: "iot" },
  { label: "Mathematics", value: "mathematics" },
  { label: "Mobile Development", value: "mobile-dev" },
  { label: "Music & Audio", value: "music" },
  { label: "Photography", value: "photography" },
  { label: "Physics", value: "physics" },
  { label: "Programming", value: "programming" },
  { label: "Psychology", value: "psychology" },
  { label: "Science", value: "science" },
  { label: "Space & Astronomy", value: "astronomy" },
  { label: "Technology", value: "technology" },
  { label: "UI/UX Design", value: "ui-ux" },
  { label: "Web Development", value: "web-dev" },
  { label: "Writing & Literature", value: "writing" },
].sort((a, b) => a.label.localeCompare(b.label));

export const PostCategory = ({ initialData, postId }: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialData.category || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = useCallback(() => {
    setIsEditing((current) => !current);
    if (!isEditing) {
      form.reset({ category: initialData.category || "" });
    }
  }, [isEditing, form, initialData.category]);

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Category updated successfully");
      setIsEditing(false);

      window.dispatchEvent(new CustomEvent("post-saved"));
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Error updating category:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to update category");
      } else {
        logger.error("Unexpected error:", error);
        toast.error("Something went wrong");
      }
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.value === initialData.category
  );

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
                "bg-[#87A878]/10 text-[#87A878]"
              )}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white font-[family-name:var(--font-ui)]">
                Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-ui)]">
                {initialData.category ? "Click edit to change" : "Required field"}
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
            {selectedCategory ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "px-3 py-1.5 rounded-full text-sm",
                  "bg-[#87A878]/10 text-[#87A878] dark:text-[#A8C49A]",
                  "border border-[#87A878]/20",
                  "font-[family-name:var(--font-ui)] font-medium"
                )}
              >
                <Tag className="w-3 h-3" />
                {selectedCategory.label}
              </span>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-sm text-slate-500 dark:text-slate-400 italic font-[family-name:var(--font-body)]">
                  No category selected - click edit to choose one
                </p>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-ui)] mb-2">
                      Select a category that best describes your post
                    </FormDescription>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "bg-white dark:bg-slate-900",
                            "border-slate-200 dark:border-slate-700",
                            "text-slate-800 dark:text-slate-200",
                            "focus:ring-[#C65D3B]/20 focus:border-[#C65D3B]/50",
                            "font-[family-name:var(--font-ui)]"
                          )}
                          data-form="post-category"
                        >
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[300px]">
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                            className={cn(
                              "text-slate-800 dark:text-slate-200",
                              "focus:bg-[#C65D3B]/10 focus:text-[#C65D3B]",
                              "font-[family-name:var(--font-ui)]"
                            )}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-rose-500 text-xs font-[family-name:var(--font-ui)]" />
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

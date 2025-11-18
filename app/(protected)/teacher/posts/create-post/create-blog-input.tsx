"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Edit3, ArrowRight, Loader2, Tag, X, Plus } from "lucide-react";
import { logger } from '@/lib/logger';
import { CreatePostClientSchema, type CreatePostClientInput } from "@/lib/schemas/post.schemas";
import type { ApiResponse, CreatePostResponse } from "@/lib/types/post.types";

import {
  Form,
  FormControl,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = [
  "AI & ML", "Architecture", "Art & Design", "Biology", "Blockchain",
  "Business", "Chemistry", "Cloud Computing", "Cybersecurity",
  "Data Science", "DevOps", "Digital Marketing", "Engineering",
  "Environmental", "Game Development", "Health & Medicine", "IoT",
  "Mathematics", "Mobile Development", "Music & Audio", "Photography",
  "Physics", "Programming", "Psychology", "Science", "Space & Astronomy",
  "Technology", "UI/UX Design", "Web Development", "Writing"
].sort();

// Use the enterprise schema from the schemas file
const formSchema = CreatePostClientSchema;

export const CreateBlogInputSection = () => {
  const router = useRouter();
  const [charCount, setCharCount] = useState(0);
  const [isInputValid, setIsInputValid] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DRAFT_KEY = "create-post-draft";
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftSaveKey, setDraftSaveKey] = useState(0);

  const form = useForm<CreatePostClientInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      categories: [],
      customCategory: "",
    },
    mode: "onChange"
  });

  const { isSubmitting } = form.formState;
  const title = form.watch("title");
  const selectedCategories = useMemo(() => form.watch("categories") || [], [form]);

  useEffect(() => {
    // Validate the input based on zod schema requirements
    setIsInputValid(title.length >= 3 && title.length <= 100);
  }, [title]);

  // Notify parent about validity state
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent("create-post-validity", { detail: { valid: isInputValid } })
      );
    } catch {}
  }, [isInputValid]);

  // Notify parent about submitting state
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent("create-post-submitting", { detail: { submitting: isSubmitting } })
      );
    } catch {}
  }, [isSubmitting]);

  useEffect(() => {
    if (categoryInput) {
      const filtered = categories.filter(cat =>
        cat.toLowerCase().includes(categoryInput.toLowerCase()) &&
        !selectedCategories.includes(cat)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [categoryInput, selectedCategories]);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(DRAFT_KEY) : null;
      if (raw) {
        const draft = JSON.parse(raw) as Partial<CreatePostClientInput>;
        form.reset({
          title: draft.title ?? "",
          categories: draft.categories ?? [],
          customCategory: draft.customCategory ?? "",
        });
        setCharCount((draft.title ?? "").length);
      }
    } catch (e) {
      logger.warn("[CreateBlogForm] Failed to load draft", { error: e });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft on changes (debounced)
  useEffect(() => {
    const values = form.getValues();
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
        }
        setDraftSavedAt(new Date());
        setDraftSaveKey((k) => k + 1);
      } catch (e) {
        logger.warn("[CreateBlogForm] Autosave failed", { error: e });
      }
    }, 600);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // Watching relevant fields
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("title"), form.watch("categories"), form.watch("customCategory")]);

  // Handle external save/clear draft commands (from parent header actions)
  useEffect(() => {
    const handleSaveDraft = () => {
      try {
        const values = form.getValues();
        if (typeof window !== "undefined") {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
        }
        toast.success("Draft saved", { description: "Your draft is saved locally." });
        setDraftSavedAt(new Date());
        setDraftSaveKey((k) => k + 1);
      } catch (e) {
        toast.error("Failed to save draft");
      }
    };
    const handleClearDraft = () => {
      try {
        if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
        form.reset({ title: "", categories: [], customCategory: "" });
        setCharCount(0);
        toast.success("Draft cleared");
      } catch (e) {
        toast.error("Failed to clear draft");
      }
    };

    window.addEventListener("save-create-post-draft", handleSaveDraft);
    window.addEventListener("clear-create-post-draft", handleClearDraft);
    return () => {
      window.removeEventListener("save-create-post-draft", handleSaveDraft);
      window.removeEventListener("clear-create-post-draft", handleClearDraft);
    };
  }, [form]);

  /**
   * Handle form submission with enterprise error handling
   * Uses Next.js router instead of window.location for better UX
   */
  const onSubmit = useCallback(async (values: CreatePostClientInput) => {
    const loadingToast = toast.loading("Creating blog post...");

    try {
      logger.info("[CreateBlogForm] Submitting post creation", { title: values.title });

      // Make API call with fetch instead of axios for better Next.js integration
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      // Parse response
      const data: ApiResponse<CreatePostResponse> = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Handle error responses
      if (!response.ok || !data.success) {
        const errorMessage = data.error?.message || "Failed to create blog post";

        logger.error("[CreateBlogForm] Post creation failed", {
          status: response.status,
          error: data.error,
        });

        toast.error(errorMessage, {
          description: data.error?.code,
          duration: 5000,
        });

        return;
      }

      // Handle success
      if (data.data?.id) {
        logger.info("[CreateBlogForm] Post created successfully", {
          postId: data.data.id,
        });

        toast.success("Blog post created successfully!", {
          description: "Redirecting to your new post...",
          duration: 3000,
        });

        // Use Next.js router for better client-side navigation
        try {
          if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
        } catch {}
        router.push(`/teacher/posts/${data.data.id}`);
      } else {
        throw new Error("No post ID returned from API");
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      logger.error("[CreateBlogForm] Unexpected error", { error });

      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support if the problem persists.",
        duration: 5000,
      });
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCharCount(value.length);
    form.setValue("title", value, {
      shouldValidate: true
    });
  };

  const handleAddCategory = (category: string) => {
    const currentCategories = form.getValues("categories") || [];
    if (!currentCategories.includes(category)) {
      form.setValue("categories", [...currentCategories, category], { shouldValidate: true });
    }
    setCategoryInput("");
    setShowSuggestions(false);
  };

  const handleAddCustomCategory = () => {
    if (customCategory && customCategory.length > 0) {
      const currentCategories = form.getValues("categories") || [];
      if (!currentCategories.includes(customCategory)) {
        form.setValue("categories", [...currentCategories, customCategory], { shouldValidate: true });
      }
      setCustomCategory("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    const currentCategories = form.getValues("categories") || [];
    form.setValue(
      "categories",
      currentCategories.filter(cat => cat !== category),
      { shouldValidate: true }
    );
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Post Title
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      placeholder="Write an engaging title..."
                      className={cn(
                        "pl-10 pr-4 py-5 text-base",
                        "bg-white dark:bg-slate-900",
                        "border border-slate-200 dark:border-slate-700",
                        "rounded-lg",
                        "text-slate-900 dark:text-slate-100",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "focus:border-blue-500 dark:focus:border-blue-500",
                        "focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500",
                        "transition-colors duration-200"
                      )}
                      onChange={handleInputChange}
                      aria-label="Blog post title"
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.title}
                      autoComplete="off"
                    />
                  </div>
                </FormControl>

                <div className="flex items-center justify-between text-xs">
                  <FormMessage className="text-red-500 dark:text-red-400" />
                  <span className={cn(
                    "font-medium",
                    charCount > 80 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
                  )}>
                    {charCount} / 100
                  </span>
                </div>
              </FormItem>
            )}
          />

          {/* Categories Field */}
          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div>
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-500" />
                    Categories
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add up to 5 categories to improve discoverability
                  </FormDescription>
                </div>

                {/* Selected Categories */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    {selectedCategories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="py-1 px-3 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category Search */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categoryInput}
                    onChange={(e) => {
                      setCategoryInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className={cn(
                      "bg-white dark:bg-slate-900",
                      "border border-slate-200 dark:border-slate-700",
                      "rounded-lg",
                      "focus:border-blue-500 dark:focus:border-blue-500",
                      "focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500",
                      "transition-colors duration-200"
                    )}
                    role="combobox"
                    aria-label="Search categories"
                    aria-expanded={showSuggestions && filteredCategories.length > 0}
                    autoComplete="off"
                  />

                  {showSuggestions && filteredCategories.length > 0 && (
                    <ul
                      className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 shadow-lg max-h-60 rounded-lg overflow-auto border border-slate-200 dark:border-slate-700"
                      aria-label="Category suggestions"
                    >
                      {filteredCategories.map((category) => (
                        <li
                          key={category}
                          className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                          onClick={() => handleAddCategory(category)}
                        >
                          {category}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Custom Category Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add custom category..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    className={cn(
                      "bg-white dark:bg-slate-900",
                      "border border-slate-200 dark:border-slate-700",
                      "rounded-lg",
                      "focus:border-blue-500 dark:focus:border-blue-500",
                      "focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500",
                      "transition-colors duration-200"
                    )}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomCategory}
                    disabled={!customCategory}
                    className={cn(
                      "shrink-0 px-4",
                      "bg-white dark:bg-slate-900",
                      "border border-slate-200 dark:border-slate-700",
                      "text-slate-700 dark:text-slate-300",
                      "hover:bg-slate-50 dark:hover:bg-slate-800",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "rounded-lg",
                      "transition-colors duration-200"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              id="create-post-submit"
              type="submit"
              disabled={!isInputValid || isSubmitting}
              className={cn(
                "w-full sm:w-auto px-6 py-5",
                "bg-blue-600 dark:bg-blue-600",
                "text-white font-medium",
                "hover:bg-blue-700 dark:hover:bg-blue-700",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600",
                "rounded-lg",
                "transition-colors duration-200",
                "flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Post...</span>
                </>
              ) : (
                <>
                  <span>Continue to Content</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {draftSavedAt && (
              <div key={draftSaveKey} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {(() => {
                  const d = draftSavedAt;
                  if (!d) return "";
                  const hh = d.getHours().toString().padStart(2, '0');
                  const mm = d.getMinutes().toString().padStart(2, '0');
                  return `Draft saved at ${hh}:${mm}`;
                })()}
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

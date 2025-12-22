"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PenLine,
  ArrowRight,
  Loader2,
  Tag,
  X,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  TrendingUp,
  Hash,
  Keyboard,
  Globe,
} from "lucide-react";
import { logger } from "@/lib/logger";
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

/**
 * Categories for blog posts
 */
const CATEGORIES = [
  "AI & ML", "Architecture", "Art & Design", "Biology", "Blockchain",
  "Business", "Chemistry", "Cloud Computing", "Cybersecurity",
  "Data Science", "DevOps", "Digital Marketing", "Engineering",
  "Environmental", "Game Development", "Health & Medicine", "IoT",
  "Mathematics", "Mobile Development", "Music & Audio", "Photography",
  "Physics", "Programming", "Psychology", "Science", "Space & Astronomy",
  "Technology", "UI/UX Design", "Web Development", "Writing"
].sort();

/**
 * Enterprise Blog Post Creation Form
 *
 * Features:
 * - Real-time Zod validation
 * - Keyboard shortcuts (Ctrl+S, Ctrl+Enter)
 * - SEO optimization scoring
 * - Auto-save with localStorage
 * - Offline detection
 * - Retry logic for network errors
 */
export const CreateBlogInputSection = () => {
  const router = useRouter();

  // Form state
  const [isInputValid, setIsInputValid] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Draft management
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DRAFT_KEY = "create-post-draft";

  // Network & retry logic
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const form = useForm<CreatePostClientInput>({
    resolver: zodResolver(CreatePostClientSchema),
    defaultValues: {
      title: "",
      categories: [],
      customCategory: "",
    },
    mode: "onChange"
  });

  const { isSubmitting } = form.formState;
  const title = form.watch("title");
  const watchedCategories = form.watch("categories");
  const selectedCategories = useMemo(() => watchedCategories || [], [watchedCategories]);
  const charCount = title.length;
  const wordCount = title.trim() ? title.trim().split(/\s+/).length : 0;

  // Validate input
  useEffect(() => {
    const valid = title.length >= 3 && title.length <= 100;
    setIsInputValid(valid);

    // Notify parent about validity state
    window.dispatchEvent(
      new CustomEvent("create-post-validity", { detail: { valid } })
    );
  }, [title]);

  // Notify parent about submitting state
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("create-post-submitting", { detail: { submitting: isSubmitting } })
    );
  }, [isSubmitting]);

  // Filter categories
  useEffect(() => {
    if (categoryInput) {
      const filtered = CATEGORIES.filter(cat =>
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
      }
    } catch (e) {
      logger.warn("[CreateBlogForm] Failed to load draft", { error: e });
    }
  }, [form]);

  // Autosave draft (debounced)
  useEffect(() => {
    const values = form.getValues();
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
          window.dispatchEvent(new Event("draft-saved"));
        }
      } catch (e) {
        logger.warn("[CreateBlogForm] Autosave failed", { error: e });
      }
    }, 600);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, selectedCategories, form]);

  // Handle external save/clear draft commands
  useEffect(() => {
    const handleSaveDraft = () => {
      try {
        const values = form.getValues();
        if (typeof window !== "undefined") {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
        }
        toast.success("Draft saved");
        window.dispatchEvent(new Event("draft-saved"));
      } catch {
        toast.error("Failed to save draft");
      }
    };

    const handleClearDraft = () => {
      try {
        if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
        form.reset({ title: "", categories: [], customCategory: "" });
        toast.success("Draft cleared");
      } catch {
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

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are offline");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === "s") {
        e.preventDefault();
        window.dispatchEvent(new Event("save-create-post-draft"));
      }

      if (modKey && e.key === "Enter") {
        e.preventDefault();
        if (isInputValid && !isSubmitting) {
          const submitBtn = document.getElementById("create-post-submit") as HTMLButtonElement | null;
          if (submitBtn) submitBtn.click();
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyboardShortcuts);
      return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
    }
  }, [isInputValid, isSubmitting]);

  /**
   * Calculate SEO score
   */
  const seoAnalysis = useMemo(() => {
    let score = 0;
    const recommendations: string[] = [];

    // Length check (35-60 characters optimal)
    if (title.length >= 35 && title.length <= 60) {
      score += 40;
    } else if (title.length < 35 && title.length > 0) {
      recommendations.push("Title is too short (aim for 35-60 characters)");
      score += Math.min(30, (title.length / 35) * 40);
    } else if (title.length > 60) {
      recommendations.push("Title may be truncated in search results");
      score += Math.max(20, 40 - ((title.length - 60) / 10) * 5);
    }

    // Word count (5-9 words optimal)
    if (wordCount >= 5 && wordCount <= 9) {
      score += 30;
    } else if (wordCount < 5 && wordCount > 0) {
      recommendations.push("Consider adding more descriptive words");
      score += Math.min(20, (wordCount / 5) * 30);
    } else if (wordCount > 9) {
      recommendations.push("Title has too many words");
      score += Math.max(15, 30 - ((wordCount - 9) * 3));
    }

    // Numbers boost engagement
    if (/\d/.test(title)) {
      score += 15;
    }

    // Power words
    const powerWords = ["ultimate", "essential", "complete", "guide", "best", "top", "proven", "effective"];
    if (powerWords.some(word => title.toLowerCase().includes(word))) {
      score += 15;
    }

    return {
      score: Math.min(100, Math.round(score)),
      recommendations: recommendations.slice(0, 2),
      level: score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "needs-work",
    };
  }, [title, wordCount]);

  /**
   * Form submission with retry logic
   */
  const onSubmit = useCallback(async (values: CreatePostClientInput) => {
    if (!isOnline) {
      toast.error("You are offline", {
        description: "Please check your internet connection.",
      });
      return;
    }

    const loadingToast = toast.loading("Creating post...");

    try {
      logger.info("[CreateBlogForm] Submitting", { title: values.title });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ApiResponse<CreatePostResponse> = await response.json();

      toast.dismiss(loadingToast);

      if (!response.ok || !data.success) {
        const errorMessage = data.error?.message || "Failed to create post";

        logger.error("[CreateBlogForm] Failed", {
          status: response.status,
          error: data.error,
        });

        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          toast.error(errorMessage, {
            description: `Retrying... (${retryCount + 1}/${MAX_RETRIES})`,
          });

          setRetryCount((prev) => prev + 1);

          setTimeout(() => {
            form.handleSubmit(onSubmit)();
          }, 2000 * (retryCount + 1));

          return;
        }

        toast.error(errorMessage);
        setRetryCount(0);
        return;
      }

      if (data.data?.id) {
        logger.info("[CreateBlogForm] Success", { postId: data.data.id });

        toast.success("Post created!", {
          description: "Redirecting...",
        });

        try {
          if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
        } catch (e) {
          logger.warn("[CreateBlogForm] Failed to clear draft", { error: e });
        }

        setRetryCount(0);
        router.push(`/teacher/posts/${data.data.id}`);
      } else {
        throw new Error("No post ID returned");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      logger.error("[CreateBlogForm] Error", { error });

      if (error instanceof Error && error.name === "AbortError") {
        toast.error("Request timeout");
      } else {
        toast.error("An error occurred");
      }

      setRetryCount(0);
    }
  }, [router, isOnline, retryCount, form]);

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
    <div className="space-y-8">
      {/* Network Status */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
          <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              You&apos;re offline
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Changes will be saved locally until you reconnect.
            </p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-slate-400" />
                  Post Title
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isSubmitting}
                    placeholder="Enter a compelling title..."
                    className={cn(
                      "h-12 text-base",
                      "bg-slate-50 dark:bg-slate-800/50",
                      "border-slate-200 dark:border-slate-700",
                      "focus:bg-white dark:focus:bg-slate-800",
                      "focus:border-blue-500 dark:focus:border-blue-500",
                      "focus:ring-2 focus:ring-blue-500/20",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      "transition-all duration-200"
                    )}
                    aria-label="Post title"
                    autoComplete="off"
                  />
                </FormControl>

                {/* Character Count */}
                <div className="flex items-center justify-between text-xs">
                  <FormMessage className="text-red-500" />
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <span className={cn(
                      charCount > 80 && "text-amber-600 dark:text-amber-400",
                      charCount > 100 && "text-red-600 dark:text-red-400"
                    )}>
                      {charCount}/100
                    </span>
                    <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                    <span>{wordCount} words</span>
                  </div>
                </div>

                {/* SEO Analysis */}
                {title.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {/* SEO Score Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            SEO Score
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500 rounded-full",
                                seoAnalysis.level === "excellent" && "bg-emerald-500",
                                seoAnalysis.level === "good" && "bg-blue-500",
                                seoAnalysis.level === "fair" && "bg-amber-500",
                                seoAnalysis.level === "needs-work" && "bg-red-500"
                              )}
                              style={{ width: `${seoAnalysis.score}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            seoAnalysis.level === "excellent" && "text-emerald-600 dark:text-emerald-400",
                            seoAnalysis.level === "good" && "text-blue-600 dark:text-blue-400",
                            seoAnalysis.level === "fair" && "text-amber-600 dark:text-amber-400",
                            seoAnalysis.level === "needs-work" && "text-red-600 dark:text-red-400"
                          )}>
                            {seoAnalysis.score}
                          </span>
                        </div>
                      </div>

                      {/* Search Preview */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                          <Globe className="w-3 h-3" />
                          <span>taxomind.com/blog/{title.toLowerCase().replace(/\s+/g, "-").substring(0, 25)}...</span>
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-0.5 line-clamp-1">
                          {title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          Learn about {title.toLowerCase()} and discover insights from expert educators.
                        </div>
                      </div>

                      {/* Recommendations */}
                      {seoAnalysis.recommendations.length > 0 && seoAnalysis.score < 80 && (
                        <div className="mt-3 space-y-1.5">
                          {seoAnalysis.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Success State */}
                      {seoAnalysis.level === "excellent" && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Excellent! Your title is well-optimized.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Categories Field */}
          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400" />
                    Categories
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select up to 5 categories to help readers discover your content
                  </FormDescription>
                </div>

                {/* Selected Categories */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedCategories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="py-1.5 px-3 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-700 group transition-colors"
                      >
                        <Hash className="w-3 h-3 mr-1 text-slate-400" />
                        {category}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${category}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category Search */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categoryInput}
                    onChange={(e) => {
                      setCategoryInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={cn(
                      "pl-10 h-10",
                      "bg-slate-50 dark:bg-slate-800/50",
                      "border-slate-200 dark:border-slate-700",
                      "focus:bg-white dark:focus:bg-slate-800",
                      "focus:border-blue-500 dark:focus:border-blue-500",
                      "focus:ring-2 focus:ring-blue-500/20",
                      "transition-all duration-200"
                    )}
                    autoComplete="off"
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredCategories.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/30 max-h-60 overflow-auto">
                      {filteredCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                          onClick={() => handleAddCategory(category)}
                        >
                          <Hash className="w-3.5 h-3.5 text-slate-400" />
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Category */}
                <div className="flex gap-2 mt-3">
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
                      "h-10",
                      "bg-slate-50 dark:bg-slate-800/50",
                      "border-slate-200 dark:border-slate-700",
                      "focus:bg-white dark:focus:bg-slate-800",
                      "focus:border-blue-500 dark:focus:border-blue-500",
                      "focus:ring-2 focus:ring-blue-500/20",
                      "transition-all duration-200"
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomCategory}
                    disabled={!customCategory}
                    className="h-10 px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Keyboard className="w-3.5 h-3.5" />
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">Ctrl</kbd>
                +
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">Enter</kbd>
                {" "}to submit
              </span>
            </div>

            <Button
              id="create-post-submit"
              type="submit"
              disabled={!isInputValid || isSubmitting}
              className={cn(
                "min-w-[160px] h-11 gap-2 transition-all",
                isInputValid
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
                  : ""
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, ShieldCheck, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { ReviewCard } from "./review-card";
import { ReviewRatingHistogram } from "./review-rating-histogram";
import { ReviewSortControls, SortOption } from "./review-sort-controls";
import { EventTracker } from '@/lib/analytics/event-tracker';

const formSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, {
    message: "Review comment must be at least 10 characters.",
  }),
});

export interface CourseReview {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string | null;
    image: string | null;
  };
  createdAt: string | Date;
  helpfulCount?: number;
  viewerHasVoted?: boolean;
}

interface CourseReviewsProps {
  courseId: string;
  initialReviews?: CourseReview[];
  userId?: string;
  isEnrolled?: boolean;
}

type ReviewsResponse = {
  items: CourseReview[];
  total: number;
  page: number;
  pageSize: number;
  ratingCounts: number[]; // 1..5
};

export const CourseReviews = ({ courseId, initialReviews = [], userId, isEnrolled }: CourseReviewsProps): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState<CourseReview[]>(initialReviews || []);
  const [total, setTotal] = useState<number>(initialReviews?.length || 0);
  const [page, setPage] = useState<number>(Math.max(parseInt(searchParams?.get('page') || '1', 10) || 1, 1));
  const [pageSize] = useState<number>(10);

  // URL-synchronized controls
  const initialSort: SortOption = ((): SortOption => {
    const s = (searchParams?.get('sortBy') || 'recent').toLowerCase();
    return (['recent','highest','lowest','helpful'] as SortOption[]).includes(s as SortOption) ? (s as SortOption) : 'recent';
  })();
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const initRating = searchParams?.get('rating');
  const [ratingFilter, setRatingFilter] = useState<number | null>(initRating ? parseInt(initRating, 10) || null : null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<number[] | undefined>(undefined);

  const updateQuery = (updates: Record<string, string | null>) => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') params.delete(k);
      else params.set(k, String(v));
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Ref to hold latest state for use in non-callback contexts (e.g. toggleHelpful, onSubmit)
  const pageRef = useRef(page);
  pageRef.current = page;
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;
  const ratingFilterRef = useRef(ratingFilter);
  ratingFilterRef.current = ratingFilter;

  const fetchReviews = useCallback(async (opts?: { page?: number; sortBy?: SortOption; rating?: number | null }): Promise<void> => {
    try {
      setIsLoading(true);
      const p = opts?.page ?? pageRef.current;
      const s = opts?.sortBy ?? sortByRef.current;
      const r = opts?.rating ?? ratingFilterRef.current;
      const url = `/api/courses/${courseId}/reviews?page=${p}&pageSize=${pageSize}&sortBy=${s}${r ? `&rating=${r}` : ''}`;
      const res = await axios.get<ReviewsResponse>(url);
      setReviews(res.data.items);
      setTotal(res.data.total);
      setRatingCounts(res.data.ratingCounts);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: string } };
      toast.error(axiosError.response?.data ?? "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, pageSize]);

  // Load on mount and whenever URL-relevant state changes
  useEffect(() => {
    fetchReviews({ page, sortBy, rating: ratingFilter }).catch(() => {});
  }, [page, sortBy, ratingFilter, fetchReviews]);

  // Sync state from URL (back/forward navigation)
  useEffect(() => {
    const s = (searchParams?.get('sortBy') || 'recent').toLowerCase();
    const nextSort = (['recent','highest','lowest','helpful'] as SortOption[]).includes(s as SortOption) ? (s as SortOption) : 'recent';
    const nextPage = Math.max(parseInt(searchParams?.get('page') || '1', 10) || 1, 1);
    const r = searchParams?.get('rating');
    const nextRating = r ? (parseInt(r, 10) || null) : null;
    if (nextSort !== sortByRef.current) setSortBy(nextSort);
    if (nextPage !== pageRef.current) setPage(nextPage);
    if (nextRating !== ratingFilterRef.current) setRatingFilter(nextRating);
  }, [searchParams]);

  const toggleHelpful = async (reviewId: string, hasVoted: boolean): Promise<void> => {
    if (!userId) {
      toast.info('Please sign in to vote');
      return;
    }
    try {
      const method = hasVoted ? 'delete' : 'post';
      const url = `/api/courses/${courseId}/reviews/${reviewId}/helpful`;
      const res = await axios[method]<{ reviewId: string; helpfulCount: number; viewerHasVoted: boolean }>(url);
      const { helpfulCount, viewerHasVoted } = res.data;
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, helpfulCount, viewerHasVoted } : r));
      try {
        EventTracker.getInstance().trackInteraction('review_helpful_toggled', { courseId, reviewId, viewerHasVoted });
      } catch {}
      // If sorting by helpful, refresh to reflect new order
      if (sortBy === 'helpful') {
        await fetchReviews({ page, sortBy, rating: ratingFilter });
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: string } };
      toast.error(axiosError.response?.data ?? 'Could not update vote');
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>): Promise<void> => {
    try {
      setIsSubmitting(true);
      const response = await axios.post<CourseReview>(`/api/courses/${courseId}/reviews`, values);
      
      // Newest first – reload first page to include the new review
      try {
        EventTracker.getInstance().trackInteraction('review_submitted', { courseId });
      } catch {}
      setPage(1);
      setSortBy('recent');
      setRatingFilter(null);
      updateQuery({ page: '1', sortBy: 'recent', rating: null });
      await fetchReviews({ page: 1, sortBy: 'recent', rating: null });
      form.reset();
      setSelectedRating(0);
      toast.success("Review submitted successfully!");
      router.refresh();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: string } };
      toast.error(axiosError.response?.data ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto overflow-x-hidden">
      <div className="bg-white/50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg md:shadow-xl rounded-2xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-gray-100 dark:to-gray-300 text-transparent bg-clip-text">
            Course Reviews
          </h2>
        </div>

        {/* Rating Histogram */}
        <ReviewRatingHistogram
          reviews={reviews}
          ratingCounts={ratingCounts}
          totalReviews={total}
          onFilterChange={(rating) => {
            setRatingFilter(rating);
            setPage(1);
            updateQuery({ rating: rating ? String(rating) : null, page: '1' });
            try {
              EventTracker.getInstance().trackInteraction('review_filter_changed', { courseId, rating });
            } catch {}
          }}
          selectedFilter={ratingFilter}
        />

        {/* Sort Controls */}
        {total > 0 && (
          <ReviewSortControls
            sortBy={sortBy}
            onSortChange={(next) => {
              setSortBy(next);
              setPage(1);
              updateQuery({ sortBy: next, page: '1' });
              try {
                EventTracker.getInstance().trackInteraction('review_sort_changed', { courseId, sortBy: next });
              } catch {}
            }}
            reviewCount={reviews.length}
          />
        )}

         {/* Reviews List */}
         <div className="mt-6 space-y-4 mb-6 cv-auto" role="status" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/60 dark:bg-gray-800/40 animate-pulse h-24" />
              ))}
            </div>
          ) : (
            <AnimatePresence>
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  index={index}
                  canVote={!!userId}
                  onToggleHelpful={toggleHelpful}
                />
              ))}
            </AnimatePresence>
          )}

          {!isLoading && total === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No reviews yet. Be the first to review this course!
              </p>
            </div>
          )}

          {!isLoading && total > 0 && reviews.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No reviews match your filter. Try selecting a different rating.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {total > pageSize && (
          <div className="flex items-center justify-between mt-2 mb-8">
            <button
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
              disabled={page <= 1 || isLoading}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                updateQuery({ page: String(next) });
                try {
                  EventTracker.getInstance().trackInteraction('review_page_changed', { courseId, page: next });
                } catch {}
              }}
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
              disabled={page >= Math.ceil(total / pageSize) || isLoading}
              onClick={() => {
                const last = Math.max(1, Math.ceil(total / pageSize));
                const next = Math.min(last, page + 1);
                setPage(next);
                updateQuery({ page: String(next) });
                try {
                  EventTracker.getInstance().trackInteraction('review_page_changed', { courseId, page: next });
                } catch {}
              }}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}

        {/* Review Form */}
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e).catch(() => {
                // Handle form submission error silently
              });
            }}
            className="space-y-4"
          >
            {/* Access gating + badge */}
            <div className="flex items-center justify-between">
              {isEnrolled ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Verified learner
                </span>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">Reviews from all enrolled and unenrolled users</span>
              )}
            </div>

            {!userId ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">Sign in to write a review.</div>
                <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const checked = selectedRating >= rating;
                    return (
                      <motion.button
                        key={rating}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedRating(rating);
                          form.setValue("rating", rating);
                        }}
                        className={cn(
                          "p-1 rounded-full transition-colors",
                          checked ? "text-amber-500 dark:text-yellow-400" : "text-gray-300 dark:text-gray-500"
                        )}
                        role="radio"
                        aria-checked={selectedRating === rating}
                        aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
                      >
                        <Star className="w-8 h-8" fill={checked ? "currentColor" : "none"} aria-hidden="true" />
                      </motion.button>
                    );
                  })}
                </div>

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          disabled={isSubmitting}
                          placeholder="Share your thoughts about this course..."
                          className="bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-gray-300 dark:focus:border-gray-600 text-gray-900 dark:text-gray-100 resize-none h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </>
            )}
          </form>
        </Form>

       
      </div>
    </div>
  );
};

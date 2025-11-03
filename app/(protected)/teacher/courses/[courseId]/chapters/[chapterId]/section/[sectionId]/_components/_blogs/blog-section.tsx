"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BookOpen, Loader2, Star, Link as LinkIcon, ExternalLink, Globe, X, Clipboard } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DisplayBlogs } from "./display-blogs";

interface BlogSectionFormProps {
  chapter: {
    id: string;
    title: string;
    sections: {
      id: string;
      videos: any[];
      articles: any[];
      notes: any[];
      blogs: {
        id: string;
        title: string;
        description: string | null;
        url: string;
        category: string | null;
        position: number | null;
        isPublished: boolean;
        createdAt: Date;
        updatedAt: Date;
        sectionId: string | null;
        userId: string;
        author: string | null;
        publishedAt: Date | null;
        rating?: number | null;
        thumbnail?: string | null;
        siteName?: string | null;
      }[];
    }[];
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  blogUrl: z.string().url({
    message: "Please enter a valid URL",
  }),
  description: z.string().optional(),
});

interface BlogPreviewData {
  title: string;
  thumbnail: string | null;
  description: string | null;
  siteName: string | null;
  author: string | null;
}

export const BlogSectionForm = ({
  chapter,
  courseId,
  chapterId,
  sectionId,
  isCreating,
  setIsCreating,
}: BlogSectionFormProps) => {
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [previewData, setPreviewData] = useState<BlogPreviewData | null>(null);

  const router = useRouter();

  // Find the current section's blogs
  const currentSection = chapter.sections.find(section => section.id === sectionId);
  const blogs = currentSection?.blogs || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      blogUrl: "",
      description: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const blogUrl = form.watch("blogUrl");

  const fetchBlogMetadata = useCallback(async (url: string) => {
    if (!url || !z.string().url().safeParse(url).success) return;
    
    try {
      setIsLoadingMetadata(true);
      
      // Call our real API endpoint to fetch blog metadata with timeout
      const response = await axios.get(`/api/fetch-blog-metadata?url=${encodeURIComponent(url)}`, {
        timeout: 15000, // 15 second timeout
      });
      
      if (response.data) {
        const metadata = response.data;
        
        // Set preview data with fallback values
        setPreviewData({
          title: metadata.title || `Article from ${new URL(url).hostname}`,
          thumbnail: metadata.thumbnail || null,
          description: metadata.description || null,
          siteName: metadata.siteName || new URL(url).hostname.replace('www.', ''),
          author: metadata.author || null,
        });
        
        // Set form values if available
        if (metadata.title) {
          form.setValue("title", metadata.title);
        }
        
        if (metadata.description) {
          form.setValue("description", metadata.description);
        }
        
        // Show success message based on whether it was a fallback
        if (metadata.is_fallback) {
          toast.warning("Limited blog details fetched. Please verify and add any missing information.");
        } else {
          toast.success("Blog details fetched successfully");
        }
      } else {
        throw new Error("No metadata returned");
      }
    } catch (error: any) {
      logger.error("Error fetching blog metadata:", error);
      
      // Handle different types of errors
      let errorMessage = "Could not fetch blog metadata. Please enter details manually.";
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Request timed out. Please try again or enter details manually.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error while fetching metadata. Please enter details manually.";
        } else if (error.response?.status === 404) {
          errorMessage = "Blog not found. Please check the URL and try again.";
        } else if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          errorMessage = "Invalid URL or access denied. Please enter details manually.";
        }
      }
      
      toast.error(errorMessage);
      
      // Set fallback preview data
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        setPreviewData({
          title: `Article from ${domain}`,
          thumbnail: null,
          description: null,
          siteName: domain,
          author: null,
        });
        
        form.setValue("title", `Article from ${domain}`);
      } catch (urlError) {
        // If URL parsing fails, set generic fallback
        setPreviewData({
          title: "Blog Article",
          thumbnail: null,
          description: null,
          siteName: "Blog",
          author: null,
        });
        
        form.setValue("title", "Blog Article");
      }
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [form]);

  // Effect to fetch metadata when URL changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'blogUrl' && value.blogUrl && value.blogUrl.startsWith('http')) {
        // Add a small delay before fetching metadata to avoid too many requests during typing
        const timer = setTimeout(() => {
          // Only fetch if URL is valid
          if (!form.formState.errors.blogUrl && value.blogUrl) {
            fetchBlogMetadata(value.blogUrl);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, fetchBlogMetadata]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text.startsWith('http')) {
        form.setValue('blogUrl', text);
        await form.trigger('blogUrl');
        
        // If the URL seems valid, try to fetch metadata
        if (!form.formState.errors.blogUrl) {
          toast.loading("Fetching blog details...", { id: "fetching-metadata" });
          await fetchBlogMetadata(text);
          toast.success("Blog details found!", { id: "fetching-metadata" });
        }
      } else {
        toast.error("Clipboard content is not a valid URL");
      }
    } catch (err) {
      logger.error("Error accessing clipboard:", err);
      toast.error("Unable to access clipboard");
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedRating(0);
    setHoveredRating(0);
    setPreviewData(null);
    setIsCreating(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/blogs`,
        {
          title: values.title,
          blogUrl: values.blogUrl,
          description: values.description || previewData?.description || null,
          rating: selectedRating,
          thumbnail: previewData?.thumbnail || null,
          siteName: previewData?.siteName || null,
          author: previewData?.author || null,
        }
      );
      
      toast.success("Blog resource added successfully");
      resetForm();
      router.refresh();
    } catch (error: any) {
      logger.error("Error adding blog resource:", error);
      toast.error(error.response?.data || "Failed to add blog resource");
    }
  };

  return (
    <div className="space-y-4">

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="blogUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Blog URL <span className="text-blue-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder="Enter blog or article URL"
                              className={cn(
                                "bg-white dark:bg-slate-900",
                                "border-slate-200 dark:border-slate-700",
                                "text-slate-900 dark:text-slate-100",
                                "pl-10 pr-20",
                                "focus:bg-slate-50 dark:focus:bg-slate-800",
                                "focus:border-slate-200 dark:focus:border-slate-700",
                                "focus:ring-0 focus:ring-offset-0",
                                "text-sm",
                                "transition-all duration-200"
                              )}
                            />
                          </FormControl>
                          <BookOpen className="absolute left-3 top-3 h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={pasteFromClipboard}
                              className="h-7 px-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                            >
                              <Clipboard className="h-4 w-4 mr-1" />
                              <span className="text-xs">Paste</span>
                            </Button>
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange("");
                                  setPreviewData(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                        <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                          Enter a URL from Medium, Dev.to, or other blog platforms
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {isLoadingMetadata && (
                    <div className="flex justify-center py-8">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Fetching blog details...</p>
                      </div>
                    </div>
                  )}

                  {previewData && !isLoadingMetadata && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-blue-100 dark:border-blue-800/30 overflow-hidden bg-white dark:bg-slate-800/60 shadow-md"
                    >
                      <div className="relative h-[200px] w-full bg-slate-100 dark:bg-slate-700">
                        {previewData.thumbnail ? (
                          <div className="h-full w-full relative group overflow-hidden">
                            <Image
                              src={previewData.thumbnail}
                              alt={previewData.title}
                              width={400}
                              height={200}
                              className="object-cover h-full w-full"
                            />
                            <div
                              id={`blog-thumbnail-fallback-${Date.now()}`}
                              className="hidden absolute inset-0 h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                            >
                              <BookOpen className="h-16 w-16 text-blue-300 dark:text-blue-500" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                            <BookOpen className="h-16 w-16 text-blue-300 dark:text-blue-500" />
                          </div>
                        )}
                        {previewData.siteName && (
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                            <span className="text-white text-xs font-medium">{previewData.siteName}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 dark:text-slate-300">Blog Title</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Blog title"
                                  className={cn(
                                    "text-base font-medium",
                                    "border-slate-200 dark:border-slate-700",
                                    "bg-white dark:bg-slate-900",
                                    "focus:bg-slate-50 dark:focus:bg-slate-800",
                                    "focus:border-slate-200 dark:focus:border-slate-700",
                                    "focus:ring-0 focus:ring-offset-0",
                                    "transition-colors duration-200"
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {previewData.author && (
                          <div className="mt-2 flex items-center">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 mr-2">
                              {previewData.author.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{previewData.author}</span>
                          </div>
                        )}

                        {previewData.description && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{previewData.description}</p>
                          </div>
                        )}

                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rate this blog&apos;s quality</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onMouseEnter={() => setHoveredRating(rating)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setSelectedRating(rating)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    "h-6 w-6 transition-colors duration-200",
                                    (rating <= (hoveredRating || selectedRating))
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-slate-300 dark:text-slate-600"
                                  )}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {selectedRating > 0 ? `${selectedRating}/5` : "Select rating"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end mt-4">
                          <Button
                            type="submit"
                            disabled={!isValid || isSubmitting}
                            className={cn(
                              "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
                              "text-white border-0",
                              "shadow-md hover:shadow-lg transition-all"
                            )}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Blog Resource"
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!previewData && !isLoadingMetadata && blogUrl && z.string().url().safeParse(blogUrl).success && (
                    <p className="text-sm text-rose-500 dark:text-rose-400 italic">
                      We couldn&apos;t fetch metadata for this URL. Please check if the URL is correct and accessible.
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog list display */}
      <DisplayBlogs
        items={blogs}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      {/* Empty state */}
      {blogs.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800/50">
          <BookOpen className="h-12 w-12 text-pink-200 dark:text-pink-800" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">No blog resources added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Click &quot;Add blog&quot; to enhance learning resources</p>
        </div>
      )}
    </div>
  );
};

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Loader2,
  Link as LinkIcon,
  Clipboard,
  X,
  ExternalLink,
  Star,
  Trash2,
  Globe,
  User,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface Blog {
  id: string;
  title: string;
  description?: string | null;
  url?: string;
  author?: string | null;
  position?: number | null;
  thumbnail?: string | null;
  rating?: number | null;
  siteName?: string | null;
}

interface ChapterSection {
  id: string;
  blogs?: Blog[];
  videos?: { id: string; title: string }[];
  articles?: { id: string; title: string }[];
  notes?: { id: string; title: string }[];
}

interface BlogResourcesCardProps {
  chapter?: {
    id: string;
    title: string;
    sections: ChapterSection[];
  };
  blogs: Blog[];
  courseId: string;
  chapterId: string;
  sectionId: string;
}

interface BlogPreviewData {
  title: string;
  thumbnail: string | null;
  description: string | null;
  siteName: string | null;
  author: string | null;
  favicon: string | null;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  blogUrl: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const BlogResourcesCard = ({
  blogs,
  courseId,
  chapterId,
  sectionId,
}: BlogResourcesCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [previewData, setPreviewData] = useState<BlogPreviewData | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localBlogs, setLocalBlogs] = useState<Blog[]>(blogs);

  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      blogUrl: "",
      description: "",
    },
  });

  const { isSubmitting } = form.formState;
  const blogUrl = form.watch("blogUrl");

  // Fetch blog metadata
  const fetchBlogMetadata = useCallback(async (url: string) => {
    // Guard against empty or invalid URLs
    const trimmedUrl = url?.trim();
    if (!trimmedUrl || !z.string().url().safeParse(trimmedUrl).success) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setIsLoadingMetadata(true);
      const response = await axios.get(
        `/api/fetch-blog-metadata?url=${encodeURIComponent(trimmedUrl)}`,
        { timeout: 15000 }
      );

      if (response.data) {
        const metadata = response.data;
        setPreviewData({
          title: metadata.title || `Article from ${new URL(trimmedUrl).hostname}`,
          thumbnail: metadata.thumbnail || null,
          description: metadata.description || null,
          siteName: metadata.siteName || new URL(trimmedUrl).hostname.replace("www.", ""),
          author: metadata.author || null,
          favicon: metadata.favicon || null,
        });

        if (metadata.title) {
          form.setValue("title", metadata.title);
        }
        if (metadata.description) {
          form.setValue("description", metadata.description);
        }

        if (metadata.is_fallback) {
          toast.warning("Limited details fetched. Please verify and complete.");
        } else {
          toast.success("Blog details fetched!");
        }
      }
    } catch (error) {
      logger.error("Error fetching blog metadata:", error);
      toast.error("Could not fetch blog metadata. Enter details manually.");

      // Still show a preview with minimal data from the URL
      try {
        const domain = new URL(trimmedUrl).hostname.replace("www.", "");
        setPreviewData({
          title: `Article from ${domain}`,
          thumbnail: null,
          description: null,
          siteName: domain,
          author: null,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        });
        form.setValue("title", `Article from ${domain}`);
      } catch {
        setPreviewData({
          title: "Blog Article",
          thumbnail: null,
          description: null,
          siteName: "Blog",
          author: null,
          favicon: null,
        });
      }
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [form]);

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith("http")) {
        form.setValue("blogUrl", text);
        await form.trigger("blogUrl");
        if (!form.formState.errors.blogUrl) {
          await fetchBlogMetadata(text);
        }
      } else {
        toast.error("Clipboard content is not a valid URL");
      }
    } catch {
      toast.error("Unable to access clipboard");
    }
  };

  // Reset form
  const resetForm = () => {
    form.reset();
    setSelectedRating(0);
    setHoveredRating(0);
    setPreviewData(null);
    setIsCreating(false);
  };

  // Submit form
  const onSubmit = async (values: FormValues) => {
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

      if (response.data) {
        setLocalBlogs((prev) => [...prev, response.data]);
      }

      toast.success("Blog added successfully!");
      resetForm();
      router.refresh();
    } catch (error: unknown) {
      logger.error("Error adding blog:", error);
      const axiosError = error as { response?: { data?: string } };
      toast.error(axiosError.response?.data || "Failed to add blog");
    }
  };

  // Delete blog
  const handleDelete = async (blogId: string) => {
    try {
      setDeletingId(blogId);
      await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/blogs/${blogId}`
      );
      setLocalBlogs((prev) => prev.filter((b) => b.id !== blogId));
      toast.success("Blog deleted successfully!");
      router.refresh();
    } catch (error) {
      logger.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  // Open blog in new tab
  const openBlog = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-sky-50/50 dark:from-blue-950/20 dark:via-cyan-950/10 dark:to-sky-950/10">
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 dark:from-blue-400 dark:via-cyan-400 dark:to-sky-400 bg-clip-text text-transparent">
                Blog Resources
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Add external articles and blog posts for students
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {localBlogs.length} {localBlogs.length === 1 ? "article" : "articles"}
            </Badge>
            <Button
              size="sm"
              variant={isCreating ? "outline" : "default"}
              onClick={() => {
                if (isCreating) {
                  resetForm();
                } else {
                  setIsCreating(true);
                }
              }}
              className={cn(
                !isCreating && "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              )}
            >
              {isCreating ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Blog
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        {/* Add Blog Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900">
                <CardContent className="p-4 space-y-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* URL Input */}
                      <FormField
                        control={form.control}
                        name="blogUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Blog URL <span className="text-red-500">*</span>
                            </FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isSubmitting}
                                  placeholder="https://medium.com/article..."
                                  className="pl-10 pr-24"
                                />
                              </FormControl>
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={pasteFromClipboard}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Clipboard className="h-3.5 w-3.5 mr-1" />
                                  Paste
                                </Button>
                                {field.value && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      field.onChange("");
                                      setPreviewData(null);
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <FormMessage />
                            <FormDescription className="text-xs">
                              Paste a URL from Medium, Dev.to, or any blog platform
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Fetch Button */}
                      {blogUrl && !previewData && !isLoadingMetadata && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fetchBlogMetadata(blogUrl)}
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fetch Blog Details
                        </Button>
                      )}

                      {/* Loading State */}
                      {isLoadingMetadata && (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm text-gray-500">Fetching blog details...</p>
                          </div>
                        </div>
                      )}

                      {/* Preview Card */}
                      {previewData && !isLoadingMetadata && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-blue-200 dark:border-blue-800/50 overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
                        >
                          {/* Thumbnail */}
                          <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
                            {previewData.thumbnail ? (
                              <Image
                                src={previewData.thumbnail}
                                alt={previewData.title}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
                                <BookOpen className="h-16 w-16 text-blue-300 dark:text-blue-600" />
                              </div>
                            )}
                            {previewData.siteName && (
                              <Badge className="absolute top-3 left-3 bg-black/70 text-white border-0">
                                <Globe className="h-3 w-3 mr-1" />
                                {previewData.siteName}
                              </Badge>
                            )}
                          </div>

                          {/* Preview Content */}
                          <div className="p-4 space-y-4">
                            {/* Title Input */}
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Title</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Blog title"
                                      className="font-semibold"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Author */}
                            {previewData.author && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span>{previewData.author}</span>
                              </div>
                            )}

                            {/* Description */}
                            {previewData.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {previewData.description}
                              </p>
                            )}

                            {/* Rating */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Rate this blog&apos;s quality</label>
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
                                        "h-6 w-6 transition-colors",
                                        rating <= (hoveredRating || selectedRating)
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300 dark:text-gray-600"
                                      )}
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {selectedRating > 0 ? `${selectedRating}/5` : "Select rating"}
                                </span>
                              </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Blog Resource
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blog List */}
        {localBlogs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Added Blogs
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {localBlogs.map((blog, index) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "group relative flex gap-3 p-3 rounded-xl",
                    "bg-white dark:bg-gray-900",
                    "border border-gray-200 dark:border-gray-800",
                    "hover:border-blue-300 dark:hover:border-blue-700",
                    "hover:shadow-md transition-all duration-200"
                  )}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => blog.url && openBlog(blog.url)}
                  >
                    {blog.thumbnail ? (
                      <Image
                        src={blog.thumbnail}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
                        <BookOpen className="h-8 w-8 text-blue-300 dark:text-blue-600" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                    {/* Site badge */}
                    {blog.siteName && (
                      <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white">
                        {blog.siteName}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h5
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => blog.url && openBlog(blog.url)}
                    >
                      {blog.title}
                    </h5>
                    {blog.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                        {blog.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {/* Rating */}
                      <div className="flex items-center gap-0.5">
                        {blog.rating ? (
                          <>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3 w-3",
                                  star <= (blog.rating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                )}
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                              {blog.rating}/5
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No rating</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => blog.url && openBlog(blog.url)}
                          className="h-7 w-7 p-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmModal onConfirm={() => handleDelete(blog.id)}>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deletingId === blog.id}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            {deletingId === blog.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </ConfirmModal>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {localBlogs.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <BookOpen className="h-8 w-8 text-blue-400 dark:text-blue-500" />
            </div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              No blog resources yet
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Add external articles to enhance student learning
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Blog
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

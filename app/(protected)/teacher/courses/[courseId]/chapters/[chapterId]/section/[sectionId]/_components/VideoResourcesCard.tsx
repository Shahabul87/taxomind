"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  Video,
  Plus,
  Loader2,
  Link as LinkIcon,
  Clipboard,
  X,
  ExternalLink,
  Star,
  Trash2,
  Play,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  rating: number | null;
  thumbnail?: string | null;
  platform?: string | null;
  author?: string | null;
}

interface VideoResourcesCardProps {
  chapter?: {
    id: string;
    title: string;
    sections: {
      id: string;
      videos: VideoData[];
    }[];
  };
  videos: VideoData[];
  courseId: string;
  chapterId: string;
  sectionId: string;
}

interface VideoPreviewData {
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  platform: string | null;
  embedUrl: string | null;
  author: string | null;
}

const descriptionOptions = [
  "This video provides a comprehensive explanation of core concepts with clear examples",
  "Complex topics are broken down into easily digestible segments with practical demonstrations",
  "Step-by-step tutorial that guides through implementation with best practices",
  "In-depth analysis of advanced concepts with real-world applications",
  "Fundamental principles explained through interactive examples and use cases",
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  videoUrl: z.string().url("Please enter a valid URL"),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const VideoResourcesCard = ({
  videos,
  courseId,
  chapterId,
  sectionId,
}: VideoResourcesCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [previewData, setPreviewData] = useState<VideoPreviewData | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localVideos, setLocalVideos] = useState<VideoData[]>(videos);

  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      description: "",
    },
  });

  const { isSubmitting } = form.formState;
  const videoUrl = form.watch("videoUrl");

  // Fetch video metadata
  const fetchVideoMetadata = useCallback(async (url: string) => {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl || !z.string().url().safeParse(trimmedUrl).success) {
      return;
    }

    try {
      setIsLoadingMetadata(true);
      const response = await axios.get(
        `/api/fetch-video-metadata?url=${encodeURIComponent(trimmedUrl)}`,
        { timeout: 15000 }
      );

      if (response.data) {
        const metadata = response.data;
        setPreviewData({
          title: metadata.title || null,
          description: metadata.description || null,
          thumbnail: metadata.thumbnail || null,
          platform: metadata.platform || null,
          embedUrl: metadata.embedUrl || null,
          author: metadata.author || null,
        });

        if (metadata.title) {
          form.setValue("title", metadata.title);
        }
        if (metadata.description) {
          form.setValue("description", metadata.description);
        } else {
          form.setValue("description", descriptionOptions[0]);
        }

        if (metadata.is_fallback) {
          toast.warning("Limited details fetched. Please verify and complete.");
        } else {
          toast.success("Video details fetched!");
        }
      }
    } catch (error) {
      logger.error("Error fetching video metadata:", error);
      toast.error("Could not fetch video metadata. Enter details manually.");

      try {
        const domain = new URL(trimmedUrl).hostname.replace("www.", "");
        setPreviewData({
          title: `Video from ${domain}`,
          description: null,
          thumbnail: null,
          platform: domain,
          embedUrl: null,
          author: null,
        });
        form.setValue("title", `Video from ${domain}`);
        form.setValue("description", descriptionOptions[0]);
      } catch {
        setPreviewData({
          title: "Video",
          description: null,
          thumbnail: null,
          platform: "Video",
          embedUrl: null,
          author: null,
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
        form.setValue("videoUrl", text);
        await form.trigger("videoUrl");
        if (!form.formState.errors.videoUrl) {
          await fetchVideoMetadata(text);
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
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/videos`,
        {
          title: values.title,
          videoUrl: values.videoUrl,
          description: values.description,
          rating: selectedRating,
          thumbnail: previewData?.thumbnail || null,
          platform: previewData?.platform || null,
          embedUrl: previewData?.embedUrl || null,
          author: previewData?.author || null,
        }
      );

      if (response.data) {
        setLocalVideos((prev) => [...prev, response.data]);
      }

      toast.success("Video added successfully!");
      resetForm();
      router.refresh();
    } catch (error: unknown) {
      logger.error("Error adding video:", error);
      const axiosError = error as { response?: { data?: string } };
      toast.error(axiosError.response?.data || "Failed to add video");
    }
  };

  // Delete video
  const handleDelete = async (videoId: string) => {
    try {
      setDeletingId(videoId);
      await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/videos/${videoId}`
      );
      setLocalVideos((prev) => prev.filter((v) => v.id !== videoId));
      toast.success("Video deleted successfully!");
      router.refresh();
    } catch (error) {
      logger.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  };

  // Open video in new tab
  const openVideo = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-50/50 via-orange-50/30 to-amber-50/50 dark:from-red-950/20 dark:via-orange-950/10 dark:to-amber-950/10">
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 dark:from-red-400 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                Video Resources
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Add video tutorials and explanations
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {localVideos.length} {localVideos.length === 1 ? "video" : "videos"}
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
                !isCreating && "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              )}
            >
              {isCreating ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Video
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        {/* Add Video Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="border-red-200 dark:border-red-800/50 bg-white dark:bg-gray-900">
                <CardContent className="p-4 space-y-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* URL Input */}
                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Video URL <span className="text-red-500">*</span>
                            </FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isSubmitting}
                                  placeholder="https://youtube.com/watch?v=..."
                                  className="pl-10 pr-24"
                                />
                              </FormControl>
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
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
                              Supports YouTube, Vimeo, and other video platforms
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Fetch Button */}
                      {videoUrl && !previewData && !isLoadingMetadata && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fetchVideoMetadata(videoUrl)}
                          className="w-full"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Fetch Video Details
                        </Button>
                      )}

                      {/* Loading State */}
                      {isLoadingMetadata && (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            <p className="text-sm text-gray-500">Fetching video details...</p>
                          </div>
                        </div>
                      )}

                      {/* Preview Card */}
                      {previewData && !isLoadingMetadata && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-red-200 dark:border-red-800/50 overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30"
                        >
                          {/* Thumbnail */}
                          <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800 group">
                            {previewData.thumbnail ? (
                              <>
                                <Image
                                  src={previewData.thumbnail}
                                  alt={previewData.title || "Video thumbnail"}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-white/90 rounded-full p-4">
                                    <Play className="h-8 w-8 text-red-600 fill-red-600" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50">
                                <Video className="h-16 w-16 text-red-300 dark:text-red-600" />
                              </div>
                            )}
                            {previewData.platform && (
                              <Badge className="absolute top-3 left-3 bg-black/70 text-white border-0">
                                {previewData.platform}
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
                                      placeholder="Video title"
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
                                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                </div>
                                <span>{previewData.author}</span>
                              </div>
                            )}

                            {/* Description */}
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Description</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isSubmitting}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-auto min-h-[60px] py-2 text-sm">
                                        <SelectValue placeholder="Select a description" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {field.value && !descriptionOptions.includes(field.value) && (
                                        <SelectItem value={field.value}>{field.value}</SelectItem>
                                      )}
                                      {descriptionOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Rating */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Rate this video&apos;s quality</label>
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
                              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Video Resource
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

        {/* Video List */}
        {localVideos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Added Videos
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {localVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "group relative flex gap-3 p-3 rounded-xl",
                    "bg-white dark:bg-gray-900",
                    "border border-gray-200 dark:border-gray-800",
                    "hover:border-red-300 dark:hover:border-red-700",
                    "hover:shadow-md transition-all duration-200"
                  )}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => video.url && openVideo(video.url)}
                  >
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50">
                        <Video className="h-8 w-8 text-red-300 dark:text-red-600" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                    {/* Platform badge */}
                    {video.platform && (
                      <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white">
                        {video.platform}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h5
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      onClick={() => video.url && openVideo(video.url)}
                    >
                      {video.title}
                    </h5>
                    {video.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {/* Rating */}
                      <div className="flex items-center gap-0.5">
                        {video.rating ? (
                          <>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3 w-3",
                                  star <= (video.rating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                )}
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                              {video.rating}/5
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
                          onClick={() => video.url && openVideo(video.url)}
                          className="h-7 w-7 p-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmModal onConfirm={() => handleDelete(video.id)}>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deletingId === video.id}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            {deletingId === video.id ? (
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
        {localVideos.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <Video className="h-8 w-8 text-red-400 dark:text-red-500" />
            </div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              No video resources yet
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Add video tutorials to help students learn visually
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

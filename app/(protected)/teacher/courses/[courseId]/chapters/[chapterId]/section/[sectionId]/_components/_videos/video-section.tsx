"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Video, Loader2, Star, X, Clipboard, Play } from "lucide-react";
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
  FormDescription,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chapter, VideoAccessTier } from "@prisma/client";
import { Shield, Globe, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DisplayVideos } from "./display-videos";

interface VideoSectionFormProps {
  chapter: {
    id: string;
    title: string;
    sections: {
      id: string;
      videos: {
        id: string;
        title: string;
        description: string | null;
        url: string | null;
        rating: number | null;
      }[];
    }[];
  };
  videos: {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    rating: number | null;
    thumbnail?: string | null;
    platform?: string | null;
    accessTier?: VideoAccessTier;
  }[];
  courseId: string;
  chapterId: string;
  sectionId: string;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
}

const descriptionOptions = [
  "This video provides a comprehensive explanation of core concepts with clear examples",
  "Complex topics are broken down into easily digestible segments with practical demonstrations",
  "Step-by-step tutorial that guides through implementation with best practices",
  "In-depth analysis of advanced concepts with real-world applications",
  "Fundamental principles explained through interactive examples and use cases",
];

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  description: z.string().min(1, {
    message: "Description is required",
  }),
  videoUrl: z.string().url({
    message: "Please enter a valid video URL",
  }),
  accessTier: z.enum(["FREE", "ENROLLED", "PREMIUM"]).default("ENROLLED"),
});

const accessTierOptions = [
  { value: "FREE" as const, label: "Free", description: "Anyone can watch", icon: Globe, color: "text-emerald-600 dark:text-emerald-400" },
  { value: "ENROLLED" as const, label: "Enrolled", description: "Enrolled students only", icon: Shield, color: "text-blue-600 dark:text-blue-400" },
  { value: "PREMIUM" as const, label: "Premium", description: "Subscribed users only", icon: Crown, color: "text-purple-600 dark:text-purple-400" },
];

const RatingStars = ({ rating }: { rating: number | null }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= (rating || 0)
              ? "text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400"
              : "text-gray-400 dark:text-gray-600"
          )}
        />
      ))}
      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300 ml-1">
        {rating}/5
      </span>
    </div>
  );
};

export const VideoSectionForm = ({
  chapter,
  videos,
  courseId,
  chapterId,
  sectionId,
  isCreating,
  setIsCreating,
}: VideoSectionFormProps) => {
  const router = useRouter();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    platform: string | null;
    embedUrl: string | null;
    author: string | null;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      description: "",
      accessTier: "ENROLLED",
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const videoUrl = form.watch("videoUrl");

  const fetchVideoMetadata = useCallback(async (url: string) => {
    if (!url || !z.string().url().safeParse(url).success) return;
    
    try {
      setIsLoadingMetadata(true);
      
      // Call our API to fetch video metadata
      const response = await axios.get(`/api/fetch-video-metadata?url=${encodeURIComponent(url)}`);
      
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
        }
        
        toast.success("Video details fetched successfully");
      } else {
        throw new Error("No metadata returned");
      }
    } catch (error: any) {
      logger.error("Error fetching video metadata:", error);
      toast.error("Could not fetch video details. Please enter them manually.");
      
      // Set default values from URL
      const domain = new URL(url).hostname.replace('www.', '');
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
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [form]);

  // Effect to fetch metadata when URL changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'videoUrl' && value.videoUrl && value.videoUrl.startsWith('http')) {
        // Add a small delay before fetching metadata to avoid too many requests during typing
        const timer = setTimeout(() => {
          // Only fetch if URL is valid
          if (!form.formState.errors.videoUrl && value.videoUrl) {
            fetchVideoMetadata(value.videoUrl);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, fetchVideoMetadata]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text.startsWith('http')) {
        form.setValue('videoUrl', text);
        await form.trigger('videoUrl');
        
        // If the URL seems valid, try to fetch metadata
        if (!form.formState.errors.videoUrl) {
          toast.loading("Fetching video details...", { id: "fetching-metadata" });
          await fetchVideoMetadata(text);
          toast.success("Video details found!", { id: "fetching-metadata" });
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
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/videos`,
        {
          ...values,
          rating: selectedRating,
          thumbnail: previewData?.thumbnail || null,
          platform: previewData?.platform || null,
          embedUrl: previewData?.embedUrl || null,
          author: previewData?.author || null,
          accessTier: values.accessTier,
        }
      );

      toast.success("Video added successfully");
      resetForm();
      router.refresh();
    } catch (error: any) {
      logger.error("Video creation error:", error);
      toast.error(error.response?.data || "Failed to add video");
    }
  };

  const getVideoId = (url: string) => {
    try {
      return new URL(url).searchParams.get("v");
    } catch {
      return null;
    }
  };

  const handleVideoClick = (url: string) => {
    // Handle video click
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3 sm:space-y-4">

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-3 sm:mt-4"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 sm:space-y-4"
              >
                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Video URL <span className="text-blue-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder="Enter YouTube or Vimeo URL"
                              className={cn(
                                "bg-white dark:bg-gray-900/50",
                                "border-gray-200 dark:border-gray-700/50",
                                "text-gray-900 dark:text-gray-200",
                                "pl-8 sm:pl-10 pr-16 sm:pr-20",
                                "focus:ring-blue-500/20",
                                "text-xs sm:text-sm",
                                "h-9 sm:h-10",
                                "transition-all duration-200"
                              )}
                            />
                          </FormControl>
                          <Video className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                          <div className="absolute right-1.5 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={pasteFromClipboard}
                              className="h-6 sm:h-7 px-1.5 sm:px-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Clipboard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline text-xs">Paste</span>
                            </Button>
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange("");
                                  setPreviewData(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-0.5"
                              >
                                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-xs sm:text-sm" />
                        <FormDescription className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Enter a URL from YouTube, Vimeo, or other video platforms
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {isLoadingMetadata && (
                    <div className="flex justify-center py-6 sm:py-8">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
                        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Fetching video details...</p>
                      </div>
                    </div>
                  )}

                  {previewData && !isLoadingMetadata && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-800/30 overflow-hidden bg-white dark:bg-gray-800/60 shadow-md"
                    >
                      <div className="relative h-[140px] sm:h-[180px] md:h-[200px] w-full bg-gray-100 dark:bg-gray-700">
                        {previewData.thumbnail ? (
                          <div className="h-full w-full relative group overflow-hidden">
                            <Image
                              src={previewData.thumbnail}
                              alt={previewData.title || "Video thumbnail"}
                              width={400}
                              height={200}
                              className="object-cover h-full w-full"
                            />
                            <div 
                              id={`video-thumbnail-fallback-${Date.now()}`}
                              className="hidden absolute inset-0 h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                            >
                              <Video className="h-16 w-16 text-blue-300 dark:text-blue-500" />
                            </div>
                            
                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/60 rounded-full p-2 sm:p-3 md:p-4 transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                            <Video className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-blue-300 dark:text-blue-500" />
                          </div>
                        )}
                        {previewData.platform && (
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/60 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                            <span className="text-white text-[10px] sm:text-xs font-medium">{previewData.platform}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Video Title</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Video title"
                                  className="text-sm sm:text-base font-medium border border-gray-200 dark:border-gray-700 bg-transparent h-9 sm:h-10"
                                />
                              </FormControl>
                              <FormMessage className="text-xs sm:text-sm" />
                            </FormItem>
                          )}
                        />
                        
                        {previewData.author && (
                          <div className="mt-2 flex items-center">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-300 mr-1.5 sm:mr-2">
                              {previewData.author.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{previewData.author}</span>
                          </div>
                        )}
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="mt-3 sm:mt-4">
                              <FormLabel className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Description</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-transparent border-gray-200 dark:border-gray-700 h-auto min-h-[60px] sm:min-h-[80px] py-2 sm:py-3 text-xs sm:text-sm">
                                    <SelectValue placeholder="Select or enter a description" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[200px] sm:max-h-[240px]">
                                  {/* Include the current description if it's not in the options */}
                                  {field.value && !descriptionOptions.includes(field.value) && (
                                    <SelectItem value={field.value} className="text-xs sm:text-sm">{field.value}</SelectItem>
                                  )}
                                  {/* Predefined description options */}
                                  {descriptionOptions.map((option) => (
                                    <SelectItem key={option} value={option} className="text-xs sm:text-sm">
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs sm:text-sm" />
                            </FormItem>
                          )}
                        />
                        
                        <div className="mt-3 sm:mt-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Rate this video&apos;s quality</p>
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onMouseEnter={() => setHoveredRating(rating)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setSelectedRating(rating)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                              >
                                <Star
                                  className={cn(
                                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200",
                                    (rating <= (hoveredRating || selectedRating))
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300 dark:text-gray-600"
                                  )}
                                />
                              </button>
                            ))}
                            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              {selectedRating > 0 ? `${selectedRating}/5` : "Select rating"}
                            </span>
                          </div>
                        </div>

                        {/* Access Tier Selector */}
                        <FormField
                          control={form.control}
                          name="accessTier"
                          render={({ field }) => (
                            <FormItem className="mt-3 sm:mt-4">
                              <FormLabel className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                Access Tier
                              </FormLabel>
                              <div className="grid grid-cols-3 gap-2">
                                {accessTierOptions.map((option) => {
                                  const Icon = option.icon;
                                  const isSelected = field.value === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => field.onChange(option.value)}
                                      className={cn(
                                        "flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border-2 transition-all duration-200",
                                        isSelected
                                          ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                      )}
                                    >
                                      <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", option.color)} />
                                      <span className={cn(
                                        "text-xs sm:text-sm font-medium",
                                        isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
                                      )}>
                                        {option.label}
                                      </span>
                                      <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
                                        {option.description}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <FormMessage className="text-xs sm:text-sm" />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end mt-3 sm:mt-4">
                          <Button
                            type="submit"
                            disabled={!isValid || isSubmitting}
                            className={cn(
                              "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
                              "text-white border-0",
                              "shadow-md hover:shadow-lg transition-all",
                              "h-9 sm:h-10 px-3 sm:px-4",
                              "text-xs sm:text-sm",
                              "w-full sm:w-auto"
                            )}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Video Resource"
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!previewData && !isLoadingMetadata && videoUrl && z.string().url().safeParse(videoUrl).success && (
                    <p className="text-xs sm:text-sm text-rose-500 dark:text-rose-400 italic">
                      We couldn&apos;t fetch details for this video. Please check if the URL is correct and accessible.
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>

      <DisplayVideos
        videos={videos}
        onVideoClick={handleVideoClick}
      />
    </div>
  );
};

"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, X, VideoIcon, Link, Youtube, Clipboard, Grip } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FavoriteVideo } from "@prisma/client";
import { FavoriteVideoList } from "./fav-video-link-list";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteVideoLinkFormProps {
  userId: string;
  favoriteVideos?: FavoriteVideo[];
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Enter a valid URL"),
  category: z.string().optional()
});

const videoCategories = [
  "Educational",
  "Tutorial",
  "Programming",
  "Technology",
  "Science",
  "Mathematics",
  "Language Learning",
  "History",
  "Business",
  "Personal Development",
  "Motivation",
  "Health & Fitness",
  "Art & Design",
  "Music",
  "Cooking",
  "Travel",
  "Career Development",
  "Finance",
  "Digital Marketing",
  "Productivity",
  "Leadership",
  "Public Speaking",
  "Writing",
  "Photography",
  "Film Making",
] as const;

const videoPlatforms = [
  { name: "YouTube", value: "YouTube", icon: Youtube },
  { name: "Vimeo", value: "Vimeo", icon: VideoIcon },
  { name: "TikTok", value: "TikTok", icon: VideoIcon },
  { name: "Twitter", value: "Twitter", icon: VideoIcon },
  { name: "LinkedIn", value: "LinkedIn", icon: VideoIcon },
  { name: "Other", value: "Other", icon: VideoIcon },
];

interface FormData {
  title: string;
  platform: string;
  url: string;
  category?: string;
}

export const FavoriteVideoLinkForm = ({
  userId,
  favoriteVideos = [],
}: FavoriteVideoLinkFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add-link");
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      platform: "YouTube",
      url: "",
      category: "",
    },
    mode: "onChange",
  });

  const fetchVideoMetadata = useCallback(async (url: string) => {

    try {
      setIsLoading(true);
      
      // Manual YouTube thumbnail extraction as a fallback
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop() 
          : url.split('v=')[1]?.split('&')[0];
          
        if (videoId) {

          setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      }
      
      // Use our API endpoint to fetch metadata

      const response = await axios.get(`/api/fetch-video-metadata?url=${encodeURIComponent(url)}`);

      if (response.data?.title) {

        form.setValue('title', response.data.title);
      }
      
      if (response.data?.thumbnail_url && !videoThumbnail) {

        setVideoThumbnail(response.data.thumbnail_url);
      }
      
      toast.success("Video details fetched");
    } catch (error: any) {
      logger.error("Error fetching video metadata:", error);
      
      // Fallback for YouTube videos if API fails
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop() 
          : url.split('v=')[1]?.split('&')[0];
          
        if (videoId) {
          // Generate a simple title based on video ID
          const simpleTitleFromId = `YouTube Video (${videoId})`;

          form.setValue('title', simpleTitleFromId);
        }
      }
      
      toast.error("Couldn't fetch complete video details");
    } finally {
      setIsLoading(false);
    }
  }, [form, videoThumbnail, setVideoThumbnail, setIsLoading]);

  // Immediately try to fetch metadata when URL changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'url' && value.url && value.url.startsWith('http')) {
        const url = value.url;
        
        // Auto-detect platform
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          form.setValue('platform', 'YouTube');
        } else if (url.includes('vimeo.com')) {
          form.setValue('platform', 'Vimeo');
        } else if (url.includes('tiktok.com')) {
          form.setValue('platform', 'TikTok');
        } else if (url.includes('linkedin.com')) {
          form.setValue('platform', 'LinkedIn');
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
          form.setValue('platform', 'Twitter');
        } else {
          form.setValue('platform', 'Other');
        }
        
        // Add a small delay before fetching metadata to avoid too many requests during typing
        const timer = setTimeout(() => {
          // Only fetch if URL is valid
          if (form.formState.errors.url === undefined) {

            fetchVideoMetadata(url);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, fetchVideoMetadata]);

  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setActiveTab("add-link");
    setEditMode(false);
    form.reset();
    setVideoThumbnail(null);
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditingVideoId(null);
    form.reset();
    setVideoThumbnail(null);
  };

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();
  const isFormComplete = !!watchedValues.title && !!watchedValues.platform && !!watchedValues.url;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      if (editMode) {
        await axios.patch(`/api/users/${userId}/favorite-videos/${editingVideoId}`, values);
        toast.success("Video updated successfully");
      } else {
        await axios.post(`/api/users/${userId}/favorite-videos`, values);
        toast.success("Video added to favorites");
      }
      
      router.refresh();
      toggleCreating();
    } catch (error: any) {
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/users/${userId}/favorite-videos/reorder`, {
        list: updateData,
      });
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    const videoToEdit = favoriteVideos.find((video) => video.id === id);
    if (videoToEdit) {
      setEditMode(true);
      setEditingVideoId(id);
      setIsCreating(true);
      setActiveTab("add-link");
      
      form.reset({
        title: videoToEdit.title,
        platform: videoToEdit.platform,
        url: videoToEdit.url,
        category: videoToEdit.category || "",
      });
      
      // Set thumbnail for YouTube videos
      if (videoToEdit.url.includes('youtube.com') || videoToEdit.url.includes('youtu.be')) {
        const url = videoToEdit.url;
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop() 
          : url.split('v=')[1]?.split('&')[0];
          
        if (videoId) {
          setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      }
    }
  };

  const onDelete = async (videoId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/users/${userId}/favorite-videos/${videoId}`);
      toast.success("Video removed from favorites");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();

      if (text.startsWith('http')) {
        form.setValue('url', text);
        await form.trigger('url');
        
        // If the URL seems valid, try to fetch metadata
        if (!form.formState.errors.url) {
          // Show loading indicator
          toast.loading("Fetching video details...", { id: "fetching-metadata" });
          
          try {
            // Call our API endpoint directly
            const response = await axios.get(`/api/fetch-video-metadata?url=${encodeURIComponent(text)}`);

            if (response.data) {
              // Set the form values
              if (response.data.title) {
                form.setValue('title', response.data.title);
              }
              
              // Set YouTube as platform for YouTube videos
              if (text.includes('youtube.com') || text.includes('youtu.be')) {
                form.setValue('platform', 'YouTube');
              } else if (text.includes('vimeo.com')) {
                form.setValue('platform', 'Vimeo');
              }
              
              // Set thumbnail if available
              if (response.data.thumbnail_url) {
                setVideoThumbnail(response.data.thumbnail_url);
              }
              
              toast.success("Video details found!", { id: "fetching-metadata" });
            } else {
              toast.error("Couldn't find video details. Please enter them manually.", { id: "fetching-metadata" });
            }
          } catch (error: any) {
            logger.error("Error fetching metadata:", error);
            toast.error("Couldn't fetch video details. Please enter them manually.", { id: "fetching-metadata" });
          }
        }
      } else {

        toast.error("Clipboard content is not a valid URL");
      }
    } catch (err) {
      logger.error("Clipboard error:", err);
      toast.error("Unable to access clipboard");
    }
  };

  return (
    <div className={cn(
      "relative mt-6 rounded-xl overflow-hidden",
      "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
      "border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
    )}>
      {isUpdating && (
        <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center z-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-6 w-6 text-rose-500 dark:text-rose-400" />
          </motion.div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg">
              <VideoIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
              Favorite Videos
            </h3>
          </div>
          
          {!isCreating ? (
            <Button
              onClick={toggleCreating}
              variant="outline"
              className={cn(
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                "hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400",
                "transition-colors"
              )}
            >
              <motion.div className="flex items-center gap-2" whileHover={{ x: 5 }}>
                <PlusCircle className="h-4 w-4" />
                <span>Add video</span>
              </motion.div>
            </Button>
          ) : (
            <Button
              onClick={toggleCreating}
              variant="ghost"
              className="text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
            >
              <X className="h-4 w-4 mr-2" />
              <span>Cancel</span>
            </Button>
          )}
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-gray-100 dark:bg-gray-800 p-1 mb-4">
                  <TabsTrigger 
                    value="add-link" 
                    className={cn(
                      "flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
                      "data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
                    )}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Add manually
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paste-link" 
                    className={cn(
                      "flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
                      "data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
                    )}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Paste URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add-link" className="mt-0">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor="url" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Video URL <span className="text-rose-500">*</span>
                                </Label>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      id="url"
                                      disabled={isSubmitting || isUpdating}
                                      placeholder="https://youtube.com/watch?v=..."
                                      className={cn(
                                        "bg-white dark:bg-gray-900",
                                        "border-gray-200 dark:border-gray-700",
                                        "text-gray-900 dark:text-gray-200",
                                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                        "focus-visible:ring-rose-500/50 focus-visible:border-rose-500/50"
                                      )}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={pasteFromClipboard}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    <Clipboard className="h-4 w-4" />
                                    <span className="sr-only">Paste</span>
                                  </Button>
                                </div>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="platform"
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor="platform" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Platform <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                  disabled={isSubmitting || isUpdating}
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger 
                                      id="platform"
                                      className={cn(
                                        "bg-white dark:bg-gray-900",
                                        "border-gray-200 dark:border-gray-700",
                                        "text-gray-900 dark:text-gray-200"
                                      )}
                                    >
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {videoPlatforms.map((platform) => (
                                      <SelectItem 
                                        key={platform.value} 
                                        value={platform.value}
                                        className="flex items-center gap-2 text-gray-900 dark:text-gray-200"
                                      >
                                        <div className="flex items-center gap-2">
                                          <platform.icon className="h-4 w-4" />
                                          <span>{platform.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor="category" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Category (Optional)
                                </Label>
                                <Select
                                  disabled={isSubmitting || isUpdating}
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger 
                                      id="category"
                                      className={cn(
                                        "bg-white dark:bg-gray-900",
                                        "border-gray-200 dark:border-gray-700",
                                        "text-gray-900 dark:text-gray-200"
                                      )}
                                    >
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-[200px]">
                                    {videoCategories.map((category) => (
                                      <SelectItem 
                                        key={category} 
                                        value={category}
                                        className="text-gray-900 dark:text-gray-200"
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                                  Categorize your videos for better organization
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor="title" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Video Title <span className="text-rose-500">*</span>
                                </Label>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id="title"
                                    disabled={isSubmitting || isUpdating}
                                    placeholder="Enter video title"
                                    className={cn(
                                      "bg-white dark:bg-gray-900",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                      "focus-visible:ring-rose-500/50 focus-visible:border-rose-500/50"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />
                          
                          {/* Thumbnail preview */}
                          <div>
                            <Label className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                              Thumbnail Preview
                            </Label>
                            <div className={cn(
                              "mt-2 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-video",
                              "flex items-center justify-center border border-gray-200 dark:border-gray-700"
                            )}>
                              {videoThumbnail ? (
                                <Image 
                                  src={videoThumbnail} 
                                  alt="Video thumbnail" 
                                  width={400}
                                  height={225}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-4">
                                  <VideoIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {form.getValues('url') 
                                      ? "No thumbnail available" 
                                      : "Enter a valid video URL"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
                        {editMode && (
                          <Button
                            variant="outline"
                            onClick={cancelEditMode}
                            disabled={isSubmitting || isUpdating}
                            className={cn(
                              "border-gray-200 dark:border-gray-700",
                              "text-gray-700 dark:text-gray-200"
                            )}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          disabled={!isFormComplete || isSubmitting || isUpdating}
                          type="submit"
                          className={cn(
                            "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white",
                            "disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                          )}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {editMode ? "Saving..." : "Adding..."}
                            </>
                          ) : (
                            editMode ? "Save Changes" : "Add to Favorites"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="paste-link" className="mt-0">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-6">
                      <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full inline-flex items-center justify-center mb-4">
                        <Clipboard className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Paste a video URL
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Copy a video URL from YouTube, Vimeo, or other platforms and paste it below. We&apos;ll automatically fetch the details.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="relative">
                        <Input
                          value={form.getValues('url') || ''}
                          onChange={(e) => form.setValue('url', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className={cn(
                            "bg-white dark:bg-gray-800",
                            "border-gray-200 dark:border-gray-700",
                            "text-gray-900 dark:text-gray-200",
                            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                            "focus-visible:ring-rose-500/50 focus-visible:border-rose-500/50"
                          )}
                        />
                        <Button
                          onClick={pasteFromClipboard}
                          type="button"
                          variant="ghost"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
                        >
                          <Clipboard className="h-4 w-4 mr-2" />
                          Paste
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          const url = form.getValues('url');
                          if (url) {
                            form.trigger('url');
                            if (!form.formState.errors.url) {
                              setActiveTab('add-link');
                            }
                          }
                        }}
                        className={cn(
                          "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white",
                          "disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                        )}
                        disabled={!form.getValues('url')}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          favoriteVideos.length === 0 && !isCreating && "bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
        )}>
          {favoriteVideos.length === 0 && !isCreating ? (
            <div className="space-y-4">
              <div className="mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 p-3 w-12 h-12 flex items-center justify-center">
                <VideoIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">No favorite videos yet</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Add videos you love and want to save for later viewing.
              </p>
              <Button
                onClick={toggleCreating}
                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Video
              </Button>
            </div>
          ) : !isCreating && (
            <>
              <FavoriteVideoList
                onEdit={onEdit}
                onReorder={onReorder}
                onDelete={onDelete}
                items={favoriteVideos}
              />
              {favoriteVideos.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <Grip className="h-3 w-3" />
                    Drag videos to reorder your collection
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, X, Headphones, Link, Music, Globe, Clipboard, Grip, Speaker } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FavoriteAudio } from "@prisma/client";
import { FavoriteAudioList } from "./fav-audio-link-list";
import { motion, AnimatePresence } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteAudioLinkFormProps {
  userId: string;
  favoriteAudios?: FavoriteAudio[];
}

const audioCategories = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Jazz",
  "Electronic",
  "Classical",
  "Country",
  "Folk",
  "Indie",
  "Metal",
  "Blues",
  "Reggae",
  "Latin",
  "K-Pop",
  "J-Pop",
  "Ambient",
  "Lo-fi",
  "Instrumental",
  "Educational Podcasts",
  "Learning Courses",
  "Motivational Talks",
  "Language Learning",
  "Business & Finance",
  "Technology & Science",
  "Self Development",
  "Meditation & Mindfulness",
  "History & Culture",
  "Storytelling",
  "Audiobooks",
  "Music Education",
  "Career Development",
  "Leadership Talks",
  "Health & Wellness",
  "Study Music",
  "Focus Music",
  "Productivity",
  "Interview Series",
  "Expert Discussions",
  "Conference Talks",
  "Research Presentations",
  "Guided Learning",
  "Industry Insights",
  "Creative Arts",
  "Nature Sounds",
  "Comedy",
  "True Crime",
  "News & Politics",
  "Sports & Recreation"
] as const;

interface FormData {
  title: string;
  platform: string;
  url: string;
  category?: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Enter a valid URL"),
  category: z.string().optional(),
});

export const FavoriteAudioLinkForm = ({
  userId,
  favoriteAudios = [],
}: FavoriteAudioLinkFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add-link");
  const [audioFavicon, setAudioFavicon] = useState<string | null>(null);
  const [audioArtwork, setAudioArtwork] = useState<string | null>(null);
  const [audioArtist, setAudioArtist] = useState<string | null>(null);
  const [audioAlbum, setAudioAlbum] = useState<string | null>(null);
  const [audioType, setAudioType] = useState<string | null>(null);

  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setActiveTab("add-link");
    setEditMode(false);
    form.reset();
    resetMetadata();
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditingAudioId(null);
    form.reset();
    resetMetadata();
  };

  const resetMetadata = () => {
    setAudioFavicon(null);
    setAudioArtwork(null);
    setAudioArtist(null);
    setAudioAlbum(null);
    setAudioType(null);
  };

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      platform: "Spotify",
      url: "",
      category: "",
    },
    mode: "onChange",
  });

  const fetchAudioMetadata = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      
      // Use our API endpoint to fetch metadata
      const response = await axios.get(`/api/fetch-audio-metadata?url=${encodeURIComponent(url)}`);

      if (response.data?.title) {
        form.setValue('title', response.data.title);
      }
      
      // Set platform if available
      if (response.data?.platform) {
        form.setValue('platform', response.data.platform);
      }
      
      // Set favicon if available
      if (response.data?.favicon) {
        setAudioFavicon(response.data.favicon);
      }
      
      // Set artwork if available
      if (response.data?.artwork) {
        setAudioArtwork(response.data.artwork);
      }
      
      // Set artist if available
      if (response.data?.artist) {
        setAudioArtist(response.data.artist);
      }
      
      // Set album if available
      if (response.data?.album) {
        setAudioAlbum(response.data.album);
      }
      
      // Set audio type if available
      if (response.data?.itemType) {
        setAudioType(response.data.itemType);
      }
      
      // Try to detect category based on audio type and platform
      if (!form.getValues('category')) {
        detectAudioCategory(response.data);
      }
      
      toast.success("Audio details fetched");
    } catch (error: any) {
      logger.error("Error fetching audio metadata:", error);
      toast.error("Couldn't fetch audio details. Please enter them manually.");
    } finally {
      setIsLoading(false);
    }
  }, [form, detectAudioCategory]);

  // Helper function to try detecting the appropriate audio category
  const detectAudioCategory = useCallback((metadata: any) => {
    if (!metadata) return;
    
    // Default categories based on platform and type
    if (metadata.platform === 'Spotify' || metadata.platform === 'Apple Music' || 
        metadata.platform === 'SoundCloud' || metadata.platform === 'Deezer' || 
        metadata.platform === 'Tidal') {
      
      // If it's a podcast episode, set podcast category
      if (metadata.audioType === 'podcast' || metadata.audioType?.includes('podcast')) {
        form.setValue('category', 'Educational Podcasts');
        return;
      }
      
      // For music platforms, try to detect genre from metadata
      if (metadata.genre) {
        // Try to match the genre to our categories
        const matchedCategory = audioCategories.find(category => 
          metadata.genre.toLowerCase().includes(category.toLowerCase())
        );
        
        if (matchedCategory) {
          form.setValue('category', matchedCategory);
          return;
        }
      }
      
      // Set general categories based on the platform and item type
      if (metadata.itemType === 'track' || !metadata.itemType) {
        form.setValue('category', 'Pop'); // Default music category
      } else if (metadata.itemType === 'album') {
        form.setValue('category', 'Pop'); // Default music category
      } else if (metadata.itemType === 'playlist') {
        form.setValue('category', 'Focus Music');
      }
    } else if (metadata.platform === 'YouTube' || metadata.platform === 'YouTube Music') {
      form.setValue('category', 'Pop'); // Default for YouTube Music
    } else if (metadata.platform.includes('Podcast') || metadata.url?.includes('podcast')) {
      form.setValue('category', 'Educational Podcasts');
    } else if (metadata.platform.includes('Audiobook') || metadata.title?.toLowerCase().includes('audiobook')) {
      form.setValue('category', 'Audiobooks');
    }
  }, [form]);

  // Auto-detect platform from URL and fetch metadata
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'url' && value.url && value.url.startsWith('http')) {
        const url = value.url;
        
        // Add a small delay before fetching metadata to avoid too many requests during typing
        const timer = setTimeout(() => {
          // Only fetch if URL is valid
          if (form.formState.errors.url === undefined) {
            fetchAudioMetadata(url);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, fetchAudioMetadata]);

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();
  const isFormComplete = !!watchedValues.title && !!watchedValues.platform && !!watchedValues.url;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/users/${userId}/favorite-audios`, values);
      toast.success("Favorite audio added");
      toggleCreating();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onSave = async (values: z.infer<typeof formSchema>) => {
    if (!editingAudioId) return;

    try {
      setIsUpdating(true);
      await axios.patch(`/api/users/${userId}/favorite-audios/${editingAudioId}`, values);
      toast.success("Favorite audio updated");
      setEditMode(false);
      setEditingAudioId(null);
      form.reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/users/${userId}/favorite-audios/reorder`, {
        list: updateData,
      });
      toast.success("Favorite audios reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    const audioToEdit = favoriteAudios.find((audio) => audio.id === id);
    if (audioToEdit) {
      setEditMode(true);
      setEditingAudioId(id);
      form.setValue("title", audioToEdit.title);
      form.setValue("platform", audioToEdit.platform);
      form.setValue("url", audioToEdit.url);
    }
  };

  const onDelete = async (audioId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/users/${userId}/favorite-audios/${audioId}`);
      toast.success("Favorite audio deleted");
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
          toast.loading("Fetching audio details...", { id: "fetching-metadata" });
          
          try {
            const response = await axios.get(`/api/fetch-audio-metadata?url=${encodeURIComponent(text)}`);

            if (response.data) {
              // Set the form values
              if (response.data.title) {
                form.setValue('title', response.data.title);
              }
              
              // Set platform if available
              if (response.data.platform) {
                form.setValue('platform', response.data.platform);
              }
              
              // Set favicon if available
              if (response.data.favicon) {
                setAudioFavicon(response.data.favicon);
              }
              
              // Set artwork if available
              if (response.data.artwork) {
                setAudioArtwork(response.data.artwork);
              }
              
              // Set artist if available
              if (response.data.artist) {
                setAudioArtist(response.data.artist);
              }
              
              // Set album if available
              if (response.data.album) {
                setAudioAlbum(response.data.album);
              }
              
              // Set audio type if available
              if (response.data.itemType) {
                setAudioType(response.data.itemType);
              }
              
              // Try to detect category if not already set
              if (!form.getValues('category')) {
                detectAudioCategory(response.data);
              }
              
              toast.success("Audio details found!", { id: "fetching-metadata" });
            } else {
              toast.error("Couldn't find audio details. Please enter them manually.", { id: "fetching-metadata" });
            }
          } catch (error: any) {
            logger.error("Error fetching metadata:", error);
            toast.error("Couldn't fetch audio details. Please enter them manually.", { id: "fetching-metadata" });
          }
        }
      } else {
        toast.error("Clipboard content is not a valid URL");
      }
    } catch (err) {
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
            <Loader2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
          </motion.div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <Headphones className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Favorite Audios
            </h3>
          </div>
          
          {!isCreating ? (
            <Button
              onClick={toggleCreating}
              variant="outline"
              className={cn(
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400",
                "transition-colors"
              )}
            >
              <motion.div className="flex items-center gap-2" whileHover={{ x: 5 }}>
                <PlusCircle className="h-4 w-4" />
                <span>Add audio</span>
              </motion.div>
            </Button>
          ) : (
            <Button
              onClick={toggleCreating}
              variant="ghost"
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
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
                      "data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
                    )}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Add manually
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paste-link" 
                    className={cn(
                      "flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
                      "data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
                    )}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Paste URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add-link" className="mt-0">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(editMode ? onSave : onSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="url" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Audio URL <span className="text-emerald-500">*</span>
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      id="url"
                                      disabled={isSubmitting || isUpdating}
                                      placeholder="https://open.spotify.com/track/..."
                                      className={cn(
                                        "bg-white dark:bg-gray-900",
                                        "border-gray-200 dark:border-gray-700",
                                        "text-gray-900 dark:text-gray-200",
                                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                        "focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
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
                                <FormLabel htmlFor="platform" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Platform <span className="text-emerald-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id="platform"
                                    disabled={isSubmitting || isUpdating}
                                    placeholder="e.g., Spotify, SoundCloud"
                                    className={cn(
                                      "bg-white dark:bg-gray-900",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                      "focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="category" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Category <span className="text-emerald-500">*</span>
                                </FormLabel>
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
                                    <div className="p-2 pb-0">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Music Genres</div>
                                    </div>
                                    {audioCategories.slice(0, 19).map((category) => (
                                      <SelectItem 
                                        key={category} 
                                        value={category}
                                        className="text-gray-900 dark:text-gray-200"
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                    <div className="p-2 pb-0 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Podcasts & Learning</div>
                                    </div>
                                    {audioCategories.slice(19).map((category) => (
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
                                  Select the most appropriate category for this audio content
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
                                <FormLabel htmlFor="title" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Audio Title <span className="text-emerald-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id="title"
                                    disabled={isSubmitting || isUpdating}
                                    placeholder="Enter audio title"
                                    className={cn(
                                      "bg-white dark:bg-gray-900",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                      "focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />
                          
                          {/* Audio info preview */}
                          <div>
                            <FormLabel className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                              Audio Info
                            </FormLabel>
                            <div className={cn(
                              "mt-2 rounded-md bg-gray-50 dark:bg-gray-900 overflow-hidden",
                              "border border-gray-200 dark:border-gray-700"
                            )}>
                              {/* Audio artwork */}
                              {audioArtwork ? (
                                <div className="w-full h-40 overflow-hidden">
                                  <Image 
                                    src={audioArtwork} 
                                    alt="Audio artwork" 
                                    width={400}
                                    height={160}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-40 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center">
                                  <Music className="h-12 w-12 text-emerald-500/40 dark:text-emerald-400/40" />
                                </div>
                              )}
                              
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {audioFavicon ? (
                                    <Image 
                                      src={audioFavicon} 
                                      alt="Platform favicon" 
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        // Use platform icon as fallback
                                        const platformIcon = document.getElementById('platform-icon');
                                        if (platformIcon) platformIcon.style.display = 'block';
                                      }}
                                    />
                                  ) : (
                                    <Speaker id="platform-icon" className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {form.getValues('platform') || 'Platform'}
                                    {audioType && ` • ${audioType.charAt(0).toUpperCase() + audioType.slice(1)}`}
                                  </span>
                                </div>
                                
                                {audioArtist && (
                                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <span className="font-medium">Artist:</span> {audioArtist}
                                  </div>
                                )}
                                
                                {audioAlbum && (
                                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <span className="font-medium">Album:</span> {audioAlbum}
                                  </div>
                                )}
                                
                                {form.getValues('category') && (
                                  <div className="mb-2">
                                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full">
                                      {form.getValues('category')}
                                    </span>
                                  </div>
                                )}
                                
                                {form.getValues('url') && (
                                  <a
                                    href={form.getValues('url')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 mt-2"
                                  >
                                    <Globe className="h-3 w-3" />
                                    <span className="truncate">{form.getValues('url')}</span>
                                  </a>
                                )}
                              </div>
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
                            "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white",
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
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full inline-flex items-center justify-center mb-4">
                        <Clipboard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Paste an audio URL
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Copy an audio URL from Spotify, SoundCloud, or other platforms and paste it below.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="relative">
                        <Input
                          value={form.getValues('url') || ''}
                          onChange={(e) => form.setValue('url', e.target.value)}
                          placeholder="https://open.spotify.com/track/..."
                          className={cn(
                            "bg-white dark:bg-gray-800",
                            "border-gray-200 dark:border-gray-700",
                            "text-gray-900 dark:text-gray-200",
                            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                            "focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
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
                          "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white",
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
          favoriteAudios.length === 0 && !isCreating && "bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
        )}>
          {favoriteAudios.length === 0 && !isCreating ? (
            <div className="space-y-4">
              <div className="mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 w-12 h-12 flex items-center justify-center">
                <Headphones className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">No favorite audios yet</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Add audio content you love and want to save for later listening.
              </p>
              <Button
                onClick={toggleCreating}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Audio
              </Button>
            </div>
          ) : !isCreating && (
            <>
              <FavoriteAudioList
                onEdit={onEdit}
                onReorder={onReorder}
                onDelete={onDelete}
                items={favoriteAudios}
              />
              {favoriteAudios.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <Grip className="h-3 w-3" />
                    Drag audios to reorder your collection
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

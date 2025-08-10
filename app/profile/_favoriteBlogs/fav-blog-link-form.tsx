"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, X, Newspaper, Link, Globe, Clipboard, Grip } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FavoriteBlog } from "@prisma/client";
import { FavoriteBlogList } from "./fav-blog-link-list";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteBlogLinkFormProps {
  userId: string;
  favoriteBlogs?: FavoriteBlog[];
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required.",
  }),
  platform: z.string().min(1, {
    message: "Platform is required.",
  }),
  url: z.string().url("Enter a valid URL"),
  category: z.string().optional(),
});

const blogCategories = [
  "Technology",
  "Programming",
  "Web Development",
  "Data Science",
  "Artificial Intelligence",
  "Machine Learning",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "Mobile Development",
  "Software Engineering",
  "UI/UX Design",
  "Business",
  "Productivity",
  "Career Development",
  "Personal Growth",
  "Tutorial",
  "Case Study",
  "Best Practices",
  "Industry News",
  "Opinion",
  "Research",
] as const;

const blogPlatforms = [
  { name: "Medium", value: "Medium", icon: Newspaper },
  { name: "Dev.to", value: "Dev.to", icon: Globe },
  { name: "WordPress", value: "WordPress", icon: Globe },
  { name: "Hashnode", value: "Hashnode", icon: Newspaper },
  { name: "Personal Blog", value: "Personal Blog", icon: Globe },
  { name: "Other", value: "Other", icon: Globe },
];

export const FavoriteBlogLinkForm = ({
  userId,
  favoriteBlogs = [],
}: FavoriteBlogLinkFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add-link");
  const [blogFavicon, setBlogFavicon] = useState<string | null>(null);
  const [blogImage, setBlogImage] = useState<string | null>(null);

  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setActiveTab("add-link");
    setEditMode(false);
    form.reset();
    setBlogFavicon(null);
    setBlogImage(null);
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditingBlogId(null);
    form.reset();
    setBlogFavicon(null);
    setBlogImage(null);
  };

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      platform: "Medium",
      url: "",
      category: "",
    },
    mode: "onChange",
  });

  const fetchBlogMetadata = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      
      // Use our API endpoint to fetch metadata
      const response = await axios.get(`/api/fetch-blog-metadata?url=${encodeURIComponent(url)}`);
      
      if (response.data?.title) {
        form.setValue('title', response.data.title);
      }
      
      // Set favicon if available
      if (response.data?.favicon) {
        setBlogFavicon(response.data.favicon);
      }
      
      // Set featured image if available
      if (response.data?.featuredImage) {
        setBlogImage(response.data.featuredImage);
      }
      
      toast.success("Blog details fetched");
    } catch (error) {
      logger.error("Error fetching blog metadata:", error);
      toast.error("Couldn't fetch blog details. Please enter them manually.");
    } finally {
      setIsLoading(false);
    }
  }, [form, setBlogFavicon, setBlogImage, setIsLoading]);

  // Auto-detect platform from URL and fetch metadata
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'url' && value.url && value.url.startsWith('http')) {
        const url = value.url;
        
        // Auto-detect platform
        if (url.includes('medium.com')) {
          form.setValue('platform', 'Medium');
        } else if (url.includes('dev.to')) {
          form.setValue('platform', 'Dev.to');
        } else if (url.includes('wordpress.com') || url.includes('wp.com')) {
          form.setValue('platform', 'WordPress');
        } else if (url.includes('hashnode.dev') || url.includes('hashnode.com')) {
          form.setValue('platform', 'Hashnode');
        } else {
          form.setValue('platform', 'Other');
        }
        
        // Add a small delay before fetching metadata to avoid too many requests during typing
        const timer = setTimeout(() => {
          // Only fetch if URL is valid
          if (form.formState.errors.url === undefined) {
            fetchBlogMetadata(url);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, fetchBlogMetadata]);

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();
  const isFormComplete = !!watchedValues.title && !!watchedValues.platform && !!watchedValues.url;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      if (editMode) {
        await axios.patch(`/api/users/${userId}/favorite-blogs/${editingBlogId}`, values);
        toast.success("Blog updated successfully");
      } else {
        await axios.post(`/api/users/${userId}/favorite-blogs`, values);
        toast.success("Blog added to favorites");
      }
      
      router.refresh();
      toggleCreating();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/users/${userId}/favorite-blogs/reorder`, {
        list: updateData,
      });
      toast.success("Favorite blogs reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string, data: {
    title: string;
    platform: string;
    url: string;
    category?: string;
  }) => {
    const blogToEdit = favoriteBlogs.find((blog) => blog.id === id);
    if (blogToEdit) {
      setEditMode(true);
      setEditingBlogId(id);
      setIsCreating(true);
      setActiveTab("add-link");
      
      form.reset({
        title: data.title,
        platform: data.platform,
        url: data.url,
        category: data.category || "",
      });
    }
  };

  const onDelete = async (blogId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/users/${userId}/favorite-blogs/${blogId}`);
      toast.success("Blog removed from favorites");
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
          toast.loading("Fetching blog details...", { id: "fetching-metadata" });
          
          try {
            const response = await axios.get(`/api/fetch-blog-metadata?url=${encodeURIComponent(text)}`);
            
            if (response.data) {
              // Set the form values
              if (response.data.title) {
                form.setValue('title', response.data.title);
              }
              
              // Auto-detect platform
              if (text.includes('medium.com')) {
                form.setValue('platform', 'Medium');
              } else if (text.includes('dev.to')) {
                form.setValue('platform', 'Dev.to');
              } else if (text.includes('wordpress.com') || text.includes('wp.com')) {
                form.setValue('platform', 'WordPress');
              } else if (text.includes('hashnode.dev') || text.includes('hashnode.com')) {
                form.setValue('platform', 'Hashnode');
              } else {
                form.setValue('platform', 'Other');
              }
              
              // Set favicon if available
              if (response.data.favicon) {
                setBlogFavicon(response.data.favicon);
              }
              
              // Set featured image if available
              if (response.data.featuredImage) {
                setBlogImage(response.data.featuredImage);
              }
              
              toast.success("Blog details found!", { id: "fetching-metadata" });
            } else {
              toast.error("Couldn't find blog details. Please enter them manually.", { id: "fetching-metadata" });
            }
          } catch (error) {
            logger.error("Error fetching metadata:", error);
            toast.error("Couldn't fetch blog details. Please enter them manually.", { id: "fetching-metadata" });
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
            <Loader2 className="h-6 w-6 text-amber-500 dark:text-amber-400" />
          </motion.div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
              <Newspaper className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              Favorite Blogs
            </h3>
          </div>
          
          {!isCreating ? (
            <Button
              onClick={toggleCreating}
              variant="outline"
              className={cn(
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                "hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400",
                "transition-colors"
              )}
            >
              <motion.div className="flex items-center gap-2" whileHover={{ x: 5 }}>
                <PlusCircle className="h-4 w-4" />
                <span>Add blog</span>
              </motion.div>
            </Button>
          ) : (
            <Button
              onClick={toggleCreating}
              variant="ghost"
              className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400"
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
                      "data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
                    )}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Add manually
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paste-link" 
                    className={cn(
                      "flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
                      "data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
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
                                <FormLabel htmlFor="url" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Blog URL <span className="text-amber-500">*</span>
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      id="url"
                                      disabled={isSubmitting || isUpdating}
                                      placeholder="https://medium.com/..."
                                      className={cn(
                                        "bg-white dark:bg-gray-900",
                                        "border-gray-200 dark:border-gray-700",
                                        "text-gray-900 dark:text-gray-200",
                                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                        "focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50"
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
                                  Platform <span className="text-amber-500">*</span>
                                </FormLabel>
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
                                    {blogPlatforms.map((platform) => (
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
                                <FormLabel htmlFor="category" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                                  Category (Optional)
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
                                    {blogCategories.map((category) => (
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
                                  Categorize your blogs for better organization
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
                                  Blog Title <span className="text-amber-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id="title"
                                    disabled={isSubmitting || isUpdating}
                                    placeholder="Enter blog title"
                                    className={cn(
                                      "bg-white dark:bg-gray-900",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                      "focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />
                          
                          {/* Blog info preview */}
                          <div>
                            <FormLabel className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                              Blog Info
                            </FormLabel>
                            <div className={cn(
                              "mt-2 rounded-md bg-gray-50 dark:bg-gray-900 overflow-hidden",
                              "border border-gray-200 dark:border-gray-700"
                            )}>
                              {/* Blog featured image */}
                              {blogImage ? (
                                <div className="w-full h-32 overflow-hidden">
                                  <Image 
                                    src={blogImage} 
                                    alt="Blog thumbnail" 
                                    width={400}
                                    height={128}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-32 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
                                  <Newspaper className="h-10 w-10 text-amber-500/40 dark:text-amber-400/40" />
                                </div>
                              )}
                              
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {blogFavicon ? (
                                    <Image 
                                      src={blogFavicon} 
                                      alt="Blog favicon" 
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
                                    <Newspaper id="platform-icon" className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {form.getValues('platform') || 'Platform'}
                                  </span>
                                </div>
                                
                                {form.getValues('category') && (
                                  <div className="mb-2">
                                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">
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
                            "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white",
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
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full inline-flex items-center justify-center mb-4">
                        <Clipboard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Paste a blog URL
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Copy a blog URL from Medium, Dev.to, or other platforms and paste it below.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="relative">
                        <Input
                          value={form.getValues('url') || ''}
                          onChange={(e) => form.setValue('url', e.target.value)}
                          placeholder="https://medium.com/..."
                          className={cn(
                            "bg-white dark:bg-gray-800",
                            "border-gray-200 dark:border-gray-700",
                            "text-gray-900 dark:text-gray-200",
                            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                            "focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50"
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
                          "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white",
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
          favoriteBlogs.length === 0 && !isCreating && "bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
        )}>
          {favoriteBlogs.length === 0 && !isCreating ? (
            <div className="space-y-4">
              <div className="mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 w-12 h-12 flex items-center justify-center">
                <Newspaper className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">No favorite blogs yet</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Add blogs you love and want to save for later reading.
              </p>
              <Button
                onClick={toggleCreating}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Blog
              </Button>
            </div>
          ) : !isCreating && (
            <>
              <FavoriteBlogList
                userId={userId}
                onEdit={onEdit}
                onReorder={onReorder}
                onDelete={onDelete}
                items={favoriteBlogs}
              />
              {favoriteBlogs.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <Grip className="h-3 w-3" />
                    Drag blogs to reorder your collection
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

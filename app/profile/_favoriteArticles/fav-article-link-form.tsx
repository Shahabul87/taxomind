"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, X, FileText, Link, Newspaper, Globe, Clipboard, Grip } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FavoriteArticle } from "@prisma/client";
import Image from "next/image";
import { FavoriteArticleList } from "./fav-article-link-list";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteArticleLinkFormProps {
  userId: string;
  favoriteArticles?: FavoriteArticle[];
}

interface FormData {
  title: string;
  platform: string;
  url: string;
  category?: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required.",
  }),
  platform: z.string().min(1, {
    message: "Platform is required.",
  }),
  url: z.string().min(1, {
    message: "URL is required.",
  }),
  category: z.string().optional(),
});

const articleCategories = [
  // Academic & Research
  "Academic Research",
  "Scientific Papers",
  "Research Journals",
  "Medical Studies",
  "Conference Papers",
  "White Papers",
  "Literature Reviews",
  "Case Studies",
  "Technical Documentation",
  "Legal Analysis",
  
  // Business & Industry
  "Technology News",
  "Business Analysis",
  "Industry Reports",
  "Market Research",
  "Economic Reports",
  "Industry Trends", 
  "Innovation Studies",
  "Sustainability Reports",
  "Data Analysis",
  
  // Career & Education
  "Educational Resources",
  "Professional Development",
  "Career Advice",
  "Leadership Insights",
  "Expert Opinions",
  "Policy Papers",
  "Social Studies",
  "Environmental Research",
  "Psychology Studies",
  "Historical Analysis",
  "Cultural Analysis"
] as const;

export const FavoriteArticleLinkForm = ({
  userId,
  favoriteArticles = [],
}: FavoriteArticleLinkFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [articleId, setEditingArticleId] = useState<string | null>(null);
  const [articleFavicon, setArticleFavicon] = useState<string | null>(null);
  const [articleImage, setArticleImage] = useState<string | null>(null);
  const [articleAuthor, setArticleAuthor] = useState<string | null>(null);
  const [articlePublisher, setArticlePublisher] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add-link");

  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setActiveTab("add-link");
    setEditMode(false);
    form.reset();
    resetMetadata();
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditingArticleId(null);
    form.reset();
    resetMetadata();
  };
  
  const resetMetadata = () => {
    setArticleFavicon(null);
    setArticleImage(null);
    setArticleAuthor(null);
    setArticlePublisher(null);
  };

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      platform: "",
      url: "",
      category: "",
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();
  const isFormComplete = !!watchedValues.title && !!watchedValues.platform && !!watchedValues.url;

  useEffect(() => {
    console.log("Form Validity:", isValid);
    console.log("Form Completion:", isFormComplete);
    console.log("Watched Values:", watchedValues);
  }, [isFormComplete, isValid, watchedValues]);

  const fetchArticleMetadata = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      
      // Use our API endpoint to fetch metadata
      const response = await axios.get(`/api/fetch-article-metadata?url=${encodeURIComponent(url)}`);
      console.log("Article metadata response:", response.data);
      
      if (response.data?.title) {
        form.setValue('title', response.data.title);
      }
      
      // Set platform if available
      if (response.data?.platform) {
        form.setValue('platform', response.data.platform);
      }
      
      // Set favicon if available
      if (response.data?.favicon) {
        setArticleFavicon(response.data.favicon);
      }
      
      // Set image if available
      if (response.data?.image) {
        setArticleImage(response.data.image);
      }
      
      // Set author if available
      if (response.data?.author) {
        setArticleAuthor(response.data.author);
      }
      
      // Set publisher if available
      if (response.data?.publisher) {
        setArticlePublisher(response.data.publisher);
      }
      
      // Try to detect category based on content
      if (!form.getValues('category')) {
        detectArticleCategory(response.data);
      }
      
      toast.success("Article details fetched");
    } catch (error) {
      console.error("Error fetching article metadata:", error);
      toast.error("Couldn't fetch article details. Please enter them manually.");
    } finally {
      setIsLoading(false);
    }
  }, [form, detectArticleCategory]);

  // Helper function to try detecting the appropriate article category
  const detectArticleCategory = useCallback((metadata: any) => {
    if (!metadata) return;
    
    // Check if we have any content keywords or description
    const contentText = [
      metadata.description || "",
      metadata.keywords || "",
      metadata.title || ""
    ].join(" ").toLowerCase();
    
    // Try to match category based on content
    if (contentText.includes("research") || contentText.includes("study") || contentText.includes("academic")) {
      form.setValue('category', 'Academic Research');
    } else if (contentText.includes("tech") || contentText.includes("technology")) {
      form.setValue('category', 'Technology News');
    } else if (contentText.includes("business") || contentText.includes("market")) {
      form.setValue('category', 'Business Analysis');
    } else if (contentText.includes("career") || contentText.includes("job")) {
      form.setValue('category', 'Career Advice');
    } else if (contentText.includes("leader") || contentText.includes("management")) {
      form.setValue('category', 'Leadership Insights');
    } else if (contentText.includes("education") || contentText.includes("learn")) {
      form.setValue('category', 'Educational Resources');
    } else if (contentText.includes("scientific") || contentText.includes("science")) {
      form.setValue('category', 'Scientific Papers');
    } else if (contentText.includes("economic") || contentText.includes("economy")) {
      form.setValue('category', 'Economic Reports');
    } else if (contentText.includes("data") || contentText.includes("analysis")) {
      form.setValue('category', 'Data Analysis');
    } else if (contentText.includes("medical") || contentText.includes("health")) {
      form.setValue('category', 'Medical Studies');
    }
    
    // Default based on platform
    if (!form.getValues('category')) {
      if (metadata.platform === 'Medium' || metadata.platform === 'Substack') {
        form.setValue('category', 'Technology News');
      } else if (metadata.platform === 'Harvard Business Review' || metadata.url?.includes('hbr.org')) {
        form.setValue('category', 'Business Analysis');
      } else if (metadata.platform === 'ResearchGate' || metadata.url?.includes('researchgate')) {
        form.setValue('category', 'Academic Research');
      } else if (metadata.platform === 'LinkedIn' || metadata.url?.includes('linkedin.com')) {
        form.setValue('category', 'Professional Development');
      }
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
            fetchArticleMetadata(url);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, fetchArticleMetadata]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text.startsWith('http')) {
        form.setValue('url', text);
        await form.trigger('url');
        
        // If the URL seems valid, try to fetch metadata
        if (!form.formState.errors.url) {
          // Show loading indicator
          toast.loading("Fetching article details...", { id: "fetching-metadata" });
          
          try {
            const response = await axios.get(`/api/fetch-article-metadata?url=${encodeURIComponent(text)}`);
            console.log("Article metadata from paste:", response.data);
            
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
                setArticleFavicon(response.data.favicon);
              }
              
              // Set image if available
              if (response.data.image) {
                setArticleImage(response.data.image);
              }
              
              // Set author if available
              if (response.data.author) {
                setArticleAuthor(response.data.author);
              }
              
              // Set publisher if available
              if (response.data.publisher) {
                setArticlePublisher(response.data.publisher);
              }
              
              // Try to detect category
              if (!form.getValues('category')) {
                detectArticleCategory(response.data);
              }
              
              toast.success("Article details found!", { id: "fetching-metadata" });
            } else {
              toast.error("Couldn't find article details. Please enter them manually.", { id: "fetching-metadata" });
            }
          } catch (error) {
            console.error("Error fetching metadata:", error);
            toast.error("Couldn't fetch article details. Please enter them manually.", { id: "fetching-metadata" });
          }
        }
      } else {
        toast.error("Clipboard content is not a valid URL");
      }
    } catch (err) {
      toast.error("Unable to access clipboard");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/users/${userId}/favorite-articles`, values);
      toast.success("Favorite article added");
      toggleCreating();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onSave = async (values: z.infer<typeof formSchema>) => {
    if (!articleId) return;

    try {
      setIsUpdating(true);
      await axios.patch(`/api/users/${userId}/favorite-articles/${articleId}`, values);
      toast.success("Favorite article updated");
      setEditMode(false);
      setEditingArticleId(null);
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
      await axios.put(`/api/users/${userId}/favorite-articles/reorder`, {
        list: updateData,
      });
      toast.success("Favorite articles reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    const articleToEdit = favoriteArticles.find((article) => article.id === id);
    if (articleToEdit) {
      setEditMode(true);
      setEditingArticleId(id);
      form.setValue("title", articleToEdit.title);
      form.setValue("platform", articleToEdit.platform);
      form.setValue("url", articleToEdit.url);
    }
  };

  const onDelete = async (articleId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/users/${userId}/favorite-articles/${articleId}`);
      toast.success("Favorite article deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
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
            <Loader2 className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          </motion.div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Favorite Articles
            </h3>
          </div>
          
          {!isCreating ? (
            <Button
              onClick={toggleCreating}
              variant="outline"
              className={cn(
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                "hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400",
                "transition-colors"
              )}
            >
              <motion.div className="flex items-center gap-2" whileHover={{ x: 5 }}>
                <PlusCircle className="h-4 w-4" />
                <span>Add article</span>
              </motion.div>
            </Button>
          ) : (
            <Button
              onClick={toggleCreating}
              variant="ghost"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
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
                      "data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                    )}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Add manually
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paste-link" 
                    className={cn(
                      "flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
                      "data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
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
                                  Article URL <span className="text-indigo-500">*</span>
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      id="url"
                                      disabled={isSubmitting || isUpdating}
                                      placeholder="https://example.com/article/..."
                                      className={cn(
                                        "bg-white dark:bg-gray-900",
                                        "border-gray-200 dark:border-gray-700",
                                        "text-gray-900 dark:text-gray-200",
                                        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                        "focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
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
                                  Platform <span className="text-indigo-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id="platform"
                                    disabled={isSubmitting || isUpdating}
                                    placeholder="e.g., Medium, Substack"
                                    className={cn(
                                      "bg-white dark:bg-gray-900",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                      "focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
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
                                  Category <span className="text-indigo-500">*</span>
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
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Academic & Research</div>
                                    </div>
                                    {articleCategories.slice(0, 10).map((category) => (
                                      <SelectItem 
                                        key={category} 
                                        value={category}
                                        className="text-gray-900 dark:text-gray-200"
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                    <div className="p-2 pb-0 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Business & Industry</div>
                                    </div>
                                    {articleCategories.slice(10, 19).map((category) => (
                                      <SelectItem 
                                        key={category} 
                                        value={category}
                                        className="text-gray-900 dark:text-gray-200"
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                    <div className="p-2 pb-0 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Career & Education</div>
                                    </div>
                                    {articleCategories.slice(19).map((category) => (
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
                                <FormMessage className="text-red-500 dark:text-rose-400" />
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
                                  Article Title <span className="text-indigo-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id="title"
                                    disabled={isSubmitting || isUpdating}
                                    placeholder="Enter article title"
                                    className={cn(
                                      "bg-white dark:bg-gray-900",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                      "focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-rose-400" />
                              </FormItem>
                            )}
                          />
                          
                          {/* Article info preview */}
                          <div>
                            <FormLabel className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                              Article Info
                            </FormLabel>
                            <div className={cn(
                              "mt-2 rounded-md bg-gray-50 dark:bg-gray-900 overflow-hidden",
                              "border border-gray-200 dark:border-gray-700"
                            )}>
                              {/* Article image */}
                              {articleImage ? (
                                <div className="w-full h-40 overflow-hidden relative">
                                  <Image 
                                    src={articleImage} 
                                    alt="Article featured image" 
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
                                  <Newspaper className="h-12 w-12 text-indigo-500/40 dark:text-indigo-400/40" />
                                </div>
                              )}
                              
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {articleFavicon ? (
                                    <Image 
                                      src={articleFavicon} 
                                      alt="Platform favicon" 
                                      width={20}
                                      height={20}
                                      className="object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        // Use platform icon as fallback
                                        const platformIcon = document.getElementById('platform-icon');
                                        if (platformIcon) platformIcon.style.display = 'block';
                                      }}
                                    />
                                  ) : (
                                    <FileText id="platform-icon" className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {form.getValues('platform') || 'Platform'}
                                  </span>
                                </div>
                                
                                {articleAuthor && (
                                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <span className="font-medium">Author:</span> {articleAuthor}
                                  </div>
                                )}
                                
                                {articlePublisher && (
                                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <span className="font-medium">Publisher:</span> {articlePublisher}
                                  </div>
                                )}
                                
                                {form.getValues('category') && (
                                  <div className="mb-2">
                                    <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
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
                            "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white",
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
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full inline-flex items-center justify-center mb-4">
                        <Clipboard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Paste an article URL
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Copy an article URL from Medium, Substack, or other platforms and paste it below.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="relative">
                        <Input
                          value={form.getValues('url') || ''}
                          onChange={(e) => form.setValue('url', e.target.value)}
                          placeholder="https://example.com/article/..."
                          className={cn(
                            "bg-white dark:bg-gray-800",
                            "border-gray-200 dark:border-gray-700",
                            "text-gray-900 dark:text-gray-200",
                            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                            "focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
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
                          "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white",
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
          favoriteArticles.length === 0 && !isCreating && "bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
        )}>
          {favoriteArticles.length === 0 && !isCreating ? (
            <div className="space-y-4">
              <div className="mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3 w-12 h-12 flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">No favorite articles yet</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Add article content you love and want to save for later reading.
              </p>
              <Button
                onClick={toggleCreating}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Article
              </Button>
            </div>
          ) : !isCreating && (
            <>
              <FavoriteArticleList
                onEdit={onEdit}
                onReorder={onReorder}
                onDelete={onDelete}
                items={favoriteArticles}
              />
              {favoriteArticles.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <Grip className="h-3 w-3" />
                    Drag articles to reorder your collection
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

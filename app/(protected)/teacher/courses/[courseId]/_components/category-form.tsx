"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, ListFilter, Plus, Check, Tag, ArrowRight, Search, Hash, Compass, X, Zap, Lightbulb } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Optimize by keeping the extended categories but splitting them into smaller chunks
const CATEGORIES_BY_GROUP = {
  "Technology": [
    { label: "Web Development", value: "web-development" },
    { label: "Mobile App Development", value: "mobile-app-development" },
    { label: "Programming Languages", value: "programming-languages" },
    { label: "Game Development", value: "game-development" },
    { label: "Data Science", value: "data-science" },
    { label: "Machine Learning & AI", value: "machine-learning-ai" },
    { label: "Cloud Computing", value: "cloud-computing" },
    { label: "DevOps", value: "devops" },
    { label: "Cybersecurity", value: "cybersecurity" },
    { label: "Blockchain", value: "blockchain" },
  ],
  "Business": [
    { label: "Entrepreneurship", value: "entrepreneurship" },
    { label: "Marketing", value: "marketing" },
    { label: "Digital Marketing", value: "digital-marketing" },
    { label: "Social Media Marketing", value: "social-media-marketing" },
    { label: "Sales", value: "sales" },
    { label: "Finance", value: "finance" },
    { label: "Accounting", value: "accounting" },
    { label: "Project Management", value: "project-management" },
    { label: "Business Strategy", value: "business-strategy" },
    { label: "E-commerce", value: "e-commerce" },
  ],
  "Design": [
    { label: "Graphic Design", value: "graphic-design" },
    { label: "UI/UX Design", value: "ui-ux-design" },
    { label: "Web Design", value: "web-design" },
    { label: "3D & Animation", value: "3d-animation" },
    { label: "Interior Design", value: "interior-design" },
    { label: "Fashion Design", value: "fashion-design" },
    { label: "Product Design", value: "product-design" },
  ],
  "Personal Development": [
    { label: "Leadership", value: "leadership" },
    { label: "Communication Skills", value: "communication-skills" },
    { label: "Public Speaking", value: "public-speaking" },
    { label: "Productivity", value: "productivity" },
    { label: "Personal Growth", value: "personal-growth" },
    { label: "Career Development", value: "career-development" },
    { label: "Soft Skills", value: "soft-skills" },
  ],
  "Academic": [
    { label: "Mathematics", value: "mathematics" },
    { label: "Physics", value: "physics" },
    { label: "Chemistry", value: "chemistry" },
    { label: "Biology", value: "biology" },
    { label: "History", value: "history" },
    { label: "Literature", value: "literature" },
    { label: "Philosophy", value: "philosophy" },
    { label: "Psychology", value: "psychology" },
    { label: "Computer Science", value: "computer-science" },
    { label: "Engineering", value: "engineering" },
  ],
  "Languages": [
    { label: "English", value: "english" },
    { label: "Spanish", value: "spanish" },
    { label: "French", value: "french" },
    { label: "German", value: "german" },
    { label: "Chinese", value: "chinese" },
    { label: "Japanese", value: "japanese" },
    { label: "Arabic", value: "arabic" },
    { label: "Russian", value: "russian" },
  ],
  "Health & Wellness": [
    { label: "Fitness", value: "fitness" },
    { label: "Yoga", value: "yoga" },
    { label: "Nutrition", value: "nutrition" },
    { label: "Mental Health", value: "mental-health" },
    { label: "Meditation", value: "meditation" },
    { label: "Health & Wellness", value: "health-wellness" },
  ],
  "Arts & Entertainment": [
    { label: "Music", value: "music" },
    { label: "Photography", value: "photography" },
    { label: "Videography", value: "videography" },
    { label: "Drawing", value: "drawing" },
    { label: "Painting", value: "painting" },
    { label: "Cooking", value: "cooking" },
    { label: "Writing", value: "writing" },
    { label: "Film & Video", value: "film-video" },
  ],
  "Other": [
    { label: "Parenting", value: "parenting" },
    { label: "Relationships", value: "relationships" },
    { label: "Travel", value: "travel" },
    { label: "DIY & Crafts", value: "diy-crafts" },
    { label: "Gardening", value: "gardening" },
    { label: "Pet Care", value: "pet-care" },
  ]
};

interface CategoryFormProps {
  initialData: {
    categoryId: string | null;
  };
  courseId: string;
  options: { label: string; value: string; }[];
}

// Form schema with both select and custom options
const formSchema = z.object({
  categoryId: z.string().optional(),
  newCategory: z.string().optional(),
  categoryType: z.enum(["existing", "new"]),
  searchQuery: z.string().optional(),
}).refine((data) => {
  if (data.categoryType === "existing") {
    return data.categoryId && data.categoryId.length > 0;
  }
  if (data.categoryType === "new") {
    return data.newCategory && data.newCategory.length > 0;
  }
  return false;
}, {
  message: "Please select a category or enter a new category name",
  path: ["categoryId"],
});

export const CategoryForm = ({
  initialData,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [filteredOptions, setFilteredOptions] = useState<Array<{label: string, value: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Log important props for debugging
  useEffect(() => {
    console.log("CategoryForm rendered with courseId:", courseId);
    console.log("CategoryForm initialData:", initialData);
    
    // Check for common issues
    if (!courseId) {
      console.warn("⚠️ WARNING: courseId is missing or empty - this will cause API requests to fail");
    }
    
    if (typeof window !== 'undefined') {
      console.log("Current URL:", window.location.href);
    }
  }, [courseId, initialData]);
  
  // Memoize this to avoid recreating it on every render
  const combinedOptions = useMemo(() => {
    // Start with database options
    const uniqueValues = new Set<string>();
    const result: Array<{label: string, value: string}> = [];
    
    // Add options from the database first
    for (const option of options) {
      if (!uniqueValues.has(option.value)) {
        uniqueValues.add(option.value);
        result.push(option);
      }
    }
    
    // Only add 10 from each category to avoid memory issues
    for (const [groupName, categories] of Object.entries(CATEGORIES_BY_GROUP)) {
      for (const category of categories) {
        if (!uniqueValues.has(category.value)) {
          uniqueValues.add(category.value);
          result.push(category);
        }
      }
    }
    
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [options]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialData.categoryId || "",
      newCategory: "",
      categoryType: "existing",
      searchQuery: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const { isSubmitting, isValid } = form.formState;
  const categoryType = form.watch("categoryType");
  const searchQuery = form.watch("searchQuery");

  // Filter options based on search term or group - more efficiently
  useEffect(() => {
    if (searchQuery) {
      // Filter but limit results to 20 to avoid memory issues
      const filtered = combinedOptions
        .filter(option => 
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 20);
      setFilteredOptions(filtered);
      setSelectedGroup(null);
    } else if (selectedGroup) {
      // Only show categories from the selected group
      setFilteredOptions(CATEGORIES_BY_GROUP[selectedGroup as keyof typeof CATEGORIES_BY_GROUP] || []);
    } else {
      // Show just a few default options
      setFilteredOptions(combinedOptions.slice(0, 10));
    }
  }, [searchQuery, selectedGroup, combinedOptions]);

  const selectedOption = useMemo(() => {
    return combinedOptions.find(option => option.value === initialData.categoryId);
  }, [initialData.categoryId, combinedOptions]);

  const selectCategory = (option: { label: string; value: string }) => {
    console.log("Category selected:", option);
    form.setValue("categoryId", option.value);
    form.setValue("categoryType", "existing");
    form.setValue("newCategory", ""); // Clear new category when selecting existing
    // Trigger validation
    form.trigger();
    console.log("Form state after category selection:", form.getValues());
    console.log("Form valid after selection:", form.formState.isValid);
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Form submission started with values:", values);
      setIsLoading(true);
      let categoryId = values.categoryId;
      
      // If it's a new category, create it first
      if (values.categoryType === "new" && values.newCategory) {
        try {
          console.log("Creating new category:", values.newCategory);
          // Create a new category
          const response = await axios.post("/api/categories", {
            name: values.newCategory,
          }, {
            // Ensure we get cookies and CSRF token in the request
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          });
          
          // Use the newly created category ID
          categoryId = response.data.id;
          console.log("New category created with ID:", categoryId);
          toast.success("New category created");
        } catch (error) {
          console.error("Error creating new category:", error);
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as any;
            console.error("Error response data:", axiosError.response?.data);
            console.error("Error response status:", axiosError.response?.status);
          }
          toast.error("Failed to create new category");
          setIsLoading(false);
          return;
        }
      } else if (values.categoryType === "existing") {
        // Simple validation that a category was selected
        if (!categoryId || categoryId.trim() === '') {
          console.error("No category ID selected");
          toast.error("Please select a category");
          setIsLoading(false);
          return;
        }
        
        console.log("Using category ID:", categoryId);
      }
      
      // Now update the course with the category ID
      console.log("Updating course with categoryId:", categoryId);
      try {
        const response = await axios.patch(`/api/courses/${courseId}`, { 
          categoryId 
        }, {
          // Ensure we get cookies and CSRF token in the request
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        
        console.log("Course update response:", response.data);
        toast.success("Category updated");
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        console.error("Course update error:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          console.error("Error response data:", axiosError.response?.data);
          console.error("Error response status:", axiosError.response?.status);
        }
        toast.error("Error updating course category");
      }
    } catch (error) {
      console.error("Category update error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn(
      "rounded-xl overflow-hidden",
      "bg-white dark:bg-gray-800",
      "border border-gray-100 dark:border-gray-700",
      "shadow-sm",
      "transition-all duration-300"
    )}>
      {!isEditing ? (
        <div className="relative p-5">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/10 dark:to-indigo-950/5 z-0"></div>
          <div className="absolute -right-10 top-0 w-32 h-32 rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-900/10 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-2 rounded-lg shadow-sm">
                    <Hash className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Course Category
                  </h3>
                </div>
                
                {selectedOption ? (
                  <div className="mt-2">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex"
                    >
                      <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800/20 text-base shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
                        <span className="font-medium text-indigo-700 dark:text-indigo-300">
                          {selectedOption.label}
                        </span>
                      </Badge>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <Compass className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <p className="italic">No category selected yet</p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="rounded-full bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm px-4"
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                {initialData.categoryId ? "Change" : "Select"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/10 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-x-2">
              <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Course Category
              </h3>
            </div>
            
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="sm"
              className="rounded-full text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    console.log("Form submit event triggered");
                    form.handleSubmit(onSubmit)(e);
                  }}
                  className="space-y-5"
                >
                  <Tabs 
                    defaultValue="existing" 
                    onValueChange={(value) => {
                      form.setValue("categoryType", value as "existing" | "new");
                      // Clear the other field when switching tabs
                      if (value === "existing") {
                        form.setValue("newCategory", "");
                      } else {
                        form.setValue("categoryId", "");
                      }
                      // Trigger validation
                      form.trigger();
                      console.log("Tab changed to:", value);
                      console.log("Form state after tab change:", form.getValues());
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <TabsTrigger 
                        value="existing"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white dark:data-[state=active]:from-indigo-600 dark:data-[state=active]:to-purple-600 rounded-md"
                      >
                        Choose Existing
                      </TabsTrigger>
                      <TabsTrigger 
                        value="new"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white dark:data-[state=active]:from-indigo-600 dark:data-[state=active]:to-purple-600 rounded-md"
                      >
                        Create New
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="existing" className="space-y-5 mt-4">
                      <div className="relative">
                        <FormField
                          control={form.control}
                          name="searchQuery"
                          render={({ field }) => (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                placeholder="Search for a category..."
                                data-form="category-search"
                                className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 pl-10 pr-4 h-11 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                ref={inputRef}
                              />
                              {field.value && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange("");
                                    setSearchTerm("");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                  <X className="h-3 w-3 text-gray-400" />
                                </button>
                              )}
                            </div>
                          )}
                        />
                        {searchQuery && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <span>Showing results for: </span>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {searchQuery}
                            </Badge>
                            <span>({filteredOptions.length} found)</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Browse by Category
                          </h4>
                          {selectedGroup && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(null);
                                form.setValue("searchQuery", "");
                              }}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear filter
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(CATEGORIES_BY_GROUP).map(group => (
                            <button
                              key={group}
                              type="button"
                              className={cn(
                                "px-3 py-1.5 text-xs rounded-full font-medium transition-all",
                                selectedGroup === group
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white shadow-sm" 
                                  : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:border-indigo-300 dark:hover:border-indigo-600"
                              )}
                              onClick={() => {
                                setSelectedGroup(prev => prev === group ? null : group);
                                form.setValue("searchQuery", "");
                              }}
                            >
                              {group}
                              {selectedGroup === group && <Check className="h-3 w-3 ml-1" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {selectedGroup && (
                          <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              {selectedGroup} Categories
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {CATEGORIES_BY_GROUP[selectedGroup as keyof typeof CATEGORIES_BY_GROUP]?.length || 0} options available
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                              <motion.button
                                type="button"
                                key={option.value}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => selectCategory(option)}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                                  form.getValues("categoryId") === option.value
                                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800/30 shadow-sm"
                                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-lg shadow-sm",
                                  form.getValues("categoryId") === option.value 
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" 
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                )}>
                                  {form.getValues("categoryId") === option.value ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{option.label.charAt(0)}</span>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-sm font-medium",
                                  form.getValues("categoryId") === option.value
                                    ? "text-indigo-700 dark:text-indigo-300"
                                    : "text-gray-700 dark:text-gray-300"
                                )}>
                                  {option.label}
                                </span>
                              </motion.button>
                            ))
                          ) : (
                            <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center">
                              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 font-medium">No categories found</p>
                              {searchQuery ? (
                                <div className="space-y-2 mt-2">
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    No results for &quot;{searchQuery}&quot;
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      form.setValue("newCategory", searchQuery);
                                      form.setValue("categoryType", "new");
                                      form.setValue("categoryId", ""); // Clear existing category selection
                                      // Trigger validation
                                      form.trigger();
                                      console.log("Created new category from search:", searchQuery);
                                    }}
                                    className="text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Create &quot;{searchQuery}&quot; as new category
                                  </Button>
                                </div>
                              ) : selectedGroup ? (
                                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                                  No categories in {selectedGroup} group
                                </p>
                              ) : (
                                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                                  Search or browse categories above
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="hidden">
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="hidden" {...field} data-form="category-id" />
                              </FormControl>
                              <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="new" className="space-y-5 mt-4">
                      <FormField
                        control={form.control}
                        name="newCategory"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                              <Plus className="h-3.5 w-3.5 text-indigo-500" />
                              Create a new category
                            </FormLabel>
                            <div className="space-y-3">
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    disabled={isSubmitting || categoryType !== "new"}
                                    placeholder="e.g. Data Visualization, UI Design, Machine Learning..."
                                    {...field}
                                    data-form="new-category-name"
                                    onChange={(e) => {
                                      field.onChange(e);
                                      // Trigger validation on change
                                      setTimeout(() => form.trigger(), 100);
                                    }}
                                    className={cn(
                                      "bg-white dark:bg-gray-900/50",
                                      "border-gray-200 dark:border-gray-700",
                                      "text-gray-900 dark:text-gray-200",
                                      "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                      "shadow-sm",
                                      "h-11 rounded-lg",
                                      "pl-4 pr-12",
                                      "transition-all"
                                    )}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-100 dark:bg-indigo-900/20 rounded-full p-1.5">
                                    <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  {field.value && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                        New
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>Available for all your courses</span>
                                </div>
                                <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>Visible to students browsing</span>
                                </div>
                                <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>Helps with course discovery</span>
                                </div>
                                <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>Better content organization</span>
                                </div>
                              </div>
                            </div>
                            <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800/20">
                        <div className="flex items-start gap-3">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm flex-shrink-0 mt-0.5">
                            <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              💡 Category Naming Tips
                            </h4>
                            <ul className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2 space-y-1">
                              <li>• Be specific but not overly narrow</li>
                              <li>• Use industry-standard terms when possible</li>
                              <li>• Consider how students will search for your course</li>
                              <li>• Avoid special characters and keep it concise</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex items-center justify-end gap-x-2 pt-3">
                    {process.env.NODE_ENV === 'development' && (
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            console.log("Testing API connection...");
                            console.log("Course ID:", courseId);
                            
                            // First check if we have a valid category to use for testing
                            let testCategoryId;
                            if (options && options.length > 0) {
                              // Use an existing category if available
                              testCategoryId = options[0].value;
                              console.log("Using existing category for test:", testCategoryId);
                            } else {
                              // Create a test category first
                              console.log("Creating test category...");
                              const categoryResponse = await axios.post("/api/categories", {
                                name: "Test Category " + Date.now()
                              }, {
                                withCredentials: true,
                                headers: {
                                  'Content-Type': 'application/json',
                                }
                              });
                              testCategoryId = categoryResponse.data.id;
                              console.log("Created test category:", testCategoryId);
                            }
                            
                            // Now try to update the course with a valid category ID
                            const response = await axios.patch(`/api/courses/${courseId}`, { 
                              categoryId: testCategoryId
                            }, {
                              withCredentials: true,
                              headers: {
                                'Content-Type': 'application/json',
                              }
                            });
                            console.log("API test response:", response.data);
                            toast.success("API connection test successful");
                          } catch (error) {
                            console.error("API test error:", error);
                            if (error && typeof error === 'object' && 'response' in error) {
                              const axiosError = error as any;
                              console.error("Error response data:", axiosError.response?.data);
                              console.error("Error response status:", axiosError.response?.status);
                            }
                            toast.error("API connection test failed");
                          }
                        }}
                        className="mr-2"
                      >
                        Test API
                      </Button>
                    )}
                    <Button
                      disabled={
                        isLoading || 
                        !isValid ||
                        (categoryType === "existing" && !form.getValues("categoryId")) ||
                        (categoryType === "new" && !form.getValues("newCategory"))
                      }
                      type="submit"
                      onClick={() => {
                        console.log("=== SAVE BUTTON DEBUG ===");
                        console.log("Form values:", form.getValues());
                        console.log("Form isValid:", form.formState.isValid);
                        console.log("Form errors:", form.formState.errors);
                        console.log("Category type:", categoryType);
                        console.log("isLoading:", isLoading);
                        console.log("Button disabled conditions:");
                        console.log("- isLoading:", isLoading);
                        console.log("- !isValid:", !isValid);
                        console.log("- existing + no categoryId:", categoryType === "existing" && !form.getValues("categoryId"));
                        console.log("- new + no newCategory:", categoryType === "new" && !form.getValues("newCategory"));
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-x-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>Save Category</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
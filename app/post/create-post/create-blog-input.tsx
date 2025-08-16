"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Edit3, ArrowRight, Loader2, Tag, X, Sparkles } from "lucide-react";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = [
  "AI & ML", "Architecture", "Art & Design", "Biology", "Blockchain", 
  "Business", "Chemistry", "Cloud Computing", "Cybersecurity", 
  "Data Science", "DevOps", "Digital Marketing", "Engineering", 
  "Environmental", "Game Development", "Health & Medicine", "IoT", 
  "Mathematics", "Mobile Development", "Music & Audio", "Photography", 
  "Physics", "Programming", "Psychology", "Science", "Space & Astronomy", 
  "Technology", "UI/UX Design", "Web Development", "Writing"
].sort();

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters long",
  }).max(100, {
    message: "Title cannot exceed 100 characters"
  }),
  categories: z.array(z.string()).optional(),
  customCategory: z.string().optional(),
});

export const CreateBlogInputSection = () => {
  const router = useRouter();
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isInputValid, setIsInputValid] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      categories: [],
      customCategory: "",
    },
    mode: "onChange"
  });

  const { isSubmitting } = form.formState;
  const title = form.watch("title");
  const selectedCategories = useMemo(() => form.watch("categories") || [], [form]);

  useEffect(() => {
    // Validate the input based on zod schema requirements
    setIsInputValid(title.length >= 3 && title.length <= 100);
  }, [title]);

  useEffect(() => {
    if (categoryInput) {
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(categoryInput.toLowerCase()) && 
        !selectedCategories.includes(cat)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [categoryInput, selectedCategories]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Simple loading toast
      const loadingToast = toast.loading("Creating blog...");
      
      // Make the API call to create post
      const response = await axios.post("/api/posts", values);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Check if the request was successful
      if (response.data.success && response.data.id) {
        // Get post ID from response
        const postId = response.data.id;
        
        // Success message
        toast.success("Blog created successfully");
        
        // Use direct location change for simplicity
        window.location.href = `/post/${postId}`;
      } else {
        toast.error("Failed to create blog");
        logger.error("API response error:", response.data);
      }
    } catch (error: any) {
      toast.error("Failed to create blog");
      logger.error("Blog creation error:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCharCount(value.length);
    form.setValue("title", value, { 
      shouldValidate: true 
    });
  };

  const handleAddCategory = (category: string) => {
    const currentCategories = form.getValues("categories") || [];
    if (!currentCategories.includes(category)) {
      form.setValue("categories", [...currentCategories, category], { shouldValidate: true });
    }
    setCategoryInput("");
    setShowSuggestions(false);
  };

  const handleAddCustomCategory = () => {
    if (customCategory && customCategory.length > 0) {
      const currentCategories = form.getValues("categories") || [];
      if (!currentCategories.includes(customCategory)) {
        form.setValue("categories", [...currentCategories, customCategory], { shouldValidate: true });
      }
      setCustomCategory("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    const currentCategories = form.getValues("categories") || [];
    form.setValue(
      "categories", 
      currentCategories.filter(cat => cat !== category),
      { shouldValidate: true }
    );
  };

  return ( 
    <div className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                  <div className={cn(
                    "absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200",
                    field.value ? "opacity-0 -translate-x-2" : "opacity-100",
                    isFocused ? "text-indigo-500" : "text-gray-400"
                  )}>
                    <Edit3 className="h-5 w-5" />
                  </div>
                  
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      placeholder="Enter an engaging title for your blog post..."
                      className={cn(
                        "w-full py-5 text-lg pr-4 relative",
                        field.value ? "pl-4" : "pl-12",
                        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
                        "border-2 rounded-xl",
                        "transition-all duration-300 ease-in-out",
                        "text-gray-800 dark:text-gray-100",
                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        isFocused
                          ? "border-indigo-500 dark:border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.3)] dark:shadow-[0_0_0_1px_rgba(99,102,241,0.3)]"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      )}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </div>
                
                <div className="flex items-center justify-between px-1">
                  <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                  <div className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full transition-all duration-300",
                    charCount > 0 ? (
                      charCount > 80 ? 
                        "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30" : 
                        "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
                    ) : "text-gray-500 dark:text-gray-400"
                  )}>
                    {charCount} / 100 characters
                  </div>
                </div>
                
                {!isInputValid && field.value && field.value.length > 0 && (
                  <div className="text-center text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                    {field.value.length < 3 ? "Title must be at least 3 characters long" : "Title cannot exceed 100 characters"}
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Categories Field */}
          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div>
                  <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-medium">
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-md">
                      <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Categories
                  </FormLabel>
                  <FormDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-7">
                    Add categories to help readers find your content
                  </FormDescription>
                </div>

                {/* Selected Categories */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 my-3 p-3 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800/80">
                    {selectedCategories.map((category) => (
                      <Badge 
                        key={category} 
                        className="bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-800 
                                 dark:from-indigo-900/60 dark:to-purple-900/60 dark:text-indigo-300 dark:hover:from-indigo-800/80 dark:hover:to-purple-800/80 
                                 py-1.5 px-3 rounded-full flex items-center gap-1.5 border border-indigo-200/50 dark:border-indigo-700/30 shadow-sm"
                      >
                        {category}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-1 hover:bg-indigo-200/70 dark:hover:bg-indigo-800/70 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category Search */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 dark:from-indigo-700/20 dark:to-purple-700/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categoryInput}
                    onChange={(e) => {
                      setCategoryInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 relative rounded-xl"
                  />
                  
                  {showSuggestions && filteredCategories.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg max-h-60 rounded-xl overflow-auto border border-gray-200 dark:border-gray-700">
                      {filteredCategories.map((category) => (
                        <div 
                          key={category}
                          className="px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors duration-200"
                          onClick={() => handleAddCategory(category)}
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Category Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Or add a custom category..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                  <Button 
                    type="button"
                    onClick={handleAddCustomCategory}
                    variant="outline"
                    className="shrink-0 border-indigo-200 hover:border-indigo-300 dark:border-indigo-800 dark:hover:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-xl"
                    disabled={!customCategory}
                  >
                    Add
                  </Button>
                </div>
              </FormItem>
            )}
          />
          
          <div className="mt-8">
            <Button
              type="submit"
              disabled={!isInputValid || isSubmitting}
              className={cn(
                "w-full md:w-auto md:min-w-[200px] md:float-right py-4 px-6 relative overflow-hidden group",
                "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100",
                "dark:from-indigo-700 dark:via-purple-700 dark:to-indigo-700",
                "text-white font-medium text-base",
                "rounded-xl transition-all duration-500",
                "disabled:opacity-70 disabled:cursor-not-allowed",
                "shadow-md hover:shadow-lg",
                "border border-indigo-700/30",
                "flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Blog...</span>
                </>
              ) : (
                <>
                  <span>Continue to Content</span>
                  <div className="relative">
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform duration-300" />
                    <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </>
              )}
            </Button>
            <div className="clear-both"></div>
          </div>
        </form>
      </Form>
    </div>
  );
}
 
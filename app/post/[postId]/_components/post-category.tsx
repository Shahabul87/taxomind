"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Tag, X, Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Post } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CategoryFormProps {
  initialData: Post;
  postId: string;
}

const formSchema = z.object({
  categories: z.array(z.string()).min(1, {
    message: "At least one category is required",
  }),
  customCategory: z.string().optional(),
});

// Convert comma-separated category string to array
const parseCategories = (categoryString: string | null) => {
  if (!categoryString) return [];
  return categoryString.split(',').map(cat => cat.trim()).filter(Boolean);
};

// Categories for suggestions
const categoryOptions = [
  "AI & ML", "Architecture", "Art & Design", "Biology", "Blockchain", 
  "Business", "Chemistry", "Cloud Computing", "Cybersecurity", 
  "Data Science", "DevOps", "Digital Marketing", "Engineering", 
  "Environmental", "Game Development", "Health & Medicine", "IoT", 
  "Mathematics", "Mobile Development", "Music & Audio", "Photography", 
  "Physics", "Programming", "Psychology", "Science", "Space & Astronomy", 
  "Technology", "UI/UX Design", "Web Development", "Writing"
].sort();

export const PostCategory = ({
  initialData,
  postId
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  
  const initialCategories = parseCategories(initialData.category);
  
  const [customCategory, setCustomCategory] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: initialCategories,
      customCategory: "",
    },
  });

  const { isSubmitting } = form.formState;
  const selectedCategories = useMemo(() => form.watch("categories") || [], [form]);
  
  useEffect(() => {
    if (categoryInput) {
      const filtered = categoryOptions.filter(cat => 
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
      // Join array to comma-separated string for API
      const categoryString = values.categories.join(', ');
      
      await axios.patch(`/api/posts/${postId}`, { category: categoryString });
      toast.success("Categories updated");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
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
    <div className="p-3 sm:p-4 lg:p-6 bg-white/50 dark:bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-all duration-200">
      {!isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-x-2">
              <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-gray-900 dark:text-gray-200 text-sm sm:text-base">
                Categories
              </span>
              {initialCategories.length === 0 && (
                <span className="text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Required
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {initialCategories.length > 0 ? (
                initialCategories.map((category) => (
                  <span key={category} className="text-sm px-2.5 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-full">
                    {category}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No categories selected
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            className="w-full sm:w-auto text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:text-purple-300 dark:hover:bg-purple-500/10"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Select categories that best describe your post
                  </FormDescription>
                  
                  {/* Selected Categories */}
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 my-3">
                      {selectedCategories.map((category) => (
                        <Badge 
                          key={category} 
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-800/60 py-1 px-2 rounded-full flex items-center gap-1"
                        >
                          {category}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCategory(category)}
                            className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Category Search */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search categories..."
                      value={categoryInput}
                      onChange={(e) => {
                        setCategoryInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="bg-white dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-200"
                    />
                    
                    {showSuggestions && filteredCategories.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md overflow-auto border border-gray-200 dark:border-gray-700">
                        {filteredCategories.map((category) => (
                          <div 
                            key={category}
                            className="px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-gray-800 dark:text-gray-200"
                            onClick={() => handleAddCategory(category)}
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Category */}
                  <div className="flex gap-2 mt-3">
                    <Input
                      type="text"
                      placeholder="Or add a custom category..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="bg-white dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-200"
                    />
                    <Button 
                      type="button"
                      onClick={handleAddCustomCategory}
                      variant="outline"
                      className="shrink-0 border-purple-200 hover:border-purple-300 dark:border-purple-800 dark:hover:border-purple-700 text-purple-600 dark:text-purple-400"
                      disabled={!customCategory}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <FormMessage className="text-rose-500 dark:text-rose-400 text-sm mt-2" />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-x-2">
              <Button
                disabled={selectedCategories.length === 0 || isSubmitting}
                type="submit"
                variant="ghost"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 dark:hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CategoryFormProps {
  initialData: {
    categoryId: string | null;
  };
  courseId: string;
  options: { label: string; value: string; }[];
}

const formSchema = z.object({
  categoryId: z.string().optional(),
  customCategory: z.string().optional(),
}).refine((data) => data.categoryId || data.customCategory, {
  message: "Please select a category or enter a custom one",
  path: ["categoryId"],
});

export const CategoryForm = ({
  initialData,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      customCategory: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let categoryId = values.categoryId;

      // If using custom category, create it first
      if (useCustomCategory && values.customCategory) {
        const response = await axios.post("/api/categories", {
          name: values.customCategory,
        });
        categoryId = response.data.id;
        toast.success("New category created");
      }

      await axios.patch(`/api/courses/${courseId}`, { categoryId });
      toast.success("Course category updated");
      toggleEdit();
      setUseCustomCategory(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const selectedOption = options.find(
    (option) => option.value === initialData.categoryId
  );

  return (
    <div className="space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-3 md:gap-4 transition-all duration-300">
            <div className="flex-1 min-w-0 w-full xs:w-auto">
              {selectedOption ? (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 break-words">
                    {selectedOption.label}
                  </span>
                </div>
              ) : (
                <div className="space-y-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No category selected
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-2 sm:px-3 break-words">
                    Choose a category to help students discover your course
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={toggleEdit}
              variant="outline"
              size="sm"
              className={cn(
                "flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm",
                "bg-white/80 dark:bg-slate-800/80",
                "border-slate-200 dark:border-slate-700",
                "text-slate-700 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "hover:border-purple-300 dark:hover:border-purple-600",
                "hover:text-purple-600 dark:hover:text-purple-400",
                "font-semibold",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                "backdrop-blur-sm"
              )}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {!useCustomCategory ? (
              <>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className={cn(
                              "bg-white dark:bg-slate-900",
                              "border border-slate-300/60 dark:border-slate-600/60",
                              "text-slate-900 dark:text-slate-100",
                              "focus:border-slate-400/70 dark:focus:border-slate-500/70",
                              "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                              "text-xs sm:text-sm font-normal",
                              "h-10 sm:h-11",
                              "rounded-md",
                              "transition-all duration-200"
                            )}
                          >
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {options.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-800"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseCustomCategory(true);
                    form.setValue("categoryId", "");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto text-[10px] sm:text-xs font-medium break-words"
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
                  <span className="break-words">Can&apos;t find your category? Add custom</span>
                </Button>
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="customCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          placeholder="Enter custom category name (e.g., Data Science)"
                          className={cn(
                            "bg-white dark:bg-slate-900",
                            "border border-slate-300/60 dark:border-slate-600/60",
                            "text-slate-900 dark:text-slate-100",
                            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                            "focus:border-slate-400/70 dark:focus:border-slate-500/70",
                            "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                            "text-xs sm:text-sm font-normal",
                            "h-10 sm:h-11",
                            "rounded-md",
                            "transition-all duration-200"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseCustomCategory(false);
                    form.setValue("customCategory", "");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto text-[10px] sm:text-xs font-medium"
                >
                  ← Back to category list
                </Button>
              </>
            )}
            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2">
              <Button
                onClick={() => {
                  toggleEdit();
                  setUseCustomCategory(false);
                }}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-10 sm:h-9 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-700",
                  "font-semibold",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </Button>
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-9 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

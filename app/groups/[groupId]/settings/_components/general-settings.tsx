"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";

interface GeneralSettingsProps {
  group: any;
  currentUser: any;
  isCreator: boolean;
}

const formSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
  courseId: z.string().optional(),
  imageUrl: z.string().optional(),
});

export function GeneralSettings({ group, currentUser, isCreator }: GeneralSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(group.imageUrl || "");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group.name,
      description: group.description || "",
      categoryId: group.categoryId || "",
      courseId: group.courseId || "none",
      imageUrl: group.imageUrl || "",
    },
  });

  const handleImageUpload = async (files: File[]) => {
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "bdgenai_upload");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        form.setValue("imageUrl", data.secure_url);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      toast.error(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      // Update group with values
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update group settings");
      }

      toast.success("Group settings updated successfully");
    } catch (error) {
      toast.error("Something went wrong");
      logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">General Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Update your group&apos;s basic information.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Group Image */}
          <div className="space-y-2">
            <FormLabel>Group Image</FormLabel>
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Group image"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                )}
              </div>
              <div className="flex-1">
                <FileUpload
                  onUpload={handleImageUpload}
                  accept="image/*"
                  maxSize={4 * 1024 * 1024} // 4MB
                />
              </div>
            </div>
          </div>

          {/* Group Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter group name" {...field} />
                </FormControl>
                <FormDescription>
                  This is how your group will appear to others.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Group Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what your group is about"
                    className="min-h-32 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Give potential members an idea of what your group is about.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cat_science">Science</SelectItem>
                    <SelectItem value="cat_tech">Technology</SelectItem>
                    <SelectItem value="cat_math">Mathematics</SelectItem>
                    <SelectItem value="cat_lang">Languages</SelectItem>
                    <SelectItem value="cat_art">Arts & Humanities</SelectItem>
                    <SelectItem value="cat_business">Business</SelectItem>
                    <SelectItem value="cat_other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Categorizing your group helps others find it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Associated Course */}
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated Course (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to a course (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {/* This would be populated with actual courses */}
                    <SelectItem value="course1">Introduction to Programming</SelectItem>
                    <SelectItem value="course2">Advanced Mathematics</SelectItem>
                    <SelectItem value="course3">Data Science Fundamentals</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Linking your group to a course helps organize related discussions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              className={cn(
                "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white",
                "shadow-md"
              )}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 
"use client";

import { useState } from "react";
import Image from "next/image";
import { PlusCircle, XCircle } from "lucide-react";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface MathImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const MathImageUpload = ({ 
  value, 
  onChange, 
  courseId, 
  chapterId, 
  sectionId 
}: MathImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = e.target.files?.[0];
      
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error('File size must be less than 4MB');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations/image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.secure_url) {
        onChange(data.secure_url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload failed");
      }
    } catch (error: any) {
      toast.error("Something went wrong during upload");
      logger.error('Math image upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <FormItem>
      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Math Equation Image
      </FormLabel>
      <FormControl>
        <div className="border-2 border-dashed border-purple-200 dark:border-purple-800/30 rounded-lg p-6 bg-purple-50 dark:bg-purple-900/20">
          {value ? (
            <div className="relative">
              <Image
                src={value}
                alt="Math equation"
                width={200}
                height={200}
                className="max-w-full h-auto rounded-lg mx-auto"
              />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
                id="mathEquationImageUpload"
              />
              <label
                htmlFor="mathEquationImageUpload"
                className={cn(
                  "flex flex-col items-center justify-center gap-4",
                  "w-full p-6 sm:p-8",
                  "border-2 border-dashed rounded-xl",
                  "border-purple-300 dark:border-purple-700/50",
                  "bg-purple-100 dark:bg-purple-900/30",
                  "cursor-pointer",
                  "hover:border-purple-400 dark:hover:border-purple-600",
                  "hover:bg-purple-200 dark:hover:bg-purple-900/40",
                  "transition-all duration-200",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="p-4 rounded-full bg-purple-200 dark:bg-purple-800/40">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400"></div>
                  ) : (
                    <PlusCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isUploading ? "Uploading..." : "Click to upload math equation image"}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    PNG, JPG, or GIF (Max 4MB)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
    </FormItem>
  );
}; 
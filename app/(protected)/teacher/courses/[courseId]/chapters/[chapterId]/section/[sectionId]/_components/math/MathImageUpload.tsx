'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ensureHttpsUrl, getFallbackImageUrl } from '@/lib/cloudinary-utils';
import { toast } from 'sonner';

export interface MathImageUploadProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}

export const MathImageUpload = ({
  courseId,
  chapterId,
  sectionId,
  onChange,
  value,
  disabled
}: MathImageUploadProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Ensure image URL uses HTTPS and has proper fallback
  const secureImageUrl = ensureHttpsUrl(value) || null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];

      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (4MB limit)
      if (file.size > 4 * 1024 * 1024) {
        toast.error("File size must be less than 4MB");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations/image`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Update the form field with the uploaded image URL
      onChange(data.secure_url || data.url);

      toast.success("Image uploaded!");
      setIsEditing(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Something went wrong during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    toast.success("Image removed");
  };

  const toggleEdit = () => {
    if (disabled) return;
    setIsEditing((current) => !current);
  };

  return (
    <div className="space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex flex-col gap-4">
            {secureImageUrl ? (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700">
                <Image
                  src={secureImageUrl}
                  alt="Math equation image"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageUrl('course');
                  }}
                />
                {/* Remove button overlay */}
                <Button
                  onClick={handleRemove}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2 py-3 rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 px-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No image uploaded
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-3">
                  Upload an equation image (PNG, JPG recommended)
                </p>
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                disabled={disabled}
                type="button"
                className={cn(
                  "h-9 px-4",
                  "bg-white/80 dark:bg-slate-800/80",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-800",
                  "hover:border-purple-300 dark:hover:border-purple-600",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "font-semibold text-sm",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {secureImageUrl ? "Change" : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="mathImageUpload"
            disabled={uploading || disabled}
          />

          <label
            htmlFor="mathImageUpload"
            className={cn(
              "flex flex-col items-center justify-center gap-3",
              "w-full p-8",
              "border-2 border-dashed rounded-lg",
              "border-slate-300 dark:border-slate-600",
              "bg-slate-50 dark:bg-slate-900",
              (uploading || disabled)
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-slate-100 dark:hover:bg-slate-800",
              "transition-all duration-200"
            )}
          >
            <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-700">
              {uploading ? (
                <Loader2 className="h-6 w-6 text-slate-600 dark:text-slate-400 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              )}
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {uploading ? "Uploading..." : "Click to upload an image"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG up to 4MB
              </p>
            </div>
          </label>

          <div className="flex items-center justify-between gap-x-2">
            <Button
              onClick={toggleEdit}
              variant="outline"
              size="sm"
              type="button"
              disabled={uploading || disabled}
              className={cn(
                "h-9 px-4",
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
          </div>
        </div>
      )}
    </div>
  );
};

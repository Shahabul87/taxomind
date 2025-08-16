"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Camera, User } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';

interface ProfileImageUploadProps {
  userId: string;
  initialImage?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onImageUpdate?: (imageUrl: string) => void;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24", 
  lg: "w-32 h-32",
  xl: "w-40 h-40"
};

export const ProfileImageUpload = ({
  userId,
  initialImage,
  className,
  size = "lg",
  onImageUpdate
}: ProfileImageUploadProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialImage);
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      // Upload image
      const uploadResponse = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      
      // Update user profile with new image URL
      const updateResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: uploadData.secure_url })
      });

      if (!updateResponse.ok) {
        throw new Error('Profile update failed');
      }

      setImageUrl(uploadData.secure_url);
      onImageUpdate?.(uploadData.secure_url);
      toast.success("Profile image updated!");
      router.refresh();
    } catch (error: any) {
      logger.error(error);
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Profile Image Display */}
      <div className={cn(
        "relative rounded-full overflow-hidden",
        "border-4 border-white dark:border-gray-800",
        "shadow-xl",
        sizeClasses[size]
      )}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Profile"
            fill
            className="object-cover"
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center",
            "bg-gradient-to-br from-indigo-500 to-purple-600",
            "text-white"
          )}>
            <User className={cn(
              size === "sm" ? "w-6 h-6" : 
              size === "md" ? "w-8 h-8" :
              size === "lg" ? "w-12 h-12" : "w-16 h-16"
            )} />
          </div>
        )}
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Controls */}
      <div className="mt-4 flex justify-center">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => document.getElementById(`profileImageInput-${userId}`)?.click()}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={uploading}
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Select Image
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
            disabled={uploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            {imageUrl ? "Change Photo" : "Add Photo"}
          </Button>
        )}
      </div>

      {/* File Input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id={`profileImageInput-${userId}`}
        disabled={uploading}
      />

      {/* Upload Area (when editing) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4"
          >
            <label
              htmlFor={`profileImageInput-${userId}`}
              className={cn(
                "flex flex-col items-center justify-center gap-4",
                "w-full p-6",
                "border-2 border-dashed rounded-xl",
                "border-indigo-200 dark:border-indigo-500/20",
                "bg-indigo-50/50 dark:bg-indigo-500/5",
                "cursor-pointer",
                "hover:border-indigo-300 dark:hover:border-indigo-500/30",
                "hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
                "transition-all duration-200"
              )}
            >
              <div className="p-4 rounded-full bg-indigo-100/50 dark:bg-indigo-500/10">
                <ImagePlus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Click to upload a profile image
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Maximum file size: 5MB
                </p>
              </div>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 
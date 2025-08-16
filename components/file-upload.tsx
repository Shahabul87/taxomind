"use client";

import { useEffect, useState } from "react";
import { Camera, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value?: string;
  endpoint?: "groupImage" | "groupCover" | "messageFile" | "courseImage";
  children?: React.ReactNode;
}

export const FileUpload = ({
  onChange,
  value,
  endpoint = "groupImage",
  children
}: FileUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
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
        onChange(data.secure_url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload failed");
      }
    } catch (error: any) {
      toast.error("Something went wrong during upload");
      logger.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative">
      {value ? (
        <div className="relative h-full w-full">
          <Image
            fill
            alt="Uploaded image"
            src={value}
            className="object-cover"
          />
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-2 bg-rose-500 text-white p-1 rounded-full shadow-sm"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            disabled={isUploading}
          />
          <div className="w-full flex items-center justify-center">
            {children ? (
              children
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-full bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition">
                <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PNG, JPG, GIF up to 4MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 
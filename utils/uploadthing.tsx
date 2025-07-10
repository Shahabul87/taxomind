"use client";

import React from 'react';
import { UploadCloud } from "lucide-react";

interface UploadButtonProps {
  endpoint: string;
  onClientUploadComplete?: (results: { url: string }[]) => void;
  onUploadError?: (error: Error) => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  endpoint,
  onClientUploadComplete,
  onUploadError
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
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
        onClientUploadComplete?.([{ url: data.secure_url }]);
      } else {
        onUploadError?.(new Error("Upload failed"));
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error : new Error("Upload failed"));
      console.error(error);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-full bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition">
        <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          PNG, JPG, GIF up to 4MB
        </p>
      </div>
    </div>
  );
}; 
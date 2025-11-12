"use client";

import React, { useState } from 'react';
import { UploadCloud, Loader2 } from "lucide-react";

interface UploadButtonProps {
  endpoint: string;
  courseId?: string;
  onClientUploadComplete?: (results: { url: string }[]) => void;
  onUploadError?: (error: Error) => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  endpoint,
  courseId,
  onClientUploadComplete,
  onUploadError
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      onUploadError?.(new Error("File size must be less than 4MB"));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.(new Error("Only image files are allowed"));
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use authenticated API endpoint for secure upload
      const apiUrl = courseId
        ? `/api/courses/${courseId}/image`
        : '/api/upload';

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[UPLOAD_DEBUG] Cloudinary response:', {
          secure_url: data.secure_url,
          url: data.url,
          public_id: data.public_id,
        });
      }

      if (data.secure_url) {
        onClientUploadComplete?.([{ url: data.secure_url }]);
      } else {
        console.error('[UPLOAD_ERROR] No secure_url in response:', data);
        onUploadError?.(new Error("Upload failed - no URL returned"));
      }
    } catch (error: unknown) {
      onUploadError?.(error instanceof Error ? error : new Error("Upload failed"));
      console.error("[UPLOAD_ERROR]", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
      />
      <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-full bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-gray-400 mb-2 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Uploading to Cloudinary...
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              PNG, JPG, GIF up to 4MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}; 
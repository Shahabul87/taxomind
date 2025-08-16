"use client";

import React, { useState, useRef } from 'react';
import { cn } from "@/lib/utils";
import { UploadCloud, X } from "lucide-react";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = "image/*",
  multiple = false,
  maxSize = 4 * 1024 * 1024, // 4MB default
  className
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    setError(null);

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return;
      }
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {accept === "image/*" ? "PNG, JPG, GIF" : "Any file"} up to {maxSize / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
} 
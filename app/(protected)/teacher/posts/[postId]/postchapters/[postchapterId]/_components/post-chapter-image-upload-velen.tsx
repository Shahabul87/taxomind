"use client";

import * as z from "zod";
import axios from "axios";
import { Edit3, Image as ImageIcon, Upload, X, Check, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileUpload } from "@/fileupload/file-upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';

interface UploadedFile {
  publicId: string;
  url: string;
}

interface ImageFormVelenProps {
  initialData: {
    imageUrl: string | null;
  };
  postId: string;
  chapterId: string;
}

const formSchema = z.object({
  imageUrl: z.string().min(1, {
    message: "Image is required",
  }),
});

export const PostChapterImageUploadVelen = ({
  initialData,
  postId,
  chapterId
}: ImageFormVelenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadedFile[] | null>(null);
  const router = useRouter();

  const [formValues, setFormValues] = useState<z.infer<typeof formSchema>>({
    imageUrl: initialData.imageUrl || "",
  });

  useEffect(() => {
    if (uploadResponse) {
      const urls = uploadResponse.map((file) => file.url);
      // Auto-save first URL
      if (urls[0]) {
        setFormValues({ imageUrl: urls[0] });
      }
    }
  }, [uploadResponse]);

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
  };

  const handleCombinedSubmit = async () => {
    if (files.length === 0) {
      toast.error("No files selected", {
        description: "Please select an image to upload"
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        const result = response.data;
        setUploadResponse(result.uploadedFiles);

        const firstImageUrl = result.uploadedFiles.length > 0 ? result.uploadedFiles[0].url : null;

        if (!firstImageUrl) {
          toast.error("Upload failed", {
            description: "Please try again"
          });
          return;
        }

        const updatedValues = {
          ...formValues,
          imageUrl: firstImageUrl,
        };

        await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}`, updatedValues);

        toast.success("Image uploaded successfully", {
          description: "Your chapter cover has been updated",
          icon: <Check className="h-4 w-4" />
        });

        setFiles([]);
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error("Upload failed", {
          description: "Please try again"
        });
      }
    } catch (error: any) {
      logger.error("Error during submission:", error);
      toast.error("Something went wrong", {
        description: "Please try again"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      {!isEditing ? (
        <div className="group">
          {!initialData.imageUrl ? (
            <div className="relative flex flex-col items-center justify-center gap-4 p-8 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 transition-all duration-200 group-hover:border-violet-300 dark:group-hover:border-violet-700">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <ImageIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No cover image yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Upload an image to make your chapter stand out
                </p>
              </div>

              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className={cn(
                  "h-9 px-4 rounded-lg",
                  "bg-violet-500 hover:bg-violet-600",
                  "text-white font-medium",
                  "shadow-sm shadow-violet-500/20",
                  "hover:shadow-md hover:shadow-violet-500/30",
                  "transition-all duration-200"
                )}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <Image
                  alt="Chapter Cover"
                  fill
                  className="object-cover"
                  src={initialData.imageUrl}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className={cn(
                      "opacity-0 group-hover:opacity-100",
                      "h-9 px-4 rounded-lg",
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "hover:bg-white/90 dark:hover:bg-slate-800",
                      "shadow-lg",
                      "transition-all duration-200"
                    )}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              </div>

              {/* Image info */}
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Cover image</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upload area */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Upload Cover Image
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recommended size: 1280x720px • Max file size: 5MB • JPG, PNG, or WebP
              </p>
            </div>

            <FileUpload
              onChange={handleFileUpload}
              className={cn(
                "min-h-[200px] flex flex-col items-center justify-center",
                "p-6 border-2 border-dashed rounded-lg",
                "border-slate-200 dark:border-slate-700",
                "bg-slate-50/50 dark:bg-slate-800/50",
                "hover:bg-slate-100/50 dark:hover:bg-slate-700/50",
                "hover:border-violet-300 dark:hover:border-violet-700",
                "transition-all duration-200"
              )}
            />

            {/* File preview */}
            {files.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                    <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-violet-900 dark:text-violet-100 truncate">
                      {files[0].name}
                    </p>
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                      {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={() => setFiles([])}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 h-8 w-8 p-0 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCombinedSubmit}
              disabled={isSubmitting || files.length === 0}
              size="sm"
              className={cn(
                "h-9 px-4 rounded-lg",
                "bg-violet-500 hover:bg-violet-600",
                "text-white font-medium",
                "shadow-sm shadow-violet-500/20",
                "hover:shadow-md hover:shadow-violet-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Upload & Save
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setFiles([]);
              }}
              disabled={isSubmitting}
              className={cn(
                "h-9 px-4 rounded-lg",
                "text-slate-600 dark:text-slate-400",
                "hover:text-slate-900 dark:hover:text-slate-100",
                "hover:bg-slate-100 dark:hover:bg-slate-800"
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

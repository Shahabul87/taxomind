"use client";

import * as z from "zod";
import axios from "axios";
import { Pencil, Image as ImageIcon, Upload, X, Check } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileUpload } from "@/fileupload/file-upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface UploadedFile {
  publicId: string;
  url: string;
}

interface ImageFormProps {
  initialData: { imageUrl: string | null };
  postId: string;
}

const formSchema = z.object({
  imageUrl: z.string().min(1, {
    message: "Image is required",
  }),
});

export const PostImageUpload = ({ initialData, postId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formValues, setFormValues] = useState<z.infer<typeof formSchema>>({
    imageUrl: initialData.imageUrl || "",
  });

  const toggleEdit = () => setIsEditing((current) => !current);

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
  };

  const handleCombinedSubmit = async () => {
    if (files.length === 0) {
      toast.error("No files selected!");
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

        const firstImageUrl =
          result.uploadedFiles.length > 0 ? result.uploadedFiles[0].url : null;

        if (!firstImageUrl) {
          toast.error("Image upload failed. Please try again.");
          return;
        }

        const updatedValues = {
          ...formValues,
          imageUrl: firstImageUrl,
        };

        await axios.patch(`/api/posts/${postId}`, updatedValues);

        toast.success("Image updated successfully");
        window.dispatchEvent(new CustomEvent("post-saved"));

        setFiles([]);
        toggleEdit();
        router.refresh();
      } else {
        toast.error("Failed to upload files.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Error during submission:", error.response?.data);
        toast.error(error.response?.data?.message || "Upload failed");
      } else {
        logger.error("Unexpected error:", error);
        toast.error("Something went wrong during the submission process.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative",
        "bg-white dark:bg-slate-900/50",
        "border border-slate-200/80 dark:border-slate-800",
        "rounded-xl overflow-hidden",
        "transition-all duration-200",
        isEditing && "ring-2 ring-violet-500/20"
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                "bg-violet-500/10 text-violet-600"
              )}
            >
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Cover Image
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData.imageUrl
                  ? "Click to change image"
                  : "Add a cover image"}
              </p>
            </div>
          </div>

          <Button
            onClick={toggleEdit}
            variant="ghost"
            size="sm"
            className={cn(
              "text-violet-600 hover:text-violet-700",
              "hover:bg-violet-500/10"
            )}
          >
            {isEditing ? (
              <>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {initialData.imageUrl ? "Change" : "Add"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {!isEditing && (
          <>
            {!initialData.imageUrl ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center",
                  "h-48 rounded-xl",
                  "bg-slate-50 dark:bg-slate-800/50",
                  "border-2 border-dashed border-slate-200 dark:border-slate-700"
                )}
              >
                <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No cover image
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click edit to upload one
                </p>
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden group/image">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity z-10" />
                <Image
                  alt="Post Cover"
                  fill
                  className="object-cover"
                  src={initialData.imageUrl}
                />
              </div>
            )}
          </>
        )}

        {isEditing && (
          <div className="space-y-4">
            <div
              className={cn(
                "p-4 rounded-xl",
                "bg-slate-50 dark:bg-slate-800/50",
                "border border-slate-200/80 dark:border-slate-700/50"
              )}
            >
              <FileUpload
                onChange={handleFileUpload}
                className={cn(
                  "min-h-[200px] flex flex-col items-center justify-center p-6",
                  "border-2 border-dashed border-slate-200 dark:border-slate-700",
                  "rounded-xl",
                  "bg-white dark:bg-slate-900/50",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  "transition-colors cursor-pointer"
                )}
              />

              {files.length > 0 && (
                <div
                  className={cn(
                    "mt-4 p-3 rounded-lg",
                    "bg-emerald-500/10 border border-emerald-500/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-600 truncate">
                        {files[0].name}
                      </p>
                      <p className="text-xs text-emerald-600/70">
                        {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleCombinedSubmit}
                  disabled={isSubmitting || files.length === 0}
                  className={cn(
                    "bg-violet-600 hover:bg-violet-700 text-white",
                    "shadow-sm px-6",
                    "disabled:bg-slate-200 dark:disabled:bg-slate-700",
                    "disabled:text-slate-400 dark:disabled:text-slate-500"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

"use client";

import axios from "axios";
import { useState, useRef, useCallback } from "react";
import { File, Loader2, PlusCircle, X, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";

interface AttachmentFormProps {
  initialData: {
    attachments: {
      id: string;
      name: string;
      url: string;
    }[];
  };
  courseId: string;
}

export const AttachmentForm = ({
  initialData,
  courseId,
}: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggleEdit = () => {
    if (!isUploading) {
      setIsEditing((current) => !current);
      setUploadProgress(0);
    }
  };

  const onUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Upload file to Google Drive
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await axios.post<{
        url: string;
        fileId: string;
        name: string;
        mimeType: string;
        size: number;
      }>("/api/upload/google-drive", formData, {
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      // Step 2: Create attachment record in the database
      await axios.post(`/api/courses/${courseId}/attachments`, {
        url: uploadResponse.data.url,
        name: uploadResponse.data.name,
        fileId: uploadResponse.data.fileId,
        fileSize: uploadResponse.data.size,
        mimeType: uploadResponse.data.mimeType,
        storageProvider: "google-drive",
      });

      toast.success("Resource uploaded successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      if (axios.isCancel(error)) {
        toast.info("Upload cancelled");
      } else if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Something went wrong uploading the file");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  }, [courseId, router]);

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`/api/courses/${courseId}/attachments/${id}`);
      toast.success("Attachment deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="space-y-3 sm:space-y-4">
          {/* Attachments List */}
          <div className="space-y-2">
            {initialData.attachments.length === 0 ? (
              <div className="space-y-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No resources added
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-2 sm:px-3 break-words">
                  Add PDF files, documents, or other resources for your students
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {initialData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 sm:p-3",
                      "bg-slate-50 dark:bg-slate-900/50",
                      "border border-slate-200 dark:border-slate-700",
                      "rounded-lg",
                      "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                      "group transition-all",
                      deletingId === attachment.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
                      <div className="p-1.5 sm:p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                        <File className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium truncate break-words min-w-0">
                        {attachment.name}
                      </p>
                    </div>
                    <Button
                      onClick={() => onDelete(attachment.id)}
                      disabled={deletingId === attachment.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0",
                        "text-slate-400 hover:text-red-600 dark:hover:text-red-400",
                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      )}
                    >
                      {deletingId === attachment.id ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add File Button */}
          <div className="flex items-center justify-end">
            <Button
              onClick={toggleEdit}
              variant="outline"
              size="sm"
              className={cn(
                "h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm",
                "bg-white/80 dark:bg-slate-800/80",
                "border-slate-200 dark:border-slate-700",
                "text-slate-700 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "hover:border-purple-300 dark:hover:border-purple-600",
                "hover:text-purple-600 dark:hover:text-purple-400",
                "font-semibold",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md"
              )}
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Add Resource
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-3 sm:space-y-4">
          <div className={cn(
            "p-3 sm:p-4 md:p-6 rounded-lg",
            "bg-slate-50 dark:bg-slate-900",
            "border-2 border-dashed border-slate-300 dark:border-slate-600"
          )}>
            <FileUpload
              onChange={(files) => {
                if (files?.[0]) {
                  onUpload(files);
                }
              }}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-3 sm:mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Uploading to Google Drive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex items-start gap-1.5 sm:gap-2 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed break-words">
                Add PDF files, documents, or other resources for your students. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, PNG, JPG
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              onClick={toggleEdit}
              disabled={isUploading}
              variant="outline"
              size="sm"
              type="button"
              className={cn(
                "h-10 sm:h-9 px-3 sm:px-4 w-full xs:w-auto text-xs sm:text-sm",
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

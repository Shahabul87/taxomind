"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { File, Loader2, PlusCircle, X, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/fileupload/file-upload";
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

const formSchema = z.object({
  url: z.string().min(1),
});

export const AttachmentForm = ({
  initialData,
  courseId,
}: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/attachments`, values);
      toast.success("Course attachment added");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

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
    <div className="space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="space-y-4">
          {/* Attachments List */}
          <div className="space-y-2">
            {initialData.attachments.length === 0 ? (
              <div className="space-y-2 py-3 rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 px-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No resources added
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-3">
                  Add PDF files, documents, or other resources for your students
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {initialData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={cn(
                      "flex items-center justify-between p-3",
                      "bg-slate-50 dark:bg-slate-900/50",
                      "border border-slate-200 dark:border-slate-700",
                      "rounded-lg",
                      "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                      "group transition-all",
                      deletingId === attachment.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                        <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                        {attachment.name}
                      </p>
                    </div>
                    <Button
                      onClick={() => onDelete(attachment.id)}
                      disabled={deletingId === attachment.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 flex-shrink-0",
                        "text-slate-400 hover:text-red-600 dark:hover:text-red-400",
                        "opacity-0 group-hover:opacity-100 transition-opacity"
                      )}
                    >
                      {deletingId === attachment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
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
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4">
          <div className={cn(
            "p-6 rounded-lg",
            "bg-slate-50 dark:bg-slate-900",
            "border-2 border-dashed border-slate-300 dark:border-slate-600"
          )}>
            <FileUpload
              onChange={(files) => {
                if (files?.[0]) {
                  onSubmit({ url: URL.createObjectURL(files[0]) });
                }
              }}
            />
            <div className="flex items-start gap-2 mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Add PDF files, documents, or other resources for your students. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-x-2">
            <Button
              onClick={toggleEdit}
              variant="outline"
              size="sm"
              type="button"
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

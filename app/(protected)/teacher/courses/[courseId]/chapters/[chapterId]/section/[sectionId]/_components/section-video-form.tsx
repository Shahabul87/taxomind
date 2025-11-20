"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Video, Loader2, Youtube, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionYoutubeVideoFormProps {
  initialData: {
    videoUrl: string | null;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

const formSchema = z.object({
  videoUrl: z.string().min(1, {
    message: "Video URL is required",
  }),
});

export const SectionYoutubeVideoForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
}: SectionYoutubeVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: initialData?.videoUrl || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`, values);
      toast.success("Section video updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const getVideoId = (url: string) => {
    try {
      return new URL(url).searchParams.get("v");
    } catch {
      return null;
    }
  };

  const openVideoInNewTab = () => {
    if (initialData.videoUrl) {
      window.open(initialData.videoUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {!isEditing && initialData.videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2.5 sm:space-y-3"
        >
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-3 sm:gap-4">
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              Video URL
            </span>
            <div className="flex items-center gap-2 w-full xs:w-auto">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className={cn(
                  "flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 flex-1 xs:flex-none",
                  "bg-white/80 dark:bg-slate-800/80",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-800",
                  "hover:border-purple-300 dark:hover:border-purple-600",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "font-semibold text-xs sm:text-sm",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md",
                  "backdrop-blur-sm",
                  "justify-center xs:justify-start"
                )}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className={cn(
                  "flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 flex-1 xs:flex-none",
                  "bg-white/80 dark:bg-slate-800/80",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-800",
                  "hover:border-purple-300 dark:hover:border-purple-600",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "font-semibold text-xs sm:text-sm",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md",
                  "backdrop-blur-sm",
                  "justify-center xs:justify-start"
                )}
              >
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Edit
              </Button>
            </div>
          </div>
          
          {/* Clickable URL Link */}
          <button
            onClick={openVideoInNewTab}
            className={cn(
              "w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left",
              "bg-muted/30",
              "border border-border",
              "hover:bg-muted/50",
              "transition-all duration-200 group"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Youtube className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
                  {initialData.videoUrl}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground group-hover:text-red-500 flex-shrink-0 transition-colors" />
            </div>
          </button>
        </motion.div>
      )}

      {!isEditing && !initialData.videoUrl && (
        <div className={cn(
          "flex flex-col items-center justify-center",
          "min-h-[140px] sm:min-h-[160px] p-6 sm:p-8 rounded-lg",
          "bg-muted/20",
          "border-2 border-dashed border-border",
          "transition-all duration-200 hover:border-red-500/30"
        )}>
          <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-2 sm:mb-3">
            <Video className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">
            No video added yet
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-3 sm:mb-4 max-w-[280px] px-2">
            Add a YouTube video to help students learn
          </p>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:h-10 px-3 sm:px-4 shadow-sm text-xs sm:text-sm"
          >
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Add Video URL
          </Button>
        </div>
      )}

      {/* Video Preview */}
      {showPreview && initialData.videoUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className={cn(
            "relative aspect-video rounded-lg overflow-hidden",
            "border border-border",
            "bg-muted/30",
            "shadow-md",
            "w-full"
          )}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${getVideoId(initialData.videoUrl)}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 sm:space-y-4"
        >
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {initialData.videoUrl ? "Edit Video URL" : "Add Video URL"}
            </span>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={cn(
                          "bg-background",
                          "border-border",
                          "text-xs sm:text-sm",
                          "h-10 sm:h-9",
                          "transition-all duration-200",
                          "w-full"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2 sm:gap-x-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                  type="button"
                  className={cn(
                    "h-10 sm:h-9 px-4 w-full xs:w-auto",
                    "bg-white dark:bg-slate-800",
                    "border-slate-300 dark:border-slate-600",
                    "text-slate-700 dark:text-slate-300",
                    "hover:bg-slate-100 dark:hover:bg-slate-700",
                    "hover:text-slate-900 dark:hover:text-slate-100",
                    "hover:border-slate-400 dark:hover:border-slate-500",
                    "font-semibold text-xs sm:text-sm",
                    "transition-all duration-200",
                    "justify-center xs:justify-start"
                  )}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  size="sm"
                  className={cn(
                    "h-10 sm:h-9 px-4 w-full xs:w-auto",
                    "bg-emerald-600 hover:bg-emerald-700 text-white",
                    "font-semibold text-xs sm:text-sm",
                    "justify-center xs:justify-start",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      )}
    </div>
  );
};

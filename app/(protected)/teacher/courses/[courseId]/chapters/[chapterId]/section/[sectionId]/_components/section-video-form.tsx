"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Video, Loader2, YoutubeIcon, Eye, EyeOff, ExternalLink } from "lucide-react";
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
    <div className="space-y-4">
      {!isEditing && initialData.videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Video URL
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 px-4 text-xs font-medium",
                  "bg-red-500/5 dark:bg-red-500/10",
                  "text-red-600 dark:text-red-400",
                  "hover:bg-red-500/10 dark:hover:bg-red-500/20",
                  "border border-red-500/20 dark:border-red-500/30"
                )}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-2" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-2" />
                    Show Preview
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 px-4 text-xs font-medium",
                  "bg-red-500/5 dark:bg-red-500/10",
                  "text-red-600 dark:text-red-400",
                  "hover:bg-red-500/10 dark:hover:bg-red-500/20",
                  "border border-red-500/20 dark:border-red-500/30"
                )}
              >
                <Pencil className="h-3 w-3 mr-2" />
                Edit
              </Button>
            </div>
          </div>
          
          {/* Clickable URL Link */}
          <button
            onClick={openVideoInNewTab}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg text-left",
              "bg-muted/30",
              "border border-border",
              "hover:bg-muted/50",
              "transition-all duration-200 group"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <YoutubeIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
                  {initialData.videoUrl}
                </span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-red-500 flex-shrink-0 ml-2 transition-colors" />
            </div>
          </button>
        </motion.div>
      )}

      {!isEditing && !initialData.videoUrl && (
        <div className={cn(
          "flex flex-col items-center justify-center",
          "min-h-[160px] p-8 rounded-lg",
          "bg-muted/20",
          "border-2 border-dashed border-border",
          "transition-all duration-200 hover:border-red-500/30"
        )}>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
            <Video className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1.5">
            No video added yet
          </p>
          <p className="text-xs text-muted-foreground text-center mb-4 max-w-[280px]">
            Add a YouTube video to help students learn
          </p>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            className={cn(
              "bg-red-600 hover:bg-red-700",
              "text-white text-xs",
              "shadow-sm",
              "h-9 px-4"
            )}
          >
            <Pencil className="h-3 w-3 mr-2" />
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
            "shadow-md"
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
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {initialData.videoUrl ? "Edit Video URL" : "Add Video URL"}
            </span>
            <Button
              onClick={() => setIsEditing(false)}
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-4 text-xs font-medium",
                "bg-muted/50",
                "text-muted-foreground",
                "hover:bg-muted",
                "border border-border"
              )}
            >
              Cancel
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          "text-sm",
                          "h-9",
                          "transition-all duration-200"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  size="sm"
                  className={cn(
                    "flex-1 bg-red-600 hover:bg-red-700",
                    "text-white",
                    "transition-all duration-200 shadow-sm",
                    "h-9 px-4 text-xs font-medium",
                    (!isValid || isSubmitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-3 w-3" />
                      </motion.div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>Save Changes</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      )}
    </div>
  );
};

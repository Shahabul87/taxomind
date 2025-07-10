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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Video URL
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs",
                  "bg-violet-50 dark:bg-violet-900/20",
                  "text-violet-700 dark:text-violet-300",
                  "hover:bg-violet-100 dark:hover:bg-violet-900/40",
                  "border border-violet-200/50 dark:border-violet-700/50"
                )}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Preview
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs",
                  "bg-violet-50 dark:bg-violet-900/20",
                  "text-violet-700 dark:text-violet-300",
                  "hover:bg-violet-100 dark:hover:bg-violet-900/40",
                  "border border-violet-200/50 dark:border-violet-700/50"
                )}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {/* Clickable URL Link */}
          <button
            onClick={openVideoInNewTab}
            className={cn(
              "w-full p-4 rounded-lg text-left",
              "bg-gray-50 dark:bg-gray-900/50",
              "border border-gray-200/50 dark:border-gray-700/50",
              "hover:bg-gray-100 dark:hover:bg-gray-900/70",
              "transition-all duration-200 group"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <YoutubeIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
                  {initialData.videoUrl}
                </span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-violet-500 flex-shrink-0 ml-2" />
            </div>
          </button>
        </motion.div>
      )}

      {!isEditing && !initialData.videoUrl && (
        <div className={cn(
          "flex flex-col items-center justify-center",
          "h-32 p-6 rounded-lg",
          "bg-gray-50 dark:bg-gray-900/50",
          "border-2 border-dashed border-gray-300 dark:border-gray-700",
          "transition-all duration-200 hover:border-violet-300 dark:hover:border-violet-700"
        )}>
          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/50 border border-violet-200/50 dark:border-violet-700/50 mb-3">
            <Video className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            No video added yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
            Add a YouTube video to help students learn
          </p>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            className={cn(
              "bg-violet-600 hover:bg-violet-700",
              "text-white text-xs",
              "shadow-sm"
            )}
          >
            <Pencil className="h-3 w-3 mr-1" />
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
            "border border-gray-200 dark:border-gray-700/50",
            "bg-gray-100 dark:bg-gray-900/50",
            "shadow-sm"
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {initialData.videoUrl ? "Edit Video URL" : "Add Video URL"}
            </span>
            <Button
              onClick={() => setIsEditing(false)}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-600 dark:text-gray-400",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                "border border-gray-200 dark:border-gray-700"
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
                          "bg-white dark:bg-gray-900",
                          "border-gray-200 dark:border-gray-700",
                          "text-gray-900 dark:text-gray-200",
                          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                          "h-10",
                          "transition-all duration-200"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 dark:text-red-400 text-sm" />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  size="sm"
                  className={cn(
                    "flex-1 bg-violet-600 hover:bg-violet-700",
                    "text-white",
                    "transition-all duration-200 shadow-sm",
                    (!isValid || isSubmitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-4 w-4" />
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

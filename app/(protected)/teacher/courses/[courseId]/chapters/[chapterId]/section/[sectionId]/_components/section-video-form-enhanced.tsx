"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { logger } from '@/lib/logger';
import {
  Pencil, Video, Loader2, Youtube, Eye, EyeOff,
  ExternalLink, Brain, Sparkles, Shield, TrendingUp,
  Clock, Users, BookOpen, Star
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface VideoAnalysisData {
  qualityScore: number;
  engagementScore: number;
  accessibilityScore: number;
  duration: string;
  language: string;
  hasSubtitles: boolean;
  hasTranscript: boolean;
  topics: string[];
  complexity: "Beginner" | "Intermediate" | "Advanced";
  estimatedWatchTime: string;
  recommendations: string[];
}

interface SectionYoutubeVideoFormEnhancedProps {
  initialData: {
    videoUrl: string | null;
    videoAnalysis?: VideoAnalysisData | null;
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

export const SectionYoutubeVideoFormEnhanced = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
}: SectionYoutubeVideoFormEnhancedProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<VideoAnalysisData | null>(
    initialData.videoAnalysis || null
  );
  const [showAnalysis, setShowAnalysis] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: initialData?.videoUrl || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const analyzeVideo = useCallback(async (videoUrl: string) => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post("/api/sam/multimedia-analysis", {
        action: "analyze-video",
        data: {
          videoUrl,
          courseId,
          chapterId,
          sectionId,
          contentType: "video",
        },
      });

      if (response.data.success) {
        setAnalysisData(response.data.data);
        toast.success("Video analysis complete!");
        return response.data.data;
      }
    } catch (error: any) {
      toast.error("Failed to analyze video");
      logger.error("Video analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
    return null;
  }, [courseId, chapterId, sectionId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // First analyze the video if it's a new URL
      let videoAnalysis = analysisData;
      if (values.videoUrl !== initialData.videoUrl) {
        videoAnalysis = await analyzeVideo(values.videoUrl);
      }

      // Save video with analysis data
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`,
        {
          ...values,
          videoAnalysis,
        }
      );
      
      toast.success("Section video updated with AI insights");
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

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Content
              {analysisData && (
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Analyzed
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              {analysisData && (
                <Button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 text-xs",
                    "bg-blue-50 dark:bg-blue-900/20",
                    "text-blue-700 dark:text-blue-300",
                    "hover:bg-blue-100 dark:hover:bg-blue-900/40",
                    "border border-blue-200/50 dark:border-blue-700/50"
                  )}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  {showAnalysis ? "Hide" : "Show"} Analysis
                </Button>
              )}
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
                <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">
                  {initialData.videoUrl}
                </span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-violet-500 flex-shrink-0 ml-2" />
            </div>
          </button>

          {/* AI Analysis Results */}
          <AnimatePresence>
            {showAnalysis && analysisData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "p-4 rounded-lg",
                  "bg-gradient-to-br from-blue-50 to-cyan-50",
                  "dark:from-blue-950/30 dark:to-cyan-950/30",
                  "border border-blue-200 dark:border-blue-800"
                )}
              >
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  SAM AI Video Analysis
                </h4>

                {/* Scores Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Quality</span>
                    </div>
                    <p className={cn("font-bold text-lg", getScoreColor(analysisData.qualityScore))}>
                      {Math.round(analysisData.qualityScore * 100)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Engagement</span>
                    </div>
                    <p className={cn("font-bold text-lg", getScoreColor(analysisData.engagementScore))}>
                      {Math.round(analysisData.engagementScore * 100)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Accessibility</span>
                    </div>
                    <p className={cn("font-bold text-lg", getScoreColor(analysisData.accessibilityScore))}>
                      {Math.round(analysisData.accessibilityScore * 100)}%
                    </p>
                  </div>
                </div>

                {/* Video Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="font-medium">{analysisData.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Level:</span>
                      <Badge variant="secondary" className="text-xs">
                        {analysisData.complexity}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Language:</span>
                      <span className="font-medium">{analysisData.language}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Features:</span>
                      <div className="flex gap-1">
                        {analysisData.hasSubtitles && (
                          <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30">CC</Badge>
                        )}
                        {analysisData.hasTranscript && (
                          <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30">Transcript</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                {analysisData.topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Key Topics Covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.topics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisData.recommendations.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      AI Recommendations:
                    </p>
                    <ul className="space-y-1">
                      {analysisData.recommendations.map((rec, index) => (
                        <li key={index} className="text-xs text-green-700 dark:text-green-300">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
            Add a YouTube video with AI analysis
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
          
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  AI-Powered Video Analysis
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  SAM AI will automatically analyze your video for:
                </p>
                <ul className="text-blue-600 dark:text-blue-400 space-y-0.5 ml-3">
                  <li>• Content quality and production value</li>
                  <li>• Student engagement potential</li>
                  <li>• Accessibility features (captions, transcripts)</li>
                  <li>• Key topics and complexity level</li>
                </ul>
              </div>
            </div>
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
                        disabled={isSubmitting || isAnalyzing}
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
                  disabled={!isValid || isSubmitting || isAnalyzing}
                  type="submit"
                  size="sm"
                  className={cn(
                    "flex-1 bg-violet-600 hover:bg-violet-700",
                    "text-white",
                    "transition-all duration-200 shadow-sm",
                    (!isValid || isSubmitting || isAnalyzing) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting || isAnalyzing ? (
                    <div className="flex items-center gap-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                      <span>{isAnalyzing ? "Analyzing..." : "Saving..."}</span>
                    </div>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-1" />
                      Save & Analyze
                    </>
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
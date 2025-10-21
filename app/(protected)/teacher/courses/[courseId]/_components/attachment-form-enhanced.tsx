"use client";

import * as z from "zod";
import axios from "axios";
import { useState, useCallback } from "react";
import { File, Loader2, PlusCircle, X, Sparkles, Brain, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/fileupload/file-upload";
import { cn } from "@/lib/utils";
import { ContentAnalysisResults } from "@/components/sam/content-analysis-results";
import { Badge } from "@/components/ui/badge";

interface AttachmentFormEnhancedProps {
  initialData: {
    attachments: {
      id: string;
      name: string;
      url: string;
      // New fields for AI analysis
      contentType?: string;
      qualityScore?: number;
      accessibilityScore?: number;
      metadata?: any;
    }[];
  };
  courseId: string;
}

const formSchema = z.object({
  url: z.string().min(1),
  name: z.string(),
  metadata: z.any().optional(),
});

export const AttachmentFormEnhanced = ({
  initialData,
  courseId,
}: AttachmentFormEnhancedProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const router = useRouter();

  const analyzeContent = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contentType", file.type);

      // Call Multi-Modal Content Intelligence API
      const response = await axios.post("/api/sam/multimedia-analysis", {
        action: "analyze-content",
        data: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          courseId: courseId,
        },
      });

      if (response.data.success) {
        setAnalysisResults(response.data.data);
        setPendingFile(file);
        toast.success("Content analysis complete!");
      }
    } catch (error: any) {
      toast.error("Failed to analyze content");
      logger.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [courseId]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      const submitData = {
        ...values,
        metadata: analysisResults ? {
          ...analysisResults,
          analyzedAt: new Date().toISOString(),
        } : undefined,
      };

      await axios.post(`/api/courses/${courseId}/attachments`, submitData);
      toast.success("Course attachment added with AI insights");
      setIsEditing(false);
      setAnalysisResults(null);
      setPendingFile(null);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }, [courseId, analysisResults, router]);

  const handleFileSelect = useCallback(async (files: File[] | null) => {
    if (files?.[0]) {
      const file = files[0];
      
      // Check if file type is supported for analysis
      const supportedTypes = [
        "application/pdf",
        "video/mp4",
        "video/webm",
        "audio/mpeg",
        "audio/wav",
        "image/jpeg",
        "image/png",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (supportedTypes.includes(file.type)) {
        await analyzeContent(file);
      } else {
        // Direct upload without analysis for unsupported types
        onSubmit({ 
          url: URL.createObjectURL(file), 
          name: file.name 
        });
      }
    }
  }, [analyzeContent, onSubmit]);

  const handleAcceptAnalysis = () => {
    if (pendingFile) {
      onSubmit({
        url: URL.createObjectURL(pendingFile),
        name: pendingFile.name,
        metadata: analysisResults,
      });
    }
  };

  const handleRejectAnalysis = () => {
    setAnalysisResults(null);
    setPendingFile(null);
    toast.info("Upload cancelled. Please select a different file.");
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

  const getQualityBadge = (score?: number) => {
    if (!score) return null;
    
    if (score >= 0.8) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Shield className="h-3 w-3 mr-1" />
          High Quality
        </Badge>
      );
    } else if (score >= 0.6) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Good Quality
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Low Quality
        </Badge>
      );
    }
  };

  return (
    <div className={cn(
      "p-4 mt-6 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/50",
      "hover:bg-gray-50 dark:hover:bg-gray-800/70",
      "backdrop-blur-sm",
      "transition-all duration-200"
    )}>
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <div className="p-2 w-fit rounded-md bg-blue-50 dark:bg-blue-500/10">
              <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                AI-Enhanced Attachments
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Resources analyzed by SAM AI for quality & accessibility
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="outline"
          size="sm"
          disabled={isAnalyzing}
          className={cn(
            "text-purple-700 dark:text-purple-300",
            "border-purple-200 dark:border-purple-700",
            "hover:text-purple-800 dark:hover:text-purple-200",
            "hover:bg-purple-50 dark:hover:bg-purple-500/10",
            "w-full sm:w-auto",
            "justify-center",
            "transition-all duration-200"
          )}
        >
          {isEditing ? (
            "Cancel"
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add file
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4"
          >
            <div className={cn(
              "p-4 rounded-lg",
              "bg-white dark:bg-gray-900/50",
              "border border-gray-200 dark:border-gray-700/50"
            )}>
              {!isAnalyzing && !analysisResults && (
                <>
                  <FileUpload onChange={handleFileSelect} />
                  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          AI-Powered Content Analysis
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          SAM AI will analyze your content for:
                        </p>
                        <ul className="text-blue-600 dark:text-blue-400 space-y-0.5 ml-3">
                          <li>• Quality and engagement potential</li>
                          <li>• Accessibility compliance (WCAG)</li>
                          <li>• Learning effectiveness metrics</li>
                          <li>• Content recommendations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping">
                      <Brain className="h-12 w-12 text-blue-400 opacity-75" />
                    </div>
                    <Brain className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    SAM AI is analyzing your content...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    This may take a few seconds
                  </p>
                </div>
              )}

              {analysisResults && (
                <ContentAnalysisResults
                  analysis={analysisResults}
                  onAccept={handleAcceptAnalysis}
                  onReject={handleRejectAnalysis}
                  isLoading={false}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 mt-4"
        >
          {initialData.attachments.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
              No attachments yet
            </p>
          )}
          {initialData.attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center p-3 w-full",
                "bg-white/50 dark:bg-gray-900/50",
                "border border-gray-200 dark:border-gray-700/50",
                "rounded-lg",
                "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                "group transition-all",
                deletingId === attachment.id && "opacity-50"
              )}
            >
              <div className="flex items-center gap-x-2 flex-1">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-500/10">
                  <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {attachment.name}
                  </p>
                  {attachment.metadata && (
                    <div className="flex items-center gap-2 mt-1">
                      {getQualityBadge(attachment.qualityScore)}
                      {attachment.accessibilityScore && attachment.accessibilityScore >= 0.8 && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Accessible
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => onDelete(attachment.id)}
                disabled={deletingId === attachment.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "text-gray-700 dark:text-gray-300",
                  "hover:text-red-700 dark:hover:text-red-400"
                )}
              >
                {deletingId === attachment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
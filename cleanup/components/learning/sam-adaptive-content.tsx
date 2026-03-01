"use client";

/**
 * SAM Adaptive Content Component
 *
 * Displays content adapted to the learner's style using SAM AI.
 * Features:
 * - VARK learning style detection
 * - Dynamic content adaptation
 * - Personalized supplementary resources
 * - Embedded knowledge checks
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Eye,
  Headphones,
  BookOpen,
  Hand,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Info,
  Loader2,
  Brain,
  Lightbulb,
  Video,
  FileText,
  Code2,
} from "lucide-react";
import { useSAMAdaptiveContent } from "@sam-ai/react";
import type { AdaptiveLearningStyle } from "@sam-ai/educational";

interface SAMAdaptiveContentProps {
  userId: string;
  content: string;
  contentType?: "text" | "code" | "math" | "mixed";
  topic: string;
  sectionId: string;
  onStyleDetected?: (style: AdaptiveLearningStyle) => void;
}

const styleIcons: Record<AdaptiveLearningStyle, React.ReactNode> = {
  visual: <Eye className="w-4 h-4" />,
  auditory: <Headphones className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  kinesthetic: <Hand className="w-4 h-4" />,
  multimodal: <Sparkles className="w-4 h-4" />,
};

const styleColors: Record<AdaptiveLearningStyle, string> = {
  visual: "from-blue-500 to-cyan-500",
  auditory: "from-purple-500 to-pink-500",
  reading: "from-green-500 to-emerald-500",
  kinesthetic: "from-orange-500 to-red-500",
  multimodal: "from-indigo-500 to-purple-500",
};

const styleDescriptions: Record<AdaptiveLearningStyle, string> = {
  visual: "Learn best through images, diagrams, and visual representations",
  auditory: "Learn best through listening and verbal explanations",
  reading: "Learn best through reading and writing text",
  kinesthetic: "Learn best through hands-on practice and movement",
  multimodal: "Learn effectively through multiple modalities",
};

export function SAMAdaptiveContent({
  userId,
  content,
  contentType = "text",
  topic,
  sectionId,
  onStyleDetected,
}: SAMAdaptiveContentProps) {
  const {
    learnerProfile,
    adaptedContent,
    isLoadingProfile,
    isAdapting,
    styleDetection,
    getProfile,
    detectStyle,
    adaptContent,
    recordInteraction,
    getStyleTips,
  } = useSAMAdaptiveContent({ userId });

  const [activeFormat, setActiveFormat] = useState<string>("adapted");

  // Load profile on mount
  useEffect(() => {
    getProfile();
  }, [getProfile]);

  // Map contentType to valid ContentFormat
  const getContentFormat = (type: string): "text" | "video" | "audio" | "diagram" | "infographic" | "interactive" | "simulation" | "quiz" | "code_example" | "case_study" => {
    switch (type) {
      case "code": return "code_example";
      case "math": return "text";
      case "mixed": return "text";
      default: return "text";
    }
  };

  // Adapt content when profile is available
  useEffect(() => {
    if (learnerProfile && content) {
      adaptContent({
        id: sectionId,
        type: "lesson",
        content,
        topic,
        currentFormat: getContentFormat(contentType),
        concepts: [],
        prerequisites: [],
      });
    }
  }, [learnerProfile, content, contentType, topic, sectionId, adaptContent]);

  // Notify parent when style is detected
  useEffect(() => {
    if (learnerProfile?.primaryStyle) {
      onStyleDetected?.(learnerProfile.primaryStyle);
    }
  }, [learnerProfile?.primaryStyle, onStyleDetected]);

  // Handle style selection
  const handleStyleSelect = useCallback(async (style: AdaptiveLearningStyle) => {
    await detectStyle();
  }, [detectStyle]);

  // Record user interaction with content
  const handleContentInteraction = useCallback((format: string) => {
    setActiveFormat(format);
    recordInteraction({
      contentId: sectionId,
      format: "text",
      timeSpent: 0,
      scrollDepth: 0,
      completed: false,
    });
  }, [sectionId, recordInteraction]);

  // Handle re-adaptation
  const handleReAdapt = useCallback(() => {
    if (content) {
      adaptContent({
        id: sectionId,
        type: "lesson",
        content,
        topic,
        currentFormat: getContentFormat(contentType),
        concepts: [],
        prerequisites: [],
      });
    }
  }, [content, sectionId, topic, contentType, adaptContent]);

  // Loading state
  if (isLoadingProfile) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // No profile - show style detection prompt
  if (!learnerProfile) {
    return (
      <Card className="w-full border-2 border-dashed border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Personalize Your Learning</CardTitle>
          <CardDescription>
            Let SAM AI adapt content to match your learning style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["visual", "auditory", "reading", "kinesthetic"] as AdaptiveLearningStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => handleStyleSelect(style)}
                className={cn(
                  "p-4 rounded-lg border-2 text-center transition-all hover:scale-105",
                  "hover:border-purple-500 hover:shadow-lg"
                )}
              >
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2",
                  `bg-gradient-to-r ${styleColors[style]} text-white`
                )}>
                  {styleIcons[style]}
                </div>
                <p className="font-medium capitalize">{style}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {styleDescriptions[style].split(" ").slice(0, 4).join(" ")}...
                </p>
              </button>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => detectStyle()}
              className="text-muted-foreground"
            >
              Skip - I learn in multiple ways
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryStyle = learnerProfile.primaryStyle as AdaptiveLearningStyle;
  const styleStrength = learnerProfile.confidence || 0.7;

  // Show adapted content
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              `bg-gradient-to-r ${styleColors[primaryStyle]} text-white`
            )}>
              {styleIcons[primaryStyle]}
            </div>
            <div>
              <CardTitle className="text-lg">Adapted for You</CardTitle>
              <CardDescription className="text-sm">
                {primaryStyle.charAt(0).toUpperCase() + primaryStyle.slice(1)} learner
                {learnerProfile.secondaryStyle && ` with ${learnerProfile.secondaryStyle} tendencies`}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReAdapt}>
            <RefreshCw className={cn("w-4 h-4", isAdapting && "animate-spin")} />
          </Button>
        </div>

        {/* Style confidence bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Style match confidence</span>
            <span>{Math.round(styleStrength * 100)}%</span>
          </div>
          <Progress value={styleStrength * 100} className="h-1.5" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAdapting ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-3" />
            <p className="text-muted-foreground">Adapting content to your learning style...</p>
          </div>
        ) : adaptedContent ? (
          <>
            {/* Content format tabs */}
            <Tabs value={activeFormat} onValueChange={handleContentInteraction}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="adapted" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Adapted
                </TabsTrigger>
                <TabsTrigger value="original" className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Original
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="adapted" className="mt-4">
                {/* Adapted content chunks */}
                <div className="space-y-4">
                  {adaptedContent.chunks.map((chunk, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border",
                        chunk.format === "text" && "bg-slate-50 dark:bg-slate-900/50",
                        chunk.format === "diagram" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200",
                        chunk.format === "code_example" && "bg-orange-50 dark:bg-orange-950/20 border-orange-200",
                        chunk.format === "interactive" && "bg-green-50 dark:bg-green-950/20 border-green-200",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        {chunk.format === "diagram" && <Eye className="w-4 h-4" />}
                        {chunk.format === "infographic" && <Eye className="w-4 h-4" />}
                        {chunk.format === "text" && <FileText className="w-4 h-4" />}
                        {chunk.format === "code_example" && <Code2 className="w-4 h-4" />}
                        {chunk.format === "video" && <Video className="w-4 h-4" />}
                        <span className="capitalize">{chunk.format.replace("_", " ")} content</span>
                        {chunk.estimatedTime && (
                          <span className="ml-auto">~{chunk.estimatedTime} min</span>
                        )}
                      </div>
                      <div className="prose dark:prose-invert max-w-none">
                        {chunk.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Knowledge checks */}
                {adaptedContent.knowledgeChecks && adaptedContent.knowledgeChecks.length > 0 && (
                  <Alert className="mt-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-800 dark:text-purple-200">
                      Quick Check
                    </AlertTitle>
                    <AlertDescription className="text-purple-700 dark:text-purple-300">
                      {adaptedContent.knowledgeChecks[0].question}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="original" className="mt-4">
                <div className="prose dark:prose-invert max-w-none p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  {content}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Key Takeaways
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {adaptedContent.keyTakeaways?.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {takeaway}
                      </li>
                    )) || (
                      <li>Content has been adapted to your {primaryStyle} learning style</li>
                    )}
                  </ul>
                </div>

                {/* Style tips */}
                <div className="mt-4 p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Learning Tips for Your Style
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {getStyleTips().slice(0, 3).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

            {/* Supplementary resources */}
            {adaptedContent.supplementaryResources && adaptedContent.supplementaryResources.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Recommended Resources
                </h4>
                <div className="grid gap-2">
                  {adaptedContent.supplementaryResources.slice(0, 3).map((resource, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center",
                        resource.type === "video" && "bg-blue-100 text-blue-600",
                        resource.type === "article" && "bg-green-100 text-green-600",
                        resource.type === "interactive" && "bg-orange-100 text-orange-600",
                        resource.type === "practice" && "bg-purple-100 text-purple-600",
                      )}>
                        {resource.type === "video" && <Video className="w-4 h-4" />}
                        {resource.type === "article" && <FileText className="w-4 h-4" />}
                        {resource.type === "interactive" && <Hand className="w-4 h-4" />}
                        {resource.type === "practice" && <Brain className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{resource.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(resource.relevance * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="w-8 h-8 mx-auto mb-2" />
            <p>No content to adapt. Add some learning material to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

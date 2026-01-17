"use client";

/**
 * AdaptiveContentWidget
 *
 * Dashboard widget for displaying learning style profile and adaptive content preferences.
 * Uses the useSAMAdaptiveContent hook from @sam-ai/react package.
 */

import { useState, useCallback } from "react";
import { useSAMAdaptiveContent } from "@sam-ai/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Ear,
  BookOpen,
  Hand,
  Layers,
  Loader2,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";

interface AdaptiveContentWidgetProps {
  courseId?: string;
  compact?: boolean;
  showTips?: boolean;
  className?: string;
}

const STYLE_ICONS = {
  visual: Eye,
  auditory: Ear,
  reading: BookOpen,
  kinesthetic: Hand,
  multimodal: Layers,
};

const STYLE_COLORS = {
  visual: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  auditory: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  reading: "text-green-500 bg-green-100 dark:bg-green-900/30",
  kinesthetic: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  multimodal: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
};

const STYLE_DESCRIPTIONS = {
  visual: "You learn best through visual content like diagrams, charts, and videos.",
  auditory: "You learn best through listening to explanations and discussions.",
  reading: "You learn best through reading text and taking written notes.",
  kinesthetic: "You learn best through hands-on practice and building projects.",
  multimodal: "You benefit from combining multiple learning approaches.",
};

export function AdaptiveContentWidget({
  courseId,
  compact = false,
  showTips = true,
  className = "",
}: AdaptiveContentWidgetProps) {
  const user = useCurrentUser();
  const [showAllTips, setShowAllTips] = useState(false);

  const {
    learnerProfile,
    isLoadingProfile,
    styleDetection,
    error,
    isStyleDetected,
    getProfile,
    detectStyle,
    getStyleTips,
    clearProfile,
  } = useSAMAdaptiveContent({
    userId: user?.id,
    courseId,
    autoDetectStyle: true,
    onStyleDetected: (result) => {
      console.log("Learning style detected:", result.primaryStyle);
    },
  });

  const handleRefresh = useCallback(async () => {
    clearProfile();
    await detectStyle();
  }, [clearProfile, detectStyle]);

  const handleGetProfile = useCallback(async () => {
    await getProfile();
  }, [getProfile]);

  const tips = getStyleTips();
  const displayTips = showAllTips ? tips : tips.slice(0, 3);

  // Get style info
  const primaryStyle = learnerProfile?.primaryStyle || "multimodal";
  const StyleIcon = STYLE_ICONS[primaryStyle];
  const styleColor = STYLE_COLORS[primaryStyle];
  const styleDescription = STYLE_DESCRIPTIONS[primaryStyle];

  // Calculate style scores for visualization (normalized to 0-1 range)
  const styleScores = learnerProfile?.styleScores
    ? {
        visual: learnerProfile.styleScores.visual / 100,
        auditory: learnerProfile.styleScores.auditory / 100,
        reading: learnerProfile.styleScores.reading / 100,
        kinesthetic: learnerProfile.styleScores.kinesthetic / 100,
      }
    : {
        visual: 0.25,
        auditory: 0.25,
        reading: 0.25,
        kinesthetic: 0.25,
      };

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Learning Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProfile ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting your style...
            </div>
          ) : learnerProfile ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`rounded-full p-1.5 ${styleColor}`}>
                  <StyleIcon className="h-4 w-4" />
                </div>
                <span className="font-medium capitalize">{primaryStyle}</span>
                {learnerProfile.confidence > 0.7 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {Math.round(learnerProfile.confidence * 100)}% confident
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {styleDescription}
              </p>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleGetProfile} className="w-full">
              <Sparkles className="mr-2 h-3 w-3" />
              Detect My Style
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          Adaptive Learning Profile
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-1 h-4 w-4 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>
                  Your learning profile helps SAM AI personalize content to match how you
                  learn best. It&apos;s based on your interactions and learning patterns.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoadingProfile && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-2 text-sm text-muted-foreground">
              Analyzing your learning patterns...
            </p>
          </div>
        )}

        {/* Profile Display */}
        {!isLoadingProfile && learnerProfile && (
          <>
            {/* Primary Style Card */}
            <div className={`rounded-lg border p-4 ${styleColor}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-800">
                  <StyleIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold capitalize">{primaryStyle} Learner</h3>
                    {isStyleDetected && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm opacity-80">{styleDescription}</p>
                </div>
                <Badge variant="secondary">
                  {Math.round((learnerProfile.confidence || 0) * 100)}%
                </Badge>
              </div>
            </div>

            {/* Style Scores */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Learning Style Breakdown</h4>
              {Object.entries(styleScores).map(([style, strength]) => {
                const Icon = STYLE_ICONS[style as keyof typeof STYLE_ICONS];
                const isPrimary = style === primaryStyle;
                return (
                  <div key={style} className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${isPrimary ? "text-indigo-500" : "text-muted-foreground"}`}
                    />
                    <span className="w-24 text-sm capitalize">{style}</span>
                    <Progress
                      value={(strength as number) * 100}
                      className={`flex-1 ${isPrimary ? "[&>div]:bg-indigo-500" : ""}`}
                    />
                    <span className="w-12 text-right text-sm text-muted-foreground">
                      {Math.round((strength as number) * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Style Detection Info */}
            {styleDetection && (
              <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    Style detection confidence:{" "}
                    <span className="font-medium">
                      {Math.round(styleDetection.confidence * 100)}%
                    </span>
                  </p>
                  {styleDetection.secondaryStyle && (
                    <p className="text-xs text-muted-foreground">
                      Secondary style: {styleDetection.secondaryStyle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Learning Tips */}
            {showTips && tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Personalized Learning Tips
                </h4>
                <ul className="space-y-1">
                  {displayTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
                {tips.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllTips(!showAllTips)}
                    className="w-full"
                  >
                    {showAllTips ? "Show Less" : `Show ${tips.length - 3} More Tips`}
                  </Button>
                )}
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoadingProfile}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-analyze Learning Style
            </Button>
          </>
        )}

        {/* No Profile State */}
        {!isLoadingProfile && !learnerProfile && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/30">
              <Sparkles className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="mt-4 font-medium">Discover Your Learning Style</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Let SAM AI analyze how you learn best to personalize your experience.
            </p>
            <Button onClick={handleGetProfile} className="mt-4">
              <Sparkles className="mr-2 h-4 w-4" />
              Detect My Learning Style
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdaptiveContentWidget;

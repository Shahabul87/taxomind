"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Learning Style Types based on VARK model
 * - Visual: Learns best through images, diagrams, charts
 * - Auditory: Learns best through listening, discussions
 * - Reading/Writing: Learns best through reading and writing
 * - Kinesthetic: Learns best through hands-on experience
 */
export type LearningStyleType = "visual" | "auditory" | "reading" | "kinesthetic" | "multimodal";

export interface LearningStyleProfile {
  primaryStyle: LearningStyleType;
  secondaryStyle?: LearningStyleType;
  scores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  preferences: {
    prefersDiagrams: boolean;
    prefersVideos: boolean;
    prefersText: boolean;
    prefersInteractive: boolean;
    prefersDiscussion: boolean;
  };
  recommendations: string[];
  detectedAt: string;
  confidence: number;
}

interface UseLearningStyleOptions {
  /** User ID for fetching learning style */
  userId?: string;
  /** Course ID for context-specific detection */
  courseId?: string;
  /** Minimum number of sections completed before detecting */
  minSectionsCompleted?: number;
  /** Whether to auto-detect when conditions are met */
  autoDetect?: boolean;
  /** Cache duration in milliseconds (default: 7 days) */
  cacheDuration?: number;
}

interface UseLearningStyleReturn {
  /** Detected learning style profile */
  learningStyle: LearningStyleProfile | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Error message if detection failed */
  error: string | null;
  /** Whether style has been detected */
  isDetected: boolean;
  /** Manually trigger detection */
  detectStyle: () => Promise<void>;
  /** Clear cached learning style */
  clearCache: () => void;
  /** Get content recommendations based on style */
  getContentRecommendations: (contentType: string) => string[];
}

const CACHE_KEY_PREFIX = "taxomind-learning-style-";
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hook for detecting and managing user learning styles
 *
 * Connects to SAM AI's learning style detection engine to analyze
 * user behavior patterns and determine optimal content delivery methods.
 *
 * @example
 * ```tsx
 * const { learningStyle, isDetecting, detectStyle } = useLearningStyle({
 *   userId: user.id,
 *   autoDetect: true
 * });
 *
 * if (learningStyle?.primaryStyle === 'visual') {
 *   // Show more diagrams and videos
 * }
 * ```
 */
export function useLearningStyle(options: UseLearningStyleOptions = {}): UseLearningStyleReturn {
  const {
    userId,
    courseId,
    minSectionsCompleted = 3,
    autoDetect = true,
    cacheDuration = DEFAULT_CACHE_DURATION,
  } = options;

  const [learningStyle, setLearningStyle] = useState<LearningStyleProfile | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetected, setIsDetected] = useState(false);

  const cacheKey = userId ? `${CACHE_KEY_PREFIX}${userId}` : null;

  // Load cached learning style on mount
  useEffect(() => {
    if (!cacheKey) return;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { profile, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age < cacheDuration) {
          setLearningStyle(profile);
          setIsDetected(true);
        } else {
          // Cache expired, clear it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error("Error loading cached learning style:", err);
    }
  }, [cacheKey, cacheDuration]);

  // Detect learning style from SAM API
  const detectStyle = useCallback(async () => {
    if (!userId) {
      setError("User ID is required for learning style detection");
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const response = await fetch("/api/sam/ai-tutor/detect-learning-style", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          courseId,
          includeRecommendations: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const profile: LearningStyleProfile = {
          primaryStyle: data.data.primaryStyle ?? "multimodal",
          secondaryStyle: data.data.secondaryStyle,
          scores: {
            visual: data.data.scores?.visual ?? 0,
            auditory: data.data.scores?.auditory ?? 0,
            reading: data.data.scores?.reading ?? 0,
            kinesthetic: data.data.scores?.kinesthetic ?? 0,
          },
          preferences: {
            prefersDiagrams: data.data.preferences?.prefersDiagrams ?? false,
            prefersVideos: data.data.preferences?.prefersVideos ?? false,
            prefersText: data.data.preferences?.prefersText ?? false,
            prefersInteractive: data.data.preferences?.prefersInteractive ?? false,
            prefersDiscussion: data.data.preferences?.prefersDiscussion ?? false,
          },
          recommendations: data.data.recommendations ?? [],
          detectedAt: new Date().toISOString(),
          confidence: data.data.confidence ?? 0.5,
        };

        setLearningStyle(profile);
        setIsDetected(true);

        // Cache the result
        if (cacheKey) {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              profile,
              timestamp: Date.now(),
            })
          );
        }
      } else {
        throw new Error(data.error?.message ?? "Failed to detect learning style");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Learning style detection error:", errorMessage);
      setError(errorMessage);

      // Set default multimodal style on error
      setLearningStyle({
        primaryStyle: "multimodal",
        scores: { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 },
        preferences: {
          prefersDiagrams: true,
          prefersVideos: true,
          prefersText: true,
          prefersInteractive: true,
          prefersDiscussion: true,
        },
        recommendations: [
          "Try different content formats to find what works best for you",
          "Mix videos, text, and interactive exercises",
        ],
        detectedAt: new Date().toISOString(),
        confidence: 0.3,
      });
      setIsDetected(true);
    } finally {
      setIsDetecting(false);
    }
  }, [userId, courseId, cacheKey]);

  // Auto-detect when conditions are met
  useEffect(() => {
    if (!autoDetect || !userId || isDetected || isDetecting) return;

    // Check if user has completed minimum sections
    const checkAndDetect = async () => {
      try {
        const response = await fetch(`/api/user/progress?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const completedSections = data.data?.completedSections ?? 0;

          if (completedSections >= minSectionsCompleted) {
            await detectStyle();
          }
        }
      } catch (err) {
        // Silently fail auto-detection check
        console.debug("Auto-detection check failed:", err);
      }
    };

    // Delay check to avoid immediate API call on mount
    const timer = setTimeout(checkAndDetect, 2000);
    return () => clearTimeout(timer);
  }, [autoDetect, userId, isDetected, isDetecting, minSectionsCompleted, detectStyle]);

  // Clear cached learning style
  const clearCache = useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    setLearningStyle(null);
    setIsDetected(false);
  }, [cacheKey]);

  // Get content recommendations based on learning style
  const getContentRecommendations = useCallback(
    (contentType: string): string[] => {
      if (!learningStyle) {
        return ["Complete a few lessons to get personalized recommendations"];
      }

      const recommendations: string[] = [];
      const { primaryStyle, preferences } = learningStyle;

      switch (primaryStyle) {
        case "visual":
          recommendations.push(
            "Focus on diagrams and visual representations",
            "Use color coding and mind maps for notes",
            "Watch video explanations before reading text"
          );
          break;
        case "auditory":
          recommendations.push(
            "Listen to explanations and discussions",
            "Read content aloud to yourself",
            "Join study groups for verbal exchange"
          );
          break;
        case "reading":
          recommendations.push(
            "Read detailed documentation and articles",
            "Take written notes while learning",
            "Create summaries in your own words"
          );
          break;
        case "kinesthetic":
          recommendations.push(
            "Practice with hands-on exercises immediately",
            "Build projects to apply concepts",
            "Take breaks and move while studying"
          );
          break;
        case "multimodal":
          recommendations.push(
            "Combine multiple learning methods",
            "Switch between videos, text, and practice",
            "Find what works best for each topic"
          );
          break;
      }

      // Add content-specific recommendations
      if (contentType === "video" && !preferences.prefersVideos) {
        recommendations.push("Consider reading the transcript alongside the video");
      }
      if (contentType === "text" && preferences.prefersVideos) {
        recommendations.push("Look for related video content to supplement reading");
      }

      return recommendations;
    },
    [learningStyle]
  );

  return {
    learningStyle,
    isDetecting,
    error,
    isDetected,
    detectStyle,
    clearCache,
    getContentRecommendations,
  };
}

/**
 * Get style-specific content adaptations
 */
export function getStyleAdaptations(style: LearningStyleType): {
  emphasize: string[];
  deemphasize: string[];
  layout: "visual-heavy" | "text-heavy" | "balanced" | "interactive";
} {
  switch (style) {
    case "visual":
      return {
        emphasize: ["diagrams", "charts", "videos", "infographics"],
        deemphasize: ["long-text", "audio-only"],
        layout: "visual-heavy",
      };
    case "auditory":
      return {
        emphasize: ["audio", "videos", "discussions", "verbal-explanations"],
        deemphasize: ["dense-text", "complex-diagrams"],
        layout: "balanced",
      };
    case "reading":
      return {
        emphasize: ["articles", "documentation", "written-notes", "summaries"],
        deemphasize: ["video-heavy", "audio-only"],
        layout: "text-heavy",
      };
    case "kinesthetic":
      return {
        emphasize: ["exercises", "projects", "interactive", "hands-on"],
        deemphasize: ["passive-content", "lecture-style"],
        layout: "interactive",
      };
    case "multimodal":
    default:
      return {
        emphasize: ["variety", "mixed-media", "options"],
        deemphasize: [],
        layout: "balanced",
      };
  }
}

export default useLearningStyle;

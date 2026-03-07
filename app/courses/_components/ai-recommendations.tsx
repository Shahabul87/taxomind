"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  ChevronRight,
  X,
  Clock,
  Users,
  Star,
  Zap,
  RefreshCw,
  Loader2,
  GraduationCap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

// SAM AI Hook for personalized recommendations
import { useRecommendations } from "@sam-ai/react";

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  duration: number;
  difficulty: string;
  category: {
    id: string;
    name: string;
  };
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  matchScore: number; // 0-100 percentage match
  reason: string;
  recommendationType: "personalized" | "similar" | "trending" | "next-step";
  tags: string[];
}

interface RecommendationSection {
  type: "personalized" | "similar" | "trending" | "next-step";
  title: string;
  description: string;
  courses: RecommendedCourse[];
}

interface APIRecommendationResponse {
  success: boolean;
  data: {
    sections: RecommendationSection[];
    generatedAt: string;
    userId: string;
  };
  error?: string;
}

interface AIRecommendationsProps {
  userId?: string;
  currentCourseId?: string;
  userInterests?: string[];
  completedCourses?: string[];
  className?: string;
}

// Type icon mapping
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  personalized: Sparkles,
  "next-step": Target,
  similar: Brain,
  trending: TrendingUp,
};

export function AIRecommendations({
  userId,
  className
}: AIRecommendationsProps) {
  const [activeTab, setActiveTab] = useState("for-you");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // Use ref to prevent infinite loops
  const isFetchingRef = useRef(false);

  // Use SAM AI recommendations hook for learning insights
  const {
    recommendations: samRecommendations,
    isLoading: isSAMLoading,
    refresh: refreshSAMRecommendations,
    context: samContext,
  } = useRecommendations({
    availableTime: 60,
    limit: 10,
    autoFetch: true,
  });

  // Fetch real course recommendations from API
  const fetchRecommendations = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch('/api/sam/courses/recommendations?limit=8&type=all');
      const result: APIRecommendationResponse = await response.json();

      if (result.success && result.data) {
        setSections(result.data.sections);
        setGeneratedAt(result.data.generatedAt);
      } else {
        setError(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error("Error fetching course recommendations:", err);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, fetchRecommendations]);

  const handleDismiss = useCallback((courseId: string) => {
    setDismissedIds(prev => new Set([...prev, courseId]));
    // In production, you'd also call an API to record this dismissal
  }, []);

  const handleRefresh = useCallback(() => {
    refreshSAMRecommendations();
    fetchRecommendations();
  }, [refreshSAMRecommendations, fetchRecommendations]);

  const RecommendationCard = ({ course }: { course: RecommendedCourse }) => {
    const isDismissed = dismissedIds.has(course.id);

    // Ensure image URL uses HTTPS for Next.js Image component
    const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') || '/placeholder.svg';

    if (isDismissed) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full hover:shadow-lg transition-shadow relative group overflow-hidden">
          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40"
            onClick={(e) => {
              e.preventDefault();
              handleDismiss(course.id);
            }}
          >
            <X className="h-4 w-4 text-white" />
          </Button>

          {/* Match Score Badge */}
          {course.matchScore >= 80 && (
            <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Zap className="h-3 w-3 mr-1" />
              {course.matchScore}% Match
            </Badge>
          )}

          <div className="relative h-40 w-full overflow-hidden">
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Tags */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {course.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={cn(
                    "text-xs backdrop-blur-sm",
                    tag === "Hot" && "bg-orange-500/90 text-white",
                    tag === "Trending" && "bg-blue-500/90 text-white",
                    tag === "Top Rated" && "bg-amber-500/90 text-white",
                    tag === "Level Up" && "bg-green-500/90 text-white"
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Category Badge */}
            {course.category?.name && (
              <div className="absolute top-2 right-12 z-10">
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-xs">
                  {course.category.name}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <h4 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h4>

            {/* Instructor */}
            {course.instructor?.name && (
              <div className="flex items-center gap-2 mb-2">
                {course.instructor.avatar ? (
                  <div className="relative w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {course.instructor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {course.instructor.name}
                </span>
              </div>
            )}

            {/* Reason for recommendation */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 italic line-clamp-1 cursor-help">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {course.reason}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{course.reason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{course.rating.toFixed(1)}</span>
                {course.reviewsCount > 0 && (
                  <span className="text-gray-400">({course.reviewsCount})</span>
                )}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{course.enrolledCount.toLocaleString()}</span>
              </div>
              {course.duration > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.duration}h</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                {course.originalPrice && course.originalPrice > course.price ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">{formatPrice(course.price)}</span>
                    <span className="text-xs line-through text-muted-foreground">
                      {formatPrice(course.originalPrice)}
                    </span>
                  </div>
                ) : course.price === 0 ? (
                  <span className="font-bold text-green-600">Free</span>
                ) : (
                  <span className="font-bold">{formatPrice(course.price)}</span>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                {course.difficulty}
              </Badge>
            </div>

            <Link href={`/courses/${course.id}`}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" size="sm">
                View Course
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Loading state
  if (isLoading && sections.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && sections.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchRecommendations()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (no recommendations)
  if (sections.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Your Recommendations Are Building
            </h3>
            <p className="text-muted-foreground mb-4">
              As you browse and interact with courses, our AI will learn your preferences and suggest the best matches for your learning goals.
            </p>
            <Button onClick={() => fetchRecommendations()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get icon for section type
  const getSectionIcon = (type: string) => {
    const Icon = TYPE_ICONS[type] || Sparkles;
    return Icon;
  };

  // Helper to get icon color for section type
  const getIconColor = (type: string) => {
    switch (type) {
      case "personalized":
        return "text-purple-500";
      case "next-step":
        return "text-green-500";
      case "trending":
        return "text-orange-500";
      case "similar":
        return "text-blue-500";
      default:
        return "text-purple-500";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">AI-Powered Recommendations</h2>
            <p className="text-sm text-muted-foreground">
              Personalized courses based on your learning journey
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* SAM AI Status */}
      {generatedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-800">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span>
            SAM AI recommendations generated{" "}
            {new Date(generatedAt).toLocaleTimeString()}
          </span>
          {samContext && (
            <>
              <span>•</span>
              <span>
                Available time: {samContext.availableTime}min
              </span>
            </>
          )}
          <span>•</span>
          <span className="text-purple-600 dark:text-purple-400">
            {sections.reduce((sum, s) => sum + s.courses.length, 0)} courses recommended
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="for-you" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">For You</span>
          </TabsTrigger>
          <TabsTrigger value="next-steps" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Next Steps</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trending</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="space-y-8 mt-6">
          {sections
            .filter((section) => section.type === "personalized" || section.type === "similar")
            .map((section) => {
              const Icon = getSectionIcon(section.type);
              const iconColor = getIconColor(section.type);
              return (
                <div key={section.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("h-5 w-5", iconColor)} />
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {section.courses.length} courses
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {section.courses.map((course) => (
                        <RecommendationCard key={course.id} course={course} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          {sections.filter((s) => s.type === "personalized" || s.type === "similar").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Browse and enroll in courses to unlock personalized recommendations tailored to your learning goals</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="next-steps" className="space-y-8 mt-6">
          {sections
            .filter((section) => section.type === "next-step")
            .map((section) => {
              const Icon = getSectionIcon(section.type);
              const iconColor = getIconColor(section.type);
              return (
                <div key={section.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("h-5 w-5", iconColor)} />
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {section.courses.length} courses
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {section.courses.map((course) => (
                        <RecommendationCard key={course.id} course={course} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          {sections.filter((s) => s.type === "next-step").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Complete courses to unlock next-step recommendations that build on what you&apos;ve learned</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-8 mt-6">
          {sections
            .filter((section) => section.type === "trending")
            .map((section) => {
              const Icon = getSectionIcon(section.type);
              const iconColor = getIconColor(section.type);
              return (
                <div key={section.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("h-5 w-5", iconColor)} />
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {section.courses.length} courses
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {section.courses.map((course) => (
                        <RecommendationCard key={course.id} course={course} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          {sections.filter((s) => s.type === "trending").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No trending courses available right now</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  Clock,
  Users,
  Star,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating: number;
  enrolledCount: number;
  duration: number;
  difficulty: string;
  instructor: {
    name: string;
    avatar?: string;
  };
  matchScore: number; // 0-100 percentage match
  reason: string;
  tags: string[];
}

interface RecommendationSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "similar" | "next-step" | "popular" | "personalized" | "trending";
  courses: RecommendedCourse[];
}

interface AIRecommendationsProps {
  userId?: string;
  currentCourseId?: string;
  userInterests?: string[];
  completedCourses?: string[];
  className?: string;
}

export function AIRecommendations({
  userId,
  currentCourseId,
  userInterests = [],
  completedCourses = [],
  className
}: AIRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [activeTab, setActiveTab] = useState("for-you");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this would call your recommendation API
      // const response = await fetch(`/api/courses/recommendations?userId=${userId}`);
      // const data = await response.json();

      // Mock data for demonstration
      const mockRecommendations: RecommendationSection[] = [
        {
          title: "Recommended for You",
          description: "Based on your learning history and interests",
          icon: Sparkles,
          type: "personalized",
          courses: generateMockCourses(4, "personalized")
        },
        {
          title: "Next Steps in Your Journey",
          description: "Continue building on what you&apos;ve learned",
          icon: Target,
          type: "next-step",
          courses: generateMockCourses(3, "next-step")
        },
        {
          title: "Similar Courses",
          description: "Courses similar to what you&apos;re currently learning",
          icon: Brain,
          type: "similar",
          courses: generateMockCourses(4, "similar")
        },
        {
          title: "Trending Now",
          description: "Popular courses other learners are taking",
          icon: TrendingUp,
          type: "trending",
          courses: generateMockCourses(4, "trending")
        }
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleDismiss = (courseId: string) => {
    setDismissedIds(new Set([...dismissedIds, courseId]));
    // In production, you'd also call an API to record this dismissal
  };

  const generateMockCourses = (count: number, type: string): RecommendedCourse[] => {
    const courses: RecommendedCourse[] = [];
    const reasons = {
      personalized: [
        "Matches your interest in web development",
        "Based on your previous React courses",
        "Recommended for your skill level",
        "Popular among similar learners"
      ],
      "next-step": [
        "Natural progression from your last course",
        "Builds on your existing knowledge",
        "Completes your learning path",
        "Advanced concepts you&apos;re ready for"
      ],
      similar: [
        "Similar to courses you&apos;ve enjoyed",
        "Same instructor as your favorite course",
        "Covers related topics",
        "Similar teaching style"
      ],
      trending: [
        "Trending in your field",
        "High enrollment this week",
        "Recently updated content",
        "Industry demanded skills"
      ]
    };

    for (let i = 0; i < count; i++) {
      courses.push({
        id: `${type}-${i}`,
        title: `${type === "next-step" ? "Advanced" : type === "similar" ? "Alternative" : "Popular"} ${["React", "Node.js", "Python", "Data Science"][i % 4]} Course`,
        description: "Master advanced concepts and build real-world projects with industry best practices.",
        imageUrl: `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect fill="${["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"][i % 4]}" width="400" height="225"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="20" font-family="Arial">Course ${i + 1}</text></svg>`)}`,
        price: Math.floor(Math.random() * 100) + 50,
        originalPrice: Math.floor(Math.random() * 50) + 150,
        rating: 4 + Math.random(),
        enrolledCount: Math.floor(Math.random() * 5000) + 1000,
        duration: Math.floor(Math.random() * 20) + 5,
        difficulty: ["Beginner", "Intermediate", "Advanced"][Math.floor(Math.random() * 3)],
        instructor: {
          name: ["Dr. Sarah Johnson", "Prof. Michael Chen", "Emma Wilson", "John Davis"][i % 4],
          avatar: undefined
        },
        matchScore: Math.floor(Math.random() * 30) + 70,
        reason: reasons[type as keyof typeof reasons][i % 4],
        tags: ["Bestseller", "Updated", "Hot", "New"].slice(0, Math.floor(Math.random() * 2) + 1)
      });
    }

    return courses;
  };

  const RecommendationCard = ({ course, type }: { course: RecommendedCourse; type: string }) => {
    const isDismissed = dismissedIds.has(course.id);

    // Ensure image URL uses HTTPS for Next.js Image component
    const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') || null;

    if (isDismissed) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full hover:shadow-lg transition-shadow relative group">
          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDismiss(course.id)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Match Score Badge */}
          {course.matchScore >= 80 && (
            <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500">
              <Zap className="h-3 w-3 mr-1" />
              {course.matchScore}% Match
            </Badge>
          )}

          {secureImageUrl && (
            <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
              <Image
                src={secureImageUrl}
                alt={course.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Tags */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <CardContent className="p-4">
            <h4 className="font-semibold text-base mb-1 line-clamp-2">{course.title}</h4>

            {/* Reason for recommendation */}
            <p className="text-xs text-muted-foreground mb-2 italic">
              {course.reason}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{course.rating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{course.enrolledCount.toLocaleString()}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{course.duration}h</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                {course.originalPrice && course.originalPrice > course.price ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatPrice(course.price)}</span>
                    <span className="text-xs line-through text-muted-foreground">
                      {formatPrice(course.originalPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold">{formatPrice(course.price)}</span>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {course.difficulty}
              </Badge>
            </div>

            <Link href={`/courses/${course.id}`}>
              <Button className="w-full" size="sm">
                View Course
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
            <p className="text-sm text-muted-foreground">
              Personalized courses based on your learning journey
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchRecommendations}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="space-y-6 mt-6">
          {recommendations
            .filter((section) => section.type === "personalized" || section.type === "similar")
            .map((section) => (
              <div key={section.type}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {section.courses.map((course) => (
                      <RecommendationCard
                        key={course.id}
                        course={course}
                        type={section.type}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="next-steps" className="space-y-6 mt-6">
          {recommendations
            .filter((section) => section.type === "next-step")
            .map((section) => (
              <div key={section.type}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {section.courses.map((course) => (
                      <RecommendationCard
                        key={course.id}
                        course={course}
                        type={section.type}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6 mt-6">
          {recommendations
            .filter((section) => section.type === "trending" || section.type === "popular")
            .map((section) => (
              <div key={section.type}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {section.courses.map((course) => (
                      <RecommendationCard
                        key={course.id}
                        course={course}
                        type={section.type}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
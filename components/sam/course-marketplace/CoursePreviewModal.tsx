"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Clock,
  BookOpen,
  Users,
  Award,
  Play,
  CheckCircle2,
  Globe,
  Calendar,
  BarChart3,
  Heart,
  Share2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

/**
 * Course data structure for preview
 */
export interface MarketplaceCourse {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category: {
    id: string;
    name: string;
  };
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    coursesCount?: number;
    studentsCount?: number;
  };
  chaptersCount: number;
  lessonsCount: number;
  duration: number; // in minutes
  difficulty: string;
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  completionRate?: number;
  hasCertificate: boolean;
  hasExercises: boolean;
  badges: ("New" | "Popular" | "Top Rated" | "Bestseller")[];
  isEnrolled: boolean;
  isWishlisted: boolean;
  lastUpdated: Date | string;
  language?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  curriculum?: {
    title: string;
    lessons: number;
    duration: number;
    isFree?: boolean;
  }[];
}

export interface CoursePreviewModalProps {
  course: MarketplaceCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnroll?: (courseId: string) => void;
  onWishlist?: (courseId: string) => void;
  onShare?: (courseId: string) => void;
  className?: string;
}

/**
 * CoursePreviewModal Component
 *
 * A detailed course preview modal with curriculum, instructor info, and enrollment options.
 */
export function CoursePreviewModal({
  course,
  open,
  onOpenChange,
  onEnroll,
  onWishlist,
  onShare,
  className,
}: CoursePreviewModalProps) {
  if (!course) return null;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : star <= rating
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
            )}
          />
        ))}
      </div>
    );
  };

  const discount = course.originalPrice
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden p-0",
          className
        )}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header with Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
              {course.imageUrl && (
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <DialogHeader className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {course.category.name}
                      </Badge>
                      {course.badges.map((badge) => (
                        <Badge
                          key={badge}
                          className={cn(
                            "border-0",
                            badge === "Bestseller" && "bg-amber-500 text-white",
                            badge === "New" && "bg-emerald-500 text-white",
                            badge === "Popular" && "bg-blue-500 text-white",
                            badge === "Top Rated" && "bg-purple-500 text-white"
                          )}
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <DialogTitle className="text-2xl font-bold text-white mb-1">
                      {course.title}
                    </DialogTitle>
                    {course.subtitle && (
                      <p className="text-white/80 text-sm line-clamp-1">
                        {course.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
                {/* Main Content */}
                <div className="lg:col-span-2 border-r border-slate-200 dark:border-slate-700">
                  <ScrollArea className="h-[calc(90vh-12rem)]">
                    <Tabs defaultValue="overview" className="p-6">
                      <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                        <TabsTrigger value="instructor">Instructor</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                              {renderStars(course.rating)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {course.rating.toFixed(1)} ({course.reviewsCount} reviews)
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                              <Users className="h-5 w-5" />
                              <span className="font-semibold">{course.enrolledCount.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Students</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                              <Clock className="h-5 w-5" />
                              <span className="font-semibold">{formatDuration(course.duration)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                              <BookOpen className="h-5 w-5" />
                              <span className="font-semibold">{course.lessonsCount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Lessons</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h3 className="font-semibold mb-2">About this course</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        {/* What You&apos;ll Learn */}
                        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-amber-500" />
                              What you&apos;ll learn
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {course.whatYouWillLearn.slice(0, 6).map((item, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Requirements */}
                        {course.requirements && course.requirements.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Requirements</h3>
                            <ul className="space-y-1">
                              {course.requirements.map((req, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Course Features */}
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {course.difficulty}
                          </Badge>
                          {course.hasCertificate && (
                            <Badge variant="outline" className="gap-1">
                              <Award className="h-3 w-3" />
                              Certificate
                            </Badge>
                          )}
                          {course.hasExercises && (
                            <Badge variant="outline" className="gap-1">
                              <Play className="h-3 w-3" />
                              Practice Exercises
                            </Badge>
                          )}
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            {course.language || "English"}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            Updated {new Date(course.lastUpdated).toLocaleDateString()}
                          </Badge>
                        </div>
                      </TabsContent>

                      <TabsContent value="curriculum" className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Course Curriculum</h3>
                          <span className="text-sm text-muted-foreground">
                            {course.chaptersCount} chapters • {course.lessonsCount} lessons • {formatDuration(course.duration)}
                          </span>
                        </div>

                        {course.curriculum && course.curriculum.length > 0 ? (
                          <div className="space-y-2">
                            {course.curriculum.map((chapter, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{chapter.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {chapter.lessons} lessons • {formatDuration(chapter.duration)}
                                    </p>
                                  </div>
                                </div>
                                {chapter.isFree && (
                                  <Badge variant="secondary" className="text-xs">
                                    Free Preview
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Curriculum details will be available soon</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="instructor" className="space-y-4">
                        {course.instructor ? (
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={course.instructor.avatar} />
                                <AvatarFallback>
                                  {course.instructor.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{course.instructor.name}</h3>
                                {course.instructor.bio && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {course.instructor.bio}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  {course.instructor.coursesCount !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="h-4 w-4" />
                                      {course.instructor.coursesCount} courses
                                    </span>
                                  )}
                                  {course.instructor.studentsCount !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {course.instructor.studentsCount.toLocaleString()} students
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Instructor information not available</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </ScrollArea>
                </div>

                {/* Sidebar - Price & Actions */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="sticky top-6 space-y-4">
                    {/* Price */}
                    <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
                      {course.price === 0 ? (
                        <div className="text-3xl font-bold text-emerald-600">Free</div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold">
                              {formatPrice(course.price)}
                            </span>
                            {course.originalPrice && course.originalPrice > course.price && (
                              <span className="text-lg text-muted-foreground line-through">
                                {formatPrice(course.originalPrice)}
                              </span>
                            )}
                          </div>
                          {discount > 0 && (
                            <Badge className="mt-2 bg-red-500 text-white">
                              {discount}% OFF
                            </Badge>
                          )}
                        </>
                      )}
                    </div>

                    {/* Enrollment Progress */}
                    {course.isEnrolled && course.completionRate !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Your Progress</span>
                          <span className="font-medium">{course.completionRate}%</span>
                        </div>
                        <Progress value={course.completionRate} className="h-2" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      {course.isEnrolled ? (
                        <Button className="w-full gap-2" size="lg">
                          <Play className="h-4 w-4" />
                          Continue Learning
                        </Button>
                      ) : (
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          onClick={() => onEnroll?.(course.id)}
                        >
                          {course.price === 0 ? (
                            <>
                              <Play className="h-4 w-4" />
                              Enroll for Free
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Enroll Now
                            </>
                          )}
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => onWishlist?.(course.id)}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              course.isWishlisted && "fill-red-500 text-red-500"
                            )}
                          />
                          {course.isWishlisted ? "Saved" : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => onShare?.(course.id)}
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Difficulty</span>
                        <Badge variant="outline">{course.difficulty}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{formatDuration(course.duration)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Chapters</span>
                        <span className="font-medium">{course.chaptersCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Lessons</span>
                        <span className="font-medium">{course.lessonsCount}</span>
                      </div>
                      {course.hasCertificate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Certificate</span>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

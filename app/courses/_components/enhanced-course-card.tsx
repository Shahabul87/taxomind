"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Award,
  Play,
  Heart,
  Eye,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  User
} from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { formatPrice } from "@/lib/format";
import { CourseProgress } from "@/components/course-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstructorInfo {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  studentCount?: number;
}

interface EnhancedCourseCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  previewVideo?: string;
  chaptersLength: number;
  lessonsCount?: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  progress?: number | null;
  category: string;
  subCategory?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  duration?: number; // in minutes
  enrolledCount?: number;
  rating?: number;
  reviewsCount?: number;
  completionRate?: number;
  instructor?: InstructorInfo;
  hasCertificate?: boolean;
  hasSubtitles?: boolean;
  hasExercises?: boolean;
  isEnrolled?: boolean;
  isWishlisted?: boolean;
  lastUpdated?: Date;
  badges?: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured">;
  viewMode?: "grid" | "list" | "compact" | "card";
  onQuickPreview?: () => void;
  onAddToWishlist?: () => void;
  onEnroll?: () => void;
}

export const EnhancedCourseCard = ({
  id,
  title,
  description,
  imageUrl,
  previewVideo,
  chaptersLength,
  lessonsCount = 0,
  price,
  originalPrice,
  discount,
  progress,
  category,
  subCategory,
  difficulty = "Beginner",
  duration = 0,
  enrolledCount = 0,
  rating = 0,
  reviewsCount = 0,
  completionRate = 0,
  instructor,
  hasCertificate,
  hasSubtitles,
  hasExercises,
  isEnrolled,
  isWishlisted,
  lastUpdated,
  badges = [],
  viewMode = "grid",
  onQuickPreview,
  onAddToWishlist,
  onEnroll,
}: EnhancedCourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Ensure image URLs use HTTPS for Next.js Image component
  const secureImageUrl = imageUrl?.replace(/^http:\/\//i, 'https://') || '/default-course.jpg';
  const secureInstructorAvatar = instructor?.avatar?.replace(/^http:\/\//i, 'https://');

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Advanced":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Expert":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
            )}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
        {reviewsCount > 0 && (
          <span className="text-sm text-muted-foreground">({reviewsCount})</span>
        )}
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <div className="group flex gap-4 p-4 border rounded-lg hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900">
        {/* Image Section */}
        <div className="relative w-64 h-48 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            alt={title}
            src={secureImageUrl}
          />
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {badges.map((badge) => (
                <Badge key={badge} variant="default" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
          {discount && discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/courses/${id}`}>
                  <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors line-clamp-1">
                    {title}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    onQuickPreview?.();
                  }}
                  aria-label="Quick preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddToWishlist?.();
                  }}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-muted-foreground">{category}</span>
              {subCategory && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{subCategory}</span>
                </>
              )}
              <Badge className={getDifficultyColor(difficulty)} variant="outline">
                {difficulty}
              </Badge>
            </div>

            {instructor && (
              <div className="flex items-center gap-2 mt-3">
                {secureInstructorAvatar && (
                  <Image
                    src={secureInstructorAvatar}
                    alt={instructor.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-muted-foreground">by {instructor.name}</span>
              </div>
            )}

            <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{chaptersLength} chapters</span>
              </div>
              {lessonsCount > 0 && (
                <div className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  <span>{lessonsCount} lessons</span>
                </div>
              )}
              {duration > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}
              {enrolledCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{enrolledCount.toLocaleString()} students</span>
                </div>
              )}
            </div>

            {rating > 0 && <div className="mt-3">{renderRatingStars(rating)}</div>}
          </div>

          <div className="flex items-center justify-between mt-4">
            {isEnrolled ? (
              <div className="flex-1 max-w-xs">
                {progress !== null && progress !== undefined && (
                  <CourseProgress
                    variant={progress === 100 ? "success" : "default"}
                    size="sm"
                    value={progress}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {originalPrice && originalPrice > price ? (
                  <>
                    <span className="text-2xl font-bold">{formatPrice(price)}</span>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold">{formatPrice(price)}</span>
                )}
              </div>
            )}

            <Link href={`/courses/${id}`}>
              <Button variant={isEnrolled ? "outline" : "default"}>
                {isEnrolled ? "Continue Learning" : "View Course"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div
      className="group relative flex flex-col h-full border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPlaying(false);
      }}
    >
      {/* Image/Video Section */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        {isHovered && previewVideo && isPlaying ? (
          <video
            src={previewVideo}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            alt={title}
            src={secureImageUrl}
          />
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1 z-10">
            {badges.map((badge) => (
              <Badge key={badge} variant="default" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Discount Badge */}
        {discount && discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white z-10">
            -{discount}%
          </Badge>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 z-20">
            {previewVideo && (
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  setIsPlaying(!isPlaying);
                }}
                aria-label={isPlaying ? "Pause preview" : "Play preview"}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                onQuickPreview?.();
              }}
              aria-label="Quick preview course"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                onAddToWishlist?.();
              }}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & Difficulty */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{category}</span>
          <Badge className={cn("text-xs", getDifficultyColor(difficulty))} variant="outline">
            {difficulty}
          </Badge>
        </div>

        {/* Title */}
        <Link href={`/courses/${id}`}>
          <h3 className="font-semibold text-base hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>

        {/* Instructor */}
        {instructor && (
          <div className="flex items-center gap-2 mb-3">
            {secureInstructorAvatar && (
              <Image
                src={secureInstructorAvatar}
                alt={instructor.name}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span className="text-xs text-muted-foreground">{instructor.name}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>{chaptersLength}</span>
          </div>
          {duration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
          {enrolledCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{enrolledCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {rating > 0 && <div className="mb-3">{renderRatingStars(rating)}</div>}

        {/* Features */}
        <div className="flex gap-2 mb-3">
          {hasCertificate && (
            <Badge variant="secondary" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              Certificate
            </Badge>
          )}
          {hasExercises && (
            <Badge variant="secondary" className="text-xs">
              Exercises
            </Badge>
          )}
        </div>

        {/* Progress or Price */}
        <div className="mt-auto">
          {isEnrolled ? (
            progress !== null && progress !== undefined && (
              <CourseProgress
                variant={progress === 100 ? "success" : "default"}
                size="sm"
                value={progress}
              />
            )
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {originalPrice && originalPrice > price ? (
                  <>
                    <span className="text-lg font-bold">{formatPrice(price)}</span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold">{formatPrice(price)}</span>
                )}
              </div>
              {completionRate > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{completionRate}% complete</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
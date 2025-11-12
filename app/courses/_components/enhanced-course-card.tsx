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

  // Grid View (Default) - Redesigned to match /my-courses card
  const getBadgeStyle = () => {
    if (badges.includes("New")) {
      return {
        text: "New",
        bg: "bg-gradient-to-r from-emerald-500 to-emerald-600",
        borderColor: "border-emerald-400/50",
      };
    } else if (badges.includes("Bestseller")) {
      return {
        text: "Bestseller",
        bg: "bg-gradient-to-r from-amber-500 to-orange-500",
        borderColor: "border-amber-400/50",
      };
    } else if (badges.includes("Hot")) {
      return {
        text: "Hot",
        bg: "bg-gradient-to-r from-red-500 to-pink-500",
        borderColor: "border-red-400/50",
      };
    }
    return null;
  };

  const badgeStyle = getBadgeStyle();

  return (
    <Link
      href={`/courses/${id}`}
      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400/50 dark:hover:border-blue-500/50 cursor-pointer"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none z-10"></div>

      {/* Course Image with Enhanced Overlay */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden">
        <Image
          src={secureImageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Top Badges Row */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 z-20">
          {/* Status Badge */}
          {badgeStyle && (
            <div
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-md shadow-md border flex items-center gap-1",
                badgeStyle.bg,
                badgeStyle.borderColor
              )}
            >
              <span className="drop-shadow-sm">{badgeStyle.text}</span>
            </div>
          )}

          {/* Price Badge */}
          <div className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-600/95 text-white backdrop-blur-md border border-blue-400/50 shadow-md">
            {formatPrice(price)}
          </div>
        </div>

        {/* Category Badge (Bottom Left of Image) */}
        {category && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-md z-20">
            {category}
          </div>
        )}

        {/* Bottom Info on Image */}
        <div className="absolute bottom-2 left-2 right-2 z-20">
          {/* Title on Image */}
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-lg mb-2">
            {title}
          </h3>

          {/* Quick Stats on Image */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              <span className="text-white text-xs font-bold">
                {rating > 0 ? rating.toFixed(1) : "0.0"}
              </span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Users className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">{enrolledCount}</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <BookOpen className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">{chaptersLength}</span>
            </div>
          </div>
        </div>

        {/* Play/Continue Button Overlay - Enhanced */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 bg-slate-900/20">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
              <Play className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Content - Compact */}
      <div className="flex flex-col flex-1 p-3 relative z-20">
        {/* Instructor Info - Compact */}
        {instructor && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-blue-500/50 dark:ring-blue-400/50 shadow-sm flex-shrink-0">
              {secureInstructorAvatar ? (
                <Image
                  src={secureInstructorAvatar}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {instructor.name ? instructor.name[0] : "?"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Instructor
              </p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {instructor.name}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
          {description}
        </p>

        {/* Difficulty Badge */}
        {difficulty && (
          <div className="mb-3">
            <Badge className={cn("text-xs", getDifficultyColor(difficulty))} variant="outline">
              {difficulty}
            </Badge>
          </div>
        )}

        {/* Progress Bar (for enrolled courses) - Compact */}
        {isEnrolled && progress !== null && progress !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Progress
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Stats Row */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 gap-1">
          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {enrolledCount}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {chaptersLength}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {rating > 0 ? rating.toFixed(1) : "0.0"}
            </span>
          </div>

          {hasCertificate && (
            <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-900 dark:text-white">Cert</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
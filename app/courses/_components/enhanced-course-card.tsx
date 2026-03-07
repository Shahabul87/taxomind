"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Award,
  Play,
  Heart,
  Eye,
  User
} from "lucide-react";

import { formatPrice } from "@/lib/format";
import { CourseProgress } from "@/components/course-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureHttpsUrl, getFallbackImageUrl } from "@/lib/cloudinary-utils";

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
  instructor,
  hasCertificate,
  isEnrolled,
  isWishlisted,
  badges = [],
  viewMode = "grid",
  onQuickPreview,
  onAddToWishlist,
}: EnhancedCourseCardProps) => {
  // Ensure image URLs use HTTPS for Next.js Image component
  const secureImageUrl = ensureHttpsUrl(imageUrl) || getFallbackImageUrl('course');
  const secureInstructorAvatar = ensureHttpsUrl(instructor?.avatar);

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
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "Advanced":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "Expert":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    }
  };

  const renderRatingStars = (ratingValue: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < Math.floor(ratingValue)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
            )}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{ratingValue.toFixed(1)}</span>
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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
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
                  <span className="text-muted-foreground">&bull;</span>
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

  // Grid View (Default) - Clean, focused design
  const getBadgeStyle = () => {
    if (badges.includes("New")) {
      return { text: "New", className: "bg-emerald-500 text-white" };
    } else if (badges.includes("Bestseller")) {
      return { text: "Bestseller", className: "bg-amber-500 text-white" };
    } else if (badges.includes("Hot")) {
      return { text: "Hot", className: "bg-red-500 text-white" };
    }
    return null;
  };

  const badgeStyle = getBadgeStyle();

  return (
    <Link
      href={`/courses/${id}`}
      className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-violet-300 dark:hover:border-violet-600"
    >
      {/* Course Image */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden">
        <Image
          src={secureImageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 475px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top row: badge + price */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-10">
          {badgeStyle ? (
            <Badge className={cn("text-[10px] font-bold shadow-md border-0", badgeStyle.className)}>
              {badgeStyle.text}
            </Badge>
          ) : (
            <div />
          )}
          <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-0 backdrop-blur-sm font-semibold text-xs shadow-md">
            {formatPrice(price)}
          </Badge>
        </div>

        {/* Category badge */}
        {category && (
          <div className="absolute top-2.5 right-2.5 mt-7 z-10">
            <Badge className="bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 backdrop-blur-sm border-0 text-[10px] shadow-sm">
              {category}
            </Badge>
          </div>
        )}

        {/* Title overlay at bottom of image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
          <h3 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        {/* Instructor */}
        {instructor && (
          <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-700">
            <div className="relative h-6 w-6 rounded-full overflow-hidden ring-1.5 ring-violet-200 dark:ring-violet-800 flex-shrink-0">
              {secureInstructorAvatar ? (
                <Image
                  src={secureInstructorAvatar}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {instructor.name ? instructor.name[0] : "?"}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
              {instructor.name}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5">
          {description}
        </p>

        {/* Difficulty Badge */}
        {difficulty && (
          <div className="mb-2.5">
            <Badge className={cn("text-[10px] sm:text-xs", getDifficultyColor(difficulty))} variant="outline">
              {difficulty}
            </Badge>
          </div>
        )}

        {/* Progress Bar (for enrolled courses) */}
        {isEnrolled && progress !== null && progress !== undefined && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Progress
              </span>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                {progress}%
              </span>
            </div>
            <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Row - Clean inline layout */}
        <div className="mt-auto pt-2.5 flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="font-medium">{chaptersLength}</span>
          </div>

          {enrolledCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="font-medium">{enrolledCount}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-medium">{rating > 0 ? rating.toFixed(1) : "New"}</span>
          </div>

          {hasCertificate && (
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium">Cert</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { BookOpen, Star, Play, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  cleanDescription: string;
  imageUrl: string;
  chaptersLength: number;
  price: number;
  category: string;
}

// Fallback image for when course image is not available - using inline SVG for reliability
const FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPGRlZnM+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjM2NkYxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQTg1NUY3O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgIDwvZGVmcz4KICAgICAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ3JhZDEpIi8+CiAgICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgICAgIENvdXJzZQogICAgICA8L3RleHQ+CiAgICA8L3N2Zz4=";

export const CourseCardHome = ({
  id,
  title,
  cleanDescription,
  imageUrl,
  chaptersLength,
  price,
  category,
}: CourseCardProps) => {
  // Ensure image URLs use HTTPS for Next.js Image component in production
  const initialImageUrl = imageUrl
    ? imageUrl.replace(/^http:\/\//i, 'https://')
    : FALLBACK_IMAGE;

  const [imgSrc, setImgSrc] = useState(initialImageUrl);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  // Get category gradient based on category name
  const getCategoryGradient = (cat: string) => {
    const categoryLower = cat.toLowerCase();
    if (categoryLower.includes('programming') || categoryLower.includes('code') || categoryLower.includes('development')) {
      return 'from-emerald-500 to-teal-500';
    }
    if (categoryLower.includes('design') || categoryLower.includes('ui') || categoryLower.includes('ux')) {
      return 'from-purple-500 to-pink-500';
    }
    if (categoryLower.includes('business') || categoryLower.includes('management')) {
      return 'from-orange-500 to-red-500';
    }
    return 'from-blue-500 to-indigo-500';
  };

  const categoryGradient = getCategoryGradient(category);

  return (
    <Link
      href={`/courses/${id}`}
      prefetch={false}
      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400/50 dark:hover:border-blue-500/50 cursor-pointer"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none z-10"></div>

      {/* Course Image with Enhanced Overlay */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          quality={90}
          unoptimized={hasError}
          onError={handleImageError}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Top Badges Row */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 z-20">
          {/* Category Badge */}
          <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-md shadow-md border border-white/20 bg-gradient-to-r", categoryGradient)}>
            <span className="drop-shadow-sm">{category || "General"}</span>
          </div>

          {/* Price Badge */}
          <div className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-600/95 text-white backdrop-blur-md border border-blue-400/50 shadow-md">
            {price > 0 ? formatPrice(price) : "Free"}
          </div>
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute bottom-2 left-2 right-2 z-20">
          {/* Quick Stats on Image */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              <span className="text-white text-xs font-bold">4.0</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Users className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">128</span>
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
      <div className="flex-1 p-3 relative z-20 flex flex-col">
        {/* Title */}
        <h3 className="text-base font-bold mb-2 line-clamp-2 leading-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
          {cleanDescription || "No description available for this course."}
        </p>

        {/* Compact Stats Row */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 gap-1">
          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {chaptersLength}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">4.0</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">128</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

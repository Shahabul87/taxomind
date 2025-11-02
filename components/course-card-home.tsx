"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { BookOpen, Clock, ArrowRight, Star, TrendingUp } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  cleanDescription: string;
  imageUrl: string;
  chaptersLength: number;
  price: number;
  category: string;
}

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
  const secureImageUrl = imageUrl
    ? imageUrl.replace(/^http:\/\//i, 'https://')
    : '/default-image.webp';

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
    <Link href={`/courses/${id}`} prefetch={false} className="group block h-full">
      <article className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 dark:hover:border-blue-500/50">

        {/* Image Section with Gradient Overlay */}
        <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
          <Image
            src={secureImageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            unoptimized={!imageUrl}
          />

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category Badge with Gradient */}
          <div className="absolute top-3 left-3">
            <div className={`px-3 py-1.5 bg-gradient-to-r ${categoryGradient} text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm border border-white/20`}>
              {category || "General"}
            </div>
          </div>

          {/* Price Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-bold rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {price > 0 ? formatPrice(price) : "Free"}
              </span>
            </div>
          </div>

          {/* Trending Badge - Bottom Left (appears on hover) */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Popular</span>
            </div>
          </div>
        </div>

        {/* Content Section - Enhanced Spacing */}
        <div className="flex-1 p-5 flex flex-col min-h-0">

          {/* Title - Premium Typography */}
          <h3 className="text-lg font-bold mb-2.5 line-clamp-2 leading-snug text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {title}
          </h3>

          {/* Description - Clean and Readable */}
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow-0">
            {cleanDescription || "No description available for this course."}
          </p>

          {/* Rating Section - New Feature */}
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
            ))}
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1">4.0</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">(128)</span>
          </div>

          {/* Course Meta - Glassmorphic Container */}
          <div className="mt-auto space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">

            {/* Stats Row - Enhanced Design */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {chaptersLength} {chaptersLength === 1 ? 'Chapter' : 'Chapters'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Self-paced</span>
              </div>
            </div>

            {/* Call to Action - Premium Button */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-500">Starting at</span>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {price > 0 ? formatPrice(price) : "Free"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 shadow-md group-hover:shadow-lg">
                <span className="text-sm font-semibold">Enroll</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

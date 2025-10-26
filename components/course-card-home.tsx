"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

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
  return (
    <Link href={`/courses/${id}`} prefetch={false} className="group block h-full">
      <article className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden flex flex-col">

        {/* Image Section - Optimized height */}
        <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Category Badge - Simplified */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold text-brand rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
              {category || "General"}
            </span>
          </div>

          {/* Price Tag - Clean design */}
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2.5 py-1 bg-brand text-white text-xs font-semibold rounded-md shadow-sm">
              {price > 0 ? formatPrice(price) : "Free"}
            </span>
          </div>
        </div>

        {/* Content Section - Optimized spacing */}
        <div className="flex-1 p-4 flex flex-col min-h-0">

          {/* Title - Clean and readable */}
          <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-snug text-foreground group-hover:text-brand transition-colors duration-300">
            {title}
          </h3>

          {/* Description - Fixed height allocation */}
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4 flex-grow-0">
            {cleanDescription || "No description available for this course."}
          </p>

          {/* Course Meta - Compact and well-organized */}
          <div className="mt-auto space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">

            {/* Stats Row - Single line */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{chaptersLength} {chaptersLength === 1 ? 'Chapter' : 'Chapters'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Self-paced</span>
              </div>
            </div>

            {/* Call to Action - Simplified */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand">
                {price > 0 ? formatPrice(price) : "Free Course"}
              </span>
              <div className="flex items-center gap-1.5 text-brand group-hover:gap-2 transition-all duration-300">
                <span className="text-sm font-semibold">Enroll</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

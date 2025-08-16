"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { Users2, Star, BookOpen, Clock } from "lucide-react";

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
    <Link href={`/courses/${id}`} prefetch={true}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 h-[400px] sm:h-[420px] md:h-[450px] lg:h-[420px] xl:h-[430px] w-full"
      >
        {/* Image Container with Parallax Effect */}
        <div className="w-full h-40 sm:h-44 md:h-48 lg:h-44 relative overflow-hidden rounded-t-xl">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />
          
          {/* Category Badge */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="px-2 sm:px-3 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 border border-purple-100 dark:border-purple-900/30 shadow-sm"
            >
              {category || "General"}
            </motion.div>
          </div>
          
          {/* Price Tag */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 backdrop-blur-sm text-white text-xs sm:text-sm font-medium shadow-lg"
            >
              {price > 0 ? formatPrice(price) : "Free"}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col h-[calc(400px-160px)] sm:h-[calc(420px-176px)] md:h-[calc(450px-192px)] lg:h-[calc(420px-176px)] xl:h-[calc(430px-176px)]">
          {/* Title with animated underline */}
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300 line-clamp-2 relative">
            {title}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
          </h3>

          {/* Description as plain text with dimmer color */}
          <div className="mb-3 sm:mb-4 flex-grow">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
              {cleanDescription ? cleanDescription : "No description available for this course."}
            </p>
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-3 sm:mb-4 text-xs text-gray-500 dark:text-gray-400">
            <motion.div 
              className="flex items-center gap-1.5"
              whileHover={{ scale: 1.05, color: "#8b5cf6" }}
            >
              <BookOpen className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-purple-500 dark:text-purple-400" />
              <span className="font-medium">
                {chaptersLength} {chaptersLength === 1 ? 'Chapter' : 'Chapters'}
              </span>
            </motion.div>

            <motion.div 
              className="flex items-center gap-1.5"
              whileHover={{ scale: 1.05, color: "#3b82f6" }}
            >
              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="font-medium">
                Flexible Learning
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-1.5"
              whileHover={{ scale: 1.05, color: "#8b5cf6" }}
            >
              <Users2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-purple-500 dark:text-purple-400" />
              <span className="font-medium">
                Active Students
              </span>
            </motion.div>

            <motion.div 
              className="flex items-center gap-1.5"
              whileHover={{ scale: 1.05, color: "#3b82f6" }}
            >
              <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="font-medium">
                Top Rated
              </span>
            </motion.div>
          </div>

          {/* Action Button - More elegant styling */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium tracking-wide hover:opacity-90 transition-all duration-300 shadow-md"
          >
            Enroll Now
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
};

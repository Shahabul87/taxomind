"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Award,
  Flame,
  Sparkles,
  Trophy,
  TrendingUp,
  ArrowRight,
  Heart,
  Play
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  imageUrl: string;
  price: number;
  category: { id: string; name: string };
  chaptersCount: number;
  lessonsCount: number;
  duration: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  badges?: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured">;
  isEnrolled?: boolean;
  createdAt: Date;
}

interface FeaturedShowcaseProps {
  courses: Course[];
}

export function FeaturedShowcase({ courses }: FeaturedShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"editors" | "new" | "trending" | "topRated">("editors");

  // Filter courses by different criteria
  const editorsPicks = courses.filter(c => c.badges?.includes("Featured") || c.rating >= 4.7).slice(0, 6);
  const newReleases = courses
    .filter(c => {
      const daysSinceCreated = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreated <= 30;
    })
    .slice(0, 6);
  const trending = courses
    .sort((a, b) => b.enrolledCount - a.enrolledCount)
    .slice(0, 6);
  const topRated = courses
    .filter(c => c.reviewsCount >= 5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  const tabs = [
    { id: "editors" as const, label: "Editor's Picks", icon: Trophy, courses: editorsPicks },
    { id: "new" as const, label: "New Releases", icon: Sparkles, courses: newReleases },
    { id: "trending" as const, label: "Trending Now", icon: TrendingUp, courses: trending },
    { id: "topRated" as const, label: "Top Rated", icon: Star, courses: topRated },
  ];

  const activeCourses = tabs.find(t => t.id === activeTab)?.courses || [];

  // Premium Course Card Component
  const CourseCard = ({ course, index }: { course: Course; index: number }) => {
    const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') || '';
    const secureInstructorAvatar = course.instructor?.avatar?.replace(/^http:\/\//i, 'https://');

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Link href={`/courses/${course.id}`} className="block group">
          <Card className="h-full border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
              {secureImageUrl && (
                <Image
                  src={secureImageUrl}
                  alt={course.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  {course.badges?.slice(0, 2).map((badge, idx) => (
                    <Badge
                      key={idx}
                      className={cn(
                        "backdrop-blur-md shadow-md font-medium px-2 py-0.5 text-xs",
                        badge === "Hot" && "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0",
                        badge === "New" && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0",
                        badge === "Bestseller" && "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
                        badge === "Featured" && "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
                      )}
                    >
                      {badge === "Hot" && <Flame className="w-3 h-3 mr-1" />}
                      {badge === "New" && <Sparkles className="w-3 h-3 mr-1" />}
                      {badge === "Bestseller" && <Trophy className="w-3 h-3 mr-1" />}
                      {badge}
                    </Badge>
                  ))}
                </div>

                {/* Wishlist Button */}
                <button
                  className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full hover:scale-110 transition-transform shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle wishlist toggle
                  }}
                >
                  <Heart className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </button>
              </div>

              {/* Price Badge */}
              <div className="absolute bottom-3 right-3">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg">
                  {course.price === 0 ? (
                    <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      FREE
                    </span>
                  ) : (
                    <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${course.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-300 border-0 text-xs">
                  {course.category.name}
                </Badge>
              </div>
            </div>

            <CardContent className="p-5">
              {/* Instructor */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md">
                  {secureInstructorAvatar ? (
                    <Image
                      src={secureInstructorAvatar}
                      alt={course.instructor?.name || "Instructor"}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                      {course.instructor?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                  {course.instructor?.name}
                </p>
              </div>

              {/* Title */}
              <h3 className="font-bold text-base mb-2 line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {course.title}
              </h3>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {course.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    ({course.reviewsCount})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {course.enrolledCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {course.duration}h
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md">
                    <BookOpen className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {course.lessonsCount} lessons
                  </span>
                </div>
              </div>

              {/* Difficulty Badge */}
              {course.difficulty && (
                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 mb-3">
                  {course.difficulty}
                </Badge>
              )}

              {/* Enroll Button */}
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md group/btn"
                size="sm"
              >
                {course.isEnrolled ? "Continue Learning" : "Enroll Now"}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2">
            <Play className="w-4 h-4 mr-2" />
            Featured Courses
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Start Learning Today
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Hand-picked courses from our expert instructors
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-md",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-105"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-lg hover:scale-105"
                )}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
                {tab.courses.length > 0 && (
                  <Badge className={cn(
                    "ml-1",
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}>
                    {tab.courses.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {activeCourses.length > 0 ? (
            activeCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                No courses available in this category yet.
              </p>
            </div>
          )}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl px-8 py-6 text-lg group"
            asChild
          >
            <Link href="/courses">
              Browse All Courses
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  Users,
  Clock,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface SimilarCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  averageRating: number | null;
  difficulty: string | null;
  totalDuration: number | null;
  category?: {
    name: string;
  } | null;
  _count?: {
    Enrollment: number;
  };
  user?: {
    name: string | null;
    image: string | null;
  } | null;
}

interface SimilarCoursesSectionProps {
  courseId: string;
  categoryId?: string | null;
}

export const SimilarCoursesSection: React.FC<SimilarCoursesSectionProps> = ({
  courseId,
  categoryId
}) => {
  const [courses, setCourses] = useState<SimilarCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarCourses = async () => {
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set('categoryId', categoryId);
        params.set('limit', '6');

        const response = await fetch(`/api/courses/${courseId}/similar?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error('Failed to fetch similar courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarCourses();
  }, [courseId, categoryId]);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-6 sm:h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 sm:w-64 mb-6 sm:mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 sm:h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return 'Duration varies';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    return `${mins}m`;
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Similar Courses
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                Expand your knowledge with these recommended courses
              </p>
            </div>
          </div>
        </div>

        {/* Courses Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {courses.map((course, index) => {
            const enrollmentCount = course._count?.Enrollment || 0;
            const rating = course.averageRating || 0;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={`/courses/${course.id}`}
                  className="group block h-full"
                >
                  <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:scale-[1.02] hover:-translate-y-1">
                    {/* Course Image */}
                    <div className="relative h-40 sm:h-44 md:h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}

                      {/* Overlay Badge */}
                      {course.difficulty && (
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm">
                            {course.difficulty}
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {course.category && (
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-600 text-white backdrop-blur-sm">
                            {course.category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Course Content */}
                    <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h3>

                      {/* Description */}
                      {course.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {/* Instructor */}
                      {course.user && (
                        <div className="flex items-center gap-2">
                          {course.user.image ? (
                            <Image
                              src={course.user.image}
                              alt={course.user.name || 'Instructor'}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <Users className="w-3 h-3 text-slate-500" />
                            </div>
                          )}
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {course.user.name || 'Anonymous'}
                          </span>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm flex-wrap">
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {rating.toFixed(1)}
                            </span>
                          </div>
                        )}

                        {enrollmentCount > 0 && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{enrollmentCount.toLocaleString()}</span>
                          </div>
                        )}

                        {course.totalDuration && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{formatDuration(course.totalDuration)}</span>
                          </div>
                        )}
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          {course.price !== null && course.price > 0 ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                ${course.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                              Free
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 sm:group-hover:gap-3 transition-all">
                          <span className="text-xs sm:text-sm">View Course</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        {courses.length >= 6 && (
          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Explore All Courses</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

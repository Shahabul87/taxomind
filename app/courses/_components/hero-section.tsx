"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Code,
  Palette,
  Camera,
  Music,
  Briefcase,
  Heart,
  Cpu,
  BookOpen,
  TrendingUp,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeaturedCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  instructor: string;
  rating: number;
  enrolledCount: number;
  badge?: string;
}

interface CategoryLink {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
}

import { placeholderImages } from "./placeholder-image";

const featuredCourses: FeaturedCourse[] = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp 2024",
    description: "Learn HTML, CSS, JavaScript, React, Node.js and more. Build real-world projects.",
    imageUrl: placeholderImages.webDev,
    category: "Web Development",
    instructor: "Dr. Sarah Johnson",
    rating: 4.8,
    enrolledCount: 12543,
    badge: "Bestseller"
  },
  {
    id: "2",
    title: "Machine Learning & AI Masterclass",
    description: "Master machine learning algorithms and build AI applications from scratch.",
    imageUrl: placeholderImages.ai,
    category: "Artificial Intelligence",
    instructor: "Prof. Michael Chen",
    rating: 4.9,
    enrolledCount: 8921,
    badge: "Hot"
  },
  {
    id: "3",
    title: "Digital Marketing Complete Guide",
    description: "Learn SEO, SEM, Social Media Marketing, and grow your business online.",
    imageUrl: placeholderImages.marketing,
    category: "Business",
    instructor: "Emma Wilson",
    rating: 4.7,
    enrolledCount: 6789,
    badge: "New"
  }
];

const categoryLinks: CategoryLink[] = [
  {
    id: "development",
    name: "Development",
    icon: Code,
    count: 342,
    color: "bg-blue-500"
  },
  {
    id: "design",
    name: "Design",
    icon: Palette,
    count: 218,
    color: "bg-purple-500"
  },
  {
    id: "photography",
    name: "Photography",
    icon: Camera,
    count: 156,
    color: "bg-pink-500"
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    count: 94,
    color: "bg-green-500"
  },
  {
    id: "business",
    name: "Business",
    icon: Briefcase,
    count: 287,
    color: "bg-orange-500"
  },
  {
    id: "health",
    name: "Health & Fitness",
    icon: Heart,
    count: 132,
    color: "bg-red-500"
  },
  {
    id: "technology",
    name: "Technology",
    icon: Cpu,
    count: 423,
    color: "bg-indigo-500"
  },
  {
    id: "academics",
    name: "Academics",
    icon: BookOpen,
    count: 198,
    color: "bg-teal-500"
  }
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredCourses.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + featuredCourses.length) % featuredCourses.length);
  };

  const handleNextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % featuredCourses.length);
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 pt-14 xl:pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Featured Carousel */}
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div className="relative h-full w-full">
                {/* Background Image */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 z-10" />
                <div className="absolute inset-0 bg-blue-900/20 z-10" />

                {/* Content */}
                <div className="relative z-20 h-full flex items-center">
                  <div className="container mx-auto px-4 md:px-8">
                    <div className="max-w-2xl">
                      {featuredCourses[currentSlide].badge && (
                        <Badge className="mb-4 bg-red-500 text-white">
                          {featuredCourses[currentSlide].badge}
                        </Badge>
                      )}
                      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        {featuredCourses[currentSlide].title}
                      </h1>
                      <p className="text-lg md:text-xl text-gray-200 mb-6">
                        {featuredCourses[currentSlide].description}
                      </p>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-2 text-white">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={cn(
                                  "h-5 w-5",
                                  i < Math.floor(featuredCourses[currentSlide].rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-400 text-gray-400"
                                )}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="font-semibold">{featuredCourses[currentSlide].rating}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-200">
                          {featuredCourses[currentSlide].enrolledCount.toLocaleString()} students
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-200">
                          by {featuredCourses[currentSlide].instructor}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <Link href={`/courses/${featuredCourses[currentSlide].id}`}>
                          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                            <Zap className="h-5 w-5 mr-2" />
                            Enroll Now
                          </Button>
                        </Link>
                        <Link href={`/courses/${featuredCourses[currentSlide].id}`}>
                          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                            Learn More
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Placeholder gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {featuredCourses.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentSlide === index
                    ? "w-8 bg-white"
                    : "bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Category Quick Links */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Browse by Category
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Explore courses across {categoryLinks.length} categories
              </p>
            </div>
            <Link href="/categories">
              <Button variant="outline">
                View All Categories
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categoryLinks.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/courses?categories=${category.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="p-4 flex flex-col items-center text-center">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                        category.color,
                        "bg-opacity-10"
                      )}>
                        <Icon className={cn("h-6 w-6", category.color.replace("bg-", "text-"))} />
                      </div>
                      <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                      <span className="text-xs text-muted-foreground">{category.count} courses</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Learning Today
            </h2>
            <p className="text-lg md:text-xl mb-8 text-blue-100">
              Join millions of learners worldwide and unlock your potential with our expert-led courses
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                <TrendingUp className="h-5 w-5 mr-2" />
                Browse Trending Courses
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Learning Paths
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
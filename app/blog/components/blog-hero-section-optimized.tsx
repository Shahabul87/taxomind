"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Sparkles,
  ArrowRight,
  PenSquare,
  FileText,
  Users,
  Award,
  Eye,
  Clock,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BlogPost, BlogStatistics } from "./types";

interface ModernHeroSectionProps {
  featuredPosts: BlogPost[];
  statistics?: BlogStatistics | null;
  isLoading?: boolean;
}

/**
 * Optimized Hero Section for Blog Page
 * Uses CSS animations instead of Framer Motion for better performance
 */
export function ModernHeroSectionOptimized({
  featuredPosts,
  statistics,
  isLoading
}: ModernHeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const slides = [
    {
      id: 1,
      tag: "Tech Insights",
      title: "Ideas That Shape Tomorrow",
      subtitle: "Explore cutting-edge insights on technology, innovation, and digital transformation. Join our community of forward-thinkers.",
      gradient: "from-blue-600 via-indigo-600 to-purple-600"
    },
    {
      id: 2,
      tag: "Innovation Hub",
      title: "Learn From Industry Experts",
      subtitle: "Discover thought leadership, best practices, and real-world experiences from top technology professionals.",
      gradient: "from-emerald-600 via-teal-600 to-cyan-600"
    },
    {
      id: 3,
      tag: "Knowledge Base",
      title: "Master Modern Technologies",
      subtitle: "Deep-dive tutorials, comprehensive guides, and practical insights to accelerate your technical journey.",
      gradient: "from-purple-600 via-pink-600 to-rose-600"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}K+`;
    }
    return `${num}+`;
  };

  return (
    <div className="relative min-h-[60vh] sm:min-h-[75vh] lg:min-h-[85vh] flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated Background Elements - CSS Only */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      {/* Breadcrumb Navigation */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" aria-label="Breadcrumb">
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-1.5 text-slate-300 hover:text-white transition-colors group"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" aria-hidden="true" />
            <span className="text-white font-semibold" aria-current="page">Blog</span>
          </nav>
        </div>
      </div>

      <div className="relative flex-1 flex items-center container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center w-full">
          {/* Left Content */}
          <div className={cn("space-y-8 transition-all duration-1000", isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12")}>
            {/* Tag Badge with Animation */}
            <div key={currentSlide} className="animate-fade-in-up">
              <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                {currentSlideData.tag}
              </Badge>
            </div>

            {/* Main Heading with Slide Animation */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight animate-fade-in-up animation-delay-100">
              <span className={cn(
                "bg-gradient-to-r bg-clip-text text-transparent",
                currentSlideData.gradient
              )}>
                {currentSlideData.title.split(' ').slice(0, 2).join(' ')}
              </span>
              {' '}
              <span className="text-white">
                {currentSlideData.title.split(' ').slice(2).join(' ')}
              </span>
            </h1>

            {/* Subtitle with Animation */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl animate-fade-in-up animation-delay-200">
              {currentSlideData.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-fade-in-up animation-delay-300">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
              >
                Start Reading
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
              >
                <PenSquare className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Write an Article
              </Button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 sm:flex sm:flex-wrap pt-4 animate-fade-in-up animation-delay-400">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 sm:min-w-[140px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-white animate-pulse">--</p>
                  ) : (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                      {formatNumber(statistics?.publishedArticles || 0)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Published</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 sm:min-w-[140px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-white animate-pulse">--</p>
                  ) : (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                      {formatNumber(statistics?.totalReaders || 0)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Readers</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 sm:min-w-[140px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-white animate-pulse">--</p>
                  ) : (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                      {formatNumber(statistics?.totalAuthors || 0)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Authors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Cards Section - CSS Animations Only */}
          <div className={cn("hidden lg:block relative transition-all duration-1000 delay-300", isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12")}>
            <div className="relative">
              {/* Floating Card 1 - Top */}
              {featuredPosts[0] && (
                <div className="absolute top-0 right-0 w-80 animate-float">
                  <Link href={`/blog/${featuredPosts[0].id}`}>
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-2xl hover:shadow-3xl transition-all cursor-pointer group">
                      <div className="relative h-32">
                        <Image
                          src={featuredPosts[0].imageUrl || "/api/placeholder/800/400"}
                          alt={featuredPosts[0].title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="320px"
                          priority
                          fetchPriority="high"
                          quality={75}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs px-2 py-1">
                          Featured
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-sm line-clamp-2 text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {featuredPosts[0].title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {featuredPosts[0].views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {featuredPosts[0].readingTime}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Floating Card 2 - Middle */}
              {featuredPosts[1] && (
                <div className="absolute top-56 left-0 w-72 animate-float animation-delay-1000">
                  <Link href={`/blog/${featuredPosts[1].id}`}>
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-2xl hover:shadow-3xl transition-all cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              Trending Now
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {featuredPosts[1].views.toLocaleString()} views
                            </p>
                          </div>
                        </div>
                        <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                          {featuredPosts[1].title}
                        </h4>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Floating Card 3 - Bottom Right */}
              {featuredPosts[2] && (
                <div className="absolute top-[26rem] -right-10 w-64 animate-float-reverse animation-delay-500">
                  <Card className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-5 text-white">
                    <BookOpen className="w-8 h-8 mb-3 opacity-90" />
                    <p className="font-bold text-2xl mb-1">
                      {formatNumber(statistics?.publishedArticles || 50)}
                    </p>
                    <p className="text-sm opacity-90">Articles Published</p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-white/30 border-2 border-purple-500" />
                        ))}
                      </div>
                      <span className="opacity-75">+{formatNumber(statistics?.totalAuthors || 20)} authors</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "min-h-[44px] min-w-[44px] p-2 rounded-full transition-all flex items-center justify-center",
                "bg-transparent"
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? "true" : "false"}
            >
              <span className={cn(
                "h-1.5 sm:h-2 rounded-full transition-all",
                index === currentSlide ? "w-6 sm:w-8 bg-white" : "w-1.5 sm:w-2 bg-white/30"
              )} />
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(15px); }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: float-reverse 3.5s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-float-reverse,
          .animate-fade-in-up,
          .animate-pulse-slow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

import { Brain, Cpu, Network, Sparkles, Home, ChevronRight, User, Users, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AIMLHeroProps {
  course: {
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    subtitle?: string | null;
    difficulty?: string | null;
    category?: {
      name: string;
      subcategory?: string | null;
    } | null;
    user?: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
    _count?: {
      enrollments?: number;
      Enrollment?: number;
    };
    reviews?: {
      rating: number;
    }[];
  };
  models?: string[];
  isEnrolled?: boolean;
  onEnroll?: () => void;
}

export function AIMLHero({ course, models = [], isEnrolled = false, onEnroll }: AIMLHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
      {/* Neural Network Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-net" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="white" opacity="0.3" />
              <circle cx="25" cy="25" r="2" fill="white" opacity="0.3" />
              <circle cx="75" cy="75" r="2" fill="white" opacity="0.3" />
              <line x1="50" y1="50" x2="25" y2="25" stroke="white" strokeWidth="0.5" opacity="0.2" />
              <line x1="50" y1="50" x2="75" y2="75" stroke="white" strokeWidth="0.5" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-net)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Home Icon > Category Name */}
            <div className="flex items-center gap-2 text-sm text-purple-200/70">
              <Link href="/" className="flex items-center gap-1 hover:text-purple-200 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-purple-200">{course.category.name}</span>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-xl text-purple-200">{course.subtitle}</p>
              )}
              {course.description && (
                <p className="text-lg text-slate-300 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Models/Algorithms */}
            {models.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-300">
                  <Network className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    ML Models &amp; Algorithms
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {models.map((model, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-100 border border-purple-400/30"
                    >
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Brain className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Models</span>
                </div>
                <p className="text-2xl font-bold text-white">15+</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pink-400">
                  <Cpu className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Datasets</span>
                </div>
                <p className="text-2xl font-bold text-white">30+</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <Network className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Projects</span>
                </div>
                <p className="text-2xl font-bold text-white">20+</p>
              </div>
            </div>
          </div>

          {/* Right Visual - Course Image with top spacing */}
          <div className="relative pt-12 lg:pt-16">
            {course.imageUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-purple-400/30">
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                <Brain className="h-32 w-32 text-slate-600" />
              </div>
            )}

            {/* Floating Elements */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Instructor Row with Enroll Button - Full Width, Horizontally Aligned */}
        {course.user && (
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-6 pt-4 mb-12 border-t border-purple-400/20">
            {/* Left: Instructor Info with Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {course.user.image ? (
                    <Image
                      src={course.user.image}
                      alt={course.user.name || 'Instructor'}
                      width={48}
                      height={48}
                      className="rounded-full ring-2 ring-purple-400/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-purple-200/70">Instructor</p>
                  <p className="font-semibold text-white">{course.user.name || 'Anonymous'}</p>
                </div>
              </div>

              {/* Students and Reviews Stats */}
              <div className="flex items-center gap-4">
                {/* Students Count */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-pink-400" />
                  <span className="text-sm font-medium text-white">
                    {(course._count?.Enrollment ?? course._count?.enrollments ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-purple-200/70">Students</span>
                </div>

                {/* Reviews Count & Rating */}
                {course.reviews && course.reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {(course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-purple-200/70">
                      ({course.reviews.length} Reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Enroll Button - Horizontally aligned with instructor row */}
            {onEnroll && (
              <div className="flex justify-end">
                <Button
                  onClick={onEnroll}
                  disabled={isEnrolled}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

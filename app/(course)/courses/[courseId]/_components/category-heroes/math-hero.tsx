import { Calculator, Sigma, Pi, Divide, Home, ChevronRight, User, Users, Star, TrendingUp, Function } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BaseCourse } from '../../_types/course.types';

interface MathHeroProps {
  course: BaseCourse;
  topics?: string[];
  isEnrolled?: boolean;
  onEnroll?: () => void;
}

export function MathHero({ course, topics = [], isEnrolled = false, onEnroll }: MathHeroProps) {
  // Ensure image URLs use HTTPS for Next.js Image component in production
  const secureImageUrl = course.imageUrl
    ? course.imageUrl.replace(/^http:\/\//i, 'https://')
    : null;

  // Calculate dynamic stats from chapters data
  const modules = course.chapters?.length ?? 0;
  const lessons = course.chapters?.reduce((acc, ch) => acc + (ch.sections?.length ?? 0), 0) ?? 0;
  const resources = Math.max(lessons * 2, 10); // Estimate: ~2 resources per lesson

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900">
      {/* Mathematical Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="math-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="60" y2="30" stroke="white" strokeWidth="0.5" opacity="0.3" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="white" strokeWidth="0.5" opacity="0.3" />
              {/* Mathematical symbols */}
              <text x="10" y="20" fill="white" fontSize="12" opacity="0.2">+</text>
              <text x="45" y="50" fill="white" fontSize="12" opacity="0.2">=</text>
              <text x="10" y="50" fill="white" fontSize="10" opacity="0.15">&#x03C0;</text>
              <text x="45" y="20" fill="white" fontSize="10" opacity="0.15">&#x221E;</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#math-grid)" />
        </svg>
      </div>

      {/* Floating Mathematical Symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl text-amber-500/10 font-serif">&#x03C0;</div>
        <div className="absolute top-40 right-20 text-5xl text-orange-500/10 font-serif">&#x221A;</div>
        <div className="absolute bottom-32 left-1/4 text-4xl text-yellow-500/10 font-serif">&#x2211;</div>
        <div className="absolute bottom-20 right-1/3 text-5xl text-amber-500/10 font-serif">&#x222B;</div>
        <div className="absolute top-1/3 right-10 text-4xl text-orange-500/10 font-serif">&#x0394;</div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Home Icon > Courses > Category Name */}
            <div className="flex items-center gap-2 text-sm text-amber-200/70">
              <Link href="/" className="flex items-center gap-1 hover:text-amber-200 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/courses" className="hover:text-amber-200 transition-colors">
                <span>Courses</span>
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-amber-200">{course.category.name}</span>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-xl text-amber-200">{course.subtitle}</p>
              )}
              {course.description && (
                <p className="text-lg text-slate-300 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              )}
            </div>

            {/* Mathematical Topics */}
            {topics.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <Sigma className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Topics Covered
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-amber-500/20 text-amber-100 border border-amber-400/30"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Math Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <Calculator className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Chapters</span>
                </div>
                <p className="text-2xl font-bold text-white">{modules}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-orange-400">
                  <Pi className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Lessons</span>
                </div>
                <p className="text-2xl font-bold text-white">{lessons}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-yellow-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Problems</span>
                </div>
                <p className="text-2xl font-bold text-white">{resources}+</p>
              </div>
            </div>
          </div>

          {/* Right Visual - Course Image with top spacing */}
          <div className="relative pt-12 lg:pt-16">
            {secureImageUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30">
                <Image
                  src={secureImageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-amber-900/30 flex items-center justify-center">
                <div className="text-center">
                  <Sigma className="h-24 w-24 text-amber-500/50 mx-auto mb-4" />
                  <div className="text-2xl font-serif text-amber-500/30">f(x) = &#x222B; dx</div>
                </div>
              </div>
            )}

            {/* Floating Elements */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />

            {/* Formula Badge */}
            <div className="absolute -bottom-4 -right-4 bg-slate-800/90 backdrop-blur-sm border border-amber-400/30 rounded-xl px-4 py-2 shadow-lg">
              <span className="text-amber-300 font-mono text-sm">E = mc&sup2;</span>
            </div>
          </div>
        </div>

        {/* Instructor Row with Enroll Button - Full Width, Horizontally Aligned */}
        {course.user && (
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-6 pt-4 mb-12 border-t border-amber-400/20">
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
                      className="rounded-full ring-2 ring-amber-400/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-amber-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-amber-200/70">Instructor</p>
                  <p className="font-semibold text-white">{course.user.name || 'Anonymous'}</p>
                </div>
              </div>

              {/* Students and Reviews Stats */}
              <div className="flex items-center gap-4">
                {/* Students Count */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-white">
                    {(course._count?.Enrollment ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-amber-200/70">Students</span>
                </div>

                {/* Reviews Count & Rating */}
                {course.reviews && course.reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {(course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-amber-200/70">
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
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

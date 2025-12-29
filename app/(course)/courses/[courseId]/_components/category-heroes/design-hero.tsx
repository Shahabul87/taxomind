import { Palette, Layers, Pen, Sparkles, Home, ChevronRight, User, Users, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Chapter {
  id: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
  }>;
}

interface DesignHeroProps {
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
    chapters?: Chapter[];
  };
  tools?: string[];
  isEnrolled?: boolean;
  onEnroll?: () => void;
}

export function DesignHero({ course, tools = [], isEnrolled = false, onEnroll }: DesignHeroProps) {
  // Ensure image URLs use HTTPS for Next.js Image component in production
  const secureImageUrl = course.imageUrl
    ? course.imageUrl.replace(/^http:\/\//i, 'https://')
    : null;

  // Calculate dynamic stats from chapters data
  const modules = course.chapters?.length ?? 0;
  const lessons = course.chapters?.reduce((acc, ch) => acc + (ch.sections?.length ?? 0), 0) ?? 0;
  const resources = Math.max(lessons * 2, 10); // Estimate: ~2 resources per lesson

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-900 via-rose-900 to-purple-900">
      {/* Creative Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Home Icon > Courses > Category Name */}
            <div className="flex items-center gap-2 text-sm text-pink-200/70">
              <Link href="/" className="flex items-center gap-1 hover:text-pink-200 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/courses" className="hover:text-pink-200 transition-colors">
                <span>Courses</span>
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-pink-200">{course.category.name}</span>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-xl text-pink-200">{course.subtitle}</p>
              )}
              {course.description && (
                <p className="text-lg text-slate-300 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              )}
            </div>

            {/* Design Tools */}
            {tools.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-pink-300">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Design Tools
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-pink-500/20 text-pink-100 border border-pink-400/30"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Design Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-400">
                  <Palette className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Modules</span>
                </div>
                <p className="text-2xl font-bold text-white">{modules}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <Pen className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Lessons</span>
                </div>
                <p className="text-2xl font-bold text-white">{lessons}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pink-400">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Resources</span>
                </div>
                <p className="text-2xl font-bold text-white">{resources}+</p>
              </div>
            </div>
          </div>

          {/* Right Visual - Course Image with top spacing */}
          <div className="relative pt-12 lg:pt-16">
            {secureImageUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-pink-400/30">
                <Image
                  src={secureImageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                <Palette className="h-32 w-32 text-slate-600" />
              </div>
            )}

            {/* Floating Elements */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Instructor Row with Enroll Button - Full Width, Horizontally Aligned */}
        {course.user && (
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-6 pt-4 mb-12 border-t border-pink-400/20">
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
                      className="rounded-full ring-2 ring-pink-400/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-pink-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-pink-200/70">Instructor</p>
                  <p className="font-semibold text-white">{course.user.name || 'Anonymous'}</p>
                </div>
              </div>

              {/* Students and Reviews Stats */}
              <div className="flex items-center gap-4">
                {/* Students Count */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-rose-400" />
                  <span className="text-sm font-medium text-white">
                    {(course._count?.Enrollment ?? course._count?.enrollments ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-pink-200/70">Students</span>
                </div>

                {/* Reviews Count & Rating */}
                {course.reviews && course.reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {(course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-pink-200/70">
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
                  className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

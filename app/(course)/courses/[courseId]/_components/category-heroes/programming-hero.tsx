import { Code2, Terminal, Braces, GitBranch, Home, ChevronRight, User, Users, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProgrammingHeroProps {
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
  techStack?: string[];
  isEnrolled?: boolean;
  onEnroll?: () => void;
}

export function ProgrammingHero({ course, techStack = [], isEnrolled = false, onEnroll }: ProgrammingHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Code Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.03) 2px,
            rgba(255,255,255,0.03) 4px
          )`
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Home Icon > Category Name */}
            <div className="flex items-center gap-2 text-sm text-blue-200/70">
              <Link href="/" className="flex items-center gap-1 hover:text-blue-200 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-blue-200">{course.category.name}</span>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-xl text-blue-200">{course.subtitle}</p>
              )}
              {course.description && (
                <p className="text-lg text-slate-300 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Tech Stack */}
            {techStack.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-300">
                  <Terminal className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Tech Stack
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-500/20 text-blue-100 border border-blue-400/30"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Braces className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Projects</span>
                </div>
                <p className="text-2xl font-bold text-white">12+</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Labs</span>
                </div>
                <p className="text-2xl font-bold text-white">50+</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-400">
                  <Code2 className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Challenges</span>
                </div>
                <p className="text-2xl font-bold text-white">100+</p>
              </div>
            </div>
          </div>

          {/* Right Visual - Course Image with top spacing */}
          <div className="relative pt-12 lg:pt-16">
            {course.imageUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-blue-400/30">
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                <Code2 className="h-32 w-32 text-slate-600" />
              </div>
            )}

            {/* Floating Elements */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Instructor Row with Enroll Button - Full Width, Horizontally Aligned */}
        {course.user && (
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-6 pt-4 mb-12 border-t border-blue-400/20">
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
                      className="rounded-full ring-2 ring-blue-400/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-blue-200/70">Instructor</p>
                  <p className="font-semibold text-white">{course.user.name || 'Anonymous'}</p>
                </div>
              </div>

              {/* Students and Reviews Stats */}
              <div className="flex items-center gap-4">
                {/* Students Count */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">
                    {(course._count?.Enrollment ?? course._count?.enrollments ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-blue-200/70">Students</span>
                </div>

                {/* Reviews Count & Rating */}
                {course.reviews && course.reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {(course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-blue-200/70">
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
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

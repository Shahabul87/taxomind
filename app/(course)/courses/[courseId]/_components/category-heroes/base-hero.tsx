'use client';

import { useRef } from 'react';
import { Home, ChevronRight, User, Users, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, useInView, useReducedMotion } from '@/components/lazy-motion';
import { ImagePresentation } from './image-presentations';
import type { HeroThemeConfig } from '../../_config/hero-themes';
import type { BaseCourse } from '../../_types/course.types';

interface BaseHeroProps {
  course: BaseCourse;
  theme: HeroThemeConfig;
  badges?: string[];
  isEnrolled?: boolean;
  onEnroll?: () => void;
}

function secureImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, 'https://');
}

export function BaseHero({ course, theme, badges = [], isEnrolled = false, onEnroll }: BaseHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();

  const imageUrl = secureImageUrl(course.imageUrl);
  const Pattern = theme.pattern;

  const modules = course.chapters?.length ?? 0;
  const lessons = course.chapters?.reduce((acc, ch) => acc + (ch.sections?.length ?? 0), 0) ?? 0;
  const resources = Math.max(lessons * 2, 10);
  const hasContent = modules > 0 || lessons > 0;

  const statValues = [
    hasContent ? String(modules) : '--',
    hasContent ? String(lessons) : '--',
    hasContent ? `${resources}+` : '--',
  ];

  const shouldAnimate = !prefersReducedMotion;

  const fadeInUp = shouldAnimate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        transition: { duration: 0.5, ease: 'easeOut' },
      }
    : {};

  const stagger = (index: number) =>
    shouldAnimate
      ? { transition: { duration: 0.5, ease: 'easeOut', delay: index * 0.1 } }
      : {};

  const { colors } = theme;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient}`}
    >
      <Pattern />

      {/* Floating math symbols (math variant only) */}
      {theme.floatingSymbols && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {theme.floatingSymbols.map((sym, i) => (
            <div key={i} className={`absolute font-serif ${sym.className}`}>
              {sym.symbol}
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <motion.div
              className={`flex items-center gap-2 text-sm text-${colors.breadcrumbText}`}
              {...fadeInUp}
              {...stagger(0)}
            >
              <Link href="/" className={`flex items-center gap-1 hover:text-${colors.breadcrumbHover} transition-colors`}>
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/courses" className={`hover:text-${colors.breadcrumbHover} transition-colors`}>
                <span>Courses</span>
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className={`text-${colors.breadcrumbActive}`}>{course.category.name}</span>
                </>
              )}
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                className="text-4xl lg:text-5xl font-bold text-white leading-tight"
                {...fadeInUp}
                {...stagger(1)}
              >
                {course.title}
              </motion.h1>
              {course.subtitle && (
                <motion.p
                  className={`text-xl text-${colors.subtitle}`}
                  {...fadeInUp}
                  {...stagger(2)}
                >
                  {course.subtitle}
                </motion.p>
              )}
              {course.description && (
                <motion.p
                  className="text-lg text-slate-300 leading-relaxed line-clamp-4"
                  {...fadeInUp}
                  {...stagger(3)}
                >
                  {course.description}
                </motion.p>
              )}
            </div>

            {/* Badge Section (Tech Stack / Models / Tools / Topics) */}
            {badges.length > 0 && theme.badge && (
              <motion.div className="space-y-3" {...fadeInUp} {...stagger(4)}>
                <div className={`flex items-center gap-2 text-${colors.instructorText}`}>
                  <theme.badge.icon className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    {theme.badge.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`bg-${colors.badgeBg} text-${colors.badgeText} border border-${colors.badgeBorder}`}
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-3 gap-4 pt-6 relative"
              {...fadeInUp}
              {...stagger(5)}
            >
              {!hasContent && (
                <div className="absolute inset-0 flex items-center justify-center col-span-3 z-10">
                  <Badge variant="secondary" className="bg-white/10 text-white/80 border border-white/20 text-sm px-4 py-1.5">
                    Content Coming Soon
                  </Badge>
                </div>
              )}
              {theme.stats.map((stat, i) => (
                <div key={i} className={`space-y-1 ${!hasContent ? 'opacity-30' : ''}`}>
                  <div className={`flex items-center gap-2 ${stat.colorClass}`}>
                    <stat.icon className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{statValues[i]}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Visual - Course Image */}
          <motion.div
            className="relative pt-12 lg:pt-16"
            {...fadeInUp}
            {...stagger(2)}
          >
            <ImagePresentation
              imageUrl={imageUrl}
              title={course.title}
              theme={theme}
              shouldAnimate={shouldAnimate}
            />
          </motion.div>
        </div>

        {/* Instructor Row with Enroll Button */}
        {course.user && (
          <motion.div
            className={`grid lg:grid-cols-2 gap-12 items-center mt-6 pt-4 mb-12 border-t border-${colors.borderColor}`}
            {...fadeInUp}
            {...stagger(6)}
          >
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
                      className={`rounded-full ring-2 ring-${colors.instructorRing}`}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-${colors.instructorBg} border border-${colors.instructorRing} flex items-center justify-center`}>
                      <User className={`h-6 w-6 text-${colors.instructorText}`} />
                    </div>
                  )}
                </div>
                <div>
                  <p className={`text-sm text-${colors.instructorLabel}`}>Instructor</p>
                  <p className="font-semibold text-white">{course.user.name || 'Anonymous'}</p>
                </div>
              </div>

              {/* Students and Reviews Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users className={`h-4 w-4 text-${colors.studentIcon}`} />
                  <span className="text-sm font-medium text-white">
                    {(course._count?.Enrollment ?? 0).toLocaleString()}
                  </span>
                  <span className={`text-sm text-${colors.instructorLabel}`}>Students</span>
                </div>

                {course.reviews && course.reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {(course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                    </span>
                    <span className={`text-sm text-${colors.instructorLabel}`}>
                      ({course.reviews.length} Reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Enroll Button */}
            {onEnroll && (
              <div className="flex justify-end">
                <Button
                  onClick={onEnroll}
                  disabled={isEnrolled}
                  size="lg"
                  className={`w-full sm:w-auto bg-gradient-to-r from-${colors.buttonFrom} to-${colors.buttonTo} hover:from-${colors.buttonHoverFrom} hover:to-${colors.buttonHoverTo} text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-${colors.buttonShadow} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

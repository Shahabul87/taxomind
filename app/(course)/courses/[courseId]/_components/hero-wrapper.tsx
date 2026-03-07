'use client';

import { BaseHero } from './category-heroes/base-hero';
import { HERO_THEMES } from '../_config/hero-themes';
import { useEnrollAction } from '../_hooks/use-enroll-action';
import type { CategoryLayoutVariant } from '../_config/category-layouts';
import type { BaseCourse } from '../_types/course.types';

interface HeroWrapperProps {
  variant: CategoryLayoutVariant;
  course: BaseCourse & { isFree?: boolean };
  isEnrolled: boolean;
  userId?: string;
  badges?: string[];
}

export function HeroWrapper({
  variant,
  course,
  isEnrolled,
  userId,
  badges = [],
}: HeroWrapperProps) {
  const { handleEnroll } = useEnrollAction({
    courseId: course.id,
    price: course.price ?? null,
    isFree: course.isFree,
    userId,
  });

  const theme = HERO_THEMES[variant] ?? HERO_THEMES.default;

  return (
    <div className="relative">
      <BaseHero
        course={course}
        theme={theme}
        badges={badges}
        isEnrolled={isEnrolled}
        onEnroll={handleEnroll}
      />
    </div>
  );
}

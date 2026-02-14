'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BaseHero } from './category-heroes/base-hero';
import { HERO_THEMES } from '../_config/hero-themes';
import type { CategoryLayoutVariant } from '../_config/category-layouts';
import type { BaseCourse } from '../_types/course.types';

interface HeroWrapperProps {
  variant: CategoryLayoutVariant;
  course: BaseCourse & { isFree?: boolean };
  isEnrolled: boolean;
  userId?: string;
  categorySpecificProps?: {
    techStack?: string[];
    models?: string[];
    tools?: string[];
    topics?: string[];
  };
}

export function HeroWrapper({
  variant,
  course,
  isEnrolled,
  userId,
  categorySpecificProps = {},
}: HeroWrapperProps) {
  const router = useRouter();

  const handleEnroll = async () => {
    if (!userId) {
      toast.error('Please sign in to enroll');
      router.push('/auth/login');
      return;
    }

    const isFree = course.isFree === true || (course.price ?? 0) === 0;

    if (isFree) {
      try {
        toast.loading('Enrolling you in the course...');

        const response = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.dismiss();
          toast.success('Successfully enrolled! Redirecting to course...');
          setTimeout(() => {
            router.push(`/courses/${course.id}/learn`);
            router.refresh();
          }, 1500);
        } else {
          toast.dismiss();
          toast.error(data.error?.message || 'Failed to enroll');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[ENROLL_ERROR]', error);
      }
    } else {
      try {
        toast.loading('Redirecting to checkout...');

        const response = await fetch(`/api/courses/${course.id}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        const checkoutUrl = result.data?.url || result.url;

        if (response.ok && checkoutUrl) {
          toast.dismiss();
          window.location.href = checkoutUrl;
        } else {
          toast.dismiss();
          toast.error(result.error?.message || 'Failed to create checkout session. Please try again.');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[CHECKOUT_ERROR]', error);
      }
    }
  };

  const theme = HERO_THEMES[variant] ?? HERO_THEMES.default;

  const badges =
    categorySpecificProps.techStack ??
    categorySpecificProps.models ??
    categorySpecificProps.tools ??
    categorySpecificProps.topics ??
    [];

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

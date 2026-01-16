'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Import all hero components
import { ProgrammingHero } from './category-heroes/programming-hero';
import { AIMLHero } from './category-heroes/ai-ml-hero';
import { DesignHero } from './category-heroes/design-hero';
import { DefaultHero } from './category-heroes/default-hero';

type CategoryLayoutVariant = 'programming' | 'ai-ml' | 'design' | 'business' | 'marketing' | 'data-science' | 'default';

interface HeroWrapperProps {
  variant: CategoryLayoutVariant;
  course: any;
  isEnrolled: boolean;
  userId?: string;
  categorySpecificProps?: {
    techStack?: string[];
    models?: string[];
    tools?: string[];
  };
}

export function HeroWrapper({
  variant,
  course,
  isEnrolled,
  userId,
  categorySpecificProps = {}
}: HeroWrapperProps) {
  const router = useRouter();

  const handleEnroll = async () => {
    if (!userId) {
      toast.error('Please sign in to enroll');
      router.push('/auth/login');
      return;
    }

    // Check if course is free
    const isFree = course.isFree === true || (course.price ?? 0) === 0;

    if (isFree) {
      // Free course - enroll directly via API
      try {
        toast.loading('Enrolling you in the course...');

        const response = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
      // Paid course - create Stripe checkout session
      try {
        toast.loading('Redirecting to checkout...');

        const response = await fetch(`/api/courses/${course.id}/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.url) {
          toast.dismiss();
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          toast.dismiss();
          toast.error('Failed to create checkout session. Please try again.');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[CHECKOUT_ERROR]', error);
      }
    }
  };

  const commonProps = {
    course,
    isEnrolled,
    onEnroll: handleEnroll,
  };

  // Render hero based on variant
  const renderHero = () => {
    switch (variant) {
      case 'programming':
        return (
          <ProgrammingHero
            {...commonProps}
            techStack={categorySpecificProps.techStack}
          />
        );
      case 'ai-ml':
      case 'data-science':
        return (
          <AIMLHero
            {...commonProps}
            models={categorySpecificProps.models}
          />
        );
      case 'design':
        return (
          <DesignHero
            {...commonProps}
            tools={categorySpecificProps.tools}
          />
        );
      default:
        return <DefaultHero {...commonProps} />;
    }
  };

  return (
    <div className="relative">
      {renderHero()}
    </div>
  );
}

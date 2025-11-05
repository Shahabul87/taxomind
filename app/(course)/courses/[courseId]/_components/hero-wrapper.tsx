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

  const handleEnroll = () => {
    if (!userId) {
      toast.error('Please sign in to enroll');
      router.push('/auth/login');
      return;
    }

    // Navigate to checkout or enrollment page
    router.push(`/courses/${course.id}/checkout`);
  };

  const commonProps = {
    course,
    isEnrolled,
    onEnroll: handleEnroll,
  };

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
}

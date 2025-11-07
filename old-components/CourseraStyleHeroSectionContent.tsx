"use client";

import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { QuickActions } from "@/components/sections/QuickActions";

// Coursera-Style Hero Section Content (just the hero carousel and actions)
// This component was replaced by EnhancedHero in the courses page
// Kept here for reference or potential future use
export const CourseraStyleHeroSectionContent = ({ totalLearners }: { totalLearners?: number }) => {
  const heroSlides = [
    {
      id: "1",
      variant: "primary" as const,
      tag: "From Industry Leaders",
      title: "Learn people management skills from industry leaders",
      description: "Become a confident and effective leader with courses from top organizations.",
      ctaLabel: "Enroll Now",
      ctaHref: "/courses?category=management",
    },
    {
      id: "2",
      variant: "secondary" as const,
      tag: "Career Growth",
      title: "Start, switch, or advance your career",
      description: `Grow with ${totalLearners ? (totalLearners >= 1000 ? `${Math.floor(totalLearners / 1000)}k+` : `${totalLearners}+`) : '5,000+'} courses from top organizations.`,
      ctaLabel: "Join for Free",
      ctaHref: "/auth/register",
    },
    {
      id: "3",
      variant: "primary" as const,
      tag: "AI & Data Science",
      title: "Master AI and Machine Learning",
      description: "Learn cutting-edge AI skills from leading experts and build real-world projects.",
      ctaLabel: "Explore Courses",
      ctaHref: "/courses?category=ai",
    },
  ];

  return (
    <div className="relative pt-20 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-16 lg:py-20">
        {/* Hero Carousel */}
        <HeroCarousel slides={heroSlides} autoPlayInterval={6000} />

        {/* Quick Action Tiles */}
        <QuickActions className="mt-12 md:mt-16" />
      </div>
    </div>
  );
};

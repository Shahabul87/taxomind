"use client";

import Link from "next/link";
import { EnhancedHero } from "./EnhancedHero";
import { TrustSection } from "./TrustSection";
import { CategoryHub } from "./CategoryHub";
import { FeaturedShowcase } from "./FeaturedShowcase";
import { LearningExperience } from "./LearningExperience";
import { InstructorSpotlight } from "./InstructorSpotlight";
import { EnterpriseSection } from "./EnterpriseSection";
import { FAQSection } from "./FAQSection";

interface Course {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  imageUrl: string;
  price: number;
  category: { id: string; name: string };
  chaptersCount: number;
  lessonsCount: number;
  duration: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  badges?: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured">;
  isEnrolled?: boolean;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
}

interface Statistics {
  totalCourses: number;
  totalEnrollments: number;
  totalReviews: number;
  averageRating: number;
}

interface EnterpriseCoursesLandingProps {
  courses: Course[];
  categories: Category[];
  instructors: Instructor[];
  statistics: Statistics;
  userId?: string;
}

export function EnterpriseCoursesLanding({
  courses,
  categories,
  instructors,
  statistics
}: EnterpriseCoursesLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Enhanced Hero Section */}
      <EnhancedHero
        statistics={{
          totalCourses: statistics.totalCourses,
          totalEnrollments: statistics.totalEnrollments,
          averageRating: statistics.averageRating
        }}
      />

      {/* Trust & Social Proof */}
      <TrustSection
        statistics={{
          totalEnrollments: statistics.totalEnrollments,
          averageRating: statistics.averageRating
        }}
      />

      {/* Category Exploration Hub */}
      <CategoryHub categories={categories} />

      {/* Featured Courses Showcase */}
      <FeaturedShowcase courses={courses} />

      {/* Learning Experience Features */}
      <LearningExperience />

      {/* Instructor Spotlight */}
      <InstructorSpotlight instructors={instructors} />

      {/* Enterprise Section */}
      <EnterpriseSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join 50,000+ professionals who are already learning with us
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              Start Learning Free
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Course } from '@prisma/client';

// Centralized type for Course card modules to reduce `as any` usage
export type CourseWithMeta = Course & {
  // Pricing & commerce
  price?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  dealEndDate?: Date | string | null;
  spotsRemaining?: number | null;

  // Content & structure
  totalDuration?: number | null; // minutes
  totalHours?: number | null; // derived
  totalResources?: number | null;
  totalExercises?: number | null;
  chapters?: { id: string }[];
  _count?: { enrollments?: number; Enrollment?: number; chapters?: number };

  // Taxonomy & metadata
  category?: { name: string } | null;
  difficulty?: string | null;
  prerequisites?: string | null;

  // Social proof
  reviews?: { id: string; rating: number; createdAt?: Date }[];
  averageRating?: number | null;

  // Growth
  activeLearners?: number | null;
};


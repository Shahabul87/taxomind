export interface CourseCategory {
  id: string;
  name: string;
}

export interface CourseInstructor {
  name: string | null;
  image: string | null;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  slug?: string | null;
  createdAt: Date;
  category: CourseCategory | null;
  enrollmentId: string;
  enrolledAt: Date;
  totalRatings: number;
  averageRating: number;
  totalChapters: number;
  completedChapters: number;
  completionPercentage: number;
  instructor: CourseInstructor;
}

export interface CreatedCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  slug?: string | null;
  createdAt: Date;
  category: CourseCategory | null;
  totalRatings: number;
  averageRating: number;
  totalChapters: number;
  totalEnrolled: number;
}

/** Union type for CourseCard — all fields available via optional access */
export interface CourseCardData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  slug?: string | null;
  createdAt: Date;
  category: CourseCategory | null;
  totalRatings: number;
  averageRating: number;
  totalChapters: number;
  // Enrolled-specific (optional)
  enrollmentId?: string;
  enrolledAt?: Date;
  completedChapters?: number;
  completionPercentage?: number;
  instructor?: CourseInstructor;
  // Created-specific (optional)
  totalEnrolled?: number;
}

export interface CourseFilters {
  category: string;
  progress: string;
  sortBy: string;
  status: string;
}

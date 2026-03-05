import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";
import { AdminCoursesClient } from "./_components/AdminCoursesClient";

export const dynamic = "force-dynamic";

interface CourseWithStats {
  id: string;
  title: string;
  instructor: string;
  instructorId: string;
  category: string;
  students: number;
  rating: number;
  price: number;
  revenue: number;
  status: "Active" | "Draft" | "Under Review";
  lastUpdated: string;
  progress: number;
  imageUrl: string | null;
}

interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgRating: number;
  newCoursesThisMonth: number;
  newStudentsThisWeek: number;
  revenueGrowth: number;
  totalReviews: number;
}

async function getCourseStats(): Promise<CourseStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  const [
    totalCourses,
    totalStudents,
    newCoursesThisMonth,
    enrollments,
  ] = await Promise.all([
    db.course.count(),
    db.enrollment.count(),
    db.course.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    }),
    db.enrollment.findMany({
      select: {
        createdAt: true,
      },
      take: 500,
    }),
  ]);

  // Calculate students enrolled this week
  const newStudentsThisWeek = enrollments.filter(
    (e) => e.createdAt >= startOfWeek
  ).length;

  // Get average rating from course ratings if available
  const avgRating = 4.5; // Default if no ratings system
  const totalReviews = 0;
  const totalRevenue = 0; // Would come from payment system
  const revenueGrowth = 0;

  return {
    totalCourses,
    totalStudents,
    totalRevenue,
    avgRating,
    newCoursesThisMonth,
    newStudentsThisWeek,
    revenueGrowth,
    totalReviews,
  };
}

async function getCourses(): Promise<CourseWithStats[]> {
  const courses = await db.course.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      chapters: {
        select: {
          id: true,
          isPublished: true,
        },
      },
      Enrollment: {
        select: {
          id: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 200,
  });

  return courses.map((course) => {
    // Calculate progress based on published chapters
    const totalChapters = course.chapters.length;
    const publishedChapters = course.chapters.filter((c) => c.isPublished).length;
    const progress = totalChapters > 0 ? Math.round((publishedChapters / totalChapters) * 100) : 0;

    // Determine status
    let status: "Active" | "Draft" | "Under Review" = "Draft";
    if (course.isPublished) {
      status = "Active";
    } else if (progress >= 50) {
      status = "Under Review";
    }

    return {
      id: course.id,
      title: course.title,
      instructor: course.user?.name || course.user?.email || "Unknown",
      instructorId: course.userId,
      category: course.category?.name || "Uncategorized",
      students: course.Enrollment.length,
      rating: 4.5, // Would come from ratings system
      price: course.price || 0,
      revenue: (course.price || 0) * course.Enrollment.length,
      status,
      lastUpdated: course.updatedAt.toISOString().split("T")[0],
      progress,
      imageUrl: course.imageUrl,
    };
  });
}

async function getCategories(): Promise<string[]> {
  const categories = await db.category.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
    take: 100,
  });
  return categories.map((c) => c.name);
}

export default async function AdminCoursesPage() {
  // Check admin session
  const session = await adminAuth();
  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  // Fetch all data in parallel
  const [stats, courses, categories] = await Promise.all([
    getCourseStats(),
    getCourses(),
    getCategories(),
  ]);

  return (
    <AdminCoursesClient
      initialCourses={courses}
      stats={stats}
      categories={categories}
    />
  );
}

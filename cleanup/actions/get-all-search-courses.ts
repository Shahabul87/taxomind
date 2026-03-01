"use server";

import { Category, Course } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";

// type CourseWithProgressWithCategory = Course & {
//   category: Category | null;
//   chapters: { id: string }[];
//   progress: number | null;
// };

type CourseForHomepage = {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    price:number;
    category: {
      id: string;
      name: string;
    } | null;
  };
type GetCourses = {
  userId?: string;
  title?: string;
  categoryId?: string;
};

export const getAllSearchCourses = async (
  params: GetCourses | string = {}
): Promise<CourseForHomepage[]> => {
  // Handle backward compatibility where title was passed as string
  const { title, categoryId } = typeof params === 'string' 
    ? { title: params, categoryId: undefined }
    : params;

  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        title: {
          contains: title,
        },
        categoryId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price:true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return courses as CourseForHomepage[];
  } catch (error: any) {
    console.error('[GET_ALL_SEARCH_COURSES_ERROR]', error);
    return [];
  }
}


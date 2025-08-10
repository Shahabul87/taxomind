import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user?.id;

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
      include: {
        chapters: true,
        attachments: true
      }
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Define sections as individual items for tracking completion
    const sections = {
      titleDesc: Boolean(course.title && course.description),
      learningObj: Boolean(course.whatYouWillLearn && course.whatYouWillLearn.length > 0),
      image: Boolean(course.imageUrl),
      pricing: Boolean(course.price !== null && course.price !== undefined),
      category: Boolean(course.categoryId),
      chapters: Boolean(course.chapters.length > 0),
      attachments: Boolean(course.attachments.length > 0)
    };

    // Calculate completed sections
    const completedSections = Object.values(sections).filter(Boolean).length;
    
    // Allow publishing if at least 2 sections are completed
    const minSectionsRequired = 2;
    const isPublishable = completedSections >= minSectionsRequired;

    if (!isPublishable) {
      return new NextResponse("At least 2 sections must be completed before publishing", { status: 401 });
    }

    const publishedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        isPublished: true,
      }
    });

    return NextResponse.json(publishedCourse);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}
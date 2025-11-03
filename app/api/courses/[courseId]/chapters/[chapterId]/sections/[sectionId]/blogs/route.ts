import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { title, blogUrl, description, rating, thumbnail, siteName, author } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First verify the section exists
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
    });

    if (!section) {
      return new NextResponse("Section not found", { status: 404 });
    }

    // Create the blog with all fields
    const blog = await db.blog.create({
      data: {
        title,
        url: blogUrl,
        description,
        rating: rating ? Number(rating) : null,
        thumbnail: thumbnail || null,
        siteName: siteName || null,
        author: author || null,
        sectionId: params.sectionId,
        userId: session.user.id,
        isPublished: true,
        position: 0,
      },
    });

    return NextResponse.json(blog);
  } catch (error) {
    logger.error("[BLOGS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  try {
    const blogs = await db.blog.findMany({
      where: {
        sectionId: params.sectionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(blogs);
  } catch (error) {
    logger.error("[BLOGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
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
    const user = await currentUser();
    const { title, description, url, author, category } = await req.json();

    // Check if the user is authenticated
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the current user owns the course
    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the specified chapter exists within the course
    const chapterData = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
      },
    });

    if (!chapterData) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    // Check if the specified section exists within the chapter
    const sectionData = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
    });

    if (!sectionData) {
      return new NextResponse("Section not found", { status: 404 });
    }

    // Validate required fields for blog creation
    if (!title || !url || !author || !category) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create a new blog entry in the database
    const newBlog = await db.blog.create({
      data: {
        title,
        description,
        url,
        author,
        category,
        sectionId: params.sectionId, // Link blog to the section
        userId: user.id, // Associate blog with the current user
      },
    });

    // Return the newly created blog information
    return new NextResponse(JSON.stringify(newBlog), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    logger.error("[POST ERROR] Courses/Chapter/Section ID:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { blogId, title, description, url, author, category, isPublished } = await req.json();

    // Check if the user is authenticated
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate required fields for blog update
    if (!blogId || !title || !url) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Retrieve all blogs associated with the given section
    const blogs = await db.blog.findMany({
      where: {
        sectionId: params.sectionId,
        section: {
          chapterId: params.chapterId,
          chapter: {
            courseId: params.courseId,
            course: {
              userId: user.id, // Ensure the course belongs to the current user
            },
          },
        },
      },
      take: 200,
    });

    // Find the blog with the specified blogId
    const blog = blogs.find((blg) => blg.id === blogId);

    // If the blog doesn't exist or doesn't match, return an error
    if (!blog) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Update the blog information in the database
    const updatedBlog = await db.blog.update({
      where: { id: blogId },
      data: {
        title,
        description: description ?? null, // Accept null for optional fields
        url,
        author: author ?? null,
        category: category ?? null,
        isPublished: isPublished ?? false,
      },
    });

    // Return the updated blog information
    return new NextResponse(JSON.stringify(updatedBlog), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("[PATCH ERROR] Blog Update:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { blogId } = await req.json(); // Extract blogId from the request payload

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all blogs associated with the sectionId
    const blogs = await db.blog.findMany({
      where: {
        sectionId: params.sectionId,
        section: {
          chapterId: params.chapterId,
          chapter: {
            courseId: params.courseId,
            course: {
              userId: user.id, // Ensure the course belongs to the current user
            },
          },
        },
      },
      take: 200,
    });

    // Find the specific blog to delete by its ID
    const blogToDelete = blogs.find((blog) => blog.id === blogId);

    if (!blogToDelete) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Delete the blog
    const deletedBlog = await db.blog.delete({
      where: {
        id: blogToDelete.id,
      },
    });

    return NextResponse.json(deletedBlog);
  } catch (error) {
    logger.error("[DELETE_BLOG_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


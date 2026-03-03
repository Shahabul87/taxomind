import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, description, url, duration, rating } = await req.json();

    // Check if the user is authenticated
    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    // Check if the current user owns the course
    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      },
    });

    if (!ownCourse) {
      return ApiResponses.unauthorized();
    }

    // Check if the specified chapter exists within the course
    const chapterData = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
      },
    });

    if (!chapterData) {
      return ApiResponses.notFound("Chapter not found");
    }

    // Check if the specified section exists within the chapter
    const sectionData = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
    });

    if (!sectionData) {
      return ApiResponses.notFound("Section not found");
    }

    // Validate required fields for video creation
    if (!title || !url || !duration || !rating) {
      return ApiResponses.badRequest("Missing required fields");
    }

    // Create a new video entry in the database
    const newVideo = await db.video.create({
      data: {
        title,
        description,
        url,
        duration,
        rating: parseInt(rating),
        position: 0,
        sectionId: params.sectionId, // Link video to the section
        userId: user.id, // Associate video with the current user
        isPublished: true,
      },
    });

    // Return the newly created video information
    return new NextResponse(JSON.stringify(newVideo), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    logger.error("[POST ERROR] Courses/Chapter/Section ID:", error);
    return ApiResponses.internal();
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { videoId, title, description, url, duration, rating, position, category, isPublished } = await req.json();

    // Check if the user is authenticated
    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    // Validate required fields for video update
    if (!videoId || !title || !url) {
      return ApiResponses.badRequest("Missing required fields");
    }

    // Retrieve all videos associated with the given section
    const videos = await db.video.findMany({
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

    // Find the video with the specified videoId
    const video = videos.find((vid) => vid.id === videoId);

    // If the video doesn't exist or doesn't match, return an error
    if (!video) {
      return ApiResponses.notFound("Unauthorized or Not Found");
    }

    // Update the video information in the database
    const updatedVideo = await db.video.update({
      where: { id: videoId },
      data: {
        title,
        description,
        url,
        duration: duration ?? null,
        rating: rating ?? null,
        position,
        isPublished: isPublished ?? false,
      },
    });

    // Return the updated video information
    return new NextResponse(JSON.stringify(updatedVideo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("[PATCH ERROR] Video Update:", error);
    return ApiResponses.internal();
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { videoId } = await req.json(); // Extract videoId from the request payload

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    // Fetch all videos associated with the sectionId
    const videos = await db.video.findMany({
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

    // Find the specific video to delete by its ID
    const videoToDelete = videos.find((video) => video.id === videoId);

    if (!videoToDelete) {
      return ApiResponses.notFound("Unauthorized or Not Found");
    }

    // Delete the video
    const deletedVideo = await db.video.delete({
      where: {
        id: videoToDelete.id,
      },
    });

    return NextResponse.json(deletedVideo);
  } catch (error) {
    logger.error("[DELETE_VIDEO_ERROR]", error);
    return ApiResponses.internal();
  }
}


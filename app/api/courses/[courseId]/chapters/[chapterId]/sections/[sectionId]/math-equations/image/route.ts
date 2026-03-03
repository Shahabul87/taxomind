import { NextResponse } from "next/server";

import { v2 as cloudinary } from 'cloudinary';

import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    const { courseId, chapterId, sectionId } = await params;

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ApiResponses.badRequest("No file uploaded");
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return ApiResponses.badRequest("File must be an image");
    }

    // Validate file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      return ApiResponses.badRequest("File size must be less than 4MB");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64
    const fileStr = buffer.toString('base64');

    // Upload to Cloudinary with specific folder for math equations
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.type};base64,${fileStr}`,
        {
          folder: `math-equations/${courseId}/${chapterId}/${sectionId}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error:", error);
            reject(error);
          }
          resolve(result);
        }
      );
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("[MATH_EQUATION_IMAGE_UPLOAD]", error);
    return ApiResponses.internal();
  }
} 
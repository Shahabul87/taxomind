import { NextResponse } from "next/server";

import { v2 as cloudinary } from 'cloudinary';

import { auth } from "@/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    const { courseId } = await params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64
    const fileStr = buffer.toString('base64');

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.type};base64,${fileStr}`,
        {
          folder: 'course-images',
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        }
      );
    });

    // Log the URL for debugging in development
    if (process.env.NODE_ENV === 'development' && result && typeof result === 'object') {
      logger.info('[COURSE_IMAGE_UPLOAD] Cloudinary URL:', {
        secure_url: (result as any).secure_url,
        url: (result as any).url,
      });
    }

    // Return a consistent format that the frontend expects
    // Cloudinary returns secure_url, but frontend expects url
    return NextResponse.json({
      url: (result as any).secure_url || (result as any).url,
      secure_url: (result as any).secure_url,
      public_id: (result as any).public_id
    });
  } catch (error) {
    logger.error("[COURSE_IMAGE_UPLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
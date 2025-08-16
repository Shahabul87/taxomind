import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

// Force Node.js runtime
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
export const POST = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});> }
) {
  try {
    const session = await auth();
    const { courseId, chapterId, sectionId } = await params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new NextResponse("File must be an image", { status: 400 });
    }

    // Validate file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      return new NextResponse("File size must be less than 4MB", { status: 400 });
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
  } catch (error: any) {
    logger.error("[MATH_EQUATION_IMAGE_UPLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
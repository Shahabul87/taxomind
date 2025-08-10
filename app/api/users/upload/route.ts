import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    try {
      // Use a specialized upload function based on file size
      const result = await uploadToCloudinary(file);
      return NextResponse.json(result);
    } catch (uploadError) {
      logger.error("Failed to upload file:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("[COURSE_IMAGE_UPLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Helper function to safely upload to Cloudinary
async function uploadToCloudinary(file: File) {
  // For small files we can use the buffer approach
  if (file.size <= 2 * 1024 * 1024) { // 2MB limit for base64 approach
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileStr = buffer.toString('base64');

    return new Promise((resolve, reject) => {
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
  } else {
    // For larger files, use a stream approach
    const buffer = Buffer.from(await file.arrayBuffer());
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'course-images',
          resource_type: "auto" // Auto-detect resource type
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
  }
} 
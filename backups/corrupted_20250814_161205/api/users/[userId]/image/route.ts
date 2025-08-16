import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
export const POST = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 20, window: 60000 },
  auditLog: false
});> }) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.id !== params.userId) {
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
          folder: 'profile-images',
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        }
      );
    });

    // Update user profile in database
    const updatedUser = await db.user.update({
      where: {
        id: params.userId
      },
      data: {
        image: (result as any).secure_url
      }
    });

    return NextResponse.json({ url: (result as any).secure_url });
  } catch (error: any) {
    logger.error("[PROFILE_IMAGE_UPLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
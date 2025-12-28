import { NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import {
  ApiError,
  createSuccessResponse as createApiSuccess,
  createErrorResponse as createApiError,
} from '@/lib/api/api-responses';
import { logCourseImageUpload } from '@/lib/audit/course-audit';

// Force Node.js runtime
export const runtime = 'nodejs';

// =============================================================================
// File Upload Configuration
// =============================================================================
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
  rateLimit: {
    limit: 50,          // 50 uploads
    windowMs: 3600000,  // per hour
  },
};

// =============================================================================
// Cloudinary Configuration
// =============================================================================
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================================================
// Helper: Validate File
// =============================================================================
function validateFile(file: File): { valid: true } | { valid: false; error: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    const maxSizeMB = UPLOAD_CONFIG.maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
    };
  }

  // Check file type
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type as typeof UPLOAD_CONFIG.allowedMimeTypes[number])) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP, GIF.`,
    };
  }

  // Check for suspicious file names (basic security)
  const fileName = file.name.toLowerCase();
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid file name detected.',
    };
  }

  return { valid: true };
}

// =============================================================================
// POST - Upload Course Image (Enterprise-Grade)
// =============================================================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Authentication Check
    const session = await auth();
    const { courseId } = await params;

    if (!session?.user?.id) {
      logger.warn("[COURSE_IMAGE_UPLOAD] Unauthorized upload attempt");
      return createApiError(ApiError.unauthorized('Authentication required'));
    }

    const userId = session.user.id;

    // 2. Validate courseId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return createApiError(ApiError.badRequest('Invalid course ID format'));
    }

    // 3. Rate Limiting
    const clientId = getClientIdentifier(req, userId);
    const rateLimitResult = await rateLimit(
      `image-upload:${clientId}`,
      UPLOAD_CONFIG.rateLimit.limit,
      UPLOAD_CONFIG.rateLimit.windowMs
    );

    if (!rateLimitResult.success) {
      logger.warn("[COURSE_IMAGE_UPLOAD] Rate limit exceeded", { userId });
      return createApiError(
        ApiError.tooManyRequests(
          `Upload limit reached. Try again in ${rateLimitResult.retryAfter} seconds.`
        ),
        {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
        }
      );
    }

    // 4. Verify course ownership
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, userId: true, imageUrl: true },
    });

    if (!course) {
      return createApiError(ApiError.notFound('Course not found'));
    }

    if (course.userId !== userId) {
      logger.warn("[COURSE_IMAGE_UPLOAD] Unauthorized - not course owner", {
        courseId,
        userId,
        ownerId: course.userId,
      });
      return createApiError(ApiError.forbidden('You can only upload images to your own courses'));
    }

    // 5. Parse form data and get file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createApiError(ApiError.badRequest('No file uploaded'));
    }

    // 6. Validate file (size, type, name)
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorMessage = validation.error;
      logger.warn("[COURSE_IMAGE_UPLOAD] File validation failed", {
        error: errorMessage,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      return createApiError(ApiError.badRequest(errorMessage));
    }

    // 7. Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileStr = buffer.toString('base64');

    // 8. Upload to Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.type};base64,${fileStr}`,
        {
          folder: 'course-images',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' }, // Max dimensions
            { quality: 'auto:good' }, // Auto quality optimization
            { fetch_format: 'auto' }, // Auto format (webp when supported)
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );
    });

    // 9. Update course with new image URL
    await db.course.update({
      where: { id: courseId },
      data: { imageUrl: result.secure_url },
    });

    // 10. Audit logging - track image upload for compliance
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      req.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await logCourseImageUpload(courseId, {
      userId,
      ipAddress,
      userAgent,
    }, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      cloudinaryPublicId: result.public_id,
      imageFormat: result.format,
      imageWidth: result.width,
      imageHeight: result.height,
    }).catch(err => {
      // Don't fail the request if audit logging fails
      logger.warn("[COURSE_IMAGE_UPLOAD] Audit logging failed", { error: err });
    });

    // 11. Log success (without sensitive data)
    const responseTime = Date.now() - startTime;
    logger.info("[COURSE_IMAGE_UPLOAD] Upload successful", {
      courseId,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      responseTime,
    });

    // 12. Return standardized success response
    return createApiSuccess(
      {
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      },
      200,
      undefined,
      {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error("[COURSE_IMAGE_UPLOAD] Upload failed", {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });

    // Don't leak internal error details
    return createApiError(
      ApiError.internal('Failed to upload image. Please try again.')
    );
  }
} 
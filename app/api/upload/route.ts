import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { successResponse, apiErrors } from "@/lib/utils/api-response";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  secure_url?: string;
  [key: string]: unknown;
}

// Define maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await currentUser();

  if (!user?.id) {
    return apiErrors.unauthorized();
  }

  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();

    // Handle both single and multiple files
    const files = formData.getAll("file"); // Gets single or multiple files from the key "file"

    if (!files || files.length === 0) {
      return apiErrors.badRequest("No files uploaded");
    }

    const uploadedResults: CloudinaryUploadResult[] = [];

    // Iterate over each file and upload to Cloudinary
    for (const file of files) {
      if (!(file instanceof File)) {
        return apiErrors.badRequest("Invalid file format");
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return apiErrors.badRequest(
          `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        );
      }

      try {
        // Use a more efficient approach to handle the file
        const result = await uploadFileToCloudinary(file);
        uploadedResults.push(result);
      } catch (uploadError) {
        logger.error("Failed to upload file:", uploadError);
        return apiErrors.internal("Failed to upload file. Please try again.");
      }
    }

    // Return all uploaded files
    return successResponse({
      message: "Files uploaded successfully",
      uploadedFiles: uploadedResults.map(file => ({
        publicId: file.public_id,
        url: file.secure_url,
      })),
    });

  } catch (error) {
    return apiErrors.internal("Upload image failed");
  }
}

// Helper function to upload a file to Cloudinary
async function uploadFileToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  // For small files, we can use the direct approach
  if (file.size <= 2 * 1024 * 1024) { // 2MB
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "next-cloudinary-uploads" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        }
      );
      uploadStream.end(buffer);
    });
  } else {
    // For larger files, use a chunk-based approach
    // Convert file to base64 in chunks if necessary, or use stream API
    const buffer = Buffer.from(await file.arrayBuffer());
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: "next-cloudinary-uploads",
          resource_type: "auto" // Auto-detect resource type
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      ).end(buffer);
    });
  }
}

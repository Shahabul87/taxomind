import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
}

async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        resource_type: 'auto',
        folder: 'certificates',
        format: mimeType === 'application/pdf' ? 'pdf' : 'auto',
        access_mode: 'public',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        invalidate: true,
        tags: ['certificate', 'lms']
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload file'));
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

async function uploadImage(
  buffer: Buffer,
  fileName: string,
  folder: string = 'images'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: fileName.replace(/\.[^/.]+$/, ''),
        folder,
        resource_type: 'image',
        access_mode: 'public',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image'));
        } else {
          resolve(result as UploadResult);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

async function deleteFile(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    return false;
  }
}

async function getFileUrl(publicId: string): Promise<string> {
  return cloudinary.url(publicId, {
    resource_type: 'auto',
    secure: true
  });
}

async function generateThumbnail(publicId: string): Promise<string> {
  return cloudinary.url(publicId, {
    resource_type: 'image',
    transformation: [
      { width: 300, height: 200, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    secure: true
  });
}

// For local development fallback
async function uploadFileLocal(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const fs = require('fs');
  const path = require('path');
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  
  try {
    fs.writeFileSync(filePath, buffer);
    return `/uploads/certificates/${fileName}`;
  } catch (error) {
    logger.error('Local upload error:', error);
    throw new Error('Failed to upload file locally');
  }
}

export {
  uploadFile,
  uploadImage,
  deleteFile,
  getFileUrl,
  generateThumbnail,
  uploadFileLocal
};

export default uploadFile;
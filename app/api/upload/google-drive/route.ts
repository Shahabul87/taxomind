import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/google-drive';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

/** 50 MB */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

export async function POST(req: NextRequest) {
  const user = await currentUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            'Unsupported file type. Allowed: PDF, DOC/X, XLS/X, PPT/X, TXT, CSV, PNG, JPG, GIF, WebP, SVG.',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadFile(buffer, file.name, file.type);

    return NextResponse.json({
      url: result.webViewLink,
      fileId: result.fileId,
      name: result.name,
      mimeType: result.mimeType,
      size: result.size,
    });
  } catch (error) {
    logger.error('[Upload/GoogleDrive] Upload failed', { error });
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

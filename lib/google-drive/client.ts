/**
 * Google Drive Integration — Service Account Client
 *
 * Uploads course resource files to a shared Google Drive folder
 * using a service account (no user OAuth needed).
 */

import { google, drive_v3 } from 'googleapis';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
/** Workspace user email the service account impersonates via domain-wide delegation */
const IMPERSONATE_USER = process.env.GOOGLE_DRIVE_IMPERSONATE_USER;

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DriveUploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  size: number;
}

// ---------------------------------------------------------------------------
// Client Factory
// ---------------------------------------------------------------------------

function createDriveClient(): drive_v3.Drive {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !FOLDER_ID) {
    throw new Error(
      'Google Drive service account credentials are not configured. ' +
        'Set GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID.'
    );
  }

  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: [DRIVE_SCOPE],
    subject: IMPERSONATE_USER || undefined,
  });

  return google.drive({ version: 'v3', auth });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload a file buffer to the configured Google Drive folder.
 *
 * The file is made viewable by anyone with the link so students can
 * open it directly from the LMS.
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DriveUploadResult> {
  const drive = createDriveClient();

  // 1. Upload file into the shared folder
  const { data: file } = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [FOLDER_ID!],
    },
    media: {
      mimeType,
      body: bufferToStream(buffer),
    },
    fields: 'id,name,mimeType,webViewLink,webContentLink,size',
  });

  if (!file.id) {
    throw new Error('Google Drive upload succeeded but returned no file ID');
  }

  // 2. Set "anyone with the link can view" permission
  await drive.permissions.create({
    fileId: file.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    fileId: file.id,
    name: file.name ?? fileName,
    mimeType: file.mimeType ?? mimeType,
    webViewLink: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
    webContentLink: file.webContentLink ?? `https://drive.google.com/uc?id=${file.id}&export=download`,
    size: Number(file.size ?? buffer.length),
  };
}

/**
 * Delete a file from Google Drive by its file ID.
 *
 * Errors are logged but not re-thrown — an orphaned Drive file is
 * preferable to a stuck DB record.
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    const drive = createDriveClient();
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    logger.error('[GoogleDrive] Failed to delete file', { fileId, error });
    return false;
  }
}

/**
 * Return the view URL for a Google Drive file.
 */
export function getFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Node Buffer into a Readable stream that the googleapis
 * media upload accepts.
 */
function bufferToStream(buffer: Buffer): import('stream').Readable {
  const { Readable } = require('stream') as typeof import('stream');
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

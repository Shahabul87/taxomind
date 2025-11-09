/**
 * YouTube Utility Functions
 * Handles YouTube URL parsing and validation
 */

/**
 * Extract YouTube video ID from URL
 * Supports multiple URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // If it's already just the ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Get YouTube thumbnail URL
 * Quality options: default, hq, mq, sd, maxres
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Get YouTube embed URL with security parameters
 */
export function getYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  controls?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
  showinfo?: boolean;
  origin?: string;
}): string {
  const params = new URLSearchParams({
    autoplay: options?.autoplay ? '1' : '0',
    controls: options?.controls !== false ? '1' : '0',
    modestbranding: options?.modestbranding !== false ? '1' : '0',
    rel: options?.rel ? '1' : '0',
    showinfo: options?.showinfo ? '1' : '0',
    ...(options?.origin && { origin: options.origin }),
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Format video duration (seconds to MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

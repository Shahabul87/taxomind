/**
 * Cloudinary Utility Functions
 *
 * Helper functions for handling Cloudinary image URLs
 * to ensure compatibility with Next.js Image component
 */

/**
 * Ensures a Cloudinary URL uses HTTPS protocol
 * @param url - The Cloudinary URL to process
 * @returns The URL with HTTPS protocol
 */
export function ensureHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Replace http:// with https:// if present
  if (url.startsWith('http://')) {
    return url.replace(/^http:\/\//i, 'https://');
  }

  // If URL doesn't start with a protocol, assume it's already HTTPS
  if (!url.startsWith('https://')) {
    // Handle relative URLs or malformed URLs
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    // If it's a Cloudinary URL without protocol
    if (url.includes('cloudinary.com')) {
      return `https://${url}`;
    }
  }

  return url;
}

/**
 * Validates if a URL is a valid Cloudinary URL
 * @param url - The URL to validate
 * @returns True if it's a valid Cloudinary URL
 */
export function isValidCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    // Check if it's from Cloudinary domain
    return urlObj.hostname.includes('cloudinary.com') ||
           urlObj.hostname === 'res.cloudinary.com';
  } catch {
    // If URL parsing fails, check if it contains cloudinary domain
    return url.includes('cloudinary.com');
  }
}

/**
 * Gets the secure Cloudinary URL from a response object
 * @param result - The Cloudinary upload response
 * @returns The secure URL or null
 */
export function getSecureCloudinaryUrl(result: any): string | null {
  if (!result) return null;

  // Prefer secure_url over url
  const url = result.secure_url || result.url;
  return ensureHttpsUrl(url);
}

/**
 * Transforms a Cloudinary URL with optimizations
 * @param url - The original Cloudinary URL
 * @param options - Transformation options
 * @returns The transformed URL
 */
export function transformCloudinaryUrl(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string | null {
  if (!url || !isValidCloudinaryUrl(url)) return ensureHttpsUrl(url);

  const secureUrl = ensureHttpsUrl(url);
  if (!secureUrl) return null;

  try {
    // Parse the URL
    const urlParts = secureUrl.split('/upload/');
    if (urlParts.length !== 2) return secureUrl;

    // Build transformation string
    const transformations: string[] = [];
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    // If no transformations, return original
    if (transformations.length === 0) return secureUrl;

    // Reconstruct URL with transformations
    return `${urlParts[0]}/upload/${transformations.join(',')}/${urlParts[1]}`;
  } catch {
    return secureUrl;
  }
}

/**
 * Gets a fallback image URL for when Cloudinary images fail to load
 * @param type - The type of fallback image (course, user, etc.)
 * @returns A data URL or placeholder image URL
 */
export function getFallbackImageUrl(type: 'course' | 'user' | 'default' = 'default'): string {
  const fallbacks = {
    course: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPGRlZnM+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjM2NkYxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQTg1NUY3O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgIDwvZGVmcz4KICAgICAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ3JhZDEpIi8+CiAgICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgICAgIENvdXJzZQogICAgICA8L3RleHQ+CiAgICA8L3N2Zz4=",
    user: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPGRlZnM+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkMiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjM2NkYxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQTg1NUY3O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgIDwvZGVmcz4KICAgICAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIyMDAiIGZpbGw9InVybCgjZ3JhZDIpIi8+CiAgICAgIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iNTAiIGZpbGw9IndoaXRlIi8+CiAgICAgIDxwYXRoIGQ9Ik0gMTIwIDI1MCBRIDIwMCAzMDAgMjgwIDI1MCBMIDI4MCAzNTAgUSAyMDAgNDAwIDEyMCAzNTAgWiIgZmlsbD0id2hpdGUiLz4KICAgIDwvc3ZnPg==",
    default: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNlMmU4ZjAiLz4KICAgICAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMjQiPgogICAgICAgIE5vIEltYWdlCiAgICAgIDwvdGV4dD4KICAgIDwvc3ZnPg=="
  };

  return fallbacks[type] || fallbacks.default;
}
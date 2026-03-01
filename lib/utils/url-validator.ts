/**
 * URL Validation Utilities
 *
 * Prevents SSRF (Server-Side Request Forgery) attacks by validating
 * URLs before making server-side fetch requests.
 */

const PRIVATE_IP_RANGES = [
  /^10\./,               // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,         // 192.168.0.0/16
  /^169\.254\./,         // Link-local
  /^127\./,              // Loopback
  /^0\./,                // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Shared address space
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  '::1',
  '::',
  '[::1]',
  '[::ffff:127.0.0.1]',
  'metadata.google.internal',         // GCP metadata
  'metadata.google.internal.',
  '169.254.169.254',                   // AWS/GCP/Azure metadata
];

/**
 * Check if a hostname resolves to a private/internal IP address.
 */
export function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.includes(lower)) {
    return true;
  }

  // Block IPv6 addresses embedded in URLs
  if (lower.startsWith('[') || lower.includes('::')) {
    return true;
  }

  // Check if hostname is an IP in private ranges
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a URL is safe for server-side fetching.
 * Returns null if valid, or an error message if invalid.
 */
export function validateFetchUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL format';
  }

  // Only allow HTTP(S)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only HTTP and HTTPS protocols are allowed';
  }

  // Block private/internal hosts
  if (isPrivateHost(parsed.hostname)) {
    return 'URL points to a private or internal address';
  }

  // Block URLs with credentials
  if (parsed.username || parsed.password) {
    return 'URLs with credentials are not allowed';
  }

  return null;
}

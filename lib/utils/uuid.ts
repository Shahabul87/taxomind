/**
 * UUID generation utility that works in both server and client environments
 */

/**
 * Generate a UUID-like string that works in both browser and Node.js
 * Uses crypto.randomUUID() when available (Node.js), falls back to a custom implementation
 */
export function generateUUID(): string {
  // Check if we're on the server and crypto.randomUUID is available
  if (typeof window === 'undefined') {
    try {
      const crypto = require('crypto');
      if (crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (error) {
      // Fall through to browser implementation
    }
  }

  // Browser-compatible UUID v4 generation
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a shorter unique ID for non-cryptographic purposes
 */
export function generateShortId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a prefixed unique ID
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${generateShortId()}`;
}
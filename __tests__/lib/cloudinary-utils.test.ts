/**
 * Tests for Cloudinary Utilities
 * Source: lib/cloudinary-utils.ts
 */

import {
  ensureHttpsUrl,
  isValidCloudinaryUrl,
  isCloudinaryUrl,
  getSecureCloudinaryUrl,
  transformCloudinaryUrl,
  getFallbackImageUrl,
} from '@/lib/cloudinary-utils';

describe('Cloudinary Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureHttpsUrl', () => {
    it('converts http to https', () => {
      expect(ensureHttpsUrl('http://res.cloudinary.com/demo/image.jpg')).toBe(
        'https://res.cloudinary.com/demo/image.jpg'
      );
    });

    it('returns null for null/undefined input', () => {
      expect(ensureHttpsUrl(null)).toBeNull();
      expect(ensureHttpsUrl(undefined)).toBeNull();
    });

    it('returns https URLs unchanged', () => {
      const url = 'https://res.cloudinary.com/demo/image.jpg';
      expect(ensureHttpsUrl(url)).toBe(url);
    });

    it('handles protocol-relative URLs', () => {
      expect(ensureHttpsUrl('//res.cloudinary.com/demo/image.jpg')).toBe(
        'https://res.cloudinary.com/demo/image.jpg'
      );
    });
  });

  describe('isValidCloudinaryUrl', () => {
    it('validates a Cloudinary URL', () => {
      expect(isValidCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/v1/photo.jpg')).toBe(true);
    });

    it('returns false for non-Cloudinary URL', () => {
      expect(isValidCloudinaryUrl('https://example.com/photo.jpg')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidCloudinaryUrl(null)).toBe(false);
    });
  });

  describe('isCloudinaryUrl', () => {
    it('detects cloudinary.com in URL', () => {
      expect(isCloudinaryUrl('https://res.cloudinary.com/demo/photo.jpg')).toBe(true);
    });

    it('returns false for non-cloudinary URL', () => {
      expect(isCloudinaryUrl('https://s3.amazonaws.com/photo.jpg')).toBe(false);
    });
  });

  describe('getSecureCloudinaryUrl', () => {
    it('prefers secure_url from result', () => {
      const result = { secure_url: 'https://res.cloudinary.com/secure.jpg', url: 'http://res.cloudinary.com/insecure.jpg' };
      expect(getSecureCloudinaryUrl(result)).toBe('https://res.cloudinary.com/secure.jpg');
    });

    it('falls back to url field', () => {
      const result = { url: 'http://res.cloudinary.com/photo.jpg' };
      expect(getSecureCloudinaryUrl(result)).toBe('https://res.cloudinary.com/photo.jpg');
    });

    it('returns null for null result', () => {
      expect(getSecureCloudinaryUrl(null)).toBeNull();
    });
  });

  describe('transformCloudinaryUrl', () => {
    it('adds width and height transformations', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg';
      const result = transformCloudinaryUrl(url, { width: 400, height: 300 });
      expect(result).toContain('w_400');
      expect(result).toContain('h_300');
    });

    it('returns original URL for non-cloudinary URLs', () => {
      const url = 'https://example.com/photo.jpg';
      expect(transformCloudinaryUrl(url)).toBe(url);
    });

    it('returns null for null input', () => {
      expect(transformCloudinaryUrl(null)).toBeNull();
    });
  });

  describe('getFallbackImageUrl', () => {
    it('returns course fallback', () => {
      const url = getFallbackImageUrl('course');
      expect(url).toContain('data:image/svg+xml');
    });

    it('returns user fallback', () => {
      const url = getFallbackImageUrl('user');
      expect(url).toContain('data:image/svg+xml');
    });

    it('returns default fallback', () => {
      const url = getFallbackImageUrl();
      expect(url).toContain('data:image/svg+xml');
    });
  });
});

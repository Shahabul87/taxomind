import { needsRehashing } from '@/lib/passwordUtils';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('passwordUtils - Basic Functionality', () => {
  describe('needsRehashing', () => {
    it('should return false for noble hash format', () => {
      const nobleHash = 'noble:c2FsdA==:aGFzaA==';
      expect(needsRehashing(nobleHash)).toBe(false);
    });

    it('should return true for bcrypt hash format', () => {
      const bcryptHash = '$2b$10$example.bcrypt.hash.here';
      expect(needsRehashing(bcryptHash)).toBe(true);
    });

    it('should return true for unknown hash format', () => {
      const unknownHash = 'some-other-format';
      expect(needsRehashing(unknownHash)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(needsRehashing('')).toBe(true);
    });

    it('should return true for null or undefined', () => {
      expect(needsRehashing(null as any)).toBe(true);
      expect(needsRehashing(undefined as any)).toBe(true);
    });

    it('should handle various bcrypt format prefixes', () => {
      const bcryptFormats = [
        '$2a$10$example.hash',
        '$2b$10$example.hash', 
        '$2y$10$example.hash'
      ];

      bcryptFormats.forEach(hash => {
        expect(needsRehashing(hash)).toBe(true);
      });
    });

    it('should handle noble hash with different base64 content', () => {
      const nobleHashes = [
        'noble:abcdef123456:ghijkl789012',
        'noble:MTIzNDU2:Nzg5MDEyMzQ=',
        'noble:dGVzdA==:c2FsdGVk'
      ];

      nobleHashes.forEach(hash => {
        expect(needsRehashing(hash)).toBe(false);
      });
    });

    it('should be case sensitive for noble prefix', () => {
      expect(needsRehashing('Noble:test:test')).toBe(true);
      expect(needsRehashing('NOBLE:test:test')).toBe(true);
      expect(needsRehashing('noble:test:test')).toBe(false);
    });

    it('should handle hash with noble substring but not prefix', () => {
      expect(needsRehashing('not-noble:test:test')).toBe(true);
      expect(needsRehashing('test-noble:test:test')).toBe(true);
      expect(needsRehashing('testnoble:test:test')).toBe(true);
    });
  });
});
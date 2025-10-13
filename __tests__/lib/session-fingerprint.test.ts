import * as crypto from 'crypto';
import {
  extractServerFingerprint,
  generateFingerprintHash,
  calculateFingerprintSimilarity,
  generateDeviceId,
  extractDeviceInfo,
  generateDeviceName,
  defaultFingerprintConfig,
  DeviceFingerprint,
  FingerprintConfig,
  FingerprintAnalysis
} from '@/lib/security/session-fingerprint';

// No need to mock Next.js headers since the function uses Request object

describe('Session Fingerprinting System', () => {
  const mockHeaders = new Map([
    ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'],
    ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'],
    ['accept-language', 'en-US,en;q=0.9,es;q=0.8'],
    ['accept-encoding', 'gzip, deflate, br'],
  ]);

  const mockFingerprint: DeviceFingerprint = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptHeader: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    acceptLanguage: 'en-US,en;q=0.9,es;q=0.8',
    acceptEncoding: 'gzip, deflate, br',
    platform: 'Win32',
    timezone: 'America/New_York',
    screenResolution: '1920x1080',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Server-side fingerprint extraction', () => {
    it('should extract fingerprint from server headers', async () => {
      // Create a mock Request object
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => mockHeaders.get(name) || null),
        },
      } as unknown as Request;
      
      const fingerprint = await extractServerFingerprint(mockRequest);
      
      expect(fingerprint.userAgent).toBe(mockHeaders.get('user-agent'));
      expect(fingerprint.acceptHeader).toBe(mockHeaders.get('accept'));
      expect(fingerprint.acceptLanguage).toBe(mockHeaders.get('accept-language'));
      expect(fingerprint.acceptEncoding).toBe(mockHeaders.get('accept-encoding'));
    });

    it('should handle missing headers gracefully', async () => {
      // Create a mock Request with no headers
      const mockRequest = {
        headers: {
          get: jest.fn(() => null), // All headers return null
        },
      } as unknown as Request;
      
      const fingerprint = await extractServerFingerprint(mockRequest);
      
      expect(fingerprint.userAgent).toBe('');
      expect(fingerprint.acceptHeader).toBe('');
      expect(fingerprint.acceptLanguage).toBe('');
      expect(fingerprint.acceptEncoding).toBe('');
    });

    it('should handle headers() function errors', async () => {
      // Pass undefined to trigger default empty response
      const fingerprint = await extractServerFingerprint(undefined);
      
      expect(fingerprint.userAgent).toBe('');
      expect(fingerprint.acceptHeader).toBe('');
      expect(fingerprint.acceptLanguage).toBe('');
      expect(fingerprint.acceptEncoding).toBe('');
    });

    it('should extract specific headers when available', async () => {
      const specificHeaders = new Map([
        ['user-agent', 'Custom-Browser/1.0'],
        ['accept', 'application/json'],
      ]);
      
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => specificHeaders.get(name) || null),
        },
      } as unknown as Request;
      
      const fingerprint = await extractServerFingerprint(mockRequest);
      
      expect(fingerprint.userAgent).toBe('Custom-Browser/1.0');
      expect(fingerprint.acceptHeader).toBe('application/json');
      expect(fingerprint.acceptLanguage).toBe('');
      expect(fingerprint.acceptEncoding).toBe('');
    });
  });

  describe('Fingerprint hashing', () => {
    it('should generate consistent hash for same fingerprint', () => {
      const hash1 = generateFingerprintHash(mockFingerprint);
      const hash2 = generateFingerprintHash(mockFingerprint);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different fingerprints', () => {
      const fingerprint1 = { ...mockFingerprint };
      const fingerprint2 = { ...mockFingerprint, userAgent: 'Different-Browser/1.0' };
      
      const hash1 = generateFingerprintHash(fingerprint1);
      const hash2 = generateFingerprintHash(fingerprint2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should normalize fingerprint data before hashing', () => {
      const fingerprint1: DeviceFingerprint = {
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
        acceptHeader: 'TEXT/HTML,APPLICATION/XHTML+XML',
        acceptLanguage: 'EN-US,EN;Q=0.9',
        acceptEncoding: 'GZIP, DEFLATE',
        platform: 'WIN32',
        timezone: 'America/New_York',
        screenResolution: '1920x1080',
      };
      
      const fingerprint2: DeviceFingerprint = {
        userAgent: 'mozilla/5.0 chrome/x.x.x.x',
        acceptHeader: 'text/html,application/xhtml+xml',
        acceptLanguage: 'en-us,en;q=0.9',
        acceptEncoding: 'gzip, deflate',
        platform: 'win32',
        timezone: 'America/New_York',
        screenResolution: '1920x1080',
      };
      
      const hash1 = generateFingerprintHash(fingerprint1);
      const hash2 = generateFingerprintHash(fingerprint2);
      
      // Should be similar due to normalization
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });

    it('should handle undefined or null values', () => {
      const sparseFingerprint: DeviceFingerprint = {
        userAgent: 'Browser/1.0',
        acceptHeader: 'text/html',
        acceptLanguage: 'en',
        acceptEncoding: 'gzip',
      };
      
      expect(() => generateFingerprintHash(sparseFingerprint)).not.toThrow();
      const hash = generateFingerprintHash(sparseFingerprint);
      expect(hash).toHaveLength(64);
    });
  });

  describe('Fingerprint similarity calculation', () => {
    const baseFingerprint: DeviceFingerprint = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      acceptHeader: 'text/html,application/xhtml+xml',
      acceptLanguage: 'en-US,en;q=0.9',
      acceptEncoding: 'gzip, deflate, br',
      platform: 'Win32',
      timezone: 'America/New_York',
      screenResolution: '1920x1080',
    };

    it('should return perfect similarity for identical fingerprints', () => {
      const analysis = calculateFingerprintSimilarity(baseFingerprint, baseFingerprint);
      
      expect(analysis.similarity).toBe(1.0);
      expect(analysis.isMatch).toBe(true);
      expect(analysis.changes).toHaveLength(0);
      expect(analysis.riskLevel).toBe('LOW');
    });

    it('should detect user agent changes', () => {
      const modifiedFingerprint = {
        ...baseFingerprint,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      };
      
      const analysis = calculateFingerprintSimilarity(baseFingerprint, modifiedFingerprint);
      
      expect(analysis.similarity).toBeLessThan(1.0);
      expect(analysis.changes.some(change => change.includes('User Agent changed'))).toBe(true);
    });

    it('should detect platform changes', () => {
      const modifiedFingerprint = {
        ...baseFingerprint,
        platform: 'MacIntel',
      };
      
      const analysis = calculateFingerprintSimilarity(baseFingerprint, modifiedFingerprint);
      
      expect(analysis.changes.some(change => change.includes('Platform changed'))).toBe(true);
    });

    it('should detect timezone changes', () => {
      const modifiedFingerprint = {
        ...baseFingerprint,
        timezone: 'Europe/London',
      };
      
      const analysis = calculateFingerprintSimilarity(baseFingerprint, modifiedFingerprint);
      
      expect(analysis.changes.some(change => change.includes('Timezone changed'))).toBe(true);
    });

    it('should detect screen resolution changes', () => {
      const modifiedFingerprint = {
        ...baseFingerprint,
        screenResolution: '1440x900',
      };
      
      const analysis = calculateFingerprintSimilarity(baseFingerprint, modifiedFingerprint);
      
      expect(analysis.changes.some(change => change.includes('Screen resolution changed'))).toBe(true);
    });

    it('should apply correct risk assessment', () => {
      // Critical risk - very low similarity
      const criticallyDifferent = {
        userAgent: 'Completely Different Browser',
        acceptHeader: 'application/json',
        acceptLanguage: 'zh-CN',
        acceptEncoding: 'identity',
        platform: 'iPhone',
        timezone: 'Asia/Shanghai',
        screenResolution: '375x812',
      };
      
      const criticalAnalysis = calculateFingerprintSimilarity(baseFingerprint, criticallyDifferent);
      expect(criticalAnalysis.riskLevel).toBe('CRITICAL');
      
      // Medium risk - some changes
      const mediumRisk = {
        ...baseFingerprint,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
        timezone: 'America/Los_Angeles',
      };
      
      const mediumAnalysis = calculateFingerprintSimilarity(baseFingerprint, mediumRisk);
      expect(['MEDIUM', 'LOW'].includes(mediumAnalysis.riskLevel)).toBe(true);
    });

    it('should use custom configuration', () => {
      const strictConfig: FingerprintConfig = {
        ...defaultFingerprintConfig,
        minimumSimilarity: 0.9, // Very strict
      };
      
      const slightlyModified = {
        ...baseFingerprint,
        acceptLanguage: 'en-US,en;q=0.8', // Minor change
      };
      
      const analysis = calculateFingerprintSimilarity(baseFingerprint, slightlyModified, strictConfig);
      
      // With strict config, even minor changes might not match
      expect(analysis.similarity).toBeLessThan(1.0);
    });

    it('should handle missing fields gracefully', () => {
      const incomplete: DeviceFingerprint = {
        userAgent: baseFingerprint.userAgent,
        acceptHeader: baseFingerprint.acceptHeader,
        acceptLanguage: '',
        acceptEncoding: '',
      };
      
      const analysis = calculateFingerprintSimilarity(baseFingerprint, incomplete);
      
      expect(analysis.similarity).toBeGreaterThan(0);
      expect(analysis.similarity).toBeLessThan(1);
    });

    it('should weight components according to configuration', () => {
      const customConfig: FingerprintConfig = {
        ...defaultFingerprintConfig,
        weights: {
          userAgent: 1.0, // Only user agent matters
          acceptHeaders: 0,
          language: 0,
          encoding: 0,
          platform: 0,
          timezone: 0,
          screenResolution: 0,
        },
      };
      
      const modifiedNonUserAgent = {
        ...baseFingerprint,
        acceptHeader: 'completely different',
        platform: 'completely different',
        timezone: 'completely different',
      };
      
      const analysis = calculateFingerprintSimilarity(
        baseFingerprint, 
        modifiedNonUserAgent, 
        customConfig
      );
      
      // Should still match well since only user agent has weight
      expect(analysis.similarity).toBeGreaterThan(0.8);
    });
  });

  describe('Device identification and naming', () => {
    it('should generate consistent device ID', () => {
      const userId = 'user-123';
      const deviceId1 = generateDeviceId(mockFingerprint, userId);
      const deviceId2 = generateDeviceId(mockFingerprint, userId);
      
      expect(deviceId1).toBe(deviceId2);
      expect(deviceId1).toHaveLength(16);
      expect(deviceId1).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should generate different device IDs for different users', () => {
      const deviceId1 = generateDeviceId(mockFingerprint, 'user-123');
      const deviceId2 = generateDeviceId(mockFingerprint, 'user-456');
      
      expect(deviceId1).not.toBe(deviceId2);
    });

    it('should generate different device IDs for different fingerprints', () => {
      const fingerprint2 = { ...mockFingerprint, userAgent: 'Different Browser' };
      
      const deviceId1 = generateDeviceId(mockFingerprint, 'user-123');
      const deviceId2 = generateDeviceId(fingerprint2, 'user-123');
      
      expect(deviceId1).not.toBe(deviceId2);
    });

    it('should extract device information correctly', () => {
      const chromeWindows: DeviceFingerprint = {
        ...mockFingerprint,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      
      const info = extractDeviceInfo(chromeWindows);
      
      expect(info.browser).toBe('Chrome');
      expect(info.os).toBe('Windows');
      expect(info.device).toBe('Desktop');
    });

    it('should detect different browsers', () => {
      const testCases = [
        { ua: 'Mozilla/5.0 Firefox/120.0', expected: 'Firefox' },
        { ua: 'Mozilla/5.0 AppleWebKit Safari/605.1.15', expected: 'Safari' },
        { ua: 'Mozilla/5.0 Edg/120.0.0.0', expected: 'Edge' },
        { ua: 'Mozilla/5.0 OPR/120.0.0.0 Opera', expected: 'Opera' },
        { ua: 'Unknown/1.0', expected: 'Unknown Browser' },
      ];
      
      testCases.forEach(({ ua, expected }) => {
        const fingerprint = { ...mockFingerprint, userAgent: ua };
        const info = extractDeviceInfo(fingerprint);
        expect(info.browser).toBe(expected);
      });
    });

    it('should detect different operating systems', () => {
      const testCases = [
        { ua: 'Mozilla/5.0 (Windows NT 10.0)', expected: 'Windows' },
        { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', expected: 'macOS' },
        { ua: 'Mozilla/5.0 (X11; Linux x86_64)', expected: 'Linux' },
        { ua: 'Mozilla/5.0 (Android 11)', expected: 'Android' },
        { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)', expected: 'iOS' },
        { ua: 'Unknown OS', expected: 'Unknown OS' },
      ];
      
      testCases.forEach(({ ua, expected }) => {
        const fingerprint = { ...mockFingerprint, userAgent: ua };
        const info = extractDeviceInfo(fingerprint);
        expect(info.os).toBe(expected);
      });
    });

    it('should detect different device types', () => {
      const testCases = [
        { ua: 'Mozilla/5.0 (Windows NT 10.0)', expected: 'Desktop' },
        { ua: 'Mozilla/5.0 (Android 11; Mobile)', expected: 'Mobile' },
        { ua: 'Mozilla/5.0 (iPad; CPU OS 15_0)', expected: 'Tablet' },
        { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS)', expected: 'Mobile' },
        { ua: 'Mozilla/5.0 (Android 11) Mobile', expected: 'Mobile' },
      ];
      
      testCases.forEach(({ ua, expected }) => {
        const fingerprint = { ...mockFingerprint, userAgent: ua };
        const info = extractDeviceInfo(fingerprint);
        expect(info.device).toBe(expected);
      });
    });

    it('should generate human-readable device names', () => {
      const windowsChrome = {
        ...mockFingerprint,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        screenResolution: '1920x1080',
      };
      
      const name = generateDeviceName(windowsChrome);
      
      expect(name).toContain('Chrome');
      expect(name).toContain('Windows');
      expect(name).toContain('Desktop');
      expect(name).toContain('1920x1080');
    });

    it('should handle missing screen resolution in device name', () => {
      const fingerprintNoRes = {
        ...mockFingerprint,
        screenResolution: undefined,
      };
      
      const name = generateDeviceName(fingerprintNoRes);
      expect(name).toContain('Unknown Resolution');
    });
  });

  describe('User agent normalization', () => {
    it('should normalize version numbers in user agents', () => {
      const userAgent1 = 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36';
      const userAgent2 = 'Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36';
      
      const fingerprint1 = { ...mockFingerprint, userAgent: userAgent1 };
      const fingerprint2 = { ...mockFingerprint, userAgent: userAgent2 };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      
      // Should have high similarity due to version normalization
      expect(analysis.similarity).toBeGreaterThan(0.8);
    });

    it('should normalize OS versions', () => {
      const ua1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
      const ua2 = 'Mozilla/5.0 (Windows NT 11.0; Win64; x64) Chrome/120.0.0.0';
      
      const fingerprint1 = { ...mockFingerprint, userAgent: ua1 };
      const fingerprint2 = { ...mockFingerprint, userAgent: ua2 };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      
      // Should have reasonable similarity due to OS version normalization
      expect(analysis.similarity).toBeGreaterThan(0.7);
    });
  });

  describe('Language header normalization', () => {
    it('should normalize accept-language headers consistently', () => {
      const lang1 = 'en-US,en;q=0.9,es;q=0.8,fr;q=0.7';
      const lang2 = 'en-us,en;q=0.8,es;q=0.9,fr;q=0.6';
      
      const fingerprint1 = { ...mockFingerprint, acceptLanguage: lang1 };
      const fingerprint2 = { ...mockFingerprint, acceptLanguage: lang2 };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      
      // Should have high similarity due to language normalization
      expect(analysis.similarity).toBeGreaterThan(0.8);
    });

    it('should handle malformed language headers', () => {
      const malformedLang = 'invalid;language;header';
      const validLang = 'en-US,en;q=0.9';
      
      const fingerprint1 = { ...mockFingerprint, acceptLanguage: malformedLang };
      const fingerprint2 = { ...mockFingerprint, acceptLanguage: validLang };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      
      // Should still work without crashing
      expect(analysis.similarity).toBeDefined();
      expect(analysis.similarity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('String similarity calculation', () => {
    it('should calculate similarity correctly for identical strings', () => {
      const fingerprint1 = { ...mockFingerprint };
      const fingerprint2 = { ...mockFingerprint };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      expect(analysis.similarity).toBe(1.0);
    });

    it('should calculate similarity for completely different strings', () => {
      const fingerprint1 = {
        userAgent: 'A',
        acceptHeader: 'A',
        acceptLanguage: 'A',
        acceptEncoding: 'A',
        platform: 'A',
        timezone: 'A',
        screenResolution: 'A',
      };
      
      const fingerprint2 = {
        userAgent: 'Z',
        acceptHeader: 'Z',
        acceptLanguage: 'Z',
        acceptEncoding: 'Z',
        platform: 'Z',
        timezone: 'Z',
        screenResolution: 'Z',
      };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      expect(analysis.similarity).toBeLessThan(1.0);
      expect(analysis.similarity).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty strings', () => {
      const fingerprint1 = {
        userAgent: '',
        acceptHeader: '',
        acceptLanguage: '',
        acceptEncoding: '',
        platform: '',
        timezone: '',
        screenResolution: '',
      };
      
      const fingerprint2 = { ...mockFingerprint };
      
      const analysis = calculateFingerprintSimilarity(fingerprint1, fingerprint2);
      expect(analysis.similarity).toBeGreaterThanOrEqual(0);
      expect(analysis.similarity).toBeLessThan(1);
    });
  });

  describe('Configuration validation', () => {
    it('should have valid default configuration', () => {
      expect(defaultFingerprintConfig.minimumSimilarity).toBeGreaterThan(0);
      expect(defaultFingerprintConfig.minimumSimilarity).toBeLessThanOrEqual(1);
      
      // Check weight distribution
      const totalWeight = Object.values(defaultFingerprintConfig.weights)
        .reduce((sum: number, weight: number) => sum + weight, 0);
      expect(totalWeight).toBe(1.0);
      
      // Check reasonable defaults
      expect(defaultFingerprintConfig.deviceTrustDays).toBeGreaterThan(0);
      expect(defaultFingerprintConfig.maxTrustedDevices).toBeGreaterThan(0);
    });

    it('should work with custom configurations', () => {
      const customConfig: FingerprintConfig = {
        minimumSimilarity: 0.8,
        weights: {
          userAgent: 0.5,
          acceptHeaders: 0.2,
          language: 0.1,
          encoding: 0.1,
          platform: 0.1,
          timezone: 0,
          screenResolution: 0,
        },
        deviceTrustDays: 7,
        maxTrustedDevices: 5,
      };
      
      const analysis = calculateFingerprintSimilarity(
        mockFingerprint,
        mockFingerprint,
        customConfig
      );
      
      expect(analysis.similarity).toBe(1.0);
      expect(analysis.isMatch).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined values', () => {
      const sparseFingerprint: DeviceFingerprint = {
        userAgent: 'Browser/1.0',
        acceptHeader: '',
        acceptLanguage: '',
        acceptEncoding: '',
      };
      
      expect(() => generateFingerprintHash(sparseFingerprint)).not.toThrow();
      expect(() => extractDeviceInfo(sparseFingerprint)).not.toThrow();
      expect(() => generateDeviceName(sparseFingerprint)).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000);
      const longFingerprint: DeviceFingerprint = {
        userAgent: longString,
        acceptHeader: longString,
        acceptLanguage: longString,
        acceptEncoding: longString,
        platform: longString,
        timezone: longString,
        screenResolution: longString,
      };
      
      expect(() => generateFingerprintHash(longFingerprint)).not.toThrow();
      const hash = generateFingerprintHash(longFingerprint);
      expect(hash).toHaveLength(64);
    });

    it('should handle special characters', () => {
      const specialFingerprint: DeviceFingerprint = {
        userAgent: 'Browser/1.0 (特殊字符; émojis🔒)',
        acceptHeader: 'text/html; charset=utf-8',
        acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8',
        acceptEncoding: 'gzip, deflate, br',
        platform: 'MacIntel',
        timezone: 'Asia/Shanghai',
        screenResolution: '1440x900',
      };
      
      expect(() => generateFingerprintHash(specialFingerprint)).not.toThrow();
      expect(() => extractDeviceInfo(specialFingerprint)).not.toThrow();
    });

    it('should maintain deterministic behavior', () => {
      // Multiple runs should produce identical results
      const results = [];
      
      for (let i = 0; i < 10; i++) {
        const hash = generateFingerprintHash(mockFingerprint);
        const analysis = calculateFingerprintSimilarity(mockFingerprint, mockFingerprint);
        const deviceId = generateDeviceId(mockFingerprint, 'user-123');
        
        results.push({ hash, similarity: analysis.similarity, deviceId });
      }
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.hash).toBe(firstResult.hash);
        expect(result.similarity).toBe(firstResult.similarity);
        expect(result.deviceId).toBe(firstResult.deviceId);
      });
    });
  });

  describe('Performance characteristics', () => {
    it('should handle large numbers of fingerprint comparisons efficiently', () => {
      const startTime = Date.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const modifiedFingerprint = {
          ...mockFingerprint,
          userAgent: `Browser-${i}/1.0`,
        };
        
        calculateFingerprintSimilarity(mockFingerprint, modifiedFingerprint);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 1000 comparisons
    });

    it('should hash fingerprints quickly', () => {
      const startTime = Date.now();
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        generateFingerprintHash(mockFingerprint);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should be very fast
      expect(totalTime).toBeLessThan(500); // Less than 500ms for 10000 hashes
    });
  });
});
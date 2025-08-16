import crypto from 'crypto';

export interface DeviceFingerprint {
  userAgent: string;
  acceptHeader: string;
  acceptLanguage: string;
  acceptEncoding: string;
  platform?: string;
  timezone?: string;
  screenResolution?: string;
}

export interface FingerprintAnalysis {
  hash: string;
  similarity: number;
  isMatch: boolean;
  changes: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FingerprintConfig {
  // Tolerance levels for fuzzy matching (0-1, where 1 is exact match)
  minimumSimilarity: number;
  // Weights for different fingerprint components
  weights: {
    userAgent: number;
    acceptHeaders: number;
    language: number;
    encoding: number;
    platform: number;
    timezone: number;
    screenResolution: number;
  };
  // How many days to consider recent for device trust
  deviceTrustDays: number;
  // Maximum allowed devices per user
  maxTrustedDevices: number;
}

const defaultConfig: FingerprintConfig = {
  minimumSimilarity: 0.7,
  weights: {
    userAgent: 0.25,
    acceptHeaders: 0.15,
    language: 0.1,
    encoding: 0.1,
    platform: 0.15,
    timezone: 0.1,
    screenResolution: 0.15,
  },
  deviceTrustDays: 30,
  maxTrustedDevices: 10,
};

/**
 * Extract device fingerprint from server-side headers
 */
export async function extractServerFingerprint(request?: Request): Promise<Partial<DeviceFingerprint>> {
  try {
    if (!request) {
      return {
        userAgent: '',
        acceptHeader: '',
        acceptLanguage: '',
        acceptEncoding: '',
      };
    }
    return {
      userAgent: request.headers.get('user-agent') || '',
      acceptHeader: request.headers.get('accept') || '',
      acceptLanguage: request.headers.get('accept-language') || '',
      acceptEncoding: request.headers.get('accept-encoding') || '',
    };
  } catch (error) {
    console.error('Failed to extract server fingerprint:', error);
    return {
      userAgent: '',
      acceptHeader: '',
      acceptLanguage: '',
      acceptEncoding: '',
    };
  }
}

/**
 * Generate a hash from fingerprint data
 */
export function generateFingerprintHash(fingerprint: DeviceFingerprint): string {
  const normalizedData = normalizeFingerprint(fingerprint);
  const fingerprintString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort());
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Normalize fingerprint data for consistent hashing
 */
function normalizeFingerprint(fingerprint: DeviceFingerprint): DeviceFingerprint {
  return {
    // Normalize user agent by removing version numbers that change frequently
    userAgent: normalizeUserAgent(fingerprint.userAgent || ''),
    acceptHeader: (fingerprint.acceptHeader || '').toLowerCase().trim(),
    acceptLanguage: normalizeLanguage(fingerprint.acceptLanguage || ''),
    acceptEncoding: (fingerprint.acceptEncoding || '').toLowerCase().trim(),
    platform: (fingerprint.platform || '').toLowerCase(),
    timezone: fingerprint.timezone || '',
    screenResolution: fingerprint.screenResolution || '',
  };
}

/**
 * Normalize user agent to reduce false positives from minor updates
 */
function normalizeUserAgent(userAgent: string): string {
  return userAgent
    .replace(/\d+\.\d+\.\d+(\.\d+)?/g, 'X.X.X') // Replace version numbers
    .replace(/\b(Chrome|Firefox|Safari|Edge)\/[\d.]+/g, '$1/X.X') // Normalize browser versions
    .replace(/\b(Windows NT|Mac OS X|Linux)\s+[\d._]+/g, '$1 X.X') // Normalize OS versions
    .toLowerCase()
    .trim();
}

/**
 * Normalize accept-language header
 */
function normalizeLanguage(language: string): string {
  return language
    .toLowerCase()
    .split(',')
    .map(lang => lang.split(';')[0].trim()) // Remove quality values
    .sort()
    .join(',');
}

/**
 * Calculate similarity between two fingerprints using weighted comparison
 */
export function calculateFingerprintSimilarity(
  current: DeviceFingerprint,
  stored: DeviceFingerprint,
  config: FingerprintConfig = defaultConfig
): FingerprintAnalysis {
  const changes: string[] = [];
  let totalWeight = 0;
  let weightedSimilarity = 0;

  // Compare each component with its weight
  if (current.userAgent !== undefined && stored.userAgent !== undefined) {
    const similarity = calculateStringSimilarity(current.userAgent, stored.userAgent);
    weightedSimilarity += similarity * config.weights.userAgent;
    totalWeight += config.weights.userAgent;
    if (similarity < 0.8) {
      changes.push(`User Agent changed: ${similarity.toFixed(2)} similarity`);
    }
  }

  if (current.acceptHeader !== undefined && stored.acceptHeader !== undefined) {
    const similarity = calculateStringSimilarity(current.acceptHeader, stored.acceptHeader);
    weightedSimilarity += similarity * config.weights.acceptHeaders;
    totalWeight += config.weights.acceptHeaders;
    if (similarity < 0.9) {
      changes.push(`Accept headers changed: ${similarity.toFixed(2)} similarity`);
    }
  }

  if (current.acceptLanguage !== undefined && stored.acceptLanguage !== undefined) {
    const similarity = calculateStringSimilarity(current.acceptLanguage, stored.acceptLanguage);
    weightedSimilarity += similarity * config.weights.language;
    totalWeight += config.weights.language;
    if (similarity < 0.9) {
      changes.push(`Language preferences changed: ${similarity.toFixed(2)} similarity`);
    }
  }

  if (current.acceptEncoding !== undefined && stored.acceptEncoding !== undefined) {
    const similarity = calculateStringSimilarity(current.acceptEncoding, stored.acceptEncoding);
    weightedSimilarity += similarity * config.weights.encoding;
    totalWeight += config.weights.encoding;
    if (similarity < 0.9) {
      changes.push(`Encoding preferences changed: ${similarity.toFixed(2)} similarity`);
    }
  }

  if (current.platform !== undefined && stored.platform !== undefined) {
    const similarity = calculateStringSimilarity(current.platform, stored.platform);
    weightedSimilarity += similarity * config.weights.platform;
    totalWeight += config.weights.platform;
    if (similarity < 0.8) {
      changes.push(`Platform changed: ${similarity.toFixed(2)} similarity`);
    }
  }

  if (current.timezone !== undefined && stored.timezone !== undefined) {
    const similarity = current.timezone === stored.timezone ? 1 : 0;
    weightedSimilarity += similarity * config.weights.timezone;
    totalWeight += config.weights.timezone;
    if (similarity < 1) {
      changes.push(`Timezone changed from ${stored.timezone} to ${current.timezone}`);
    }
  }

  if (current.screenResolution !== undefined && stored.screenResolution !== undefined) {
    const similarity = current.screenResolution === stored.screenResolution ? 1 : 0;
    weightedSimilarity += similarity * config.weights.screenResolution;
    totalWeight += config.weights.screenResolution;
    if (similarity < 1) {
      changes.push(`Screen resolution changed from ${stored.screenResolution} to ${current.screenResolution}`);
    }
  }

  const overallSimilarity = totalWeight > 0 ? weightedSimilarity / totalWeight : 0;
  const isMatch = overallSimilarity >= config.minimumSimilarity;

  // Determine risk level based on similarity and types of changes
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  if (overallSimilarity < 0.3) {
    riskLevel = 'CRITICAL';
  } else if (overallSimilarity < 0.5) {
    riskLevel = 'HIGH';
  } else if (overallSimilarity < 0.7) {
    riskLevel = 'MEDIUM';
  } else if (changes.length > 0) {
    riskLevel = 'LOW';
  }

  // Increase risk level for critical component changes
  const criticalChanges = changes.filter(change => 
    change.includes('Platform changed') || 
    change.includes('User Agent') && change.includes('0.') && parseFloat(change.match(/0\.\d+/)?.[0] || '1') < 0.5
  );
  
  if (criticalChanges.length > 0 && riskLevel === 'LOW') {
    riskLevel = 'MEDIUM';
  }

  const currentHash = generateFingerprintHash(current);

  return {
    hash: currentHash,
    similarity: overallSimilarity,
    isMatch,
    changes,
    riskLevel,
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const matrix: number[][] = [];
  
  // Create matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  const distance = matrix[str2.length][str1.length];
  return 1 - distance / maxLength;
}

/**
 * Create a device identifier for trusted devices
 */
export function generateDeviceId(fingerprint: DeviceFingerprint, userId: string): string {
  const deviceString = `${userId}-${fingerprint.userAgent}-${fingerprint.platform}-${fingerprint.screenResolution}`;
  return crypto.createHash('sha256').update(deviceString).digest('hex').substring(0, 16);
}

/**
 * Extract basic device info for display purposes
 */
export function extractDeviceInfo(fingerprint: DeviceFingerprint): {
  browser: string;
  os: string;
  device: string;
} {
  const userAgent = fingerprint.userAgent || '';
  
  // Extract browser
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Extract OS
  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Extract device type
  let device = 'Desktop';
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile';
  else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) device = 'Tablet';

  return { browser, os, device };
}

/**
 * Generate a human-readable device name
 */
export function generateDeviceName(fingerprint: DeviceFingerprint): string {
  const info = extractDeviceInfo(fingerprint);
  const resolution = fingerprint.screenResolution || 'Unknown Resolution';
  return `${info.browser} on ${info.os} (${info.device}) - ${resolution}`;
}

export { defaultConfig as defaultFingerprintConfig };
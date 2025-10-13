// Mock session fingerprint module for testing
export function generateFingerprint(req: any): string {
  return 'test-fingerprint';
}

export function validateFingerprint(fingerprint: string, req: any): boolean {
  return fingerprint === 'test-fingerprint';
}

export function getFingerprint(req: any): string {
  return 'test-fingerprint';
}
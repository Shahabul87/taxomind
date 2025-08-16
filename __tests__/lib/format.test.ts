import { formatPrice } from '@/lib/format';

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(99.99)).toBe('$99.99');
    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(1000)).toBe('$1,000.00');
  });

  it('should handle null and undefined', () => {
    expect(formatPrice(null)).toBe('Free');
    expect(formatPrice(undefined)).toBe('Free');
  });
});
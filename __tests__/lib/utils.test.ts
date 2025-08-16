import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn function', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', { active: true, disabled: false })).toContain('active');
    });

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle undefined and null', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });
  });
});
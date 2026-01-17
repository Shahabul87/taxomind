/**
 * Bloom's Taxonomy Normalizer Tests
 *
 * Tests for the Bloom's level normalization utilities that handle
 * conversion between frontend (lowercase) and backend (uppercase) formats.
 */

import {
  isValidBloomsLevel,
  isLowerOrderLevel,
  isHigherOrderLevel,
  normalizeToUppercase,
  normalizeToLowercase,
  normalizeToUppercaseSafe,
  normalizeToLowercaseSafe,
  normalizeArrayToUppercase,
  normalizeRecordToUppercase,
  normalizeRecordToLowercase,
  getBloomsHierarchyIndex,
  compareBloomsLevels,
  sortBloomsLevels,
  getBloomsDisplayName,
  getSelectedLevels,
  BLOOMS_LEVELS_UPPERCASE,
  BLOOMS_LEVELS_LOWERCASE,
  BLOOMS_HIERARCHY,
  bloomsNormalizer,
} from '@/lib/sam/utils/blooms-normalizer';

describe('Bloom\'s Normalizer', () => {
  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('isValidBloomsLevel', () => {
    it('should return true for valid uppercase levels', () => {
      expect(isValidBloomsLevel('REMEMBER')).toBe(true);
      expect(isValidBloomsLevel('UNDERSTAND')).toBe(true);
      expect(isValidBloomsLevel('APPLY')).toBe(true);
      expect(isValidBloomsLevel('ANALYZE')).toBe(true);
      expect(isValidBloomsLevel('EVALUATE')).toBe(true);
      expect(isValidBloomsLevel('CREATE')).toBe(true);
    });

    it('should return true for valid lowercase levels', () => {
      expect(isValidBloomsLevel('remember')).toBe(true);
      expect(isValidBloomsLevel('understand')).toBe(true);
      expect(isValidBloomsLevel('apply')).toBe(true);
      expect(isValidBloomsLevel('analyze')).toBe(true);
      expect(isValidBloomsLevel('evaluate')).toBe(true);
      expect(isValidBloomsLevel('create')).toBe(true);
    });

    it('should return true for mixed case levels', () => {
      expect(isValidBloomsLevel('Remember')).toBe(true);
      expect(isValidBloomsLevel('UNDERSTAND')).toBe(true);
      expect(isValidBloomsLevel('Apply')).toBe(true);
    });

    it('should return false for invalid levels', () => {
      expect(isValidBloomsLevel('invalid')).toBe(false);
      expect(isValidBloomsLevel('')).toBe(false);
      expect(isValidBloomsLevel('knowledge')).toBe(false);
      expect(isValidBloomsLevel('synthesis')).toBe(false);
    });
  });

  describe('isLowerOrderLevel', () => {
    it('should return true for lower-order levels', () => {
      expect(isLowerOrderLevel('REMEMBER')).toBe(true);
      expect(isLowerOrderLevel('UNDERSTAND')).toBe(true);
      expect(isLowerOrderLevel('APPLY')).toBe(true);
      expect(isLowerOrderLevel('remember')).toBe(true);
      expect(isLowerOrderLevel('understand')).toBe(true);
      expect(isLowerOrderLevel('apply')).toBe(true);
    });

    it('should return false for higher-order levels', () => {
      expect(isLowerOrderLevel('ANALYZE')).toBe(false);
      expect(isLowerOrderLevel('EVALUATE')).toBe(false);
      expect(isLowerOrderLevel('CREATE')).toBe(false);
      expect(isLowerOrderLevel('analyze')).toBe(false);
    });
  });

  describe('isHigherOrderLevel', () => {
    it('should return true for higher-order levels', () => {
      expect(isHigherOrderLevel('ANALYZE')).toBe(true);
      expect(isHigherOrderLevel('EVALUATE')).toBe(true);
      expect(isHigherOrderLevel('CREATE')).toBe(true);
      expect(isHigherOrderLevel('analyze')).toBe(true);
      expect(isHigherOrderLevel('evaluate')).toBe(true);
      expect(isHigherOrderLevel('create')).toBe(true);
    });

    it('should return false for lower-order levels', () => {
      expect(isHigherOrderLevel('REMEMBER')).toBe(false);
      expect(isHigherOrderLevel('UNDERSTAND')).toBe(false);
      expect(isHigherOrderLevel('APPLY')).toBe(false);
      expect(isHigherOrderLevel('remember')).toBe(false);
    });
  });

  // ==========================================================================
  // Normalization Tests
  // ==========================================================================

  describe('normalizeToUppercase', () => {
    it('should convert lowercase to uppercase', () => {
      expect(normalizeToUppercase('remember')).toBe('REMEMBER');
      expect(normalizeToUppercase('understand')).toBe('UNDERSTAND');
      expect(normalizeToUppercase('apply')).toBe('APPLY');
      expect(normalizeToUppercase('analyze')).toBe('ANALYZE');
      expect(normalizeToUppercase('evaluate')).toBe('EVALUATE');
      expect(normalizeToUppercase('create')).toBe('CREATE');
    });

    it('should keep uppercase as uppercase', () => {
      expect(normalizeToUppercase('REMEMBER')).toBe('REMEMBER');
      expect(normalizeToUppercase('CREATE')).toBe('CREATE');
    });

    it('should handle mixed case', () => {
      expect(normalizeToUppercase('Remember')).toBe('REMEMBER');
      expect(normalizeToUppercase('UnDeRsTaNd')).toBe('UNDERSTAND');
    });

    it('should throw for invalid levels', () => {
      expect(() => normalizeToUppercase('invalid')).toThrow();
      expect(() => normalizeToUppercase('')).toThrow();
    });
  });

  describe('normalizeToLowercase', () => {
    it('should convert uppercase to lowercase', () => {
      expect(normalizeToLowercase('REMEMBER')).toBe('remember');
      expect(normalizeToLowercase('UNDERSTAND')).toBe('understand');
      expect(normalizeToLowercase('CREATE')).toBe('create');
    });

    it('should keep lowercase as lowercase', () => {
      expect(normalizeToLowercase('remember')).toBe('remember');
      expect(normalizeToLowercase('create')).toBe('create');
    });

    it('should throw for invalid levels', () => {
      expect(() => normalizeToLowercase('invalid')).toThrow();
    });
  });

  describe('normalizeToUppercaseSafe', () => {
    it('should normalize valid levels', () => {
      expect(normalizeToUppercaseSafe('remember')).toBe('REMEMBER');
      expect(normalizeToUppercaseSafe('CREATE')).toBe('CREATE');
    });

    it('should return default fallback for invalid levels', () => {
      expect(normalizeToUppercaseSafe('invalid')).toBe('UNDERSTAND');
      expect(normalizeToUppercaseSafe('')).toBe('UNDERSTAND');
    });

    it('should return custom fallback when provided', () => {
      expect(normalizeToUppercaseSafe('invalid', 'APPLY')).toBe('APPLY');
      expect(normalizeToUppercaseSafe('', 'REMEMBER')).toBe('REMEMBER');
    });

    it('should return fallback for null/undefined', () => {
      expect(normalizeToUppercaseSafe(null)).toBe('UNDERSTAND');
      expect(normalizeToUppercaseSafe(undefined)).toBe('UNDERSTAND');
      expect(normalizeToUppercaseSafe(null, 'CREATE')).toBe('CREATE');
    });
  });

  describe('normalizeToLowercaseSafe', () => {
    it('should normalize valid levels', () => {
      expect(normalizeToLowercaseSafe('REMEMBER')).toBe('remember');
      expect(normalizeToLowercaseSafe('create')).toBe('create');
    });

    it('should return default fallback for invalid levels', () => {
      expect(normalizeToLowercaseSafe('invalid')).toBe('understand');
    });

    it('should return custom fallback when provided', () => {
      expect(normalizeToLowercaseSafe('invalid', 'apply')).toBe('apply');
    });

    it('should return fallback for null/undefined', () => {
      expect(normalizeToLowercaseSafe(null)).toBe('understand');
      expect(normalizeToLowercaseSafe(undefined)).toBe('understand');
    });
  });

  // ==========================================================================
  // Batch Normalization Tests
  // ==========================================================================

  describe('normalizeArrayToUppercase', () => {
    it('should normalize array of levels', () => {
      const result = normalizeArrayToUppercase(['remember', 'apply', 'CREATE']);
      expect(result).toEqual(['REMEMBER', 'APPLY', 'CREATE']);
    });

    it('should throw for invalid levels by default', () => {
      expect(() => normalizeArrayToUppercase(['remember', 'invalid'])).toThrow();
    });

    it('should skip invalid levels when skipInvalid is true', () => {
      const result = normalizeArrayToUppercase(
        ['remember', 'invalid', 'create'],
        true
      );
      expect(result).toEqual(['REMEMBER', 'CREATE']);
    });

    it('should handle empty array', () => {
      expect(normalizeArrayToUppercase([])).toEqual([]);
    });
  });

  describe('normalizeRecordToUppercase', () => {
    it('should convert record keys to uppercase', () => {
      const input = {
        remember: true,
        understand: false,
        apply: true,
        analyze: false,
        evaluate: true,
        create: false,
      };

      const result = normalizeRecordToUppercase(input);

      expect(result).toEqual({
        REMEMBER: true,
        UNDERSTAND: false,
        APPLY: true,
        ANALYZE: false,
        EVALUATE: true,
        CREATE: false,
      });
    });

    it('should handle partial records', () => {
      const input = {
        remember: true,
        understand: true,
        apply: false,
        analyze: false,
        evaluate: false,
        create: false,
      };

      const result = normalizeRecordToUppercase(input);

      expect(result.REMEMBER).toBe(true);
      expect(result.UNDERSTAND).toBe(true);
      expect(result.CREATE).toBe(false);
    });
  });

  describe('normalizeRecordToLowercase', () => {
    it('should convert record keys to lowercase', () => {
      const input = {
        REMEMBER: true,
        UNDERSTAND: false,
        APPLY: true,
        ANALYZE: false,
        EVALUATE: true,
        CREATE: false,
      };

      const result = normalizeRecordToLowercase(input);

      expect(result).toEqual({
        remember: true,
        understand: false,
        apply: true,
        analyze: false,
        evaluate: true,
        create: false,
      });
    });
  });

  // ==========================================================================
  // Utility Function Tests
  // ==========================================================================

  describe('getBloomsHierarchyIndex', () => {
    it('should return correct index for each level', () => {
      expect(getBloomsHierarchyIndex('REMEMBER')).toBe(0);
      expect(getBloomsHierarchyIndex('UNDERSTAND')).toBe(1);
      expect(getBloomsHierarchyIndex('APPLY')).toBe(2);
      expect(getBloomsHierarchyIndex('ANALYZE')).toBe(3);
      expect(getBloomsHierarchyIndex('EVALUATE')).toBe(4);
      expect(getBloomsHierarchyIndex('CREATE')).toBe(5);
    });

    it('should work with lowercase input', () => {
      expect(getBloomsHierarchyIndex('remember')).toBe(0);
      expect(getBloomsHierarchyIndex('create')).toBe(5);
    });
  });

  describe('compareBloomsLevels', () => {
    it('should return negative when first is lower', () => {
      expect(compareBloomsLevels('REMEMBER', 'CREATE')).toBeLessThan(0);
      expect(compareBloomsLevels('remember', 'evaluate')).toBeLessThan(0);
    });

    it('should return positive when first is higher', () => {
      expect(compareBloomsLevels('CREATE', 'REMEMBER')).toBeGreaterThan(0);
      expect(compareBloomsLevels('analyze', 'apply')).toBeGreaterThan(0);
    });

    it('should return 0 when levels are equal', () => {
      expect(compareBloomsLevels('REMEMBER', 'remember')).toBe(0);
      expect(compareBloomsLevels('CREATE', 'CREATE')).toBe(0);
    });
  });

  describe('sortBloomsLevels', () => {
    it('should sort levels in ascending order', () => {
      const input = ['CREATE', 'REMEMBER', 'ANALYZE', 'APPLY'];
      const result = sortBloomsLevels(input);

      expect(result).toEqual(['REMEMBER', 'APPLY', 'ANALYZE', 'CREATE']);
    });

    it('should work with lowercase', () => {
      const input = ['create', 'remember', 'analyze'];
      const result = sortBloomsLevels(input);

      expect(result).toEqual(['remember', 'analyze', 'create']);
    });

    it('should not mutate the original array', () => {
      const input = ['CREATE', 'REMEMBER'];
      sortBloomsLevels(input);

      expect(input).toEqual(['CREATE', 'REMEMBER']);
    });
  });

  describe('getBloomsDisplayName', () => {
    it('should return capitalized name', () => {
      expect(getBloomsDisplayName('REMEMBER')).toBe('Remember');
      expect(getBloomsDisplayName('remember')).toBe('Remember');
      expect(getBloomsDisplayName('UNDERSTAND')).toBe('Understand');
      expect(getBloomsDisplayName('create')).toBe('Create');
    });
  });

  describe('getSelectedLevels', () => {
    it('should return only selected levels in uppercase', () => {
      const input = {
        remember: true,
        understand: false,
        apply: true,
        analyze: false,
        evaluate: false,
        create: true,
      };

      const result = getSelectedLevels(input);

      expect(result).toContain('REMEMBER');
      expect(result).toContain('APPLY');
      expect(result).toContain('CREATE');
      expect(result).not.toContain('UNDERSTAND');
      expect(result).toHaveLength(3);
    });

    it('should work with uppercase input', () => {
      const input = {
        REMEMBER: true,
        UNDERSTAND: true,
        APPLY: false,
        ANALYZE: false,
        EVALUATE: false,
        CREATE: false,
      };

      const result = getSelectedLevels(input);

      expect(result).toContain('REMEMBER');
      expect(result).toContain('UNDERSTAND');
      expect(result).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Constants Tests
  // ==========================================================================

  describe('Constants', () => {
    it('should have 6 uppercase levels', () => {
      expect(BLOOMS_LEVELS_UPPERCASE).toHaveLength(6);
    });

    it('should have 6 lowercase levels', () => {
      expect(BLOOMS_LEVELS_LOWERCASE).toHaveLength(6);
    });

    it('should have correct hierarchy order', () => {
      expect(BLOOMS_HIERARCHY[0]).toBe('REMEMBER');
      expect(BLOOMS_HIERARCHY[5]).toBe('CREATE');
    });
  });

  // ==========================================================================
  // Default Export Tests
  // ==========================================================================

  describe('bloomsNormalizer default export', () => {
    it('should expose all functions', () => {
      expect(bloomsNormalizer.isValid).toBe(isValidBloomsLevel);
      expect(bloomsNormalizer.toUppercase).toBe(normalizeToUppercase);
      expect(bloomsNormalizer.toLowercase).toBe(normalizeToLowercase);
      expect(bloomsNormalizer.toUppercaseSafe).toBe(normalizeToUppercaseSafe);
      expect(bloomsNormalizer.recordToUppercase).toBe(normalizeRecordToUppercase);
    });

    it('should expose constants', () => {
      expect(bloomsNormalizer.UPPERCASE).toBe(BLOOMS_LEVELS_UPPERCASE);
      expect(bloomsNormalizer.LOWERCASE).toBe(BLOOMS_LEVELS_LOWERCASE);
      expect(bloomsNormalizer.HIERARCHY).toBe(BLOOMS_HIERARCHY);
    });
  });
});

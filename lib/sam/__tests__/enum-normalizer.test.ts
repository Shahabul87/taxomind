/**
 * Tests for SAM Enum Normalizer
 */

import {
  toPrismaEnum,
  toFrontendEnum,
  toPrismaEnumWithDefault,
  toFrontendEnumWithDefault,
  toGoalStatusPrisma,
  toGoalStatusFrontend,
  normalizeForPrisma,
  normalizeForFrontend,
  normalizeGoalForFrontend,
  isValidGoalStatus,
  isValidGoalPriority,
  SAMGoalStatusValues,
  SAMGoalPriorityValues,
} from '../utils/enum-normalizer';

describe('Enum Normalizer', () => {
  describe('toPrismaEnum', () => {
    it('converts lowercase to uppercase', () => {
      expect(toPrismaEnum('active')).toBe('ACTIVE');
      expect(toPrismaEnum('completed')).toBe('COMPLETED');
      expect(toPrismaEnum('medium')).toBe('MEDIUM');
    });

    it('handles null and undefined', () => {
      expect(toPrismaEnum(null)).toBeNull();
      expect(toPrismaEnum(undefined)).toBeNull();
    });

    it('handles already uppercase values', () => {
      expect(toPrismaEnum('ACTIVE')).toBe('ACTIVE');
    });
  });

  describe('toFrontendEnum', () => {
    it('converts uppercase to lowercase', () => {
      expect(toFrontendEnum('ACTIVE')).toBe('active');
      expect(toFrontendEnum('COMPLETED')).toBe('completed');
      expect(toFrontendEnum('MEDIUM')).toBe('medium');
    });

    it('handles null and undefined', () => {
      expect(toFrontendEnum(null)).toBeNull();
      expect(toFrontendEnum(undefined)).toBeNull();
    });

    it('handles already lowercase values', () => {
      expect(toFrontendEnum('active')).toBe('active');
    });
  });

  describe('toPrismaEnumWithDefault', () => {
    it('returns converted value when provided', () => {
      expect(toPrismaEnumWithDefault('active', 'DRAFT')).toBe('ACTIVE');
    });

    it('returns default when null', () => {
      expect(toPrismaEnumWithDefault(null, 'DRAFT')).toBe('DRAFT');
    });

    it('returns default when undefined', () => {
      expect(toPrismaEnumWithDefault(undefined, 'DRAFT')).toBe('DRAFT');
    });
  });

  describe('toFrontendEnumWithDefault', () => {
    it('returns converted value when provided', () => {
      expect(toFrontendEnumWithDefault('ACTIVE', 'draft')).toBe('active');
    });

    it('returns default when null', () => {
      expect(toFrontendEnumWithDefault(null, 'draft')).toBe('draft');
    });
  });

  describe('Type-safe conversions', () => {
    it('converts goal status correctly', () => {
      expect(toGoalStatusPrisma('active')).toBe('ACTIVE');
      expect(toGoalStatusFrontend('ACTIVE')).toBe('active');
    });
  });

  describe('normalizeForPrisma', () => {
    it('normalizes specified fields to uppercase', () => {
      const input = { status: 'active', priority: 'high', name: 'Test' };
      const result = normalizeForPrisma(input, ['status', 'priority']);

      expect(result.status).toBe('ACTIVE');
      expect(result.priority).toBe('HIGH');
      expect(result.name).toBe('Test'); // Unchanged
    });

    it('handles missing fields gracefully', () => {
      const input = { name: 'Test' };
      const result = normalizeForPrisma(input, ['status' as keyof typeof input]);

      expect(result.name).toBe('Test');
    });
  });

  describe('normalizeForFrontend', () => {
    it('normalizes specified fields to lowercase', () => {
      const input = { status: 'ACTIVE', priority: 'HIGH', name: 'Test' };
      const result = normalizeForFrontend(input, ['status', 'priority']);

      expect(result.status).toBe('active');
      expect(result.priority).toBe('high');
      expect(result.name).toBe('Test'); // Unchanged
    });
  });

  describe('normalizeGoalForFrontend', () => {
    it('normalizes all goal enum fields', () => {
      const goal = {
        id: '123',
        status: 'ACTIVE',
        priority: 'HIGH',
        currentMastery: 'INTERMEDIATE',
        targetMastery: 'EXPERT',
        title: 'Test Goal',
      };

      const result = normalizeGoalForFrontend(goal);

      expect(result.status).toBe('active');
      expect(result.priority).toBe('high');
      expect(result.currentMastery).toBe('intermediate');
      expect(result.targetMastery).toBe('expert');
      expect(result.title).toBe('Test Goal'); // Unchanged
    });
  });

  describe('Validation helpers', () => {
    describe('isValidGoalStatus', () => {
      it('returns true for valid statuses', () => {
        for (const status of SAMGoalStatusValues.frontend) {
          expect(isValidGoalStatus(status)).toBe(true);
        }
      });

      it('returns false for invalid statuses', () => {
        expect(isValidGoalStatus('invalid')).toBe(false);
        expect(isValidGoalStatus('ACTIVE')).toBe(false); // Uppercase not valid
        expect(isValidGoalStatus(123)).toBe(false);
        expect(isValidGoalStatus(null)).toBe(false);
      });
    });

    describe('isValidGoalPriority', () => {
      it('returns true for valid priorities', () => {
        for (const priority of SAMGoalPriorityValues.frontend) {
          expect(isValidGoalPriority(priority)).toBe(true);
        }
      });

      it('returns false for invalid priorities', () => {
        expect(isValidGoalPriority('invalid')).toBe(false);
        expect(isValidGoalPriority('HIGH')).toBe(false); // Uppercase not valid
      });
    });
  });
});

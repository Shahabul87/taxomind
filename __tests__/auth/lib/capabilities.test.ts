/**
 * Capabilities Test Suite
 * Tests for user capability management
 */

describe('Capabilities', () => {
  // Module references - populated in beforeEach
  let getUserCapabilities: Function;
  let hasCapability: Function;
  let hasAnyCapability: Function;
  let hasAllCapabilities: Function;
  let grantCapability: Function;
  let revokeCapability: Function;
  let getAvailableCapabilities: Function;
  let canAccessRoute: Function;
  let getCapabilityStats: Function;
  let UserCapability: Record<string, string>;
  let CAPABILITY_DEFINITIONS: Record<string, { label: string }>;

  // Mock functions
  let mockFindUnique: jest.Mock;
  let mockFindMany: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockAuditCreate: jest.Mock;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Create fresh mock functions
    mockFindUnique = jest.fn();
    mockFindMany = jest.fn();
    mockUpdate = jest.fn();
    mockAuditCreate = jest.fn();

    const mockDbObj = {
      user: {
        findUnique: mockFindUnique,
        findMany: mockFindMany,
        update: mockUpdate,
      },
      auditLog: {
        create: mockAuditCreate,
      },
    };

    // Mock React cache
    jest.doMock('react', () => ({
      ...jest.requireActual('react'),
      cache: (fn: Function) => fn,
    }));

    // Mock BOTH db paths
    jest.doMock('@/lib/db', () => ({
      db: mockDbObj,
    }));

    jest.doMock('@/lib/db-pooled', () => ({
      db: mockDbObj,
      getDb: jest.fn(() => mockDbObj),
      getDbMetrics: jest.fn(),
      checkDatabaseHealth: jest.fn(),
      getBasePrismaClient: jest.fn(),
    }));

    // Import modules AFTER mocking
    const capabilities = require('@/lib/auth/capabilities');
    getUserCapabilities = capabilities.getUserCapabilities;
    hasCapability = capabilities.hasCapability;
    hasAnyCapability = capabilities.hasAnyCapability;
    hasAllCapabilities = capabilities.hasAllCapabilities;
    grantCapability = capabilities.grantCapability;
    revokeCapability = capabilities.revokeCapability;
    getAvailableCapabilities = capabilities.getAvailableCapabilities;
    canAccessRoute = capabilities.canAccessRoute;
    getCapabilityStats = capabilities.getCapabilityStats;
    UserCapability = capabilities.UserCapability;
    CAPABILITY_DEFINITIONS = capabilities.CAPABILITY_DEFINITIONS;
  });

  describe('UserCapability enum', () => {
    it('has correct capability values', () => {
      expect(UserCapability.STUDENT).toBe('STUDENT');
      expect(UserCapability.TEACHER).toBe('TEACHER');
      expect(UserCapability.AFFILIATE).toBe('AFFILIATE');
    });
  });

  describe('CAPABILITY_DEFINITIONS', () => {
    it('defines STUDENT capability', () => {
      expect(CAPABILITY_DEFINITIONS[UserCapability.STUDENT]).toBeDefined();
      expect(CAPABILITY_DEFINITIONS[UserCapability.STUDENT].label).toBe('Student');
    });

    it('defines TEACHER capability', () => {
      expect(CAPABILITY_DEFINITIONS[UserCapability.TEACHER]).toBeDefined();
      expect(CAPABILITY_DEFINITIONS[UserCapability.TEACHER].label).toBe('Instructor');
    });
  });

  describe('getUserCapabilities', () => {
    it('returns empty array for non-existent user', async () => {
      mockFindUnique.mockResolvedValue(null);

      const capabilities = await getUserCapabilities('non-existent');

      expect(capabilities).toEqual([]);
    });

    it('returns student capability for all users', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const capabilities = await getUserCapabilities('user-123');

      expect(capabilities).toHaveLength(1);
      expect(capabilities[0].capability).toBe(UserCapability.STUDENT);
      expect(capabilities[0].isActive).toBe(true);
    });

    it('includes teacher capability when enabled', async () => {
      const teacherActivatedAt = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: true,
        isAffiliate: false,
        teacherActivatedAt,
        emailVerified: new Date(),
      });

      const capabilities = await getUserCapabilities('user-123');

      expect(capabilities).toHaveLength(2);
      const teacherCap = capabilities.find((c: { capability: string }) => c.capability === UserCapability.TEACHER);
      expect(teacherCap).toBeDefined();
      expect(teacherCap?.isActive).toBe(true);
      expect(teacherCap?.activatedAt).toBe(teacherActivatedAt);
    });

    it('includes affiliate capability when enabled', async () => {
      const affiliateActivatedAt = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: true,
        affiliateActivatedAt,
        emailVerified: new Date(),
      });

      const capabilities = await getUserCapabilities('user-123');

      expect(capabilities).toHaveLength(2);
      const affiliateCap = capabilities.find((c: { capability: string }) => c.capability === UserCapability.AFFILIATE);
      expect(affiliateCap).toBeDefined();
      expect(affiliateCap?.isActive).toBe(true);
    });

    it('handles database errors gracefully', async () => {
      mockFindUnique.mockRejectedValue(new Error('DB Error'));

      const capabilities = await getUserCapabilities('user-123');

      expect(capabilities).toEqual([]);
    });
  });

  describe('hasCapability', () => {
    it('returns true when user has capability', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: true,
        isAffiliate: false,
        teacherActivatedAt: new Date(),
        emailVerified: new Date(),
      });

      const result = await hasCapability('user-123', UserCapability.TEACHER);

      expect(result).toBe(true);
    });

    it('returns false when user lacks capability', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const result = await hasCapability('user-123', UserCapability.TEACHER);

      expect(result).toBe(false);
    });

    it('returns true for student capability for any user', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const result = await hasCapability('user-123', UserCapability.STUDENT);

      expect(result).toBe(true);
    });
  });

  describe('hasAnyCapability', () => {
    it('returns true when user has at least one capability', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: true,
        isAffiliate: false,
        teacherActivatedAt: new Date(),
        emailVerified: new Date(),
      });

      const result = await hasAnyCapability('user-123', [
        UserCapability.TEACHER,
        UserCapability.AFFILIATE,
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user has none of the capabilities', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const result = await hasAnyCapability('user-123', [
        UserCapability.TEACHER,
        UserCapability.AFFILIATE,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAllCapabilities', () => {
    it('returns true when user has all capabilities', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: true,
        isAffiliate: true,
        teacherActivatedAt: new Date(),
        affiliateActivatedAt: new Date(),
        emailVerified: new Date(),
      });

      const result = await hasAllCapabilities('user-123', [
        UserCapability.STUDENT,
        UserCapability.TEACHER,
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user is missing a capability', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: true,
        isAffiliate: false,
        teacherActivatedAt: new Date(),
        emailVerified: new Date(),
      });

      const result = await hasAllCapabilities('user-123', [
        UserCapability.TEACHER,
        UserCapability.AFFILIATE,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('grantCapability', () => {
    it('grants teacher capability successfully', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        emailVerified: new Date(),
      });
      mockUpdate.mockResolvedValue({});
      mockAuditCreate.mockResolvedValue({});

      const result = await grantCapability('user-123', UserCapability.TEACHER, 'admin-123');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          isTeacher: true,
          teacherActivatedAt: expect.any(Date),
        }),
      });
    });

    it('grants affiliate capability with affiliate code', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        emailVerified: new Date(),
      });
      mockUpdate.mockResolvedValue({});
      mockAuditCreate.mockResolvedValue({});

      const result = await grantCapability('user-123', UserCapability.AFFILIATE);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          isAffiliate: true,
          affiliateCode: expect.any(String),
        }),
      });
    });

    it('fails for non-existent user', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await grantCapability('non-existent', UserCapability.TEACHER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('fails when email verification required but not verified', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        emailVerified: null,
      });

      const result = await grantCapability('user-123', UserCapability.TEACHER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email verification required');
    });

    it('handles database errors', async () => {
      mockFindUnique.mockRejectedValue(new Error('DB Error'));

      const result = await grantCapability('user-123', UserCapability.TEACHER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to grant capability');
    });
  });

  describe('revokeCapability', () => {
    it('revokes teacher capability successfully', async () => {
      mockUpdate.mockResolvedValue({});
      mockAuditCreate.mockResolvedValue({});

      const result = await revokeCapability(
        'user-123',
        UserCapability.TEACHER,
        'admin-123',
        'No longer needed'
      );

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { isTeacher: false },
      });
    });

    it('fails to revoke student capability', async () => {
      const result = await revokeCapability('user-123', UserCapability.STUDENT);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot revoke student capability');
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('handles database errors', async () => {
      mockUpdate.mockRejectedValue(new Error('DB Error'));

      const result = await revokeCapability('user-123', UserCapability.AFFILIATE);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to revoke capability');
    });
  });

  describe('getAvailableCapabilities', () => {
    it('returns capabilities user does not have', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const available = await getAvailableCapabilities('user-123');

      // Should not include STUDENT (already has) but may include TEACHER, AFFILIATE
      const capIds = available.map((c: { id: string }) => c.id);
      expect(capIds).not.toContain(UserCapability.STUDENT);
    });
  });

  describe('canAccessRoute', () => {
    it('allows access to teacher routes for teachers', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: true,
        isAffiliate: false,
        teacherActivatedAt: new Date(),
        emailVerified: new Date(),
      });

      const result = await canAccessRoute('user-123', '/teacher/dashboard');

      expect(result).toBe(true);
    });

    it('denies access to teacher routes for non-teachers', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const result = await canAccessRoute('user-123', '/teacher/dashboard');

      expect(result).toBe(false);
    });

    it('allows access to general routes for all users', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: false,
        emailVerified: new Date(),
      });

      const result = await canAccessRoute('user-123', '/dashboard');

      expect(result).toBe(true);
    });

    it('allows access to affiliate routes for affiliates', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        isTeacher: false,
        isAffiliate: true,
        affiliateActivatedAt: new Date(),
        emailVerified: new Date(),
      });

      const result = await canAccessRoute('user-123', '/affiliate/earnings');

      expect(result).toBe(true);
    });
  });

  describe('getCapabilityStats', () => {
    it('returns capability statistics', async () => {
      mockFindMany.mockResolvedValue([
        { isTeacher: true, isAffiliate: false },
        { isTeacher: true, isAffiliate: true },
        { isTeacher: false, isAffiliate: false },
        { isTeacher: false, isAffiliate: true },
      ]);

      const stats = await getCapabilityStats();

      expect(stats.total).toBe(4);
      expect(stats.byCapability[UserCapability.STUDENT]).toBe(4);
      expect(stats.byCapability[UserCapability.TEACHER]).toBe(2);
      expect(stats.byCapability[UserCapability.AFFILIATE]).toBe(2);
    });

    it('handles database errors gracefully', async () => {
      mockFindMany.mockRejectedValue(new Error('DB Error'));

      const stats = await getCapabilityStats();

      expect(stats.total).toBe(0);
      expect(stats.byCapability).toEqual({});
    });
  });
});

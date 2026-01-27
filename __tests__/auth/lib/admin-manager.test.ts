/**
 * Admin Manager Test Suite
 * Tests for admin creation and management functionality
 */

describe('Admin Manager', () => {
  // Module references - populated in beforeEach
  let AdminCreationStrategy: Record<string, string>;
  let needsInitialAdmin: Function;
  let isAdminEmail: Function;
  let createFirstAdmin: Function;
  let promoteToAdmin: Function;
  let demoteFromAdmin: Function;
  let createAdminInvitation: Function;
  let acceptAdminInvitation: Function;
  let getAdminStats: Function;
  let shouldCreateAdminOnRegistration: Function;
  let initializeAdmin: Function;

  // Mock functions
  let mockAdminAccountCount: jest.Mock;
  let mockUserCreate: jest.Mock;
  let mockUserFindUnique: jest.Mock;
  let mockUserUpdate: jest.Mock;
  let mockVerificationTokenCreate: jest.Mock;
  let mockVerificationTokenFindFirst: jest.Mock;
  let mockVerificationTokenDelete: jest.Mock;
  let mockAuditCreate: jest.Mock;
  let mockHash: jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Reset environment
    process.env = { ...originalEnv };

    // Create fresh mock functions
    mockAdminAccountCount = jest.fn();
    mockUserCreate = jest.fn();
    mockUserFindUnique = jest.fn();
    mockUserUpdate = jest.fn();
    mockVerificationTokenCreate = jest.fn();
    mockVerificationTokenFindFirst = jest.fn();
    mockVerificationTokenDelete = jest.fn();
    mockAuditCreate = jest.fn();
    mockHash = jest.fn().mockResolvedValue('hashed-password');

    const mockDbObj = {
      adminAccount: {
        count: mockAdminAccountCount,
      },
      user: {
        create: mockUserCreate,
        findUnique: mockUserFindUnique,
        update: mockUserUpdate,
      },
      verificationToken: {
        create: mockVerificationTokenCreate,
        findFirst: mockVerificationTokenFindFirst,
        delete: mockVerificationTokenDelete,
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

    // Mock bcryptjs
    jest.doMock('bcryptjs', () => ({
      hash: mockHash,
      compare: jest.fn(),
    }));

    // Import modules AFTER mocking
    const adminManager = require('@/lib/auth/admin-manager');
    AdminCreationStrategy = adminManager.AdminCreationStrategy;
    needsInitialAdmin = adminManager.needsInitialAdmin;
    isAdminEmail = adminManager.isAdminEmail;
    createFirstAdmin = adminManager.createFirstAdmin;
    promoteToAdmin = adminManager.promoteToAdmin;
    demoteFromAdmin = adminManager.demoteFromAdmin;
    createAdminInvitation = adminManager.createAdminInvitation;
    acceptAdminInvitation = adminManager.acceptAdminInvitation;
    getAdminStats = adminManager.getAdminStats;
    shouldCreateAdminOnRegistration = adminManager.shouldCreateAdminOnRegistration;
    initializeAdmin = adminManager.initializeAdmin;

    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('needsInitialAdmin', () => {
    it('returns true when no admins exist', async () => {
      mockAdminAccountCount.mockResolvedValue(0);

      const result = await needsInitialAdmin();

      expect(result).toBe(true);
    });

    it('returns false when admins exist', async () => {
      mockAdminAccountCount.mockResolvedValue(1);

      const result = await needsInitialAdmin();

      expect(result).toBe(false);
    });

    it('returns false on database error', async () => {
      mockAdminAccountCount.mockRejectedValue(new Error('DB Error'));

      const result = await needsInitialAdmin();

      expect(result).toBe(false);
    });
  });

  describe('isAdminEmail', () => {
    it('returns true for email in admin list', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,super@example.com';

      const result = isAdminEmail('admin@example.com');

      expect(result).toBe(true);
    });

    it('returns false for email not in admin list', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const result = isAdminEmail('user@example.com');

      expect(result).toBe(false);
    });

    it('returns false when ADMIN_EMAILS is not set', () => {
      delete process.env.ADMIN_EMAILS;

      const result = isAdminEmail('admin@example.com');

      expect(result).toBe(false);
    });

    it('handles whitespace in email list', () => {
      process.env.ADMIN_EMAILS = ' admin@example.com , super@example.com ';

      const result = isAdminEmail('admin@example.com');

      expect(result).toBe(true);
    });
  });

  describe('createFirstAdmin', () => {
    it('creates first admin successfully', async () => {
      mockAdminAccountCount.mockResolvedValue(0);
      mockUserCreate.mockResolvedValue({
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
      });
      mockAuditCreate.mockResolvedValue({});

      const result = await createFirstAdmin(
        'admin@example.com',
        'Admin User',
        'password123'
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'hashed-password',
          emailVerified: expect.any(Date),
          isTeacher: true,
        }),
      });
    });

    it('fails if admin already exists', async () => {
      mockAdminAccountCount.mockResolvedValue(1);

      const result = await createFirstAdmin(
        'admin@example.com',
        'Admin User',
        'password123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin already exists');
    });

    it('creates admin without password (OAuth)', async () => {
      mockAdminAccountCount.mockResolvedValue(0);
      mockUserCreate.mockResolvedValue({
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
      });
      mockAuditCreate.mockResolvedValue({});

      const result = await createFirstAdmin('admin@example.com', 'Admin User');

      expect(result.success).toBe(true);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          password: null,
        }),
      });
    });

    it('handles database errors', async () => {
      mockAdminAccountCount.mockResolvedValue(0);
      mockUserCreate.mockRejectedValue(new Error('DB Error'));

      const result = await createFirstAdmin(
        'admin@example.com',
        'Admin User',
        'password123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create admin');
    });
  });

  describe('promoteToAdmin', () => {
    it('returns deprecated message', async () => {
      const result = await promoteToAdmin('user-123', 'admin-123', 'Promotion reason');

      expect(result.success).toBe(false);
      expect(result.error).toContain('deprecated');
    });
  });

  describe('demoteFromAdmin', () => {
    it('returns deprecated message', async () => {
      const result = await demoteFromAdmin('user-123', 'admin-123', 'Demotion reason');

      expect(result.success).toBe(false);
      expect(result.error).toContain('deprecated');
    });
  });

  describe('createAdminInvitation', () => {
    it('creates invitation for new email', async () => {
      mockUserFindUnique.mockResolvedValue(null);
      mockVerificationTokenCreate.mockResolvedValue({
        email: 'newadmin@example.com',
        token: 'mock-token',
        expires: new Date(),
      });
      mockAuditCreate.mockResolvedValue({});

      const result = await createAdminInvitation(
        'newadmin@example.com',
        'admin-123',
        7
      );

      expect(result.success).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.invitation?.email).toBe('newadmin@example.com');
    });

    it('fails if user already exists', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      });

      const result = await createAdminInvitation(
        'existing@example.com',
        'admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('uses default expiration of 7 days', async () => {
      mockUserFindUnique.mockResolvedValue(null);
      mockVerificationTokenCreate.mockResolvedValue({
        email: 'newadmin@example.com',
        token: 'mock-token',
        expires: new Date(),
      });
      mockAuditCreate.mockResolvedValue({});

      await createAdminInvitation('newadmin@example.com', 'admin-123');

      expect(mockVerificationTokenCreate).toHaveBeenCalled();
    });

    it('handles database errors', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('DB Error'));

      const result = await createAdminInvitation('new@example.com', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create invitation');
    });
  });

  describe('acceptAdminInvitation', () => {
    it('accepts valid invitation and creates admin', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      mockVerificationTokenFindFirst.mockResolvedValue({
        email: 'newadmin@example.com',
        token: 'valid-token',
        expires: futureDate,
      });
      mockUserCreate.mockResolvedValue({
        id: 'new-user-123',
        email: 'newadmin@example.com',
        name: 'New Admin',
      });
      mockVerificationTokenDelete.mockResolvedValue({});
      mockAuditCreate.mockResolvedValue({});

      const result = await acceptAdminInvitation(
        'valid-token',
        'newadmin@example.com',
        'New Admin',
        'password123'
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    it('fails for invalid or expired invitation', async () => {
      mockVerificationTokenFindFirst.mockResolvedValue(null);

      const result = await acceptAdminInvitation(
        'invalid-token',
        'newadmin@example.com',
        'New Admin',
        'password123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired invitation');
    });

    it('handles database errors', async () => {
      mockVerificationTokenFindFirst.mockRejectedValue(new Error('DB Error'));

      const result = await acceptAdminInvitation(
        'token',
        'email@example.com',
        'Name',
        'password'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to accept invitation');
    });
  });

  describe('getAdminStats', () => {
    it('returns admin statistics', async () => {
      mockAdminAccountCount.mockResolvedValue(3);

      const stats = await getAdminStats();

      expect(stats.totalAdmins).toBe(3);
      expect(stats.activeAdmins).toBe(0);
      expect(stats.recentActivity).toEqual([]);
    });

    it('returns zero stats on error', async () => {
      mockAdminAccountCount.mockRejectedValue(new Error('DB Error'));

      const stats = await getAdminStats();

      expect(stats.totalAdmins).toBe(0);
      expect(stats.activeAdmins).toBe(0);
    });
  });

  describe('shouldCreateAdminOnRegistration', () => {
    it('returns true for first user when FIRST_USER_IS_ADMIN is set', async () => {
      process.env.FIRST_USER_IS_ADMIN = 'true';
      mockAdminAccountCount.mockResolvedValue(0);

      const result = await shouldCreateAdminOnRegistration('user@example.com');

      expect(result).toBe(true);
    });

    it('returns true for whitelisted admin email', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const result = await shouldCreateAdminOnRegistration('admin@example.com');

      expect(result).toBe(true);
    });

    it('returns false for regular user', async () => {
      delete process.env.FIRST_USER_IS_ADMIN;
      delete process.env.ADMIN_EMAILS;
      mockAdminAccountCount.mockResolvedValue(1);

      const result = await shouldCreateAdminOnRegistration('user@example.com');

      expect(result).toBe(false);
    });
  });

  describe('initializeAdmin', () => {
    it('skips initialization when admin exists', async () => {
      mockAdminAccountCount.mockResolvedValue(1);

      await initializeAdmin();

      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    it('creates admin from environment variables', async () => {
      mockAdminAccountCount.mockResolvedValue(0);
      process.env.DEFAULT_ADMIN_EMAIL = 'default@example.com';
      process.env.DEFAULT_ADMIN_PASSWORD = 'defaultPassword123';
      mockUserCreate.mockResolvedValue({
        id: 'user-123',
        email: 'default@example.com',
      });
      mockAuditCreate.mockResolvedValue({});

      await initializeAdmin();

      expect(mockUserCreate).toHaveBeenCalled();
    });

    it('logs warning when no admin config exists', async () => {
      mockAdminAccountCount.mockResolvedValue(0);
      delete process.env.DEFAULT_ADMIN_EMAIL;
      delete process.env.DEFAULT_ADMIN_PASSWORD;

      await initializeAdmin();

      // Should not create any user since no config exists
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      mockAdminAccountCount.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(initializeAdmin()).resolves.not.toThrow();
    });
  });

  describe('AdminCreationStrategy enum', () => {
    it('has correct strategy values', () => {
      expect(AdminCreationStrategy.FIRST_USER).toBe('FIRST_USER');
      expect(AdminCreationStrategy.ENV_EMAIL_LIST).toBe('ENV_EMAIL_LIST');
      expect(AdminCreationStrategy.CLI_COMMAND).toBe('CLI_COMMAND');
      expect(AdminCreationStrategy.INVITATION).toBe('INVITATION');
      expect(AdminCreationStrategy.SEED_SCRIPT).toBe('SEED_SCRIPT');
    });
  });
});

import {
  cleanupExpiredMFANotifications,
  createMFANotification,
  dismissMFANotification,
  getMFANotifications,
  initializeMFANotificationsForNewAdmin,
  markMFANotificationAsRead,
  scheduleMFAReminders,
} from '@/lib/auth/mfa-notifications';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AdminRole } from '@/types/admin-role';

describe('lib/auth/mfa-notifications', () => {
  const mockAdminFindUnique = db.adminAccount.findUnique as jest.Mock;
  const mockAdminFindMany = db.adminAccount.findMany as jest.Mock;
  const mockNotificationFindFirst = db.notification.findFirst as jest.Mock;
  const mockNotificationCreate = db.notification.create as jest.Mock;
  const mockNotificationFindMany = db.notification.findMany as jest.Mock;
  const mockNotificationUpdate = db.notification.update as jest.Mock;
  const mockNotificationDeleteMany = db.notification.deleteMany as jest.Mock;

  const buildAdmin = (overrides: Record<string, any> = {}) => ({
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: AdminRole.ADMIN,
    isTwoFactorEnabled: false,
    totpEnabled: false,
    totpVerified: false,
    createdAt: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        ...(globalThis.crypto || {}),
        randomUUID: jest.fn(() => 'uuid-1'),
      },
      configurable: true,
    });

    mockAdminFindUnique.mockResolvedValue(buildAdmin());
    mockNotificationFindFirst.mockResolvedValue(null);
    mockNotificationCreate.mockImplementation(async (args: any) => ({
      id: args.data.id ?? 'notification-1',
      userId: args.data.userId,
      type: args.data.type,
      title: args.data.title,
      message: args.data.message,
      read: false,
      createdAt: new Date(),
    }));
    mockNotificationFindMany.mockResolvedValue([]);
    mockNotificationUpdate.mockResolvedValue({ id: 'notification-1', read: true });
    mockNotificationDeleteMany.mockResolvedValue({ count: 2 });
    mockAdminFindMany.mockResolvedValue([]);
  });

  it('returns null when admin user is not found', async () => {
    mockAdminFindUnique.mockResolvedValue(null);

    const result = await createMFANotification('missing', 'warning_issued');
    expect(result).toBeNull();
  });

  it('returns null when user is not an admin role', async () => {
    mockAdminFindUnique.mockResolvedValue(buildAdmin({ role: 'USER' }));

    const result = await createMFANotification('user-1', 'warning_issued');
    expect(result).toBeNull();
  });

  it('returns null for unsupported notification type', async () => {
    const result = await createMFANotification('admin-1', 'invalid_type' as any);
    expect(result).toBeNull();
  });

  it('returns null if unread notification of same type already exists', async () => {
    mockNotificationFindFirst.mockResolvedValue({ id: 'existing-1' });

    const result = await createMFANotification('admin-1', 'warning_issued');

    expect(result).toBeNull();
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('creates warning notification and maps response payload', async () => {
    const result = await createMFANotification('admin-1', 'warning_issued');

    expect(result).not.toBeNull();
    expect(result?.type).toBe('warning_issued');
    expect(result?.priority).toBe('medium');
    expect(result?.read).toBe(false);
    expect(mockNotificationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'admin-1',
        type: 'MFA_WARNING_ISSUED',
      }),
    }));
  });

  it('triggers high-priority email notification path', async () => {
    await createMFANotification('admin-1', 'enforcement_imminent');

    expect(logger.info).toHaveBeenCalledWith(
      '[MFA_EMAIL_NOTIFICATION] Would send email notification',
      expect.objectContaining({
        to: 'admin@example.com',
        type: 'enforcement_imminent',
        priority: 'high',
      })
    );
  });

  it('returns null and logs when notification creation fails', async () => {
    mockNotificationCreate.mockRejectedValue(new Error('db create failed'));

    const result = await createMFANotification('admin-1', 'warning_issued');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      '[MFA_NOTIFICATION] Failed to create notification',
      expect.objectContaining({
        userId: 'admin-1',
        type: 'warning_issued',
      })
    );
  });

  it('schedules reminders and creates expected notification types by enforcement stage', async () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const admins = [
      buildAdmin({ id: 'a-hard', createdAt: new Date(Date.now() - (10 * dayMs)) }),
      buildAdmin({ id: 'a-imminent', createdAt: new Date(Date.now() - (6 * dayMs)) }),
      buildAdmin({ id: 'a-warning', createdAt: new Date(Date.now() - (5 * dayMs)) }),
      buildAdmin({ id: 'a-grace', createdAt: new Date(Date.now() - (1 * dayMs)) }),
      buildAdmin({
        id: 'a-ready',
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
      }),
    ];

    mockAdminFindMany.mockResolvedValue(admins);
    mockAdminFindUnique.mockImplementation(async ({ where }: any) =>
      admins.find((a) => a.id === where.id) ?? null
    );

    await scheduleMFAReminders();

    const createdTypes = mockNotificationCreate.mock.calls.map((call) => call[0].data.type);
    expect(createdTypes).toContain('MFA_ACCESS_BLOCKED');
    expect(createdTypes).toContain('MFA_ENFORCEMENT_IMMINENT');
    expect(createdTypes).toContain('MFA_WARNING_ISSUED');
    expect(createdTypes).toContain('MFA_GRACE_PERIOD_STARTED');
    expect(createdTypes).toHaveLength(4);
  });

  it('logs and continues when reminder scheduler query fails', async () => {
    mockAdminFindMany.mockRejectedValue(new Error('query failed'));

    await expect(scheduleMFAReminders()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      '[MFA_REMINDERS] Failed to schedule reminders',
      expect.objectContaining({ error: 'query failed' })
    );
  });

  it('gets MFA notifications with unread filter by default', async () => {
    mockNotificationFindMany.mockResolvedValue([
      {
        id: 'n1',
        userId: 'admin-1',
        type: 'MFA_WARNING_ISSUED',
        title: 'Warning',
        message: 'Set up MFA',
        read: false,
        createdAt: new Date(),
      },
    ]);

    const result = await getMFANotifications('admin-1');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('warning_issued');
    expect(mockNotificationFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'admin-1', read: false }),
    }));
  });

  it('gets MFA notifications including read items when requested', async () => {
    await getMFANotifications('admin-1', true);

    expect(mockNotificationFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'admin-1',
        type: { startsWith: 'MFA_' },
      }),
    }));
    const queryArgs = mockNotificationFindMany.mock.calls[0][0];
    expect(queryArgs.where.read).toBeUndefined();
  });

  it('returns empty list and logs on get notifications error', async () => {
    mockNotificationFindMany.mockRejectedValue(new Error('findMany failed'));

    const result = await getMFANotifications('admin-2');

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      '[MFA_NOTIFICATIONS] Failed to get notifications',
      expect.objectContaining({ userId: 'admin-2', error: 'findMany failed' })
    );
  });

  it('marks and dismisses notifications, with error handling', async () => {
    await expect(markMFANotificationAsRead('n1', 'admin-1')).resolves.toBe(true);
    await expect(dismissMFANotification('n1', 'admin-1')).resolves.toBe(true);

    expect(mockNotificationUpdate).toHaveBeenCalledTimes(2);
    expect(mockNotificationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'n1', userId: 'admin-1' }),
      data: { read: true },
    }));

    mockNotificationUpdate.mockRejectedValueOnce(new Error('update failed'));
    await expect(markMFANotificationAsRead('n2', 'admin-1')).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      '[MFA_NOTIFICATION] Failed to mark as read',
      expect.objectContaining({ notificationId: 'n2' })
    );

    mockNotificationUpdate.mockRejectedValueOnce(new Error('update failed'));
    await expect(dismissMFANotification('n3', 'admin-1')).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      '[MFA_NOTIFICATION] Failed to dismiss',
      expect.objectContaining({ notificationId: 'n3' })
    );
  });

  it('cleans up expired MFA notifications and logs cleanup failures', async () => {
    await cleanupExpiredMFANotifications();

    expect(mockNotificationDeleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        type: { startsWith: 'MFA_' },
        read: true,
        createdAt: { lt: expect.any(Date) },
      }),
    }));

    mockNotificationDeleteMany.mockRejectedValueOnce(new Error('delete failed'));
    await expect(cleanupExpiredMFANotifications()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      '[MFA_NOTIFICATION_CLEANUP] Failed to cleanup notifications',
      expect.objectContaining({ error: 'delete failed' })
    );
  });

  it('schedules delayed notification initialization for new admins', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await initializeMFANotificationsForNewAdmin('admin-new');

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    expect(logger.info).toHaveBeenCalledWith(
      '[MFA_NOTIFICATION] Initialized notifications for new admin',
      expect.objectContaining({ userId: 'admin-new' })
    );

    setTimeoutSpy.mockRestore();
  });
});

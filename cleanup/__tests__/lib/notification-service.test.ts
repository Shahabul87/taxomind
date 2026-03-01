/**
 * Tests for Notification Service
 * Source: lib/notification-service.ts
 */

import { NotificationService, NotificationTemplates } from '@/lib/notification-service';
import { db } from '@/lib/db';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('creates a notification in the database', async () => {
      const mockNotif = { id: 'notif_1', title: 'Test', message: 'Hello', read: false };
      (db.notification.create as jest.Mock).mockResolvedValue(mockNotif);

      const result = await NotificationService.createNotification({
        title: 'Test',
        message: 'Hello',
        type: 'SYSTEM_ANNOUNCEMENT',
        userId: 'user-1',
      });

      expect(result.success).toBe(true);
      expect(result.notification).toEqual(mockNotif);
      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test',
            message: 'Hello',
            type: 'SYSTEM_ANNOUNCEMENT',
            userId: 'user-1',
            read: false,
          }),
        })
      );
    });

    it('handles database error', async () => {
      (db.notification.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await NotificationService.createNotification({
        title: 'Test',
        message: 'Hello',
        type: 'SYSTEM_ANNOUNCEMENT',
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create notification');
    });
  });

  describe('markAsRead', () => {
    it('marks a specific notification as read', async () => {
      const updated = { id: 'notif_1', read: true };
      (db.notification.update as jest.Mock).mockResolvedValue(updated);

      const result = await NotificationService.markAsRead('notif_1', 'user-1');
      expect(result.success).toBe(true);
      expect(db.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif_1', userId: 'user-1' },
          data: { read: true },
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('fetches paginated notifications', async () => {
      const notifications = [{ id: 'n1', title: 'Test', read: false }];
      (db.notification.findMany as jest.Mock).mockResolvedValue(notifications);
      (db.notification.count as jest.Mock)
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unread

      const result = await NotificationService.getUserNotifications('user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(1);
      expect(result.pagination?.page).toBe(1);
    });
  });

  describe('deleteNotification', () => {
    it('deletes a specific notification', async () => {
      (db.notification.delete as jest.Mock).mockResolvedValue({});

      const result = await NotificationService.deleteNotification('notif_1', 'user-1');
      expect(result.success).toBe(true);
      expect(db.notification.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif_1', userId: 'user-1' },
        })
      );
    });
  });

  describe('createBulkNotifications', () => {
    it('creates notifications for multiple users', async () => {
      (db.notification.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await NotificationService.createBulkNotifications({
        title: 'Update',
        message: 'System update',
        type: 'SYSTEM_ANNOUNCEMENT',
        userIds: ['u1', 'u2', 'u3'],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('handles error in bulk create', async () => {
      (db.notification.createMany as jest.Mock).mockRejectedValue(new Error('fail'));

      const result = await NotificationService.createBulkNotifications({
        title: 'Update',
        message: 'msg',
        type: 'SYSTEM_ANNOUNCEMENT',
        userIds: ['u1'],
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('NotificationTemplates', () => {
  it('creates courseEnrollment template', () => {
    const data = NotificationTemplates.courseEnrollment('user-1', 'TypeScript');
    expect(data.type).toBe('COURSE_ENROLLMENT');
    expect(data.message).toContain('TypeScript');
  });

  it('creates courseCompletion template', () => {
    const data = NotificationTemplates.courseCompletion('user-1', 'React');
    expect(data.type).toBe('COURSE_COMPLETION');
    expect(data.message).toContain('React');
  });

  it('creates systemAnnouncement template for multiple users', () => {
    const data = NotificationTemplates.systemAnnouncement(
      ['u1', 'u2'],
      'Maintenance',
      'System will be down'
    );
    expect(data.type).toBe('SYSTEM_ANNOUNCEMENT');
    expect(data.userIds).toEqual(['u1', 'u2']);
  });
});

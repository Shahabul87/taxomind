jest.unmock('@/actions/admin-role-management');

import {
  changeUserRole,
  requestInstructorRole,
  reviewInstructorRequest,
  getPendingInstructorRequests,
} from '@/actions/admin-role-management';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { adminAuth } from '@/auth.admin';
import { isAdminSession } from '@/types/admin-session';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/types/admin-session', () => ({
  isAdminSession: jest.fn(),
}));

const mockCurrentUser = currentUser as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;
const mockIsAdminSession = isAdminSession as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

// The global jest.setup.js mock for @/lib/db does not include 'instructorVerification'.
// We must attach it manually so the real action code can call db.instructorVerification.*.
const mockInstructorVerification = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
};

beforeAll(() => {
  // Attach the instructorVerification model to the mock db if it does not already exist
  if (!(mockDb as Record<string, unknown>).instructorVerification) {
    (mockDb as Record<string, unknown>).instructorVerification = mockInstructorVerification;
  }
});

// Deterministic UUID for assertions
const MOCK_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Store the original randomUUID so we can restore it
const originalRandomUUID = global.crypto.randomUUID;

describe('admin-role-management actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset instructorVerification mocks each run
    mockInstructorVerification.findUnique.mockReset();
    mockInstructorVerification.findMany.mockReset().mockResolvedValue([]);
    mockInstructorVerification.upsert.mockReset();
    mockInstructorVerification.update.mockReset();

    // Stable UUID for audit log and verification record creation.
    // global.crypto is a custom object from jest.setup.js, so we replace the
    // function directly rather than using jest.spyOn (which requires an own property).
    global.crypto.randomUUID = jest.fn().mockReturnValue(MOCK_UUID) as typeof global.crypto.randomUUID;
  });

  afterEach(() => {
    // Restore original randomUUID
    global.crypto.randomUUID = originalRandomUUID;
  });

  // =========================================================================
  // 1. changeUserRole (deprecated)
  // =========================================================================
  describe('changeUserRole', () => {
    it('should always return a deprecation error', async () => {
      const result = await changeUserRole();

      expect(result).toEqual({
        error: 'Users no longer have roles. Use teacher verification instead.',
      });
    });
  });

  // =========================================================================
  // 2. requestInstructorRole
  // =========================================================================
  describe('requestInstructorRole', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
    };

    it('should return error when user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(null);

      const result = await requestInstructorRole();

      expect(result).toEqual({
        error: 'Unauthorized: Authentication required',
      });
      expect(mockCurrentUser).toHaveBeenCalled();
    });

    it('should return error when user object has no id', async () => {
      mockCurrentUser.mockResolvedValue({ email: 'test@example.com' });

      const result = await requestInstructorRole();

      expect(result).toEqual({
        error: 'Unauthorized: Authentication required',
      });
    });

    it('should return error when user is already a teacher', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: true });

      const result = await requestInstructorRole('QUALIFICATION', 'https://example.com/doc');

      expect(result).toEqual({
        error: 'You already have instructor privileges',
      });
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { isTeacher: true },
      });
    });

    it('should return error when a pending request already exists', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
      mockInstructorVerification.findUnique.mockResolvedValue({
        id: 'existing-req',
        userId: mockUser.id,
        status: 'PENDING',
      });

      const result = await requestInstructorRole();

      expect(result).toEqual({
        error: 'You already have a pending instructor request',
      });
    });

    it('should allow resubmission when previous request was rejected', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
      mockInstructorVerification.findUnique.mockResolvedValue({
        id: 'old-req',
        userId: mockUser.id,
        status: 'REJECTED',
      });

      const upsertedRecord = { id: MOCK_UUID, userId: mockUser.id, status: 'PENDING' };
      mockInstructorVerification.upsert.mockResolvedValue(upsertedRecord);
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await requestInstructorRole('DEGREE', 'https://example.com/degree.pdf', 'MS in CS');

      expect(result).toEqual({
        success: 'Instructor role request submitted. An admin will review your application soon.',
        requestId: MOCK_UUID,
      });

      // Verify the upsert was called with correct data
      expect(mockInstructorVerification.upsert).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        update: {
          status: 'PENDING',
          documentType: 'DEGREE',
          documentUrl: 'https://example.com/degree.pdf',
          verificationNotes: 'MS in CS',
          verifiedAt: null,
          verifiedBy: null,
        },
        create: {
          id: MOCK_UUID,
          userId: mockUser.id,
          status: 'PENDING',
          documentType: 'DEGREE',
          documentUrl: 'https://example.com/degree.pdf',
          verificationNotes: 'MS in CS',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should successfully create a new instructor request with defaults', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
      mockInstructorVerification.findUnique.mockResolvedValue(null);

      const upsertedRecord = { id: MOCK_UUID, userId: mockUser.id, status: 'PENDING' };
      mockInstructorVerification.upsert.mockResolvedValue(upsertedRecord);
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await requestInstructorRole();

      expect(result).toEqual({
        success: 'Instructor role request submitted. An admin will review your application soon.',
        requestId: MOCK_UUID,
      });

      // Default parameter values
      expect(mockInstructorVerification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            documentType: 'QUALIFICATION',
            documentUrl: '',
          }),
        })
      );
    });

    it('should create an audit log entry after successful request', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
      mockInstructorVerification.findUnique.mockResolvedValue(null);
      mockInstructorVerification.upsert.mockResolvedValue({
        id: MOCK_UUID,
        userId: mockUser.id,
        status: 'PENDING',
      });
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      await requestInstructorRole('CERTIFICATE', 'https://example.com/cert', 'Teaching cert');

      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: {
          id: MOCK_UUID,
          userId: mockUser.id,
          action: 'CREATE',
          entityType: 'INSTRUCTOR_VERIFICATION',
          entityId: MOCK_UUID,
          context: {
            type: 'INSTRUCTOR_REQUEST',
            documentType: 'CERTIFICATE',
            documentUrl: 'https://example.com/cert',
            verificationNotes: 'Teaching cert',
          },
        },
      });
    });

    it('should log the request via logger on success', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
      mockInstructorVerification.findUnique.mockResolvedValue(null);
      mockInstructorVerification.upsert.mockResolvedValue({ id: MOCK_UUID });
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      await requestInstructorRole();

      expect(logger.info).toHaveBeenCalledWith(
        `Instructor role requested by user ${mockUser.email}`
      );
    });

    it('should return generic error when database operation fails', async () => {
      mockCurrentUser.mockResolvedValue(mockUser);
      (mockDb.user.findUnique as jest.Mock).mockRejectedValue(new Error('Connection lost'));

      const result = await requestInstructorRole();

      expect(result).toEqual({
        error: 'Failed to submit instructor request',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Error requesting instructor role:',
        expect.any(Error)
      );
    });
  });

  // =========================================================================
  // 3. reviewInstructorRequest
  // =========================================================================
  describe('reviewInstructorRequest', () => {
    const adminUser = {
      id: 'admin-1',
      role: 'ADMIN',
      email: 'admin@example.com',
      name: 'Admin User',
    };

    const adminSession = {
      user: adminUser,
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    const pendingRequest = {
      id: 'req-1',
      userId: 'user-1',
      status: 'PENDING',
      documentType: 'QUALIFICATION',
      documentUrl: 'https://example.com/doc',
      user: {
        id: 'user-1',
        email: 'requester@example.com',
        name: 'Requester',
      },
    };

    it('should return error when not authenticated as admin', async () => {
      mockAdminAuth.mockResolvedValue(null);
      mockIsAdminSession.mockReturnValue(false);

      const result = await reviewInstructorRequest('req-1', true);

      expect(result).toEqual({
        error: 'Unauthorized: Admin authentication required',
      });
    });

    it('should return error when session exists but is not an admin session', async () => {
      mockAdminAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsAdminSession.mockReturnValue(false);

      const result = await reviewInstructorRequest('req-1', true);

      expect(result).toEqual({
        error: 'Unauthorized: Admin authentication required',
      });
    });

    it('should return error when request is not found', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findUnique.mockResolvedValue(null);

      const result = await reviewInstructorRequest('non-existent', true);

      expect(result).toEqual({ error: 'Request not found' });
    });

    it('should return error when request has already been reviewed', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findUnique.mockResolvedValue({
        ...pendingRequest,
        status: 'VERIFIED',
      });

      const result = await reviewInstructorRequest('req-1', true);

      expect(result).toEqual({ error: 'Request has already been reviewed' });
    });

    it('should approve request, update user isTeacher, and create audit log', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findUnique.mockResolvedValue(pendingRequest);

      const updatedRequest = { ...pendingRequest, status: 'VERIFIED', verifiedBy: adminUser.id };
      mockInstructorVerification.update.mockResolvedValue(updatedRequest);
      (mockDb.user.update as jest.Mock).mockResolvedValue({});
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await reviewInstructorRequest('req-1', true, 'Credentials verified');

      expect(result).toEqual({
        success: 'Instructor request approved successfully',
        updatedRequest,
      });

      // Verify verification record updated to VERIFIED
      expect(mockInstructorVerification.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: {
          status: 'VERIFIED',
          verifiedAt: expect.any(Date),
          verifiedBy: adminUser.id,
          verificationNotes: 'Credentials verified',
        },
      });

      // Verify user's isTeacher flag is set when approved
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: pendingRequest.userId },
        data: {
          isTeacher: true,
          teacherActivatedAt: expect.any(Date),
        },
      });

      // Verify audit log
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: adminUser.id,
          action: 'APPROVE',
          entityType: 'INSTRUCTOR_VERIFICATION',
          entityId: 'req-1',
          changes: { status: 'VERIFIED', reviewNotes: 'Credentials verified' },
          context: {
            requestUserId: pendingRequest.userId,
            requestUserEmail: pendingRequest.user.email,
            verifiedBy: adminUser.email,
          },
        }),
      });
    });

    it('should reject request without updating user isTeacher flag', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findUnique.mockResolvedValue(pendingRequest);

      const updatedRequest = { ...pendingRequest, status: 'REJECTED', verifiedBy: adminUser.id };
      mockInstructorVerification.update.mockResolvedValue(updatedRequest);
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await reviewInstructorRequest('req-1', false, 'Insufficient documentation');

      expect(result).toEqual({
        success: 'Instructor request rejected successfully',
        updatedRequest,
      });

      // Verification record updated to REJECTED
      expect(mockInstructorVerification.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: {
          status: 'REJECTED',
          verifiedAt: expect.any(Date),
          verifiedBy: adminUser.id,
          verificationNotes: 'Insufficient documentation',
        },
      });

      // User isTeacher should NOT be updated on rejection
      expect(mockDb.user.update).not.toHaveBeenCalled();

      // Audit log should record REJECT action
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'REJECT',
          changes: { status: 'REJECTED', reviewNotes: 'Insufficient documentation' },
        }),
      });
    });

    it('should log the review outcome via logger', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findUnique.mockResolvedValue(pendingRequest);
      mockInstructorVerification.update.mockResolvedValue(pendingRequest);
      (mockDb.auditLog.create as jest.Mock).mockResolvedValue({});

      await reviewInstructorRequest('req-1', true);

      expect(logger.info).toHaveBeenCalledWith(
        `Instructor request req-1 approved by ${adminUser.email}`
      );
    });

    it('should return generic error when database operation fails during review', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findUnique.mockRejectedValue(new Error('DB timeout'));

      const result = await reviewInstructorRequest('req-1', true);

      expect(result).toEqual({ error: 'Failed to review instructor request' });
      expect(logger.error).toHaveBeenCalledWith(
        'Error reviewing instructor request:',
        expect.any(Error)
      );
    });
  });

  // =========================================================================
  // 4. getPendingInstructorRequests
  // =========================================================================
  describe('getPendingInstructorRequests', () => {
    const adminSession = {
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    it('should return error when not authenticated as admin', async () => {
      mockAdminAuth.mockResolvedValue(null);
      mockIsAdminSession.mockReturnValue(false);

      const result = await getPendingInstructorRequests();

      expect(result).toEqual({
        error: 'Unauthorized: Admin authentication required',
      });
    });

    it('should return pending requests for authenticated admin', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);

      const pendingRequests = [
        {
          id: 'req-1',
          userId: 'user-1',
          status: 'PENDING',
          documentType: 'QUALIFICATION',
          createdAt: new Date('2026-01-15'),
          user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', createdAt: new Date() },
        },
        {
          id: 'req-2',
          userId: 'user-2',
          status: 'PENDING',
          documentType: 'DEGREE',
          createdAt: new Date('2026-01-20'),
          user: { id: 'user-2', name: 'Bob', email: 'bob@example.com', createdAt: new Date() },
        },
      ];
      mockInstructorVerification.findMany.mockResolvedValue(pendingRequests);

      const result = await getPendingInstructorRequests();

      expect(result).toEqual({ success: true, requests: pendingRequests });

      // Verify the query filters by PENDING status and includes user data
      expect(mockInstructorVerification.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no pending requests exist', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findMany.mockResolvedValue([]);

      const result = await getPendingInstructorRequests();

      expect(result).toEqual({ success: true, requests: [] });
    });

    it('should return generic error when database operation fails', async () => {
      mockAdminAuth.mockResolvedValue(adminSession);
      mockIsAdminSession.mockReturnValue(true);
      mockInstructorVerification.findMany.mockRejectedValue(new Error('Query failed'));

      const result = await getPendingInstructorRequests();

      expect(result).toEqual({ error: 'Failed to fetch instructor requests' });
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching instructor requests:',
        expect.any(Error)
      );
    });
  });
});

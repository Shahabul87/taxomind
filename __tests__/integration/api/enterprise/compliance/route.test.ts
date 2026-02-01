import { NextRequest } from 'next/server';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../../../utils/test-db';
import { TestDataFactory } from '../../../../utils/test-factory';
import { ApiTestHelpers, AuthTestHelpers } from '../../../../utils/test-helpers';
import { setupMockProviders, resetMockProviders } from '../../../../utils/mock-providers';

// Get mocked modules
const mockAuth = jest.requireMock('@/auth') as { auth: jest.Mock };
const { db } = jest.requireMock('@/lib/db') as { db: Record<string, Record<string, jest.Mock>> };

// Import the actual route handler
import { GET, POST } from '@/app/api/enterprise/compliance/route';

function mockAdminSession(userId: string) {
  mockAuth.auth.mockResolvedValue({
    user: { id: userId, role: 'ADMIN', email: 'admin@test.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  });
}

function mockUserSession(userId: string) {
  mockAuth.auth.mockResolvedValue({
    user: { id: userId, role: 'USER', email: 'user@test.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  });
}

function mockNoSession() {
  mockAuth.auth.mockResolvedValue(null);
}

// Mock compliance events data
const mockComplianceEvents = [
  {
    id: 'evt-1',
    eventType: 'DATA_ACCESS',
    complianceFramework: 'GDPR',
    status: 'COMPLIANT',
    severity: 'LOW',
    details: { description: 'User data access logged' },
    createdAt: new Date().toISOString(),
    organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
  },
  {
    id: 'evt-2',
    eventType: 'DATA_EXPORT',
    complianceFramework: 'CCPA',
    status: 'UNDER_REVIEW',
    severity: 'MEDIUM',
    details: { description: 'Export request' },
    createdAt: new Date().toISOString(),
    organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
  },
];

describe('/api/enterprise/compliance Integration Tests', () => {
  let testData: {
    users: Record<string, { id: string; email: string; name: string; role: string }>;
    courses: Array<{ id: string; title: string; userId: string; isPublished: boolean }>;
    categories: Array<{ id: string; name: string }>;
  };

  beforeAll(async () => {
    setupMockProviders();
    testData = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    resetMockProviders();
    mockNoSession();

    // Setup default complianceEvent mock behavior
    if (db.complianceEvent) {
      db.complianceEvent.findMany.mockResolvedValue(mockComplianceEvents);
      db.complianceEvent.count.mockResolvedValue(2);
      db.complianceEvent.groupBy.mockResolvedValue([]);
      db.complianceEvent.create.mockResolvedValue({
        id: 'new-evt-1',
        eventType: 'DATA_ACCESS',
        complianceFramework: 'GDPR',
        status: 'UNDER_REVIEW',
        severity: 'LOW',
        details: {},
        createdAt: new Date().toISOString(),
      });
    }
    if (db.auditLog) {
      db.auditLog.create.mockResolvedValue({ id: 'audit-1' });
    }
  });

  describe('GET /api/enterprise/compliance', () => {
    it('should return compliance dashboard data for admin', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('events');
      expect(data.data).toHaveProperty('summary');
    });

    it('should include events with proper structure', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.data.events)).toBe(true);
      if (data.data.events.length > 0) {
        const event = data.data.events[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('eventType');
        expect(event).toHaveProperty('complianceFramework');
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('severity');
      }
    });

    it('should include summary with compliance score', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary).toBeDefined();
      expect(data.data.summary).toHaveProperty('totalEvents');
      expect(data.data.summary).toHaveProperty('complianceScore');
    });

    it('should include framework breakdown in summary', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary).toHaveProperty('statusBreakdown');
      expect(data.data.summary).toHaveProperty('severityBreakdown');
      expect(data.data.summary).toHaveProperty('frameworkBreakdown');
    });

    it('should provide severity breakdown', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary).toHaveProperty('severityBreakdown');
      expect(data.data.summary).toHaveProperty('recentCritical');
    });

    it('should include recent critical events', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary).toHaveProperty('recentCritical');
      expect(Array.isArray(data.data.summary.recentCritical)).toBe(true);
    });

    it('should deny access to non-admin users', async () => {
      mockUserSession(testData.users.teacher.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.teacher.id}`,
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return demo data when no session', async () => {
      mockNoSession();

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
      });

      const response = await GET(request);
      const data = await response.json();

      // Route returns demo data for unauthenticated users in dev mode
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('events');
      expect(data.data).toHaveProperty('summary');
    });

    it('should support query parameter filtering', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance?framework=GDPR&severity=HIGH',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('query');
    });

    it('should handle compliance metrics aggregation', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary).toHaveProperty('complianceScore');
      const score = data.data.summary.complianceScore;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('POST /api/enterprise/compliance', () => {
    it('should record a compliance event for admin', async () => {
      mockAdminSession(testData.users.admin.id);

      const eventData = {
        eventType: 'DATA_ACCESS',
        complianceFramework: 'GDPR',
        status: 'COMPLIANT',
        severity: 'LOW',
        details: { description: 'Authorized data access' },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: eventData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('id');
    });

    it('should create an audit log entry when recording event', async () => {
      mockAdminSession(testData.users.admin.id);

      const eventData = {
        eventType: 'SECURITY_INCIDENT',
        complianceFramework: 'GDPR',
        severity: 'CRITICAL',
        details: { description: 'Security incident detected' },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: eventData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      await POST(request);

      // Verify audit log was created
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it('should support different compliance frameworks', async () => {
      mockAdminSession(testData.users.admin.id);

      const frameworks = ['GDPR', 'CCPA', 'FERPA', 'HIPAA'] as const;

      for (const framework of frameworks) {
        const eventData = {
          eventType: 'DATA_ACCESS' as const,
          complianceFramework: framework,
          details: { description: `${framework} compliance check` },
        };

        const request = ApiTestHelpers.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/enterprise/compliance',
          body: eventData,
          headers: {
            cookie: `next-auth.session-token=${testData.users.admin.id}`,
          },
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('should support different event types', async () => {
      mockAdminSession(testData.users.admin.id);

      const eventTypes = ['DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION', 'POLICY_VIOLATION'] as const;

      for (const eventType of eventTypes) {
        const eventData = {
          eventType,
          complianceFramework: 'GDPR' as const,
          details: { description: `${eventType} event` },
        };

        const request = ApiTestHelpers.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/enterprise/compliance',
          body: eventData,
          headers: {
            cookie: `next-auth.session-token=${testData.users.admin.id}`,
          },
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('should support severity levels', async () => {
      mockAdminSession(testData.users.admin.id);

      const eventData = {
        eventType: 'SECURITY_INCIDENT',
        complianceFramework: 'GDPR',
        severity: 'CRITICAL',
        details: { description: 'Critical security incident' },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: eventData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should deny access to non-admin users', async () => {
      mockUserSession(testData.users.teacher.id);

      const eventData = {
        eventType: 'DATA_ACCESS',
        complianceFramework: 'GDPR',
        details: {},
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: eventData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.teacher.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      mockAdminSession(testData.users.admin.id);

      const invalidData = {
        // Missing required eventType and complianceFramework
        details: { description: 'Test' },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: invalidData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject invalid event types', async () => {
      mockAdminSession(testData.users.admin.id);

      const invalidData = {
        eventType: 'INVALID_TYPE',
        complianceFramework: 'GDPR',
        details: {},
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: invalidData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors on GET', async () => {
      mockAdminSession(testData.users.admin.id);

      // Mock database error
      db.complianceEvent.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should handle malformed JSON requests', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = new NextRequest(
        'http://localhost:3000/api/enterprise/compliance',
        {
          method: 'POST',
          body: '{invalid json}',
          headers: {
            'content-type': 'application/json',
            cookie: `next-auth.session-token=${testData.users.admin.id}`,
          },
        }
      );

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });

    it('should handle database errors on POST', async () => {
      mockAdminSession(testData.users.admin.id);

      db.complianceEvent.create.mockRejectedValueOnce(
        new Error('Database error')
      );

      const eventData = {
        eventType: 'DATA_ACCESS',
        complianceFramework: 'GDPR',
        details: { description: 'Test' },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: eventData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Security and Performance', () => {
    it('should sanitize sensitive information in responses', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('secret');
      expect(responseText).not.toContain('private_key');
    });

    it('should respond within acceptable time limits', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should handle concurrent compliance requests', async () => {
      mockAdminSession(testData.users.admin.id);

      const requests = Array.from({ length: 5 }, () =>
        ApiTestHelpers.createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/enterprise/compliance',
          headers: {
            cookie: `next-auth.session-token=${testData.users.admin.id}`,
          },
        })
      );

      const responses = await Promise.all(requests.map((request) => GET(request)));

      expect(responses).toHaveLength(5);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should create audit trail for POST operations', async () => {
      mockAdminSession(testData.users.admin.id);

      const eventData = {
        eventType: 'DATA_ACCESS',
        complianceFramework: 'GDPR',
        details: { description: 'Audit trail test' },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: eventData,
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      await POST(request);

      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entityType: 'COMPLIANCE_EVENT',
          }),
        })
      );
    });
  });

  describe('Data Export and Reporting', () => {
    it('should return events filtered by framework', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance?framework=GDPR',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('events');
    });

    it('should support date range filtering', async () => {
      mockAdminSession(testData.users.admin.id);

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance?startDate=2024-01-01&endDate=2024-12-31',
        headers: {
          cookie: `next-auth.session-token=${testData.users.admin.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

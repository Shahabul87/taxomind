import { NextRequest } from 'next/server';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../../utils/test-db';
import { TestDataFactory } from '../../../utils/test-factory';
import { ApiTestHelpers, AuthTestHelpers } from '../../../utils/test-helpers';
import { setupMockProviders, resetMockProviders } from '../../../utils/mock-providers';

// Import the actual route handler
import { GET, POST } from '@/app/api/enterprise/compliance/route';

describe('/api/enterprise/compliance Integration Tests', () => {
  let testData: any;
  let adminSession: any;
  let userSession: any;

  beforeAll(async () => {
    setupMockProviders();
    testData = await setupTestDatabase();
    
    adminSession = AuthTestHelpers.createMockSession({ 
      userId: testData.users.admin.id,
      role: 'ADMIN' 
    });
    
    userSession = AuthTestHelpers.createMockSession({ 
      userId: testData.users.teacher.id,
      role: 'USER' 
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    resetMockProviders();
  });

  describe('GET /api/enterprise/compliance', () => {
    it('should return compliance dashboard data for admin', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('overview');
      expect(data.data).toHaveProperty('dataProtection');
      expect(data.data).toHaveProperty('accessControl');
      expect(data.data).toHaveProperty('auditLogs');
      expect(data.data).toHaveProperty('policies');
      expect(data.data).toHaveProperty('certifications');
    });

    it('should include GDPR compliance metrics', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        searchParams: { standard: 'gdpr' },
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.dataProtection).toHaveProperty('gdprCompliance');
      expect(data.data.dataProtection.gdprCompliance).toHaveProperty('status');
      expect(data.data.dataProtection.gdprCompliance).toHaveProperty('dataProcessingActivities');
      expect(data.data.dataProtection.gdprCompliance).toHaveProperty('consentManagement');
      expect(data.data.dataProtection.gdprCompliance).toHaveProperty('dataSubjectRights');
    });

    it('should include FERPA compliance metrics', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        searchParams: { standard: 'ferpa' },
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.dataProtection).toHaveProperty('ferpaCompliance');
      expect(data.data.dataProtection.ferpaCompliance).toHaveProperty('studentRecords');
      expect(data.data.dataProtection.ferpaCompliance).toHaveProperty('disclosureControls');
      expect(data.data.dataProtection.ferpaCompliance).toHaveProperty('parentalRights');
    });

    it('should include SOC 2 compliance metrics', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        searchParams: { standard: 'soc2' },
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.certifications).toHaveProperty('soc2');
      expect(data.data.certifications.soc2).toHaveProperty('type');
      expect(data.data.certifications.soc2).toHaveProperty('status');
      expect(data.data.certifications.soc2).toHaveProperty('lastAudit');
      expect(data.data.certifications.soc2).toHaveProperty('trustPrinciples');
    });

    it('should provide access control compliance metrics', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.accessControl).toHaveProperty('roleBasedAccess');
      expect(data.data.accessControl).toHaveProperty('multiFactorAuthentication');
      expect(data.data.accessControl).toHaveProperty('sessionManagement');
      expect(data.data.accessControl).toHaveProperty('privilegedAccess');

      // Verify RBAC metrics
      const rbac = data.data.accessControl.roleBasedAccess;
      expect(rbac).toHaveProperty('totalRoles');
      expect(rbac).toHaveProperty('activeUsers');
      expect(rbac).toHaveProperty('permissionAudits');
      expect(rbac).toHaveProperty('lastReview');
    });

    it('should include audit log summary', async () => {
      // First create some audit log entries
      await testDb.getClient().auditLog.createMany({
        data: [
          {
            userId: testData.users.admin.id,
            action: 'USER_LOGIN',
            resourceType: 'USER',
            resourceId: testData.users.admin.id,
            metadata: { ip: '192.168.1.1' },
          },
          {
            userId: testData.users.teacher.id,
            action: 'COURSE_CREATE',
            resourceType: 'COURSE',
            resourceId: testData.courses[0].id,
            metadata: { courseTitle: 'Test Course' },
          },
        ],
      });

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.auditLogs).toHaveProperty('totalEntries');
      expect(data.data.auditLogs).toHaveProperty('recentActivity');
      expect(data.data.auditLogs).toHaveProperty('criticalEvents');
      expect(data.data.auditLogs).toHaveProperty('retentionPolicy');
      
      expect(data.data.auditLogs.totalEntries).toBeGreaterThan(0);
      expect(data.data.auditLogs.recentActivity).toBeInstanceOf(Array);
    });

    it('should deny access to non-admin users', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${userSession.user.id}`,
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        // No authentication headers
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should filter compliance data by date range', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        searchParams: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('dateRange');
      expect(data.data.dateRange.start).toBe('2024-01-01');
      expect(data.data.dateRange.end).toBe('2024-12-31');
    });

    it('should handle compliance metrics aggregation', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.overview).toHaveProperty('complianceScore');
      expect(data.data.overview).toHaveProperty('totalChecks');
      expect(data.data.overview).toHaveProperty('passedChecks');
      expect(data.data.overview).toHaveProperty('failedChecks');
      expect(data.data.overview).toHaveProperty('lastUpdated');

      // Verify compliance score calculation
      const overview = data.data.overview;
      expect(overview.complianceScore).toBeGreaterThanOrEqual(0);
      expect(overview.complianceScore).toBeLessThanOrEqual(100);
      expect(overview.totalChecks).toBe(overview.passedChecks + overview.failedChecks);
    });
  });

  describe('POST /api/enterprise/compliance', () => {
    it('should update compliance policies for admin', async () => {
      const policyUpdates = {
        dataRetention: {
          userDataRetentionDays: 2555, // 7 years
          auditLogRetentionDays: 2555,
          backupRetentionDays: 90,
        },
        accessControl: {
          passwordPolicy: {
            minLength: 12,
            requireSpecialChars: true,
            requireNumbers: true,
            maxAge: 90,
          },
          sessionTimeout: 3600, // 1 hour
          mfaRequired: true,
        },
        dataProcessing: {
          encryptionRequired: true,
          dataMinimization: true,
          consentRequired: true,
          rightToErasure: true,
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: policyUpdates,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('updatedPolicies');
      expect(data.data.updatedPolicies).toHaveProperty('dataRetention');
      expect(data.data.updatedPolicies).toHaveProperty('accessControl');
      expect(data.data.updatedPolicies).toHaveProperty('dataProcessing');
    });

    it('should run compliance audit checks', async () => {
      const auditRequest = {
        action: 'runAudit',
        checks: ['gdpr', 'ferpa', 'soc2', 'accessControl'],
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: auditRequest,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('auditResults');
      expect(data.data.auditResults).toHaveProperty('checks');
      expect(data.data.auditResults.checks).toBeInstanceOf(Array);
      expect(data.data.auditResults.checks.length).toBe(4);

      // Verify each audit check has proper structure
      data.data.auditResults.checks.forEach((check: any) => {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status'); // 'pass', 'fail', 'warning'
        expect(check).toHaveProperty('score');
        expect(check).toHaveProperty('findings');
      });
    });

    it('should generate compliance reports', async () => {
      const reportRequest = {
        action: 'generateReport',
        format: 'json',
        includeAuditLogs: true,
        standards: ['gdpr', 'ferpa'],
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: reportRequest,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('report');
      expect(data.data.report).toHaveProperty('metadata');
      expect(data.data.report).toHaveProperty('complianceStatus');
      expect(data.data.report).toHaveProperty('findings');
      expect(data.data.report).toHaveProperty('recommendations');

      // Verify report metadata
      const metadata = data.data.report.metadata;
      expect(metadata).toHaveProperty('generatedAt');
      expect(metadata).toHaveProperty('standards');
      expect(metadata).toHaveProperty('dateRange');
      expect(metadata.standards).toEqual(['gdpr', 'ferpa']);
    });

    it('should update data subject rights settings', async () => {
      const dsrSettings = {
        action: 'updateDataSubjectRights',
        settings: {
          rightToAccess: {
            enabled: true,
            responseTimeLimit: 30, // days
            automaticFulfillment: false,
          },
          rightToRectification: {
            enabled: true,
            allowSelfService: true,
            requireVerification: true,
          },
          rightToErasure: {
            enabled: true,
            gracePeriod: 30, // days
            exceptions: ['legal_obligation', 'public_interest'],
          },
          rightToPortability: {
            enabled: true,
            formats: ['json', 'csv', 'xml'],
            includeMetadata: true,
          },
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: dsrSettings,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('dataSubjectRights');
      expect(data.data.dataSubjectRights).toHaveProperty('rightToAccess');
      expect(data.data.dataSubjectRights).toHaveProperty('rightToRectification');
      expect(data.data.dataSubjectRights).toHaveProperty('rightToErasure');
      expect(data.data.dataSubjectRights).toHaveProperty('rightToPortability');
    });

    it('should manage compliance training requirements', async () => {
      const trainingRequest = {
        action: 'updateTrainingRequirements',
        requirements: {
          mandatoryTraining: [
            {
              title: 'Data Protection Fundamentals',
              frequency: 'annual',
              roles: ['ADMIN', 'USER'],
              duration: 120, // minutes
            },
            {
              title: 'Security Awareness Training',
              frequency: 'quarterly',
              roles: ['ADMIN'],
              duration: 60,
            },
          ],
          certificationRequired: true,
          trackingEnabled: true,
          reminderSchedule: 'weekly',
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: trainingRequest,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('trainingRequirements');
      expect(data.data.trainingRequirements.mandatoryTraining).toHaveLength(2);
    });

    it('should deny access to non-admin users', async () => {
      const policyUpdates = {
        dataRetention: {
          userDataRetentionDays: 365,
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: policyUpdates,
        headers: {
          'cookie': `next-auth.session-token=${userSession.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate policy update requests', async () => {
      const invalidPolicyUpdates = {
        dataRetention: {
          userDataRetentionDays: -1, // Invalid negative value
        },
        accessControl: {
          passwordPolicy: {
            minLength: 3, // Too short
          },
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: invalidPolicyUpdates,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle unsupported compliance actions', async () => {
      const unsupportedRequest = {
        action: 'unsupportedAction',
        data: {},
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: unsupportedRequest,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.spyOn(testDb.getClient().auditLog, 'findMany').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(500);

      // Restore mock
      jest.restoreAllMocks();
    });

    it('should handle malformed JSON requests', async () => {
      // Create request with malformed JSON
      const request = new NextRequest(
        'http://localhost:3000/api/enterprise/compliance',
        {
          method: 'POST',
          body: '{invalid json}',
          headers: {
            'content-type': 'application/json',
            'cookie': `next-auth.session-token=${adminSession.user.id}`,
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle compliance check failures gracefully', async () => {
      const auditRequest = {
        action: 'runAudit',
        checks: ['nonexistent-check'],
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: auditRequest,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Security and Performance', () => {
    it('should sanitize sensitive information in responses', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify no sensitive data is exposed
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('secret');
      expect(responseText).not.toContain('private_key');
    });

    it('should respond within acceptable time limits', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/enterprise/compliance',
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should handle concurrent compliance requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        ApiTestHelpers.createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/enterprise/compliance',
          headers: {
            'cookie': `next-auth.session-token=${adminSession.user.id}`,
          },
        })
      );

      const responses = await Promise.all(
        requests.map(request => GET(request))
      );

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should log compliance activities for audit trail', async () => {
      const policyUpdates = {
        dataRetention: {
          userDataRetentionDays: 1825, // 5 years
        },
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: policyUpdates,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      await POST(request);

      // Verify audit log entry was created
      const auditLogs = await testDb.getClient().auditLog.findMany({
        where: {
          userId: adminSession.user.id,
          action: 'COMPLIANCE_POLICY_UPDATE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].metadata).toHaveProperty('policyUpdates');
    });
  });

  describe('Data Export and Reporting', () => {
    it('should generate compliance reports in different formats', async () => {
      const formats = ['json', 'csv', 'pdf'];

      for (const format of formats) {
        const reportRequest = {
          action: 'generateReport',
          format: format,
          standards: ['gdpr'],
        };

        const request = ApiTestHelpers.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/enterprise/compliance',
          body: reportRequest,
          headers: {
            'cookie': `next-auth.session-token=${adminSession.user.id}`,
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.report.metadata.format).toBe(format);
      }
    });

    it('should export audit logs with proper filtering', async () => {
      const exportRequest = {
        action: 'exportAuditLogs',
        filters: {
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31',
          },
          actions: ['USER_LOGIN', 'COURSE_CREATE'],
          users: [testData.users.admin.id],
        },
        format: 'json',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/enterprise/compliance',
        body: exportRequest,
        headers: {
          'cookie': `next-auth.session-token=${adminSession.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('exportedLogs');
      expect(data.data.exportedLogs).toBeInstanceOf(Array);
    });
  });
});
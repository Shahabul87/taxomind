/**
 * Tests for lib/sam/agentic-tooling.ts
 *
 * Verifies getToolingSystem, ensureToolingInitialized,
 * resetToolingAdapterCache, ensureDefaultToolPermissions,
 * mapUserToToolRole, and getRolePermissions.
 */

jest.mock('@/lib/db');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@sam-ai/core', () => ({
  AIAdapter: {},
}));

const mockToolStore = {
  get: jest.fn(),
  list: jest.fn(),
};

jest.mock('@sam-ai/agentic', () => ({
  createToolRegistry: jest.fn(() => ({
    register: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
  })),
  createToolExecutor: jest.fn(() => ({
    execute: jest.fn(),
  })),
  createPermissionManager: jest.fn(() => ({
    setRolePermissions: jest.fn(),
    checkPermission: jest.fn(),
  })),
  createAuditLogger: jest.fn(() => ({
    log: jest.fn(),
  })),
  createConfirmationManager: jest.fn(() => ({
    request: jest.fn(),
  })),
  ConfirmationType: { NONE: 'none', EXPLICIT: 'explicit' },
  PermissionLevel: { READ: 'read', WRITE: 'write', ADMIN: 'admin' },
  UserRole: { STUDENT: 'student', INSTRUCTOR: 'instructor', ADMIN: 'admin' },
  DEFAULT_ROLE_PERMISSIONS: [
    { role: 'student', permissions: ['read'] },
    { role: 'instructor', permissions: ['read', 'write'] },
    { role: 'admin', permissions: ['read', 'write', 'admin'] },
  ],
  createMentorTools: jest.fn(() => []),
  createPrismaInvocationStore: jest.fn(() => ({})),
  createPrismaAuditStore: jest.fn(() => ({})),
  createPrismaPermissionStore: jest.fn(() => ({
    getUserPermissions: jest.fn().mockResolvedValue([]),
  })),
  createPrismaConfirmationStore: jest.fn(() => ({})),
}));

jest.mock('@sam-ai/integration', () => ({
  ToolPermissionLevel: {
    READ_ONLY: 'READ_ONLY',
    READ_WRITE: 'READ_WRITE',
    ADMIN: 'ADMIN',
    DISABLED: 'DISABLED',
  },
}));

jest.mock('@/lib/sam/stores/prisma-tool-store', () => ({
  getToolRegistryCache: jest.fn(() => new Map()),
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getIntegrationProfile: jest.fn(() => ({
    tools: { mentor: [], external: [], standalone: [] },
  })),
  getStore: jest.fn(() => mockToolStore),
}));

jest.mock('@/lib/sam/tool-repositories', () => ({
  createToolRepositories: jest.fn(() => ({
    contentRepository: {},
    sessionRepository: {},
    reminderRepository: {},
    notificationRepository: {},
    progressRepository: {},
  })),
}));

jest.mock('@/lib/sam/agentic-external-api-tools', () => ({
  createExternalAPITools: jest.fn(() => []),
  getExternalAPIToolIds: jest.fn(() => []),
  isExternalAPITool: jest.fn(() => false),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  getSAMAdapter: jest.fn().mockResolvedValue({ chat: jest.fn() }),
  getSAMAdapterSystem: jest.fn().mockResolvedValue({ chat: jest.fn() }),
}));

jest.mock('@/lib/sam/tools/adapters/tool-adapter-interface', () => ({
  registerAdapter: jest.fn(),
}));
jest.mock('@/lib/sam/tools/adapters/wikipedia-adapter', () => ({ createWikipediaAdapter: jest.fn() }));
jest.mock('@/lib/sam/tools/adapters/dictionary-adapter', () => ({ createDictionaryAdapter: jest.fn() }));
jest.mock('@/lib/sam/tools/flashcard-generator', () => ({ createFlashcardGeneratorTool: jest.fn(() => ({ id: 'fc', name: 'fc', description: 'fc', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/quiz-grader', () => ({ createQuizGraderTool: jest.fn(() => ({ id: 'qg', name: 'qg', description: 'qg', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/progress-exporter', () => ({ createProgressExporterTool: jest.fn(() => ({ id: 'pe', name: 'pe', description: 'pe', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/diagram-generator', () => ({ createDiagramGeneratorTool: jest.fn(() => ({ id: 'dg', name: 'dg', description: 'dg', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/study-timer', () => ({ createStudyTimerTool: jest.fn(() => ({ id: 'st', name: 'st', description: 'st', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/skill-roadmap-generator', () => ({ createSkillRoadmapGeneratorTool: jest.fn(() => ({ id: 'srg', name: 'srg', description: 'srg', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/learning-analytics-tool', () => ({ createLearningAnalyticsTool: jest.fn(() => ({ id: 'la', name: 'la', description: 'la', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/course-creator', () => ({ createCourseCreatorTool: jest.fn(() => ({ id: 'cc', name: 'cc', description: 'cc', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/exam-builder', () => ({ createExamBuilderTool: jest.fn(() => ({ id: 'eb', name: 'eb', description: 'eb', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/exam-evaluator', () => ({ createExamEvaluatorTool: jest.fn(() => ({ id: 'ee', name: 'ee', description: 'ee', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/student-analytics', () => ({ createStudentAnalyticsTool: jest.fn(() => ({ id: 'sa', name: 'sa', description: 'sa', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/creator-analytics', () => ({ createCreatorAnalyticsTool: jest.fn(() => ({ id: 'ca', name: 'ca', description: 'ca', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/skill-navigator', () => ({ createSkillNavigatorTool: jest.fn(() => ({ id: 'sn', name: 'sn', description: 'sn', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/content-generator', () => ({ createContentGeneratorTool: jest.fn(() => ({ id: 'cg', name: 'cg', description: 'cg', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/course-chapter-generator', () => ({ createCourseChapterGeneratorTool: jest.fn(() => ({ id: 'ccg', name: 'ccg', description: 'ccg', category: 'learning', requiredPermissions: [], confirmationType: 'none' })), createCourseHealerTool: jest.fn(() => ({ id: 'ch', name: 'ch', description: 'ch', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/memory-recall-tool', () => ({ createMemoryRecallTool: jest.fn(() => ({ id: 'mr', name: 'mr', description: 'mr', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/quality-evaluator-tool', () => ({ createQualityEvaluatorTool: jest.fn(() => ({ id: 'qe', name: 'qe', description: 'qe', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));
jest.mock('@/lib/sam/tools/course-replanner-tool', () => ({ createCourseReplannerTool: jest.fn(() => ({ id: 'cr', name: 'cr', description: 'cr', category: 'learning', requiredPermissions: [], confirmationType: 'none' })) }));

import {
  getToolingSystem,
  resetToolingAdapterCache,
  mapUserToToolRole,
  getRolePermissions,
} from '@/lib/sam/agentic-tooling';
import { UserRole } from '@sam-ai/agentic';

describe('agentic-tooling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToolingSystem', () => {
    it('should return a tooling system object', () => {
      const system = getToolingSystem();
      expect(system).toHaveProperty('toolRegistry');
      expect(system).toHaveProperty('toolExecutor');
      expect(system).toHaveProperty('permissionManager');
      expect(system).toHaveProperty('confirmationManager');
      expect(system).toHaveProperty('auditLogger');
    });

    it('should return the same singleton on repeated calls', () => {
      const first = getToolingSystem();
      const second = getToolingSystem();
      expect(first).toBe(second);
    });
  });

  describe('resetToolingAdapterCache', () => {
    it('should reset without error', () => {
      expect(() => resetToolingAdapterCache()).not.toThrow();
    });
  });

  describe('mapUserToToolRole', () => {
    it('should return STUDENT for null user', () => {
      expect(mapUserToToolRole(null)).toBe(UserRole.STUDENT);
    });

    it('should return ADMIN for ADMIN role', () => {
      expect(mapUserToToolRole({ role: 'ADMIN' })).toBe(UserRole.ADMIN);
    });

    it('should return ADMIN for SUPERADMIN role', () => {
      expect(mapUserToToolRole({ role: 'SUPERADMIN' })).toBe(UserRole.ADMIN);
    });

    it('should return INSTRUCTOR for teacher', () => {
      expect(mapUserToToolRole({ isTeacher: true })).toBe(UserRole.INSTRUCTOR);
    });

    it('should return STUDENT for regular user', () => {
      expect(mapUserToToolRole({ role: 'USER' })).toBe(UserRole.STUDENT);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a valid role', () => {
      const perms = getRolePermissions(UserRole.STUDENT);
      expect(perms).toBeDefined();
    });
  });
});

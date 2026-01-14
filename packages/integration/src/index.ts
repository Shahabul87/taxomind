/**
 * @sam-ai/integration - SAM AI Integration Framework
 *
 * This package provides the core abstraction layer for making SAM
 * a portable, host-agnostic AI tutoring system that can integrate
 * with any educational platform.
 *
 * Key Components:
 * - IntegrationProfile: Defines host capabilities and configurations
 * - Adapters: Abstract interfaces for database, auth, AI, vector, etc.
 * - CapabilityRegistry: Query available features at runtime
 * - AdapterFactory: Dependency injection container
 * - HostDetector: Auto-detect environment and generate profiles
 * - ProfileBuilder: Fluent API for building profiles
 */

// ============================================================================
// TYPES - Core Profile Types and Schemas
// ============================================================================

export * from './types';

// ============================================================================
// ADAPTERS - Abstract Interfaces for External Services
// ============================================================================

export * from './adapters';

// ============================================================================
// REGISTRY - Capability Registry and Adapter Factory
// ============================================================================

export * from './registry';

// ============================================================================
// DETECTION - Host Detection and Profile Building
// ============================================================================

export * from './detection';

// ============================================================================
// BRIDGES - Cross-package adapter bridges
// ============================================================================

export * from './bridges';

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '1.0.0';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// Re-export commonly used items at top level for easier imports
export {
  type IntegrationProfile,
  type PartialIntegrationProfile,
  RuntimeEnvironment,
  HostFrameworkType,
  DatabaseType,
  VectorAdapterType,
  AuthProviderType,
  AIProviderType,
  EmbeddingProviderType,
  RealtimeType,
  DataSourceType,
  IntegrationProfileSchema,
  validateIntegrationProfile,
  createMinimalProfile,
} from './types/profile';

export {
  type DatabaseAdapter,
  type EntityRepository,
  type SAMGoal,
  type SAMPlan,
  type SAMMemoryEntry,
  type SAMSession,
} from './adapters/database';

export {
  type AuthAdapter,
  type SAMUser,
  type SAMAuthSession,
  type AuthResult,
  type PermissionChecker,
  type PermissionCheckResult,
  type ResourcePermission,
  type SAMRole,
  SAMRoles,
  SAMPermissions,
  DefaultRolePermissions,
} from './adapters/auth';

export {
  type VectorAdapter,
  type EmbeddingAdapter,
  type VectorService,
  type VectorDocument,
  type VectorSearchResult,
} from './adapters/vector';

export {
  type AIAdapter,
  type ChatMessage,
  type ToolCall,
  type ToolDefinition,
  type AIService,
} from './adapters/ai';

export {
  type NotificationAdapter,
  type NotificationRequest,
  NotificationChannel,
  NotificationPriority,
} from './adapters/notification';

export {
  type RealtimeAdapter,
  type SAMRealtimeService,
  SAMRealtimeEventType,
} from './adapters/realtime';

export {
  CapabilityRegistry,
  createCapabilityRegistry,
} from './registry/capability-registry';

export {
  AdapterFactory,
  createAdapterFactory,
} from './registry/adapter-factory';

export {
  HostDetector,
  createHostDetector,
  detectHost,
  generateProfileFromHost,
  type DetectionResult,
  type DetectedFeatures,
} from './detection/host-detector';

export {
  ProfileBuilder,
  createProfileBuilder,
  createTaxomindProfile,
} from './detection/profile-builder';

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
export { RuntimeEnvironment, HostFrameworkType, DatabaseType, VectorAdapterType, AuthProviderType, AIProviderType, EmbeddingProviderType, RealtimeType, DataSourceType, IntegrationProfileSchema, validateIntegrationProfile, createMinimalProfile, } from './types/profile';
export { SAMRoles, SAMPermissions, DefaultRolePermissions, } from './adapters/auth';
export { NotificationChannel, NotificationPriority, } from './adapters/notification';
export { SAMRealtimeEventType, } from './adapters/realtime';
export { CapabilityRegistry, createCapabilityRegistry, } from './registry/capability-registry';
export { AdapterFactory, createAdapterFactory, } from './registry/adapter-factory';
export { HostDetector, createHostDetector, detectHost, generateProfileFromHost, } from './detection/host-detector';
export { ProfileBuilder, createProfileBuilder, createTaxomindProfile, } from './detection/profile-builder';
//# sourceMappingURL=index.js.map
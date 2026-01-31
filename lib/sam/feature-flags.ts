/**
 * SAM AI Agentic Feature Flags
 *
 * Controls which SAM features are enabled. Features are categorized by readiness:
 *
 * ============================================================================
 * PRODUCTION-READY FEATURES (Enabled by Default)
 * ============================================================================
 *
 * These features are 100% implemented and enabled by default. To disable, set =false:
 *
 *   SAM_ORCHESTRATION_ACTIVE=false     # Plan-driven tutoring with step execution
 *   SAM_INTERVENTIONS_ENABLED=false    # Proactive check-ins and behavior monitoring
 *   SAM_OBSERVABILITY=false            # Telemetry and quality tracking
 *   SAM_TOOL_PERMISSIONS=false         # RBAC for tool execution
 *   SAM_MEMORY_LIFECYCLE=false         # Auto-reindex on content changes (uses stub adapter if no vector DB)
 *
 * ============================================================================
 * INCOMPLETE FEATURES (Disabled by Default)
 * ============================================================================
 *
 * These features require additional implementation. To enable (experimental):
 *
 *   SAM_WEBSOCKET_ENABLED=true         # 100% complete - requires NEXT_PUBLIC_WS_URL
 *
 * ============================================================================
 * Usage:
 *   import { SAM_FEATURES, isFeatureEnabled } from '@/lib/sam/feature-flags';
 *
 *   if (SAM_FEATURES.ORCHESTRATION_ACTIVE) {
 *     // Enable orchestration-driven tutoring
 *   }
 *
 *   if (isFeatureEnabled('INTERVENTIONS_ENABLED')) {
 *     // Enable proactive interventions
 *   }
 */

import { z } from 'zod';

/**
 * Check if running in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Schema for SAM feature flags with sensible defaults
 */
const SAMFeatureFlagsSchema = z.object({
  /**
   * Phase 1: Orchestration - TutoringLoopController actively drives sessions
   * - Session resumption with "welcome back" context
   * - Step executor generates learning artifacts
   * - Confirmation gates for tool execution
   * - Plan context injection for enhanced prompts
   */
  ORCHESTRATION_ACTIVE: z.boolean().default(false),

  /**
   * Phase 2: Proactive Interventions - Automatic check-ins and behavior monitoring
   * - Scheduled check-ins via cron jobs
   * - Behavior event tracking
   * - Anomaly detection and churn prediction
   * - Intervention delivery to UI
   */
  INTERVENTIONS_ENABLED: z.boolean().default(false),

  /**
   * Phase 3: Real-Time WebSocket - Full real-time communication (100% complete)
   * - WebSocket server for live connections (server/socket-server.ts)
   * - Presence tracking across sessions
   * - Real-time intervention delivery
   * - SSE fallback when WebSocket unavailable
   * - Requires: SAM_WEBSOCKET_ENABLED=true AND NEXT_PUBLIC_WS_URL=ws://host:port/ws/sam
   */
  WEBSOCKET_ENABLED: z.boolean().default(false),

  /**
   * Phase 4: Tool Permissions - Full tool registry with RBAC
   * - Permission checks before tool execution
   * - Audit logging for all tool calls
   * - Admin tool management UI
   * - Confirmation workflows for risky tools
   */
  TOOL_PERMISSIONS_ENABLED: z.boolean().default(false),

  /**
   * Phase 5: Memory Lifecycle - Automatic memory refresh (100% complete)
   * - Auto-reindex on course/chapter/section content changes
   * - Scheduled knowledge graph refresh via cron
   * - Memory decay for stale data
   * - Background worker for job processing
   * - Enabled by default (uses stub vector adapter when no vector DB configured)
   * - Disable with: SAM_MEMORY_LIFECYCLE=false
   */
  MEMORY_LIFECYCLE_ENABLED: z.boolean().default(true),

  /**
   * Phase 6: Observability - Full metrics and quality tracking (100% complete)
   * - Metrics collection with Prometheus export
   * - Plan lifecycle event tracking (start/pause/resume)
   * - Proactive intervention telemetry (delivered/executed/dismissed)
   * - Confidence calibration from user feedback
   * - Self-critique quality tracking
   * - Analytics rollups via cron job
   * - Requires: SAM_OBSERVABILITY=true
   */
  OBSERVABILITY_ENABLED: z.boolean().default(false),

  /**
   * Phase 7: Multi-Agent Coordination
   * - Routes complex queries through MultiAgentCoordinator
   * - Enables safety, quality, and pedagogy agents for collaborative decisions
   * - Fallback: standard parallel processing if coordinator fails
   * - Requires: SAM_MULTI_AGENT_COORDINATION=true
   */
  MULTI_AGENT_COORDINATION: z.boolean().default(false),

  /**
   * Phase 8: Real-Time Interventions via SSE
   * - Chat UI subscribes to /api/sam/realtime/events
   * - Intervention banners appear in real-time
   * - Connection status indicator
   * - Repurposes WEBSOCKET_ENABLED for all real-time features
   */
  REALTIME_INTERVENTIONS: z.boolean().default(false),
});

/**
 * Type for SAM feature flags
 */
export type SAMFeatureFlags = z.infer<typeof SAMFeatureFlagsSchema>;

/**
 * Type for feature flag keys
 */
export type SAMFeatureKey = keyof SAMFeatureFlags;

/**
 * Parse environment variable with development fallback
 * Returns true if:
 * - Explicitly set to 'true'
 * - Not set but in development mode (for core features only)
 */
function parseEnvFlag(envVar: string | undefined, enableByDefaultInDev: boolean = false): boolean {
  if (envVar === 'true') return true;
  if (envVar === 'false') return false;
  // If not explicitly set, use development default
  return isDevelopment && enableByDefaultInDev;
}

/**
 * Parse environment variables into feature flags with validation
 *
 * Production-ready features are ENABLED by default (can be disabled with =false):
 * - ORCHESTRATION_ACTIVE: Plan-driven tutoring (100% implemented)
 * - INTERVENTIONS_ENABLED: Proactive check-ins (100% implemented)
 * - OBSERVABILITY_ENABLED: Telemetry and metrics (100% implemented)
 * - TOOL_PERMISSIONS_ENABLED: RBAC for tools (100% implemented)
 *
 * Incomplete features are DISABLED by default (require explicit opt-in):
 * - WEBSOCKET_ENABLED: Requires NEXT_PUBLIC_WS_URL to be set (100% complete)
 */
function parseFeatureFlags(): SAMFeatureFlags {
  const envFlags = {
    // Production-ready features - enabled by default (disable with =false)
    ORCHESTRATION_ACTIVE: process.env.SAM_ORCHESTRATION_ACTIVE !== 'false',
    INTERVENTIONS_ENABLED: process.env.SAM_INTERVENTIONS_ENABLED !== 'false',
    OBSERVABILITY_ENABLED: process.env.SAM_OBSERVABILITY !== 'false',
    TOOL_PERMISSIONS_ENABLED: process.env.SAM_TOOL_PERMISSIONS !== 'false',
    // Incomplete features - require explicit opt-in (disabled by default)
    // Check both server and client env vars for WebSocket
    WEBSOCKET_ENABLED: parseEnvFlag(
      process.env.SAM_WEBSOCKET_ENABLED ?? process.env.NEXT_PUBLIC_SAM_WEBSOCKET_ENABLED,
      false
    ),
    MEMORY_LIFECYCLE_ENABLED: process.env.SAM_MEMORY_LIFECYCLE !== 'false',
    // Multi-agent coordination - disabled by default, opt-in
    MULTI_AGENT_COORDINATION: parseEnvFlag(process.env.SAM_MULTI_AGENT_COORDINATION, false),
    // Real-time interventions via SSE - disabled by default
    REALTIME_INTERVENTIONS: parseEnvFlag(process.env.SAM_REALTIME_INTERVENTIONS, false),
  };

  // Parse with Zod for validation and defaults
  const result = SAMFeatureFlagsSchema.safeParse(envFlags);

  if (!result.success) {
    console.warn(
      '[SAM Feature Flags] Invalid configuration, using defaults:',
      result.error.flatten()
    );
    return SAMFeatureFlagsSchema.parse({});
  }

  return result.data;
}

/**
 * Parsed and validated SAM feature flags
 */
export const SAM_FEATURES: SAMFeatureFlags = parseFeatureFlags();

/**
 * Check if a specific SAM feature is enabled
 *
 * @param feature - The feature key to check
 * @returns boolean - Whether the feature is enabled
 *
 * @example
 * if (isFeatureEnabled('ORCHESTRATION_ACTIVE')) {
 *   await activateOrchestration();
 * }
 */
export function isFeatureEnabled(feature: SAMFeatureKey): boolean {
  return SAM_FEATURES[feature];
}

/**
 * Check if multiple features are all enabled
 *
 * @param features - Array of feature keys to check
 * @returns boolean - Whether all features are enabled
 *
 * @example
 * if (areAllFeaturesEnabled(['ORCHESTRATION_ACTIVE', 'INTERVENTIONS_ENABLED'])) {
 *   // Both orchestration and interventions are active
 * }
 */
export function areAllFeaturesEnabled(features: SAMFeatureKey[]): boolean {
  return features.every((feature) => SAM_FEATURES[feature]);
}

/**
 * Check if any of the specified features are enabled
 *
 * @param features - Array of feature keys to check
 * @returns boolean - Whether at least one feature is enabled
 *
 * @example
 * if (isAnyFeatureEnabled(['WEBSOCKET_ENABLED', 'INTERVENTIONS_ENABLED'])) {
 *   // At least one real-time feature is active
 * }
 */
export function isAnyFeatureEnabled(features: SAMFeatureKey[]): boolean {
  return features.some((feature) => SAM_FEATURES[feature]);
}

/**
 * Get all enabled features as an array
 *
 * @returns Array of enabled feature keys
 */
export function getEnabledFeatures(): SAMFeatureKey[] {
  return (Object.keys(SAM_FEATURES) as SAMFeatureKey[]).filter(
    (key) => SAM_FEATURES[key]
  );
}

/**
 * Get feature flag status summary for logging/debugging
 *
 * @returns Object with feature flag status
 */
export function getFeatureFlagsSummary(): Record<string, boolean> {
  return { ...SAM_FEATURES };
}

/**
 * Development helper: Log current feature flags
 * Only logs in development environment
 */
export function logFeatureFlags(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SAM Feature Flags] Current configuration:');
    Object.entries(SAM_FEATURES).forEach(([key, value]) => {
      const status = value ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  ${key}: ${status}`);
    });
  }
}

/**
 * Feature flag dependencies - some features require others
 */
export const FEATURE_DEPENDENCIES: Record<SAMFeatureKey, SAMFeatureKey[]> = {
  ORCHESTRATION_ACTIVE: [],
  INTERVENTIONS_ENABLED: [], // Can work with polling, WebSocket optional
  WEBSOCKET_ENABLED: [],
  TOOL_PERMISSIONS_ENABLED: [],
  MEMORY_LIFECYCLE_ENABLED: [],
  OBSERVABILITY_ENABLED: [],
  MULTI_AGENT_COORDINATION: [], // Standalone, falls back to parallel processing
  REALTIME_INTERVENTIONS: [], // Uses SSE, works independently of WebSocket
};

/**
 * Check if a feature can be enabled (all dependencies are met)
 *
 * @param feature - The feature to check
 * @returns boolean - Whether all dependencies are enabled
 */
export function canEnableFeature(feature: SAMFeatureKey): boolean {
  const dependencies = FEATURE_DEPENDENCIES[feature];
  return dependencies.every((dep) => SAM_FEATURES[dep]);
}

/**
 * Get missing dependencies for a feature
 *
 * @param feature - The feature to check
 * @returns Array of missing dependency keys
 */
export function getMissingDependencies(feature: SAMFeatureKey): SAMFeatureKey[] {
  const dependencies = FEATURE_DEPENDENCIES[feature];
  return dependencies.filter((dep) => !SAM_FEATURES[dep]);
}

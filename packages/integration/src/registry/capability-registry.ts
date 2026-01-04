/**
 * @sam-ai/integration - Capability Registry
 * Centralized registry for tracking available capabilities
 */

import type {
  IntegrationProfile,
  DatabaseCapability,
  AuthCapability,
  AICapability,
  RealtimeCapability,
  NotificationCapability,
  StorageCapability,
  QueueCapability,
  CacheCapability,
  ToolConfiguration,
  DataSourceConfiguration,
} from '../types/profile';

// ============================================================================
// CAPABILITY CHECK RESULTS
// ============================================================================

/**
 * Result of a capability check
 */
export interface CapabilityCheckResult {
  available: boolean;
  reason?: string;
  fallback?: string;
}

/**
 * Feature availability
 */
export interface FeatureAvailability {
  goalPlanning: CapabilityCheckResult;
  toolExecution: CapabilityCheckResult;
  proactiveInterventions: CapabilityCheckResult;
  selfEvaluation: CapabilityCheckResult;
  learningAnalytics: CapabilityCheckResult;
  memorySystem: CapabilityCheckResult;
  knowledgeGraph: CapabilityCheckResult;
  realTimeSync: CapabilityCheckResult;
}

// ============================================================================
// CAPABILITY REGISTRY
// ============================================================================

/**
 * Capability Registry
 * Manages and queries the integration profile capabilities
 */
export class CapabilityRegistry {
  private profile: IntegrationProfile;
  private featureOverrides: Map<string, boolean> = new Map();

  constructor(profile: IntegrationProfile) {
    this.profile = profile;
  }

  // -------------------------------------------------------------------------
  // Profile Access
  // -------------------------------------------------------------------------

  /**
   * Get the full integration profile
   */
  getProfile(): IntegrationProfile {
    return this.profile;
  }

  /**
   * Update the profile
   */
  updateProfile(updates: Partial<IntegrationProfile>): void {
    this.profile = { ...this.profile, ...updates };
  }

  /**
   * Get profile ID
   */
  getProfileId(): string {
    return this.profile.id;
  }

  /**
   * Get profile name
   */
  getProfileName(): string {
    return this.profile.name;
  }

  // -------------------------------------------------------------------------
  // Database Capabilities
  // -------------------------------------------------------------------------

  /**
   * Get database capability
   */
  getDatabase(): DatabaseCapability {
    return this.profile.capabilities.database;
  }

  /**
   * Check if database is available
   */
  hasDatabase(): boolean {
    return this.profile.capabilities.database.available;
  }

  /**
   * Check if vector database is available
   */
  hasVectorDatabase(): boolean {
    const db = this.profile.capabilities.database;
    return db.available && db.supportsVectors && db.vectorAdapter !== 'none';
  }

  /**
   * Get vector adapter type
   */
  getVectorAdapterType(): string | undefined {
    return this.profile.capabilities.database.vectorAdapter;
  }

  /**
   * Check if transactions are supported
   */
  supportsTransactions(): boolean {
    return this.profile.capabilities.database.supportsTransactions;
  }

  // -------------------------------------------------------------------------
  // Auth Capabilities
  // -------------------------------------------------------------------------

  /**
   * Get auth capability
   */
  getAuth(): AuthCapability {
    return this.profile.capabilities.auth;
  }

  /**
   * Check if auth is available
   */
  hasAuth(): boolean {
    return this.profile.capabilities.auth.available;
  }

  /**
   * Get available roles
   */
  getAvailableRoles(): string[] {
    return this.profile.capabilities.auth.roles;
  }

  /**
   * Check if multi-tenant is supported
   */
  supportsMultiTenant(): boolean {
    return this.profile.capabilities.auth.supportsMultiTenant;
  }

  // -------------------------------------------------------------------------
  // AI Capabilities
  // -------------------------------------------------------------------------

  /**
   * Get AI capability
   */
  getAI(): AICapability {
    return this.profile.capabilities.ai;
  }

  /**
   * Check if AI is available
   */
  hasAI(): boolean {
    return this.profile.capabilities.ai.available;
  }

  /**
   * Get chat provider
   */
  getChatProvider(): string {
    return this.profile.capabilities.ai.chatProvider;
  }

  /**
   * Get embedding provider
   */
  getEmbeddingProvider(): string {
    return this.profile.capabilities.ai.embeddingProvider;
  }

  /**
   * Check if streaming is supported
   */
  supportsStreaming(): boolean {
    return this.profile.capabilities.ai.supportsStreaming;
  }

  /**
   * Check if function calling is supported
   */
  supportsFunctionCalling(): boolean {
    return this.profile.capabilities.ai.supportsFunctionCalling;
  }

  // -------------------------------------------------------------------------
  // Realtime Capabilities
  // -------------------------------------------------------------------------

  /**
   * Get realtime capability
   */
  getRealtime(): RealtimeCapability {
    return this.profile.capabilities.realtime;
  }

  /**
   * Check if realtime is available
   */
  hasRealtime(): boolean {
    return this.profile.capabilities.realtime.available;
  }

  /**
   * Get realtime type
   */
  getRealtimeType(): string {
    return this.profile.capabilities.realtime.type;
  }

  /**
   * Check if presence is supported
   */
  supportsPresence(): boolean {
    return this.profile.capabilities.realtime.supportsPresence;
  }

  // -------------------------------------------------------------------------
  // Notification Capabilities
  // -------------------------------------------------------------------------

  /**
   * Get notification capability
   */
  getNotifications(): NotificationCapability {
    return this.profile.capabilities.notifications;
  }

  /**
   * Check if notifications are available
   */
  hasNotifications(): boolean {
    return this.profile.capabilities.notifications.available;
  }

  /**
   * Get available notification channels
   */
  getNotificationChannels(): string[] {
    return this.profile.capabilities.notifications.channels;
  }

  /**
   * Check if specific channel is available
   */
  hasNotificationChannel(channel: string): boolean {
    return this.profile.capabilities.notifications.channels.includes(channel as never);
  }

  // -------------------------------------------------------------------------
  // Other Capabilities
  // -------------------------------------------------------------------------

  /**
   * Get storage capability
   */
  getStorage(): StorageCapability {
    return this.profile.capabilities.storage;
  }

  /**
   * Check if storage is available
   */
  hasStorage(): boolean {
    return this.profile.capabilities.storage.available;
  }

  /**
   * Get queue capability
   */
  getQueue(): QueueCapability {
    return this.profile.capabilities.queue;
  }

  /**
   * Check if queue is available
   */
  hasQueue(): boolean {
    return this.profile.capabilities.queue.available &&
           this.profile.capabilities.queue.type !== 'none';
  }

  /**
   * Get cache capability
   */
  getCache(): CacheCapability {
    return this.profile.capabilities.cache;
  }

  /**
   * Check if cache is available
   */
  hasCache(): boolean {
    return this.profile.capabilities.cache.available &&
           this.profile.capabilities.cache.type !== 'none';
  }

  // -------------------------------------------------------------------------
  // Feature Checks
  // -------------------------------------------------------------------------

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof IntegrationProfile['features']): boolean {
    // Check for override first
    if (this.featureOverrides.has(feature)) {
      return this.featureOverrides.get(feature)!;
    }
    return this.profile.features[feature];
  }

  /**
   * Override a feature flag
   */
  setFeatureOverride(feature: keyof IntegrationProfile['features'], enabled: boolean): void {
    this.featureOverrides.set(feature, enabled);
  }

  /**
   * Clear feature overrides
   */
  clearFeatureOverrides(): void {
    this.featureOverrides.clear();
  }

  /**
   * Get full feature availability with reasons
   */
  getFeatureAvailability(): FeatureAvailability {
    return {
      goalPlanning: this.checkGoalPlanningAvailability(),
      toolExecution: this.checkToolExecutionAvailability(),
      proactiveInterventions: this.checkProactiveInterventionsAvailability(),
      selfEvaluation: this.checkSelfEvaluationAvailability(),
      learningAnalytics: this.checkLearningAnalyticsAvailability(),
      memorySystem: this.checkMemorySystemAvailability(),
      knowledgeGraph: this.checkKnowledgeGraphAvailability(),
      realTimeSync: this.checkRealTimeSyncAvailability(),
    };
  }

  private checkGoalPlanningAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('goalPlanning')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: 'Database required for goal persistence' };
    }
    if (!this.hasAI()) {
      return { available: false, reason: 'AI required for goal decomposition', fallback: 'Manual goal creation available' };
    }
    return { available: true };
  }

  private checkToolExecutionAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('toolExecution')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasAuth()) {
      return { available: false, reason: 'Auth required for permission management' };
    }
    return { available: true };
  }

  private checkProactiveInterventionsAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('proactiveInterventions')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: 'Database required for behavior tracking' };
    }
    if (!this.hasNotifications()) {
      return { available: false, reason: 'Notifications required for interventions', fallback: 'In-app only mode available' };
    }
    return { available: true };
  }

  private checkSelfEvaluationAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('selfEvaluation')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasAI()) {
      return { available: false, reason: 'AI required for confidence scoring' };
    }
    return { available: true };
  }

  private checkLearningAnalyticsAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('learningAnalytics')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: 'Database required for analytics storage' };
    }
    return { available: true };
  }

  private checkMemorySystemAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('memorySystem')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasVectorDatabase()) {
      return { available: false, reason: 'Vector database required', fallback: 'In-memory vector store available' };
    }
    return { available: true };
  }

  private checkKnowledgeGraphAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('knowledgeGraph')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: 'Database required for graph storage' };
    }
    return { available: true };
  }

  private checkRealTimeSyncAvailability(): CapabilityCheckResult {
    if (!this.isFeatureEnabled('realTimeSync')) {
      return { available: false, reason: 'Feature disabled in profile' };
    }
    if (!this.hasRealtime()) {
      return { available: false, reason: 'Realtime adapter required', fallback: 'Polling mode available' };
    }
    return { available: true };
  }

  // -------------------------------------------------------------------------
  // Tool Configuration
  // -------------------------------------------------------------------------

  /**
   * Get tool configuration by ID
   */
  getToolConfig(toolId: string): ToolConfiguration | undefined {
    const allTools = [
      ...this.profile.tools.content,
      ...this.profile.tools.assessment,
      ...this.profile.tools.communication,
      ...this.profile.tools.analytics,
      ...this.profile.tools.system,
      ...this.profile.tools.external,
      ...this.profile.tools.custom,
    ];
    return allTools.find(t => t.id === toolId);
  }

  /**
   * Check if tool is enabled
   */
  isToolEnabled(toolId: string): boolean {
    const config = this.getToolConfig(toolId);
    return config?.enabled ?? false;
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: keyof IntegrationProfile['tools']): ToolConfiguration[] {
    return this.profile.tools[category];
  }

  /**
   * Get all enabled tools
   */
  getEnabledTools(): ToolConfiguration[] {
    const allTools = [
      ...this.profile.tools.content,
      ...this.profile.tools.assessment,
      ...this.profile.tools.communication,
      ...this.profile.tools.analytics,
      ...this.profile.tools.system,
      ...this.profile.tools.external,
      ...this.profile.tools.custom,
    ];
    return allTools.filter(t => t.enabled);
  }

  // -------------------------------------------------------------------------
  // Data Sources
  // -------------------------------------------------------------------------

  /**
   * Get data source configuration
   */
  getDataSource(type: string): DataSourceConfiguration | undefined {
    return this.profile.dataSources.find(ds => ds.type === type);
  }

  /**
   * Check if data source is enabled
   */
  isDataSourceEnabled(type: string): boolean {
    const ds = this.getDataSource(type);
    return ds?.enabled ?? false;
  }

  /**
   * Get all enabled data sources
   */
  getEnabledDataSources(): DataSourceConfiguration[] {
    return this.profile.dataSources.filter(ds => ds.enabled);
  }

  // -------------------------------------------------------------------------
  // Environment
  // -------------------------------------------------------------------------

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.profile.environment.isDevelopment;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.profile.environment.isProduction;
  }

  /**
   * Get runtime environment
   */
  getRuntime(): string {
    return this.profile.environment.runtime;
  }

  /**
   * Get host framework
   */
  getFramework(): string {
    return this.profile.environment.framework;
  }

  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------

  /**
   * Get limit value
   */
  getLimit(limit: keyof IntegrationProfile['limits']): number | undefined {
    return this.profile.limits[limit];
  }

  /**
   * Check if within limit
   */
  isWithinLimit(limit: keyof IntegrationProfile['limits'], value: number): boolean {
    const maxValue = this.profile.limits[limit];
    if (maxValue === undefined) return true;
    return value <= maxValue;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a capability registry from a profile
 */
export function createCapabilityRegistry(profile: IntegrationProfile): CapabilityRegistry {
  return new CapabilityRegistry(profile);
}

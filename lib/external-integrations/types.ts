// External Platform Integrations Types

export interface ExternalIntegration {
  id: string;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  status: IntegrationStatus;
  configuration: IntegrationConfiguration;
  authentication: AuthenticationConfig;
  dataMapping: DataMappingConfig;
  syncSettings: SyncSettings;
  capabilities: IntegrationCapabilities;
  metadata: IntegrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfiguration {
  apiEndpoint: string;
  version: string;
  environment: Environment;
  rateLimits: RateLimitConfig;
  retryPolicy: RetryPolicy;
  timeout: number; // milliseconds
  batchSize: number;
  webhookUrl?: string;
  customSettings: Record<string, unknown>;
  featureFlags: FeatureFlag[];
}

export interface AuthenticationConfig {
  method: AuthMethod;
  credentials: CredentialConfig;
  tokenManagement: TokenManagement;
  refreshSchedule: RefreshSchedule;
  encryptionSettings: EncryptionSettings;
  scopes: string[];
  permissions: Permission[];
}

export interface DataMappingConfig {
  fieldMappings: FieldMapping[];
  transformations: DataTransformation[];
  validationRules: ValidationRule[];
  conflictResolution: ConflictResolution;
  dataTypes: DataTypeMapping[];
  customMappings: CustomMapping[];
}

export interface SyncSettings {
  enabled: boolean;
  direction: SyncDirection;
  frequency: SyncFrequency;
  schedule: SyncSchedule;
  batchProcessing: BatchProcessingConfig;
  conflictResolution: ConflictResolutionStrategy;
  filterCriteria: FilterCriteria[];
  monitoring: SyncMonitoring;
}

export interface IntegrationCapabilities {
  supportedOperations: Operation[];
  dataFormats: DataFormat[];
  realTimeSync: boolean;
  batchSync: boolean;
  webhookSupport: boolean;
  customFields: boolean;
  bulkOperations: boolean;
  incremental: boolean;
  fileSupport: FileSupport;
  analytics: AnalyticsCapabilities;
}

export interface IntegrationMetadata {
  lastSync: Date | null;
  totalSynced: number;
  errorCount: number;
  successRate: number;
  avgSyncTime: number; // milliseconds
  dataVolume: DataVolume;
  performanceMetrics: PerformanceMetrics;
  healthStatus: HealthStatus;
  usage: UsageMetrics;
}

// Platform-specific integration types

export interface LMSIntegration extends ExternalIntegration {
  lmsProvider: LMSProvider;
  courseMapping: CourseMappingConfig;
  userMapping: UserMappingConfig;
  gradebookSync: GradebookSyncConfig;
  contentSync: ContentSyncConfig;
  enrollmentSync: EnrollmentSyncConfig;
}

export interface AuthProviderIntegration extends ExternalIntegration {
  authProvider: AuthProvider;
  ssoConfig: SSOConfiguration;
  userProvisioning: UserProvisioningConfig;
  groupMapping: GroupMappingConfig;
  attributeMapping: AttributeMappingConfig;
  sessionManagement: SessionManagementConfig;
}

export interface AnalyticsIntegration extends ExternalIntegration {
  analyticsProvider: AnalyticsProvider;
  eventMapping: EventMappingConfig;
  metricsSync: MetricsSyncConfig;
  reportingConfig: ReportingConfig;
  dashboardIntegration: DashboardIntegrationConfig;
  customDimensions: CustomDimensionConfig[];
}

export interface ContentProviderIntegration extends ExternalIntegration {
  contentProvider: ContentProvider;
  libraryAccess: LibraryAccessConfig;
  contentImport: ContentImportConfig;
  metadataSync: MetadataSyncConfig;
  licensingConfig: LicensingConfig;
  qualityAssurance: QualityAssuranceConfig;
}

export interface CommunicationIntegration extends ExternalIntegration {
  communicationProvider: CommunicationProvider;
  messageRouting: MessageRoutingConfig;
  notificationConfig: NotificationConfig;
  channelMapping: ChannelMappingConfig;
  automationRules: AutomationRule[];
  templateManagement: TemplateManagementConfig;
}

// Sync and data transfer types

export interface SyncOperation {
  id: string;
  integrationId: string;
  operation: Operation;
  direction: SyncDirection;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsError: number;
  batchId?: string;
  errorLog: SyncError[];
  metadata: SyncMetadata;
}

export interface SyncError {
  recordId: string;
  errorType: ErrorType;
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  retryCount: number;
  resolution?: ErrorResolution;
  context: ErrorContext;
}

export interface DataTransferResult {
  operation: SyncOperation;
  summary: TransferSummary;
  mappings: DataMappingResult[];
  validationResults: ValidationResult[];
  conflicts: DataConflict[];
  transformations: TransformationResult[];
  performance: TransferPerformance;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  providerId: string;
  eventType: WebhookEventType;
  payload: unknown;
  timestamp: Date;
  signature: string;
  verified: boolean;
  processed: boolean;
  processingResult?: WebhookProcessingResult;
  retryCount: number;
}

// Authentication and security types

export interface OAuth2Config extends CredentialConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  refreshTokenUrl?: string;
  scope: string[];
  state?: string;
  pkce?: PKCEConfig;
}

export interface APIKeyConfig extends CredentialConfig {
  apiKey: string;
  keyHeader: string;
  keyPrefix?: string;
  secretKey?: string;
  keyLocation: KeyLocation;
}

export interface JWTConfig extends CredentialConfig {
  publicKey: string;
  privateKey?: string;
  algorithm: JWTAlgorithm;
  issuer: string;
  audience: string;
  expiresIn: number;
  customClaims?: Record<string, unknown>;
}

export interface BasicAuthConfig extends CredentialConfig {
  username: string;
  password: string;
  encoding?: 'base64' | 'plain';
}

// Mapping and transformation types

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: TransformationType;
  defaultValue?: unknown;
  required: boolean;
  validation?: FieldValidation;
  customLogic?: string;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: TransformationType;
  sourceFields: string[];
  targetField: string;
  logic: TransformationLogic;
  parameters: TransformationParameters;
  validation: TransformationValidation;
}

export interface ValidationRule {
  field: string;
  rule: ValidationRuleType;
  parameters: ValidationParameters;
  errorMessage: string;
  severity: ValidationSeverity;
  action: ValidationAction;
}

// Configuration types

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  backoffStrategy: BackoffStrategy;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export interface SyncSchedule {
  type: ScheduleType;
  cronExpression?: string;
  interval?: number; // minutes
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  excludeDates?: Date[];
  conditions?: ScheduleCondition[];
}

export interface FilterCriteria {
  field: string;
  operator: FilterOperator;
  value: unknown;
  dataType: DataType;
  caseSensitive?: boolean;
  negated?: boolean;
}

// Monitoring and analytics types

export interface IntegrationMonitoring {
  integrationId: string;
  healthChecks: HealthCheck[];
  performanceMetrics: PerformanceMetrics;
  errorTracking: ErrorTracking;
  alerting: AlertingConfig;
  logging: LoggingConfig;
  compliance: ComplianceMonitoring;
}

export interface HealthCheck {
  id: string;
  name: string;
  type: HealthCheckType;
  endpoint?: string;
  interval: number; // minutes
  timeout: number; // milliseconds
  retryCount: number;
  status: HealthStatus;
  lastCheck: Date;
  responseTime: number;
  errorMessage?: string;
}

export interface PerformanceMetrics {
  throughput: ThroughputMetrics;
  latency: LatencyMetrics;
  availability: AvailabilityMetrics;
  errorRates: ErrorRateMetrics;
  resourceUsage: ResourceUsageMetrics;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
  escalation: EscalationPolicy;
  suppressionRules: SuppressionRule[];
  templates: AlertTemplate[];
}

// Event and webhook types

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  eventType: IntegrationEventType;
  timestamp: Date;
  payload: unknown;
  metadata: EventMetadata;
  status: EventStatus;
  processingResult?: EventProcessingResult;
}

export interface WebhookConfiguration {
  url: string;
  secret: string;
  events: WebhookEventType[];
  authentication: WebhookAuthentication;
  retryPolicy: WebhookRetryPolicy;
  filters: WebhookFilter[];
  transformation: WebhookTransformation;
}

// Enum types

export type ProviderType = 
  | 'lms' | 'authentication' | 'analytics' | 'content' | 'communication'
  | 'assessment' | 'video' | 'payment' | 'storage' | 'notification'
  | 'calendar' | 'conference' | 'crm' | 'hrms' | 'library';

export type IntegrationStatus = 
  | 'active' | 'inactive' | 'pending' | 'error' | 'suspended' 
  | 'configuring' | 'testing' | 'deprecated';

export type Environment = 'production' | 'staging' | 'development' | 'sandbox' | 'testing';

export type AuthMethod = 
  | 'oauth2' | 'api_key' | 'jwt' | 'basic_auth' | 'bearer_token' 
  | 'saml' | 'ldap' | 'custom' | 'none';

export type SyncDirection = 'bidirectional' | 'inbound' | 'outbound' | 'manual';

export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';

export type SyncStatus = 
  | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' 
  | 'paused' | 'retrying' | 'partial';

export type Operation = 
  | 'create' | 'read' | 'update' | 'delete' | 'sync' | 'export' 
  | 'import' | 'backup' | 'restore' | 'validate' | 'transform';

export type DataFormat = 
  | 'json' | 'xml' | 'csv' | 'excel' | 'pdf' | 'plain_text' 
  | 'binary' | 'form_data' | 'scorm' | 'xapi' | 'qti';

export type ErrorType = 
  | 'authentication' | 'authorization' | 'validation' | 'transformation'
  | 'mapping' | 'network' | 'timeout' | 'rate_limit' | 'server_error'
  | 'client_error' | 'configuration' | 'data_conflict';

export type TransformationType = 
  | 'text_format' | 'date_format' | 'number_format' | 'concatenation'
  | 'extraction' | 'substitution' | 'mapping' | 'calculation'
  | 'conditional' | 'lookup' | 'aggregation' | 'custom';

export type ValidationRuleType = 
  | 'required' | 'format' | 'length' | 'range' | 'pattern' 
  | 'unique' | 'custom' | 'cross_field' | 'business_rule';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationAction = 'reject' | 'accept_with_warning' | 'auto_correct' | 'manual_review';

export type ConflictResolutionStrategy = 
  | 'source_wins' | 'target_wins' | 'newest_wins' | 'manual_review'
  | 'merge' | 'skip' | 'custom_logic';

export type ScheduleType = 'cron' | 'interval' | 'event_driven' | 'manual';

export type FilterOperator = 
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with'
  | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';

export type DataType = 
  | 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'time'
  | 'array' | 'object' | 'binary' | 'uuid' | 'email' | 'url';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export type HealthCheckType = 'ping' | 'api_call' | 'database' | 'file_system' | 'custom';

export type WebhookEventType = 
  | 'user_created' | 'user_updated' | 'user_deleted' | 'course_created'
  | 'course_updated' | 'enrollment_created' | 'grade_updated'
  | 'completion_updated' | 'custom_event';

export type IntegrationEventType = 
  | 'sync_started' | 'sync_completed' | 'sync_failed' | 'error_occurred'
  | 'configuration_changed' | 'authentication_renewed' | 'webhook_received';

export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export type KeyLocation = 'header' | 'query' | 'body' | 'cookie';

export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';

export type BackoffStrategy = 'exponential' | 'linear' | 'fixed' | 'custom';

// Provider-specific types

export type LMSProvider = 
  | 'moodle' | 'canvas' | 'blackboard' | 'brightspace' | 'schoology'
  | 'google_classroom' | 'edmodo' | 'coursera' | 'udemy' | 'custom';

export type AuthProvider = 
  | 'google' | 'microsoft' | 'okta' | 'auth0' | 'aws_cognito'
  | 'azure_ad' | 'ldap' | 'saml' | 'custom_saml' | 'custom_oauth';

export type AnalyticsProvider = 
  | 'google_analytics' | 'mixpanel' | 'amplitude' | 'segment'
  | 'adobe_analytics' | 'tableau' | 'power_bi' | 'custom';

export type ContentProvider = 
  | 'youtube' | 'vimeo' | 'kaltura' | 'brightcove' | 'aws_s3'
  | 'google_drive' | 'dropbox' | 'box' | 'pearson' | 'mcgraw_hill';

export type CommunicationProvider = 
  | 'slack' | 'microsoft_teams' | 'discord' | 'zoom' | 'webex'
  | 'google_meet' | 'email' | 'sms' | 'push_notification' | 'custom';

// Supporting interfaces

export interface CredentialConfig {
  type: AuthMethod;
  encrypted: boolean;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface TokenManagement {
  autoRefresh: boolean;
  refreshThreshold: number; // minutes before expiry
  storage: TokenStorage;
  encryption: boolean;
  rotationPolicy: TokenRotationPolicy;
}

export interface RefreshSchedule {
  enabled: boolean;
  interval: number; // hours
  retryAttempts: number;
  alertOnFailure: boolean;
}

export interface EncryptionSettings {
  algorithm: string;
  keySize: number;
  iv?: string;
  salt?: string;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  conditions?: FlagCondition[];
  rolloutPercentage?: number;
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  customLogic?: string;
  notificationRequired: boolean;
  auditTrail: boolean;
}

export interface CustomMapping {
  name: string;
  sourceQuery: string;
  targetPath: string;
  transformation?: string;
  validation?: string;
}

export interface BatchProcessingConfig {
  enabled: boolean;
  batchSize: number;
  parallelProcessing: boolean;
  maxConcurrency: number;
  processingOrder: ProcessingOrder;
}

export interface SyncMonitoring {
  enabled: boolean;
  metricsCollection: boolean;
  alertThresholds: AlertThreshold[];
  reportGeneration: boolean;
  dashboardIntegration: boolean;
}

export interface FileSupport {
  uploadEnabled: boolean;
  downloadEnabled: boolean;
  maxFileSize: number; // bytes
  supportedFormats: string[];
  virusScanning: boolean;
}

export interface AnalyticsCapabilities {
  eventTracking: boolean;
  customMetrics: boolean;
  realTimeReporting: boolean;
  historicalData: boolean;
  segmentation: boolean;
}

export interface DataVolume {
  totalRecords: number;
  dailyVolume: number;
  peakVolume: number;
  storageUsed: number; // bytes
  bandwidthUsed: number; // bytes
}

export interface UsageMetrics {
  apiCalls: number;
  dataTransferred: number; // bytes
  errorRate: number; // percentage
  avgResponseTime: number; // milliseconds
  costIncurred: number;
}

// Complex configuration interfaces

export interface CourseMappingConfig {
  autoMapping: boolean;
  mappingRules: CourseMappingRule[];
  categoryMapping: CategoryMappingConfig;
  metadataMapping: MetadataMappingConfig;
  contentMapping: ContentMappingConfig;
}

export interface UserMappingConfig {
  autoProvisioning: boolean;
  userIdentifier: UserIdentifierType;
  attributeMapping: UserAttributeMapping[];
  roleMapping: RoleMappingConfig;
  groupMapping: GroupMappingConfig;
}

export interface GradebookSyncConfig {
  enabled: boolean;
  syncDirection: SyncDirection;
  gradeMapping: GradeMappingConfig;
  categorySync: boolean;
  weightingSync: boolean;
  commentSync: boolean;
}

export interface SSOConfiguration {
  protocol: SSOProtocol;
  identityProvider: IdentityProviderConfig;
  serviceProvider: ServiceProviderConfig;
  attributeMapping: SSOAttributeMapping[];
  sessionManagement: SSOSessionConfig;
}

export interface UserProvisioningConfig {
  autoProvisioning: boolean;
  provisioningRules: ProvisioningRule[];
  deprovisioningRules: DeprovisioningRule[];
  updateStrategy: UserUpdateStrategy;
  conflictResolution: UserConflictResolution;
}

export interface EventMappingConfig {
  eventTypes: EventTypeMapping[];
  customEvents: CustomEventConfig[];
  filtering: EventFilterConfig;
  enrichment: EventEnrichmentConfig;
  batching: EventBatchingConfig;
}

export interface LibraryAccessConfig {
  accessMethod: LibraryAccessMethod;
  authentication: LibraryAuthConfig;
  searchCapabilities: SearchCapabilityConfig;
  downloadRights: DownloadRightsConfig;
  usageTracking: UsageTrackingConfig;
}

export interface MessageRoutingConfig {
  routingRules: MessageRoutingRule[];
  channelPriority: ChannelPriorityConfig;
  fallbackChannels: FallbackChannelConfig[];
  messageFormatting: MessageFormattingConfig;
  deliveryTracking: DeliveryTrackingConfig;
}

// Result and response types

export interface TransferSummary {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  duplicateRecords: number;
  dataVolume: number; // bytes
  processingTime: number; // milliseconds
}

export interface DataMappingResult {
  sourceField: string;
  targetField: string;
  transformation: string;
  success: boolean;
  value: unknown;
  error?: string;
}

export interface ValidationResult {
  field: string;
  rule: string;
  success: boolean;
  value: unknown;
  error?: string;
  suggestion?: string;
}

export interface DataConflict {
  recordId: string;
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
  resolution: ConflictResolutionStrategy;
  resolvedValue: unknown;
  timestamp: Date;
}

export interface TransformationResult {
  transformationId: string;
  sourceData: unknown;
  transformedData: unknown;
  success: boolean;
  error?: string;
  performanceMetrics: TransformationPerformance;
}

export interface TransferPerformance {
  totalTime: number; // milliseconds
  averageRecordTime: number; // milliseconds
  throughput: number; // records per second
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  networkLatency: number; // milliseconds
}

export interface WebhookProcessingResult {
  success: boolean;
  processedAt: Date;
  action: string;
  recordsAffected: number;
  error?: string;
  metadata: Record<string, unknown>;
}

// Additional supporting types

export interface PKCEConfig {
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
  codeVerifier: string;
}

export interface TransformationLogic {
  type: 'javascript' | 'sql' | 'regex' | 'template' | 'custom';
  expression: string;
  variables?: Record<string, unknown>;
  functions?: string[];
}

export interface TransformationParameters {
  [key: string]: unknown;
}

export interface TransformationValidation {
  inputValidation: ValidationRule[];
  outputValidation: ValidationRule[];
  businessRules: BusinessRule[];
}

export interface ValidationParameters {
  [key: string]: unknown;
}

export interface ScheduleCondition {
  type: 'data_change' | 'threshold' | 'time_window' | 'external_trigger';
  parameters: Record<string, unknown>;
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  recordsPerSecond: number;
  bytesPerSecond: number;
  peakThroughput: number;
  averageThroughput: number;
}

export interface LatencyMetrics {
  averageLatency: number; // milliseconds
  medianLatency: number; // milliseconds
  p95Latency: number; // milliseconds
  p99Latency: number; // milliseconds
  maxLatency: number; // milliseconds
}

export interface AvailabilityMetrics {
  uptime: number; // percentage
  downtime: number; // minutes
  mtbf: number; // mean time between failures (hours)
  mttr: number; // mean time to recovery (minutes)
  slaCompliance: number; // percentage
}

export interface ErrorRateMetrics {
  overallErrorRate: number; // percentage
  errorRateByType: Record<string, number>;
  errorTrend: ErrorTrendData[];
  criticalErrors: number;
  recoverableErrors: number;
}

export interface ResourceUsageMetrics {
  cpuUsage: number; // percentage
  memoryUsage: number; // bytes
  diskUsage: number; // bytes
  networkUsage: number; // bytes
  concurrentConnections: number;
}

export interface AlertChannel {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'push';
  endpoint: string;
  authentication?: Record<string, unknown>;
  formatting?: Record<string, unknown>;
}

export interface AlertRule {
  name: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  channels: string[];
  throttling: AlertThrottling;
  escalation?: AlertEscalation;
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: number; // minutes
  autoResolve: boolean;
}

export interface SuppressionRule {
  condition: SuppressionCondition;
  duration: number; // minutes
  scope: SuppressionScope;
}

export interface AlertTemplate {
  name: string;
  subject: string;
  body: string;
  variables: string[];
  formatting: TemplateFormatting;
}

export interface EventMetadata {
  source: string;
  version: string;
  correlationId?: string;
  parentEventId?: string;
  tags: Record<string, string>;
}

export interface EventProcessingResult {
  processed: boolean;
  processingTime: number; // milliseconds
  actions: ProcessingAction[];
  errors: ProcessingError[];
  metadata: Record<string, unknown>;
}

export interface WebhookAuthentication {
  type: 'none' | 'basic' | 'bearer' | 'hmac' | 'jwt';
  credentials?: Record<string, unknown>;
  verification: boolean;
}

export interface WebhookRetryPolicy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffFactor: number;
  timeoutThreshold: number; // milliseconds
}

export interface WebhookFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
  caseSensitive?: boolean;
}

export interface WebhookTransformation {
  enabled: boolean;
  template?: string;
  mapping?: FieldMapping[];
  customLogic?: string;
}

// Additional enum types

export type ProcessingOrder = 'fifo' | 'lifo' | 'priority' | 'random' | 'dependency';

export type UserIdentifierType = 'email' | 'username' | 'external_id' | 'student_id' | 'custom';

export type SSOProtocol = 'saml2' | 'oauth2' | 'openid_connect' | 'cas' | 'ldap';

export type UserUpdateStrategy = 'overwrite' | 'merge' | 'append' | 'manual_review';

export type UserConflictResolution = 'source_wins' | 'target_wins' | 'manual_review' | 'skip';

export type LibraryAccessMethod = 'api' | 'web_scraping' | 'ftp' | 'sftp' | 'direct_db';

export type TokenStorage = 'database' | 'cache' | 'file' | 'memory' | 'external_vault';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type SuppressionScope = 'global' | 'integration' | 'event_type' | 'custom';

// Complex supporting interfaces

export interface TokenRotationPolicy {
  enabled: boolean;
  rotationInterval: number; // hours
  overlapPeriod: number; // hours
  notificationThreshold: number; // hours
}

export interface PermissionCondition {
  type: 'time' | 'location' | 'device' | 'user_attribute' | 'custom';
  parameters: Record<string, unknown>;
}

export interface FlagCondition {
  type: 'user_attribute' | 'time' | 'random' | 'custom';
  parameters: Record<string, unknown>;
}

export interface AlertThreshold {
  metric: string;
  operator: string;
  value: number;
  duration: number; // minutes
}

export interface BusinessRule {
  name: string;
  condition: string;
  action: string;
  priority: number;
  active: boolean;
}

export interface ErrorTrendData {
  timestamp: Date;
  errorRate: number;
  errorCount: number;
  category: string;
}

export interface AlertCondition {
  metric: string;
  operator: string;
  threshold: number;
  duration: number; // minutes
  aggregation?: string;
}

export interface AlertThrottling {
  enabled: boolean;
  window: number; // minutes
  maxAlerts: number;
}

export interface AlertEscalation {
  delay: number; // minutes
  channels: string[];
  condition?: string;
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: string[];
  users: string[];
}

export interface SuppressionCondition {
  type: 'metric' | 'event' | 'time' | 'custom';
  parameters: Record<string, unknown>;
}

export interface TemplateFormatting {
  format: 'html' | 'text' | 'markdown' | 'json';
  encoding?: string;
  compression?: boolean;
}

export interface ProcessingAction {
  type: string;
  target: string;
  parameters: Record<string, unknown>;
  result: unknown;
}

export interface ProcessingError {
  type: string;
  message: string;
  code?: string;
  retryable: boolean;
}

export interface TransformationPerformance {
  executionTime: number; // milliseconds
  memoryUsed: number; // bytes
  inputSize: number; // bytes
  outputSize: number; // bytes
}

export interface ErrorResolution {
  strategy: 'retry' | 'skip' | 'manual' | 'default_value' | 'custom';
  parameters?: Record<string, unknown>;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ErrorContext {
  operation: string;
  stage: string;
  inputData: unknown;
  configuration: unknown;
  environment: Record<string, unknown>;
}

export interface SyncMetadata {
  initiatedBy: string;
  reason: string;
  configuration: unknown;
  environment: string;
  version: string;
}

export interface FieldValidation {
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customRule?: string;
}

// Missing interface definitions
export interface AttributeMappingConfig {
  [key: string]: unknown;
}

export interface GroupMappingConfig {
  [key: string]: unknown;
}

export interface SessionManagementConfig {
  [key: string]: unknown;
}

export interface MetricsSyncConfig {
  [key: string]: unknown;
}

export interface ReportingConfig {
  [key: string]: unknown;
}

export interface DashboardIntegrationConfig {
  [key: string]: unknown;
}

export interface CustomDimensionConfig {
  [key: string]: unknown;
}

export interface ContentImportConfig {
  [key: string]: unknown;
}

export interface MetadataSyncConfig {
  [key: string]: unknown;
}

export interface LicensingConfig {
  [key: string]: unknown;
}

export interface QualityAssuranceConfig {
  [key: string]: unknown;
}

export interface NotificationConfig {
  [key: string]: unknown;
}

export interface AutomationRule {
  [key: string]: unknown;
}

export interface ChannelMappingConfig {
  [key: string]: unknown;
}

export interface TemplateManagementConfig {
  [key: string]: unknown;
}

export interface ErrorTracking {
  [key: string]: unknown;
}

// All remaining missing interfaces
export interface DataTypeMapping { [key: string]: unknown; }
export interface ContentSyncConfig { [key: string]: unknown; }
export interface EnrollmentSyncConfig { [key: string]: unknown; }
export interface LoggingConfig { [key: string]: unknown; }
export interface ComplianceMonitoring { [key: string]: unknown; }
export interface CourseMappingRule { [key: string]: unknown; }
export interface CategoryMappingConfig { [key: string]: unknown; }
export interface ContentMappingConfig { [key: string]: unknown; }
export interface UserAttributeMapping { [key: string]: unknown; }
export interface RoleMappingConfig { [key: string]: unknown; }
export interface GradeMappingConfig { [key: string]: unknown; }
export interface IdentityProviderConfig { [key: string]: unknown; }
export interface ServiceProviderConfig { [key: string]: unknown; }
export interface SSOAttributeMapping { [key: string]: unknown; }
export interface SSOSessionConfig { [key: string]: unknown; }
export interface ProvisioningRule { [key: string]: unknown; }
export interface DeprovisioningRule { [key: string]: unknown; }
export interface EventTypeMapping { [key: string]: unknown; }
export interface CustomEventConfig { [key: string]: unknown; }
export interface EventFilterConfig { [key: string]: unknown; }
export interface EventEnrichmentConfig { [key: string]: unknown; }
export interface EventBatchingConfig { [key: string]: unknown; }
export interface LibraryAuthConfig { [key: string]: unknown; }
export interface SearchCapabilityConfig { [key: string]: unknown; }
export interface DownloadRightsConfig { [key: string]: unknown; }
export interface UsageTrackingConfig { [key: string]: unknown; }
export interface MessageRoutingRule { [key: string]: unknown; }
export interface ChannelPriorityConfig { [key: string]: unknown; }
export interface FallbackChannelConfig { [key: string]: unknown; }
export interface MessageFormattingConfig { [key: string]: unknown; }
export interface DeliveryTrackingConfig { [key: string]: unknown; }
export interface MetadataMappingConfig { [key: string]: unknown; }
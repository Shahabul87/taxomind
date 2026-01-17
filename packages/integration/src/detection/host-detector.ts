/**
 * @sam-ai/integration - Host Detection
 * Auto-detect host environment and generate integration profile
 */

import {
  type IntegrationProfile,
  RuntimeEnvironment,
  HostFrameworkType,
  DatabaseType,
  VectorAdapterType,
  AuthProviderType,
  AIProviderType,
  EmbeddingProviderType,
  RealtimeType,
  DataSourceType,
} from '../types/profile';

// ============================================================================
// DETECTION RESULT
// ============================================================================

/**
 * Environment detection result
 */
export interface DetectionResult {
  runtime: RuntimeEnvironment;
  framework: HostFrameworkType;
  nodeVersion?: string;
  features: DetectedFeatures;
  environment: DetectedEnvironment;
  confidence: number;
}

/**
 * Detected features
 */
export interface DetectedFeatures {
  hasPrisma: boolean;
  hasDrizzle: boolean;
  hasNextAuth: boolean;
  hasClerk: boolean;
  hasAnthropic: boolean;
  hasOpenAI: boolean;
  hasRedis: boolean;
  hasWebSocket: boolean;
  hasPgVector: boolean;
}

/**
 * Detected environment variables
 */
export interface DetectedEnvironment {
  isDevelopment: boolean;
  isProduction: boolean;
  hasDatabase: boolean;
  hasAuth: boolean;
  hasAI: boolean;
  region?: string;
}

// ============================================================================
// HOST DETECTOR
// ============================================================================

/**
 * Host Detector
 * Detects the host environment and available capabilities
 */
export class HostDetector {
  private cache: DetectionResult | null = null;

  /**
   * Detect the host environment
   */
  detect(): DetectionResult {
    if (this.cache) {
      return this.cache;
    }

    const runtime = this.detectRuntime();
    const framework = this.detectFramework();
    const features = this.detectFeatures();
    const environment = this.detectEnvironment();
    const nodeVersion = this.getNodeVersion();

    const result: DetectionResult = {
      runtime,
      framework,
      nodeVersion,
      features,
      environment,
      confidence: this.calculateConfidence(framework, features),
    };

    this.cache = result;
    return result;
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Detect runtime environment
   */
  private detectRuntime(): RuntimeEnvironment {
    // Check for various runtimes
    if (typeof window !== 'undefined') {
      return RuntimeEnvironment.BROWSER;
    }

    if (typeof Deno !== 'undefined') {
      return RuntimeEnvironment.DENO;
    }

    if (typeof Bun !== 'undefined') {
      return RuntimeEnvironment.BUN;
    }

    // Check for edge runtime
    if (
      typeof process !== 'undefined' &&
      process.env?.NEXT_RUNTIME === 'edge'
    ) {
      return RuntimeEnvironment.EDGE;
    }

    // Check for Vercel Edge
    if (typeof EdgeRuntime !== 'undefined') {
      return RuntimeEnvironment.EDGE;
    }

    // Default to Node.js
    return RuntimeEnvironment.NODE;
  }

  /**
   * Detect framework
   */
  private detectFramework(): HostFrameworkType {
    // Check environment variables for framework hints
    if (typeof process !== 'undefined' && process.env) {
      // Next.js
      if (process.env.NEXT_RUNTIME || process.env.__NEXT_ROUTER_BASEPATH !== undefined) {
        return HostFrameworkType.NEXTJS;
      }

      // Vercel
      if (process.env.VERCEL) {
        return HostFrameworkType.NEXTJS;
      }

      // Remix
      if (process.env.REMIX_DEV_HTTP_ORIGIN) {
        return HostFrameworkType.REMIX;
      }

      // Nuxt
      if (process.env.NUXT_VERSION) {
        return HostFrameworkType.NUXT;
      }
    }

    // Note: We avoid require.resolve() here as it causes issues with bundlers
    // like Turbopack that statically analyze imports. Instead, rely on
    // environment variable detection above which covers most use cases.

    // Default to Next.js for Taxomind (known environment)
    // This can be overridden by explicit configuration
    return HostFrameworkType.NEXTJS;
  }

  /**
   * Detect available features
   */
  private detectFeatures(): DetectedFeatures {
    const features: DetectedFeatures = {
      hasPrisma: false,
      hasDrizzle: false,
      hasNextAuth: false,
      hasClerk: false,
      hasAnthropic: false,
      hasOpenAI: false,
      hasRedis: false,
      hasWebSocket: false,
      hasPgVector: false,
    };

    // Check environment variables
    if (typeof process !== 'undefined' && process.env) {
      // Database
      features.hasPrisma = !!process.env.DATABASE_URL;

      // Check for pgvector extension
      features.hasPgVector = process.env.DATABASE_URL?.includes('postgresql') ?? false;

      // Auth
      features.hasNextAuth = !!(
        process.env.NEXTAUTH_URL ||
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET
      );
      features.hasClerk = !!(
        process.env.CLERK_SECRET_KEY ||
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      );

      // AI
      features.hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
      features.hasOpenAI = !!process.env.OPENAI_API_KEY;

      // Redis
      features.hasRedis = !!(
        process.env.REDIS_URL ||
        process.env.UPSTASH_REDIS_REST_URL
      );
    }

    // Note: We avoid require.resolve() here as it causes issues with bundlers
    // like Turbopack that statically analyze imports. Environment variable
    // detection above covers the main use cases. For Taxomind, we know:
    // - Prisma is used (DATABASE_URL check above)
    // - NextAuth is used (NEXTAUTH_URL check above)
    // - Anthropic/OpenAI are used (API key checks above)

    // Mark known Taxomind features based on typical setup
    if (features.hasPrisma || process.env.DATABASE_URL) {
      features.hasPrisma = true;
    }

    return features;
  }

  /**
   * Detect environment
   */
  private detectEnvironment(): DetectedEnvironment {
    const env: DetectedEnvironment = {
      isDevelopment: false,
      isProduction: false,
      hasDatabase: false,
      hasAuth: false,
      hasAI: false,
    };

    if (typeof process !== 'undefined' && process.env) {
      // Environment mode
      env.isDevelopment = process.env.NODE_ENV === 'development';
      env.isProduction = process.env.NODE_ENV === 'production';

      // Database
      env.hasDatabase = !!(
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.MYSQL_URL ||
        process.env.MONGODB_URI
      );

      // Auth
      env.hasAuth = !!(
        process.env.NEXTAUTH_URL ||
        process.env.AUTH_SECRET ||
        process.env.CLERK_SECRET_KEY
      );

      // AI
      env.hasAI = !!(
        process.env.ANTHROPIC_API_KEY ||
        process.env.OPENAI_API_KEY
      );

      // Region
      env.region =
        process.env.VERCEL_REGION ||
        process.env.AWS_REGION ||
        process.env.RAILWAY_REGION;
    }

    return env;
  }

  /**
   * Get Node.js version
   */
  private getNodeVersion(): string | undefined {
    if (typeof process !== 'undefined' && process.version) {
      return process.version;
    }
    return undefined;
  }

  /**
   * Calculate confidence score for detection
   */
  private calculateConfidence(
    framework: HostFrameworkType,
    features: DetectedFeatures
  ): number {
    let confidence = 0.5; // Base confidence

    // Framework detection adds confidence
    if (framework !== HostFrameworkType.UNKNOWN) {
      confidence += 0.2;
    }

    // Each feature detected adds confidence
    const featureCount = Object.values(features).filter(Boolean).length;
    confidence += featureCount * 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate a basic integration profile from detection
   */
  generateProfile(
    options: { id: string; name: string; description?: string }
  ): IntegrationProfile {
    const detection = this.detect();

    return {
      id: options.id,
      name: options.name,
      version: '1.0.0',
      description: options.description,

      environment: {
        runtime: detection.runtime,
        framework: detection.framework,
        nodeVersion: detection.nodeVersion,
        isDevelopment: detection.environment.isDevelopment,
        isProduction: detection.environment.isProduction,
        region: detection.environment.region,
      },

      capabilities: {
        database: {
          available: detection.environment.hasDatabase,
          type: detection.features.hasPrisma
            ? DatabaseType.PRISMA
            : detection.features.hasDrizzle
              ? DatabaseType.DRIZZLE
              : DatabaseType.IN_MEMORY,
          supportsTransactions: detection.features.hasPrisma || detection.features.hasDrizzle,
          supportsVectors: detection.features.hasPgVector,
          vectorAdapter: detection.features.hasPgVector
            ? VectorAdapterType.PGVECTOR
            : VectorAdapterType.IN_MEMORY,
          connectionPooling: true,
        },

        auth: {
          available: detection.environment.hasAuth,
          provider: detection.features.hasNextAuth
            ? AuthProviderType.NEXTAUTH
            : detection.features.hasClerk
              ? AuthProviderType.CLERK
              : AuthProviderType.ANONYMOUS,
          roles: ['admin', 'user', 'student', 'teacher'],
          permissions: [],
          supportsMultiTenant: false,
          sessionStrategy: 'jwt',
        },

        ai: {
          available: detection.environment.hasAI,
          chatProvider: detection.features.hasAnthropic
            ? AIProviderType.ANTHROPIC
            : detection.features.hasOpenAI
              ? AIProviderType.OPENAI
              : AIProviderType.ANTHROPIC,
          embeddingProvider: detection.features.hasOpenAI
            ? EmbeddingProviderType.OPENAI
            : EmbeddingProviderType.OPENAI,
          supportsStreaming: true,
          supportsFunctionCalling: true,
          maxTokens: 4096,
        },

        realtime: {
          available: detection.features.hasWebSocket,
          type: detection.features.hasWebSocket
            ? RealtimeType.WEBSOCKET
            : RealtimeType.SSE,
          supportsPresence: detection.features.hasWebSocket,
          supportsRooms: detection.features.hasWebSocket,
          maxConnectionsPerUser: 5,
        },

        notifications: {
          available: true,
          channels: ['in_app'],
          supportsScheduling: false,
          supportsTemplates: false,
          supportsBatching: false,
        },

        storage: {
          available: false,
          type: 'local',
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: ['image/*', 'application/pdf'],
        },

        queue: {
          available: detection.features.hasRedis,
          type: detection.features.hasRedis ? 'bullmq' : 'in_memory',
          supportsPriority: true,
          supportsDelay: true,
          supportsRetry: true,
          maxConcurrency: 10,
        },

        cache: {
          available: detection.features.hasRedis,
          type: detection.features.hasRedis ? 'redis' : 'in_memory',
          ttlSupported: true,
        },
      },

      entities: {
        user: {
          tableName: 'User',
          idField: 'id',
          fields: {},
        },
      },

      tools: {
        content: [],
        assessment: [],
        communication: [],
        analytics: [],
        system: [],
        external: [],
        custom: [],
      },

      dataSources: [
        {
          type: DataSourceType.CURRICULUM,
          enabled: true,
          cacheEnabled: true,
          cacheTTL: 3600,
          accessLevel: 'read',
        },
        {
          type: DataSourceType.USER_HISTORY,
          enabled: true,
          cacheEnabled: true,
          cacheTTL: 300,
          accessLevel: 'read',
        },
      ],

      features: {
        goalPlanning: detection.environment.hasDatabase && detection.environment.hasAI,
        toolExecution: detection.environment.hasAuth,
        proactiveInterventions: detection.environment.hasDatabase,
        selfEvaluation: detection.environment.hasAI,
        learningAnalytics: detection.environment.hasDatabase,
        memorySystem: detection.features.hasPgVector || true, // Fallback to in-memory
        knowledgeGraph: detection.environment.hasDatabase,
        realTimeSync: detection.features.hasWebSocket,
      },

      limits: {
        maxUsersPerTenant: undefined,
        maxCoursesPerUser: undefined,
        maxSessionDuration: 120,
        maxToolCallsPerSession: 50,
        maxMemoryEntriesPerUser: 10000,
      },

      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['auto-detected'],
        customData: {
          detectionConfidence: detection.confidence,
          detectedFeatures: detection.features,
        },
      },
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a host detector instance
 */
export function createHostDetector(): HostDetector {
  return new HostDetector();
}

/**
 * Quick detection
 */
export function detectHost(): DetectionResult {
  const detector = createHostDetector();
  return detector.detect();
}

/**
 * Generate profile from auto-detection
 */
export function generateProfileFromHost(
  options: { id: string; name: string; description?: string }
): IntegrationProfile {
  const detector = createHostDetector();
  return detector.generateProfile(options);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

// TypeScript type guards for runtime detection
declare global {
  // eslint-disable-next-line no-var
  var window: unknown | undefined;
  // eslint-disable-next-line no-var
  var Deno: unknown | undefined;
  // eslint-disable-next-line no-var
  var Bun: unknown | undefined;
  // eslint-disable-next-line no-var
  var EdgeRuntime: unknown | undefined;
}

// Production Configuration - Environment-specific settings for production deployment

export const ProductionConfig = {
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/alam_lms_prod',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
    timeout: parseInt(process.env.DB_TIMEOUT || '30000'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
    maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru',
  },

  // Kafka Configuration
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    groupId: process.env.KAFKA_GROUP_ID || 'lms-consumer-group',
    clientId: process.env.KAFKA_CLIENT_ID || 'alam-lms-client',
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000'),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
    ssl: process.env.KAFKA_SSL_ENABLED === 'true',
    sasl: process.env.KAFKA_SASL_MECHANISM ? {
      mechanism: process.env.KAFKA_SASL_MECHANISM as any,
      username: process.env.KAFKA_SASL_USERNAME || '',
      password: process.env.KAFKA_SASL_PASSWORD || '',
    } : undefined,
  },

  // ML/AI Configuration
  ml: {
    modelPath: process.env.ML_MODEL_PATH || './models',
    batchSize: parseInt(process.env.ML_BATCH_SIZE || '32'),
    inferenceTimeout: parseInt(process.env.ML_INFERENCE_TIMEOUT || '5000'),
    maxConcurrentInferences: parseInt(process.env.ML_MAX_CONCURRENT || '10'),
    modelUpdateInterval: parseInt(process.env.ML_UPDATE_INTERVAL || '86400000'), // 24 hours
    tensorflowConfig: {
      enableGPU: process.env.TF_ENABLE_GPU === 'true',
      memoryGrowth: process.env.TF_MEMORY_GROWTH === 'true',
    },
  },

  // Analytics Configuration
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90'),
    aggregationInterval: parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL || '3600000'), // 1 hour
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000'),
    realTimeBufferSize: parseInt(process.env.ANALYTICS_BUFFER_SIZE || '100'),
    exportFormats: (process.env.ANALYTICS_EXPORT_FORMATS || 'json,csv,xlsx').split(','),
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
    sessionConfig: {
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000'), // 30 days
    },
  },

  // File Storage Configuration
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // 'local', 's3', 'gcs'
    local: {
      uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    },
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },

  // External Integrations
  integrations: {
    zoom: {
      apiKey: process.env.ZOOM_API_KEY || '',
      apiSecret: process.env.ZOOM_API_SECRET || '',
      webhookSecret: process.env.ZOOM_WEBHOOK_SECRET || '',
    },
    googleCalendar: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    },
    slack: {
      botToken: process.env.SLACK_BOT_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    },
  },

  // Monitoring and Logging
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'json',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    alerting: {
      webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
      slackChannel: process.env.ALERT_SLACK_CHANNEL || '#alerts',
      emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
    },
  },

  // Performance Configuration
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6'),
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || '3600'), // 1 hour
    enableCDN: process.env.ENABLE_CDN === 'true',
    cdnUrl: process.env.CDN_URL || '',
  },

  // Job Market Configuration
  jobMarket: {
    updateInterval: parseInt(process.env.JOB_MARKET_UPDATE_INTERVAL || '86400000'), // 24 hours
    apiEndpoints: {
      linkedIn: process.env.LINKEDIN_API_ENDPOINT || '',
      indeed: process.env.INDEED_API_ENDPOINT || '',
      glassdoor: process.env.GLASSDOOR_API_ENDPOINT || '',
    },
    apiKeys: {
      linkedIn: process.env.LINKEDIN_API_KEY || '',
      indeed: process.env.INDEED_API_KEY || '',
      glassdoor: process.env.GLASSDOOR_API_KEY || '',
    },
    cacheDuration: parseInt(process.env.JOB_MARKET_CACHE_DURATION || '3600000'), // 1 hour
  },

  // Email Configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp', 'sendgrid', 'ses'
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@alam-lms.com',
    templates: {
      path: process.env.EMAIL_TEMPLATES_PATH || './templates/emails',
    },
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    destination: process.env.BACKUP_DESTINATION || 's3',
    encryption: process.env.BACKUP_ENCRYPTION === 'true',
  },

  // Feature Flags
  features: {
    enableJobMarketMapping: process.env.FEATURE_JOB_MARKET_MAPPING !== 'false',
    enableEmotionDetection: process.env.FEATURE_EMOTION_DETECTION !== 'false',
    enableSpacedRepetition: process.env.FEATURE_SPACED_REPETITION !== 'false',
    enableMicrolearning: process.env.FEATURE_MICROLEARNING !== 'false',
    enableRealTimeAnalytics: process.env.FEATURE_REAL_TIME_ANALYTICS !== 'false',
    enableExternalIntegrations: process.env.FEATURE_EXTERNAL_INTEGRATIONS !== 'false',
  },

  // Application Configuration
  app: {
    name: process.env.APP_NAME || 'Alam LMS',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    baseUrl: process.env.BASE_URL || 'https://alam-lms.com',
    timezone: process.env.TIMEZONE || 'UTC',
  },
};

export default ProductionConfig;
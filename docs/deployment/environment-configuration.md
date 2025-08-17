# Environment Configuration Guide

## Overview

This guide covers environment variable management, configuration best practices, and security measures for different deployment environments of the Taxomind application.

## Environment Structure

### Environment Hierarchy
```
environments/
├── development/
│   ├── .env.local
│   ├── .env.development
│   └── docker-compose.dev.yml
├── staging/
│   ├── .env.staging
│   ├── secrets.encrypted
│   └── config.staging.json
├── production/
│   ├── .env.production
│   ├── secrets.encrypted
│   └── config.production.json
└── shared/
    ├── .env.defaults
    └── config.schema.json
```

## Core Environment Variables

### Application Configuration (REQUIRED)
```env
# Node Environment (CRITICAL - controls security features)
NODE_ENV=production|staging|development

# Application URLs (REQUIRED)
NEXT_PUBLIC_APP_URL=https://app.taxomind.com
NEXTAUTH_URL=https://app.taxomind.com

# Application Settings
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

# Enterprise Security Features (REQUIRED in production/staging)
STRICT_ENV_MODE=true         # Enables production data protection
BLOCK_CROSS_ENV=true         # Prevents cross-environment operations
AUDIT_ENABLED=true           # Enables audit logging for EnterpriseDB

# Feature Flags
ENABLE_DEBUG_LOGGING=false
ENABLE_EXPERIMENTAL_FEATURES=false
ENABLE_MAINTENANCE_MODE=false
DISABLE_REDIS=false          # Set to true only in development
```

### Database Configuration
```env
# Primary Database (REQUIRED)
# Development: Port 5433 (Docker), Production: Standard port 5432
DATABASE_URL="postgresql://user:password@host:5433/database?schema=public&sslmode=require"

# Connection Pool Settings (Prisma)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=50         # Increased for production
DATABASE_POOL_TIMEOUT=10000
DATABASE_CONNECTION_LIMIT=100

# Database Safety Settings
DB_ENVIRONMENT_CHECK=true    # Validates environment before operations
DB_AUDIT_ENABLED=true        # Enables audit trails for critical operations
```

### Authentication Configuration
```env
# NextAuth.js v5 (REQUIRED - both secrets needed)
AUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_SECRET=your-32-character-secret-key-here

# TOTP/MFA Encryption (REQUIRED for MFA - exactly 64 hex characters)
ENCRYPTION_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Admin MFA Enforcement Settings
ADMIN_MFA_ENFORCEMENT_ENABLED=true
ADMIN_MFA_GRACE_PERIOD_DAYS=7
ADMIN_MFA_WARNING_PERIOD_DAYS=3
ADMIN_MFA_IMMEDIATE_ENFORCEMENT=false  # true in production

# OAuth Providers (both required if using provider)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Enterprise SSO (optional)
SAML_ENTITY_ID=https://app.taxomind.com
SAML_SSO_URL=https://idp.example.com/sso
SAML_CERTIFICATE=base64-encoded-certificate
LDAP_URL=ldap://ldap.example.com:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=ldap-password
```

### External Services
```env
# Redis Cache
REDIS_URL=redis://default:password@localhost:6379
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# File Storage (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-preset

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OPENAI_ORG_ID=org-your-org-id
AI_MODEL_VERSION=gpt-4

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@taxomind.com
```

### Monitoring and Analytics
```env
# Error Tracking
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=2.0.0

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token
AMPLITUDE_API_KEY=your-amplitude-key

# Performance Monitoring
NEW_RELIC_APP_NAME=taxomind-production
NEW_RELIC_LICENSE_KEY=your-license-key
DATADOG_API_KEY=your-datadog-key
```

## Environment-Specific Configurations

### Development Environment
```typescript
// config/development.ts
export const developmentConfig = {
  database: {
    host: 'localhost',
    port: 5433, // Non-standard port to avoid conflicts
    ssl: false,
    logging: true,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    tls: false,
  },
  features: {
    debugMode: true,
    hotReload: true,
    verboseLogging: true,
    mockExternalServices: true,
  },
  security: {
    strictMode: false,
    rateLimiting: false,
    corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  },
};
```

### Staging Environment
```typescript
// config/staging.ts
export const stagingConfig = {
  database: {
    host: 'staging-db.taxomind.internal',
    port: 5432,
    ssl: true,
    logging: false,
    poolSize: 20,
  },
  redis: {
    host: 'staging-redis.taxomind.internal',
    port: 6379,
    tls: true,
    password: process.env.REDIS_PASSWORD,
  },
  features: {
    debugMode: true,
    experimentalFeatures: true,
    betaFeatures: true,
  },
  security: {
    strictMode: true,
    rateLimiting: true,
    corsOrigins: ['https://staging.taxomind.com'],
  },
};
```

### Production Environment
```typescript
// config/production.ts
export const productionConfig = {
  database: {
    host: process.env.DB_HOST,
    port: 5432,
    ssl: { rejectUnauthorized: true },
    logging: false,
    poolSize: 50,
    statementTimeout: 30000,
  },
  redis: {
    cluster: true,
    nodes: process.env.REDIS_NODES?.split(',') || [],
    tls: { rejectUnauthorized: true },
    password: process.env.REDIS_PASSWORD,
  },
  features: {
    debugMode: false,
    experimentalFeatures: false,
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  },
  security: {
    strictMode: true,
    rateLimiting: true,
    corsOrigins: ['https://app.taxomind.com'],
    contentSecurityPolicy: true,
  },
};
```

## Configuration Management

### Configuration Loader
```typescript
// lib/config/index.ts
import { developmentConfig } from './development';
import { stagingConfig } from './staging';
import { productionConfig } from './production';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: any;
  
  private constructor() {
    this.loadConfiguration();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  private loadConfiguration() {
    const environment = process.env.NODE_ENV || 'development';
    
    switch (environment) {
      case 'production':
        this.config = productionConfig;
        break;
      case 'staging':
        this.config = stagingConfig;
        break;
      default:
        this.config = developmentConfig;
    }
    
    // Merge with environment variables
    this.mergeWithEnv();
    
    // Validate configuration
    this.validateConfig();
  }
  
  private mergeWithEnv() {
    // Override with environment variables
    if (process.env.DATABASE_URL) {
      this.config.database.connectionString = process.env.DATABASE_URL;
    }
    
    if (process.env.REDIS_URL) {
      this.config.redis.url = process.env.REDIS_URL;
    }
  }
  
  private validateConfig() {
    const required = [
      'database.connectionString',
      'redis.url',
      'security.strictMode',
    ];
    
    for (const path of required) {
      const value = this.getNestedValue(this.config, path);
      if (value === undefined) {
        throw new Error(`Missing required configuration: ${path}`);
      }
    }
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }
  
  get<T>(path: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, path);
    return value !== undefined ? value : defaultValue;
  }
}

export const config = ConfigManager.getInstance();
```

### Environment Validation
```typescript
// lib/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required variables
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // Optional with defaults
  PORT: z.string().default('3000'),
  STRICT_ENV_MODE: z.string().default('false'),
  ENABLE_AUDIT_LOG: z.string().default('false'),
  
  // External services
  REDIS_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  
  // Feature flags
  ENABLE_EXPERIMENTAL_FEATURES: z.string().default('false'),
  ENABLE_MAINTENANCE_MODE: z.string().default('false'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.issues.forEach((issue) => {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    return { success: false, error };
  }
}

// Run validation on startup
const validation = validateEnv();
if (!validation.success) {
  console.error('Invalid environment configuration');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
```

## Secrets Management

### Local Development Secrets
```bash
# .env.local (never commit)
DATABASE_URL=postgresql://dev:devpass@localhost:5433/taxomind_dev
NEXTAUTH_SECRET=dev-secret-key-for-local-development-only
OPENAI_API_KEY=sk-dev-key
```

### Production Secrets with AWS Secrets Manager
```typescript
// lib/secrets-manager.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, { value: string; expires: number }> = new Map();
  
  constructor() {
    this.client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }
  
  async getSecret(secretName: string): Promise<string> {
    // Check cache
    const cached = this.cache.get(secretName);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      
      const value = response.SecretString || '';
      
      // Cache for 5 minutes
      this.cache.set(secretName, {
        value,
        expires: Date.now() + 5 * 60 * 1000,
      });
      
      return value;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw error;
    }
  }
  
  async getJsonSecret<T>(secretName: string): Promise<T> {
    const secretString = await this.getSecret(secretName);
    return JSON.parse(secretString) as T;
  }
}

export const secretsManager = new SecretsManager();

// Usage
const dbConfig = await secretsManager.getJsonSecret<{
  host: string;
  user: string;
  password: string;
}>('taxomind/production/database');
```

### Environment Variable Encryption
```bash
#!/bin/bash
# encrypt-env.sh

# Encrypt .env file
openssl enc -aes-256-cbc -salt -in .env.production -out .env.production.enc -k $ENCRYPTION_KEY

# Decrypt .env file
openssl enc -aes-256-cbc -d -in .env.production.enc -out .env.production -k $ENCRYPTION_KEY
```

## Docker Environment Configuration

### Docker Compose Environment
```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    image: taxomind:latest
    env_file:
      - .env.${ENVIRONMENT:-development}
    environment:
      - NODE_ENV=${ENVIRONMENT:-development}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    secrets:
      - db_password
      - jwt_secret
      
secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

### Dockerfile ARG and ENV
```dockerfile
# Dockerfile
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF

ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.environment=$NODE_ENV
```

## CI/CD Environment Management

### GitHub Actions Secrets
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Set up environment
        run: |
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> $GITHUB_ENV
          echo "NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}" >> $GITHUB_ENV
          echo "REDIS_URL=${{ secrets.REDIS_URL }}" >> $GITHUB_ENV
      
      - name: Deploy
        run: |
          npm run deploy:production
```

### Environment-Specific Deployments
```typescript
// scripts/deploy.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deploy() {
  const environment = process.argv[2] || 'staging';
  
  console.log(`Deploying to ${environment}...`);
  
  // Load environment-specific configuration
  const envFile = `.env.${environment}`;
  require('dotenv').config({ path: envFile });
  
  // Validate environment
  const validation = validateEnv();
  if (!validation.success) {
    throw new Error('Invalid environment configuration');
  }
  
  // Build application
  await execAsync('npm run build');
  
  // Deploy based on environment
  switch (environment) {
    case 'production':
      await deployProduction();
      break;
    case 'staging':
      await deployStaging();
      break;
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
}

async function deployProduction() {
  // Production deployment logic
  await execAsync('aws ecs update-service --cluster production --service taxomind --force-new-deployment');
}

async function deployStaging() {
  // Staging deployment logic
  await execAsync('vercel --prod --env-file .env.staging');
}

deploy().catch(console.error);
```

## Runtime Configuration

### Dynamic Configuration Loading
```typescript
// app/api/config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Public configuration that can be exposed to client
  const publicConfig = {
    environment: process.env.NODE_ENV,
    features: {
      experimentalFeatures: process.env.ENABLE_EXPERIMENTAL_FEATURES === 'true',
      maintenanceMode: process.env.ENABLE_MAINTENANCE_MODE === 'true',
    },
    api: {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL,
      timeout: 30000,
    },
    auth: {
      providers: ['google', 'github', 'credentials'],
      sessionTimeout: 3600,
    },
  };
  
  return NextResponse.json(publicConfig);
}
```

### Feature Flags
```typescript
// lib/feature-flags.ts
export class FeatureFlags {
  private static flags: Map<string, boolean> = new Map();
  
  static initialize() {
    // Load from environment
    this.flags.set('experimentalAI', process.env.ENABLE_EXPERIMENTAL_AI === 'true');
    this.flags.set('betaFeatures', process.env.ENABLE_BETA_FEATURES === 'true');
    this.flags.set('debugMode', process.env.ENABLE_DEBUG_MODE === 'true');
    
    // Load from database (optional)
    this.loadFromDatabase();
  }
  
  static async loadFromDatabase() {
    try {
      const flags = await prisma.featureFlag.findMany({
        where: { enabled: true },
      });
      
      flags.forEach((flag) => {
        this.flags.set(flag.name, flag.enabled);
      });
    } catch (error) {
      console.error('Failed to load feature flags from database:', error);
    }
  }
  
  static isEnabled(flagName: string): boolean {
    return this.flags.get(flagName) || false;
  }
  
  static async toggle(flagName: string, enabled: boolean) {
    this.flags.set(flagName, enabled);
    
    // Persist to database
    await prisma.featureFlag.upsert({
      where: { name: flagName },
      update: { enabled },
      create: { name: flagName, enabled },
    });
  }
}
```

## Security Best Practices

### 1. Never Commit Secrets
```gitignore
# .gitignore
.env
.env.*
!.env.example
secrets/
*.key
*.pem
*.crt
```

### 2. Use Environment Variable Prefixes
```typescript
// Separate public and private variables
NEXT_PUBLIC_* // Can be exposed to client
PRIVATE_*     // Server-side only
SECRET_*      // Sensitive data
```

### 3. Validate at Runtime
```typescript
// Fail fast on missing configuration
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
```

### 4. Rotate Secrets Regularly
```bash
# Rotate secrets script
#!/bin/bash
NEW_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEW_SECRET" > .env.new
kubectl create secret generic app-secrets --from-env-file=.env.new --dry-run=client -o yaml | kubectl apply -f -
```

### 5. Use Least Privilege
```env
# Production database user with limited permissions
DATABASE_URL=postgresql://app_user:password@host/db
# Not root or admin user
```

## Troubleshooting

### Common Issues

#### Missing Environment Variables
```typescript
// Debug helper
function debugEnv() {
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    console.error('Current environment:', process.env.NODE_ENV);
  }
}
```

#### Environment Mismatch
```bash
# Verify environment
echo "Current environment: $NODE_ENV"
echo "Database host: $(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/')"
echo "Redis host: $(echo $REDIS_URL | sed 's/.*@\(.*\):.*/\1/')"
```

#### Secret Loading Failures
```typescript
// Fallback mechanism
async function getConfigValue(key: string): Promise<string> {
  // Try environment variable first
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Try secrets manager
  try {
    return await secretsManager.getSecret(key);
  } catch (error) {
    // Fallback to default
    return getDefaultValue(key);
  }
}
```

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Configuration Management System*
# SAM AI Tutor Deployment Guide

## Overview

This guide covers the deployment of the SAM AI Tutor system to production environments, including setup, configuration, monitoring, and maintenance procedures.

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- Redis (for caching and rate limiting)
- SSL certificates for HTTPS
- Domain name and DNS configuration
- CI/CD pipeline setup

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file with the following configuration:

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key
STRICT_ENV_MODE=true

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_SIZE=10
DATABASE_SSL=true

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
AI_RATE_LIMIT_REQUESTS=1000
AI_RATE_LIMIT_WINDOW=3600

# Redis
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=your-redis-password

# Security
CSRF_SECRET=your-csrf-secret
SESSION_SECRET=your-session-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-api-key
LOG_LEVEL=info

# CDN and Assets
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CDN_URL=https://cdn.your-domain.com

# Email
EMAIL_SERVER_HOST=smtp.your-email-provider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@domain.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@your-domain.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_GAMIFICATION=true
ENABLE_AI_TUTOR=true
ENABLE_TEACHER_DASHBOARD=true
```

### 2. Database Setup

#### Production Database Configuration

```sql
-- Create production database
CREATE DATABASE taxomind_production;

-- Create user with limited privileges
CREATE USER taxomind_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE taxomind_production TO taxomind_user;
GRANT USAGE ON SCHEMA public TO taxomind_user;
GRANT CREATE ON SCHEMA public TO taxomind_user;

-- Configure connection limits
ALTER USER taxomind_user CONNECTION LIMIT 50;
```

#### Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (if needed)
npm run seed:production
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Key configurations:
# maxmemory 1gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000
# requirepass your-redis-password

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=taxomind_production
      - POSTGRES_USER=taxomind_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taxomind_user -d taxomind_production"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. Nginx Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types
            application/json
            application/javascript
            text/css
            text/javascript
            text/xml
            text/plain;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /_next/static/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # All other routes
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Kubernetes Deployment

### 1. Deployment Configuration

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sam-ai-tutor
  labels:
    app: sam-ai-tutor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sam-ai-tutor
  template:
    metadata:
      labels:
        app: sam-ai-tutor
    spec:
      containers:
      - name: app
        image: your-registry/sam-ai-tutor:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: sam-ai-tutor-service
spec:
  selector:
    app: sam-ai-tutor
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 2. Secrets Configuration

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
  openai-api-key: <base64-encoded-openai-key>
  anthropic-api-key: <base64-encoded-anthropic-key>
  nextauth-secret: <base64-encoded-nextauth-secret>
```

### 3. ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  ENABLE_ANALYTICS: "true"
  ENABLE_GAMIFICATION: "true"
  ENABLE_AI_TUTOR: "true"
```

## CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Registry
      uses: docker/login-action@v2
      with:
        registry: your-registry.com
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: your-registry.com/sam-ai-tutor:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/sam-ai-tutor app=your-registry.com/sam-ai-tutor:latest
        kubectl rollout status deployment/sam-ai-tutor
```

### 2. Health Check Endpoint

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    // Check AI services
    const aiStatus = await Promise.all([
      checkOpenAIStatus(),
      checkAnthropicStatus()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        openai: aiStatus[0] ? 'healthy' : 'degraded',
        anthropic: aiStatus[1] ? 'healthy' : 'degraded'
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

async function checkOpenAIStatus(): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkAnthropicStatus(): Promise<boolean> {
  try {
    // Implement Anthropic health check
    return true;
  } catch {
    return false;
  }
}
```

## Monitoring and Observability

### 1. Application Metrics

```typescript
// lib/metrics.ts
import { createPrometheusMetrics } from '@prometheus/client';

export const metrics = {
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  aiRequestDuration: new Histogram({
    name: 'ai_request_duration_seconds',
    help: 'Duration of AI requests in seconds',
    labelNames: ['provider', 'model', 'status']
  }),
  
  activeUsers: new Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
  }),
  
  databaseConnections: new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections'
  })
};

// Middleware to collect metrics
export function metricsMiddleware(req: NextApiRequest, res: NextApiResponse, next: Function) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    metrics.httpRequestDuration.observe(
      { method: req.method, route: req.url, status_code: res.statusCode },
      duration
    );
  });
  
  next();
}
```

### 2. Logging Configuration

```typescript
// lib/logger.ts
import winston from 'winston';
import { format } from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'sam-ai-tutor' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.simple()
  }));
}

export default logger;
```

### 3. Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.headers?.authorization;
      delete event.request.headers?.cookie;
    }
    return event;
  }
});

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: 'sam-ai-tutor'
    }
  });
}
```

## Security Considerations

### 1. Environment Security

```bash
# Set proper file permissions
chmod 600 .env.production
chown app:app .env.production

# Use secrets management
kubectl create secret generic app-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=openai-api-key="$OPENAI_API_KEY"
```

### 2. Network Security

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sam-ai-tutor-network-policy
spec:
  podSelector:
    matchLabels:
      app: sam-ai-tutor
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: nginx-ingress
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  - to: []
    ports:
    - protocol: TCP
      port: 443
```

### 3. API Security

```typescript
// middleware/security.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { NextApiRequest, NextApiResponse } from 'next';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    }
  }),
  
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  })
];
```

## Backup and Recovery

### 1. Database Backup

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
BACKUP_FILE="$BACKUP_DIR/taxomind_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

### 2. Application Data Backup

```bash
#!/bin/bash
# scripts/backup-app-data.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/app-data"

# Backup uploaded files
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /app/uploads/

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /app/config/

# Upload to S3
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/app-data/

echo "Application data backup completed"
```

### 3. Disaster Recovery

```bash
#!/bin/bash
# scripts/restore-from-backup.sh

BACKUP_DATE=$1
BACKUP_BUCKET="your-backup-bucket"

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: $0 <backup_date>"
  exit 1
fi

# Download database backup
aws s3 cp "s3://$BACKUP_BUCKET/database/taxomind_backup_$BACKUP_DATE.sql.gz" /tmp/

# Restore database
gunzip /tmp/taxomind_backup_$BACKUP_DATE.sql.gz
psql $DATABASE_URL < /tmp/taxomind_backup_$BACKUP_DATE.sql

# Download and restore app data
aws s3 cp "s3://$BACKUP_BUCKET/app-data/files_$BACKUP_DATE.tar.gz" /tmp/
tar -xzf /tmp/files_$BACKUP_DATE.tar.gz -C /

echo "Restore completed for backup date: $BACKUP_DATE"
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_user_id ON conversations(user_id);
CREATE INDEX CONCURRENTLY idx_course_id ON assessments(course_id);
CREATE INDEX CONCURRENTLY idx_created_at ON user_sessions(created_at);

-- Optimize database settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### 2. Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  static async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage in API routes
export async function getCachedUserData(userId: string) {
  const cacheKey = `user:${userId}`;
  let userData = await CacheService.get(cacheKey);
  
  if (!userData) {
    userData = await fetchUserFromDatabase(userId);
    await CacheService.set(cacheKey, userData, 1800); // 30 minutes
  }
  
  return userData;
}
```

### 3. CDN Configuration

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/your-cloud-name/'
  },
  
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

## Maintenance Procedures

### 1. Database Maintenance

```bash
#!/bin/bash
# scripts/db-maintenance.sh

# Vacuum and analyze database
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Reindex tables
psql $DATABASE_URL -c "REINDEX DATABASE taxomind_production;"

# Update statistics
psql $DATABASE_URL -c "ANALYZE;"

# Check for long-running queries
psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

### 2. Log Rotation

```bash
# /etc/logrotate.d/sam-ai-tutor
/var/log/sam-ai-tutor/*.log {
  daily
  rotate 30
  compress
  delaycompress
  missingok
  notifempty
  create 644 app app
  postrotate
    systemctl reload sam-ai-tutor
  endscript
}
```

### 3. Update Procedures

```bash
#!/bin/bash
# scripts/update-application.sh

# Create backup before update
./scripts/backup-database.sh
./scripts/backup-app-data.sh

# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart services
systemctl restart sam-ai-tutor
systemctl restart nginx

# Health check
curl -f http://localhost:3000/api/health

echo "Application updated successfully"
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT version();"
   
   # Check connection pool
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Check Redis memory usage
   redis-cli info memory
   ```

3. **AI Service Issues**
   ```bash
   # Check API key validity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

### Monitoring Commands

```bash
# Check application logs
tail -f /var/log/sam-ai-tutor/app.log

# Monitor resource usage
htop

# Check disk usage
df -h

# Monitor network connections
netstat -tulpn | grep :3000
```

---

*Last updated: July 2025*
*Version: 1.0.0*
*Deployment Guide: SAM AI Tutor System*
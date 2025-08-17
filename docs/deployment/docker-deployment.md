# Docker Deployment Guide

## Overview

This guide covers containerizing and deploying the Taxomind application using Docker and Docker Compose for various environments.

## Docker Architecture

### Container Structure
```
taxomind-deployment/
├── app (Next.js application)
├── postgres (PostgreSQL database)
├── redis (Redis cache)
├── nginx (Reverse proxy)
└── monitoring (Prometheus/Grafana)
```

## Prerequisites

### System Requirements
- Docker Engine 20.10.0+
- Docker Compose 2.0.0+
- 8GB RAM minimum
- 20GB available disk space

### Installation
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Dockerfile Configuration

### Multi-Stage Production Dockerfile
```dockerfile
# Dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production
RUN npx prisma generate

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/cache ./.next/cache

# Copy prisma schema and migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Set runtime environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Run as non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

### Development Dockerfile
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

# Install development tools
RUN apk add --no-cache \
    git \
    bash \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm install
RUN npx prisma generate

# Copy application code
COPY . .

# Expose ports
EXPOSE 3000 5555

# Development command
CMD ["npm", "run", "dev"]
```

## Docker Compose Configuration

### Production Docker Compose
```yaml
# docker-compose.yml
version: '3.9'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    image: taxomind:latest
    container_name: taxomind-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - taxomind-network
    volumes:
      - uploads:/app/uploads
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: taxomind-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: taxomind
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=en_US.utf8 --lc-ctype=en_US.utf8"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - taxomind-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d taxomind"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: taxomind-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - taxomind-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: taxomind-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
      - nginx-cache:/var/cache/nginx
    depends_on:
      - app
    networks:
      - taxomind-network

  # Backup Service
  backup:
    image: postgres:15-alpine
    container_name: taxomind-backup
    environment:
      PGPASSWORD: ${DB_PASSWORD}
    volumes:
      - ./backups:/backups
    command: >
      sh -c "while true; do
        pg_dump -h postgres -U ${DB_USER} -d taxomind -f /backups/backup_$$(date +%Y%m%d_%H%M%S).sql
        find /backups -type f -mtime +7 -delete
        sleep 86400
      done"
    depends_on:
      - postgres
    networks:
      - taxomind-network

networks:
  taxomind-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres-data:
  redis-data:
  uploads:
  nginx-cache:
```

### Development Docker Compose
```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: taxomind-app-dev
    ports:
      - "3000:3000"
      - "5555:5555"  # Prisma Studio
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://taxomind:localpassword@postgres:5432/taxomind_dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - postgres
      - redis
    command: npm run dev

  postgres:
    image: postgres:15-alpine
    container_name: taxomind-postgres-dev
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: taxomind
      POSTGRES_PASSWORD: localpassword
      POSTGRES_DB: taxomind_dev
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: taxomind-redis-dev
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  mailhog:
    image: mailhog/mailhog
    container_name: taxomind-mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres-dev-data:
```

## Nginx Configuration

### nginx.conf
```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Site Configuration
```nginx
# nginx/conf.d/taxomind.conf
upstream taxomind_backend {
    least_conn;
    server app:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://taxomind_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://taxomind_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        proxy_pass http://taxomind_backend;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://taxomind_backend/api/health;
    }
}
```

## Deployment Commands

### Build and Deploy
```bash
# Build Docker image
docker build -t taxomind:latest .

# Tag for registry
docker tag taxomind:latest registry.taxomind.com/taxomind:latest

# Push to registry
docker push registry.taxomind.com/taxomind:latest

# Deploy with Docker Compose
docker-compose up -d

# Scale application
docker-compose up -d --scale app=3

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Access database
docker-compose exec postgres psql -U taxomind -d taxomind

# Backup database
docker-compose exec postgres pg_dump -U taxomind taxomind > backup.sql

# Restore database
docker-compose exec -T postgres psql -U taxomind taxomind < backup.sql
```

## Docker Swarm Deployment

### Initialize Swarm
```bash
# Initialize swarm on manager node
docker swarm init --advertise-addr <MANAGER-IP>

# Join worker nodes
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Deploy stack
docker stack deploy -c docker-compose.yml taxomind

# List services
docker service ls

# Scale service
docker service scale taxomind_app=5

# Update service
docker service update --image taxomind:new-version taxomind_app

# Remove stack
docker stack rm taxomind
```

### Swarm Configuration
```yaml
# docker-compose.swarm.yml
version: '3.9'

services:
  app:
    image: registry.taxomind.com/taxomind:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
          - node.labels.app == true
    networks:
      - taxomind-overlay
    secrets:
      - db_password
      - jwt_secret

  postgres:
    image: postgres:15-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
          - node.labels.db == true
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - taxomind-overlay
    secrets:
      - db_password

networks:
  taxomind-overlay:
    driver: overlay
    attachable: true

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true

volumes:
  postgres-data:
    driver: local
```

## Container Security

### Security Best Practices
```dockerfile
# Secure Dockerfile practices
FROM node:18-alpine AS runner

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership
COPY --chown=nextjs:nodejs . .

# Drop capabilities
RUN apk add --no-cache libcap && \
    setcap -r /usr/local/bin/node

# Use non-root user
USER nextjs

# Read-only root filesystem
RUN chmod -R 755 /app

# No new privileges
SECURITY --no-new-privileges
```

### Security Scanning
```bash
# Scan image for vulnerabilities
docker scan taxomind:latest

# Use Trivy for comprehensive scanning
trivy image taxomind:latest

# Check for secrets
docker run --rm -v "$PWD":/path trufflesecurity/trufflehog:latest filesystem /path

# Runtime security with Falco
docker run -d --name falco \
  --privileged \
  -v /var/run/docker.sock:/host/var/run/docker.sock \
  -v /dev:/host/dev \
  -v /proc:/host/proc:ro \
  -v /boot:/host/boot:ro \
  -v /lib/modules:/host/lib/modules:ro \
  -v /usr:/host/usr:ro \
  falcosecurity/falco:latest
```

## Monitoring and Logging

### Docker Monitoring Stack
```yaml
# monitoring/docker-compose.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

  node-exporter:
    image: prom/node-exporter
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

volumes:
  prometheus-data:
  grafana-data:
```

### Logging Configuration
```yaml
# Logging with ELK Stack
version: '3.9'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elastic-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: '["http://elasticsearch:9200"]'
    depends_on:
      - elasticsearch

volumes:
  elastic-data:
```

## Performance Optimization

### Docker Performance Tuning
```bash
# Optimize build cache
docker buildx build \
  --cache-from type=registry,ref=registry.taxomind.com/cache \
  --cache-to type=registry,ref=registry.taxomind.com/cache,mode=max \
  -t taxomind:latest .

# Multi-platform builds
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t taxomind:latest .

# Resource limits
docker run -d \
  --name taxomind \
  --memory="2g" \
  --memory-swap="2g" \
  --cpu-shares=1024 \
  --cpus="2" \
  taxomind:latest
```

### Container Optimization
```dockerfile
# Optimized Dockerfile
FROM node:18-alpine AS builder
# ... build stages ...

FROM gcr.io/distroless/nodejs18-debian11
COPY --from=builder /app/dist /app
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app
EXPOSE 3000
CMD ["server.js"]
```

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# docker-backup.sh

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T postgres pg_dump -U taxomind taxomind | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Backup volumes
docker run --rm \
  -v taxomind_uploads:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/uploads_$TIMESTAMP.tar.gz -C /data .

# Backup configuration
docker-compose config > "$BACKUP_DIR/config_$TIMESTAMP.yml"

# Clean old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

### Recovery Procedures
```bash
#!/bin/bash
# docker-restore.sh

# Stop services
docker-compose down

# Restore database
gunzip < /backups/db_latest.sql.gz | docker-compose exec -T postgres psql -U taxomind taxomind

# Restore volumes
docker run --rm \
  -v taxomind_uploads:/data \
  -v /backups:/backup \
  alpine tar xzf /backup/uploads_latest.tar.gz -C /data

# Start services
docker-compose up -d

echo "Restoration completed"
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs taxomind-app

# Inspect container
docker inspect taxomind-app

# Check resource usage
docker stats

# Debug interactively
docker run -it --rm taxomind:latest sh
```

#### Network Issues
```bash
# List networks
docker network ls

# Inspect network
docker network inspect taxomind-network

# Test connectivity
docker exec taxomind-app ping postgres

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

#### Performance Issues
```bash
# Check resource limits
docker stats --no-stream

# Analyze container performance
docker exec taxomind-app top

# Check disk usage
docker system df

# Clean up
docker system prune -a
```

## Best Practices

### 1. Image Optimization
- Use multi-stage builds
- Minimize layers
- Use Alpine Linux when possible
- Remove unnecessary files
- Don't run as root

### 2. Security
- Scan images regularly
- Use secrets management
- Implement network policies
- Enable read-only root filesystem
- Drop unnecessary capabilities

### 3. Monitoring
- Implement health checks
- Collect metrics
- Centralize logging
- Set up alerting
- Monitor resource usage

### 4. Deployment
- Use orchestration for production
- Implement rolling updates
- Maintain version tags
- Automate deployments
- Document everything

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Container Runtime: Docker 20.10+*
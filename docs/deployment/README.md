# Taxomind Deployment Documentation

## Overview

This directory contains comprehensive deployment guides for the Taxomind Learning Management System, an enterprise-grade Next.js 15 application with AI-powered features and robust security.

## Documentation Structure

### Core Deployment Guides

1. **[deployment-overview.md](./deployment-overview.md)**
   - High-level architecture overview
   - Technology stack (Next.js 15, PostgreSQL, Prisma, NextAuth.js v5)
   - Deployment strategies (Blue-Green, Rolling, Canary)
   - Infrastructure architecture and security layers
   - Monitoring and observability setup

2. **[local-development-setup.md](./local-development-setup.md)**
   - Complete local development environment setup
   - Docker PostgreSQL configuration (port 5433)
   - Environment variable configuration
   - Development workflow and best practices
   - Troubleshooting common issues

3. **[staging-deployment.md](./staging-deployment.md)**
   - Staging environment deployment procedures
   - Pre-production testing requirements
   - Enterprise security features (STRICT_ENV_MODE)
   - Validation and testing commands
   - Rollback procedures

4. **[production-deployment.md](./production-deployment.md)**
   - Production deployment with enterprise security
   - Change Advisory Board (CAB) approval process
   - Zero-downtime deployment strategies
   - Comprehensive validation and monitoring
   - Emergency procedures and rollback plans

5. **[environment-configuration.md](./environment-configuration.md)**
   - Complete environment variable reference
   - Security configuration (MFA, encryption)
   - Service integrations (AI, Redis, Cloudinary)
   - Environment-specific settings
   - Secret management best practices

6. **[database-migration-guide.md](./database-migration-guide.md)**
   - Prisma ORM migration procedures
   - Zero-downtime migration strategies
   - Performance optimization techniques
   - Backup and rollback procedures
   - Migration testing and validation

### Platform-Specific Deployment Guides

- **[vercel-deployment.md](./vercel-deployment.md)** - Vercel platform deployment
- **[aws-deployment.md](./aws-deployment.md)** - AWS infrastructure deployment
- **[docker-deployment.md](./docker-deployment.md)** - Docker containerization

## Quick Start

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/taxomind/taxomind.git
cd taxomind

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Start PostgreSQL (Docker)
npm run dev:docker:start

# 4. Setup database
npm run dev:setup

# 5. Start development server
npm run dev
```

### Staging Deployment

```bash
# 1. Validate environment
npm run validate:env:staging

# 2. Run tests
npm run test:ci

# 3. Deploy to staging
npm run enterprise:deploy:staging
```

### Production Deployment

```bash
# 1. Complete validation
npm run enterprise:validate

# 2. Security audit
npm run security:audit

# 3. Deploy to production
npm run enterprise:deploy:production

# 4. Verify deployment
npm run enterprise:health
```

## Key Technologies

- **Framework**: Next.js 15.3.5 with App Router
- **Database**: PostgreSQL 15 with Prisma ORM 6.13.0
- **Authentication**: NextAuth.js v5 beta
- **Caching**: Redis/Upstash
- **AI Services**: OpenAI GPT-4, Anthropic Claude
- **Monitoring**: Sentry, OpenTelemetry
- **Security**: MFA/TOTP, CSP headers, rate limiting

## Environment Requirements

### Minimum Requirements
- Node.js 18.17.0+
- PostgreSQL 15+
- Redis (production)
- 4GB RAM minimum
- 20GB disk space

### Production Requirements
- High-availability PostgreSQL cluster
- Redis cluster for caching
- CDN for static assets
- SSL/TLS certificates
- Monitoring infrastructure

## Security Features

### Enterprise Security
- **STRICT_ENV_MODE**: Production data protection
- **BLOCK_CROSS_ENV**: Prevents cross-environment operations
- **AUDIT_ENABLED**: Comprehensive audit logging
- **MFA Enforcement**: Required for admin users
- **Encryption**: TOTP secrets and sensitive data

### Authentication
- Multi-provider OAuth (Google, GitHub)
- Enterprise SSO support (SAML, LDAP, OIDC)
- Session fingerprinting
- Device trust management

## Critical Scripts

### Validation
```bash
npm run validate:env          # Validate environment
npm run lint                  # ESLint validation (CRITICAL)
npm run typecheck            # TypeScript checking
npm run build:validate       # Build with all validations
```

### Testing
```bash
npm run test                 # Run all tests
npm run test:ci             # CI test suite
npm run test:performance    # Performance benchmarks
npm run test:integration    # Integration tests
```

### Security
```bash
npm run security:audit      # Security audit
npm run pentest            # Penetration testing
npm run compliance:check   # Compliance validation
npm run owasp:scan        # OWASP vulnerability scan
```

### Deployment
```bash
npm run enterprise:validate           # Validate deployment
npm run enterprise:deploy:staging     # Deploy to staging
npm run enterprise:deploy:production  # Deploy to production
npm run enterprise:health             # Health check
npm run enterprise:audit              # View audit logs
```

## Database Management

### Development
```bash
npm run dev:db:reset        # Reset database
npm run dev:db:seed         # Seed with test data
npm run dev:db:studio       # Open Prisma Studio
```

### Migrations
```bash
npx prisma migrate dev      # Create development migration
npx prisma migrate deploy   # Deploy to production
npx prisma migrate status   # Check migration status
```

## Monitoring and Observability

### Health Checks
- `/api/health` - Application health
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Cache health
- `/api/health/services` - External services

### Metrics Endpoints
- `/api/metrics` - Prometheus metrics
- `/api/analytics/dashboard` - Real-time analytics
- `/api/performance/report` - Performance metrics

## Troubleshooting

### Common Issues

1. **Port conflicts**: PostgreSQL uses port 5433 in development
2. **Environment variables**: Run `npm run validate:env` to check
3. **Build errors**: Always run `npm run lint` before building
4. **Database connection**: Verify Docker container is running
5. **Migration failures**: Check `npx prisma migrate status`

### Support Resources

- **Documentation**: `/docs/`
- **API Reference**: `/docs/api/`
- **Component Guide**: `/docs/components/`
- **Architecture**: `/docs/system-architecture/`

## Version Information

- **Application Version**: 1.0.0
- **Next.js**: 15.3.5
- **Prisma**: 6.13.0
- **PostgreSQL**: 15
- **Node.js**: 18.17.0+

## Contact

- **Development Team**: dev@taxomind.com
- **DevOps Team**: devops@taxomind.com
- **Security Team**: security@taxomind.com

---

*Last Updated: January 2025*
*Documentation Version: 1.0.0*
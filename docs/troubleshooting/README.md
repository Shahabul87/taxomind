# Troubleshooting Guide

This directory contains comprehensive troubleshooting documentation for the Taxomind application.

## Quick Reference

### Emergency Commands
```bash
# Check application health
npm run enterprise:health

# Validate environment
npm run validate:env

# Check build status
npm run build:validate

# View logs
npm run observability:logs

# Check database status
npm run dev:db:studio
```

### Critical Issues Checklist
1. ✅ Environment variables configured correctly
2. ✅ Database connection working
3. ✅ Redis/cache layer accessible
4. ✅ Authentication providers configured
5. ✅ SSL certificates valid
6. ✅ Rate limits not exceeded

## Documentation Index

### Development Issues
- **[Common Issues](./common-issues.md)** - Most frequently encountered problems
- **[Build Errors](./build-errors.md)** - TypeScript, ESLint, and compilation issues
- **[Development Environment](./development-troubleshooting.md)** - Local setup problems

### Runtime Issues
- **[Runtime Errors](./runtime-errors.md)** - Application runtime debugging
- **[Performance Issues](./performance-troubleshooting.md)** - Performance bottlenecks
- **[API Issues](./api-troubleshooting.md)** - API endpoint and rate limiting problems

### Infrastructure Issues
- **[Database Issues](./database-troubleshooting.md)** - Prisma and PostgreSQL problems
- **[Authentication Issues](./authentication-troubleshooting.md)** - NextAuth.js v5 and MFA problems
- **[Deployment Issues](./deployment-troubleshooting.md)** - Environment and deployment problems

## Escalation Procedures

### Level 1 - Self-Service (0-15 minutes)
- Check this troubleshooting guide
- Review application logs
- Validate environment configuration
- Run health checks

### Level 2 - Team Support (15-60 minutes)
- Create detailed issue report
- Include relevant logs and error messages
- Contact development team
- Reference runbooks in `/docs/runbooks/`

### Level 3 - Emergency Response (60+ minutes)
- Activate incident response procedures
- Contact on-call engineer
- Consider service degradation/rollback
- Follow security incident procedures if applicable

## Getting Help

1. **Check Logs First**:
   ```bash
   # Application logs
   npm run observability:logs
   
   # Build logs
   npm run build 2>&1 | tee build.log
   
   # Database logs
   docker logs taxomind-dev-db
   ```

2. **Gather Environment Info**:
   ```bash
   # System info
   node --version
   npm --version
   npx next info
   
   # Environment validation
   npm run validate:env
   ```

3. **Create Issue Report**:
   - Include error messages and stack traces
   - Describe steps to reproduce
   - Include environment information
   - Reference relevant documentation

## Monitoring and Alerting

- **Grafana Dashboards**: http://localhost:3001 (local)
- **Application Metrics**: http://localhost:3000/api/health
- **Database Monitoring**: http://localhost:3000/api/health/database
- **Cache Status**: http://localhost:3000/api/health/cache

## Related Documentation

- [Runbooks](/docs/runbooks/) - Operational procedures
- [Deployment Guides](/docs/deployment/) - Environment setup
- [API Documentation](/docs/api/) - API reference
- [Architecture Decisions](/docs/architecture/adrs/) - Technical decisions

---

**Last Updated**: January 2025  
**Maintained by**: Taxomind Engineering Team
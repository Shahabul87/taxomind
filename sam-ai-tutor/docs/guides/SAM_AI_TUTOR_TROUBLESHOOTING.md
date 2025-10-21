# SAM AI Tutor Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting steps for common issues encountered with the SAM AI Tutor system, including diagnostic procedures, solutions, and prevention strategies.

## Table of Contents

1. [Common Issues](#common-issues)
2. [AI Service Issues](#ai-service-issues)
3. [Database Issues](#database-issues)
4. [Performance Issues](#performance-issues)
5. [UI/UX Issues](#uiux-issues)
6. [Authentication Issues](#authentication-issues)
7. [Deployment Issues](#deployment-issues)
8. [Monitoring and Diagnostics](#monitoring-and-diagnostics)
9. [Emergency Procedures](#emergency-procedures)

## Common Issues

### 1. SAM AI Tutor Not Responding

**Symptoms:**
- Loading spinner shows indefinitely
- No response from AI tutor
- Error messages in console

**Diagnosis:**
```bash
# Check API endpoint health
curl -f http://localhost:3000/api/health

# Check specific SAM endpoint
curl -X POST http://localhost:3000/api/sam/enhanced-universal-assistant \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "tutorMode": "student"}'

# Check application logs
tail -f /var/log/sam-ai-tutor/app.log
```

**Solutions:**

1. **Check API Keys**
   ```bash
   # Verify OpenAI API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

   # Verify Anthropic API key
   curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/models
   ```

2. **Restart Services**
   ```bash
   # Restart application
   systemctl restart sam-ai-tutor
   
   # Or in Docker
   docker-compose restart app
   ```

3. **Check Rate Limits**
   ```typescript
   // Check rate limit status
   const response = await fetch('/api/sam/rate-limit-status');
   const { remaining, reset } = await response.json();
   ```

### 2. Slow Response Times

**Symptoms:**
- AI responses take longer than 30 seconds
- Timeout errors
- Poor user experience

**Diagnosis:**
```bash
# Check response times
curl -w "%{time_total}" -o /dev/null -s \
  -X POST http://localhost:3000/api/sam/enhanced-universal-assistant \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "tutorMode": "student"}'

# Monitor system resources
htop
iotop
```

**Solutions:**

1. **Optimize AI Requests**
   ```typescript
   // Implement request optimization
   const optimizedRequest = {
     message: userMessage,
     conversationHistory: conversationHistory.slice(-10), // Limit history
     learningContext: {
       ...context,
       // Remove unnecessary fields
     },
     maxTokens: 1000, // Limit response length
     temperature: 0.7
   };
   ```

2. **Enable Caching**
   ```typescript
   // Cache frequent responses
   const cacheKey = `response:${hash(userMessage)}`;
   let cachedResponse = await CacheService.get(cacheKey);
   
   if (!cachedResponse) {
     cachedResponse = await generateAIResponse(userMessage);
     await CacheService.set(cacheKey, cachedResponse, 3600);
   }
   ```

3. **Implement Request Queuing**
   ```typescript
   // Queue management
   import Queue from 'bull';
   
   const aiQueue = new Queue('AI requests', process.env.REDIS_URL);
   
   aiQueue.process(async (job) => {
     const { message, context } = job.data;
     return await generateAIResponse(message, context);
   });
   ```

### 3. Memory Leaks

**Symptoms:**
- Application memory usage increases over time
- Out of memory errors
- Slow performance

**Diagnosis:**
```bash
# Monitor memory usage
ps aux | grep node
free -h

# Check for memory leaks in Node.js
node --inspect server.js
```

**Solutions:**

1. **Fix Memory Leaks**
   ```typescript
   // Proper cleanup in useEffect
   useEffect(() => {
     const controller = new AbortController();
     
     const fetchData = async () => {
       try {
         const response = await fetch('/api/data', {
           signal: controller.signal
         });
         // Handle response
       } catch (error) {
         if (error.name !== 'AbortError') {
           console.error('Fetch error:', error);
         }
       }
     };
     
     fetchData();
     
     return () => {
       controller.abort();
     };
   }, []);
   ```

2. **Optimize Component Updates**
   ```typescript
   // Use React.memo and useMemo
   const OptimizedComponent = React.memo(({ data }) => {
     const processedData = useMemo(() => {
       return expensiveProcessing(data);
     }, [data]);
     
     return <div>{processedData}</div>;
   });
   ```

## AI Service Issues

### 1. OpenAI API Errors

**Common Error Codes:**
- `401`: Invalid API key
- `429`: Rate limit exceeded
- `500`: Server error
- `503`: Service unavailable

**Solutions:**

1. **Handle Rate Limits**
   ```typescript
   async function makeOpenAIRequest(payload: any, retries: number = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         const response = await openai.chat.completions.create(payload);
         return response;
       } catch (error) {
         if (error.status === 429) {
           const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
           await new Promise(resolve => setTimeout(resolve, waitTime));
           continue;
         }
         throw error;
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

2. **Implement Fallback Strategy**
   ```typescript
   async function getAIResponse(message: string, context: any) {
     try {
       // Try OpenAI first
       return await openaiService.generateResponse(message, context);
     } catch (error) {
       console.warn('OpenAI failed, trying Anthropic:', error);
       try {
         // Fallback to Anthropic
         return await anthropicService.generateResponse(message, context);
       } catch (fallbackError) {
         console.error('All AI services failed:', fallbackError);
         return {
           response: "I'm having trouble connecting to our AI services. Please try again later.",
           success: false
         };
       }
     }
   }
   ```

### 2. Token Limit Exceeded

**Symptoms:**
- Error: "This model's maximum context length is X tokens"
- Incomplete responses
- Request failures

**Solutions:**

1. **Implement Token Counting**
   ```typescript
   import { encode } from 'gpt-3-encoder';
   
   function countTokens(text: string): number {
     return encode(text).length;
   }
   
   function truncateConversation(messages: any[], maxTokens: number = 3000) {
     let totalTokens = 0;
     const truncatedMessages = [];
     
     // Start from the end and work backwards
     for (let i = messages.length - 1; i >= 0; i--) {
       const messageTokens = countTokens(messages[i].content);
       if (totalTokens + messageTokens > maxTokens) {
         break;
       }
       totalTokens += messageTokens;
       truncatedMessages.unshift(messages[i]);
     }
     
     return truncatedMessages;
   }
   ```

2. **Implement Smart Summarization**
   ```typescript
   async function summarizeConversation(messages: any[]) {
     const oldMessages = messages.slice(0, -5); // Keep last 5 messages
     const messagesToSummarize = oldMessages.map(m => m.content).join('\n');
     
     const summary = await openai.chat.completions.create({
       model: 'gpt-3.5-turbo',
       messages: [{
         role: 'system',
         content: 'Summarize the following conversation in 2-3 sentences:'
       }, {
         role: 'user',
         content: messagesToSummarize
       }],
       max_tokens: 150
     });
     
     return [{
       role: 'system',
       content: `Previous conversation summary: ${summary.choices[0].message.content}`
     }, ...messages.slice(-5)];
   }
   ```

## Database Issues

### 1. Connection Pool Exhaustion

**Symptoms:**
- "Pool is exhausted" errors
- Database connection timeouts
- Application hangs

**Diagnosis:**
```sql
-- Check active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Check connection details
SELECT pid, usename, application_name, state, query_start, query 
FROM pg_stat_activity 
WHERE state != 'idle';
```

**Solutions:**

1. **Optimize Connection Pool**
   ```typescript
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["interactiveTransactions"]
   }
   
   // lib/db.ts
   import { PrismaClient } from '@prisma/client';
   
   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined;
   };
   
   export const prisma = globalForPrisma.prisma ?? new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
     log: ['query', 'info', 'warn', 'error'],
   });
   
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```

2. **Implement Connection Cleanup**
   ```typescript
   // Ensure connections are properly closed
   async function handleRequest(req: NextApiRequest, res: NextApiResponse) {
     try {
       // Your database operations
       const data = await prisma.user.findMany();
       res.json(data);
     } catch (error) {
       console.error('Database error:', error);
       res.status(500).json({ error: 'Database error' });
     } finally {
       // Prisma handles connection cleanup automatically
     }
   }
   ```

### 2. Slow Queries

**Symptoms:**
- Long response times
- Database timeouts
- High CPU usage

**Diagnosis:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'your_table'
ORDER BY n_distinct DESC;
```

**Solutions:**

1. **Add Indexes**
   ```sql
   -- Create indexes for frequently queried columns
   CREATE INDEX CONCURRENTLY idx_user_conversations 
   ON conversations(user_id, created_at);
   
   CREATE INDEX CONCURRENTLY idx_assessment_course 
   ON assessments(course_id, status);
   
   CREATE INDEX CONCURRENTLY idx_gamification_user 
   ON user_achievements(user_id, earned_date);
   ```

2. **Optimize Prisma Queries**
   ```typescript
   // Use select to limit returned fields
   const users = await prisma.user.findMany({
     select: {
       id: true,
       name: true,
       email: true,
       // Don't select unnecessary fields
     },
     where: {
       active: true
     },
     take: 10 // Limit results
   });
   
   // Use includes carefully
   const userWithCourses = await prisma.user.findUnique({
     where: { id: userId },
     include: {
       enrollments: {
         select: {
           course: {
             select: {
               id: true,
               title: true
             }
           }
         }
       }
     }
   });
   ```

### 3. Database Migration Issues

**Symptoms:**
- Migration failures
- Schema inconsistencies
- Data corruption

**Solutions:**

1. **Backup Before Migration**
   ```bash
   # Create backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Run migration
   npx prisma migrate deploy
   
   # If migration fails, restore backup
   psql $DATABASE_URL < backup_20240718_120000.sql
   ```

2. **Handle Migration Conflicts**
   ```bash
   # Reset migration state
   npx prisma migrate reset
   
   # Resolve conflicts manually
   npx prisma db push --force-reset
   
   # Generate new migration
   npx prisma migrate dev --name fix-conflicts
   ```

## Performance Issues

### 1. Component Rendering Issues

**Symptoms:**
- Slow page loads
- UI freezing
- High memory usage in browser

**Diagnosis:**
```javascript
// Use React DevTools Profiler
// Check for unnecessary re-renders
console.log('Component rendered:', Date.now());
```

**Solutions:**

1. **Optimize React Components**
   ```typescript
   // Use React.memo for functional components
   const OptimizedComponent = React.memo(({ data, onAction }) => {
     // Memoize expensive calculations
     const processedData = useMemo(() => {
       return data.map(item => expensiveProcessing(item));
     }, [data]);
     
     // Memoize callback functions
     const handleClick = useCallback((id: string) => {
       onAction(id);
     }, [onAction]);
     
     return <div onClick={handleClick}>{processedData}</div>;
   });
   ```

2. **Implement Virtualization**
   ```typescript
   import { VirtualizedList } from '@/components/ui/performance-optimized';
   
   function LargeDataList({ items }: { items: any[] }) {
     return (
       <VirtualizedList
         items={items}
         itemHeight={60}
         containerHeight={400}
         renderItem={(item, index) => (
           <div key={item.id}>
             {item.name}
           </div>
         )}
       />
     );
   }
   ```

### 2. Bundle Size Issues

**Symptoms:**
- Large JavaScript bundles
- Slow initial page load
- High bandwidth usage

**Diagnosis:**
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check bundle analyzer
npx @next/bundle-analyzer
```

**Solutions:**

1. **Implement Code Splitting**
   ```typescript
   // Dynamic imports
   const LazyComponent = dynamic(() => import('./LazyComponent'), {
     loading: () => <LoadingSpinner />
   });
   
   // Route-based splitting
   const AssessmentPage = dynamic(() => import('./pages/assessment'), {
     ssr: false
   });
   ```

2. **Tree Shaking**
   ```typescript
   // Import only what you need
   import { Button } from '@/components/ui/button';
   // Instead of
   import * as UI from '@/components/ui';
   
   // Use specific imports for libraries
   import debounce from 'lodash/debounce';
   // Instead of
   import _ from 'lodash';
   ```

## UI/UX Issues

### 1. Loading States Not Showing

**Symptoms:**
- No feedback during loading
- Blank screens
- User confusion

**Solutions:**

1. **Implement Proper Loading States**
   ```typescript
   import { LoadingSpinner, DashboardStatsSkeleton } from '@/components/ui/loading-states';
   
   function Dashboard() {
     const [isLoading, setIsLoading] = useState(true);
     const [data, setData] = useState(null);
     
     useEffect(() => {
       fetchData().then(setData).finally(() => setIsLoading(false));
     }, []);
     
     if (isLoading) {
       return <DashboardStatsSkeleton />;
     }
     
     return <DashboardContent data={data} />;
   }
   ```

2. **Add Loading Indicators for Actions**
   ```typescript
   function ActionButton({ onAction }: { onAction: () => Promise<void> }) {
     const [isLoading, setIsLoading] = useState(false);
     
     const handleAction = async () => {
       setIsLoading(true);
       try {
         await onAction();
       } finally {
         setIsLoading(false);
       }
     };
     
     return (
       <Button onClick={handleAction} disabled={isLoading}>
         {isLoading ? <LoadingSpinner size="sm" /> : 'Action'}
       </Button>
     );
   }
   ```

### 2. Accessibility Issues

**Symptoms:**
- Screen reader incompatibility
- Keyboard navigation problems
- Poor contrast

**Solutions:**

1. **Fix Keyboard Navigation**
   ```typescript
   import { useKeyboardNavigation } from '@/components/ui/accessibility';
   
   function NavigableList({ items }: { items: any[] }) {
     const containerRef = useRef<HTMLDivElement>(null);
     const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
     
     const { activeIndex } = useKeyboardNavigation(
       containerRef,
       itemRefs.current.map(ref => ({ current: ref })),
       {
         direction: 'vertical',
         onSelect: (index) => handleItemSelect(index)
       }
     );
     
     return (
       <div ref={containerRef} role="list">
         {items.map((item, index) => (
           <div
             key={item.id}
             ref={el => itemRefs.current[index] = el}
             role="listitem"
             tabIndex={activeIndex === index ? 0 : -1}
           >
             {item.name}
           </div>
         ))}
       </div>
     );
   }
   ```

2. **Add Proper ARIA Labels**
   ```typescript
   function AccessibleForm() {
     const [errors, setErrors] = useState<Record<string, string>>({});
     
     return (
       <form>
         <label htmlFor="email">Email Address</label>
         <input
           id="email"
           type="email"
           aria-describedby="email-error"
           aria-invalid={errors.email ? 'true' : 'false'}
         />
         {errors.email && (
           <div id="email-error" role="alert" className="error">
             {errors.email}
           </div>
         )}
       </form>
     );
   }
   ```

### 3. Animation Performance Issues

**Symptoms:**
- Janky animations
- High CPU usage
- Browser freezing

**Solutions:**

1. **Optimize Animations**
   ```css
   /* Use transform and opacity for smooth animations */
   .smooth-animation {
     transform: translateX(0);
     opacity: 1;
     transition: transform 0.3s ease, opacity 0.3s ease;
     will-change: transform, opacity;
   }
   
   .smooth-animation.hidden {
     transform: translateX(-100%);
     opacity: 0;
   }
   ```

2. **Use React Spring for Complex Animations**
   ```typescript
   import { useSpring, animated } from '@react-spring/web';
   
   function AnimatedComponent({ visible }: { visible: boolean }) {
     const styles = useSpring({
       opacity: visible ? 1 : 0,
       transform: visible ? 'translateY(0px)' : 'translateY(-20px)',
       config: { tension: 280, friction: 120 }
     });
     
     return <animated.div style={styles}>Content</animated.div>;
   }
   ```

## Authentication Issues

### 1. NextAuth Session Issues

**Symptoms:**
- Users randomly logged out
- Session not persisting
- Authentication loops

**Solutions:**

1. **Check Session Configuration**
   ```typescript
   // pages/api/auth/[...nextauth].ts
   import NextAuth from 'next-auth';
   
   export default NextAuth({
     session: {
       strategy: 'jwt',
       maxAge: 30 * 24 * 60 * 60, // 30 days
       updateAge: 24 * 60 * 60, // 24 hours
     },
     jwt: {
       maxAge: 30 * 24 * 60 * 60, // 30 days
     },
     callbacks: {
       async jwt({ token, user }) {
         if (user) {
           token.id = user.id;
           token.role = user.role;
         }
         return token;
       },
       async session({ session, token }) {
         session.user.id = token.id;
         session.user.role = token.role;
         return session;
       }
     }
   });
   ```

2. **Handle Session Expiry**
   ```typescript
   // lib/auth-utils.ts
   import { useSession } from 'next-auth/react';
   
   export function useAuthCheck() {
     const { data: session, status } = useSession();
     
     useEffect(() => {
       if (status === 'unauthenticated') {
         // Redirect to login
         window.location.href = '/auth/signin';
       }
     }, [status]);
     
     return { session, isAuthenticated: status === 'authenticated' };
   }
   ```

### 2. Permission Issues

**Symptoms:**
- Users accessing unauthorized areas
- API endpoints returning 403 errors
- Inconsistent permissions

**Solutions:**

1. **Implement Role-Based Access Control**
   ```typescript
   // middleware/auth.ts
   import { getServerSession } from 'next-auth/next';
   
   export async function requireAuth(
     req: NextApiRequest,
     res: NextApiResponse,
     requiredRole?: string
   ) {
     const session = await getServerSession(req, res, authOptions);
     
     if (!session) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     
     if (requiredRole && session.user.role !== requiredRole) {
       return res.status(403).json({ error: 'Forbidden' });
     }
     
     return session;
   }
   ```

2. **Add Permission Checks to Components**
   ```typescript
   // components/ProtectedComponent.tsx
   import { useSession } from 'next-auth/react';
   
   function ProtectedComponent({ 
     children, 
     requiredRole 
   }: { 
     children: React.ReactNode; 
     requiredRole?: string;
   }) {
     const { data: session, status } = useSession();
     
     if (status === 'loading') {
       return <LoadingSpinner />;
     }
     
     if (!session) {
       return <div>Please log in to access this content.</div>;
     }
     
     if (requiredRole && session.user.role !== requiredRole) {
       return <div>You don't have permission to access this content.</div>;
     }
     
     return <>{children}</>;
   }
   ```

## Deployment Issues

### 1. Environment Variable Issues

**Symptoms:**
- 500 errors in production
- Missing configuration
- API keys not working

**Solutions:**

1. **Validate Environment Variables**
   ```typescript
   // lib/env-validation.ts
   const requiredEnvVars = [
     'DATABASE_URL',
     'NEXTAUTH_SECRET',
     'NEXTAUTH_URL',
     'OPENAI_API_KEY'
   ];
   
   function validateEnvironment() {
     const missing = requiredEnvVars.filter(
       varName => !process.env[varName]
     );
     
     if (missing.length > 0) {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
     }
   }
   
   // Call during app initialization
   validateEnvironment();
   ```

2. **Environment-Specific Configuration**
   ```typescript
   // lib/config.ts
   export const config = {
     database: {
       url: process.env.DATABASE_URL!,
       ssl: process.env.NODE_ENV === 'production'
     },
     ai: {
       openai: {
         apiKey: process.env.OPENAI_API_KEY!,
         rateLimit: process.env.NODE_ENV === 'production' ? 100 : 1000
       }
     },
     app: {
       url: process.env.NEXTAUTH_URL!,
       debug: process.env.NODE_ENV === 'development'
     }
   };
   ```

### 2. Docker Issues

**Symptoms:**
- Container fails to start
- Missing dependencies
- Port conflicts

**Solutions:**

1. **Fix Dockerfile Issues**
   ```dockerfile
   # Use multi-stage build
   FROM node:18-alpine AS base
   
   # Install dependencies
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   COPY package.json package-lock.json ./
   RUN npm ci --only=production
   
   # Build stage
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   # Generate Prisma client
   RUN npx prisma generate
   
   # Build application
   RUN npm run build
   
   # Production stage
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   
   # Create non-root user
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   # Copy built application
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   # Set permissions
   RUN chown -R nextjs:nodejs /app
   USER nextjs
   
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Health Check Issues**
   ```typescript
   // pages/api/health.ts
   import { NextApiRequest, NextApiResponse } from 'next';
   
   export default async function handler(
     req: NextApiRequest,
     res: NextApiResponse
   ) {
     try {
       // Check database connection
       await prisma.$queryRaw`SELECT 1`;
       
       // Check Redis connection
       await redis.ping();
       
       res.status(200).json({
         status: 'healthy',
         timestamp: new Date().toISOString(),
         services: {
           database: 'healthy',
           redis: 'healthy'
         }
       });
     } catch (error) {
       res.status(503).json({
         status: 'unhealthy',
         error: error.message
       });
     }
   }
   ```

## Monitoring and Diagnostics

### 1. Application Monitoring

**Set up comprehensive monitoring:**

```typescript
// lib/monitoring.ts
import { createPrometheusMetrics } from '@prometheus/client';

export const metrics = {
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  aiRequestsTotal: new Counter({
    name: 'ai_requests_total',
    help: 'Total number of AI requests',
    labelNames: ['provider', 'model', 'status']
  }),
  
  activeUsers: new Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
  })
};

// Middleware to collect metrics
export function collectMetrics(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    metrics.httpRequestDuration.observe(
      {
        method: req.method,
        route: req.url,
        status_code: res.statusCode
      },
      duration
    );
  });
}
```

### 2. Error Tracking

**Implement comprehensive error tracking:**

```typescript
// lib/error-tracker.ts
import * as Sentry from '@sentry/nextjs';

export function setupErrorTracking() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.headers?.authorization;
        delete event.request.headers?.cookie;
      }
      return event;
    }
  });
}

export function logError(error: Error, context?: any) {
  console.error('Error:', error);
  
  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: 'sam-ai-tutor'
    }
  });
}
```

### 3. Performance Monitoring

**Monitor performance metrics:**

```typescript
// lib/performance-monitor.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  return async function(...args: any[]) {
    const startTime = performance.now();
    
    try {
      const result = await fn.apply(this, args);
      const duration = performance.now() - startTime;
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      
      // Send to monitoring service
      metrics.functionDuration.observe({ function: name }, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}

// Usage
const monitoredAIRequest = measurePerformance('ai-request', makeAIRequest);
```

## Emergency Procedures

### 1. System Outage Response

**Immediate Actions:**
1. Check system health endpoints
2. Review recent deployments
3. Check third-party service status
4. Activate backup systems

**Recovery Steps:**
```bash
#!/bin/bash
# Emergency recovery script

# Check system status
curl -f http://localhost:3000/api/health

# Check logs for errors
tail -n 100 /var/log/sam-ai-tutor/app.log

# Restart services
systemctl restart sam-ai-tutor
systemctl restart nginx
systemctl restart redis

# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Verify recovery
curl -f http://localhost:3000/api/health
```

### 2. Data Recovery

**Database Recovery:**
```bash
#!/bin/bash
# Database recovery script

# Stop application
systemctl stop sam-ai-tutor

# Restore from backup
BACKUP_FILE="/backups/database/latest.sql"
psql $DATABASE_URL < $BACKUP_FILE

# Run migrations
npx prisma migrate deploy

# Start application
systemctl start sam-ai-tutor
```

### 3. Communication Protocol

**Incident Response:**
1. Notify stakeholders immediately
2. Provide status updates every 30 minutes
3. Document all actions taken
4. Conduct post-incident review

**Status Page Template:**
```markdown
# Incident Status: SAM AI Tutor Service Disruption

**Status**: Investigating
**Started**: 2024-07-18 10:30 UTC
**Affected Services**: AI Tutor, Assessment Generation

## Timeline
- 10:30 UTC: Issue detected
- 10:35 UTC: Investigation started
- 10:40 UTC: Root cause identified
- 10:50 UTC: Fix implemented
- 11:00 UTC: Service restored

## Root Cause
[Description of the root cause]

## Resolution
[Description of the fix]

## Next Steps
[Preventive measures]
```

---

*Last updated: July 2025*
*Version: 1.0.0*
*Troubleshooting Guide: SAM AI Tutor System*
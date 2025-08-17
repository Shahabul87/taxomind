# Performance Troubleshooting Guide

## Performance Bottlenecks and Optimization

This guide helps you identify and resolve performance issues in the Taxomind application, including slow page loads, memory leaks, and optimization strategies.

## Table of Contents
- [Page Load Performance](#page-load-performance)
- [Database Query Optimization](#database-query-optimization)
- [Memory Leak Detection](#memory-leak-detection)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Server Component Performance](#server-component-performance)
- [Image and Asset Optimization](#image-and-asset-optimization)
- [Caching Strategies](#caching-strategies)
- [Performance Monitoring](#performance-monitoring)

---

## Page Load Performance

### Issue: Slow Initial Page Load

**Symptoms:**
- Time to First Byte (TTFB) > 600ms
- First Contentful Paint (FCP) > 2.5s
- Largest Contentful Paint (LCP) > 4s

**Diagnostic Tools:**

1. **Chrome DevTools Lighthouse:**
```bash
# Run Lighthouse audit
npm run build
npm run start
# Open Chrome DevTools → Lighthouse → Generate report
```

2. **Next.js Analytics:**
```typescript
// next.config.js
module.exports = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },
};

// app/components/web-vitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);
    // Send to analytics
    sendToAnalytics(metric);
  });
}
```

**Solutions:**

1. **Optimize Server Components:**
```typescript
// ❌ Slow - Multiple sequential queries
export default async function Page() {
  const user = await db.user.findUnique({ where: { id } });
  const courses = await db.course.findMany({ where: { userId: user.id } });
  const enrollments = await db.enrollment.findMany({ where: { userId: user.id } });
  
  return <Dashboard user={user} courses={courses} enrollments={enrollments} />;
}

// ✅ Fast - Parallel queries
export default async function Page() {
  const [user, courses, enrollments] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.course.findMany({ where: { userId: id } }),
    db.enrollment.findMany({ where: { userId: id } }),
  ]);
  
  return <Dashboard user={user} courses={courses} enrollments={enrollments} />;
}
```

2. **Implement Streaming:**
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<UserSkeleton />}>
        <UserData />
      </Suspense>
      <Suspense fallback={<CourseSkeleton />}>
        <CourseList />
      </Suspense>
    </div>
  );
}

// Stream data progressively
async function UserData() {
  const user = await fetchUser(); // This can load independently
  return <UserProfile user={user} />;
}
```

### Issue: Slow Client-Side Navigation

**Solutions:**

1. **Prefetch critical routes:**
```typescript
// components/navigation.tsx
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      {/* Prefetch by default for Link */}
      <Link href="/dashboard" prefetch={true}>Dashboard</Link>
      
      {/* Prefetch on hover for less critical */}
      <Link href="/settings" prefetch={false}>Settings</Link>
    </nav>
  );
}
```

2. **Optimize route transitions:**
```typescript
// app/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />; // Show immediately while loading
}

// Use router.prefetch for programmatic navigation
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function PrefetchRoutes() {
  const router = useRouter();
  
  useEffect(() => {
    // Prefetch likely next routes
    router.prefetch('/dashboard');
    router.prefetch('/courses');
  }, [router]);
}
```

---

## Database Query Optimization

### Issue: N+1 Query Problems

**Detection:**
```typescript
// lib/db.ts - Add query logging
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'warn', 'error']
    : ['error'],
});

// Log slow queries
db.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  if (after - before > 100) {
    console.warn(`Slow query (${after - before}ms):`, {
      model: params.model,
      action: params.action,
    });
  }
  
  return result;
});
```

**Solutions:**

1. **Use includes wisely:**
```typescript
// ❌ Bad - Fetches all fields
const courses = await db.course.findMany({
  include: {
    user: true,
    chapters: true,
    enrollments: true,
    reviews: true,
  },
});

// ✅ Good - Select only needed fields
const courses = await db.course.findMany({
  select: {
    id: true,
    title: true,
    thumbnail: true,
    user: {
      select: {
        name: true,
        image: true,
      },
    },
    _count: {
      select: {
        chapters: true,
        enrollments: true,
      },
    },
  },
});
```

2. **Implement data loader pattern:**
```typescript
// lib/data-loader.ts
class DataLoader {
  private cache = new Map();
  
  async loadUser(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    const user = await db.user.findUnique({ where: { id } });
    this.cache.set(id, user);
    return user;
  }
  
  async loadManyUsers(ids: string[]) {
    const uncached = ids.filter(id => !this.cache.has(id));
    
    if (uncached.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: uncached } },
      });
      
      users.forEach(user => this.cache.set(user.id, user));
    }
    
    return ids.map(id => this.cache.get(id));
  }
}
```

### Issue: Slow Aggregations

**Solutions:**

1. **Use database views:**
```sql
-- Create materialized view for expensive aggregations
CREATE MATERIALIZED VIEW course_stats AS
SELECT 
  course_id,
  COUNT(DISTINCT user_id) as enrolled_count,
  AVG(progress) as avg_progress,
  COUNT(CASE WHEN completed THEN 1 END) as completed_count
FROM enrollments
GROUP BY course_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW course_stats;
```

2. **Implement query result caching:**
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCourseStats = unstable_cache(
  async (courseId: string) => {
    return await db.enrollment.aggregate({
      where: { courseId },
      _count: true,
      _avg: { progress: true },
    });
  },
  ['course-stats'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: [`course-${courseId}`],
  }
);
```

---

## Memory Leak Detection

### Identifying Memory Leaks

**Node.js Memory Profiling:**
```bash
# Start with heap snapshot
node --inspect npm run dev

# Open chrome://inspect
# Take heap snapshots before and after operations
# Compare for retained objects
```

**Common Memory Leak Patterns:**

1. **Event listener leaks:**
```typescript
// ❌ Memory leak - listeners not removed
class ComponentWithLeak {
  constructor() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('click', this.handleClick);
  }
  
  handleResize = () => { /* ... */ }
  handleClick = () => { /* ... */ }
}

// ✅ Fixed - Proper cleanup
class ComponentFixed {
  private resizeHandler: () => void;
  private clickHandler: () => void;
  
  constructor() {
    this.resizeHandler = this.handleResize.bind(this);
    this.clickHandler = this.handleClick.bind(this);
    
    window.addEventListener('resize', this.resizeHandler);
    document.addEventListener('click', this.clickHandler);
  }
  
  destroy() {
    window.removeEventListener('resize', this.resizeHandler);
    document.removeEventListener('click', this.clickHandler);
  }
}
```

2. **React component leaks:**
```typescript
// ✅ Proper cleanup in React
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080');
  const timer = setInterval(() => {}, 1000);
  const controller = new AbortController();
  
  // Cleanup function
  return () => {
    ws.close();
    clearInterval(timer);
    controller.abort();
  };
}, []);
```

### Memory Monitoring

```typescript
// app/api/health/memory/route.ts
export async function GET() {
  const memory = process.memoryUsage();
  
  return NextResponse.json({
    rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memory.external / 1024 / 1024)} MB`,
    timestamp: new Date().toISOString(),
  });
}

// Monitor memory over time
setInterval(async () => {
  const response = await fetch('/api/health/memory');
  const data = await response.json();
  
  if (data.heapUsed > 500) { // Alert if over 500MB
    console.error('High memory usage detected:', data);
  }
}, 60000); // Check every minute
```

---

## Bundle Size Optimization

### Analyzing Bundle Size

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Configure next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run analysis
ANALYZE=true npm run build
```

### Optimization Strategies

1. **Dynamic imports for heavy components:**
```typescript
// ❌ Always loaded
import HeavyEditor from '@/components/heavy-editor';

// ✅ Loaded only when needed
const HeavyEditor = dynamic(() => import('@/components/heavy-editor'), {
  loading: () => <EditorSkeleton />,
  ssr: false, // Disable SSR for client-only components
});
```

2. **Tree-shake imports:**
```typescript
// ❌ Imports entire library
import _ from 'lodash';
const debounced = _.debounce(fn, 300);

// ✅ Import only what's needed
import debounce from 'lodash/debounce';
const debounced = debounce(fn, 300);
```

3. **Optimize dependencies:**
```typescript
// ❌ Large moment.js
import moment from 'moment';

// ✅ Smaller date-fns
import { format } from 'date-fns';
```

4. **Code splitting by route:**
```typescript
// app/admin/page.tsx
// This creates a separate bundle for admin routes
import AdminDashboard from './admin-dashboard';

export default function AdminPage() {
  return <AdminDashboard />;
}
```

---

## Server Component Performance

### Optimizing Data Fetching

1. **Parallel data fetching:**
```typescript
// ✅ Fetch in parallel
export default async function Page() {
  const dataPromises = Promise.all([
    fetch('/api/user'),
    fetch('/api/courses'),
    fetch('/api/stats'),
  ]);
  
  const [user, courses, stats] = await dataPromises;
  
  return <Dashboard {...{ user, courses, stats }} />;
}
```

2. **Implement request deduplication:**
```typescript
// Next.js automatically dedupes fetch requests
const getData = async () => {
  // These will be deduped if called multiple times
  const response = await fetch('/api/data', {
    next: { revalidate: 3600 },
  });
  return response.json();
};
```

3. **Use React cache for expensive operations:**
```typescript
import { cache } from 'react';

// Cache expensive computation per request
export const getExpensiveData = cache(async (id: string) => {
  console.log('Computing expensive data for:', id);
  // This will only run once per request
  return await complexCalculation(id);
});
```

---

## Image and Asset Optimization

### Next.js Image Optimization

1. **Proper Image component usage:**
```typescript
// ❌ Unoptimized
<img src="/hero.jpg" alt="Hero" />

// ✅ Optimized with Next.js Image
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

2. **Responsive images:**
```typescript
<Image
  src="/hero.jpg"
  alt="Hero"
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
  fill
  style={{ objectFit: 'cover' }}
/>
```

3. **Image format optimization:**
```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Caching Strategies

### Implementing Multi-Layer Caching

1. **Browser caching:**
```typescript
// app/api/static-data/route.ts
export async function GET() {
  const data = await getStaticData();
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
```

2. **Redis caching:**
```typescript
// lib/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  
  // Fetch and cache
  const fresh = await fetcher();
  await redis.setex(key, ttl, fresh);
  
  return fresh;
}

// Usage
const courses = await getCachedData(
  `courses:${userId}`,
  () => db.course.findMany({ where: { userId } }),
  7200 // 2 hours
);
```

3. **Next.js Data Cache:**
```typescript
// Revalidate cached data
import { revalidatePath, revalidateTag } from 'next/cache';

// After updating data
export async function updateCourse(id: string, data: any) {
  await db.course.update({ where: { id }, data });
  
  // Revalidate specific paths
  revalidatePath('/courses');
  revalidatePath(`/course/${id}`);
  
  // Or revalidate by tag
  revalidateTag(`course-${id}`);
}
```

---

## Performance Monitoring

### Setting Up Monitoring

1. **Custom performance tracking:**
```typescript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  return async (...args: any[]) => {
    const start = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      // Log to monitoring service
      console.log(`Performance: ${name} took ${duration}ms`);
      
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${name}`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Error in ${name} after ${duration}ms:`, error);
      throw error;
    }
  };
}

// Usage
export const getCoursesOptimized = measurePerformance(
  'getCourses',
  async () => {
    return await db.course.findMany();
  }
);
```

2. **Real User Monitoring (RUM):**
```typescript
// app/components/performance-monitor.tsx
'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Send to analytics
          sendToAnalytics({
            name: entry.name,
            value: entry.startTime,
            type: entry.entryType,
          });
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
      
      return () => observer.disconnect();
    }
  }, []);
  
  return null;
}
```

### Performance Budget

```javascript
// next.config.js
module.exports = {
  experimental: {
    webpackBuildWorker: true,
  },
  // Set performance budgets
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.performance = {
        hints: 'warning',
        maxAssetSize: 512000, // 500 KB
        maxEntrypointSize: 1024000, // 1 MB
      };
    }
    return config;
  },
};
```

---

## Performance Optimization Checklist

### Before Deployment

- [ ] Run Lighthouse audit (score > 90)
- [ ] Check bundle size (< 500KB initial)
- [ ] Verify image optimization
- [ ] Test database query performance
- [ ] Check memory usage patterns
- [ ] Validate caching headers
- [ ] Test with slow network throttling
- [ ] Verify lazy loading works
- [ ] Check for memory leaks
- [ ] Monitor API response times

### Production Monitoring

- [ ] Set up Real User Monitoring
- [ ] Configure performance alerts
- [ ] Track Core Web Vitals
- [ ] Monitor database slow queries
- [ ] Check error rates
- [ ] Track memory usage
- [ ] Monitor cache hit rates
- [ ] Review CDN performance
- [ ] Analyze user session recordings
- [ ] Regular performance audits

---

## When to Escalate

Escalate performance issues when:
- Page load time > 5 seconds consistently
- Memory usage growing unbounded
- Database queries taking > 1 second
- Bundle size > 2MB
- User complaints about slowness
- Server response time > 2 seconds

Include in escalation:
- Performance metrics and graphs
- Specific slow operations
- Recent changes that may have caused regression
- Browser/device information
- Network conditions
- User impact assessment

---

*Last Updated: January 2025*
*Performance Stack: Next.js 15 + React 19 + Vercel*
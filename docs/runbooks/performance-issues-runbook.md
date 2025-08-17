# Performance Issues Runbook

## Overview
This runbook provides procedures for diagnosing and resolving performance issues in the Taxomind Next.js 15 application.

## Quick Reference
- **Framework**: Next.js 15 with App Router
- **Runtime**: Node.js
- **Bundler**: Webpack/Turbopack
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (Upstash)

## Common Issues and Resolutions

### 1. High Memory Usage

#### Symptoms
- Node.js process consuming > 1GB RAM
- Out of memory errors
- Application crashes with "JavaScript heap out of memory"
- Slow garbage collection

#### Quick Diagnostics
```bash
# Check Node.js memory usage
ps aux | grep node

# Get heap statistics
node -e "console.log(process.memoryUsage())"

# Monitor in real-time
top -p $(pgrep -f "next-server")

# Check for memory leaks in development
npm run dev
# Navigate to: chrome://inspect
# Take heap snapshots and compare
```

#### Resolution Steps

1. **Immediate Relief**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run start

# Restart application
pm2 restart taxomind --update-env

# Clear build cache
rm -rf .next
npm run build
```

2. **Identify Memory Leaks**
```typescript
// Common leak pattern 1: Event listeners not cleaned up
// ❌ BAD
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);

// ✅ GOOD
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [handleResize]);

// Common leak pattern 2: Uncancelled async operations
// ✅ GOOD
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    const data = await getData();
    if (!cancelled) {
      setData(data);
    }
  };
  
  fetchData();
  return () => { cancelled = true; };
}, []);
```

3. **Fix Common Memory Issues**
```typescript
// Optimize image loading
import Image from 'next/image';

// Use proper image optimization
<Image
  src="/large-image.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>

// Implement pagination for large lists
const ItemList = ({ items }) => {
  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(0);
  
  const visibleItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );
  
  return <>{visibleItems.map(item => <Item key={item.id} />)}</>;
};
```

4. **Optimize Bundle Size**
```bash
# Analyze bundle
npm run build
npx next-bundle-analyzer

# Check for large dependencies
npm list --depth=0 | grep -E "[0-9]+MB"

# Tree-shake unused code
# In next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### 2. Slow Page Loads

#### Symptoms
- Initial page load > 3 seconds
- Time to Interactive (TTI) > 5 seconds
- Large bundle sizes
- Poor Lighthouse scores

#### Quick Diagnostics
```bash
# Run Lighthouse audit
npx lighthouse https://taxomind.com --view

# Check build output
npm run build
# Look for "First Load JS" sizes

# Analyze route segments
npx next build --profile

# Check for render blocking resources
curl -o /dev/null -s -w "%{time_total}\n" https://taxomind.com
```

#### Resolution Steps

1. **Optimize Initial Load**
```typescript
// Implement dynamic imports
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
);

// Use React.lazy for client components
const LazyComponent = lazy(() => import('./LazyComponent'));
```

2. **Implement Route Prefetching**
```typescript
import Link from 'next/link';

// Prefetch on hover
<Link href="/courses" prefetch={false}>
  <a onMouseEnter={() => router.prefetch('/courses')}>
    Courses
  </a>
</Link>

// Prefetch critical routes
useEffect(() => {
  router.prefetch('/dashboard');
  router.prefetch('/courses');
}, [router]);
```

3. **Optimize Server Components**
```typescript
// Use streaming for large data
import { Suspense } from 'react';

export default async function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<CourseSkeleton />}>
        <CourseList />
      </Suspense>
    </>
  );
}

// Parallel data fetching
async function CourseList() {
  const [courses, categories, reviews] = await Promise.all([
    getCourses(),
    getCategories(),
    getReviews(),
  ]);
  
  return <CourseGrid courses={courses} />;
}
```

4. **Implement Caching Strategies**
```typescript
// Cache server component results
export const revalidate = 3600; // Revalidate every hour

// Use Next.js caching
import { unstable_cache } from 'next/cache';

const getCachedCourses = unstable_cache(
  async () => {
    return await db.course.findMany();
  },
  ['courses'],
  { revalidate: 60 }
);

// Implement Redis caching
import { redis } from '@/lib/redis';

async function getCourseWithCache(id: string) {
  const cached = await redis.get(`course:${id}`);
  if (cached) return JSON.parse(cached);
  
  const course = await db.course.findUnique({ where: { id } });
  await redis.set(`course:${id}`, JSON.stringify(course), 'EX', 3600);
  return course;
}
```

### 3. API Response Timeouts

#### Symptoms
- API calls timing out after 30 seconds
- 504 Gateway Timeout errors
- Slow database queries
- Rate limiting kicks in

#### Quick Diagnostics
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s https://taxomind.com/api/courses

# Check API logs
tail -f logs/api.log | grep -E "duration|timeout"

# Test specific endpoints
time curl https://taxomind.com/api/courses

# Check rate limiting
curl -I https://taxomind.com/api/courses | grep -i "rate"
```

#### Resolution Steps

1. **Optimize Database Queries**
```typescript
// Use select to limit fields
const courses = await db.course.findMany({
  select: {
    id: true,
    title: true,
    description: true,
    thumbnail: true,
    price: true,
    user: {
      select: {
        name: true,
        image: true,
      }
    }
  },
  take: 20, // Limit results
});

// Use pagination
const courses = await db.course.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

2. **Implement Request Streaming**
```typescript
// Stream large responses
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const courses = await db.course.findMany();
      
      for (const course of courses) {
        controller.enqueue(
          encoder.encode(JSON.stringify(course) + '\n')
        );
      }
      
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
```

3. **Implement Queue Processing**
```typescript
// Use background jobs for heavy operations
import { Queue } from 'bull';

const processQueue = new Queue('processing');

export async function POST(request: Request) {
  const data = await request.json();
  
  // Queue heavy operation
  const job = await processQueue.add('generate-course', data);
  
  // Return immediately
  return NextResponse.json({ 
    jobId: job.id,
    status: 'processing' 
  });
}
```

### 4. High CPU Usage

#### Symptoms
- CPU usage consistently > 80%
- Slow response times during peak hours
- Node.js event loop lag
- Server unresponsive

#### Quick Diagnostics
```bash
# Check CPU usage by process
top -c

# Profile Node.js CPU usage
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Check event loop lag
npm install -g clinic
clinic doctor -- node server.js

# Monitor specific process
pidstat -p $(pgrep -f next-server) 1
```

#### Resolution Steps

1. **Optimize Computational Tasks**
```typescript
// Move heavy computation to Web Workers
// worker.js
self.addEventListener('message', (event) => {
  const result = heavyComputation(event.data);
  self.postMessage(result);
});

// Component
const worker = new Worker('/worker.js');
worker.postMessage(data);
worker.onmessage = (event) => {
  setResult(event.data);
};
```

2. **Implement Throttling**
```typescript
import { throttle } from 'lodash';

const handleSearch = throttle(async (query: string) => {
  const results = await searchCourses(query);
  setSearchResults(results);
}, 300);

// Or use debounce for user input
const handleInput = debounce((value: string) => {
  validateInput(value);
}, 500);
```

3. **Optimize Rendering**
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <ComplexVisualization data={data} />;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data.id]); // Only recalculate when ID changes
```

## Performance Optimization Checklist

### Build Time Optimizations
```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### Runtime Optimizations
```typescript
// Implement lazy loading
const LazyComponent = dynamic(() => import('./Component'), {
  loading: () => <Spinner />,
});

// Use Intersection Observer for visibility
const useOnScreen = (ref: RefObject<HTMLElement>) => {
  const [isIntersecting, setIntersecting] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting)
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [ref]);
  
  return isIntersecting;
};
```

## Prevention Measures

1. **Performance Monitoring**
```bash
# Set up performance monitoring
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

2. **Regular Performance Audits**
```bash
# Weekly Lighthouse audits
npx lighthouse https://taxomind.com --output json --output-path ./report.json

# Bundle size monitoring
npm run build
# Check "First Load JS" should be < 100KB per route
```

3. **Load Testing**
```bash
# Use k6 for load testing
k6 run load-test.js

# Or Apache Bench
ab -n 1000 -c 100 https://taxomind.com/api/courses
```

## Escalation Procedures

### Level 1: Frontend Team
- Page load times < 5 seconds
- Bundle size issues
- Component optimization

### Level 2: Backend Team  
- API timeouts
- Database performance
- Server-side rendering issues

### Level 3: Infrastructure Team
- Server resource exhaustion
- CDN configuration
- Auto-scaling issues

## Monitoring Dashboards

- **Vercel Analytics**: https://vercel.com/taxomind/analytics
- **Application Monitoring**: http://monitoring.taxomind.com/performance
- **Real User Monitoring**: http://rum.taxomind.com
- **Lighthouse CI**: http://lighthouse.taxomind.com

## Emergency Commands

```bash
# Emergency restart
pm2 restart all --update-env

# Clear all caches
redis-cli FLUSHALL
rm -rf .next
npm run build

# Scale up resources (AWS)
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name taxomind-asg \
  --desired-capacity 10

# Enable maintenance mode
echo "true" > /var/www/maintenance_mode
```

## Related Resources

- Performance Budget: `/docs/performance-budget.md`
- Optimization Guide: `/docs/optimization-guide.md`
- Load Test Scripts: `/tests/load/`
- Performance Baseline: `/metrics/baseline.json`

---
*Last Updated: January 2025*
*Version: 1.0*
*Next Review: February 2025*
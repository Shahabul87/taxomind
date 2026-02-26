# 🚀 Performance Audit Reference

## What to Check

### 1. Route Segment Configuration
```bash
# Find all page/layout files and check for segment config
grep -rn "export const dynamic\|export const revalidate\|export const runtime\|export const fetchCache\|export const preferredRegion" app/ --include="*.ts" --include="*.tsx"

# Find pages that should be static but aren't configured
find app/ -name "page.tsx" -exec grep -L "export const dynamic\|export const revalidate\|generateStaticParams" {} \;
```

**Good:** Pages that don't need real-time data use `export const dynamic = 'force-static'` or `export const revalidate = 3600`
**Bad:** All pages default to dynamic rendering when many could be statically generated

### 2. Image Optimization
```bash
# Find unoptimized images (raw <img> tags in React/Next.js)
grep -rn '<img ' app/ components/ --include="*.tsx" --include="*.jsx" | grep -v 'next/image' | grep -v '.test.'

# Check for next/image usage without proper sizing
grep -rn 'Image' app/ components/ --include="*.tsx" | grep -v 'width\|height\|fill' | head -20

# Check Cloudinary configuration
grep -rn 'cloudinary\|CldImage\|CldUploadWidget' app/ components/ --include="*.tsx" | head -10
```

**Good:** All images use `next/image` or `next-cloudinary` with explicit dimensions
**Bad:** Raw `<img>` tags, images without `width`/`height`, missing `priority` on LCP images

### 3. Font Loading
```bash
# Check font loading strategy
grep -rn 'next/font\|@fontsource\|font-face\|Google_Font\|Inter\|local(' app/ --include="*.ts" --include="*.tsx" --include="*.css" | head -10

# Check for render-blocking font requests
grep -rn 'googleapis.com/css\|fonts.gstatic' app/ public/ --include="*.html" --include="*.tsx" --include="*.css"
```

**Good:** Using `next/font` for automatic optimization with `display: swap`
**Bad:** External font CDN links in `<head>`, multiple font families loading on first paint

### 4. Script Loading
```bash
# Check for next/script usage and strategies
grep -rn 'next/script\|Script ' app/ components/ --include="*.tsx" | head -10

# Find inline scripts that should use next/script
grep -rn '<script' app/ components/ --include="*.tsx" | grep -v 'next/script'

# Check for heavy third-party scripts
grep -rn 'analytics\|gtag\|facebook\|hotjar\|intercom\|crisp\|drift' app/ --include="*.tsx" --include="*.ts" | head -10
```

**Good:** Third-party scripts use `next/script` with `strategy="lazyOnload"` or `"afterInteractive"`
**Bad:** Scripts in `<head>` blocking render, no loading strategy specified

### 5. Suspense & Streaming
```bash
# Check for Suspense boundaries
grep -rn 'Suspense\|loading.tsx' app/ --include="*.tsx" | head -20

# Find loading.tsx files (automatic Suspense boundaries)
find app/ -name "loading.tsx" -o -name "loading.js"

# Check for slow data fetches without streaming
grep -rn 'await.*fetch\|await.*prisma\|await.*db' app/ --include="*.tsx" -l | head -10
```

**Good:** Heavy data-fetching pages have `loading.tsx` or explicit `<Suspense>` boundaries
**Bad:** Full-page blocking on slow database queries with no streaming

### 6. Middleware Performance
```bash
# Check middleware file
cat middleware.ts 2>/dev/null || cat src/middleware.ts 2>/dev/null

# Look for heavy operations in middleware
grep -n 'prisma\|database\|fetch\|axios\|import.*heavy' middleware.ts 2>/dev/null
```

**Good:** Middleware is lightweight — only auth checks, redirects, headers
**Bad:** Database queries in middleware, heavy computation, large import chains

### 7. Caching Strategy
```bash
# Check for Cache-Control headers
grep -rn 'Cache-Control\|cache:\|next: { revalidate\|unstable_cache\|cache(' app/ lib/ --include="*.ts" --include="*.tsx" | head -20

# Check for React cache() usage
grep -rn "import.*cache.*from 'react'" app/ lib/ --include="*.ts" --include="*.tsx"

# Check fetch caching
grep -rn "fetch(" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v node_modules | head -20
```

**Good:** API routes set appropriate Cache-Control, data fetches use `next: { revalidate }`, expensive computations use `React.cache()`
**Bad:** No caching strategy, all fetches are `cache: 'no-store'`, no CDN headers

### 8. Server Components vs Client Components
```bash
# Count client components vs total components
echo "Client components:"
grep -rl "'use client'\|\"use client\"" app/ components/ --include="*.tsx" | wc -l

echo "Total component files:"
find app/ components/ -name "*.tsx" | wc -l

# Find large client components that might benefit from server component extraction
grep -rl "'use client'" app/ components/ --include="*.tsx" | xargs wc -l | sort -rn | head -20
```

**Good:** <30% of components are client components, data fetching stays in server components
**Bad:** >60% client components, data fetched on client that could be server-fetched

### 9. Memory & Node.js Configuration
```bash
# Check NODE_OPTIONS in scripts
grep "max-old-space-size" package.json

# Check for memory leaks patterns
grep -rn "addEventListener\|setInterval\|setTimeout" app/ components/ --include="*.tsx" | grep -v "removeEventListener\|clearInterval\|clearTimeout" | head -10
```

**Good:** Appropriate memory allocation, event listeners cleaned up in useEffect return
**Bad:** 16GB+ heap for simple builds (indicates memory leak or unoptimized build), uncleaned listeners

## Scoring

| Check | Weight | Score Criteria |
|-------|--------|---------------|
| Route Config | 15% | % of pages with explicit caching strategy |
| Image Optimization | 15% | 0 raw `<img>` tags = full marks |
| Font Loading | 10% | next/font usage = full marks |
| Script Loading | 10% | All third-party scripts use next/script |
| Suspense/Streaming | 15% | Data-heavy pages have loading boundaries |
| Middleware | 10% | Lightweight, no DB calls |
| Caching | 15% | Explicit strategy on API routes + data |
| RSC Ratio | 10% | <40% client components = full marks |

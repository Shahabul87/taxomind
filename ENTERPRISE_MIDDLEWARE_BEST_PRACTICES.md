# Enterprise Middleware Best Practices

## Core Principles

### 1. **Single Responsibility Principle**
```typescript
// ❌ BAD: Middleware doing too much
export default function middleware(req: NextRequest) {
  // Authentication logic
  // CSS handling
  // API rate limiting
  // Logging
  // Error handling
}

// ✅ GOOD: Focused middleware
export default function authMiddleware(req: NextRequest) {
  // Only handle authentication
  // Let Next.js handle static assets
}
```

### 2. **Never Intercept Static Assets**
```typescript
// ❌ BAD: Intercepting CSS/JS files
if (pathname.includes('/_next/static/css/')) {
  return new NextResponse('/* fake css */');
}

// ✅ GOOD: Exclude static assets completely
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.css$|.*\\.js$|.*\\.map$).*)',
  ],
};
```

### 3. **Explicit Exclusion Lists**
```typescript
// ✅ Enterprise approach: Comprehensive exclusions
const STATIC_ASSET_EXTENSIONS = [
  '.css', '.js', '.map', '.json',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.pdf', '.zip', '.tar', '.gz'
];

const NEXT_INTERNAL_PATHS = [
  '/_next/static',
  '/_next/image',
  '/_next/webpack-hmr',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

export const config = {
  matcher: [
    `/((?!${NEXT_INTERNAL_PATHS.map(p => p.replace('/', '\\/')).join('|')}|.*\\.(${STATIC_ASSET_EXTENSIONS.map(e => e.slice(1)).join('|')})$).*)`,
  ],
};
```

## 2. **Comprehensive Testing Strategy**

### A. **Static Asset Testing**
```typescript
// tests/middleware.test.ts
describe('Middleware Static Asset Handling', () => {
  test('should not intercept CSS files', async () => {
    const response = await fetch('http://localhost:3000/_next/static/css/app/layout.css');
    expect(response.headers.get('content-type')).toContain('text/css');
    expect(response.status).toBe(200);
  });

  test('should not intercept JS files', async () => {
    const response = await fetch('http://localhost:3000/_next/static/chunks/main.js');
    expect(response.headers.get('content-type')).toContain('application/javascript');
  });

  test('should not intercept image files', async () => {
    const response = await fetch('http://localhost:3000/_next/image?url=/test.png');
    expect(response.status).toBe(200);
  });
});
```

### B. **Automated CSS Loading Tests**
```typescript
// tests/css-loading.test.ts
import { test, expect } from '@playwright/test';

test('CSS loads correctly on all pages', async ({ page }) => {
  const pages = ['/', '/courses', '/blog', '/about'];
  
  for (const pagePath of pages) {
    await page.goto(pagePath);
    
    // Check if CSS is loaded
    const hasStyles = await page.evaluate(() => {
      return document.querySelectorAll('link[rel="stylesheet"]').length > 0;
    });
    
    expect(hasStyles).toBe(true);
    
    // Check if Tailwind classes are working
    const tailwindWorks = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.className = 'bg-red-500';
      document.body.appendChild(testEl);
      const styles = window.getComputedStyle(testEl);
      const hasRedBackground = styles.backgroundColor === 'rgb(239, 68, 68)';
      document.body.removeChild(testEl);
      return hasRedBackground;
    });
    
    expect(tailwindWorks).toBe(true);
  }
});
```

## 3. **Monitoring and Alerting**

### A. **CSS Loading Monitoring**
```typescript
// lib/monitoring/css-monitor.ts
export class CSSLoadingMonitor {
  static checkCSSLoading() {
    if (typeof window !== 'undefined') {
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
      const failedCSS = Array.from(cssLinks).filter(link => {
        return (link as HTMLLinkElement).sheet === null;
      });
      
      if (failedCSS.length > 0) {
        console.error('CSS loading failed:', failedCSS);
        // Send to monitoring service
        this.sendAlert('css_loading_failed', { 
          failedFiles: failedCSS.map(l => (l as HTMLLinkElement).href)
        });
      }
    }
  }
  
  static sendAlert(type: string, data: any) {
    // Send to DataDog, Sentry, etc.
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, timestamp: new Date().toISOString() })
      });
    }
  }
}
```

### B. **Real-time CSS Health Check**
```typescript
// pages/api/health/css.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if CSS files are accessible
    const cssFiles = [
      '/_next/static/css/app/layout.css',
      // Add other critical CSS files
    ];
    
    const results = await Promise.all(
      cssFiles.map(async (file) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL}${file}`);
          return { file, status: response.status, ok: response.ok };
        } catch (error) {
          return { file, status: 0, ok: false, error: error.message };
        }
      })
    );
    
    const failedFiles = results.filter(r => !r.ok);
    
    if (failedFiles.length > 0) {
      return res.status(500).json({
        status: 'error',
        message: 'CSS files not accessible',
        failedFiles
      });
    }
    
    res.status(200).json({ status: 'ok', cssFiles: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}
```

## 4. **Development Tools and Linting**

### A. **Custom ESLint Rules**
```typescript
// .eslintrc.js
module.exports = {
  rules: {
    'no-middleware-static-intercept': 'error',
  },
  overrides: [
    {
      files: ['middleware.ts'],
      rules: {
        'no-console': 'warn',
        'no-sync': 'error',
      },
    },
  ],
};

// Custom rule to prevent static asset interception
// eslint-rules/no-middleware-static-intercept.js
module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'includes' &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal' &&
          (node.arguments[0].value.includes('/_next/static') ||
           node.arguments[0].value.includes('.css') ||
           node.arguments[0].value.includes('.js'))
        ) {
          context.report({
            node,
            message: 'Middleware should not intercept static assets'
          });
        }
      }
    };
  }
};
```

### B. **Pre-commit Hooks**
```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run CSS loading tests
npm run test:css-loading

# Check middleware configuration
npm run lint:middleware

# Validate static asset handling
npm run test:static-assets
```

## 5. **Documentation and Team Guidelines**

### A. **Middleware Development Guidelines**
```markdown
# Middleware Development Guidelines

## DO's
- ✅ Only handle authentication/authorization
- ✅ Use explicit exclusion lists
- ✅ Test with real browsers
- ✅ Monitor in production
- ✅ Document all middleware changes

## DON'Ts
- ❌ Never intercept static assets
- ❌ Don't handle CSS/JS files
- ❌ Avoid complex logic in middleware
- ❌ Don't skip testing
- ❌ Never deploy without monitoring

## Required Checklist
- [ ] Middleware excludes all static assets
- [ ] CSS loading tests pass
- [ ] Browser testing completed
- [ ] Monitoring setup
- [ ] Documentation updated
```

## 6. **Production Deployment Checks**

### A. **Pre-deployment Validation**
```typescript
// scripts/pre-deploy-check.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateCSSLoading() {
  console.log('🔍 Validating CSS loading...');
  
  // Build the app
  await execAsync('npm run build');
  
  // Start production server
  const server = exec('npm start');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test CSS loading
  const testUrls = ['/', '/courses', '/blog'];
  
  for (const url of testUrls) {
    try {
      const response = await fetch(`http://localhost:3000${url}`);
      const html = await response.text();
      
      if (!html.includes('link rel="stylesheet"')) {
        throw new Error(`CSS not found in ${url}`);
      }
      
      console.log(`✅ CSS loading validated for ${url}`);
    } catch (error) {
      console.error(`❌ CSS loading failed for ${url}:`, error.message);
      process.exit(1);
    }
  }
  
  server.kill();
  console.log('✅ All CSS loading checks passed!');
}

validateCSSLoading().catch(console.error);
```

## 7. **Real-time Monitoring**

### A. **CSS Loading Telemetry**
```typescript
// lib/telemetry/css-telemetry.ts
export class CSSLoadingTelemetry {
  static init() {
    if (typeof window !== 'undefined') {
      // Monitor CSS load events
      document.addEventListener('DOMContentLoaded', () => {
        this.trackCSSLoadTime();
        this.detectCSSFailures();
      });
    }
  }
  
  static trackCSSLoadTime() {
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    
    cssLinks.forEach((link) => {
      const startTime = performance.now();
      
      link.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        
        // Send metrics to monitoring service
        this.sendMetric('css_load_time', {
          file: (link as HTMLLinkElement).href,
          loadTime,
          timestamp: new Date().toISOString()
        });
      });
      
      link.addEventListener('error', () => {
        // Alert on CSS load failure
        this.sendAlert('css_load_failed', {
          file: (link as HTMLLinkElement).href,
          timestamp: new Date().toISOString()
        });
      });
    });
  }
}
```

This comprehensive approach ensures that CSS-related middleware issues are caught early and never make it to production.
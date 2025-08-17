# Runtime Errors Troubleshooting Guide

## Application Runtime Error Debugging

This guide helps you diagnose and fix runtime errors that occur when the Taxomind application is running, including client-side errors, server-side errors, and hydration issues.

## Table of Contents
- [Client-Side Runtime Errors](#client-side-runtime-errors)
- [Server-Side Runtime Errors](#server-side-runtime-errors)
- [Hydration Errors](#hydration-errors)
- [API Route Errors](#api-route-errors)
- [State Management Errors](#state-management-errors)
- [Memory Leaks and Performance Issues](#memory-leaks-and-performance-issues)
- [Error Boundary Implementation](#error-boundary-implementation)

---

## Client-Side Runtime Errors

### Error: "Cannot read properties of undefined"

**Symptoms:**
```javascript
TypeError: Cannot read properties of undefined (reading 'name')
```

**Common Causes & Solutions:**

1. **Accessing nested properties without checks:**
```typescript
// ❌ Wrong - Unsafe access
const UserProfile = ({ user }) => {
  return <div>{user.profile.name}</div>; // Crashes if profile is undefined
};

// ✅ Correct - Safe access with optional chaining
const UserProfile = ({ user }) => {
  return <div>{user?.profile?.name || 'Unknown'}</div>;
};

// ✅ Better - With proper TypeScript
interface User {
  profile?: {
    name?: string;
  };
}

const UserProfile = ({ user }: { user: User }) => {
  return <div>{user?.profile?.name ?? 'Unknown'}</div>;
};
```

2. **Array operations on undefined:**
```typescript
// ❌ Wrong
const items = data.items;
items.map(item => ...); // Crashes if data.items is undefined

// ✅ Correct
const items = data?.items ?? [];
items.map(item => ...);

// ✅ With error handling
if (!data?.items?.length) {
  return <EmptyState />;
}
return data.items.map(item => ...);
```

### Error: "Too many re-renders"

**Symptoms:**
```
Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.
```

**Common Causes & Solutions:**

1. **State update in render:**
```typescript
// ❌ Wrong - Causes infinite loop
const Component = () => {
  const [count, setCount] = useState(0);
  setCount(count + 1); // State update during render
  return <div>{count}</div>;
};

// ✅ Correct - Update in effect or handler
const Component = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(prev => prev + 1);
  }, []); // Runs once
  
  return <div>{count}</div>;
};
```

2. **Incorrect event handler:**
```typescript
// ❌ Wrong - Immediately invokes function
<button onClick={handleClick()}>Click</button>

// ✅ Correct - Pass function reference
<button onClick={handleClick}>Click</button>

// ✅ With parameters
<button onClick={() => handleClick(id)}>Click</button>
```

### Error: "Invalid hook call"

**Symptoms:**
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Solutions:**

```typescript
// ❌ Wrong - Hook in conditional
const Component = ({ showData }) => {
  if (showData) {
    const [data, setData] = useState(); // Invalid
  }
};

// ❌ Wrong - Hook in callback
const Component = () => {
  const handleClick = () => {
    const [state, setState] = useState(); // Invalid
  };
};

// ✅ Correct - Hook at top level
const Component = ({ showData }) => {
  const [data, setData] = useState();
  
  if (!showData) {
    return null;
  }
  
  return <div>{data}</div>;
};
```

---

## Server-Side Runtime Errors

### Error: "Dynamic server usage: headers"

**Symptoms:**
```
Error: Dynamic server usage: Page couldn't be rendered statically because it used `headers`.
```

**Solutions:**

1. **Mark route as dynamic:**
```typescript
// app/api/route/page.tsx
export const dynamic = 'force-dynamic';

// Or for specific revalidation
export const revalidate = 60; // Revalidate every 60 seconds
```

2. **Use proper async handling:**
```typescript
// ❌ Wrong - Missing async
export default function Page() {
  const headersList = headers(); // Error
  return <div>...</div>;
}

// ✅ Correct - Server component with async
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = headers();
  const userAgent = headersList.get('user-agent');
  return <div>User Agent: {userAgent}</div>;
}
```

### Error: "Module not found in production"

**Symptoms:**
```
Error: Cannot find module '/app/.next/server/app/page.js'
```

**Solutions:**

1. **Check build output:**
```bash
# Verify build completes
npm run build

# Check .next directory
ls -la .next/server/app/
```

2. **Clear cache and rebuild:**
```bash
rm -rf .next
npm run build
npm run start
```

3. **Check dynamic imports:**
```typescript
// ❌ Wrong - Variable in dynamic import
const module = await import(moduleName); // Fails in production

// ✅ Correct - Static path
const module = await import('./modules/specific-module');

// ✅ For dynamic paths, use explicit mapping
const modules = {
  'module1': () => import('./modules/module1'),
  'module2': () => import('./modules/module2'),
};
const module = await modules[moduleName]();
```

---

## Hydration Errors

### Error: "Hydration failed because initial UI does not match"

**Symptoms:**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**Common Causes & Solutions:**

1. **Client-only values in SSR:**
```typescript
// ❌ Wrong - Different on server vs client
const Component = () => {
  return <div>{Math.random()}</div>; // Different each render
};

// ✅ Correct - Consistent rendering
const Component = () => {
  const [randomValue, setRandomValue] = useState<number>();
  
  useEffect(() => {
    setRandomValue(Math.random());
  }, []);
  
  return <div>{randomValue ?? 'Loading...'}</div>;
};
```

2. **Date/Time rendering:**
```typescript
// ❌ Wrong - Timezone differences
const Component = () => {
  return <div>{new Date().toLocaleString()}</div>;
};

// ✅ Correct - Consistent formatting
import { format } from 'date-fns';

const Component = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>;
  }
  
  return <div>{format(new Date(), 'PPP')}</div>;
};
```

3. **Browser-only APIs:**
```typescript
// ❌ Wrong - localStorage in SSR
const Component = () => {
  const theme = localStorage.getItem('theme'); // Error on server
  return <div className={theme}>...</div>;
};

// ✅ Correct - Check for client
const Component = () => {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  
  return <div className={theme}>...</div>;
};
```

### Hydration Error Debugging

**Enable detailed hydration errors:**
```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
  experimental: {
    reactHydrationReact: true,
  },
};
```

**Use suppressHydrationWarning sparingly:**
```typescript
// Only for truly dynamic content
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

---

## API Route Errors

### Error: "API resolved without sending a response"

**Symptoms:**
```
API resolved without sending a response for /api/users, this may result in stalled requests.
```

**Solutions:**

```typescript
// ❌ Wrong - Missing response
export async function GET(request: Request) {
  const data = await fetchData();
  // Forgot to return response
}

// ✅ Correct - Always return Response
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### Error: "Body exceeded limit"

**Symptoms:**
```
Error: Body exceeded 1mb limit
```

**Solutions:**

1. **Increase body size limit:**
```typescript
// app/api/upload/route.ts
export const maxDuration = 60; // Maximum allowed by Vercel
export const dynamic = 'force-dynamic';

// For larger uploads, configure in next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

2. **Use streaming for large files:**
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Stream to storage instead of loading in memory
  const stream = file.stream();
  // Process stream...
}
```

---

## State Management Errors

### Error: "Cannot update a component while rendering another"

**Symptoms:**
```
Warning: Cannot update a component (`Parent`) while rendering a different component (`Child`)
```

**Solutions:**

```typescript
// ❌ Wrong - State update during render
const Child = ({ updateParent }) => {
  updateParent(newValue); // Causes warning
  return <div>Child</div>;
};

// ✅ Correct - Update in effect
const Child = ({ updateParent }) => {
  useEffect(() => {
    updateParent(newValue);
  }, [updateParent, newValue]);
  
  return <div>Child</div>;
};

// ✅ Better - Use callback pattern
const Child = ({ onMount }) => {
  useEffect(() => {
    onMount?.();
  }, [onMount]);
  
  return <div>Child</div>;
};
```

### Error: "State update on unmounted component"

**Symptoms:**
```
Warning: Can't perform a React state update on an unmounted component
```

**Solutions:**

```typescript
// ❌ Wrong - No cleanup
const Component = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    fetchData().then(setData); // May complete after unmount
  }, []);
  
  return <div>{data}</div>;
};

// ✅ Correct - With cleanup
const Component = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    let cancelled = false;
    
    fetchData().then(result => {
      if (!cancelled) {
        setData(result);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  return <div>{data}</div>;
};

// ✅ Better - With AbortController
const Component = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    const controller = new AbortController();
    
    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });
    
    return () => controller.abort();
  }, []);
  
  return <div>{data}</div>;
};
```

---

## Memory Leaks and Performance Issues

### Detecting Memory Leaks

**Chrome DevTools approach:**
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions in app
4. Take another snapshot
5. Compare snapshots for retained objects

**Common Memory Leak Patterns:**

1. **Event listeners not cleaned up:**
```typescript
// ❌ Wrong - Memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // No cleanup!
}, []);

// ✅ Correct - With cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [handleResize]);
```

2. **Timers not cleared:**
```typescript
// ❌ Wrong - Timer continues after unmount
useEffect(() => {
  setInterval(() => {
    updateData();
  }, 1000);
}, []);

// ✅ Correct - Clear timer
useEffect(() => {
  const timer = setInterval(() => {
    updateData();
  }, 1000);
  
  return () => clearInterval(timer);
}, [updateData]);
```

3. **Subscriptions not unsubscribed:**
```typescript
// ✅ Correct pattern for subscriptions
useEffect(() => {
  const subscription = dataService.subscribe(data => {
    setData(data);
  });
  
  return () => subscription.unsubscribe();
}, []);
```

---

## Error Boundary Implementation

### Creating an Error Boundary

```typescript
// app/components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to monitoring service
    if (typeof window !== 'undefined') {
      // Sentry, LogRocket, etc.
      logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary-fallback">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Using Error Boundaries

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary fallback={<ErrorFallback />}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Next.js Error Files

```typescript
// app/error.tsx - Catches client errors
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// app/global-error.tsx - Catches errors in root layout
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

---

## Runtime Error Prevention

### Development Practices

1. **Use TypeScript strictly:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

2. **Add runtime validation:**
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  profile: z.object({
    name: z.string(),
  }).optional(),
});

const validateUser = (data: unknown) => {
  try {
    return UserSchema.parse(data);
  } catch (error) {
    console.error('Invalid user data:', error);
    return null;
  }
};
```

3. **Use error monitoring:**
```typescript
// lib/monitoring.ts
export const captureError = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error captured:', error, context);
  }
};
```

---

## Debugging Tools

### Browser DevTools

```javascript
// Pause on exceptions
debugger; // Stops execution here

// Conditional breakpoints
if (user.id === 'specific-id') {
  debugger;
}

// Console methods
console.time('operation');
// ... code ...
console.timeEnd('operation');

console.table(arrayOfObjects);
console.trace(); // Show stack trace
```

### React DevTools

1. Install React Developer Tools extension
2. Use Profiler tab for performance issues
3. Use Components tab to inspect props/state

### Next.js Debug Mode

```bash
# Enable debug output
DEBUG=* npm run dev

# Specific debug namespaces
DEBUG=next:* npm run dev
DEBUG=prisma:* npm run dev
```

---

## When to Escalate

Escalate runtime errors when:
- Error occurs only in production
- Memory leak that can't be identified
- Intermittent errors that can't be reproduced
- Performance degradation over time
- Errors in third-party libraries

Include in escalation:
- Full error stack trace
- Browser/environment details
- Steps to reproduce
- Network/console logs
- Memory snapshots if applicable

---

*Last Updated: January 2025*
*Runtime Environment: Next.js 15 + React 19*
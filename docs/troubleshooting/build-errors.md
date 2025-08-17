# Build Errors Troubleshooting Guide

## TypeScript, ESLint, and Compilation Error Resolution

This guide helps you diagnose and fix build-time errors in the Taxomind application, including TypeScript compilation, ESLint violations, and Next.js build issues.

## Table of Contents
- [TypeScript Compilation Errors](#typescript-compilation-errors)
- [ESLint Violations](#eslint-violations)
- [React Hook Dependency Errors](#react-hook-dependency-errors)
- [Module Resolution Errors](#module-resolution-errors)
- [Next.js Build Errors](#nextjs-build-errors)
- [Prisma Type Generation Issues](#prisma-type-generation-issues)

---

## TypeScript Compilation Errors

### Error: "Type 'X' is not assignable to type 'Y'"

**Symptoms:**
```typescript
Type error: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
```

**Root Cause:** TypeScript strict mode requires explicit type handling.

**Solutions:**

1. **Add type guards:**
```typescript
// ❌ Wrong
const processUser = (userId: string) => { /* ... */ };
processUser(session?.user?.id); // Error: possibly undefined

// ✅ Correct - Option 1: Type guard
if (session?.user?.id) {
  processUser(session.user.id);
}

// ✅ Correct - Option 2: Non-null assertion (use carefully)
processUser(session!.user!.id);

// ✅ Correct - Option 3: Default value
processUser(session?.user?.id ?? '');
```

2. **Fix async function returns:**
```typescript
// ❌ Wrong
const getData = async () => {
  return db.user.findMany(); // Missing explicit return type
};

// ✅ Correct
const getData = async (): Promise<User[]> => {
  return db.user.findMany();
};
```

### Error: "Property does not exist on type"

**Symptoms:**
```typescript
Property 'customField' does not exist on type 'User'
```

**Solutions:**

1. **Regenerate Prisma types:**
```bash
npx prisma generate
```

2. **Extend types properly:**
```typescript
// types/extended.ts
import { User as PrismaUser } from '@prisma/client';

export interface ExtendedUser extends PrismaUser {
  customField?: string;
}
```

3. **Use type assertions:**
```typescript
const user = await db.user.findUnique({ where: { id } }) as ExtendedUser;
```

### Error: "Cannot use 'any' type"

**Symptoms:**
```
@typescript-eslint/no-explicit-any: Unexpected any. Specify a different type
```

**Solutions:**

```typescript
// ❌ Wrong
const processData = (data: any) => { /* ... */ };

// ✅ Correct - Define specific type
interface DataPayload {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

const processData = (data: DataPayload) => { /* ... */ };

// ✅ For truly dynamic data
const processDynamic = (data: unknown) => {
  // Type narrowing
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // Safe to use
  }
};
```

---

## ESLint Violations

### Error: "No console statements allowed"

**Symptoms:**
```
Unexpected console statement. eslint(no-console)
```

**Solutions:**

```typescript
// ❌ Wrong
console.log('Debug info');

// ✅ Correct - Use proper logging
import { logger } from '@/lib/logger';
logger.info('Debug info');

// ✅ For development only
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('Dev only debug');
}
```

### Error: "Import order violation"

**Symptoms:**
```
`@/lib/db` import should occur before import of `./components`
```

**Solutions:**

```typescript
// ❌ Wrong order
import { Button } from './components';
import { db } from '@/lib/db';
import React from 'react';

// ✅ Correct order (per .eslintrc.js)
import React from 'react';                    // 1. Built-in modules
import { useRouter } from 'next/navigation';  // 2. External modules
import { db } from '@/lib/db';               // 3. Internal modules
import { Button } from './components';        // 4. Relative imports
import styles from './styles.module.css';     // 5. Style imports
```

### Error: "Cognitive complexity too high"

**Symptoms:**
```
sonarjs/cognitive-complexity: Function has a cognitive complexity of 20 (threshold: 15)
```

**Solutions:**

```typescript
// ❌ Complex function
const processOrder = (order: Order) => {
  if (order.status === 'pending') {
    if (order.payment) {
      if (order.payment.method === 'card') {
        // ... nested logic
      }
    }
  }
  // More nested conditions...
};

// ✅ Refactored
const isCardPayment = (payment?: Payment) => 
  payment?.method === 'card';

const isPendingOrder = (order: Order) => 
  order.status === 'pending';

const processOrder = (order: Order) => {
  if (!isPendingOrder(order)) return;
  if (!isCardPayment(order.payment)) return;
  
  processCardOrder(order);
};
```

---

## React Hook Dependency Errors

### Error: "React Hook useEffect has missing dependencies"

**Symptoms:**
```
React Hook useEffect has missing dependency: 'fetchData'. Either include it or remove the dependency array
```

**Complete Solution Guide:**

```typescript
// ❌ Wrong - Missing dependencies
const MyComponent = ({ userId }: Props) => {
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    const result = await getUserData(userId);
    setData(result);
  };
  
  useEffect(() => {
    fetchData(); // fetchData uses userId but not in deps
  }, []); // Missing fetchData and userId
};

// ✅ Solution 1: useCallback + dependencies
const MyComponent = ({ userId }: Props) => {
  const [data, setData] = useState(null);
  
  const fetchData = useCallback(async () => {
    const result = await getUserData(userId);
    setData(result);
  }, [userId]); // Include all deps in useCallback
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Include memoized function
};

// ✅ Solution 2: Move function inside effect
const MyComponent = ({ userId }: Props) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const result = await getUserData(userId);
      setData(result);
    };
    
    fetchData();
  }, [userId]); // Only external dependencies
};

// ✅ Solution 3: Disable for static functions
useEffect(() => {
  stableApiCall(); // Known to never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally empty
```

### Error: "useCallback/useMemo missing dependencies"

**Solutions:**

```typescript
// ❌ Wrong
const expensiveCalculation = useMemo(() => {
  return data.filter(item => item.userId === userId);
}, [data]); // Missing userId

// ✅ Correct
const expensiveCalculation = useMemo(() => {
  return data.filter(item => item.userId === userId);
}, [data, userId]); // Include all variables used
```

---

## Module Resolution Errors

### Error: "Cannot find module '@/components/...'"

**Diagnostic Steps:**

1. **Check tsconfig.json paths:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

2. **Verify file exists:**
```bash
ls -la components/ui/button.tsx
```

3. **Check import statement:**
```typescript
// ❌ Wrong
import Button from '@/components/ui/Button'; // Case sensitive!

// ✅ Correct
import { Button } from '@/components/ui/button';
```

### Error: "Module parse failed: Unexpected token"

**Solutions:**

1. **Check for JSX in .ts files:**
```typescript
// ❌ Wrong: JSX in .ts file
// file: utils.ts
export const Component = () => <div>Hello</div>;

// ✅ Correct: Rename to .tsx
// file: utils.tsx
export const Component = () => <div>Hello</div>;
```

2. **Verify Next.js config for custom file types:**
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};
```

---

## Next.js Build Errors

### Error: "Error occurred prerendering page"

**Symptoms:**
```
Error occurred prerendering page "/dashboard". Read more: https://nextjs.org/docs/messages/prerender-error
```

**Solutions:**

1. **Check for client-only code in server components:**
```typescript
// ❌ Wrong in server component
const ServerComponent = () => {
  const width = window.innerWidth; // window is not defined
  return <div>{width}</div>;
};

// ✅ Correct - Use client component
'use client';
const ClientComponent = () => {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  
  return <div>{width}</div>;
};
```

2. **Handle async data properly:**
```typescript
// ❌ Wrong
export default function Page({ params }) {
  const data = await fetchData(params.id); // Missing async
  return <div>{data}</div>;
}

// ✅ Correct
export default async function Page({ params }: { params: { id: string } }) {
  const data = await fetchData(params.id);
  return <div>{data}</div>;
}
```

### Error: "Failed to compile: Dynamic server usage"

**Solutions:**

```typescript
// For dynamic routes, export dynamic options
export const dynamic = 'force-dynamic';
// or
export const revalidate = 0;

// For static generation with params
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    id: post.id,
  }));
}
```

---

## Prisma Type Generation Issues

### Error: "Cannot find namespace 'Prisma'"

**Solutions:**

1. **Generate Prisma client:**
```bash
npx prisma generate
```

2. **Check imports:**
```typescript
// ❌ Wrong
import { PrismaClient } from 'prisma';

// ✅ Correct
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
```

### Error: "Unknown argument in prisma query"

**Solutions:**

```typescript
// ❌ Wrong - Using wrong relation name
const user = await db.user.findUnique({
  where: { id },
  include: {
    posts: true, // Should be 'Post' based on schema
  },
});

// ✅ Correct - Check schema for exact names
const user = await db.user.findUnique({
  where: { id },
  include: {
    Post: true, // Matches model name in schema
  },
});
```

---

## Build Error Prevention Checklist

### Pre-commit Checks
```bash
#!/bin/bash
# save as .git/hooks/pre-commit

echo "Running pre-commit checks..."

# TypeScript check
echo "Checking TypeScript..."
npx tsc --noEmit || exit 1

# ESLint check
echo "Running ESLint..."
npm run lint || exit 1

# Build test
echo "Testing build..."
npm run build || exit 1

echo "All checks passed!"
```

### Continuous Integration Checks
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      
      - name: Install dependencies
        run: npm ci
        
      - name: Generate Prisma Client
        run: npx prisma generate
        
      - name: TypeScript Check
        run: npx tsc --noEmit
        
      - name: ESLint
        run: npm run lint
        
      - name: Build
        run: npm run build
```

---

## Common Build Error Patterns

### Pattern 1: Circular Dependencies
```
Warning: Circular dependency detected
```

**Fix:** Refactor shared code to separate module:
```typescript
// ❌ Wrong
// file: a.ts
import { funcB } from './b';
export const funcA = () => funcB();

// file: b.ts
import { funcA } from './a';
export const funcB = () => funcA();

// ✅ Correct
// file: shared.ts
export const sharedFunc = () => { /* ... */ };

// file: a.ts
import { sharedFunc } from './shared';
// file: b.ts
import { sharedFunc } from './shared';
```

### Pattern 2: Async Component Errors
```
Error: Objects are not valid as a React child
```

**Fix:** Properly handle promises in components:
```typescript
// ❌ Wrong
const Component = () => {
  const data = fetchData(); // Returns Promise
  return <div>{data}</div>; // Can't render Promise
};

// ✅ Correct
const Component = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{data}</div>;
};
```

---

## Build Optimization Tips

1. **Enable SWC minification:**
```javascript
// next.config.js
module.exports = {
  swcMinify: true,
};
```

2. **Optimize imports:**
```typescript
// ❌ Slow
import _ from 'lodash';

// ✅ Fast
import debounce from 'lodash/debounce';
```

3. **Use production build for testing:**
```bash
npm run build
npm run start # Test production build
```

---

## When to Escalate

Escalate build issues when:
- Build succeeds locally but fails in CI/CD
- TypeScript errors that seem incorrect
- Build time exceeds 10 minutes
- Memory errors during build
- Mysterious module resolution failures

Include in escalation:
- Full error output
- Package.json dependencies
- Node/npm versions
- Recent changes to configuration

---

*Last Updated: January 2025*
*Build System Version: Next.js 15 + TypeScript 5.x*
# ✅ Bug Fix: Server-Only Auth Import Error

## 🐛 Problem

The application was failing to build with the following error:

```
⨯ ./auth.ts:2:1
Ecmascript file had an error
  1 | // CRITICAL: Mark this file as server-only to prevent client-side bundling
> 2 | import "server-only";
    | ^^^^^^^^^^^^^^^^^^^^^

You're importing a component that needs "server-only".
That only works in a Server Component which is not supported in the pages/ directory.

Invalid import
'server-only' cannot be imported from a Client Component module.
```

## 🔍 Root Cause

The newly created `MobileLandscapeHeader` component was a **client component** (`'use client'`) but was importing `signOut` directly from `@/auth`:

```tsx
// ❌ WRONG - Client component importing server-only module
'use client';

import { signOut } from '@/auth';  // auth.ts has "server-only" import

const handleLogout = async () => {
  await signOut({ redirectTo: '/auth/login' });
};
```

Since `auth.ts` is marked with `import "server-only"`, it cannot be imported by client components. This caused the build to fail.

## ✅ Solution

Changed the import to use the **server action** `logout` from `@/actions/logout` instead:

```tsx
// ✅ CORRECT - Client component using server action
'use client';

import { logout } from '@/actions/logout';  // Server action (safe for client components)

const handleLogout = async () => {
  await logout();
};
```

## 📝 Changes Made

### File: `app/(homepage)/_components/mobile-landscape-header.tsx`

**Before:**
```tsx
import { signOut } from '@/auth';

const handleLogout = useCallback(async () => {
  try {
    await signOut({ redirectTo: '/auth/login' });
  } catch (error) {
    console.error('Logout failed:', error);
  }
}, []);
```

**After:**
```tsx
import { logout } from '@/actions/logout';

const handleLogout = useCallback(async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout failed:', error);
  }
}, []);
```

## 🎯 Why This Works

### Server-Only Modules vs Server Actions

| Module Type | Can Import in Client? | Use Case |
|-------------|----------------------|----------|
| **Server-Only** (`auth.ts`) | ❌ NO | Server-side only code (auth config, DB) |
| **Server Actions** (`actions/logout.ts`) | ✅ YES | Functions that can be called from client |

### The logout Action

The `logout` action in `actions/logout.ts` is a **server action** that internally calls `signOut`:

```typescript
// actions/logout.ts (Server Action)
'use server';

import { signOut } from '@/auth';

export const logout = async () => {
  await signOut();
};
```

This pattern is correct because:
1. **Server actions** (`'use server'`) can import server-only modules
2. **Client components** can call server actions
3. Server actions act as a bridge between client and server-only code

## ✅ Validation

### ESLint Check
```bash
npm run lint -- --file app/(homepage)/_components/mobile-landscape-header.tsx
✔ No ESLint warnings or errors
```

### Build Check
The application now builds without the "server-only" error.

## 📚 Best Practices for Next.js 15

### ✅ DO: Use Server Actions from Client Components

```tsx
// Client Component
'use client';

import { logout } from '@/actions/logout';  // ✅ Server action

const handleClick = async () => {
  await logout();  // Calls server action
};
```

### ❌ DON'T: Import Server-Only Modules in Client Components

```tsx
// Client Component
'use client';

import { signOut } from '@/auth';  // ❌ Server-only module
import { db } from '@/lib/db';     // ❌ Server-only module

// This will FAIL at build time
```

### ✅ DO: Import Server-Only Modules in Server Components/Actions

```tsx
// Server Component (no 'use client' directive)
import { auth } from '@/auth';  // ✅ OK in server component

export default async function Page() {
  const session = await auth();
  // ...
}
```

```tsx
// Server Action
'use server';

import { signOut } from '@/auth';  // ✅ OK in server action
import { db } from '@/lib/db';     // ✅ OK in server action

export const logout = async () => {
  await signOut();
};
```

## 🔧 Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                 Client Component                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 'use client'                                      │  │
│  │                                                   │  │
│  │ import { logout } from '@/actions/logout'  ✅    │  │
│  │                                                   │  │
│  │ const handleLogout = () => logout()              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Calls server action
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Server Action                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 'use server'                                      │  │
│  │                                                   │  │
│  │ import { signOut } from '@/auth'  ✅             │  │
│  │                                                   │  │
│  │ export const logout = async () => {              │  │
│  │   await signOut({ redirectTo: '/auth/login' })   │  │
│  │ }                                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Uses server-only module
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Server-Only Module                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ import "server-only"                             │  │
│  │                                                   │  │
│  │ export const { auth, signIn, signOut } = ...     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🎓 Key Takeaways

1. **Always use server actions** when calling server-only code from client components
2. **Never import directly** from modules marked with `"server-only"` in client components
3. **Check existing patterns** - other header components use `logout` action, not `signOut` directly
4. **ESLint validation** - Always run lint after changes to catch these issues early

## 📊 Impact

- ✅ Build now succeeds
- ✅ No functionality lost (logout still works)
- ✅ Follows Next.js 15 best practices
- ✅ Consistent with other header components
- ✅ Zero breaking changes

---

**Fixed**: January 2025
**Status**: ✅ **RESOLVED**
**Build**: ✅ **PASSING**

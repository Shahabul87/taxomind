# Logout Error Fix: NEXT_REDIRECT Solution

## Problem
When logging out, you see this error in the terminal:
```
Error: NEXT_REDIRECT
    at getRedirectError (../../../src/client/components/redirect.ts:21:16)
    at redirect (../../../src/client/components/redirect.ts:47:8)
    at async logout (actions/logout.ts:7:4)
```

## Root Cause
This happens because:
1. **Server Actions + Redirects** don't play well together in Next.js App Router
2. **NextAuth's `signOut()` with `redirect: true`** internally throws a `NEXT_REDIRECT` error
3. This is **not a real error** - it's how Next.js handles redirects internally
4. But it clutters the console and can be confusing

## ✅ Solution 1: Updated Server Action (Current Fix)

```typescript
// actions/logout.ts
"use server";

import { signOut } from "@/auth";

export const logout = async () => {
  // Sign out without redirect to avoid NEXT_REDIRECT error in console
  await signOut({ redirect: false });
  
  // Return success - let client handle redirect
  return { success: true };
};
```

```typescript
// components/auth/logout-button.tsx
const onClick = async () => {
  try {
    setIsLoading(true);
    const result = await logout();
    
    if (result?.success) {
      // Client-side redirect after successful logout
      router.push("/");
      router.refresh(); // Refresh to clear any cached data
    }
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    setIsLoading(false);
  }
};
```

## ✅ Solution 2: Pure Client-Side Approach (Recommended)

```typescript
// components/auth/enhanced-logout-button.tsx
"use client";

import { signOut } from "next-auth/react";

export const EnhancedLogoutButton = ({ children, redirectTo = "/" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      
      // Using NextAuth's client-side signOut - no NEXT_REDIRECT errors
      await signOut({ 
        callbackUrl: redirectTo,
        redirect: true 
      });
      
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span onClick={onClick}>
      {isLoading ? "Signing out..." : children}
    </span>
  );
};
```

## ✅ Solution 3: Custom Hook Approach

```typescript
// hooks/use-logout.ts
import { signOut } from "next-auth/react";
import { useState } from "react";

export const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const logout = async (redirectTo: string = "/") => {
    try {
      setIsLoading(true);
      await signOut({ 
        callbackUrl: redirectTo,
        redirect: true 
      });
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = redirectTo; // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
};

// Usage in any component:
function MyComponent() {
  const { logout, isLoading } = useLogout();
  
  return (
    <button onClick={() => logout("/login")} disabled={isLoading}>
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
```

## 🔄 Migration Guide

### Replace Server Action Approach:
```typescript
// ❌ OLD (causes NEXT_REDIRECT error)
import { logout } from "@/actions/logout";

const handleLogout = async () => {
  await logout(); // This causes the error
};

// ✅ NEW (clean client-side)
import { signOut } from "next-auth/react";

const handleLogout = async () => {
  await signOut({ callbackUrl: "/" });
};
```

### Update Your Components:
```typescript
// ❌ OLD
import { LogoutButton } from "@/components/auth/logout-button";

// ✅ NEW
import { EnhancedLogoutButton } from "@/components/auth/enhanced-logout-button";

// Or use the hook
import { useLogout } from "@/hooks/use-logout";
```

## 🎯 Why This Happens

1. **Next.js App Router** uses errors internally for control flow
2. **`redirect()`** function throws a `NEXT_REDIRECT` error to stop execution
3. **Server Actions** + redirects = visible errors in console
4. **Client-side redirects** don't have this issue

## 🚀 Best Practices

### ✅ Do:
- Use **client-side `signOut()`** from `next-auth/react`
- Handle redirects on the **client side**
- Use **loading states** for better UX
- Provide **fallback redirects** for error cases

### ❌ Don't:
- Use **server actions** for logout with redirects
- Ignore the **NEXT_REDIRECT** error (fix it properly)
- Use **`redirect()`** in server actions unnecessarily

## 🧪 Testing Your Fix

1. **Test logout functionality:**
   ```bash
   # Login to your app
   # Click logout button
   # Check console - should be clean
   # Verify redirect works properly
   ```

2. **Check for errors:**
   ```bash
   # Should NOT see:
   Error: NEXT_REDIRECT
   
   # Should see clean logout
   ```

3. **Test different scenarios:**
   - Logout from different pages
   - Logout when already logged out
   - Network failures during logout

## 📝 Summary

**Problem:** `NEXT_REDIRECT` error in console during logout  
**Cause:** Server Action + NextAuth redirect conflict  
**Solution:** Use client-side `signOut()` from `next-auth/react`  

**Result:** ✅ Clean logout without console errors!

Your logout now works smoothly without cluttering the console with fake errors.
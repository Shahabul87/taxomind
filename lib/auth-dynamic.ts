import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

/**
 * Robust authentication for dynamic API routes in Next.js 15
 * Uses the correct cookie names found in production
 */
export async function authenticateApiRoute(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {

    // Method 1: Try to get session token from cookies with correct names
    const cookieStore = await cookies();
    
    // Use the actual cookie names found in production
    const sessionTokenNames = [
      '__Secure-authjs.session-token',
      '__Host-authjs.csrf-token',
      'authjs.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token'
    ];
    
    let sessionToken: string | undefined;
    
    for (const tokenName of sessionTokenNames) {
      const token = cookieStore.get(tokenName);
      if (token?.value) {
        sessionToken = token.value;

        break;
      }
    }
    
    // Method 2: Try to get from Authorization header if no cookie
    if (!sessionToken && request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);

      }
    }
    
    if (!sessionToken) {

      return null;
    }
    
    // Decode the JWT token
    const decoded = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: process.env.NEXTAUTH_SALT || process.env.AUTH_SALT || '',
    });
    
    if (!decoded || !decoded.sub) {

      return null;
    }

    // Get user from database to ensure they still exist and are active
    const user = await db.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      }
    });
    
    if (!user) {

      return null;
    }
    
    if (!user.emailVerified) {

      return null;
    }

    return {
      id: user.id,
      email: user.email ?? '',
      name: user.name || undefined,
      role: user.role,
    };
    
  } catch (error: any) {
    logger.error("[AUTH_DYNAMIC] Authentication error:", error);
    return null;
  }
}

/**
 * Alternative authentication method using direct database lookup
 * Fallback when JWT decoding fails
 */
export async function authenticateBySession(): Promise<AuthenticatedUser | null> {
  try {

    const cookieStore = await cookies();
    
    // Look for session ID in cookies with correct names
    const sessionId = cookieStore.get('__Secure-authjs.session-token')?.value ||
                     cookieStore.get('authjs.session-token')?.value ||
                     cookieStore.get('next-auth.session-token')?.value ||
                     cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionId) {

      return null;
    }
    
    // Query the session table directly (schema: token, userId, expiresAt, ...)
    // Align with schema: AuthSession is the persisted session model
    const session = await (db as any).authSession.findUnique({
      where: { token: sessionId },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
      }
    });
    
    if (!session) {

      return null;
    }
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {

      return null;
    }
    
    // Fetch user separately
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      }
    });

    if (!user || !user.emailVerified) {

      return null;
    }

    return {
      id: user.id,
      email: user.email ?? '',
      name: user.name || undefined,
      role: user.role,
    };
    
  } catch (error: any) {
    logger.error("[AUTH_SESSION] Session authentication error:", error);
    return null;
  }
}

/**
 * Fallback to original NextAuth auth() function
 * Since we confirmed it works in production
 */
export async function authenticateWithOriginalAuth(): Promise<AuthenticatedUser | null> {
  try {
    console.log("[AUTH_ORIGINAL] Attempting original auth() function");
    
    const session = await auth();
    
    if (!session?.user?.id) {

      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || undefined,
      role: (session.user as any).role || "USER",
    };
    
  } catch (error: any) {
    logger.error("[AUTH_ORIGINAL] Original auth error:", error);
    return null;
  }
}

/**
 * Main authentication function that tries multiple methods
 */
export async function authenticateDynamicRoute(request?: NextRequest): Promise<AuthenticatedUser | null> {

  // Method 1: Try original auth() function first since it works
  let user = await authenticateWithOriginalAuth();
  
  // Method 2: Try JWT-based authentication if original fails
  if (!user) {

    user = await authenticateApiRoute(request);
  }
  
  // Method 3: Try session-based authentication if JWT fails
  if (!user) {

    user = await authenticateBySession();
  }
  
  if (user) {

  } else {
}
  return user;
} 
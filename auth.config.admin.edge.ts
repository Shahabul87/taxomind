// Edge-compatible admin auth configuration
// Used by middleware and other Edge runtimes to understand admin sessions
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getAdminCookieConfig, SessionDurations } from "@/lib/security/cookie-config";
import type { AdminRole } from "@prisma/client";

// IMPORTANT: This mirrors admin settings from auth.config.admin.ts but remains Edge-safe.
export default {
  providers: [
    // Admins use only credentials; no OAuth in Edge config
    Credentials({
      async authorize() {
        // Edge runtime does not perform DB calls; real auth happens server-side
        return null;
      }
    })
  ],
  // Admin session configuration - shorter duration
  session: {
    strategy: "jwt",
    maxAge: SessionDurations.admin.maxAge, // 4 hours
    updateAge: SessionDurations.admin.updateAge, // 30 minutes
  },
  jwt: {
    maxAge: SessionDurations.admin.maxAge,
  },
  // Admin-specific cookies (admin-session-token)
  cookies: getAdminCookieConfig({
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  }),
  // Admin auth pages
  pages: {
    signIn: "/admin/auth/login",
    error: "/admin/auth/error",
  },
  // CRITICAL: Callbacks needed in Edge runtime to extract custom JWT fields
  callbacks: {
    async session({ token, session }) {
      // Extract custom fields from JWT token into session
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as AdminRole;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.isOAuth = token.isOAuth as boolean;
      }
      return session;
    },
  },
  // CRITICAL: Use same secret as auth.config.admin.ts to allow token verification at edge
  // This MUST match the secret used during JWT encryption
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.ADMIN_JWT_SECRET || (process.env.AUTH_SECRET + '-admin') || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;


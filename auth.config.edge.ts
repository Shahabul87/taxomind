// Edge-compatible auth configuration
// This file is used by middleware which runs in Edge Runtime
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DefaultCookieConfig } from "@/lib/security/cookie-config";

// Edge-compatible configuration
// IMPORTANT: This must match the configuration in auth.ts for session continuity
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    // Credentials provider for edge runtime checking
    Credentials({
      async authorize() {
        // Edge runtime can't do DB calls, actual auth happens in auth.ts
        return null;
      }
    })
  ],
  // Session configuration - MUST match auth.ts
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // JWT configuration - MUST match auth.ts
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Cookie configuration - MUST match auth.ts
  cookies: DefaultCookieConfig,
  // Callbacks for Edge Runtime
  callbacks: {
    async jwt({ token }) {
      // In edge runtime, just pass through the token
      // The actual token enrichment happens in auth.ts
      return token;
    },
    async session({ session, token }) {
      // Pass token data to session
      if (token && session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.email) {
          session.user.email = token.email as string;
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
        if (token.role) {
          if ('role' in session.user) {
            (session.user as { role?: string }).role = token.role as string;
          }
        }
      }
      return session;
    }
  },
  // Auth pages
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  // Trust host for production
  trustHost: true,
  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',
  // CRITICAL: Use the same secret as auth.ts for JWT decryption
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
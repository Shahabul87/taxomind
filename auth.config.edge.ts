import type { NextAuthConfig } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DefaultCookieConfig } from "@/lib/security/cookie-config";

// Edge-compatible auth config (no credentials provider)
// This is used in middleware to avoid Node.js API issues
// It shares the same OAuth providers as the main config
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    // Note: No Credentials provider here to avoid bcryptjs in Edge Runtime
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  trustHost: true,
  // Include secure cookie configuration for edge runtime
  cookies: DefaultCookieConfig,
  useSecureCookies: process.env.NODE_ENV === 'production',
} satisfies NextAuthConfig;
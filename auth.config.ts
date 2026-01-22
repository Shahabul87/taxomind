import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { encode, decode } from "next-auth/jwt";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
// import { DefaultCookieConfig } from "@/lib/security/cookie-config";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      allowDangerousEmailAccountLinking: false,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          // Use dynamic import to avoid Edge Runtime issues
          try {
            const { verifyPassword } = await import("@/lib/passwordUtils");
            const passwordsMatch = await verifyPassword(
              password,
              user.password,
            );

            if (passwordsMatch) return user;
          } catch (error) {
            console.error("Password verification failed:", error);
            return null;
          }
        }

        return null;
      }
    })
  ],
  // Session configuration to match across auth.ts and edge config
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days matching session
    encode,
    // Custom decode to handle secret rotation/mismatch errors gracefully
    async decode(params) {
      try {
        return await decode(params);
      } catch (error) {
        // If decryption fails (secret changed), return null to clear the invalid session
        // This prevents "no matching decryption secret" errors
        if (error instanceof Error && error.message.includes("no matching decryption secret")) {
          console.warn("[Auth] JWT decryption failed - clearing invalid session");
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
  },
  // Cookie configuration (simplified for debugging)
  // cookies: DefaultCookieConfig,
  useSecureCookies: process.env.NODE_ENV === 'production',
  // Trust host
  trustHost: true,
  // Secret for JWT signing
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig

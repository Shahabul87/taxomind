import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { DefaultCookieConfig } from "@/lib/security/cookie-config";

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
          } catch (error: any) {
            console.error("Password verification failed:", error);
            return null;
          }
        }

        return null;
      }
    })
  ],
  // Secure cookie configuration
  cookies: DefaultCookieConfig,
  // Configure for secure environments
  useSecureCookies: process.env.NODE_ENV === 'production',
} satisfies NextAuthConfig
import NextAuth from "next-auth"
import { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import authConfig from "@/auth.config";
import { getUserById } from "@/data/user";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { getAccountByUserId } from "@/data/account";
import { checkEnvironmentVariables } from "@/lib/env-check";
import { getRedirectUrl } from "@/routes";

// Check environment variables on startup
checkEnvironmentVariables();

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },
  callbacks: {
    async redirect({ url, baseUrl, token }) {
      // Handle role-based redirects after login
      if (url === baseUrl || url === `${baseUrl}/` || url.includes('/dashboard/user')) {
        // If we have a token with role information, redirect based on role
        if (token?.role) {
          const roleBasedUrl = getRedirectUrl(token.role as string);
          return `${baseUrl}${roleBasedUrl}`;
        }
        // If no role yet, try to get user info
        if (token?.sub) {
          try {
            const user = await getUserById(token.sub);
            if (user?.role) {
              const roleBasedUrl = getRedirectUrl(user.role);
              return `${baseUrl}${roleBasedUrl}`;
            }
          } catch (error) {
            console.error("Error fetching user for redirect:", error);
          }
        }
      }
      
      // If the URL is already an absolute URL (contains the baseUrl), use it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If it's a relative URL, combine it with the baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Default fallback to baseUrl
      return baseUrl;
    },
    async signIn({ user, account }) {
      // Ensure we return early if missing critical data
      if (!user || !user.id) {
        console.log("Missing user data, rejecting sign in");
        return false;
      }
      
      console.log("signIn callback triggered:", { 
        provider: account?.provider,
        userId: user?.id,
        email: user?.email 
      });
      
      if (account?.provider !== "credentials") {
        console.log("OAuth login, allowing sign in");
        return true;
      }
      
      try {
        const existingUser = await getUserById(user.id);
        
        // Handle case where user might not be found
        if (!existingUser) {
          console.log("User not found in database, rejecting sign in");
          return false;
        }
        
        console.log("Existing user in signIn callback:", {
          id: existingUser.id,
          emailVerified: !!existingUser.emailVerified,
          isTwoFactorEnabled: existingUser.isTwoFactorEnabled
        });

        if (!existingUser?.emailVerified) {
          console.log("Email not verified, rejecting sign in");
          return false;
        }

        if (existingUser.isTwoFactorEnabled) {
          console.log("2FA is enabled, checking confirmation");
          try {
            const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
            console.log("2FA confirmation:", !!twoFactorConfirmation);

            if (!twoFactorConfirmation) {
              console.log("No 2FA confirmation found, rejecting sign in");
              return false;
            }

            await db.twoFactorConfirmation.delete({
              where: { id: twoFactorConfirmation.id }
            });
            console.log("2FA confirmation deleted, allowing sign in");
          } catch (twoFactorError) {
            console.error("Error during 2FA check:", twoFactorError);
            return false;
          }
        }

        console.log("Authentication successful, allowing sign in");
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ token, session }) {
      if (!token || !session) {
        console.error("Missing token or session in session callback");
        return session;
      }
      
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = !!token.isTwoFactorEnabled;
        session.user.name = token.name || "";
        session.user.email = token.email || "";
        session.user.isOAuth = !!token.isOAuth;
      }
      
      return session;
    },
    async jwt({ token }) {
      if (!token || !token.sub) return token;

      try {
        const existingUser = await getUserById(token.sub);

        if (!existingUser) return token;

        const existingAccount = await getAccountByUserId(
          existingUser.id
        );

        token.isOAuth = !!existingAccount;
        token.name = existingUser.name || null;
        token.email = existingUser.email || null;
        token.role = existingUser.role;
        token.isTwoFactorEnabled = !!existingUser.isTwoFactorEnabled;
        
        return token;
      } catch (error) {
        console.error("Error in JWT callback:", error);
        return token;
      }
    }
  },
  adapter: PrismaAdapter(db),
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  ...authConfig,
});
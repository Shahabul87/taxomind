import NextAuth from "next-auth"
import authConfig from "@/auth.config";

// MINIMAL TEST CONFIG - Isolating Configuration error
// Removed: adapter, events, callbacks, extra imports

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  // Debug enabled to help troubleshoot
  debug: true,
});

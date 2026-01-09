import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * API route to clear all auth-related cookies
 * Use this when experiencing JWT decryption errors due to secret changes
 * GET /api/auth/clear-session
 */
export async function GET() {
  const cookieStore = await cookies();

  // List of auth-related cookies to clear
  const authCookies = [
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.session-token",
    "__Secure-authjs.csrf-token",
    "__Secure-authjs.callback-url",
    "__Host-authjs.csrf-token",
    "next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.csrf-token",
  ];

  // Clear each cookie
  for (const cookieName of authCookies) {
    try {
      cookieStore.delete(cookieName);
    } catch {
      // Cookie might not exist, ignore
    }
  }

  return NextResponse.json(
    {
      success: true,
      message: "Auth session cleared. Please refresh the page."
    },
    {
      status: 200,
      headers: {
        // Also set cookies to expire via headers as backup
        "Set-Cookie": authCookies.map(name =>
          `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
        ).join(", ")
      }
    }
  );
}

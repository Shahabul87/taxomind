import type { Metadata } from 'next'
import './globals.css'
import clsx from "clsx";
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

// NOTE: Disabled Google Fonts in build to support offline/restricted builds.
// Use Tailwind's default font stack or self-host fonts via next/font/local if needed.

import { auth } from '@/auth'
import { ConfettiProvider } from '@/components/providers/confetti-provider';
import { Providers } from "@/components/providers";
// PageBackground removed - using direct bg-background on body
import { MainHeader } from './(homepage)/main-header';
import { currentUser } from '@/lib/auth';
import LayoutWithSidebar from '@/components/layout/layout-with-sidebar';
import ClientToaster from '@/components/client-toaster';
import { Suspense } from 'react';
import { SAMGlobalProvider } from '@/components/sam/sam-global-provider';
import { SAMGlobalAssistant } from '@/components/sam/sam-global-assistant';
import { SAMContextManager } from '@/components/sam/sam-context-manager';
import { CSSErrorMonitorClient } from '@/components/dev/css-error-monitor-client';

// Use auto dynamic rendering (Next.js will determine optimal rendering)
// export const dynamic = 'force-dynamic'; // Commented out to fix SSR bailout issue

export const metadata: Metadata = {
  title: 'Taxomind - Intelligent Learning Platform',
  description: 'Transform your learning journey with AI-powered education. Adaptive courses, real-time analytics, and personalized learning paths.',
  keywords: 'AI learning, adaptive education, intelligent tutoring, online courses, personalized learning, educational technology',
  authors: [{ name: 'Taxomind Team' }],
  openGraph: {
    title: 'Taxomind - Where Minds Are Forged Through Intelligence',
    description: 'Experience the future of education with our AI-powered learning platform',
    type: 'website',
    siteName: 'Taxomind',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taxomind - Intelligent Learning Platform',
    description: 'Transform your learning journey with AI-powered education',
  },
  robots: 'index, follow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Header Loading Fallback Component
function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-[50] bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative overflow-hidden">
        <div className="flex justify-between items-center h-14 sm:h-16 relative">
          {/* Logo */}
          <div className="flex items-center space-x-2 pl-8 md:pl-0">
            <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 bg-purple-400 rounded animate-pulse" />
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
              Taxomind
            </span>
          </div>
          
          {/* Right side skeleton */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-8 h-8 bg-slate-800/80 rounded-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-slate-800/80 rounded-lg animate-pulse"></div>
            <div className="hidden md:flex space-x-2">
              <div className="w-16 h-8 bg-slate-700 rounded-lg animate-pulse"></div>
              <div className="w-16 h-8 bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Async Header Component
async function AsyncHeader() {
  let user;
  
  try {
    user = await currentUser();
  } catch (error: any) {
    logger.error("Error fetching user:", error);
    user = null;
  }

  return <MainHeader user={user} />;
}

// Async Layout Component that handles user data
async function AsyncLayoutWithSidebar({ children }: { children: React.ReactNode }) {
  let user;
  
  try {
    user = await currentUser();
  } catch (error: any) {
    logger.error("Error fetching user for sidebar:", error);
    user = null;
  }

  return (
    <LayoutWithSidebar user={user}>
      {children}
    </LayoutWithSidebar>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use try-catch to handle any errors with auth()
  let session;

  try {
    session = await auth();
  } catch (error: any) {
    logger.error("Error fetching auth session:", error);
    session = null;
  }

  // Check if this is an admin or auth route
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // ROBUST AUTH ROUTE DETECTION: Check multiple sources
  const isAdminRoute = pathname.startsWith("/dashboard/admin") || pathname.startsWith("/admin");

  // Check both x-pathname header AND x-url fallback
  const xUrl = headersList.get("x-url") || "";
  const pathToCheck = pathname || xUrl;
  const isAuthRoute = pathToCheck.startsWith("/auth") ||
                      pathToCheck.includes("/auth/login") ||
                      pathToCheck.includes("/auth/register") ||
                      pathToCheck.includes("/auth/error");

  // DEBUG: Log route detection
  if (pathToCheck.includes('auth')) {
    console.log('[ROOT LAYOUT] Auth Route Detected:', {
      pathname,
      xUrl,
      pathToCheck,
      isAuthRoute
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash by applying theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={clsx(
        "min-h-screen transition-colors duration-300",
        "bg-background text-foreground"
      )}>
        <Providers session={session}>
          <ConfettiProvider />
          <ClientToaster />
          <SAMGlobalProvider>
            {/* Render header for auth routes AND non-admin routes */}
            {!isAdminRoute && (
              <div className="fixed top-0 left-0 right-0 z-[50]">
                <Suspense fallback={<HeaderFallback />}>
                  <AsyncHeader />
                </Suspense>
              </div>
            )}

            {/* Content rendering - all routes use direct background */}
            <SAMContextManager />

            {/* Conditional layout rendering based on route */}
            {isAuthRoute ? (
              // Auth routes: Simple direct rendering
              <>{children}</>
            ) : isAdminRoute ? (
              // Admin routes: No wrapper, full screen
              <div className="min-h-screen">
                {children}
              </div>
            ) : (
              // Regular routes: Normal layout with sidebar
              <Suspense fallback={
                <div className="pt-14 sm:pt-16 min-h-screen flex items-center justify-center">
                  <div>Loading...</div>
                </div>
              }>
                <AsyncLayoutWithSidebar>
                  {children}
                </AsyncLayoutWithSidebar>
              </Suspense>
            )}

            {/* Global SAM AI Tutor - Available across all authenticated pages */}
            <SAMGlobalAssistant />

            {/* CSS Error Monitor - Only in development */}
            <CSSErrorMonitorClient />
          </SAMGlobalProvider>
        </Providers>
      </body>
    </html>
  )
}

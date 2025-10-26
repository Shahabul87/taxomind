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
import { ResponsiveHeaderWrapper } from './(homepage)/_components/responsive-header-wrapper';
import { currentUser } from '@/lib/auth';
import LayoutWithSidebar from '@/components/layout/layout-with-sidebar';
import ClientToaster from '@/components/client-toaster';
import { Suspense } from 'react';
import { ConditionalHeaderWrapper } from './_components/conditional-header-wrapper';
// SAM AI Tutor imports
import { SAMGlobalProvider } from '@/sam-ai-tutor/components/global/sam-global-provider';
import { SAMGlobalAssistantRedesigned } from '@/sam-ai-tutor/components/global/sam-global-assistant-redesigned';
import { SAMMobileResponsive } from '@/sam-ai-tutor/components/ui/sam-mobile-responsive';
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
    <header className="w-full bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
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

  return <ResponsiveHeaderWrapper user={user} />;
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
  const pathname = headersList.get("x-pathname") || headersList.get("x-url") || "";

  // ROBUST AUTH ROUTE DETECTION: Check multiple sources
  const isAdminRoute = pathname.startsWith("/dashboard/admin") || pathname.startsWith("/admin");

  // Check if this is a blog route (exclude header from blog pages)
  const isBlogRoute = pathname.startsWith("/blog");

  // Check both x-pathname header AND x-url fallback
  const xUrl = headersList.get("x-url") || "";
  const pathToCheck = pathname || xUrl;
  const isAuthRoute = pathToCheck.startsWith("/auth") ||
                      pathToCheck.includes("/auth/login") ||
                      pathToCheck.includes("/auth/register") ||
                      pathToCheck.includes("/auth/error");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Color scheme meta tag for instant dark mode support */}
        <meta name="color-scheme" content="light dark" />
        {/* Prevent theme flash by applying theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  // Only apply dark mode if explicitly set in localStorage
                  // Default to light theme on first visit
                  if (theme === 'dark') {
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
        {/* Skip Navigation Link - WCAG 2.4.1 Bypass Blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
        >
          Skip to main content
        </a>

        <Providers session={session}>
          <ConfettiProvider />
          <ClientToaster />
          <SAMGlobalProvider>
            {/* Render header for auth routes AND non-admin routes (excluding blog pages) */}
            {!isAdminRoute && !isBlogRoute && (
              <ConditionalHeaderWrapper fallback={<HeaderFallback />}>
                <AsyncHeader />
              </ConditionalHeaderWrapper>
            )}

            {/* Conditional layout rendering based on route */}
            {isAuthRoute ? (
              // Auth routes: Simple direct rendering
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            ) : isAdminRoute ? (
              // Admin routes: No wrapper, full screen
              <main id="main-content" tabIndex={-1} className="min-h-screen">
                {children}
              </main>
            ) : isBlogRoute ? (
              // Blog routes: No header, no sidebar, full screen
              <main id="main-content" tabIndex={-1} className="min-h-screen">
                {children}
              </main>
            ) : (
              // Regular routes: Normal layout with sidebar
              <Suspense fallback={
                <div className="pt-14 xl:pt-16 min-h-screen flex items-center justify-center">
                  <div>Loading...</div>
                </div>
              }>
                <AsyncLayoutWithSidebar>
                  {children}
                </AsyncLayoutWithSidebar>
              </Suspense>
            )}

            {/* SAM AI Tutor: Mobile/Tablet (bottom/side sheet) and Desktop (floating window) */}
            <SAMMobileResponsive />
            <SAMGlobalAssistantRedesigned />

            {/* CSS Error Monitor - Only in development */}
            <CSSErrorMonitorClient />
          </SAMGlobalProvider>
        </Providers>
      </body>
    </html>
  )
}

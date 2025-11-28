import type { Metadata } from 'next'
import './globals.css'
import clsx from "clsx";
import { logger } from '@/lib/logger';

// NOTE: Disabled Google Fonts in build to support offline/restricted builds.
// Use Tailwind's default font stack or self-host fonts via next/font/local if needed.

import { auth } from '@/auth'
import { ConfettiProvider } from '@/components/providers/confetti-provider';
import { Providers } from "@/components/providers";
import ClientToaster from '@/components/client-toaster';
// SAM AI Tutor imports
import { SAMGlobalProvider } from '@/sam-ai-tutor/components/global/sam-global-provider';
import { SAMGlobalAssistantRedesigned } from '@/sam-ai-tutor/components/global/sam-global-assistant-redesigned';
import { SAMMobileResponsive } from '@/sam-ai-tutor/components/ui/sam-mobile-responsive';
import { CSSErrorMonitorClient } from '@/components/dev/css-error-monitor-client';

// Use auto dynamic rendering (Next.js will determine optimal rendering)
// export const dynamic = 'force-dynamic'; // Commented out to fix SSR bailout issue

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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

// Header and sidebar components removed - pages handle their own navigation

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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon - prevent 404 errors */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
        <Providers session={session}>
          {/* Skip link for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-md focus:bg-blue-600 focus:text-white"
          >
            Skip to main content
          </a>
          <ConfettiProvider />
          <ClientToaster />
          <SAMGlobalProvider>
            {/* All pages handle their own navigation and layout */}
            <div className="min-h-screen" suppressHydrationWarning>
              {children}
            </div>

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

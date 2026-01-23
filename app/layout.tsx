import type { Metadata } from 'next'
import Script from 'next/script';
import './globals.css'
import clsx from "clsx";
import { Suspense } from 'react';
import { logger } from '@/lib/logger';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';

// Organization Schema for Google Knowledge Panel
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${baseUrl}/#organization`,
  name: 'Taxomind',
  url: baseUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${baseUrl}/taxomind-logo.png`,
    width: 512,
    height: 512,
  },
  image: `${baseUrl}/og-default.svg`,
  description: 'AI-powered intelligent learning platform for adaptive education and personalized learning paths.',
  slogan: 'Where Minds Are Forged Through Intelligence',
  foundingDate: '2024',
  founders: [
    {
      '@type': 'Person',
      name: 'Taxomind Team',
    },
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English'],
      url: `${baseUrl}/contact`,
    },
  ],
  sameAs: [
    'https://twitter.com/taxomind',
    'https://linkedin.com/company/taxomind',
    'https://github.com/taxomind',
    'https://facebook.com/taxomind',
    'https://youtube.com/@taxomind',
  ],
  offers: {
    '@type': 'AggregateOffer',
    description: 'Online courses with AI-powered adaptive learning',
    offerCount: '100+',
    lowPrice: '0',
    highPrice: '500',
    priceCurrency: 'USD',
  },
};

// WebSite Schema for Sitelinks Search Box
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${baseUrl}/#website`,
  name: 'Taxomind',
  url: baseUrl,
  description: 'Transform your learning journey with AI-powered education',
  publisher: {
    '@id': `${baseUrl}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/courses?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'en-US',
};

// Educational Organization Schema
const educationalOrgSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': `${baseUrl}/#educationalOrganization`,
  name: 'Taxomind',
  url: baseUrl,
  description: 'Online learning platform offering AI-powered adaptive courses',
  educationalCredentialAwarded: 'Certificate of Completion',
  hasCredential: {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'Certificate',
    name: 'Taxomind Course Completion Certificate',
  },
};

// Editorial Typography - Google Fonts for Blog Pages
import { Playfair_Display, Source_Serif_4, Inter } from 'next/font/google';

// Display font for headings - elegant serif with high contrast
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Body font for reading - optimized for long-form content
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

// UI font for interface elements - clean and modern
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
  weight: ['400', '500', '600', '700'],
});

import { auth } from '@/auth'
import { ConfettiProvider } from '@/components/providers/confetti-provider';
import { Providers } from "@/components/providers";
import ClientToaster from '@/components/client-toaster';
// SAM AI Assistant - Client wrapper to prevent server-only module bundling issues
import { SAMAssistantWrapper } from '@/components/sam/SAMAssistantWrapper';
// SAM AI Intervention Provider - Enables proactive interventions globally
import { InterventionProvider } from '@/components/sam/interventions/InterventionProvider';
import { CSSErrorMonitorClient } from '@/components/dev/css-error-monitor-client';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { ServiceWorkerManager } from '@/components/service-worker-manager';
import { ErrorHandlerProvider } from '@/components/providers/error-handler-provider';

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
  } catch (authError) {
    const errorMessage = authError instanceof Error ? authError.message : 'Unknown auth error';
    logger.error("Error fetching auth session:", errorMessage);
    session = null;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <Script
          id="educational-org-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(educationalOrgSchema),
          }}
        />

        {/* Favicon - prevent 404 errors */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Taxomind" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Color scheme meta tag - prefer light mode */}
        <meta name="color-scheme" content="light" />
        {/* Prevent theme flash by applying theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  // Default to light theme - only apply dark if explicitly set
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    // Ensure light mode for first visit or explicit light preference
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    // Save light as default preference if not set
                    if (!theme) {
                      localStorage.setItem('theme', 'light');
                    }
                  }
                } catch (e) {
                  // On error, ensure light mode
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={clsx(
        playfairDisplay.variable,
        sourceSerif.variable,
        inter.variable,
        "min-h-screen transition-colors duration-300",
        "bg-background text-foreground font-sans"
      )}>
        <Providers session={session}>
          {/* Global Error Handler - Captures unhandled errors on client */}
          <ErrorHandlerProvider>
            {/* Skip link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-md focus:bg-blue-600 focus:text-white"
            >
              Skip to main content
            </a>
            <ConfettiProvider />
          <ClientToaster />
          {/* SAM AI Intervention Provider - Enables proactive interventions globally */}
          <InterventionProvider
            maxVisible={3}
            defaultAutoDismiss={true}
            defaultAutoDismissDelay={8000}
          >
            {/* Suspense boundary for consistent server/client structure during streaming */}
            <Suspense fallback={null}>
              <div className="min-h-screen" suppressHydrationWarning>
                {children}
              </div>
            </Suspense>

            {/* SAM AI Assistant - Context-aware floating assistant */}
            <SAMAssistantWrapper />
          </InterventionProvider>

          {/* CSS Error Monitor - Only in development */}
          <CSSErrorMonitorClient />

          {/* PWA Service Worker Registration */}
          <ServiceWorkerRegistration />

          {/* PWA Service Worker Manager - UI for offline indicator and update notifications */}
          <ServiceWorkerManager
            showOfflineIndicator={true}
            enableNotifications={true}
          />
          </ErrorHandlerProvider>
        </Providers>
      </body>
    </html>
  )
}

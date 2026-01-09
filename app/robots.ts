import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com'
  ).replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Admin and protected routes - CRITICAL: prevent indexing of private pages
          '/admin/',
          '/dashboard/',
          '/(protected)/',

          // Authentication routes - should not be indexed
          '/auth/',
          '/api/auth/',

          // API endpoints - not for public indexing
          '/api/',

          // User settings and private pages
          '/settings/',
          '/profile/edit/',

          // Internal Next.js routes
          '/_next/',

          // Utility routes
          '/share',
          '/goals/',

          // Search and filter pages with parameters (prevent duplicate content)
          '/*?*sort=',
          '/*?*filter=',
          '/*?*page=',
        ],
      },
      {
        // Googlebot-specific rules for better crawl efficiency
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/blog/',
          '/courses/',
          '/about',
          '/features',
          '/pricing',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/(protected)/',
          '/settings/',
        ],
      },
      {
        // Bingbot rules
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/blog/',
          '/courses/',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
        ],
      },
      {
        // Block AI training bots (optional - remove if you want AI indexing)
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}


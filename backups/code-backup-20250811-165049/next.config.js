/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  
  // Essential Next.js settings only
  trailingSlash: false,
  
  // Experimental settings for Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'www.bdgenai.com', 'bdgenai.com']
    },
  },
  
  // External packages for Next.js 15
  serverExternalPackages: ['@noble/hashes', 'bcryptjs', '@grpc/grpc-js'],
  
  // Essential image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'miro.medium.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-images-1.medium.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-images-2.medium.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.medium.com',
        pathname: '/**',
      },
      // Wildcard pattern to allow any domain (for flexibility)
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }
    ],
    // Optimized image settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    // unoptimized: false, // Enable optimization (this is the default)
  },

  // Webpack configuration to handle OpenTelemetry packages
  webpack: (config, { isServer }) => {
    // Exclude gRPC and OpenTelemetry packages from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'stream': false,
        'util': false,
        'buffer': false,
        'crypto': false,
        'fs': false,
        'path': false,
        'child_process': false,
      };

      // Exclude OpenTelemetry gRPC packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@opentelemetry/exporter-logs-otlp-grpc': 'commonjs @opentelemetry/exporter-logs-otlp-grpc',
        '@opentelemetry/otlp-grpc-exporter-base': 'commonjs @opentelemetry/otlp-grpc-exporter-base',
      });
    }

    return config;
  },
  
  eslint: {
    ignoreDuringBuilds: false, // ✅ Enable linting during builds
  },

  typescript: {
    ignoreBuildErrors: false,  // ✅ Enable TypeScript checking during builds
  },

  // Essential headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  },

  // Essential rewrites
  async rewrites() {
    return [
      {
        source: '/api/courses/:courseId*',
        destination: '/api/courses/:courseId*',
      },
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*'
      }
    ];
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Export with Sentry only if DSN is configured
module.exports = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
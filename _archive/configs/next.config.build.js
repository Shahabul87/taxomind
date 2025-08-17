/** @type {import('next').NextConfig} */
// Optimized Next.js configuration for faster CI/CD builds

const nextConfig = {
  reactStrictMode: true,
  
  // Speed up builds
  swcMinify: true,
  
  // Optimize TypeScript and ESLint checks
  typescript: {
    // Skip TypeScript errors during build (already checked in CI)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build (already checked in CI)
    ignoreDuringBuilds: true,
  },
  
  // Experimental optimizations for Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'www.bdgenai.com', 'bdgenai.com']
    },
    // Optimize build output
    optimizeCss: true,
    // Parallel routes optimization
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
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
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent.*.fbcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent-*.*.fbcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
  
  // Build optimization
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  
  // Webpack optimization for CI/CD
  webpack: (config, { isServer }) => {
    // Reduce build time by limiting parallelism in CI
    if (process.env.CI) {
      config.parallelism = 1;
      config.cache = false;
    }
    
    // Optimize for production builds
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': false,
        '@sentry/nextjs': '@sentry/nextjs/build/cjs/client',
      };
    }
    
    return config;
  },
};

// Export without Sentry for faster builds in CI
if (process.env.CI || process.env.SKIP_SENTRY) {
  module.exports = nextConfig;
} else {
  // Include Sentry only in production deployments
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  }, {
    widenClientFileUpload: true,
    transpileClientSDK: false,
    hideSourceMaps: true,
    disableLogger: true,
  });
}
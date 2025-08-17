/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

/**
 * Performance-optimized Next.js configuration
 * Implements advanced code splitting and bundle optimization
 */

// Bundle analyzer configuration (only in development/analyze mode)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  swcMinify: true, // Use SWC for faster minification
  
  // Optimize build output
  output: 'standalone', // Reduces deployment size
  
  // TypeScript and ESLint validation
  typescript: {
    ignoreBuildErrors: false, // Enable in production
  },
  eslint: {
    ignoreDuringBuilds: false, // Enable in production
  },
  
  // Experimental settings for Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '512kb',
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'www.bdgenai.com', 'bdgenai.com']
    },
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-*',
      'framer-motion',
      'date-fns',
      'lodash',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'recharts',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'axios',
      'clsx',
      'tailwind-merge',
    ],
    // Enable turbo mode for faster development
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Optimize CSS handling
    optimizeCss: true,
  },
  
  // Advanced webpack optimization
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev) {
      // Enable aggressive code splitting
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            // Remove default cache groups
            default: false,
            vendors: false,
            
            // Framework bundle (React, React-DOM, etc.)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription|next)[\\/]/,
              priority: 50,
              enforce: true,
              reuseExistingChunk: true,
            },
            
            // Common libraries bundle
            lib: {
              test(module) {
                return module.size() > 50000 &&
                  /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `lib-${packageName?.replace('@', '')}`;
              },
              priority: 40,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            
            // UI components bundle
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              priority: 35,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            
            // Shared components bundle
            components: {
              name: 'components',
              test: /[\\/]components[\\/](?!ui)/,
              priority: 30,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            
            // Async chunks (lazy loaded)
            async: {
              name: 'async',
              chunks: 'async',
              priority: 20,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            
            // CSS bundle
            styles: {
              name: 'styles',
              test: /\.(css|scss|sass)$/,
              chunks: 'all',
              enforce: true,
              priority: 60,
            },
          },
        },
        // Minimize bundle size
        minimize: true,
        usedExports: true,
        sideEffects: false,
      };
      
      // Add bundle analyzer plugin in production
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze.html',
            openAnalyzer: false,
          })
        );
      }
    }
    
    // Development optimizations
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
      };
    }
    
    // Tree shaking optimization
    config.optimization.providedExports = true;
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;
    
    // Module resolution optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize lodash imports
      'lodash': 'lodash-es',
    };
    
    // Ignore unnecessary modules
    config.module.noParse = /^(vue|vue-router|vuex|vuex-router-sync)$/;
    
    // Exclude OpenTelemetry from client bundle
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
    }
    
    return config;
  },
  
  // External packages for server
  serverExternalPackages: [
    '@noble/hashes',
    'bcryptjs',
    '@grpc/grpc-js',
    '@opentelemetry/instrumentation',
    '@prisma/instrumentation',
  ],
  
  // Optimized image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
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
        hostname: 'images.unsplash.com',
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
    ],
    // Optimized image settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },
  
  // Performance headers
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
  
  // Dynamic imports for code splitting
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
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Export with bundle analyzer and Sentry
let finalConfig = nextConfig;

// Apply bundle analyzer
if (process.env.ANALYZE === 'true') {
  finalConfig = withBundleAnalyzer(finalConfig);
}

// Apply Sentry if configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  finalConfig = withSentryConfig(finalConfig, sentryWebpackPluginOptions);
}

module.exports = finalConfig;
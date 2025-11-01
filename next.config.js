/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

// Toggle experimental optimizePackageImports for local builds if needed
// Note: @tanstack/react-table is excluded from optimization due to ESM import issues
const optimizeImports = process.env.DISABLE_OPTIMIZE_IMPORTS === 'true'
  ? []
  : [
      'lucide-react',
      '@radix-ui/react-*',
      'framer-motion',
      'date-fns',
      'lodash',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'react-hook-form',
      'zod',
      'recharts',
      '@headlessui/react',
      'react-hot-toast',
    ];

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  // Turbopack configuration (Next.js 15+)
  // Migrated from experimental.turbo to top-level turbopack
  turbopack: {
    // Set the root directory to silence workspace root warning
    root: __dirname,
    // Module resolution aliases (mirrors tsconfig paths)
    resolveAlias: {
      '@': './',
      '@/sam': './sam-ai-tutor',
      '@/sam/hooks': './sam-ai-tutor/hooks',
      '@/sam/engines': './sam-ai-tutor/engines',
      '@/sam/components': './sam-ai-tutor/components',
      '@/sam/utils': './sam-ai-tutor/utils',
      '@/sam/types': './sam-ai-tutor/types',
      '@/sam/config': './sam-ai-tutor/config',
    },
    // Custom resolve extensions
    resolveExtensions: [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },

  // Transpile packages that use ESM syntax
  transpilePackages: ['@tanstack/react-table'],

  // Generate consistent build IDs to prevent CSS 404 errors
  generateBuildId: async () => {
    // Use environment variable if available, otherwise use timestamp
    if (process.env.BUILD_ID) {
      return process.env.BUILD_ID;
    }
    // For development, use a stable ID to prevent constant rebuilds
    if (process.env.NODE_ENV === 'development') {
      return 'development-build';
    }
    // For production, use timestamp
    return `${new Date().getTime()}`;
  },
  
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  
  // CSS handling optimization
  onDemandEntries: {
    // Period (in ms) where the page must be accessed before being disposed
    maxInactiveAge: 60 * 1000, // 60 seconds
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  
  // TypeScript validation
  // Industry practice: decouple checks from build. Keep strict in CI; allow skip locally.
  // Use SKIP_TYPE_CHECK=true to speed local builds.
  // Note: ESLint configuration is no longer supported in next.config.js (Next.js 16+)
  // Use `next lint` command or eslint.config.js instead
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
  
  // Experimental settings for Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '512kb',  // Reduced from 2mb for better performance
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'www.bdgenai.com', 'bdgenai.com']
    },
    // Optimize package imports for tree-shaking
    optimizePackageImports: optimizeImports,
    // Enable Webpack build worker for reduced memory usage during builds
    webpackBuildWorker: true,
    // Disable server source maps in production to save memory
    serverSourceMaps: false,
    // Note: optimizeCss disabled - requires 'critters' package to be installed
    // optimizeCss: true,
    // Enable partial prerendering for faster builds
    // ppr: true, // Disabled - requires Next.js canary version
  },
  
  // Enable SWC-based optimizations
  compiler: {
    // Remove console logs in production for smaller bundles
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Module-level optimizations for faster builds
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Output standalone for smaller deployments
  output: 'standalone',

  // Webpack configuration - minimal, safe customizations
  webpack: (config, { isServer, dev }) => {
    // ============================================
    // CRITICAL FIX: Next.js 15 webpack chunk loading (GitHub issue #66526)
    // ============================================
    // Fix production chunk loading errors: "Cannot read properties of undefined (reading 'call')"
    if (!dev && !isServer) {
      config.output.publicPath = '/_next/';
    }

    // ============================================
    // PART 1: CSS handling and chunking optimizations
    // ============================================

    // Rely on Next's SWC for minification; avoid custom Terser which slows builds.

    // CSS handling optimizations for development
    if (dev && !isServer) {
      // Ensure CSS files are properly handled in development
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
      };
    }

    // Avoid heavy custom splitChunks logic; keep Next defaults unless explicitly enabled.
    if (process.env.ENABLE_CUSTOM_SPLITTING === 'true') {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            styles: {
              name: 'styles',
              test: /\.(css|scss|sass)$/,
              chunks: 'all',
              enforce: true,
              priority: 50,
            },
          },
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
        },
      };
    }

    // ============================================
    // PART 2: OpenTelemetry and instrumentation handling
    // ============================================

    // Suppress critical dependency warnings from OpenTelemetry instrumentation
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    // Ignore specific OpenTelemetry warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency/,
      },
      {
        module: /@prisma\/instrumentation/,
        message: /Critical dependency/,
      },
    ];

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

      // Exclude OpenTelemetry and Prisma instrumentation packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@opentelemetry/exporter-logs-otlp-grpc': 'commonjs @opentelemetry/exporter-logs-otlp-grpc',
        '@opentelemetry/otlp-grpc-exporter-base': 'commonjs @opentelemetry/otlp-grpc-exporter-base',
        '@opentelemetry/instrumentation': 'commonjs @opentelemetry/instrumentation',
        '@prisma/instrumentation': 'commonjs @prisma/instrumentation',
      });

      // Optional bundle analysis
      if (process.env.ANALYZE === 'true') {
        try {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: 'analyze.html',
              generateStatsFile: true,
              statsFilename: 'stats.json',
            })
          );
        } catch (e) {
          // Analyzer is optional; ignore if not installed
        }
      }
    } else {
      // Server-side: properly handle externals
      if (typeof config.externals === 'function') {
        // Wrap the existing function
        const originalExternals = config.externals;
        config.externals = async (ctx, callback) => {
          // Check for OpenTelemetry packages
          if (ctx.request && (
            ctx.request.includes('@opentelemetry/instrumentation') ||
            ctx.request.includes('@prisma/instrumentation')
          )) {
            return callback(null, ctx.request);
          }
          // Call original externals function
          return originalExternals(ctx, callback);
        };
      } else {
        // Add to existing externals array
        config.externals = config.externals || [];
        config.externals.push({
          '@opentelemetry/instrumentation': '@opentelemetry/instrumentation',
          '@prisma/instrumentation': '@prisma/instrumentation',
        });
      }
    }

    return config;
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
      // SECURITY FIX: Removed HTTP protocol - HTTPS only for security
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
        hostname: 'medium.com',
        pathname: '/**',
      },
      // SECURITY FIX: Removed wildcard pattern **.medium.com - use explicit hostnames only
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      // Security: Removed wildcard pattern - specify exact domains only
    ],
    // Optimized image settings
    formats: ['image/avif', 'image/webp'],
    // Optimized device sizes for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // SECURITY: SVG support enabled with strict CSP to prevent XSS attacks
    // CSP blocks all scripts and sandboxes SVG content
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    // unoptimized: false, // Enable optimization (this is the default)
  },

  // Essential headers
  async headers() {
    // SECURITY FIX: Use specific allowed origins instead of wildcard
    // Cannot use Access-Control-Allow-Origin: * with credentials: true (CORS spec violation)
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ||
                         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                         'http://localhost:3000';

    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
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

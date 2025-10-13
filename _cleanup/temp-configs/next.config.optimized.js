/** @type {import('next').NextConfig} */

// Optimized Next.js configuration for faster builds
const nextConfig = {
  // Use SWC for faster compilation
  swcMinify: true,

  // Optimize compilation
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,

    // Remove React properties in production for smaller bundles
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Module optimization
  modularizeImports: {
    // Optimize lucide-react imports
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    // Optimize lodash imports
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    // Optimize date-fns imports
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },

  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: false,

  // Experimental optimizations for Next.js 15
  experimental: {
    // Optimize server actions
    serverActions: {
      bodySizeLimit: '512kb',
      allowedOrigins: process.env.NODE_ENV === 'production'
        ? ['bdgenai.com', 'www.bdgenai.com']
        : ['localhost:3000']
    },

    // Optimize package imports - expanded list
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'framer-motion',
      'date-fns',
      'lodash',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tanstack/react-table',
      'react-hook-form',
      'zod',
      'recharts',
    ],

    // Enable partial prerendering for faster page loads
    ppr: true,

    // Optimize CSS
    optimizeCss: true,
  },

  // Output configuration
  output: 'standalone',

  // TypeScript and ESLint
  typescript: {
    // Skip type checking during build (run separately)
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
  eslint: {
    // Skip linting during build (run separately)
    ignoreDuringBuilds: process.env.SKIP_LINT === 'true',
  },

  // Optimized webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev) {
      // Better minification
      config.optimization.minimize = true;

      // Module concatenation
      config.optimization.concatenateModules = true;

      // Tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Split chunks optimally
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          // Framework chunks
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|next)[\\/]/,
            priority: 50,
            reuseExistingChunk: true,
          },
          // Common libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            priority: 30,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
              return `lib-${packageName?.replace('@', '')}`;
            },
            reuseExistingChunk: true,
          },
          // Application code
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };

      // Better source map generation
      config.devtool = false;
    }

    // Development optimizations
    if (dev && !isServer) {
      // Faster rebuilds in development
      config.watchOptions = {
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: 1000,
      };

      // Use eval-source-map for faster rebuilds
      config.devtool = 'eval-source-map';
    }

    // Ignore unnecessary warnings
    config.ignoreWarnings = [
      { module: /@opentelemetry\/instrumentation/ },
      { module: /@prisma\/instrumentation/ },
      { module: /Critical dependency/ },
    ];

    return config;
  },

  // Cache configuration
  cacheMaxMemorySize: 512 * 1024 * 1024, // 512MB cache

  // Image optimization (keep existing config)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'utfs.io', pathname: '/**' },
      { protocol: 'https', hostname: 'ui-avatars.com', pathname: '/api/**' },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },

  // Server external packages
  serverExternalPackages: ['@noble/hashes', 'bcryptjs', '@grpc/grpc-js', 'puppeteer', 'sharp'],
};

// Export without Sentry in optimized build
module.exports = nextConfig;
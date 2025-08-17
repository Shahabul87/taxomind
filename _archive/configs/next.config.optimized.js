/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  
  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Enable compression
  compress: true,
  
  // Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,
  
  // TypeScript and ESLint validation
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // ============================================
  // EXPERIMENTAL OPTIMIZATIONS
  // ============================================
  experimental: {
    // Server Actions configuration
    serverActions: {
      bodySizeLimit: '512kb', // Reduced from 2MB
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'www.bdgenai.com', 'bdgenai.com']
    },
    
    // Optimize package imports for tree-shaking
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
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'framer-motion',
      'date-fns',
      'lodash',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
    
    // Enable Turbopack optimizations (if available)
    turbo: {
      resolveAlias: {
        // Add path aliases if needed
      },
    },
    
    // Optimize CSS
    optimizeCss: true,
    
    // Module ID strategy for better caching
    moduleIdStrategy: 'deterministic',
  },
  
  // ============================================
  // BUNDLE OPTIMIZATION
  // ============================================
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
  
  // External packages for server-side only
  serverExternalPackages: [
    '@noble/hashes', 
    'bcryptjs', 
    '@grpc/grpc-js',
    'puppeteer',
    'puppeteer-core',
    'googleapis',
  ],
  
  // ============================================
  // IMAGE OPTIMIZATION (SECURITY FIXED)
  // ============================================
  images: {
    // Remove wildcard and use specific domains only
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
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      // Removed wildcard '**' for security
    ],
    // Optimized image settings
    formats: ['image/avif', 'image/webp'],
    // Reduced device sizes for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },

  // ============================================
  // WEBPACK OPTIMIZATION
  // ============================================
  webpack: (config, { isServer, dev, webpack }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Split vendor code
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Split common modules
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Split large libraries into separate chunks
            googleapis: {
              test: /[\\/]node_modules[\\/]googleapis[\\/]/,
              name: 'googleapis',
              priority: 30,
              chunks: 'async',
            },
            monaco: {
              test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
              name: 'monaco',
              priority: 30,
              chunks: 'async',
            },
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: 'tiptap',
              priority: 30,
              chunks: 'async',
            },
            sentry: {
              test: /[\\/]node_modules[\\/]@sentry[\\/]/,
              name: 'sentry',
              priority: 30,
              chunks: 'async',
            },
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              name: 'icons',
              priority: 30,
              chunks: 'async',
            },
          },
        },
      };
      
      // Add webpack ignore plugin for unused locales
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );
    }
    
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
        'net': false,
        'tls': false,
        'dns': false,
      };

      // Exclude heavy server-only packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@opentelemetry/exporter-logs-otlp-grpc': 'commonjs @opentelemetry/exporter-logs-otlp-grpc',
        '@opentelemetry/otlp-grpc-exporter-base': 'commonjs @opentelemetry/otlp-grpc-exporter-base',
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
        'googleapis': 'commonjs googleapis',
      });
    }
    
    // Bundle analyzer configuration
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  // ============================================
  // HEADERS & SECURITY
  // ============================================
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          // Add compression headers
          { key: 'Content-Encoding', value: 'gzip' },
        ]
      },
      {
        source: '/:path*',
        headers: [
          // Security headers
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
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
  
  // Output configuration for better performance
  output: 'standalone',
  
  // Disable telemetry for faster builds
  telemetry: false,
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
  // Reduce Sentry bundle size
  widenClientFileUpload: false,
  tunnelRoute: undefined,
  hideSourceMaps: true,
  disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
  disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
};

// Export with Sentry only if DSN is configured
module.exports = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
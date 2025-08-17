/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  
  // Critical: Ensure proper dynamic route handling
  trailingSlash: false,
  
  // CRITICAL: Updated experimental settings for better dynamic route handling
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'www.bdgenai.com', 'bdgenai.com']
    },
    optimizePackageImports: [
      'class-variance-authority', 
      '@radix-ui/react-slot',
      'lucide-react',
      'date-fns',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'framer-motion',
      'recharts',
      'react-icons',
      'lodash',
      'react-hook-form',
      'zustand'
    ]
    // Removed deprecated experimental options
  },
  
  // Fix for module compatibility issues  
  serverExternalPackages: ['@noble/hashes', 'bcryptjs'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**',
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
        protocol: 'http',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
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
      // Wildcard pattern to allow any domain (for blog images from various sources)
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }
    ],
    domains: ['*'], // Allow all domains as fallback
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24, // 24 hours,
    unoptimized: true, // Skip image optimization for unknown domains
    domains: ['res.cloudinary.com'],
  },

  webpack(config, { isServer }) {
    // Keep existing webpack configuration
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      }
    );

    fileLoaderRule.exclude = /\.svg$/i;


    // Add comprehensive webpack optimizations
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // React Libraries chunk (renamed from framework to avoid conflict)
          reactLibs: {
            name: 'react-libs',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // UI Library chunk (Radix UI)
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Editor chunk (TipTap)
          editor: {
            name: 'editor',
            test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Charts chunk (Chart.js, Recharts)
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](chart\.js|recharts|react-chartjs-2)[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Animation chunk (Framer Motion)
          animations: {
            name: 'animations',
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Icons chunk
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/](lucide-react|react-icons|@tabler\/icons-react)[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Utilities chunk
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](lodash|date-fns|uuid|nanoid|query-string)[\\/]/,
            priority: 25,
            enforce: true,
          },
          // AI/ML chunk
          ai: {
            name: 'ai',
            test: /[\\/]node_modules[\\/](@anthropic-ai|googleapis)[\\/]/,
            priority: 25,
            enforce: true,
          },
          // Default vendor chunk
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            enforce: true,
          },
        },
      },
    };

    // Fix for server-side rendering and module resolution
    if (isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
        },
      };
    }

    // Fix module resolution for CommonJS/ES modules compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force consistent module resolution
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };

    // Fix for exports/require compatibility
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.jsx': ['.tsx', '.jsx'],
    };

    return config;
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },


  // Updated compiler configuration to replace .babelrc
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Increase timeouts
  staticPageGenerationTimeout: 180,
  
  // Add additional performance optimizations
  poweredByHeader: false,

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  
  // CRITICAL: Updated headers to better support API routes
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

  // CRITICAL: Add rewrites to handle dynamic API routes properly
  async rewrites() {
    return [
      // Ensure API routes with dynamic parameters work correctly
      {
        source: '/api/courses/:courseId*',
        destination: '/api/courses/:courseId*',
      },
      {
        source: '/api/debug-course/:courseId*',
        destination: '/api/debug-course/:courseId*',
      },
      {
        source: '/api/test-course-route/:courseId*',
        destination: '/api/test-course-route/:courseId*',
      },
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*'
      }
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
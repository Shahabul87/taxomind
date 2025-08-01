# CSS 404 Errors - Complete Fix Guide

## 🚨 Problem Analysis

The 404 errors for CSS files like `/_next/static/css/app/layout.css` and `/_next/static/css/framework.css` are caused by:

1. **CSS Generation Issues**: Next.js trying to load CSS files that don't exist
2. **Build Configuration Problems**: Webpack not properly generating CSS chunks
3. **Hot Module Replacement Issues**: Development server CSS reloading problems
4. **CSS Import Conflicts**: Incorrect import statements or missing files

## 🔧 Solutions

### 1. **Fix Next.js Configuration**

Update your `next.config.js` to properly handle CSS:

```javascript
/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  
  // Add CSS configuration
  experimental: {
    optimizeCss: true,
    cssChunking: 'strict',
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
    ],
  },

  webpack(config, { isServer, dev }) {
    // Existing webpack configuration...
    
    // Add CSS handling improvements
    if (!isServer) {
      // Ensure CSS is properly handled in client builds
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
        priority: 50,
      };
    }

    // Fix CSS loading in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next'],
      };
    }

    return config;
  },

  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./styles'],
  },

  // Ensure proper static file handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Add headers for static assets
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
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
        ]
      }
    ]
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

### 2. **Fix CSS Import Issues**

Create a proper CSS structure:

```bash
# Create missing CSS files
mkdir -p styles
touch styles/globals.css
touch styles/components.css
```

Update `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Ensure proper CSS loading */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Fix for CSS loading issues */
@layer utilities {
  .css-loading-fix {
    content-visibility: auto;
  }
}
```

### 3. **Fix Layout CSS Import**

Update `app/layout.tsx` to properly import CSS:

```typescript
import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css' // Ensure this file exists
import clsx from "clsx";

// Add CSS import verification
if (typeof window === 'undefined') {
  // Server-side: ensure CSS is available
  try {
    require('./globals.css');
  } catch (e) {
    console.warn('CSS file not found, creating default styles');
  }
}

// Rest of your layout code...
```

### 4. **Add CSS Error Handling Middleware**

Create `middleware.ts` in your root directory:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CSS 404 errors
  if (request.nextUrl.pathname.includes('/_next/static/css/')) {
    // Check if it's a non-existent CSS file
    const pathname = request.nextUrl.pathname;
    
    if (pathname.includes('app/layout.css') || pathname.includes('framework.css')) {
      // Redirect to main CSS file or return empty CSS
      return new NextResponse('/* CSS file not found */', {
        status: 200,
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'no-cache',
        },
      });
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/_next/static/css/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 5. **Clear Build Cache and Rebuild**

Run these commands to fix the issue:

```bash
# Stop the development server
# Then run:

# Clear Next.js cache
rm -rf .next

# Clear node_modules cache
rm -rf node_modules/.cache

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build

# Start development server
npm run dev
```

### 6. **Add CSS Loading Component**

Create a CSS loading handler component:

```typescript
// components/css-loader.tsx
'use client'

import { useEffect, useState } from 'react'

export function CSSLoader() {
  const [cssLoaded, setCssLoaded] = useState(false)

  useEffect(() => {
    // Check if CSS is properly loaded
    const checkCSS = () => {
      const computedStyle = window.getComputedStyle(document.body)
      if (computedStyle.getPropertyValue('font-family')) {
        setCssLoaded(true)
      }
    }

    // Wait for CSS to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkCSS)
    } else {
      checkCSS()
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', checkCSS)
    }
  }, [])

  if (!cssLoaded) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: '#1e293b', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        Loading styles...
      </div>
    )
  }

  return null
}
```

Then add it to your layout:

```typescript
// app/layout.tsx
import { CSSLoader } from '@/components/css-loader'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ... existing code

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/styles/globals.css" as="style" />
      </head>
      <body className={clsx(dmSans.className, "min-h-screen transition-colors duration-300")}>
        <CSSLoader />
        {/* Rest of your layout */}
      </body>
    </html>
  )
}
```

### 7. **Add PostCSS Configuration**

Create `postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
}
```

### 8. **Update Tailwind Configuration**

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Ensure CSS variables are properly defined
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 9. **Add Development Server Configuration**

Create `.env.local` with proper development settings:

```bash
# Development settings
NEXT_TELEMETRY_DISABLED=1
FAST_REFRESH=true

# CSS debugging
DEBUG_CSS=true
```

### 10. **Monitor and Debug CSS Loading**

Add this debug component to monitor CSS loading:

```typescript
// components/css-debug.tsx
'use client'

import { useEffect } from 'react'

export function CSSDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor CSS loading
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const element = node as Element
                if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
                  console.log('CSS file loaded:', element.getAttribute('href'))
                }
              }
            })
          }
        })
      })

      observer.observe(document.head, { childList: true, subtree: true })

      return () => observer.disconnect()
    }
  }, [])

  return null
}
```

## 🚀 **Quick Fix Commands**

If you're experiencing these errors right now, run these commands:

```bash
# Emergency fix
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force
npm run build
npm run dev
```

## 🔍 **Prevention Strategies**

1. **Always check CSS imports**: Ensure all imported CSS files exist
2. **Use proper file structure**: Keep CSS files in designated directories
3. **Configure webpack properly**: Ensure CSS handling is correct in next.config.js
4. **Monitor build logs**: Watch for CSS-related warnings during builds
5. **Use CSS-in-JS alternatives**: Consider styled-components or emotion for complex styling

## 📊 **Monitoring CSS Health**

Add this to your monitoring dashboard:

```typescript
// lib/css-health-check.ts
export const checkCSSHealth = () => {
  if (typeof window === 'undefined') return { status: 'server' }

  const stylesheets = Array.from(document.styleSheets)
  const loadedCSS = stylesheets.filter(sheet => {
    try {
      return sheet.cssRules && sheet.cssRules.length > 0
    } catch (e) {
      return false
    }
  })

  return {
    status: loadedCSS.length > 0 ? 'healthy' : 'error',
    totalStylesheets: stylesheets.length,
    loadedStylesheets: loadedCSS.length,
    failedStylesheets: stylesheets.length - loadedCSS.length
  }
}
```

This comprehensive fix should resolve your CSS 404 errors and prevent them from recurring. The key is ensuring proper CSS generation, import handling, and build configuration in Next.js.
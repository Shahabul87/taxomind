module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/courses',
        'http://localhost:3000/auth/login',
        'http://localhost:3000/dashboard',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        
        // Bundle size
        'total-byte-weight': ['error', { maxNumericValue: 600000 }],
        'unused-javascript': ['warn', { maxLength: 2 }],
        'unused-css-rules': ['warn', { maxLength: 2 }],
        
        // Best practices
        'no-document-write': 'error',
        'js-libraries': 'warn',
        'image-aspect-ratio': 'warn',
        'image-size-responsive': 'warn',
        'uses-http2': 'error',
        'uses-optimized-images': 'error',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        
        // Accessibility
        'accesskeys': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-required-children': 'error',
        'aria-required-parent': 'error',
        'aria-roles': 'error',
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'bypass': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'duplicate-id': 'error',
        'frame-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'listitem': 'error',
        'meta-viewport': 'error',
        'tabindex': 'error',
        
        // SEO
        'viewport': 'error',
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'link-text': 'warn',
        'crawlable-anchors': 'error',
        'is-crawlable': 'error',
        'robots-txt': 'warn',
        'hreflang': 'warn',
        'canonical': 'warn',
        'structured-data': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      githubStatusContextSuffix: '/lighthouse',
    },
    server: {
      // Configuration for Lighthouse CI Server (optional)
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDatabasePath: './lighthouse-ci.db',
      // },
    },
  },
};
/**
 * Enterprise Design Tokens
 * Modern design system for course hero sections
 * Following best practices from Coursera, MasterClass, and Udacity
 */

export const animations = {
  heroEntry: {
    duration: 0.8,
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)' as const,
    stagger: 0.1,
  },
  microInteractions: {
    hover: { scale: 1.02, duration: 0.2 },
    tap: { scale: 0.98, duration: 0.1 },
    focus: { outline: '3px solid', offset: '2px' },
  },
  parallax: {
    speed: 0.5,
    smoothness: 'will-change: transform' as const,
  },
  counter: {
    duration: 2.0,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)' as const,
  },
} as const;

export const colorPalette = {
  primary: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glow: 'radial-gradient(circle, rgba(102,126,234,0.4) 0%, transparent 70%)',
  },
  accent: {
    success: '#10b981', // Enrollments
    rating: '#fbbf24', // Stars
    urgency: '#ef4444', // Limited spots
    info: '#3b82f6', // Information
  },
  neutral: {
    background: 'rgba(15, 23, 42, 0.95)', // Dark sophisticated
    surface: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.70)',
      tertiary: 'rgba(255, 255, 255, 0.50)',
    },
  },
} as const;

export const typography = {
  desktop: {
    heroTitle: {
      fontSize: '4.5rem', // 72px
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: '1.5rem', // 24px
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0.01em',
    },
    body: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.7',
      fontWeight: '400',
    },
  },
  mobile: {
    heroTitle: {
      fontSize: '2.5rem', // 40px
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.01em',
    },
    subtitle: {
      fontSize: '1.25rem', // 20px
      lineHeight: '1.5',
      fontWeight: '400',
    },
    body: {
      fontSize: '1rem', // 16px
      lineHeight: '1.6',
      fontWeight: '400',
    },
  },
} as const;

export const spacing = {
  heroVertical: {
    mobile: '3rem', // 48px
    tablet: '4rem', // 64px
    desktop: '5rem', // 80px
  },
  sectionGap: {
    mobile: '1.5rem', // 24px
    desktop: '2rem', // 32px
  },
} as const;

export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
  },
  strong: {
    background: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.24)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.35)',
  },
} as const;

export const performanceMetrics = {
  targetFCP: 1500, // First Contentful Paint in ms
  targetLCP: 2500, // Largest Contentful Paint in ms
  targetTTI: 3500, // Time to Interactive in ms
  targetCLS: 0.1, // Cumulative Layout Shift
  maxBundleSize: 150 * 1024, // 150KB in bytes
} as const;

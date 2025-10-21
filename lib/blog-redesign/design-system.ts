/**
 * Blog Redesign - Modern Enterprise Design System
 *
 * This design system defines the visual language for the redesigned blog platform,
 * inspired by industry leaders like Vercel, Stripe, GitHub, and Linear.
 */

// ===========================
// COLOR SYSTEM
// ===========================

export const colors = {
  // Brand colors with modern gradients
  brand: {
    primary: {
      50: '#f3f1ff',
      100: '#ebe5ff',
      200: '#d9ceff',
      300: '#bea6ff',
      400: '#9f75ff',
      500: '#843dff', // Primary brand color
      600: '#7916ff',
      700: '#6b04fd',
      800: '#5a03d5',
      900: '#4b05ad',
      950: '#2d0076',
    },
    secondary: {
      50: '#eef8ff',
      100: '#d8edff',
      200: '#b9dfff',
      300: '#89cbff',
      400: '#52adff',
      500: '#2a87ff', // Secondary brand color
      600: '#1268ff',
      700: '#0b51eb',
      800: '#1041be',
      900: '#133a95',
      950: '#11255a',
    },
  },

  // Semantic colors
  semantic: {
    success: {
      light: '#10b981',
      DEFAULT: '#059669',
      dark: '#047857',
    },
    warning: {
      light: '#fbbf24',
      DEFAULT: '#f59e0b',
      dark: '#d97706',
    },
    error: {
      light: '#f87171',
      DEFAULT: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#60a5fa',
      DEFAULT: '#3b82f6',
      dark: '#2563eb',
    },
  },

  // Gradient definitions
  gradients: {
    brand: 'from-[#843dff] via-[#2a87ff] to-[#00d4ff]',
    aurora: 'from-purple-400 via-pink-500 to-indigo-500',
    sunset: 'from-orange-400 via-pink-500 to-purple-600',
    ocean: 'from-blue-400 via-cyan-500 to-teal-600',
    forest: 'from-green-400 via-emerald-500 to-teal-600',
    mesh: {
      purple: 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-indigo-500/20',
      blue: 'bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-500/20',
      green: 'bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20',
    },
  },
};

// ===========================
// TYPOGRAPHY SYSTEM
// ===========================

export const typography = {
  // Font families
  fonts: {
    display: 'var(--font-inter-display)',
    body: 'var(--font-inter)',
    mono: 'var(--font-jetbrains-mono)',
  },

  // Font sizes with fluid responsive scaling using clamp
  sizes: {
    '4xs': 'clamp(0.625rem, 0.5rem + 0.5vw, 0.6875rem)',
    '3xs': 'clamp(0.6875rem, 0.5625rem + 0.5vw, 0.75rem)',
    '2xs': 'clamp(0.75rem, 0.625rem + 0.5vw, 0.8125rem)',
    'xs': 'clamp(0.8125rem, 0.6875rem + 0.5vw, 0.875rem)',
    'sm': 'clamp(0.875rem, 0.75rem + 0.5vw, 0.9375rem)',
    'base': 'clamp(1rem, 0.875rem + 0.5vw, 1.0625rem)',
    'lg': 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
    'xl': 'clamp(1.25rem, 1.125rem + 0.5vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 1.25rem + 1vw, 1.875rem)',
    '3xl': 'clamp(1.875rem, 1.5rem + 1.5vw, 2.25rem)',
    '4xl': 'clamp(2.25rem, 1.75rem + 2vw, 3rem)',
    '5xl': 'clamp(3rem, 2.25rem + 3vw, 4rem)',
    '6xl': 'clamp(3.75rem, 2.5rem + 5vw, 4.5rem)',
    '7xl': 'clamp(4.5rem, 3rem + 6vw, 6rem)',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '1.75',
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// ===========================
// SPACING SYSTEM
// ===========================

export const spacing = {
  // Base 4px grid system
  base: 4,
  scale: {
    '0': '0',
    'px': '1px',
    '0.5': '0.125rem', // 2px
    '1': '0.25rem',    // 4px
    '1.5': '0.375rem', // 6px
    '2': '0.5rem',     // 8px
    '2.5': '0.625rem', // 10px
    '3': '0.75rem',    // 12px
    '3.5': '0.875rem', // 14px
    '4': '1rem',       // 16px
    '5': '1.25rem',    // 20px
    '6': '1.5rem',     // 24px
    '7': '1.75rem',    // 28px
    '8': '2rem',       // 32px
    '9': '2.25rem',    // 36px
    '10': '2.5rem',    // 40px
    '11': '2.75rem',   // 44px
    '12': '3rem',      // 48px
    '14': '3.5rem',    // 56px
    '16': '4rem',      // 64px
    '20': '5rem',      // 80px
    '24': '6rem',      // 96px
    '28': '7rem',      // 112px
    '32': '8rem',      // 128px
    '36': '9rem',      // 144px
    '40': '10rem',     // 160px
    '44': '11rem',     // 176px
    '48': '12rem',     // 192px
    '52': '13rem',     // 208px
    '56': '14rem',     // 224px
    '60': '15rem',     // 240px
    '64': '16rem',     // 256px
    '72': '18rem',     // 288px
    '80': '20rem',     // 320px
    '96': '24rem',     // 384px
  },
};

// ===========================
// ANIMATIONS
// ===========================

export const animations = {
  // Transition durations
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Predefined animations
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeUp: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeDown: {
      from: { opacity: 0, transform: 'translateY(-20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    scaleIn: {
      from: { opacity: 0, transform: 'scale(0.95)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    slideInRight: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    slideInLeft: {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    glow: {
      '0%, 100%': { opacity: 0.5 },
      '50%': { opacity: 1 },
    },
  },
};

// ===========================
// BREAKPOINTS
// ===========================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4xl': '2560px',
};

// ===========================
// SHADOWS
// ===========================

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: {
    purple: '0 0 50px -12px rgba(132, 61, 255, 0.5)',
    blue: '0 0 50px -12px rgba(42, 135, 255, 0.5)',
    gradient: '0 0 50px -12px rgba(132, 61, 255, 0.3), 0 0 100px -12px rgba(42, 135, 255, 0.2)',
  },
};

// ===========================
// BORDERS
// ===========================

export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  width: {
    '0': '0px',
    '1': '1px',
    '2': '2px',
    '4': '4px',
    '8': '8px',
  },
};

// ===========================
// Z-INDEX SCALE
// ===========================

export const zIndex = {
  auto: 'auto',
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
  notification: '1080',
};

// ===========================
// COMPONENT TOKENS
// ===========================

export const components = {
  card: {
    padding: spacing.scale['6'],
    borderRadius: borders.radius['2xl'],
    shadow: shadows.md,
    hoverShadow: shadows.xl,
  },
  button: {
    padding: {
      sm: `${spacing.scale['2']} ${spacing.scale['3']}`,
      md: `${spacing.scale['2.5']} ${spacing.scale['5']}`,
      lg: `${spacing.scale['3']} ${spacing.scale['6']}`,
    },
    borderRadius: borders.radius.lg,
    fontSize: {
      sm: typography.sizes.sm,
      md: typography.sizes.base,
      lg: typography.sizes.lg,
    },
  },
  input: {
    padding: `${spacing.scale['3']} ${spacing.scale['4']}`,
    borderRadius: borders.radius.lg,
    fontSize: typography.sizes.base,
  },
};

// Export complete design system
export const designSystem = {
  colors,
  typography,
  spacing,
  animations,
  breakpoints,
  shadows,
  borders,
  zIndex,
  components,
};

export default designSystem;
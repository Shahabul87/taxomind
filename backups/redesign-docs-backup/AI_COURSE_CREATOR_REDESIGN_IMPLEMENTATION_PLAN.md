# AI Course Creator - Modern Enterprise Redesign
## Implementation Plan & Architecture

**Project:** Taxomind AI Course Creator Redesign
**Version:** 2.0.0
**Target Completion:** 3 Weeks
**Last Updated:** January 2025

---

## 📋 Executive Summary

This document outlines the comprehensive redesign of the AI Course Creator wizard, transforming it from a functional interface into an enterprise-grade, mobile-first learning management tool that exemplifies modern web design principles.

### Current State Assessment

**Existing Implementation:**
- Location: `app/(protected)/teacher/create/ai-creator/`
- 4-step wizard flow (Course Basics, Target Audience, Course Structure, Final Review)
- Basic responsive grid (lg:grid-cols-2)
- SAM AI assistant panel with suggestions
- Standard form controls with basic validation
- Simple progress tracking

**Key Strengths to Preserve:**
- Clean component architecture (modular steps)
- SAM AI integration and memory system
- Auto-save functionality
- Comprehensive form validation
- Error boundary implementation

**Areas for Enhancement:**
- Mobile experience (currently basic responsive)
- Visual hierarchy and design sophistication
- Micro-interactions and animations
- Accessibility features
- Performance optimization
- Dark mode implementation

---

## 🎯 Design Goals & Success Metrics

### Primary Objectives

1. **Enterprise Professionalism**
   - Polished glassmorphism effects
   - Sophisticated color gradients
   - Professional typography system
   - Success: User satisfaction score > 4.5/5

2. **Mobile-First Excellence**
   - Seamless 320px → 4K experience
   - Touch-optimized controls (44px targets)
   - Gesture-based navigation
   - Success: Mobile completion rate > 80%

3. **Performance Optimization**
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3s
   - Code splitting and lazy loading
   - Success: Lighthouse score > 95

4. **Accessibility Leadership**
   - WCAG AAA compliance
   - Keyboard navigation
   - Screen reader optimization
   - Success: Accessibility score > 95%

---

## 🏗️ Technical Architecture

### Design System Foundation

#### 1. Color Tokens (`lib/design-system/colors.ts`)

```typescript
export const colors = {
  // Primary Brand Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    secondary: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Neutral Palette (Enterprise-grade)
  neutral: {
    950: '#020617',
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E2E8F0',
    100: '#F1F5F9',
    50: '#F8FAFC',
    white: '#FFFFFF',
  },

  // Glass Morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(15, 23, 42, 0.7)',
    blur: '20px',
  },
};
```

#### 2. Typography System (`lib/design-system/typography.ts`)

```typescript
export const typography = {
  fonts: {
    display: '"Inter var", system-ui, -apple-system, sans-serif',
    body: '"Inter var", system-ui, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", monospace',
  },

  // Fluid Type Scale (clamp for responsive sizing)
  sizes: {
    xs: 'clamp(0.75rem, 2vw, 0.875rem)',
    sm: 'clamp(0.875rem, 2.5vw, 1rem)',
    base: 'clamp(1rem, 3vw, 1.125rem)',
    lg: 'clamp(1.125rem, 3.5vw, 1.25rem)',
    xl: 'clamp(1.25rem, 4vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 5vw, 2rem)',
    '3xl': 'clamp(2rem, 6vw, 3rem)',
    '4xl': 'clamp(2.5rem, 7vw, 4rem)',
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

#### 3. Breakpoint System (`lib/design-system/breakpoints.ts`)

```typescript
export const breakpoints = {
  xs: 320,   // Small phones
  sm: 640,   // Large phones
  md: 768,   // Tablets
  lg: 1024,  // Small laptops
  xl: 1280,  // Desktop
  '2xl': 1536, // Large desktop
  '3xl': 1920, // Full HD
  '4xl': 2560, // 4K displays
};

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
  '3xl': `@media (min-width: ${breakpoints['3xl']}px)`,
  '4xl': `@media (min-width: ${breakpoints['4xl']}px)`,
};
```

#### 4. Spacing System (`lib/design-system/spacing.ts`)

```typescript
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};
```

---

## 📱 Responsive Layout Strategy

### Grid System Implementation

#### Mobile Layout (320-639px)

```typescript
// components/ai-creator/layouts/mobile-layout.tsx
export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="p-4">
          <h1 className="text-xl font-bold">AI Course Creator</h1>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 pt-20 pb-32 px-4 overflow-y-auto">
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 pb-safe">
        <div className="p-4">
          {/* Step indicators and navigation buttons */}
        </div>
      </nav>
    </div>
  );
}
```

**Key Features:**
- Single column layout
- Full-width cards
- Fixed header/footer navigation
- Safe area insets for iPhone notch
- Touch-optimized 44px tap targets
- Swipe gestures for step navigation

#### Tablet Layout (640-1023px)

```typescript
// components/ai-creator/layouts/tablet-layout.tsx
export function TabletLayout({ children, assistantPanel }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* Main Content - 60% width */}
        <div className="col-span-1 space-y-4">
          {children}
        </div>

        {/* AI Assistant - 40% width, sticky */}
        <div className="col-span-1">
          <div className="sticky top-6">
            {assistantPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key Features:**
- 2-column grid (60/40 split)
- Sticky AI assistant panel
- Collapsible sections
- Touch-optimized controls
- Landscape-optimized spacing

#### Desktop Layout (1024px+)

```typescript
// components/ai-creator/layouts/desktop-layout.tsx
export function DesktopLayout({
  navigation,
  content,
  assistant
}: DesktopLayoutProps) {
  return (
    <div className="min-h-screen max-w-[1920px] mx-auto">
      {/* 3-column grid */}
      <div className="grid grid-cols-12 gap-8 p-8">
        {/* Side Navigation - 2 columns */}
        <div className="col-span-2">
          {navigation}
        </div>

        {/* Main Content - 7 columns */}
        <div className="col-span-7 space-y-6">
          {content}
        </div>

        {/* AI Assistant - 3 columns */}
        <div className="col-span-3">
          <div className="sticky top-8 space-y-4">
            {assistant}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key Features:**
- 3-column layout (nav, content, assistant)
- Persistent side navigation
- Expanded AI features
- Keyboard shortcuts overlay
- Hover state enhancements

---

## 🎨 Component Redesign Specifications

### 1. Enhanced Wizard Navigation

**File:** `components/ai-creator/navigation/wizard-stepper.tsx`

```typescript
interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  steps: StepConfig[];
  onStepClick?: (step: number) => void;
  variant?: 'horizontal' | 'vertical' | 'minimal';
}

export function WizardStepper({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  variant = 'horizontal'
}: WizardStepperProps) {
  // Mobile: Condensed dropdown
  // Tablet: Horizontal stepper with icons
  // Desktop: Vertical timeline with previews
}
```

**Features:**
- Responsive layout adaptation
- Progress animation
- Step validation indicators
- Accessibility landmarks
- Keyboard navigation (Arrow keys)

### 2. Smart Form Controls

**File:** `components/ai-creator/forms/enhanced-input.tsx`

```typescript
interface EnhancedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoSave?: boolean;
  validationRules?: ValidationRule[];
}

export function EnhancedInput({
  label,
  hint,
  error,
  showCharacterCount,
  maxLength,
  autoSave = true,
  validationRules = [],
  ...props
}: EnhancedInputProps) {
  // Floating label animation
  // Real-time validation
  // Auto-save with debounce
  // Character count indicator
  // Error shake animation
}
```

**Features:**
- Floating labels with smooth animation
- Real-time validation feedback
- Auto-save with visual indicator
- Character count for long inputs
- Haptic feedback on mobile
- Voice input support (optional)

### 3. AI Assistant Panel Redesign

**File:** `components/ai-creator/assistant/sam-assistant-redesigned.tsx`

```typescript
interface SamAssistantRedesignedProps {
  suggestion: SamSuggestion | null;
  isLoading: boolean;
  onRefresh: () => void;
  layoutMode: 'mobile' | 'tablet' | 'desktop';
}

export function SamAssistantRedesigned({
  suggestion,
  isLoading,
  onRefresh,
  layoutMode
}: SamAssistantRedesignedProps) {
  // Mobile: Bottom sheet or floating FAB
  // Tablet: Side panel with expand/collapse
  // Desktop: Docked panel with rich interactions

  // Features:
  // - Breathing avatar animation
  // - Glassmorphism background
  // - Typewriter effect for responses
  // - Quick action buttons
  // - Voice interaction (optional)
  // - Gesture controls (swipe to dismiss)
}
```

**Visual Design:**
- Glassmorphism card with blur effect
- Animated SAM avatar (breathing, thinking states)
- Gradient borders matching suggestion type
- Smooth typewriter text reveal
- Confidence score visualization
- Quick action chips for common tasks

---

## ⚡ Advanced Interactions & Animations

### Micro-Interactions Library

**File:** `lib/animations/micro-interactions.ts`

```typescript
export const microInteractions = {
  // Button Press
  buttonPress: {
    scale: 0.95,
    duration: 100,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Input Focus
  inputFocus: {
    borderGlow: {
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
      duration: 200,
    },
    labelFloat: {
      transform: 'translateY(-1.5rem) scale(0.875)',
      duration: 200,
    },
  },

  // Success Feedback
  successFeedback: {
    checkmarkDraw: {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    confetti: {
      particleCount: 20,
      spread: 60,
      startVelocity: 30,
    },
  },

  // Loading States
  shimmer: {
    animation: 'shimmer 2s infinite',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
  },

  // Step Transition
  stepTransition: {
    exit: { opacity: 0, x: -20, duration: 300 },
    enter: { opacity: 1, x: 0, duration: 300, delay: 100 },
  },
};
```

### Animation Implementation with Framer Motion

```typescript
// components/ai-creator/animated/step-container.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedStepContainer({ children, step }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## ♿ Accessibility Implementation

### WCAG AAA Compliance Checklist

#### Keyboard Navigation

```typescript
// hooks/use-keyboard-navigation.ts
export function useKeyboardNavigation(options: NavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          if (!e.shiftKey) {
            options.onNext?.();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (!e.shiftKey) {
            options.onPrevious?.();
          }
          break;
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            options.onSubmit?.();
          }
          break;
        case 'Escape':
          options.onCancel?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
```

#### Screen Reader Optimization

```typescript
// components/ai-creator/accessibility/live-region.tsx
export function LiveRegion({ message, priority = 'polite' }: Props) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Usage in wizard:
<LiveRegion
  message={`Step ${currentStep} of ${totalSteps}: ${stepTitle}`}
  priority="polite"
/>
```

#### Focus Management

```typescript
// hooks/use-focus-trap.ts
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
}
```

---

## 🌙 Dark Mode Implementation

### Theme System

**File:** `lib/theme/theme-provider.tsx`

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detect system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Dark Mode Color Overrides

```css
/* styles/dark-mode.css */
[data-theme="dark"] {
  /* Glass morphism adjustments */
  --glass-bg: rgba(15, 23, 42, 0.7);
  --glass-border: rgba(148, 163, 184, 0.1);

  /* Card backgrounds */
  --card-bg: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.9) 0%,
    rgba(30, 41, 59, 0.9) 100%
  );

  /* Elevations */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}
```

---

## 🚀 Performance Optimization

### Code Splitting Strategy

```typescript
// app/(protected)/teacher/create/ai-creator/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const SamAssistantPanel = dynamic(
  () => import('./components/sam-wizard/sam-assistant-panel').then(mod => ({ default: mod.SamAssistantPanel })),
  {
    loading: () => <SamAssistantSkeleton />,
    ssr: false,
  }
);

const CourseScoringPanel = dynamic(
  () => import('./components/course-scoring-panel').then(mod => ({ default: mod.CourseScoringPanel })),
  {
    loading: () => <CourseScoringPanelSkeleton />,
    ssr: false,
  }
);

const AdvancedSettingsStep = dynamic(
  () => import('./components/steps/advanced-settings-step').then(mod => ({ default: mod.AdvancedSettingsStep })),
  {
    loading: () => <StepSkeleton />,
  }
);
```

### Image Optimization

```typescript
// components/ai-creator/optimized-image.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,..."
      quality={85}
      {...props}
    />
  );
}
```

### Bundle Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Tree shaking
      config.optimization.usedExports = true;

      // Split chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            priority: 10,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide-react',
            priority: 10,
          },
        },
      };
    }

    return config;
  },
};
```

---

## 📦 Implementation Phases

### Phase 1: Foundation (Week 1)

**Day 1-2: Design System Setup**
- [ ] Create design tokens (colors, typography, spacing)
- [ ] Set up Tailwind CSS configuration
- [ ] Create base component variants
- [ ] Implement theme system foundation

**Day 3-4: Layout System**
- [ ] Build responsive grid system
- [ ] Create mobile/tablet/desktop layout components
- [ ] Implement breakpoint utilities
- [ ] Set up container queries

**Day 5-7: Form Controls**
- [ ] Enhanced input components with floating labels
- [ ] Auto-save functionality
- [ ] Real-time validation
- [ ] Character counters and hints

### Phase 2: Enhancement (Week 2)

**Day 8-10: Navigation & Interactions**
- [ ] Redesign wizard stepper
- [ ] Implement swipe gestures for mobile
- [ ] Add keyboard shortcuts
- [ ] Create transition animations

**Day 11-13: AI Assistant Redesign**
- [ ] Glassmorphism panel design
- [ ] Avatar animations (breathing, thinking)
- [ ] Typewriter text effect
- [ ] Quick action buttons
- [ ] Mobile bottom sheet variant

**Day 14: Accessibility Features**
- [ ] Keyboard navigation implementation
- [ ] Screen reader optimization
- [ ] Focus management
- [ ] ARIA attributes and landmarks

### Phase 3: Polish & Optimization (Week 3)

**Day 15-17: Performance**
- [ ] Code splitting implementation
- [ ] Lazy loading for heavy components
- [ ] Image optimization
- [ ] Bundle size analysis and reduction

**Day 18-19: Testing**
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Accessibility audit (aXe, Lighthouse)
- [ ] Performance testing (Lighthouse, WebPageTest)

**Day 20-21: Documentation & Deployment**
- [ ] Component documentation
- [ ] Usage examples
- [ ] Migration guide from old version
- [ ] Final QA and deployment

---

## 🧪 Testing Strategy

### Unit Testing

```typescript
// __tests__/components/wizard-stepper.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardStepper } from '@/components/ai-creator/navigation/wizard-stepper';

describe('WizardStepper', () => {
  it('renders all steps correctly', () => {
    const steps = [
      { id: 1, title: 'Course Basics' },
      { id: 2, title: 'Target Audience' },
      { id: 3, title: 'Course Structure' },
      { id: 4, title: 'Final Review' },
    ];

    render(
      <WizardStepper currentStep={1} totalSteps={4} steps={steps} />
    );

    expect(screen.getByText('Course Basics')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();

    render(
      <WizardStepper
        currentStep={2}
        totalSteps={4}
        steps={[]}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onNext).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onPrevious).toHaveBeenCalled();
  });
});
```

### Accessibility Testing

```typescript
// __tests__/accessibility/wizard-a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AICreatorPage } from '@/app/(protected)/teacher/create/ai-creator/page';

expect.extend(toHaveNoViolations);

describe('AI Creator Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<AICreatorPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA landmarks', () => {
    const { container } = render(<AICreatorPage />);

    expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
    expect(container.querySelector('[role="region"][aria-label="AI Assistant"]')).toBeInTheDocument();
  });
});
```

### Performance Testing

```typescript
// __tests__/performance/wizard-performance.test.tsx
import { render } from '@testing-library/react';
import { AICreatorPage } from '@/app/(protected)/teacher/create/ai-creator/page';

describe('AI Creator Performance', () => {
  it('loads within performance budget', async () => {
    const startTime = performance.now();

    render(<AICreatorPage />);

    const loadTime = performance.now() - startTime;

    // Should load in under 100ms (excluding network)
    expect(loadTime).toBeLessThan(100);
  });

  it('lazy loads heavy components', () => {
    const { container } = render(<AICreatorPage />);

    // Assistant panel should not be in DOM initially
    expect(container.querySelector('[data-testid="sam-assistant"]')).not.toBeInTheDocument();
  });
});
```

---

## 📊 Success Metrics & Monitoring

### Key Performance Indicators

1. **Performance Metrics**
   - First Contentful Paint (FCP): < 1.5s
   - Largest Contentful Paint (LCP): < 2.5s
   - Time to Interactive (TTI): < 3.0s
   - Cumulative Layout Shift (CLS): < 0.1
   - Total Blocking Time (TBT): < 300ms

2. **User Experience Metrics**
   - Wizard completion rate: > 80%
   - Step abandonment rate: < 15%
   - Average time per step: < 3 minutes
   - Error recovery rate: > 90%
   - User satisfaction score: > 4.5/5

3. **Accessibility Metrics**
   - Lighthouse accessibility score: > 95
   - Keyboard navigation success rate: 100%
   - Screen reader compatibility: 100%
   - WCAG AAA compliance: > 95%

4. **Technical Metrics**
   - Bundle size: < 250KB (gzipped)
   - Code coverage: > 80%
   - Type safety: 100% (no `any` types)
   - Build time: < 60s

### Monitoring Setup

```typescript
// lib/analytics/performance-monitoring.ts
import { sendToAnalytics } from '@/lib/analytics';

export function monitorWebVitals(metric: Metric) {
  sendToAnalytics({
    event: 'web_vitals',
    metric: metric.name,
    value: metric.value,
    page: 'ai-creator',
  });

  // Alert if metrics exceed thresholds
  if (metric.name === 'FCP' && metric.value > 1500) {
    console.warn('FCP exceeded threshold:', metric.value);
  }

  if (metric.name === 'LCP' && metric.value > 2500) {
    console.warn('LCP exceeded threshold:', metric.value);
  }
}

// Track user interactions
export function trackWizardInteraction(action: string, step: number) {
  sendToAnalytics({
    event: 'wizard_interaction',
    action,
    step,
    timestamp: Date.now(),
  });
}
```

---

## 🔧 Development Tools & Stack

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-*": "^1.0.0",
    "zustand": "^4.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest-axe": "^8.0.0",
    "playwright": "^1.40.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Hero
- axe Accessibility Linter
- Color Highlight
- GitLens

---

## 📝 Migration Guide

### From Current to Redesigned Version

**Step 1: Preserve Existing Functionality**

```typescript
// Backup current implementation
cp -r app/(protected)/teacher/create/ai-creator app/(protected)/teacher/create/ai-creator-v1

// Create new redesigned directory structure
mkdir -p app/(protected)/teacher/create/ai-creator-v2
```

**Step 2: Gradual Component Migration**

```typescript
// Start with design system
import { colors, typography, spacing } from '@/lib/design-system';

// Migrate one step at a time
// 1. Course Basics Step
// 2. Target Audience Step
// 3. Course Structure Step
// 4. Advanced Settings Step
```

**Step 3: Feature Flag for Rollout**

```typescript
// lib/feature-flags.ts
export const FEATURES = {
  NEW_AI_CREATOR: process.env.NEXT_PUBLIC_NEW_AI_CREATOR === 'true',
};

// app/(protected)/teacher/create/page.tsx
import { FEATURES } from '@/lib/feature-flags';

export default function CreatePage() {
  if (FEATURES.NEW_AI_CREATOR) {
    return <AICreatorV2 />;
  }
  return <AICreatorV1 />;
}
```

---

## 🎓 Best Practices & Guidelines

### Component Development

1. **Always use TypeScript**: No `any` types allowed
2. **Mobile-first approach**: Design for mobile, enhance for desktop
3. **Accessibility first**: ARIA, keyboard navigation, semantic HTML
4. **Performance conscious**: Lazy load, code split, optimize images
5. **Design system adherence**: Use tokens, no magic numbers
6. **Test coverage**: Unit, integration, accessibility, performance
7. **Documentation**: JSDoc comments, usage examples, prop types

### Code Quality Standards

```typescript
// ✅ GOOD: Proper TypeScript, accessibility, responsive
interface CourseBasicsStepProps {
  formData: CourseFormData;
  setFormData: (data: CourseFormData) => void;
  validationErrors: ValidationErrors;
}

export function CourseBasicsStep({
  formData,
  setFormData,
  validationErrors,
}: CourseBasicsStepProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <label htmlFor="course-title" className="block text-sm font-medium">
        Course Title
      </label>
      <input
        id="course-title"
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full min-h-[44px] md:min-h-[36px]"
        aria-required="true"
        aria-invalid={!!validationErrors.title}
        aria-describedby={validationErrors.title ? 'title-error' : undefined}
      />
      {validationErrors.title && (
        <p id="title-error" className="text-sm text-red-600" role="alert">
          {validationErrors.title}
        </p>
      )}
    </div>
  );
}

// ❌ BAD: No types, poor accessibility, hardcoded values
function CourseBasics({ data, onChange }: any) {
  return (
    <div style={{ padding: '20px' }}>
      <input
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
    </div>
  );
}
```

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Layout Shift During Load

**Problem:**
```typescript
// Component loads, then SAM assistant appears, causing layout shift
<div className="grid grid-cols-2">
  <div>{content}</div>
  {samAssistant && <div>{samAssistant}</div>}
</div>
```

**Solution:**
```typescript
// Always reserve space, show skeleton during load
<div className="grid grid-cols-2">
  <div>{content}</div>
  <div>
    {samAssistant || <SamAssistantSkeleton />}
  </div>
</div>
```

### Pitfall 2: Mobile Touch Targets Too Small

**Problem:**
```typescript
// Button too small on mobile (< 44px)
<button className="h-8 w-8">×</button>
```

**Solution:**
```typescript
// Responsive touch targets
<button className="h-11 w-11 md:h-8 md:w-8 touch-manipulation">
  ×
</button>
```

### Pitfall 3: Missing Dark Mode Support

**Problem:**
```typescript
// Hardcoded light colors
<div className="bg-white text-black">Content</div>
```

**Solution:**
```typescript
// Dark mode support
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  Content
</div>
```

---

## 📖 Additional Resources

### Documentation Links

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Web Vitals](https://web.dev/vitals/)

### Design Inspiration

- [Stripe Dashboard](https://stripe.com/docs/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Linear App](https://linear.app/)
- [Notion](https://www.notion.so/)
- [Framer](https://www.framer.com/)

---

## ✅ Final Checklist

Before considering the redesign complete:

- [ ] All breakpoints tested (320px to 4K)
- [ ] Dark mode fully functional
- [ ] Accessibility audit passed (WCAG AAA)
- [ ] Performance metrics met (Lighthouse > 95)
- [ ] Keyboard navigation working
- [ ] Screen reader compatible
- [ ] Mobile gestures functional
- [ ] Cross-browser tested
- [ ] Unit tests passing (> 80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Documentation complete
- [ ] Migration guide written
- [ ] Rollback plan documented
- [ ] Stakeholder approval obtained

---

## 📞 Support & Questions

For questions or issues during implementation:

1. Check this implementation plan
2. Review component documentation
3. Check existing test files for examples
4. Consult the design system tokens
5. Review CLAUDE.md for project-specific guidelines

**Remember**: This is an enterprise-grade redesign. Quality and accessibility are more important than speed. Take time to do it right.

---

**Last Updated:** January 2025
**Version:** 2.0.0
**Status:** Ready for Implementation

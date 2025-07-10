// Comprehensive preloading strategy for critical resources
"use client";

interface PreloadResource {
  href: string;
  as: string;
  type?: string;
  crossOrigin?: string;
  priority?: 'high' | 'medium' | 'low';
  media?: string;
}

interface PreloadStrategy {
  critical: PreloadResource[];
  important: PreloadResource[];
  background: PreloadResource[];
}

class PreloadingManager {
  private preloadedResources = new Set<string>();
  private preloadQueue: PreloadResource[] = [];
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializePreloading();
    }
  }

  private initializePreloading() {
    // Preload critical resources immediately
    this.preloadCriticalResources();
    
    // Preload important resources after initial load
    window.addEventListener('load', () => {
      setTimeout(() => this.preloadImportantResources(), 100);
    });

    // Preload background resources when idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.preloadBackgroundResources());
    } else {
      setTimeout(() => this.preloadBackgroundResources(), 2000);
    }
  }

  private preloadCriticalResources() {
    const strategy = this.getPreloadStrategyForRoute();
    strategy.critical.forEach(resource => this.preloadResource(resource));
  }

  private preloadImportantResources() {
    const strategy = this.getPreloadStrategyForRoute();
    strategy.important.forEach(resource => this.preloadResource(resource));
  }

  private preloadBackgroundResources() {
    const strategy = this.getPreloadStrategyForRoute();
    strategy.background.forEach(resource => this.preloadResource(resource));
  }

  private getPreloadStrategyForRoute(): PreloadStrategy {
    const path = window.location.pathname;
    
    if (path === '/') {
      return this.getHomepageStrategy();
    } else if (path.includes('/dashboard')) {
      return this.getDashboardStrategy();
    } else if (path.includes('/courses/') && path.includes('/learn/')) {
      return this.getCourseStrategy();
    } else if (path.includes('/teacher/')) {
      return this.getTeacherStrategy();
    } else if (path.includes('/analytics/')) {
      return this.getAnalyticsStrategy();
    }
    
    return this.getDefaultStrategy();
  }

  private getHomepageStrategy(): PreloadStrategy {
    return {
      critical: [
        {
          href: '/_next/static/chunks/framework.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ui.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/css/app.css',
          as: 'style',
          priority: 'high',
        },
      ],
      important: [
        {
          href: '/_next/static/chunks/animations.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/icons.js',
          as: 'script',
          priority: 'medium',
        },
      ],
      background: [
        {
          href: '/_next/static/chunks/utils.js',
          as: 'script',
          priority: 'low',
        },
      ],
    };
  }

  private getDashboardStrategy(): PreloadStrategy {
    return {
      critical: [
        {
          href: '/_next/static/chunks/framework.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ui.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/charts.js',
          as: 'script',
          priority: 'high',
        },
      ],
      important: [
        {
          href: '/_next/static/chunks/animations.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/icons.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/utils.js',
          as: 'script',
          priority: 'medium',
        },
      ],
      background: [
        {
          href: '/_next/static/chunks/ai.js',
          as: 'script',
          priority: 'low',
        },
      ],
    };
  }

  private getCourseStrategy(): PreloadStrategy {
    return {
      critical: [
        {
          href: '/_next/static/chunks/framework.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ui.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/editor.js',
          as: 'script',
          priority: 'high',
        },
      ],
      important: [
        {
          href: '/_next/static/chunks/animations.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/charts.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/ai.js',
          as: 'script',
          priority: 'medium',
        },
      ],
      background: [
        {
          href: '/_next/static/chunks/utils.js',
          as: 'script',
          priority: 'low',
        },
        {
          href: '/_next/static/chunks/icons.js',
          as: 'script',
          priority: 'low',
        },
      ],
    };
  }

  private getTeacherStrategy(): PreloadStrategy {
    return {
      critical: [
        {
          href: '/_next/static/chunks/framework.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ui.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/editor.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ai.js',
          as: 'script',
          priority: 'high',
        },
      ],
      important: [
        {
          href: '/_next/static/chunks/charts.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/animations.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/icons.js',
          as: 'script',
          priority: 'medium',
        },
      ],
      background: [
        {
          href: '/_next/static/chunks/utils.js',
          as: 'script',
          priority: 'low',
        },
      ],
    };
  }

  private getAnalyticsStrategy(): PreloadStrategy {
    return {
      critical: [
        {
          href: '/_next/static/chunks/framework.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ui.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/charts.js',
          as: 'script',
          priority: 'high',
        },
      ],
      important: [
        {
          href: '/_next/static/chunks/utils.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/icons.js',
          as: 'script',
          priority: 'medium',
        },
      ],
      background: [
        {
          href: '/_next/static/chunks/animations.js',
          as: 'script',
          priority: 'low',
        },
        {
          href: '/_next/static/chunks/ai.js',
          as: 'script',
          priority: 'low',
        },
      ],
    };
  }

  private getDefaultStrategy(): PreloadStrategy {
    return {
      critical: [
        {
          href: '/_next/static/chunks/framework.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ui.js',
          as: 'script',
          priority: 'high',
        },
      ],
      important: [
        {
          href: '/_next/static/chunks/icons.js',
          as: 'script',
          priority: 'medium',
        },
        {
          href: '/_next/static/chunks/utils.js',
          as: 'script',
          priority: 'medium',
        },
      ],
      background: [
        {
          href: '/_next/static/chunks/animations.js',
          as: 'script',
          priority: 'low',
        },
      ],
    };
  }

  private preloadResource(resource: PreloadResource) {
    if (this.preloadedResources.has(resource.href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.type) link.type = resource.type;
    if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
    if (resource.media) link.media = resource.media;
    
    // Add priority hints for supported browsers
    if (resource.priority && 'fetchPriority' in link) {
      (link as any).fetchPriority = resource.priority;
    }

    document.head.appendChild(link);
    this.preloadedResources.add(resource.href);
  }

  // Public methods
  public preloadCustomResource(resource: PreloadResource) {
    this.preloadResource(resource);
  }

  public preloadRoute(route: string) {
    // Preload route-specific resources
    const routeResources = this.getRouteSpecificResources(route);
    routeResources.forEach(resource => this.preloadResource(resource));
  }

  private getRouteSpecificResources(route: string): PreloadResource[] {
    const resources: PreloadResource[] = [];
    
    if (route.includes('/dashboard')) {
      resources.push({
        href: '/_next/static/chunks/charts.js',
        as: 'script',
        priority: 'high',
      });
    }
    
    if (route.includes('/courses/') && route.includes('/learn/')) {
      resources.push({
        href: '/_next/static/chunks/editor.js',
        as: 'script',
        priority: 'high',
      });
    }
    
    if (route.includes('/teacher/')) {
      resources.push(
        {
          href: '/_next/static/chunks/editor.js',
          as: 'script',
          priority: 'high',
        },
        {
          href: '/_next/static/chunks/ai.js',
          as: 'script',
          priority: 'high',
        }
      );
    }
    
    return resources;
  }

  public getPreloadedResources(): string[] {
    return Array.from(this.preloadedResources);
  }

  public clearPreloadedResources() {
    this.preloadedResources.clear();
  }
}

// Font preloading
export function preloadFonts() {
  const fonts = [
    {
      href: '/_next/static/fonts/inter.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      href: '/_next/static/fonts/dm-sans.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ];

  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font.href;
    link.as = font.as;
    link.type = font.type;
    link.crossOrigin = font.crossOrigin;
    document.head.appendChild(link);
  });
}

// Image preloading
export function preloadImages(images: string[]) {
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);
  });
}

// DNS prefetch for external resources
export function prefetchDNS(domains: string[]) {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Preconnect for critical external resources
export function preconnectDomains(domains: string[]) {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Module preloading for dynamic imports
export function preloadModules(modules: string[]) {
  modules.forEach(module => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = module;
    document.head.appendChild(link);
  });
}

// Singleton instance
let preloadingManager: PreloadingManager | null = null;

export function getPreloadingManager(): PreloadingManager {
  if (!preloadingManager) {
    preloadingManager = new PreloadingManager();
  }
  return preloadingManager;
}

// Initialize preloading for common external resources
export function initializeCommonPreloading() {
  if (typeof window === 'undefined') return;

  // DNS prefetch for common external domains
  prefetchDNS([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://res.cloudinary.com',
    'https://img.youtube.com',
    'https://cdn.jsdelivr.net',
  ]);

  // Preconnect to critical external resources
  preconnectDomains([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://res.cloudinary.com',
  ]);

  // Preload fonts
  preloadFonts();
}

// Auto-initialize common preloading
if (typeof window !== 'undefined') {
  initializeCommonPreloading();
}

export { PreloadingManager, PreloadResource, PreloadStrategy };
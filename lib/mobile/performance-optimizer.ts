import { logger } from '@/lib/logger';

// Mobile Performance Optimization Utilities
// ========================================

// Device detection and capabilities
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLowEndDevice: boolean;
  hasTouch: boolean;
  supportsWebGL: boolean;
  supportsServiceWorker: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  deviceMemory: number;
  hardwareConcurrency: number;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  pixelRatio: number;
  prefersDarkMode: boolean;
  prefersReducedMotion: boolean;
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage: number;
  jsHeapSize: number;
}

// Optimization settings
export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enablePreloading: boolean;
  maxImageQuality: number;
  maxVideoQuality: '480p' | '720p' | '1080p';
  enableAnimations: boolean;
  enableHapticFeedback: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
}

class MobilePerformanceOptimizer {
  private deviceInfo: DeviceInfo;
  private config: OptimizationConfig;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0,
    memoryUsage: 0,
    jsHeapSize: 0
  };

  constructor() {
    this.deviceInfo = this.detectDevice();
    this.config = this.generateOptimizationConfig();
    this.initializePerformanceMonitoring();
  }

  // Device Detection
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && window.innerWidth >= 768;
    const isDesktop = !isMobile && !isTablet;

    // Check for low-end device indicators
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isLowEndDevice = deviceMemory < 2 || hardwareConcurrency < 4;

    // Check capabilities
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const supportsWebGL = !!window.WebGLRenderingContext;
    const supportsServiceWorker = 'serviceWorker' in navigator;

    // Network information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionType = connection?.effectiveType || 'unknown';

    // Screen size categorization
    const screenSize = this.categorizeScreenSize(window.innerWidth);

    // Device pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;

    // User preferences
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isLowEndDevice,
      hasTouch,
      supportsWebGL,
      supportsServiceWorker,
      connectionType,
      deviceMemory,
      hardwareConcurrency,
      screenSize,
      pixelRatio,
      prefersDarkMode,
      prefersReducedMotion
    };
  }

  private categorizeScreenSize(width: number): 'small' | 'medium' | 'large' | 'xlarge' {
    if (width < 640) return 'small';
    if (width < 768) return 'medium';
    if (width < 1024) return 'large';
    return 'xlarge';
  }

  // Generate optimization configuration based on device capabilities
  private generateOptimizationConfig(): OptimizationConfig {
    const { isLowEndDevice, connectionType, prefersReducedMotion } = this.deviceInfo;

    const isSlowConnection = connectionType === 'slow-2g' || connectionType === '2g';
    const isFastConnection = connectionType === '4g' || connectionType === 'wifi';

    return {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enableServiceWorker: this.deviceInfo.supportsServiceWorker,
      enablePreloading: isFastConnection && !isLowEndDevice,
      maxImageQuality: isLowEndDevice || isSlowConnection ? 70 : 85,
      maxVideoQuality: isLowEndDevice || isSlowConnection ? '480p' : '720p',
      enableAnimations: !prefersReducedMotion && !isLowEndDevice,
      enableHapticFeedback: this.deviceInfo.hasTouch && !isLowEndDevice,
      enableBackgroundSync: this.deviceInfo.supportsServiceWorker && !isLowEndDevice,
      enablePushNotifications: 'Notification' in window && !isLowEndDevice
    };
  }

  // Performance Monitoring
  private initializePerformanceMonitoring() {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            this.metrics.largestContentfulPaint = entry.startTime;
            break;
          case 'first-input':
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              this.metrics.cumulativeLayoutShift += (entry as any).value;
            }
            break;
        }
      });
    });

    try {
      this.performanceObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      logger.warn('Performance observer not supported for some entry types');
    }

    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  private monitorMemoryUsage() {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        this.metrics.jsHeapSize = memory.totalJSHeapSize / 1024 / 1024; // MB
      }
    };

    measureMemory();
    setInterval(measureMemory, 30000); // Every 30 seconds
  }

  // Image Optimization
  public optimizeImageUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}): string {
    const { width, height, quality = this.config.maxImageQuality, format } = options;
    
    // If it's a blob URL or data URL, return as is
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }

    // For low-end devices, reduce quality further
    const finalQuality = this.deviceInfo.isLowEndDevice ? Math.min(quality, 60) : quality;
    
    // Determine optimal format
    const optimalFormat = this.getOptimalImageFormat(format);
    
    // Build optimized URL (this would integrate with your image optimization service)
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', finalQuality.toString());
    params.append('f', optimalFormat);
    
    return `${url}?${params.toString()}`;
  }

  private getOptimalImageFormat(preferredFormat?: string): string {
    if (preferredFormat) return preferredFormat;
    
    // Check browser support for modern formats
    if (this.supportsWebP()) return 'webp';
    if (this.supportsAVIF()) return 'avif';
    return 'jpeg';
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private supportsAVIF(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  // Lazy Loading
  public createLazyLoadObserver(callback: (entry: IntersectionObserverEntry) => void): IntersectionObserver {
    const options = {
      root: null,
      rootMargin: this.deviceInfo.isLowEndDevice ? '50px' : '200px',
      threshold: 0.1
    };

    return new IntersectionObserver(callback, options);
  }

  // Resource Preloading
  public preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font' = 'script'): void {
    if (!this.config.enablePreloading) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }

  // Code Splitting Helper
  public shouldLoadComponent(componentName: string): boolean {
    // Skip heavy components on low-end devices
    if (this.deviceInfo.isLowEndDevice) {
      const heavyComponents = ['VideoPlayer', 'ChartComponent', 'MapComponent', 'Editor'];
      return !heavyComponents.includes(componentName);
    }
    
    return true;
  }

  // Animation Control
  public shouldEnableAnimation(animationType: 'entrance' | 'hover' | 'scroll' | 'complex'): boolean {
    if (!this.config.enableAnimations) return false;
    
    // Disable complex animations on low-end devices
    if (this.deviceInfo.isLowEndDevice && animationType === 'complex') {
      return false;
    }
    
    return true;
  }

  // Haptic Feedback
  public triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.config.enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: 50,
      medium: 100,
      heavy: 200
    };
    
    navigator.vibrate(patterns[type]);
  }

  // Battery Optimization
  public optimizeForBattery(): void {
    if (!('getBattery' in navigator)) return;
    
    (navigator as any).getBattery().then((battery: any) => {
      const applyBatteryOptimizations = () => {
        if (battery.level < 0.2) {
          // Low battery optimizations
          this.config.enableAnimations = false;
          this.config.enableHapticFeedback = false;
          this.config.maxImageQuality = 50;
          this.config.maxVideoQuality = '480p';
        } else if (battery.level < 0.5) {
          // Medium battery optimizations
          this.config.enableAnimations = !this.deviceInfo.prefersReducedMotion;
          this.config.maxImageQuality = 65;
        }
      };

      applyBatteryOptimizations();
      battery.addEventListener('levelchange', applyBatteryOptimizations);
    });
  }

  // Network Adaptation
  public adaptToNetworkConditions(): void {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateForConnection = () => {
      const { effectiveType, downlink, saveData } = connection;
      
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        this.config.enablePreloading = false;
        this.config.maxImageQuality = 40;
        this.config.maxVideoQuality = '480p';
      } else if (effectiveType === '3g' || downlink < 1.5) {
        this.config.enablePreloading = false;
        this.config.maxImageQuality = 60;
        this.config.maxVideoQuality = '480p';
      } else {
        this.config.enablePreloading = true;
        this.config.maxImageQuality = 85;
        this.config.maxVideoQuality = '720p';
      }
    };

    updateForConnection();
    connection.addEventListener('change', updateForConnection);
  }

  // Memory Management
  public cleanupUnusedResources(): void {
    // Clean up unused images
    const images = document.querySelectorAll('img[data-loaded="true"]');
    images.forEach(img => {
      if (!this.isElementInViewport(img as HTMLElement)) {
        img.removeAttribute('src');
        img.setAttribute('data-loaded', 'false');
      }
    });

    // Suggest garbage collection (if available)
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  private isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Service Worker Registration
  public registerServiceWorker(swUrl: string): Promise<ServiceWorkerRegistration | undefined> {
    if (!this.config.enableServiceWorker) {
      return Promise.resolve(undefined);
    }

    return navigator.serviceWorker.register(swUrl)
      .then(registration => {

        return registration;
      })
      .catch((error: any) => {
        logger.error('Service Worker registration failed:', error);
        return undefined;
      });
  }

  // Getters
  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getConfig(): OptimizationConfig {
    return this.config;
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cleanup
  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Create singleton instance
export const mobileOptimizer = new MobilePerformanceOptimizer();

// React Hook for using the optimizer
export function useMobileOptimizer() {
  return {
    deviceInfo: mobileOptimizer.getDeviceInfo(),
    config: mobileOptimizer.getConfig(),
    metrics: mobileOptimizer.getMetrics(),
    optimizeImageUrl: mobileOptimizer.optimizeImageUrl.bind(mobileOptimizer),
    preloadResource: mobileOptimizer.preloadResource.bind(mobileOptimizer),
    shouldLoadComponent: mobileOptimizer.shouldLoadComponent.bind(mobileOptimizer),
    shouldEnableAnimation: mobileOptimizer.shouldEnableAnimation.bind(mobileOptimizer),
    triggerHapticFeedback: mobileOptimizer.triggerHapticFeedback.bind(mobileOptimizer),
    updateConfig: mobileOptimizer.updateConfig.bind(mobileOptimizer)
  };
}

// Utility functions
export function isMobileDevice(): boolean {
  return mobileOptimizer.getDeviceInfo().isMobile;
}

export function isLowEndDevice(): boolean {
  return mobileOptimizer.getDeviceInfo().isLowEndDevice;
}

export function getOptimalImageQuality(): number {
  return mobileOptimizer.getConfig().maxImageQuality;
}

export function shouldEnableAnimations(): boolean {
  return mobileOptimizer.getConfig().enableAnimations;
}

// Performance monitoring utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();

    });
  } else {
    const end = performance.now();

    return result;
  }
}

// Resource loading utilities
export function loadResourceOptimally(
  url: string,
  type: 'script' | 'style' | 'image' | 'font',
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { connectionType, isLowEndDevice } = mobileOptimizer.getDeviceInfo();
    
    // Delay loading for low priority resources on slow connections
    if (priority === 'low' && (connectionType === 'slow-2g' || connectionType === '2g')) {
      setTimeout(() => loadResource(), 2000);
    } else if (priority === 'medium' && isLowEndDevice) {
      setTimeout(() => loadResource(), 1000);
    } else {
      loadResource();
    }
    
    function loadResource() {
      let element: HTMLElement;
      
      switch (type) {
        case 'script':
          element = document.createElement('script');
          (element as HTMLScriptElement).src = url;
          break;
        case 'style':
          element = document.createElement('link');
          (element as HTMLLinkElement).rel = 'stylesheet';
          (element as HTMLLinkElement).href = url;
          break;
        case 'image':
          element = document.createElement('img');
          (element as HTMLImageElement).src = url;
          break;
        case 'font':
          element = document.createElement('link');
          (element as HTMLLinkElement).rel = 'preload';
          (element as HTMLLinkElement).href = url;
          (element as HTMLLinkElement).as = 'font';
          (element as HTMLLinkElement).crossOrigin = 'anonymous';
          break;
        default:
          reject(new Error(`Unsupported resource type: ${type}`));
          return;
      }
      
      element.onload = () => resolve();
      element.onerror = () => reject(new Error(`Failed to load ${type}: ${url}`));
      
      document.head.appendChild(element);
    }
  });
}
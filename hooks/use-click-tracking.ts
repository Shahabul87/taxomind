'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useEventTracker } from '@/lib/analytics/analytics-provider';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ClickTrackingOptions {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  enabledSelectors?: string[]; // CSS selectors to track
  excludeSelectors?: string[]; // CSS selectors to exclude
  trackAllClicks?: boolean; // Track all clicks by default
}

export function useClickTracking(options: ClickTrackingOptions = {}) {
  const tracker = useEventTracker();
  const pathname = usePathname();
  const { data: session } = useSession();
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Check if we should track this element
    const shouldTrack = shouldTrackElement(target, optionsRef.current);
    if (!shouldTrack) return;

    // Get element details
    const elementInfo = getElementInfo(target);
    
    // Extract additional context
    const context = extractClickContext(target);

    // Track the click
    tracker.track({
      eventType: 'click',
      eventName: `${elementInfo.type}_click`,
      properties: {
        elementType: elementInfo.type,
        elementText: elementInfo.text,
        elementId: elementInfo.id,
        elementClass: elementInfo.className,
        elementTag: elementInfo.tagName,
        href: elementInfo.href,
        position: {
          x: event.clientX,
          y: event.clientY,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        },
        ...context,
        pathname
      },
      courseId: optionsRef.current.courseId,
      chapterId: optionsRef.current.chapterId,
      sectionId: optionsRef.current.sectionId
    });
  }, [tracker, pathname]);

  useEffect(() => {
    // Add click listener
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [handleClick]);

  // Manual tracking function for specific elements
  const trackClick = useCallback((
    elementId: string,
    eventName: string,
    properties?: Record<string, any>
  ) => {
    tracker.track({
      eventType: 'click',
      eventName,
      properties: {
        elementId,
        pathname,
        ...properties
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });
  }, [tracker, pathname, options]);

  return { trackClick };
}

function shouldTrackElement(
  element: HTMLElement,
  options: ClickTrackingOptions
): boolean {
  // Check excluded selectors first
  if (options.excludeSelectors) {
    for (const selector of options.excludeSelectors) {
      if (element.matches(selector) || element.closest(selector)) {
        return false;
      }
    }
  }

  // If tracking all clicks, return true unless excluded
  if (options.trackAllClicks) {
    return true;
  }

  // Check enabled selectors
  if (options.enabledSelectors) {
    for (const selector of options.enabledSelectors) {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    }
  }

  // Default tracking for interactive elements
  const defaultTrackedElements = [
    'a',
    'button',
    'input[type="submit"]',
    'input[type="button"]',
    '[role="button"]',
    '[data-track-click]',
    '.track-click'
  ];

  for (const selector of defaultTrackedElements) {
    if (element.matches(selector) || element.closest(selector)) {
      return true;
    }
  }

  return false;
}

function getElementInfo(element: HTMLElement) {
  const info: any = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: element.className || undefined,
    text: getElementText(element),
    type: 'unknown'
  };

  // Determine element type
  if (element.tagName === 'A') {
    info.type = 'link';
    info.href = (element as HTMLAnchorElement).href;
  } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    info.type = 'button';
  } else if (element.tagName === 'INPUT') {
    const inputType = (element as HTMLInputElement).type;
    info.type = `input_${inputType}`;
  } else if (element.closest('nav')) {
    info.type = 'navigation';
  } else if (element.closest('form')) {
    info.type = 'form_element';
  }

  // Check for specific data attributes
  if (element.dataset.trackType) {
    info.type = element.dataset.trackType;
  }

  return info;
}

function getElementText(element: HTMLElement): string {
  // Try various methods to get meaningful text
  const text = 
    element.textContent?.trim() ||
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    element.getAttribute('alt') ||
    '';

  // Limit text length
  return text.substring(0, 100);
}

function extractClickContext(element: HTMLElement): Record<string, any> {
  const context: Record<string, any> = {};

  // Check for course-related data attributes
  const courseElement = element.closest('[data-course-id]');
  if (courseElement) {
    context.courseId = courseElement.getAttribute('data-course-id');
  }

  const chapterElement = element.closest('[data-chapter-id]');
  if (chapterElement) {
    context.chapterId = chapterElement.getAttribute('data-chapter-id');
  }

  const sectionElement = element.closest('[data-section-id]');
  if (sectionElement) {
    context.sectionId = sectionElement.getAttribute('data-section-id');
  }

  // Check for video player context
  const videoElement = element.closest('.video-player, [data-video-id]');
  if (videoElement) {
    context.videoId = videoElement.getAttribute('data-video-id');
    context.clickType = 'video_control';
  }

  // Check for quiz context
  const quizElement = element.closest('.quiz-container, [data-quiz-id]');
  if (quizElement) {
    context.quizId = quizElement.getAttribute('data-quiz-id');
    context.clickType = 'quiz_interaction';
  }

  // Check for navigation context
  const navElement = element.closest('nav, .navigation, .sidebar');
  if (navElement) {
    context.clickType = 'navigation';
    context.navigationArea = navElement.className || navElement.id || 'main';
  }

  return context;
}

// Hook for tracking specific UI components
export function useComponentClickTracking(componentName: string, componentId?: string) {
  const tracker = useEventTracker();
  const pathname = usePathname();

  const trackComponentClick = useCallback((
    action: string,
    properties?: Record<string, any>
  ) => {
    tracker.track({
      eventType: 'click',
      eventName: `component_${action}`,
      properties: {
        componentName,
        componentId,
        action,
        pathname,
        ...properties
      }
    });
  }, [tracker, componentName, componentId, pathname]);

  return { trackComponentClick };
}
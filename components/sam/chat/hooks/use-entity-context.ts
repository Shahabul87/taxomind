import { useCallback, useEffect, useState } from 'react';
import type { WindowCourseContext, EntityContextState } from '../types';

declare global {
  interface Window {
    courseContext?: WindowCourseContext;
    chapterContext?: WindowCourseContext;
    sectionContext?: WindowCourseContext;
    samFormInteractions?: Record<string, (value: unknown) => void>;
    chapterFormInteractions?: Record<string, (value: unknown) => void>;
  }
}

interface UseEntityContextOptions {
  pathname?: string | null;
}

interface UseEntityContextReturn {
  entityContext: EntityContextState;
  getWindowEntityContext: () => EntityContextState;
}

export function useEntityContext(options: UseEntityContextOptions = {}): UseEntityContextReturn {
  const { pathname } = options;

  const [entityContext, setEntityContext] = useState<EntityContextState>({});

  // Listen for entity context from SimpleCourseContext and similar components
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset on navigation to avoid stale data
    setEntityContext({});

    const checkExistingContext = () => {
      if (window.courseContext?.entityData) {
        setEntityContext({
          entityType: 'course',
          entityData: window.courseContext.entityData,
        });
      } else if (window.chapterContext?.entityData) {
        setEntityContext({
          entityType: 'chapter',
          entityData: window.chapterContext.entityData,
        });
      } else if (window.sectionContext?.entityData) {
        setEntityContext({
          entityType: 'section',
          entityData: window.sectionContext.entityData,
        });
      }
    };

    // Check immediately
    checkExistingContext();

    // Also check after a short delay (SimpleCourseContext has a 1s setTimeout)
    const delayedCheck = setTimeout(checkExistingContext, 1500);

    // Listen for context update events from SimpleCourseContext
    const handleContextUpdate = (event: CustomEvent) => {
      const { serverData } = event.detail || {};
      if (serverData?.entityData) {
        setEntityContext({
          entityType: serverData.entityType || 'course',
          entityData: serverData.entityData,
        });
      }
    };

    window.addEventListener(
      'sam-context-update',
      handleContextUpdate as EventListener
    );

    return () => {
      clearTimeout(delayedCheck);
      window.removeEventListener(
        'sam-context-update',
        handleContextUpdate as EventListener
      );
    };
  }, [pathname]);

  const getWindowEntityContext = useCallback((): EntityContextState => {
    if (typeof window === 'undefined') return {};

    // Check for section context first (most specific)
    if (window.sectionContext?.entityData) {
      return {
        entityType: 'section',
        entityData: window.sectionContext.entityData,
      };
    }

    // Check for chapter context
    if (window.chapterContext?.entityData) {
      return {
        entityType: 'chapter',
        entityData: window.chapterContext.entityData,
      };
    }

    // Check for course context
    if (window.courseContext?.entityData) {
      return {
        entityType: 'course',
        entityData: window.courseContext.entityData,
      };
    }

    return {};
  }, []);

  return {
    entityContext,
    getWindowEntityContext,
  };
}

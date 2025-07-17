"use client";

import { useEffect } from 'react';
import { useEnhancedSam } from './enhanced-sam-provider';

interface PageSamContextOptions {
  // Entity information
  entityType?: 'course' | 'chapter' | 'section' | 'post' | 'template';
  entityId?: string;
  entityData?: any;
  
  // Related data
  relatedData?: {
    parent?: any; // e.g., course for a chapter
    children?: any[]; // e.g., chapters for a course
    stats?: any; // e.g., enrollment stats
  };
  
  // Permissions
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canPublish?: boolean;
    customPermissions?: Record<string, boolean>;
  };
  
  // Page-specific metadata
  metadata?: {
    currentStep?: string;
    completionStatus?: Record<string, boolean>;
    availableTemplates?: any[];
    categories?: any[];
    tags?: string[];
  };
  
  // Custom workflow
  workflow?: {
    steps?: string[];
    currentStep?: number;
    completedSteps?: string[];
    nextAction?: string;
  };
  
  // Page capabilities
  capabilities?: string[];
  
  // Custom actions
  customActions?: Array<{
    id: string;
    label: string;
    handler: () => void;
    enabled?: boolean;
  }>;
}

/**
 * Hook to inject page-specific context into SAM
 * Use this in your page components to provide SAM with detailed context
 */
export function usePageSamContext(options: PageSamContextOptions) {
  const { injectPageContext } = useEnhancedSam();
  
  useEffect(() => {
    // Build the context object
    const context = {
      serverData: {
        entityType: options.entityType,
        entityId: options.entityId,
        entityData: options.entityData,
        relatedData: options.relatedData,
        permissions: options.permissions,
        statistics: options.relatedData?.stats
      },
      workflow: options.workflow || {},
      metadata: {
        ...options.metadata,
        capabilities: options.capabilities
      }
    };
    
    // Inject into SAM
    injectPageContext(context);
    
    // Also emit custom event for other components
    window.dispatchEvent(new CustomEvent('sam-context-update', {
      detail: context
    }));
  }, [
    options.entityType,
    options.entityId,
    options.entityData,
    options.relatedData,
    options.permissions,
    options.metadata,
    options.workflow,
    options.capabilities,
    injectPageContext
  ]);
  
  // Return helper functions
  return {
    // Update specific context
    updateContext: (updates: Partial<PageSamContextOptions>) => {
      const context = {
        serverData: {
          ...updates
        }
      };
      injectPageContext(context);
    },
    
    // Trigger SAM refresh
    refreshSam: () => {
      window.dispatchEvent(new CustomEvent('sam-refresh-request'));
    },
    
    // Send message to SAM
    sendToSam: (message: string, data?: any) => {
      window.dispatchEvent(new CustomEvent('sam-message', {
        detail: { message, data }
      }));
    }
  };
}

/**
 * Example usage in a course detail page:
 * 
 * function CourseDetailPage({ course, chapters }) {
 *   usePageSamContext({
 *     entityType: 'course',
 *     entityId: course.id,
 *     entityData: course,
 *     relatedData: {
 *       children: chapters,
 *       stats: {
 *         enrollments: course.enrollmentCount,
 *         completion: course.completionRate
 *       }
 *     },
 *     permissions: {
 *       canEdit: true,
 *       canPublish: course.status === 'draft',
 *       canDelete: course.enrollmentCount === 0
 *     },
 *     capabilities: [
 *       'generate-chapters',
 *       'analyze-structure',
 *       'generate-learning-objectives'
 *     ]
 *   });
 * }
 */
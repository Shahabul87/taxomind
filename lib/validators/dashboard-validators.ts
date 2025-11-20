import { z } from 'zod';
import { AdminRole } from '@prisma/client';

// NOTE: UserRole no longer exists - only AdminAccount has roles (AdminRole enum)
// User role validation is deprecated
// For admin role validation, use AdminRole enum instead
/**
 * @deprecated Users don't have roles - only AdminAccount has roles
 * Use AdminRole from @prisma/client for admin validation
 */
export const userRoleSchema = z.enum(['ADMIN', 'USER']); // Kept for backward compatibility

// Dashboard filter schemas
export const dateRangeSchema = z.object({
  start: z.date().optional(),
  end: z.date().optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Admin dashboard specific schemas
export const adminDashboardFilterSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  userRole: userRoleSchema.optional(),
  verified: z.boolean().optional(),
  provider: z.string().optional(),
});

// User search schema
export const userSearchSchema = z.object({
  query: z.string().min(1).max(100),
  role: userRoleSchema.optional(),
  verified: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// Statistics time range
export const statsTimeRangeSchema = z.enum(['day', 'week', 'month', 'quarter', 'year', 'all']);

// Content filter schema
export const contentFilterSchema = z.object({
  type: z.enum(['course', 'group', 'resource', 'message']).optional(),
  timeRange: statsTimeRangeSchema.optional(),
  userId: z.string().uuid().optional(),
});

// Activity log schema
export const activityLogSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Dashboard widget preferences
export const widgetPreferencesSchema = z.object({
  visible: z.boolean().default(true),
  position: z.number().int().min(0).optional(),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  refreshInterval: z.number().int().min(0).max(3600).optional(), // seconds
});

// Dashboard configuration
export const dashboardConfigSchema = z.object({
  layout: z.enum(['grid', 'list', 'compact']).default('grid'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  widgets: z.record(z.string(), widgetPreferencesSchema).optional(),
  refreshInterval: z.number().int().min(0).max(3600).default(300), // 5 minutes
});

// Export request schema
export const exportRequestSchema = z.object({
  type: z.enum(['users', 'courses', 'analytics', 'logs']),
  format: z.enum(['csv', 'json', 'pdf']),
  filters: z.object({
    dateRange: dateRangeSchema.optional(),
    userRole: userRoleSchema.optional(),
    verified: z.boolean().optional(),
  }).optional(),
});

// Bulk action schema
export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate', 'verify', 'unverify']),
  entityType: z.enum(['user', 'course', 'group']),
  entityIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(1).max(500).optional(),
});

// Notification preference schema
export const notificationPreferenceSchema = z.object({
  email: z.boolean().default(true),
  inApp: z.boolean().default(true),
  frequency: z.enum(['instant', 'hourly', 'daily', 'weekly']).default('instant'),
  types: z.array(z.enum([
    'newUser',
    'newCourse',
    'systemAlert',
    'performanceReport',
    'securityAlert'
  ])).default(['systemAlert', 'securityAlert']),
});

// Dashboard action schema for server actions
export const dashboardActionSchema = z.object({
  action: z.enum([
    'refreshData',
    'exportData',
    'bulkAction',
    'updatePreferences',
    'generateReport'
  ]),
  payload: z.any(), // Will be validated based on action type
});

// Helper function to validate dashboard action payload
export function validateDashboardAction(action: string, payload: any) {
  switch (action) {
    case 'exportData':
      return exportRequestSchema.parse(payload);
    case 'bulkAction':
      return bulkActionSchema.parse(payload);
    case 'updatePreferences':
      return dashboardConfigSchema.parse(payload);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Sanitization helpers
export function sanitizeDashboardInput(input: any): any {
  if (typeof input === 'string') {
    // Remove any potential script tags or HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeDashboardInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeDashboardInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Permission check helpers
// NOTE: Users don't have roles - only AdminAccount has roles
// These functions are deprecated for regular user checks
/**
 * @deprecated Users don't have roles - only AdminAccount has roles
 * For admin checks, query AdminAccount table with AdminRole enum
 * For user permission checks, use PermissionManager from lib/permissions.ts
 */
export function canAccessAdminDashboard(userRole: string): boolean {
  return userRole === 'ADMIN';
}

/**
 * @deprecated Users don't have roles - only AdminAccount has roles
 * For admin checks, query AdminAccount table with AdminRole enum
 * For user permission checks, use PermissionManager from lib/permissions.ts
 */
export function canPerformBulkAction(userRole: string, action: string): boolean {
  if (userRole !== 'ADMIN') return false;

  // Add specific action permissions if needed
  const dangerousActions = ['delete', 'deactivate'];
  if (dangerousActions.includes(action)) {
    // Could add additional checks here
    return true;
  }

  return true;
}

/**
 * @deprecated Users don't have roles - only AdminAccount has roles
 * For admin checks, query AdminAccount table with AdminRole enum
 * For user permission checks, use PermissionManager from lib/permissions.ts
 */
export function canExportData(userRole: string, dataType: string): boolean {
  if (userRole !== 'ADMIN') return false;

  // Add specific data type permissions if needed
  const sensitiveData = ['users', 'logs'];
  if (sensitiveData.includes(dataType)) {
    // Could add additional checks here
    return true;
  }

  return true;
}
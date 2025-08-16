/**
 * Permission Management System
 * Enterprise-grade RBAC (Role-Based Access Control) implementation
 */

import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

// Define all available permissions
export enum Permission {
  // Course Permissions
  COURSE_CREATE = 'COURSE_CREATE',
  COURSE_EDIT_OWN = 'COURSE_EDIT_OWN',
  COURSE_EDIT_ANY = 'COURSE_EDIT_ANY',
  COURSE_DELETE_OWN = 'COURSE_DELETE_OWN',
  COURSE_DELETE_ANY = 'COURSE_DELETE_ANY',
  COURSE_PUBLISH = 'COURSE_PUBLISH',
  COURSE_UNPUBLISH = 'COURSE_UNPUBLISH',
  COURSE_PRICE_SET = 'COURSE_PRICE_SET',
  
  // Content Permissions
  CONTENT_MODERATE = 'CONTENT_MODERATE',
  CONTENT_APPROVE = 'CONTENT_APPROVE',
  CONTENT_FLAG = 'CONTENT_FLAG',
  
  // User Permissions
  USER_VIEW_ANALYTICS = 'USER_VIEW_ANALYTICS',
  USER_MANAGE_OWN = 'USER_MANAGE_OWN',
  USER_MANAGE_ANY = 'USER_MANAGE_ANY',
  USER_BAN = 'USER_BAN',
  USER_VERIFY_INSTRUCTOR = 'USER_VERIFY_INSTRUCTOR',
  
  // Financial Permissions
  PAYMENT_RECEIVE = 'PAYMENT_RECEIVE',
  PAYMENT_WITHDRAW = 'PAYMENT_WITHDRAW',
  PAYMENT_VIEW_REPORTS = 'PAYMENT_VIEW_REPORTS',
  PAYMENT_MANAGE_REFUNDS = 'PAYMENT_MANAGE_REFUNDS',
  
  // Platform Permissions
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  PLATFORM_ANALYTICS = 'PLATFORM_ANALYTICS',
  PLATFORM_SETTINGS = 'PLATFORM_SETTINGS',
  PLATFORM_AUDIT_LOGS = 'PLATFORM_AUDIT_LOGS',
}

export class PermissionManager {
  /**
   * Get default permissions for each role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    const permissionMap: Record<UserRole, Permission[]> = {
      ADMIN: [
        // Admins have all permissions
        ...Object.values(Permission)
      ],
      // New roles
      INSTRUCTOR: [
        Permission.COURSE_CREATE,
        Permission.COURSE_EDIT_OWN,
        Permission.COURSE_DELETE_OWN,
        Permission.COURSE_PUBLISH,
        Permission.COURSE_UNPUBLISH,
        Permission.COURSE_PRICE_SET,
        Permission.USER_VIEW_ANALYTICS,
        Permission.USER_MANAGE_OWN,
        Permission.PAYMENT_RECEIVE,
        Permission.PAYMENT_WITHDRAW,
        Permission.PAYMENT_VIEW_REPORTS,
      ],
      LEARNER: [
        Permission.USER_MANAGE_OWN,
        Permission.USER_VIEW_ANALYTICS,
      ],
      MODERATOR: [
        Permission.CONTENT_MODERATE,
        Permission.CONTENT_FLAG,
        Permission.CONTENT_APPROVE,
        Permission.USER_VIEW_ANALYTICS,
        Permission.PLATFORM_ANALYTICS,
      ],
      AFFILIATE: [
        Permission.USER_VIEW_ANALYTICS,
        Permission.USER_MANAGE_OWN,
        Permission.PAYMENT_RECEIVE,
        Permission.PAYMENT_VIEW_REPORTS,
      ],
      // Backward compatibility - map old roles to new permissions
      TEACHER: [
        Permission.COURSE_CREATE,
        Permission.COURSE_EDIT_OWN,
        Permission.COURSE_DELETE_OWN,
        Permission.COURSE_PUBLISH,
        Permission.COURSE_UNPUBLISH,
        Permission.COURSE_PRICE_SET,
        Permission.USER_VIEW_ANALYTICS,
        Permission.USER_MANAGE_OWN,
        Permission.PAYMENT_RECEIVE,
        Permission.PAYMENT_WITHDRAW,
        Permission.PAYMENT_VIEW_REPORTS,
      ],
      USER: [
        Permission.USER_MANAGE_OWN,
        Permission.USER_VIEW_ANALYTICS,
      ],
      STUDENT: [
        Permission.USER_MANAGE_OWN,
        Permission.USER_VIEW_ANALYTICS,
      ],
    };
    
    return permissionMap[role] || [];
  }

  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          isAccountLocked: true,
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      if (!user) return false;
      
      // Check if user is locked
      if (user.isAccountLocked) return false;
      
      // Get role-based permissions
      const rolePermissions = this.getRolePermissions(user.role);
      if (rolePermissions.includes(permission)) {
        return true;
      }
      
      // Check user-specific permissions
      const userPermission = user.userPermissions?.find(
        up => up.permission.name === permission && up.granted
      );
      
      if (userPermission) {
        // Check if permission has expired
        if (userPermission.expiresAt && userPermission.expiresAt < new Date()) {
          return false;
        }
        return userPermission.granted;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissions: Permission[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissions: Permission[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a user owns a resource
   */
  static async ownsResource(
    userId: string,
    resourceType: 'course' | 'enrollment' | 'post' | 'comment',
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'course':
          const course = await db.course.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          return course?.userId === userId;
        
        case 'enrollment':
          const enrollment = await db.enrollment.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          return enrollment?.userId === userId;
        
        case 'post':
          const post = await db.post.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          return post?.userId === userId;
        
        case 'comment':
          const comment = await db.comment.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          return comment?.userId === userId;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return false;
    }
  }

  /**
   * Combined permission check with ownership
   */
  static async canAccess(
    userId: string,
    action: string,
    resource?: { type: string; id: string }
  ): Promise<boolean> {
    // Map actions to permissions
    const actionPermissionMap: Record<string, Permission> = {
      'create-course': Permission.COURSE_CREATE,
      'edit-course': Permission.COURSE_EDIT_OWN,
      'edit-any-course': Permission.COURSE_EDIT_ANY,
      'delete-course': Permission.COURSE_DELETE_OWN,
      'delete-any-course': Permission.COURSE_DELETE_ANY,
      'publish-course': Permission.COURSE_PUBLISH,
      'set-course-price': Permission.COURSE_PRICE_SET,
      'moderate-content': Permission.CONTENT_MODERATE,
      'approve-content': Permission.CONTENT_APPROVE,
      'view-analytics': Permission.USER_VIEW_ANALYTICS,
      'ban-user': Permission.USER_BAN,
      'verify-instructor': Permission.USER_VERIFY_INSTRUCTOR,
      'withdraw-payment': Permission.PAYMENT_WITHDRAW,
      'view-audit-logs': Permission.PLATFORM_AUDIT_LOGS,
    };
    
    const permission = actionPermissionMap[action];
    if (!permission) return false;
    
    // Check base permission
    const hasPermission = await this.hasPermission(userId, permission);
    
    // If the permission is for "own" resources, check ownership
    if (resource && permission.includes('_OWN')) {
      const ownsResource = await this.ownsResource(
        userId,
        resource.type as any,
        resource.id
      );
      return hasPermission && ownsResource;
    }
    
    // If the permission is for "any" resources, just check permission
    if (permission.includes('_ANY')) {
      return hasPermission;
    }
    
    return hasPermission;
  }

  /**
   * Grant a permission to a user
   */
  static async grantPermission(
    userId: string,
    permissionName: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // First, ensure the permission exists
      let permission = await db.permission.findUnique({
        where: { name: permissionName }
      });
      
      if (!permission) {
        // Create the permission if it doesn't exist
        permission = await db.permission.create({
          data: {
            name: permissionName,
            category: this.getPermissionCategory(permissionName),
            description: `Permission for ${permissionName}`
          }
        });
      }
      
      // Grant the permission to the user
      await db.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        update: {
          granted: true,
          expiresAt
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: true,
          expiresAt
        }
      });
      
      // Audit log
      await db.enhancedAuditLog.create({
        data: {
          userId,
          action: 'PERMISSION_GRANTED',
          resource: 'PERMISSION',
          resourceId: permission.id,
          metadata: { permissionName, expiresAt }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error granting permission:', error);
      return false;
    }
  }

  /**
   * Revoke a permission from a user
   */
  static async revokePermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    try {
      const permission = await db.permission.findUnique({
        where: { name: permissionName }
      });
      
      if (!permission) return false;
      
      await db.userPermission.updateMany({
        where: {
          userId,
          permissionId: permission.id
        },
        data: {
          granted: false
        }
      });
      
      // Audit log
      await db.enhancedAuditLog.create({
        data: {
          userId,
          action: 'PERMISSION_REVOKED',
          resource: 'PERMISSION',
          resourceId: permission.id,
          metadata: { permissionName }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          userPermissions: {
            where: {
              granted: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            },
            include: {
              permission: true
            }
          }
        }
      });
      
      if (!user) return [];
      
      // Get role permissions
      const rolePermissions = this.getRolePermissions(user.role);
      
      // Get user-specific permissions
      const userPermissions = user.userPermissions.map(up => up.permission.name);
      
      // Combine and deduplicate
      return [...new Set([...rolePermissions, ...userPermissions])];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Helper to get permission category
   */
  private static getPermissionCategory(permissionName: string): string {
    if (permissionName.startsWith('COURSE_')) return 'COURSE';
    if (permissionName.startsWith('CONTENT_')) return 'CONTENT';
    if (permissionName.startsWith('USER_')) return 'USER';
    if (permissionName.startsWith('PAYMENT_')) return 'PAYMENT';
    if (permissionName.startsWith('PLATFORM_')) return 'PLATFORM';
    return 'OTHER';
  }
}

/**
 * React hook for client-side permission checks
 */
export function usePermission(permission: Permission) {
  // This would be implemented in a client component
  // Example implementation provided for reference
  return {
    hasPermission: async (userId: string) => {
      const response = await fetch('/api/auth/check-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permission })
      });
      const data = await response.json();
      return data.hasPermission;
    }
  };
}
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export type Permission = 'READ' | 'WRITE' | 'COMMENT' | 'MODERATE' | 'ADMIN';
export type ContentType = 'course' | 'chapter' | 'section' | 'post' | 'document';

export interface UserPermissions {
  userId: string;
  permissions: Permission[];
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'MODERATOR' | 'ADMIN';
  grantedBy?: string;
  grantedAt?: Date;
  expiresAt?: Date;
}

export interface PermissionRule {
  id: string;
  contentType: ContentType;
  contentId: string;
  userId?: string;
  userRole?: 'USER' | 'ADMIN';
  permissions: Permission[];
  conditions?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

export class PermissionManager {
  private permissionCache: Map<string, UserPermissions> = new Map();
  private ruleCache: Map<string, PermissionRule[]> = new Map();

  async checkPermission(
    userId: string,
    contentType: ContentType,
    contentId: string,
    permission: Permission
  ): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `${userId}:${contentType}:${contentId}`;
      let userPermissions = this.permissionCache.get(cacheKey);

      if (!userPermissions) {
        userPermissions = await this.loadUserPermissions(userId, contentType, contentId);
        this.permissionCache.set(cacheKey, userPermissions);
      }

      // Check if permission exists and hasn't expired
      if (userPermissions.expiresAt && userPermissions.expiresAt < new Date()) {
        return false;
      }

      return userPermissions.permissions.includes(permission);
    } catch (error: any) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  async checkEditPermission(userId: string, sessionId: string): Promise<boolean> {
    try {
      // Get session info
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: {
          contentType: true,
          contentId: true,
          lockType: true,
          lockedBy: true,
        },
      });

      if (!session) {
        return false;
      }

      // Check if session is locked by another user
      if (session.lockType === 'HARD' && session.lockedBy && session.lockedBy !== userId) {
        return false;
      }

      // Check write permission
      return await this.checkPermission(
        userId,
        session.contentType as ContentType,
        session.contentId,
        'WRITE'
      );
    } catch (error: any) {
      logger.error('Error checking edit permission:', error);
      return false;
    }
  }

  async checkLockPermission(userId: string, sessionId: string): Promise<boolean> {
    try {
      // Get session info
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: {
          contentType: true,
          contentId: true,
        },
      });

      if (!session) {
        return false;
      }

      // Check moderate permission (required for locking)
      return await this.checkPermission(
        userId,
        session.contentType as ContentType,
        session.contentId,
        'MODERATE'
      );
    } catch (error: any) {
      logger.error('Error checking lock permission:', error);
      return false;
    }
  }

  async grantPermission(
    granterId: string,
    userId: string,
    contentType: ContentType,
    contentId: string,
    permissions: Permission[],
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Check if granter has admin permission
      const hasAdminPermission = await this.checkPermission(granterId, contentType, contentId, 'ADMIN');
      if (!hasAdminPermission) {
        logger.warn(`User ${granterId} tried to grant permissions without admin access`);
        return false;
      }

      // Determine role based on permissions
      const role = this.determineRole(permissions);

      // Store permission in database
      await db.collaborativePermission.upsert({
        where: {
          userId_contentType_contentId: {
            userId,
            contentType,
            contentId,
          },
        },
        create: {
          userId,
          contentType,
          contentId,
          permissions: permissions,
          role,
          grantedBy: granterId,
          grantedAt: new Date(),
          expiresAt,
          isActive: true,
        },
        update: {
          permissions: permissions,
          role,
          grantedBy: granterId,
          grantedAt: new Date(),
          expiresAt,
          isActive: true,
        },
      });

      // Clear cache for affected user
      const cacheKey = `${userId}:${contentType}:${contentId}`;
      this.permissionCache.delete(cacheKey);

      // Track activity
      await this.trackPermissionActivity(
        granterId,
        userId,
        contentType,
        contentId,
        'PERMISSION_GRANTED',
        { permissions, role, expiresAt }
      );

      return true;
    } catch (error: any) {
      logger.error('Error granting permission:', error);
      return false;
    }
  }

  async revokePermission(
    revokerId: string,
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<boolean> {
    try {
      // Check if revoker has admin permission
      const hasAdminPermission = await this.checkPermission(revokerId, contentType, contentId, 'ADMIN');
      if (!hasAdminPermission) {
        logger.warn(`User ${revokerId} tried to revoke permissions without admin access`);
        return false;
      }

      // Deactivate permission in database
      await db.collaborativePermission.updateMany({
        where: {
          userId,
          contentType,
          contentId,
        },
        data: {
          isActive: false,
          revokedBy: revokerId,
          revokedAt: new Date(),
        },
      });

      // Clear cache for affected user
      const cacheKey = `${userId}:${contentType}:${contentId}`;
      this.permissionCache.delete(cacheKey);

      // Track activity
      await this.trackPermissionActivity(
        revokerId,
        userId,
        contentType,
        contentId,
        'PERMISSION_REVOKED',
        {}
      );

      return true;
    } catch (error: any) {
      logger.error('Error revoking permission:', error);
      return false;
    }
  }

  async getUserPermissions(
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<UserPermissions | null> {
    try {
      const cacheKey = `${userId}:${contentType}:${contentId}`;
      let userPermissions = this.permissionCache.get(cacheKey);

      if (!userPermissions) {
        userPermissions = await this.loadUserPermissions(userId, contentType, contentId);
        this.permissionCache.set(cacheKey, userPermissions);
      }

      return userPermissions;
    } catch (error: any) {
      logger.error('Error getting user permissions:', error);
      return null;
    }
  }

  async getAllPermissions(contentType: ContentType, contentId: string): Promise<UserPermissions[]> {
    try {
      const permissions = await db.collaborativePermission.findMany({
        where: {
          contentType,
          contentId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          grantedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return permissions.map(permission => ({
        userId: permission.userId,
        permissions: permission.permissions as Permission[],
        role: permission.role as UserPermissions['role'],
        grantedBy: permission.grantedBy || undefined,
        grantedAt: permission.grantedAt || undefined,
        expiresAt: permission.expiresAt || undefined,
      }));
    } catch (error: any) {
      logger.error('Error getting all permissions:', error);
      return [];
    }
  }

  async createPermissionRule(
    createdBy: string,
    rule: Omit<PermissionRule, 'id' | 'createdAt'>
  ): Promise<string | null> {
    try {
      // Check if creator has admin permission
      const hasAdminPermission = await this.checkPermission(
        createdBy,
        rule.contentType,
        rule.contentId,
        'ADMIN'
      );

      if (!hasAdminPermission) {
        return null;
      }

      const createdRule = await db.permissionRule.create({
        data: {
          ...rule,
          createdBy,
          createdAt: new Date(),
        },
      });

      // Clear rule cache
      this.ruleCache.delete(`${rule.contentType}:${rule.contentId}`);

      return createdRule.id;
    } catch (error: any) {
      logger.error('Error creating permission rule:', error);
      return null;
    }
  }

  async evaluatePermissionRules(
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<Permission[]> {
    try {
      // Get applicable rules
      const rules = await this.getPermissionRules(contentType, contentId);
      const permissions: Set<Permission> = new Set();

      // Get user info for rule evaluation
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
        return [];
      }

      // Evaluate each rule
      for (const rule of rules) {
        if (!rule.isActive) continue;

        let matches = true;

        // Check user-specific rule
        if (rule.userId && rule.userId !== userId) {
          matches = false;
        }

        // Check role-specific rule
        // NOTE: Users don't have roles - only AdminAccount has roles
        // Role-based rules are skipped for regular users
        // if (rule.userRole && rule.userRole !== user.role) {
        //   matches = false;
        // }

        // Check conditions
        if (rule.conditions && matches) {
          matches = await this.evaluateRuleConditions(userId, rule.conditions);
        }

        // Add permissions if rule matches
        if (matches) {
          rule.permissions.forEach(permission => permissions.add(permission));
        }
      }

      return Array.from(permissions);
    } catch (error: any) {
      logger.error('Error evaluating permission rules:', error);
      return [];
    }
  }

  private async loadUserPermissions(
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<UserPermissions> {
    try {
      // Get direct permissions
      const directPermissions = await db.collaborativePermission.findFirst({
        where: {
          userId,
          contentType,
          contentId,
          isActive: true,
        },
      });

      let permissions: Permission[] = [];
      let role: UserPermissions['role'] = 'VIEWER';
      let grantedBy: string | undefined;
      let grantedAt: Date | undefined;
      let expiresAt: Date | undefined;

      if (directPermissions) {
        permissions = directPermissions.permissions as Permission[];
        role = directPermissions.role as UserPermissions['role'];
        grantedBy = directPermissions.grantedBy || undefined;
        grantedAt = directPermissions.grantedAt || undefined;
        expiresAt = directPermissions.expiresAt || undefined;
      } else {
        // Evaluate rules to determine permissions
        const rulePermissions = await this.evaluatePermissionRules(userId, contentType, contentId);
        permissions = rulePermissions;
        role = this.determineRole(permissions);
      }

      // Add default permissions based on content ownership
      const ownerPermissions = await this.getOwnerPermissions(userId, contentType, contentId);
      permissions = [...new Set([...permissions, ...ownerPermissions])];

      return {
        userId,
        permissions,
        role: this.determineRole(permissions),
        grantedBy,
        grantedAt,
        expiresAt,
      };
    } catch (error: any) {
      logger.error('Error loading user permissions:', error);
      return {
        userId,
        permissions: [],
        role: 'VIEWER',
      };
    }
  }

  private async getOwnerPermissions(
    userId: string,
    contentType: ContentType,
    contentId: string
  ): Promise<Permission[]> {
    try {
      let isOwner = false;

      // Check ownership based on content type
      switch (contentType) {
        case 'course':
          const course = await db.course.findFirst({
            where: { id: contentId, userId },
          });
          isOwner = !!course;
          break;

        case 'post':
          const post = await db.post.findFirst({
            where: { id: contentId, userId },
          });
          isOwner = !!post;
          break;

        // Add other content types as needed
        default:
          break;
      }

      // Grant full permissions to owners
      if (isOwner) {
        return ['READ', 'WRITE', 'COMMENT', 'MODERATE', 'ADMIN'];
      }

      return [];
    } catch (error: any) {
      logger.error('Error getting owner permissions:', error);
      return [];
    }
  }

  private async getPermissionRules(
    contentType: ContentType,
    contentId: string
  ): Promise<PermissionRule[]> {
    try {
      const cacheKey = `${contentType}:${contentId}`;
      let rules = this.ruleCache.get(cacheKey);

      if (!rules) {
        const dbRules = await db.permissionRule.findMany({
          where: {
            contentType,
            contentId,
            isActive: true,
          },
        });

        rules = dbRules.map(rule => ({
          id: rule.id,
          contentType: rule.contentType as ContentType,
          contentId: rule.contentId,
          userId: rule.userId || undefined,
          userRole: rule.userRole as 'USER' | 'ADMIN' || undefined,
          permissions: rule.permissions as Permission[],
          conditions: (rule.conditions as Record<string, any>) || undefined,
          isActive: rule.isActive,
          createdAt: rule.createdAt,
        }));

        this.ruleCache.set(cacheKey, rules);
      }

      return rules;
    } catch (error: any) {
      logger.error('Error getting permission rules:', error);
      return [];
    }
  }

  private async evaluateRuleConditions(
    userId: string,
    conditions: Record<string, any>
  ): Promise<boolean> {
    try {
      // Add custom condition evaluation logic here
      // Examples: time-based conditions, enrollment status, etc.
      
      if (conditions.timeRange) {
        const now = new Date();
        const startTime = new Date(conditions.timeRange.start);
        const endTime = new Date(conditions.timeRange.end);
        
        if (now < startTime || now > endTime) {
          return false;
        }
      }

      if (conditions.enrollmentRequired) {
        // Check if user is enrolled in the course
        const enrollment = await db.enrollment.findFirst({
          where: {
            userId,
            courseId: conditions.courseId,
          },
        });

        if (!enrollment) {
          return false;
        }
      }

      return true;
    } catch (error: any) {
      logger.error('Error evaluating rule conditions:', error);
      return false;
    }
  }

  private determineRole(permissions: Permission[]): UserPermissions['role'] {
    if (permissions.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (permissions.includes('MODERATE')) {
      return 'MODERATOR';
    }
    if (permissions.includes('WRITE')) {
      return 'EDITOR';
    }
    if (permissions.includes('COMMENT')) {
      return 'COMMENTER';
    }
    return 'VIEWER';
  }

  private async trackPermissionActivity(
    actorId: string,
    targetUserId: string,
    contentType: ContentType,
    contentId: string,
    activityType: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await db.permissionActivity.create({
        data: {
          actorId,
          targetUserId,
          contentType,
          contentId,
          activityType,
          metadata,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      logger.error('Error tracking permission activity:', error);
    }
  }

  async cleanupExpiredPermissions(): Promise<void> {
    try {
      const now = new Date();
      
      await db.collaborativePermission.updateMany({
        where: {
          expiresAt: {
            lt: now,
          },
          isActive: true,
        },
        data: {
          isActive: false,
          revokedAt: now,
          revokedBy: 'system',
        },
      });

      logger.info('Cleaned up expired permissions');
    } catch (error: any) {
      logger.error('Error cleaning up expired permissions:', error);
    }
  }

  clearCache(): void {
    this.permissionCache.clear();
    this.ruleCache.clear();
  }
}
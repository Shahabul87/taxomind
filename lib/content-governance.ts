import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  ApprovalStatus,
  ApprovalPriority,
  WorkflowStatus,
  NotificationType,
  ApprovalAutoCondition,
  AuditAction,
  BulkOperationType,
  BulkOperationStatus
} from "@prisma/client";

export interface WorkflowTemplateConfig {
  name: string;
  description?: string;
  contentType: string;
  category?: string;
  stages: StageConfig[];
  isDefault?: boolean;
}

export interface StageConfig {
  name: string;
  description?: string;
  order: number;
  isRequired?: boolean;
  isParallel?: boolean;
  requiredRoles: string[];
  minApprovals?: number;
  timeLimit?: number;
  escalationAfter?: number;
  autoApprove?: ApprovalAutoCondition;
}

export interface ApprovalRequest {
  versionId: string;
  priority?: ApprovalPriority;
  dueDate?: Date;
  templateId?: string;
  reviewerIds?: string[];
  comments?: string;
}

export interface BulkApprovalRequest {
  type: BulkOperationType;
  criteria: {
    contentType?: string;
    status?: ApprovalStatus;
    priority?: ApprovalPriority;
    dateRange?: {
      start: Date;
      end: Date;
    };
    authorIds?: string[];
    versionIds?: string[];
  };
  action: {
    status?: ApprovalStatus;
    priority?: ApprovalPriority;
    dueDate?: Date;
    reviewerIds?: string[];
    comments?: string;
  };
}

export class ContentGovernanceService {
  
  /**
   * Create a new approval workflow template
   */
  static async createWorkflowTemplate(config: WorkflowTemplateConfig) {
    const user = await currentUser();
    // NOTE: Users don't have roles - only AdminAccount has roles
    // For content governance operations, just require authentication
    // Additional permission checks can be added via PermissionManager if needed
    if (!user) {
      throw new Error("Authentication required");
    }

    const template = await db.approvalWorkflowTemplate.create({
      data: {
        name: config.name,
        description: config.description,
        stages: config.stages.map(stage => ({
          name: stage.name,
          description: stage.description,
          order: stage.order,
          isRequired: stage.isRequired !== false,
          isParallel: stage.isParallel || false,
          requiredRoles: stage.requiredRoles,
          minApprovals: stage.minApprovals || 1,
          timeLimit: stage.timeLimit,
          escalationAfter: stage.escalationAfter,
          autoApprove: stage.autoApprove || ApprovalAutoCondition.NONE
        })),
        isActive: true
      }
    });

    return template;
  }

  /**
   * Start approval workflow for a content version
   */
  static async startApprovalWorkflow(request: ApprovalRequest) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const version = await db.contentVersion.findUnique({
      where: { id: request.versionId },
      include: { author: true }
    });

    if (!version) throw new Error("Version not found");

    // Get or create workflow template
    let template;
    if (request.templateId) {
      template = await db.approvalWorkflowTemplate.findUnique({
        where: { id: request.templateId },
      });
    } else {
      template = await db.approvalWorkflowTemplate.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!template) throw new Error("No workflow template found");

    // Create workflow instance
    const workflow = await db.approvalWorkflow.create({
      data: {
        contentVersionId: request.versionId,
        templateId: template.id,
        priority: request.priority || ApprovalPriority.MEDIUM,
        status: WorkflowStatus.ACTIVE,
        stageData: {}
      }
    });

    // Create approval requests for first stage or parallel stages
    const firstStageApprovals = await this.createStageApprovals(workflow.id, request.reviewerIds);

    // Send notifications
    await this.sendApprovalNotifications(
      firstStageApprovals,
      NotificationType.IN_APP
    );

    await this.logAuditAction(user.id || "", workflow.id, AuditAction.CREATE,
      `Started approval workflow using template: ${template.name}`);

    return {
      workflow,
      approvals: firstStageApprovals
    };
  }

  /**
   * Process an approval decision
   */
  static async processApproval(
    versionId: string,
    approverId: string,
    approved: boolean,
    comments?: string,
    timeSpent?: number
  ) {
    const user = await currentUser();
    if (!user || user.id !== approverId) {
      throw new Error("Unauthorized");
    }

    const approval = await db.contentVersionApproval.findFirst({
      where: {
        approverId,
        status: ApprovalStatus.PENDING,
        workflow: { contentVersionId: versionId }
      },
      include: { workflow: true }
    });

    if (!approval) throw new Error("Approval not found or already processed");

    // Update approval
    const updatedApproval = await db.contentVersionApproval.update({
      where: { id: approval.id },
      data: {
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        comments,
      }
    });

    // Log the action
    await this.logAuditAction(user.id ?? "", approval.workflowId,
      approved ? AuditAction.APPROVE : AuditAction.REJECT,
      `${approved ? 'Approved' : 'Rejected'} version${comments ? `: ${comments}` : ''}`
    );

    // Check if stage is complete
    await this.checkStageCompletion(approval.workflowId);

    // Send notification
    await this.sendApprovalNotifications(
      [updatedApproval],
      NotificationType.IN_APP
    );

    return updatedApproval;
  }

  /**
   * Escalate approval to higher authority
   */
  static async escalateApproval(versionId: string, reason: string) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const workflow = await db.approvalWorkflow.findFirst({
      where: { contentVersionId: versionId }
    });

    if (!workflow) throw new Error("Workflow not found");

    // Update workflow
    await db.approvalWorkflow.update({
      where: { id: workflow.id },
      data: {
        status: WorkflowStatus.ACTIVE
      }
    });

    // Find administrators to escalate to
    // NOTE: Users don't have roles - AdminAccount has roles
    // TODO: Implement proper escalation to admins via AdminAccount
    // For now, escalate to users with specific permissions or capabilities
    const admins = await db.user.findMany({
      where: {
        // Could filter by isTeacher or other capabilities if needed
        // For now, get all active users
      },
      take: 5 // Limit to prevent too many escalations
    });

    // Create escalation approvals (batch insert instead of N+1)
    await db.contentVersionApproval.createMany({
      data: admins.map(admin => ({
        workflowId: workflow.id,
        approverId: admin.id,
        status: ApprovalStatus.PENDING,
        comments: `Escalated by ${user.name}: ${reason}`
      }))
    });

    // Fetch created approvals for downstream notification use
    const escalationApprovals = await db.contentVersionApproval.findMany({
      where: {
        workflowId: workflow.id,
        approverId: { in: admins.map(a => a.id) },
        status: ApprovalStatus.PENDING,
      }
    });

    // Send escalation notifications
    await this.sendApprovalNotifications(
      escalationApprovals,
      NotificationType.IN_APP
    );

    await this.logAuditAction(user.id || "", workflow.id, AuditAction.UPDATE,
      `Escalated approval: ${reason}`);

    return escalationApprovals;
  }

  /**
   * Get approval analytics
   */
  static async getApprovalAnalytics(dateRange: { start: Date; end: Date }, contentType?: string) {
    const user = await currentUser();
    // NOTE: Users don't have roles - only AdminAccount has roles
    // For content governance operations, just require authentication
    // Additional permission checks can be added via PermissionManager if needed
    if (!user) {
      throw new Error("Authentication required");
    }

    const analytics = await db.approvalAnalytics.findMany({
      where: {
        date: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      orderBy: { date: 'asc' },
      take: 100,
    });

    return {
      analytics,
      summary: null
    };
  }

  /**
   * Execute bulk approval operation
   */
  static async executeBulkApproval(request: BulkApprovalRequest) {
    const user = await currentUser();
    // NOTE: Users don't have roles - only AdminAccount has roles
    // For content governance operations, just require authentication
    // Additional permission checks can be added via PermissionManager if needed
    if (!user) {
      throw new Error("Authentication required");
    }

    const operation = await db.bulkApprovalOperation.create({
      data: {
        performedBy: { connect: { id: user.id! } },
        type: request.type,
        status: BulkOperationStatus.PENDING,
        totalCount: 0,
        targetWorkflows: []
      }
    });

    // Find matching approvals
    const whereClause: any = {};
    
    if (request.criteria.status) {
      whereClause.status = request.criteria.status;
    }
    
    if (request.criteria.priority) {
      whereClause.priority = request.criteria.priority;
    }

    if (request.criteria.versionIds) {
      whereClause.versionId = {
        in: request.criteria.versionIds
      };
    }

    const approvals = await db.contentVersionApproval.findMany({
      where: whereClause,
      take: 100,
    });

    await db.bulkApprovalOperation.update({
      where: { id: operation.id },
      data: {
        status: BulkOperationStatus.IN_PROGRESS,
        totalCount: approvals.length
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const approval of approvals) {
      try {
        switch (request.type) {
          case BulkOperationType.APPROVE_ALL:
            await db.contentVersionApproval.update({
              where: { id: approval.id },
              data: {
                status: ApprovalStatus.APPROVED,
                comments: request.action.comments || 'Bulk approved'
              }
            });
            break;
          
          case BulkOperationType.REJECT_ALL:
            await db.contentVersionApproval.update({
              where: { id: approval.id },
              data: {
                status: ApprovalStatus.REJECTED,
                comments: request.action.comments || 'Bulk rejected'
              }
            });
            break;
          
          // Unsupported types ignored
        }
        
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`Failed to process approval ${approval.id}: ${error}`);
      }
    }

    await db.bulkApprovalOperation.update({
      where: { id: operation.id },
      data: {
        status: failureCount > 0 ? BulkOperationStatus.PARTIALLY_COMPLETED : BulkOperationStatus.COMPLETED,
        completedAt: new Date(),
        processedCount: approvals.length,
        results: { successCount, failureCount, errors }
      }
    });

    // Optional: audit log per workflow could be added separately

    return operation;
  }

  /**
   * Get approval dashboard data
   */
  static async getApprovalDashboard(userId?: string) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const targetUserId = userId || user.id;

    const [
      pendingApprovals,
      recentApprovals,
      overdueApprovals,
      workflowStats
    ] = await Promise.all([
      db.contentVersionApproval.findMany({
        where: {
          approverId: targetUserId,
          status: ApprovalStatus.PENDING
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      db.contentVersionApproval.findMany({
        where: {
          approverId: targetUserId,
          status: { not: ApprovalStatus.PENDING }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),

      db.contentVersionApproval.findMany({
        where: {
          approverId: targetUserId,
          status: ApprovalStatus.PENDING
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      }),

      db.contentVersionApproval.groupBy({
        by: ['status'],
        where: {
          approverId: targetUserId
        },
        _count: true
      })
    ]);

    return {
      pendingApprovals,
      recentApprovals,
      overdueApprovals,
      workflowStats: workflowStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Private helper methods
   */
  private static async createStageApprovals(workflowId: string, reviewerIds?: string[]) {
    const approvals: any[] = [];
    const stageReviewers = reviewerIds || [];
    for (const reviewerId of stageReviewers) {
      const approval = await db.contentVersionApproval.create({
        data: {
          workflowId,
          approverId: reviewerId,
          status: ApprovalStatus.PENDING
        }
      });
      approvals.push(approval);
    }
    return approvals;
  }

  private static async getStageReviewers(stage: any): Promise<string[]> {
    // NOTE: Users don't have roles - only AdminAccount has roles
    // TODO: Implement proper reviewer selection based on permissions or capabilities
    // For now, get users with specific capabilities (e.g., isTeacher)
    const users = await db.user.findMany({
      where: {
        // Could filter by isTeacher or other capabilities
        // For now, get all active users
      },
      select: { id: true },
      take: 10 // Limit to prevent too many reviewers
    });

    return users.map(u => u.id);
  }

  private static async checkStageCompletion(workflowId: string) {
    const approvals = await db.contentVersionApproval.findMany({ where: { workflowId }, take: 100 });
    const hasReject = approvals.some(a => a.status === ApprovalStatus.REJECTED);
    const allApproved = approvals.length > 0 && approvals.every(a => a.status === ApprovalStatus.APPROVED);
    if (hasReject) {
      await db.approvalWorkflow.update({ where: { id: workflowId }, data: { status: WorkflowStatus.CANCELLED } });
    } else if (allApproved) {
      await db.approvalWorkflow.update({ where: { id: workflowId }, data: { status: WorkflowStatus.COMPLETED, completedAt: new Date() } });
    }
  }

  private static async advanceWorkflowStage(_versionId: string) {
    // Simplified: handled via checkStageCompletion
    return;
  }

  private static async sendApprovalNotifications(approvals: any[], type: NotificationType) {
    for (const approval of approvals) {
      await db.approvalNotification.create({
        data: {
          workflowId: approval.workflowId,
          recipientId: approval.approverId,
          type,
          subject: this.getNotificationTitle(type, {}),
          message: this.getNotificationMessage(type, {}),
        }
      });
    }
  }

  private static getNotificationTitle(type: NotificationType, _version?: any): string {
    switch (type) {
      default:
        return `Approval Update`;
    }
  }

  private static getNotificationMessage(type: NotificationType, _version?: any): string {
    switch (type) {
      default:
        return `There has been an update to your approval item.`;
    }
  }

  private static async logAuditAction(
    actorId: string,
    workflowId: string,
    action: AuditAction | string,
    description: string
  ) {
    await db.approvalAuditLog.create({
      data: {
        workflowId,
        actorId,
        action: typeof action === 'string' ? action : (action as unknown as string),
        details: { description }
      }
    });
  }
}
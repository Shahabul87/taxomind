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
  BulkOperationStatus,
  UserRole 
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
    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Admin access required");
    }

    const template = await db.approvalWorkflowTemplate.create({
      data: {
        name: config.name,
        description: config.description,
        contentType: config.contentType,
        category: config.category,
        isDefault: config.isDefault || false,
        authorId: user.id,
        stages: {
          create: config.stages.map(stage => ({
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
          }))
        }
      },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    await this.logAuditAction(user.id, template.id, AuditAction.CREATED, 
      `Created workflow template: ${config.name}`, {}, { templateId: template.id });

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
        include: { stages: { orderBy: { order: 'asc' } } }
      });
    } else {
      template = await db.approvalWorkflowTemplate.findFirst({
        where: {
          contentType: version.contentType,
          isDefault: true,
          isActive: true
        },
        include: { stages: { orderBy: { order: 'asc' } } }
      });
    }

    if (!template) throw new Error("No workflow template found");

    // Create workflow instance
    const workflow = await db.approvalWorkflow.create({
      data: {
        versionId: request.versionId,
        templateId: template.id,
        priority: request.priority || ApprovalPriority.MEDIUM,
        dueDate: request.dueDate,
        status: WorkflowStatus.PENDING
      }
    });

    // Create approval requests for first stage or parallel stages
    const firstStageApprovals = await this.createStageApprovals(
      template.stages.filter(s => s.order === 0 || s.isParallel),
      request.versionId,
      request.reviewerIds
    );

    // Send notifications
    await this.sendApprovalNotifications(
      firstStageApprovals,
      version,
      NotificationType.APPROVAL_REQUEST
    );

    await this.logAuditAction(user.id, request.versionId, AuditAction.WORKFLOW_STARTED,
      `Started approval workflow using template: ${template.name}`,
      {}, { workflowId: workflow.id, templateId: template.id });

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
        versionId,
        approverId,
        status: ApprovalStatus.PENDING
      },
      include: {
        version: true,
        stage: true
      }
    });

    if (!approval) throw new Error("Approval not found or already processed");

    // Update approval
    const updatedApproval = await db.contentVersionApproval.update({
      where: { id: approval.id },
      data: {
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        comments,
        reviewedAt: new Date(),
        timeSpent
      }
    });

    // Log the action
    await this.logAuditAction(user.id, versionId, 
      approved ? AuditAction.APPROVED : AuditAction.REJECTED,
      `${approved ? 'Approved' : 'Rejected'} version${comments ? `: ${comments}` : ''}`,
      { status: ApprovalStatus.PENDING },
      { status: updatedApproval.status, comments, timeSpent }
    );

    // Check if stage is complete
    await this.checkStageCompletion(versionId, approval.stage);

    // Send notification
    await this.sendApprovalNotifications(
      [updatedApproval],
      approval.version,
      approved ? NotificationType.APPROVAL_APPROVED : NotificationType.APPROVAL_REJECTED
    );

    return updatedApproval;
  }

  /**
   * Escalate approval to higher authority
   */
  static async escalateApproval(versionId: string, reason: string) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const workflow = await db.approvalWorkflow.findUnique({
      where: { versionId },
      include: {
        version: true,
        template: {
          include: {
            stages: { orderBy: { order: 'asc' } }
          }
        }
      }
    });

    if (!workflow) throw new Error("Workflow not found");

    // Update workflow
    await db.approvalWorkflow.update({
      where: { id: workflow.id },
      data: {
        status: WorkflowStatus.ESCALATED,
        escalatedAt: new Date(),
        escalatedBy: user.id,
        escalationReason: reason
      }
    });

    // Find administrators to escalate to
    const admins = await db.user.findMany({
      where: { role: UserRole.ADMIN }
    });

    // Create escalation approvals
    const escalationApprovals = await Promise.all(
      admins.map(admin => db.contentVersionApproval.create({
        data: {
          versionId,
          approverId: admin.id,
          priority: ApprovalPriority.URGENT,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          comments: `Escalated by ${user.name}: ${reason}`
        }
      }))
    );

    // Send escalation notifications
    await this.sendApprovalNotifications(
      escalationApprovals,
      workflow.version,
      NotificationType.APPROVAL_ESCALATED
    );

    await this.logAuditAction(user.id, versionId, AuditAction.ESCALATED,
      `Escalated approval: ${reason}`, {}, { escalationReason: reason });

    return escalationApprovals;
  }

  /**
   * Get approval analytics
   */
  static async getApprovalAnalytics(dateRange: { start: Date; end: Date }, contentType?: string) {
    const user = await currentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Admin access required");
    }

    const analytics = await db.approvalAnalytics.findMany({
      where: {
        date: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        contentType: contentType || undefined
      },
      orderBy: { date: 'asc' }
    });

    const summary = await db.approvalAnalytics.aggregate({
      where: {
        date: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        contentType: contentType || undefined
      },
      _sum: {
        totalApprovals: true,
        approvedCount: true,
        rejectedCount: true,
        pendingCount: true
      },
      _avg: {
        avgProcessingTime: true,
        avgStages: true,
        escalationRate: true
      }
    });

    return {
      analytics,
      summary
    };
  }

  /**
   * Execute bulk approval operation
   */
  static async executeBulkApproval(request: BulkApprovalRequest) {
    const user = await currentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Admin access required");
    }

    const operation = await db.bulkApprovalOperation.create({
      data: {
        operatorId: user.id,
        type: request.type,
        criteria: JSON.stringify(request.criteria),
        status: BulkOperationStatus.PENDING
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
      include: {
        version: true,
        approver: true
      }
    });

    await db.bulkApprovalOperation.update({
      where: { id: operation.id },
      data: {
        status: BulkOperationStatus.IN_PROGRESS,
        totalItems: approvals.length
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
                reviewedAt: new Date(),
                comments: request.action.comments || 'Bulk approved'
              }
            });
            break;
          
          case BulkOperationType.REJECT_ALL:
            await db.contentVersionApproval.update({
              where: { id: approval.id },
              data: {
                status: ApprovalStatus.REJECTED,
                reviewedAt: new Date(),
                comments: request.action.comments || 'Bulk rejected'
              }
            });
            break;
          
          case BulkOperationType.UPDATE_PRIORITY:
            await db.contentVersionApproval.update({
              where: { id: approval.id },
              data: {
                priority: request.action.priority || ApprovalPriority.MEDIUM
              }
            });
            break;
        }
        
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push(`Failed to process approval ${approval.id}: ${error}`);
      }
    }

    await db.bulkApprovalOperation.update({
      where: { id: operation.id },
      data: {
        status: failureCount > 0 ? BulkOperationStatus.PARTIALLY_COMPLETED : BulkOperationStatus.COMPLETED,
        completedAt: new Date(),
        processedItems: approvals.length,
        successCount,
        failureCount,
        errors: JSON.stringify(errors)
      }
    });

    await this.logAuditAction(user.id, operation.id, AuditAction.BULK_APPROVED,
      `Bulk operation: ${request.type} - ${successCount} successful, ${failureCount} failed`,
      {}, { operationId: operation.id, successCount, failureCount });

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
        include: {
          version: {
            include: {
              author: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      db.contentVersionApproval.findMany({
        where: {
          approverId: targetUserId,
          status: { not: ApprovalStatus.PENDING }
        },
        include: {
          version: {
            include: {
              author: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { reviewedAt: 'desc' },
        take: 10
      }),

      db.contentVersionApproval.findMany({
        where: {
          approverId: targetUserId,
          status: ApprovalStatus.PENDING,
          dueDate: { lt: new Date() }
        },
        include: {
          version: {
            include: {
              author: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { dueDate: 'asc' }
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
  private static async createStageApprovals(stages: any[], versionId: string, reviewerIds?: string[]) {
    const approvals = [];
    
    for (const stage of stages) {
      const stageReviewers = reviewerIds || await this.getStageReviewers(stage);
      
      for (const reviewerId of stageReviewers) {
        const approval = await db.contentVersionApproval.create({
          data: {
            versionId,
            approverId: reviewerId,
            stageId: stage.id,
            stageOrder: stage.order,
            priority: ApprovalPriority.MEDIUM,
            dueDate: stage.timeLimit ? new Date(Date.now() + stage.timeLimit * 60 * 60 * 1000) : undefined
          }
        });
        approvals.push(approval);
      }
    }
    
    return approvals;
  }

  private static async getStageReviewers(stage: any): Promise<string[]> {
    const users = await db.user.findMany({
      where: {
        role: {
          in: stage.requiredRoles
        }
      },
      select: { id: true }
    });

    return users.map(u => u.id);
  }

  private static async checkStageCompletion(versionId: string, stage: any) {
    if (!stage) return;

    const stageApprovals = await db.contentVersionApproval.findMany({
      where: {
        versionId,
        stageId: stage.id
      }
    });

    const approvedCount = stageApprovals.filter(a => a.status === ApprovalStatus.APPROVED).length;
    const rejectedCount = stageApprovals.filter(a => a.status === ApprovalStatus.REJECTED).length;

    // Check if stage is complete
    const isApproved = approvedCount >= stage.minApprovals;
    const isRejected = rejectedCount > 0;

    if (isApproved && !isRejected) {
      // Move to next stage
      await this.advanceWorkflowStage(versionId);
    } else if (isRejected) {
      // Reject workflow
      await db.approvalWorkflow.update({
        where: { versionId },
        data: { status: WorkflowStatus.REJECTED }
      });
    }
  }

  private static async advanceWorkflowStage(versionId: string) {
    const workflow = await db.approvalWorkflow.findUnique({
      where: { versionId },
      include: {
        template: {
          include: {
            stages: { orderBy: { order: 'asc' } }
          }
        }
      }
    });

    if (!workflow) return;

    const nextStage = workflow.template.stages.find(s => s.order > workflow.currentStage);
    
    if (nextStage) {
      await db.approvalWorkflow.update({
        where: { id: workflow.id },
        data: { currentStage: nextStage.order }
      });

      await this.createStageApprovals([nextStage], versionId);
    } else {
      // Workflow complete
      await db.approvalWorkflow.update({
        where: { id: workflow.id },
        data: { 
          status: WorkflowStatus.COMPLETED,
          completedAt: new Date()
        }
      });

      await db.contentVersion.update({
        where: { id: versionId },
        data: { status: 'PUBLISHED', publishedAt: new Date() }
      });
    }
  }

  private static async sendApprovalNotifications(approvals: any[], version: any, type: NotificationType) {
    for (const approval of approvals) {
      await db.approvalNotification.create({
        data: {
          userId: approval.approverId,
          versionId: version.id,
          type,
          priority: approval.priority,
          title: this.getNotificationTitle(type, version),
          message: this.getNotificationMessage(type, version),
          actionUrl: `/approval/${approval.id}`
        }
      });
    }
  }

  private static getNotificationTitle(type: NotificationType, version: any): string {
    switch (type) {
      case NotificationType.APPROVAL_REQUEST:
        return `Approval Required: ${version.title || 'Content Version'}`;
      case NotificationType.APPROVAL_APPROVED:
        return `Approved: ${version.title || 'Content Version'}`;
      case NotificationType.APPROVAL_REJECTED:
        return `Rejected: ${version.title || 'Content Version'}`;
      case NotificationType.APPROVAL_ESCALATED:
        return `Escalated: ${version.title || 'Content Version'}`;
      default:
        return `Approval Update: ${version.title || 'Content Version'}`;
    }
  }

  private static getNotificationMessage(type: NotificationType, version: any): string {
    switch (type) {
      case NotificationType.APPROVAL_REQUEST:
        return `A new ${version.contentType} version requires your approval.`;
      case NotificationType.APPROVAL_APPROVED:
        return `Your ${version.contentType} version has been approved.`;
      case NotificationType.APPROVAL_REJECTED:
        return `Your ${version.contentType} version has been rejected.`;
      case NotificationType.APPROVAL_ESCALATED:
        return `This ${version.contentType} version has been escalated for review.`;
      default:
        return `There has been an update to your ${version.contentType} version.`;
    }
  }

  private static async logAuditAction(
    userId: string,
    versionId: string,
    action: AuditAction,
    description: string,
    beforeState?: any,
    afterState?: any
  ) {
    await db.approvalAuditLog.create({
      data: {
        userId,
        versionId,
        action,
        description,
        beforeState: beforeState ? JSON.stringify(beforeState) : undefined,
        afterState: afterState ? JSON.stringify(afterState) : undefined,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() })
      }
    });
  }
}
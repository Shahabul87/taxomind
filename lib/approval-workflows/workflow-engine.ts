import { z } from 'zod';

// Workflow Schema Definitions
export const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['approval', 'review', 'auto_check', 'notification', 'condition']),
  assigneeType: z.enum(['user', 'role', 'department', 'auto']),
  assigneeIds: z.array(z.string()),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.any()
  })).optional(),
  autoApproveAfter: z.number().optional(), // hours
  escalationAfter: z.number().optional(), // hours
  escalationTo: z.array(z.string()).optional(),
  requiredActions: z.array(z.enum(['approve', 'reject', 'comment', 'edit'])).optional(),
  parallel: z.boolean().default(false),
  optional: z.boolean().default(false)
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  contentType: z.enum(['course', 'lesson', 'quiz', 'assignment', 'template', 'general']),
  triggers: z.array(z.enum(['create', 'update', 'publish', 'schedule', 'manual'])),
  steps: z.array(WorkflowStepSchema),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.string(),
  metadata: z.record(z.any()).optional()
});

export const WorkflowInstanceSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  contentId: z.string(),
  contentType: z.string(),
  status: z.enum(['pending', 'in_progress', 'approved', 'rejected', 'cancelled']),
  currentStepId: z.string().optional(),
  completedSteps: z.array(z.string()),
  submittedBy: z.string(),
  submittedAt: z.date(),
  completedAt: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.date().optional(),
  data: z.record(z.any()),
  history: z.array(z.object({
    stepId: z.string(),
    action: z.enum(['submit', 'approve', 'reject', 'comment', 'escalate', 'auto_approve', 'request_changes']),
    userId: z.string(),
    timestamp: z.date(),
    comment: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }))
});

export const ApprovalActionSchema = z.object({
  instanceId: z.string(),
  stepId: z.string(),
  action: z.enum(['approve', 'reject', 'request_changes', 'comment']),
  userId: z.string(),
  comment: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  timestamp: z.date()
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;
export type ApprovalAction = z.infer<typeof ApprovalActionSchema>;

// Workflow Engine Class
export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  private notifications: Array<{
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data: any;
    timestamp: Date;
    read: boolean;
  }> = [];

  constructor() {
    this.initializeDefaultWorkflows();
    this.startAutomationTimers();
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Workflow> {
    const newWorkflow: Workflow = {
      ...workflow,
      id: this.generateId('workflow'),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0'
    };

    const validatedWorkflow = WorkflowSchema.parse(newWorkflow);
    this.workflows.set(validatedWorkflow.id, validatedWorkflow);

    return validatedWorkflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const existing = this.workflows.get(id);
    if (!existing) return null;

    const updated: Workflow = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      version: this.incrementVersion(existing.version)
    };

    const validatedWorkflow = WorkflowSchema.parse(updated);
    this.workflows.set(id, validatedWorkflow);

    return validatedWorkflow;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async listWorkflows(filters?: {
    contentType?: string;
    isActive?: boolean;
    createdBy?: string;
  }): Promise<Workflow[]> {
    let workflows = Array.from(this.workflows.values());

    if (filters) {
      if (filters.contentType) {
        workflows = workflows.filter(w => w.contentType === filters.contentType);
      }
      if (filters.isActive !== undefined) {
        workflows = workflows.filter(w => w.isActive === filters.isActive);
      }
      if (filters.createdBy) {
        workflows = workflows.filter(w => w.createdBy === filters.createdBy);
      }
    }

    return workflows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Instance Management
  async startWorkflow(
    workflowId: string, 
    contentId: string, 
    contentType: string, 
    submittedBy: string,
    data: Record<string, any> = {},
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<WorkflowInstance | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.isActive) return null;

    const instance: WorkflowInstance = {
      id: this.generateId('instance'),
      workflowId,
      contentId,
      contentType,
      status: 'pending',
      completedSteps: [],
      submittedBy,
      submittedAt: new Date(),
      priority,
      data,
      history: [{
        stepId: 'submission',
        action: 'submit',
        userId: submittedBy,
        timestamp: new Date(),
        comment: 'Workflow initiated'
      }]
    };

    // Find first step
    const firstStep = workflow.steps[0];
    if (firstStep) {
      instance.currentStepId = firstStep.id;
      instance.status = 'in_progress';
      
      // Set due date based on escalation settings
      if (firstStep.escalationAfter) {
        instance.dueDate = new Date(Date.now() + firstStep.escalationAfter * 60 * 60 * 1000);
      }
    }

    const validatedInstance = WorkflowInstanceSchema.parse(instance);
    this.instances.set(validatedInstance.id, validatedInstance);

    // Notify assignees of first step
    await this.notifyStepAssignees(validatedInstance, firstStep);

    return validatedInstance;
  }

  async processAction(action: Omit<ApprovalAction, 'timestamp'>): Promise<WorkflowInstance | null> {
    const actionWithTimestamp: ApprovalAction = {
      ...action,
      timestamp: new Date()
    };

    const validatedAction = ApprovalActionSchema.parse(actionWithTimestamp);
    const instance = this.instances.get(validatedAction.instanceId);
    
    if (!instance || instance.status !== 'in_progress') {
      throw new Error('Invalid instance or instance not in progress');
    }

    const workflow = this.workflows.get(instance.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const currentStep = workflow.steps.find(s => s.id === validatedAction.stepId);
    if (!currentStep || instance.currentStepId !== validatedAction.stepId) {
      throw new Error('Invalid step or step mismatch');
    }

    // Add to history
    instance.history.push({
      stepId: validatedAction.stepId,
      action: validatedAction.action,
      userId: validatedAction.userId,
      timestamp: validatedAction.timestamp,
      comment: validatedAction.comment,
      metadata: { attachments: validatedAction.attachments }
    });

    // Process the action
    let moveToNextStep = false;

    switch (validatedAction.action) {
      case 'approve':
        instance.completedSteps.push(validatedAction.stepId);
        moveToNextStep = true;
        break;

      case 'reject':
        instance.status = 'rejected';
        instance.completedAt = new Date();
        await this.notifyWorkflowCompletion(instance, 'rejected');
        break;

      case 'request_changes':
        // Send back to submitter for changes
        await this.notifySubmitter(instance, 'changes_requested', validatedAction.comment);
        break;

      case 'comment':
        // Just add comment, don't change workflow state
        break;
    }

    // Move to next step if approved
    if (moveToNextStep) {
      const nextStep = this.findNextStep(workflow, instance);
      
      if (nextStep) {
        instance.currentStepId = nextStep.id;
        
        // Set new due date
        if (nextStep.escalationAfter) {
          instance.dueDate = new Date(Date.now() + nextStep.escalationAfter * 60 * 60 * 1000);
        }
        
        // Notify next step assignees
        await this.notifyStepAssignees(instance, nextStep);
      } else {
        // Workflow complete
        instance.status = 'approved';
        instance.completedAt = new Date();
        instance.currentStepId = undefined;
        await this.notifyWorkflowCompletion(instance, 'approved');
      }
    }

    this.instances.set(instance.id, instance);
    return instance;
  }

  async getInstance(id: string): Promise<WorkflowInstance | null> {
    return this.instances.get(id) || null;
  }

  async getUserInstances(userId: string, status?: string): Promise<WorkflowInstance[]> {
    const instances = Array.from(this.instances.values());
    
    return instances.filter(instance => {
      // Filter by status if provided
      if (status && instance.status !== status) return false;
      
      // Check if user is involved in the instance
      if (instance.submittedBy === userId) return true;
      
      // Check if user is an assignee of current step
      const workflow = this.workflows.get(instance.workflowId);
      if (workflow && instance.currentStepId) {
        const currentStep = workflow.steps.find(s => s.id === instance.currentStepId);
        if (currentStep) {
          return this.isUserAssignee(userId, currentStep);
        }
      }
      
      return false;
    }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Step Evaluation
  private findNextStep(workflow: Workflow, instance: WorkflowInstance): WorkflowStep | null {
    const currentStepIndex = workflow.steps.findIndex(s => s.id === instance.currentStepId);
    
    for (let i = currentStepIndex + 1; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      // Check if step conditions are met
      if (this.evaluateStepConditions(step, instance)) {
        return step;
      }
      
      // Skip optional steps if conditions not met
      if (!step.optional) {
        return step;
      }
    }
    
    return null;
  }

  private evaluateStepConditions(step: WorkflowStep, instance: WorkflowInstance): boolean {
    if (!step.conditions || step.conditions.length === 0) return true;
    
    return step.conditions.every(condition => {
      const fieldValue = this.getFieldValue(instance.data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private getFieldValue(data: Record<string, any>, field: string): any {
    const keys = field.split('.');
    let value = data;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // User and Role Management
  async assignUserRoles(userId: string, roles: string[]): Promise<void> {
    this.userRoles.set(userId, roles);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    return this.userRoles.get(userId) || [];
  }

  private isUserAssignee(userId: string, step: WorkflowStep): boolean {
    const userRoles = this.userRoles.get(userId) || [];
    
    switch (step.assigneeType) {
      case 'user':
        return step.assigneeIds.includes(userId);
      
      case 'role':
        return step.assigneeIds.some(roleId => userRoles.includes(roleId));
      
      case 'department':
        // In a real implementation, this would check department membership
        return step.assigneeIds.some(deptId => userRoles.includes(`dept:${deptId}`));
      
      case 'auto':
        return false; // Auto steps don't have assignees
      
      default:
        return false;
    }
  }

  // Notifications
  private async notifyStepAssignees(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const assigneeIds = await this.getStepAssignees(step);
    
    for (const assigneeId of assigneeIds) {
      await this.createNotification(assigneeId, {
        type: 'approval_required',
        title: 'Approval Required',
        message: `You have a new ${step.type} task for ${instance.contentType}`,
        data: {
          instanceId: instance.id,
          stepId: step.id,
          contentId: instance.contentId,
          priority: instance.priority
        }
      });
    }
  }

  private async notifySubmitter(instance: WorkflowInstance, type: string, message?: string): Promise<void> {
    await this.createNotification(instance.submittedBy, {
      type,
      title: 'Workflow Update',
      message: message || `Your ${instance.contentType} workflow has been updated`,
      data: {
        instanceId: instance.id,
        contentId: instance.contentId
      }
    });
  }

  private async notifyWorkflowCompletion(instance: WorkflowInstance, status: string): Promise<void> {
    await this.createNotification(instance.submittedBy, {
      type: 'workflow_completed',
      title: `Workflow ${status}`,
      message: `Your ${instance.contentType} has been ${status}`,
      data: {
        instanceId: instance.id,
        contentId: instance.contentId,
        status
      }
    });
  }

  private async createNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data: any;
  }): Promise<void> {
    this.notifications.push({
      id: this.generateId('notification'),
      userId,
      ...notification,
      timestamp: new Date(),
      read: false
    });
  }

  private async getStepAssignees(step: WorkflowStep): Promise<string[]> {
    // This would integrate with your user management system
    return step.assigneeIds;
  }

  // Automation and Timers
  private startAutomationTimers(): void {
    // Check for escalations and auto-approvals every minute
    setInterval(() => {
      this.processAutomation();
    }, 60 * 1000);
  }

  private async processAutomation(): Promise<void> {
    const now = new Date();
    
    for (const instance of this.instances.values()) {
      if (instance.status !== 'in_progress' || !instance.currentStepId) continue;
      
      const workflow = this.workflows.get(instance.workflowId);
      if (!workflow) continue;
      
      const currentStep = workflow.steps.find(s => s.id === instance.currentStepId);
      if (!currentStep) continue;
      
      // Check for auto-approval
      if (currentStep.autoApproveAfter) {
        const autoApproveTime = new Date(instance.submittedAt.getTime() + currentStep.autoApproveAfter * 60 * 60 * 1000);
        
        if (now >= autoApproveTime) {
          await this.processAction({
            instanceId: instance.id,
            stepId: currentStep.id,
            action: 'approve',
            userId: 'system',
            comment: 'Auto-approved due to timeout'
          });
          continue;
        }
      }
      
      // Check for escalation
      if (currentStep.escalationAfter && currentStep.escalationTo) {
        const escalationTime = new Date(instance.submittedAt.getTime() + currentStep.escalationAfter * 60 * 60 * 1000);
        
        if (now >= escalationTime) {
          // Notify escalation contacts
          for (const escalationUserId of currentStep.escalationTo) {
            await this.createNotification(escalationUserId, {
              type: 'escalation',
              title: 'Workflow Escalation',
              message: `Workflow for ${instance.contentType} requires attention`,
              data: {
                instanceId: instance.id,
                stepId: currentStep.id,
                contentId: instance.contentId,
                priority: 'urgent'
              }
            });
          }
        }
      }
    }
  }

  // Analytics and Reporting
  async getWorkflowAnalytics(workflowId?: string): Promise<{
    totalInstances: number;
    averageProcessingTime: number;
    approvalRate: number;
    bottlenecks: Array<{ stepId: string; avgTime: number; count: number }>;
    volumeByDay: Array<{ date: string; count: number }>;
  }> {
    let instances = Array.from(this.instances.values());
    
    if (workflowId) {
      instances = instances.filter(i => i.workflowId === workflowId);
    }
    
    const completedInstances = instances.filter(i => i.completedAt);
    
    const totalInstances = instances.length;
    const approvalRate = completedInstances.filter(i => i.status === 'approved').length / 
                        Math.max(completedInstances.length, 1);
    
    const averageProcessingTime = completedInstances.reduce((sum, instance) => {
      const processingTime = instance.completedAt!.getTime() - instance.submittedAt.getTime();
      return sum + processingTime;
    }, 0) / Math.max(completedInstances.length, 1);
    
    // Calculate bottlenecks (simplified)
    const stepTimes = new Map<string, { total: number; count: number }>();
    
    completedInstances.forEach(instance => {
      instance.history.forEach((entry, index) => {
        if (index > 0) {
          const prevEntry = instance.history[index - 1];
          const duration = entry.timestamp.getTime() - prevEntry.timestamp.getTime();
          
          const existing = stepTimes.get(entry.stepId) || { total: 0, count: 0 };
          stepTimes.set(entry.stepId, {
            total: existing.total + duration,
            count: existing.count + 1
          });
        }
      });
    });
    
    const bottlenecks = Array.from(stepTimes.entries()).map(([stepId, data]) => ({
      stepId,
      avgTime: data.total / data.count,
      count: data.count
    })).sort((a, b) => b.avgTime - a.avgTime);
    
    // Volume by day (last 30 days)
    const volumeByDay: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = instances.filter(instance => 
        instance.submittedAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      volumeByDay.push({ date: dateStr, count });
    }
    
    return {
      totalInstances,
      averageProcessingTime,
      approvalRate,
      bottlenecks,
      volumeByDay
    };
  }

  // Utility Methods
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private initializeDefaultWorkflows(): void {
    // Create default workflows for common content types
    this.createDefaultCourseWorkflow();
    this.createDefaultQuizWorkflow();
  }

  private async createDefaultCourseWorkflow(): Promise<void> {
    await this.createWorkflow({
      name: 'Course Approval',
      description: 'Standard approval workflow for new courses',
      contentType: 'course',
      triggers: ['create', 'update'],
      steps: [
        {
          id: 'content_review',
          name: 'Content Review',
          description: 'Review course content for accuracy and quality',
          type: 'review',
          assigneeType: 'role',
          assigneeIds: ['content_reviewer'],
          autoApproveAfter: 48,
          escalationAfter: 24,
          escalationTo: ['content_manager'],
          requiredActions: ['approve', 'reject', 'comment'],
          parallel: false,
          optional: false
        },
        {
          id: 'technical_review',
          name: 'Technical Review',
          description: 'Review technical aspects and functionality',
          type: 'review',
          assigneeType: 'role',
          assigneeIds: ['technical_reviewer'],
          autoApproveAfter: 24,
          escalationAfter: 12,
          escalationTo: ['technical_lead'],
          parallel: false,
          optional: false
        },
        {
          id: 'final_approval',
          name: 'Final Approval',
          description: 'Final approval from course manager',
          type: 'approval',
          assigneeType: 'role',
          assigneeIds: ['course_manager'],
          escalationAfter: 8,
          escalationTo: ['director'],
          parallel: false,
          optional: false
        }
      ],
      isActive: true,
      createdBy: 'system'
    });
  }

  private async createDefaultQuizWorkflow(): Promise<void> {
    await this.createWorkflow({
      name: 'Quiz Approval',
      description: 'Approval workflow for quizzes and assessments',
      contentType: 'quiz',
      triggers: ['create', 'update'],
      steps: [
        {
          id: 'content_validation',
          name: 'Content Validation',
          description: 'Validate quiz content and answers',
          type: 'review',
          assigneeType: 'role',
          assigneeIds: ['quiz_reviewer'],
          autoApproveAfter: 24,
          escalationAfter: 12,
          escalationTo: ['content_manager'],
          parallel: false,
          optional: false
        },
        {
          id: 'manager_approval',
          name: 'Manager Approval',
          description: 'Final approval from manager',
          type: 'approval',
          assigneeType: 'role',
          assigneeIds: ['quiz_manager'],
          escalationAfter: 4,
          escalationTo: ['director'],
          parallel: false,
          optional: false
        }
      ],
      isActive: true,
      createdBy: 'system'
    });
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
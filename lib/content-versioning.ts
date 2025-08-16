import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole, ContentType, AITemplateType } from "@prisma/client";

export interface ContentSnapshot {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  metadata?: any;
  [key: string]: any;
}

export interface CreateVersionParams {
  contentType: ContentType;
  contentId: string;
  contentSnapshot: ContentSnapshot;
  // increment type no longer used; always increments integer versionNumber
  title?: string;
  description?: string;
  changeLog?: string[];
  scheduledAt?: Date;
}

export interface VersionInfo {
  id: string;
  versionNumber: number;
  isActive: boolean;
  title?: string;
  description?: string;
  author: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt: Date;
  publishedAt?: Date;
  changeLog: string[];
}

export class ContentVersioningService {
  
  /**
   * Create a new version of content
   */
  static async createVersion({
    contentType,
    contentId,
    contentSnapshot,
    // versionType is ignored in integer versioning
    title,
    description,
    changeLog = [],
    scheduledAt
  }: CreateVersionParams) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    // Get the latest version number to determine new version number
    const latestVersion = await this.getLatestVersion(contentType, contentId);
    const newVersionNumber = this.generateNextVersionNumber(latestVersion?.versionNumber ?? 0);

    const version = await db.contentVersion.create({
      data: {
        contentType,
        contentId,
        versionNumber: newVersionNumber,
        title,
        changesSummary: description,
        changes: changeLog,
        metadata: contentSnapshot,
        author: { connect: { id: user.id! } }
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return version;
  }

  /**
   * Publish a version
   */
  static async publishVersion(versionId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const version = await db.contentVersion.findUnique({
      where: { id: versionId },
      include: { author: true }
    });

    if (!version) throw new Error("Version not found");

    // Check permissions
    const canPublish = user.role === UserRole.ADMIN || 
                      user.role === UserRole.USER || 
                      version.authorId === user.id;
    
    if (!canPublish) throw new Error("Insufficient permissions to publish");

    // Deactivate current active version
    await db.contentVersion.updateMany({
      where: {
        contentType: version.contentType,
        contentId: version.contentId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Publish new version
    const publishedVersion = await db.contentVersion.update({
      where: { id: versionId },
      data: {
        isActive: true,
        approvedAt: new Date(),
        approvedBy: user.id
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return publishedVersion;
  }

  /**
   * Rollback to a previous version
   */
  static async rollbackToVersion(
    contentType: ContentType,
    contentId: string,
    targetVersionId: string,
    reason?: string
  ) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const targetVersion = await db.contentVersion.findUnique({
      where: { id: targetVersionId }
    });

    if (!targetVersion) throw new Error("Target version not found");

    const currentVersion = await this.getPublishedVersion(contentType, contentId);
    if (!currentVersion) throw new Error("No published version found");

    // Create rollback version
    const rollbackVersion = await this.createVersion({
      contentType,
      contentId,
      contentSnapshot: (targetVersion.metadata as any) || {},
      title: `Rollback to ${targetVersion.versionNumber}`,
      description: `Rolled back from ${currentVersion.versionNumber} to ${targetVersion.versionNumber}. Reason: ${reason || 'No reason provided'}`,
      changeLog: [`Rollback to version ${targetVersion.versionNumber}`]
    });

    // Update rollback metadata
    await db.contentVersion.update({
      where: { id: rollbackVersion.id },
      data: {
        metadata: {
          ...(rollbackVersion.metadata as any),
          rollback: { fromVersionId: currentVersion.id, reason }
        }
      }
    });

    // Publish the rollback version
    return await this.publishVersion(rollbackVersion.id);
  }

  /**
   * Get version history for content
   */
  static async getVersionHistory(contentType: ContentType, contentId: string): Promise<VersionInfo[]> {
    const versions = await db.contentVersion.findMany({
      where: { contentType, contentId },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return versions.map(version => ({
      id: version.id,
      versionNumber: version.versionNumber,
      isActive: version.isActive,
      title: version.title || undefined,
      description: version.changesSummary || undefined,
      author: { id: version.author!.id, name: version.author!.name ?? undefined, email: version.author!.email ?? undefined },
      createdAt: version.createdAt,
      publishedAt: version.approvedAt || undefined,
      changeLog: (version.changes as any[]) || []
    }));
  }

  /**
   * Get a specific version
   */
  static async getVersion(versionId: string) {
    return await db.contentVersion.findUnique({
      where: { id: versionId },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Get the published version of content
   */
  static async getPublishedVersion(contentType: ContentType, contentId: string) {
    return await db.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
        isActive: true
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Get the latest version (any status)
   */
  static async getLatestVersion(contentType: ContentType, contentId: string) {
    return await db.contentVersion.findFirst({
      where: { contentType, contentId },
      orderBy: { versionNumber: 'desc' }
    });
  }

  /**
   * Get content at a specific version
   */
  static async getContentAtVersion(versionId: string): Promise<ContentSnapshot | null> {
    const version = await db.contentVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) return null;

    return (version.metadata as any) || null;
  }

  /**
   * Submit version for review
   */
  static async submitForReview(versionId: string, reviewerIds: string[]) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    // Mark as pending approval via metadata; workflow handled elsewhere
    await db.contentVersion.update({
      where: { id: versionId },
      data: {
        metadata: {
          reviewRequestedBy: user.id,
          reviewerIds
        }
      }
    });

    return [];
  }

  /**
   * Approve or reject a version
   */
  static async reviewVersion(
    versionId: string,
    approved: boolean,
    comments?: string
  ) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    // Minimal review handling: toggle isActive on approved
    const updated = await db.contentVersion.update({
      where: { id: versionId },
      data: approved
        ? { isActive: true, approvedAt: new Date(), approvedBy: user.id }
        : { isActive: false }
    });

    return updated;
  }

  /**
   * Generate next version number based on type
   */
  private static generateNextVersionNumber(currentVersion: number): number {
    return (currentVersion || 0) + 1;
  }

  /**
   * Create content template from version
   */
  static async createTemplate(
    versionId: string,
    templateName: string,
    description?: string,
    category?: string,
    isPublic: boolean = false
  ) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    const version = await db.contentVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) throw new Error("Version not found");

    const template = await db.aIContentTemplate.create({
      data: {
        id: crypto.randomUUID(),
        name: templateName,
        description,
        templateType: AITemplateType.COURSE_OUTLINE,
        category,
        promptTemplate: JSON.stringify(version.metadata || {}),
        contentStructure: (version.metadata as any) || {},
        isPublic,
        isActive: true,
        User: user.id ? { connect: { id: user.id } } : undefined,
        updatedAt: new Date()
      }
    });

    return template;
  }

  /**
   * Apply template to create new content version
   */
  static async applyTemplate(
    templateId: string,
    contentType: string,
    contentId: string,
    customizations?: Partial<ContentSnapshot>
  ) {
    const template = await db.aIContentTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) throw new Error("Template not found");

    // Update usage count
    await db.aIContentTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    });

    const templateData = template?.promptTemplate ? JSON.parse(template.promptTemplate) : {};
    const contentSnapshot = { ...templateData, ...customizations };

    return await this.createVersion({
      contentType: contentType as ContentType,
      contentId,
      contentSnapshot,
      title: `Applied template: ${template.name}`,
      changeLog: [`Applied template "${template.name}"`]
    });
  }
}
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { VersionStatus, VersionType, UserRole } from "@prisma/client";

export interface ContentSnapshot {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  metadata?: any;
  [key: string]: any;
}

export interface CreateVersionParams {
  contentType: string;
  contentId: string;
  contentSnapshot: ContentSnapshot;
  versionType?: VersionType;
  title?: string;
  description?: string;
  changeLog?: string[];
  scheduledAt?: Date;
}

export interface VersionInfo {
  id: string;
  versionNumber: string;
  status: VersionStatus;
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
    versionType = VersionType.PATCH,
    title,
    description,
    changeLog = [],
    scheduledAt
  }: CreateVersionParams) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    // Get the latest version to determine new version number
    const latestVersion = await this.getLatestVersion(contentType, contentId);
    const newVersionNumber = this.generateNextVersionNumber(latestVersion?.versionNumber || "0.0.0", versionType);
    const [major, minor, patch] = newVersionNumber.split('.').map(Number);

    const version = await db.contentVersion.create({
      data: {
        contentType,
        contentId,
        versionNumber: newVersionNumber,
        majorVersion: major,
        minorVersion: minor,
        patchVersion: patch,
        versionType,
        status: scheduledAt ? VersionStatus.SCHEDULED : VersionStatus.DRAFT,
        title,
        description,
        changeLog: JSON.stringify(changeLog),
        contentSnapshot: JSON.stringify(contentSnapshot),
        authorId: user.id,
        scheduledAt,
        parentVersionId: latestVersion?.id
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
                      user.role === UserRole.TEACHER || 
                      version.authorId === user.id;
    
    if (!canPublish) throw new Error("Insufficient permissions to publish");

    // Archive current published version
    await db.contentVersion.updateMany({
      where: {
        contentType: version.contentType,
        contentId: version.contentId,
        status: VersionStatus.PUBLISHED
      },
      data: {
        status: VersionStatus.ARCHIVED,
        archivedAt: new Date()
      }
    });

    // Publish new version
    const publishedVersion = await db.contentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.PUBLISHED,
        publishedAt: new Date()
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
    contentType: string,
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
      contentSnapshot: JSON.parse(targetVersion.contentSnapshot as string),
      versionType: VersionType.HOTFIX,
      title: `Rollback to ${targetVersion.versionNumber}`,
      description: `Rolled back from ${currentVersion.versionNumber} to ${targetVersion.versionNumber}. Reason: ${reason || 'No reason provided'}`,
      changeLog: [`Rollback to version ${targetVersion.versionNumber}`]
    });

    // Update rollback metadata
    await db.contentVersion.update({
      where: { id: rollbackVersion.id },
      data: {
        isRollback: true,
        rollbackFromId: currentVersion.id,
        rollbackReason: reason
      }
    });

    // Publish the rollback version
    return await this.publishVersion(rollbackVersion.id);
  }

  /**
   * Get version history for content
   */
  static async getVersionHistory(contentType: string, contentId: string): Promise<VersionInfo[]> {
    const versions = await db.contentVersion.findMany({
      where: { contentType, contentId },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { majorVersion: 'desc' },
        { minorVersion: 'desc' },
        { patchVersion: 'desc' }
      ]
    });

    return versions.map(version => ({
      id: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      title: version.title || undefined,
      description: version.description || undefined,
      author: version.author,
      createdAt: version.createdAt,
      publishedAt: version.publishedAt || undefined,
      changeLog: JSON.parse(version.changeLog as string)
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
        },
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Get the published version of content
   */
  static async getPublishedVersion(contentType: string, contentId: string) {
    return await db.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
        status: VersionStatus.PUBLISHED
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
  static async getLatestVersion(contentType: string, contentId: string) {
    return await db.contentVersion.findFirst({
      where: { contentType, contentId },
      orderBy: [
        { majorVersion: 'desc' },
        { minorVersion: 'desc' },
        { patchVersion: 'desc' }
      ]
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

    return JSON.parse(version.contentSnapshot as string);
  }

  /**
   * Submit version for review
   */
  static async submitForReview(versionId: string, reviewerIds: string[]) {
    const user = await currentUser();
    if (!user) throw new Error("Authentication required");

    // Update version status
    await db.contentVersion.update({
      where: { id: versionId },
      data: { status: VersionStatus.UNDER_REVIEW }
    });

    // Create approval requests
    const approvals = await Promise.all(
      reviewerIds.map(reviewerId =>
        db.contentVersionApproval.create({
          data: {
            versionId,
            approverId: reviewerId
          }
        })
      )
    );

    return approvals;
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

    const approval = await db.contentVersionApproval.update({
      where: {
        versionId_approverId: {
          versionId,
          approverId: user.id
        }
      },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        comments,
        reviewedAt: new Date()
      }
    });

    // Check if all approvals are complete
    const allApprovals = await db.contentVersionApproval.findMany({
      where: { versionId }
    });

    const allApproved = allApprovals.every(a => a.status === 'APPROVED');
    const anyRejected = allApprovals.some(a => a.status === 'REJECTED');

    if (anyRejected) {
      await db.contentVersion.update({
        where: { id: versionId },
        data: { status: VersionStatus.DRAFT }
      });
    } else if (allApproved) {
      await db.contentVersion.update({
        where: { id: versionId },
        data: { status: VersionStatus.PUBLISHED, publishedAt: new Date() }
      });
    }

    return approval;
  }

  /**
   * Generate next version number based on type
   */
  private static generateNextVersionNumber(currentVersion: string, versionType: VersionType): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (versionType) {
      case VersionType.MAJOR:
        return `${major + 1}.0.0`;
      case VersionType.MINOR:
        return `${major}.${minor + 1}.0`;
      case VersionType.PATCH:
      case VersionType.HOTFIX:
        return `${major}.${minor}.${patch + 1}`;
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
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

    const template = await db.contentTemplate.create({
      data: {
        name: templateName,
        description,
        contentType: version.contentType,
        category,
        templateData: version.contentSnapshot,
        authorId: user.id,
        isPublic,
        isOfficial: user.role === UserRole.ADMIN
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
    const template = await db.contentTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) throw new Error("Template not found");

    // Update usage count
    await db.contentTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    });

    const templateData = JSON.parse(template.templateData as string);
    const contentSnapshot = { ...templateData, ...customizations };

    return await this.createVersion({
      contentType,
      contentId,
      contentSnapshot,
      versionType: VersionType.MINOR,
      title: `Applied template: ${template.name}`,
      changeLog: [`Applied template "${template.name}"`]
    });
  }
}
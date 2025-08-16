"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logger } from "@/lib/logger";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

/**
 * Admin-only action to change user roles
 * Only ADMIN users can change roles of other users
 */
export const changeUserRole = async (
  targetUserId: string,
  newRole: UserRole
) => {
  try {
    const user = await currentUser();

    // Check if current user is authenticated
    if (!user || !user.id) {
      return { error: "Unauthorized: Authentication required" };
    }

    // Check if current user is an admin
    if (user.role !== UserRole.ADMIN) {
      logger.warn(`Unauthorized role change attempt by user ${user.id}`);
      return { error: "Unauthorized: Admin access required" };
    }

    // Prevent admin from changing their own role
    if (user.id === targetUserId) {
      return { error: "Cannot change your own role for security reasons" };
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, 
        email: true, 
        role: true,
        name: true 
      }
    });

    if (!targetUser) {
      return { error: "User not found" };
    }

    // Prevent demotion of the last admin
    if (targetUser.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await db.user.count({
        where: { role: UserRole.ADMIN }
      });

      if (adminCount <= 1) {
        return { error: "Cannot remove the last admin user" };
      }
    }

    // Update the user's role
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { 
        role: newRole
      }
    });

    // Create comprehensive audit log using new auth audit system
    await authAuditHelpers.logRoleChange(
      targetUserId,
      targetUser.email!,
      user.id,
      user.email!,
      targetUser.role,
      newRole,
      'Admin role change operation'
    );

    logger.info(`Role changed for user ${targetUser.email} from ${targetUser.role} to ${newRole} by admin ${user.email}`);

    return { 
      success: `Role updated successfully for ${targetUser.name || targetUser.email}`,
      updatedUser: {
        id: updatedUser.id,
        role: updatedUser.role
      }
    };
  } catch (error) {
    logger.error("Error changing user role:", error);
    return { error: "Failed to change user role" };
  }
};

/**
 * Request to become an instructor/teacher
 * Any authenticated user can request, but requires admin approval
 */
export const requestInstructorRole = async (
  documentType: string = "QUALIFICATION",
  documentUrl: string = "",
  verificationNotes?: string
) => {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return { error: "Unauthorized: Authentication required" };
    }

    // Check if user is already an admin
    if (user.role === UserRole.ADMIN) {
      return { error: "You already have instructor privileges" };
    }
    
    // Check if user has teacher flag
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { isTeacher: true }
    });
    
    if (userData?.isTeacher) {
      return { error: "You already have instructor privileges" };
    }

    // Check for existing pending request
    const existingRequest = await db.instructorVerification.findUnique({
      where: { userId: user.id }
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      return { error: "You already have a pending instructor request" };
    }

    // Create or update instructor verification request
    const verificationRequest = await db.instructorVerification.upsert({
      where: { userId: user.id },
      update: {
        status: "PENDING",
        documentType,
        documentUrl,
        verificationNotes,
        verifiedAt: null,
        verifiedBy: null
      },
      create: {
        userId: user.id,
        status: "PENDING",
        documentType,
        documentUrl,
        verificationNotes
      }
    });

    // No need to update user here since they'll be verified later

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "INSTRUCTOR_VERIFICATION",
        entityId: verificationRequest.id,
        context: {
          type: "INSTRUCTOR_REQUEST",
          documentType,
          documentUrl,
          verificationNotes
        }
      }
    });

    // TODO: Send notification to admins about new instructor request

    logger.info(`Instructor role requested by user ${user.email}`);

    return { 
      success: "Instructor role request submitted. An admin will review your application soon.",
      requestId: verificationRequest.id
    };
  } catch (error) {
    logger.error("Error requesting instructor role:", error);
    return { error: "Failed to submit instructor request" };
  }
};

/**
 * Admin action to approve/reject instructor requests
 */
export const reviewInstructorRequest = async (
  requestId: string,
  approved: boolean,
  reviewNotes?: string
) => {
  try {
    const reviewer = await currentUser();

    if (!reviewer || !reviewer.id) {
      return { error: "Unauthorized: Authentication required" };
    }

    if (reviewer.role !== UserRole.ADMIN) {
      return { error: "Unauthorized: Admin access required" };
    }

    // Get the verification request
    const request = await db.instructorVerification.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status !== "PENDING") {
      return { error: "Request has already been reviewed" };
    }

    // Update the verification request
    const updatedRequest = await db.instructorVerification.update({
      where: { id: requestId },
      data: {
        status: approved ? "VERIFIED" : "REJECTED",
        verifiedAt: new Date(),
        verifiedBy: reviewer.id,
        verificationNotes: reviewNotes
      }
    });

    // Update user's teacher flag if approved
    if (approved) {
      await db.user.update({
        where: { id: request.userId },
        data: {
          isTeacher: true,
          teacherActivatedAt: new Date()
        }
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reviewer.id,
        action: approved ? "APPROVE" : "REJECT",
        entityType: "INSTRUCTOR_VERIFICATION",
        entityId: requestId,
        changes: {
          status: approved ? "VERIFIED" : "REJECTED",
          reviewNotes
        },
        context: {
          requestUserId: request.userId,
          requestUserEmail: request.user.email,
          verifiedBy: reviewer.email
        }
      }
    });

    // TODO: Send email notification to the user about their request status

    logger.info(`Instructor request ${requestId} ${approved ? "approved" : "rejected"} by ${reviewer.email}`);

    return { 
      success: `Instructor request ${approved ? "approved" : "rejected"} successfully`,
      updatedRequest
    };
  } catch (error) {
    logger.error("Error reviewing instructor request:", error);
    return { error: "Failed to review instructor request" };
  }
};

/**
 * Get all pending instructor requests (Admin only)
 */
export const getPendingInstructorRequests = async () => {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return { error: "Unauthorized: Authentication required" };
    }

    if (user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized: Admin access required" };
    }

    const requests = await db.instructorVerification.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return { success: true, requests };
  } catch (error) {
    logger.error("Error fetching instructor requests:", error);
    return { error: "Failed to fetch instructor requests" };
  }
};
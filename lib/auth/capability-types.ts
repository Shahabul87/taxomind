/**
 * User Capability Types - Edge Runtime Safe
 *
 * This file contains only type definitions and enums that can be safely
 * imported in Edge Runtime (middleware) without database dependencies.
 */

/**
 * User capability types - what a user can do in the platform
 */
export enum UserCapability {
  // Core capabilities
  STUDENT = "STUDENT",           // Can enroll in courses, learn
  TEACHER = "TEACHER",           // Can create and manage courses
  AFFILIATE = "AFFILIATE",       // Can promote courses and earn commissions

  // Extended capabilities (future expansion)
  CONTENT_CREATOR = "CONTENT_CREATOR",  // Can create blog posts, articles
  MODERATOR = "MODERATOR",               // Can moderate content
  REVIEWER = "REVIEWER",                 // Can review courses
}

/**
 * Capability metadata - additional information about each capability
 */
export interface CapabilityMetadata {
  id: UserCapability;
  label: string;
  description: string;
  icon: string;
  requiresApproval: boolean;
  requiresVerification: boolean;
  defaultEnabled: boolean;
}

/**
 * User capability state
 */
export interface UserCapabilityState {
  userId: string;
  capability: UserCapability;
  isActive: boolean;
  activatedAt?: Date | null;
  deactivatedAt?: Date | null;
  metadata?: Record<string, any>;
}

/**
 * Capability definitions with metadata
 */
export const CAPABILITY_DEFINITIONS: Record<UserCapability, CapabilityMetadata> = {
  [UserCapability.STUDENT]: {
    id: UserCapability.STUDENT,
    label: "Student",
    description: "Learn from courses and track progress",
    icon: "GraduationCap",
    requiresApproval: false,
    requiresVerification: false,
    defaultEnabled: true, // Everyone is a student by default
  },
  [UserCapability.TEACHER]: {
    id: UserCapability.TEACHER,
    label: "Instructor",
    description: "Create and manage courses, track student progress",
    icon: "BookOpen",
    requiresApproval: false, // Can be changed to true for stricter control
    requiresVerification: true, // Requires email verification
    defaultEnabled: false,
  },
  [UserCapability.AFFILIATE]: {
    id: UserCapability.AFFILIATE,
    label: "Affiliate",
    description: "Promote courses and earn commissions",
    icon: "DollarSign",
    requiresApproval: false,
    requiresVerification: true,
    defaultEnabled: false,
  },
  [UserCapability.CONTENT_CREATOR]: {
    id: UserCapability.CONTENT_CREATOR,
    label: "Content Creator",
    description: "Create blog posts and articles",
    icon: "PenTool",
    requiresApproval: true,
    requiresVerification: true,
    defaultEnabled: false,
  },
  [UserCapability.MODERATOR]: {
    id: UserCapability.MODERATOR,
    label: "Moderator",
    description: "Moderate user-generated content",
    icon: "Shield",
    requiresApproval: true,
    requiresVerification: true,
    defaultEnabled: false,
  },
  [UserCapability.REVIEWER]: {
    id: UserCapability.REVIEWER,
    label: "Reviewer",
    description: "Review and rate courses",
    icon: "Star",
    requiresApproval: false,
    requiresVerification: true,
    defaultEnabled: false,
  },
};

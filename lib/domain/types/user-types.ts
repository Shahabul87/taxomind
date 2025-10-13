/**
 * User Domain Types
 *
 * Core types for the user domain, independent of database schema.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserCapability {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  AFFILIATE = 'AFFILIATE',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
  MODERATOR = 'MODERATOR',
  REVIEWER = 'REVIEWER',
}
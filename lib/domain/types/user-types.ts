/**
 * User Domain Types
 *
 * Core types for the user domain, independent of database schema.
 * NOTE: Users don't have roles - Admin auth is completely separate (AdminAccount model)
 * User capabilities determine what users can do
 */

export enum UserCapability {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  AFFILIATE = 'AFFILIATE',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
  MODERATOR = 'MODERATOR',
  REVIEWER = 'REVIEWER',
}
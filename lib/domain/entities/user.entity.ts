/**
 * User Domain Entity
 *
 * Core business logic for users, independent of frameworks and databases.
 * This entity encapsulates all user-related business rules.
 *
 * NOTE: Users don't have roles - Admin auth is completely separate (AdminAccount model)
 * User capabilities (STUDENT, TEACHER, etc.) determine what users can do
 */

import { DomainError } from '../errors/domain-error';
import { Email } from '../value-objects/email';
import { UserId } from '../value-objects/user-id';
import { UserCapability } from '../types/user-types';

export class UserEntity {
  private readonly id: UserId;
  private email: Email;
  private name: string | null;
  private capabilities: Set<UserCapability>;
  private isAccountLocked: boolean;
  private failedLoginAttempts: number;
  private isTwoFactorEnabled: boolean;
  private lastLoginAt: Date | null;

  constructor(props: {
    id: string;
    email: string;
    name: string | null;
    capabilities?: UserCapability[];
    isAccountLocked?: boolean;
    failedLoginAttempts?: number;
    isTwoFactorEnabled?: boolean;
    lastLoginAt?: Date | null;
  }) {
    this.id = new UserId(props.id);
    this.email = new Email(props.email);
    this.name = props.name;
    this.capabilities = new Set(props.capabilities || [UserCapability.STUDENT]);
    this.isAccountLocked = props.isAccountLocked || false;
    this.failedLoginAttempts = props.failedLoginAttempts || 0;
    this.isTwoFactorEnabled = props.isTwoFactorEnabled || false;
    this.lastLoginAt = props.lastLoginAt || null;

    // Everyone is a student by default
    this.capabilities.add(UserCapability.STUDENT);
  }

  // Getters
  getId(): string {
    return this.id.getValue();
  }

  getEmail(): string {
    return this.email.getValue();
  }

  getName(): string | null {
    return this.name;
  }

  getCapabilities(): UserCapability[] {
    return Array.from(this.capabilities);
  }

  /**
   * Check if user is a teacher
   */
  isTeacher(): boolean {
    return this.capabilities.has(UserCapability.TEACHER);
  }

  // Business Logic Methods

  /**
   * Check if user has a specific capability
   */
  hasCapability(capability: UserCapability): boolean {
    return this.capabilities.has(capability);
  }

  /**
   * Check if user can teach courses
   */
  canTeach(): boolean {
    return this.hasCapability(UserCapability.TEACHER);
  }

  /**
   * Promote user to teacher
   */
  promoteToTeacher(): void {
    if (this.isAccountLocked) {
      throw new DomainError('Cannot promote locked account');
    }

    if (!this.isTwoFactorEnabled) {
      throw new DomainError('Two-factor authentication must be enabled to become a teacher');
    }

    this.capabilities.add(UserCapability.TEACHER);
  }

  /**
   * Grant a capability to the user
   */
  grantCapability(capability: UserCapability): void {
    if (this.isAccountLocked) {
      throw new DomainError('Cannot modify capabilities of locked account');
    }

    this.capabilities.add(capability);
  }

  /**
   * Revoke a capability from the user
   */
  revokeCapability(capability: UserCapability): void {
    // Cannot revoke student capability - everyone is a student
    if (capability === UserCapability.STUDENT) {
      throw new DomainError('Cannot revoke student capability');
    }

    this.capabilities.delete(capability);
  }

  /**
   * Handle failed login attempt
   */
  recordFailedLogin(): void {
    this.failedLoginAttempts++;

    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      this.lockAccount('Too many failed login attempts');
    }
  }

  /**
   * Handle successful login
   */
  recordSuccessfulLogin(): void {
    this.failedLoginAttempts = 0;
    this.lastLoginAt = new Date();
  }

  /**
   * Lock user account
   */
  lockAccount(reason: string): void {
    this.isAccountLocked = true;
    // In a real implementation, we'd emit a domain event here
  }

  /**
   * Unlock user account
   */
  unlockAccount(): void {
    this.isAccountLocked = false;
    this.failedLoginAttempts = 0;
  }

  /**
   * Check if account is locked
   */
  isLocked(): boolean {
    return this.isAccountLocked;
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(): void {
    if (this.isAccountLocked) {
      throw new DomainError('Cannot enable 2FA on locked account');
    }
    this.isTwoFactorEnabled = true;
  }

  /**
   * Check if user requires MFA
   */
  requiresMFA(): boolean {
    // Teachers require MFA
    if (this.hasCapability(UserCapability.TEACHER)) {
      return true;
    }

    return this.isTwoFactorEnabled;
  }

  /**
   * Validate user can perform an action
   * NOTE: Admin actions are handled by AdminAccount, not UserEntity
   */
  canPerformAction(action: string): boolean {
    if (this.isAccountLocked) {
      return false;
    }

    // Add specific business rules for different actions
    switch (action) {
      case 'CREATE_COURSE':
        return this.canTeach();
      case 'ENROLL_COURSE':
        return !this.isAccountLocked;
      default:
        return false;
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      name: this.name,
      isTeacher: this.isTeacher(),
      capabilities: this.getCapabilities(),
      isAccountLocked: this.isAccountLocked,
      failedLoginAttempts: this.failedLoginAttempts,
      isTwoFactorEnabled: this.isTwoFactorEnabled,
      lastLoginAt: this.lastLoginAt,
    };
  }
}
/**
 * Email Value Object
 *
 * Immutable value object representing an email address with validation.
 */

import { DomainError } from '../errors/domain-error';

export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new DomainError(`Invalid email address: ${email}`);
    }
    this.value = email.toLowerCase();
  }

  getValue(): string {
    return this.value;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
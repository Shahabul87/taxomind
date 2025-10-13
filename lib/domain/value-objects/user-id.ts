/**
 * UserId Value Object
 *
 * Immutable value object representing a user ID.
 */

import { DomainError } from '../errors/domain-error';

export class UserId {
  private readonly value: string;

  constructor(id: string) {
    if (!id || id.trim().length === 0) {
      throw new DomainError('User ID cannot be empty');
    }
    this.value = id;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
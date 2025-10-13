# Domain Layer - Clean Architecture

This directory contains the core business domain logic, following Clean Architecture principles.

## Structure

```
domain/
├── entities/          # Core business entities (no dependencies)
├── use-cases/        # Application business rules
├── repositories/     # Repository interfaces (not implementations)
└── value-objects/    # Value objects and domain primitives
```

## Principles

1. **No External Dependencies**: Domain entities must not depend on frameworks, databases, or external libraries
2. **Business Logic First**: All business rules live here, independent of how they're delivered
3. **Dependency Inversion**: Repositories are interfaces, implementations live in infrastructure layer
4. **Rich Domain Models**: Entities contain business logic, not just data

## Example

```typescript
// entities/user.entity.ts
export class UserEntity {
  constructor(
    private readonly id: string,
    private email: string,
    private role: UserRole
  ) {}

  canTeach(): boolean {
    return this.hasCapability(UserCapability.TEACHER);
  }

  // Business logic, not framework code
  promoteToInstructor(): void {
    if (!this.canTeach()) {
      throw new DomainError('User must be a teacher to become instructor');
    }
    // ...
  }
}
```
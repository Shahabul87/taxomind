/**
 * @sam-ai/agentic - Adapters
 * Database and external service adapters for the agentic package
 */

// Prisma Tool Stores
export {
  createPrismaToolStore,
  createPrismaInvocationStore,
  createPrismaAuditStore,
  createPrismaPermissionStore,
  createPrismaConfirmationStore,
  type PrismaClientLike,
} from './prisma-tool-stores';

/**
 * @sam-ai/integration - Database Adapter Interface
 * Abstract database operations for portability
 */
import { z } from 'zod';
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const QueryOptionsSchema = z.object({
    where: z
        .array(z.object({
        field: z.string(),
        operator: z.enum([
            'eq',
            'neq',
            'gt',
            'gte',
            'lt',
            'lte',
            'in',
            'notIn',
            'contains',
            'startsWith',
            'endsWith',
            'isNull',
            'isNotNull',
        ]),
        value: z.unknown(),
    }))
        .optional(),
    orderBy: z
        .array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
    }))
        .optional(),
    limit: z.number().min(1).max(1000).optional(),
    offset: z.number().min(0).optional(),
    include: z.array(z.string()).optional(),
    select: z.array(z.string()).optional(),
});
export const CreateSAMGoalInputSchema = z.object({
    userId: z.string().min(1),
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    targetDate: z.date().optional(),
    context: z.record(z.unknown()).optional(),
});
export const UpdateSAMGoalInputSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'paused', 'completed', 'abandoned']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    targetDate: z.date().optional(),
    context: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=database.js.map
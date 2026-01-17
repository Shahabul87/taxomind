/**
 * @sam-ai/agentic - Scheduling Tools
 * Tools for study session scheduling and time management
 */
import type { ToolDefinition } from '../tool-registry/types';
import { type StudySession, type Reminder } from './types';
/**
 * Dependencies for scheduling tools
 */
export interface SchedulingToolsDependencies {
    sessionRepository?: {
        create: (session: Omit<StudySession, 'id'>) => Promise<StudySession>;
        get: (sessionId: string) => Promise<StudySession | null>;
        update: (sessionId: string, updates: Partial<StudySession>) => Promise<StudySession>;
        getByUser: (userId: string, options?: {
            from?: Date;
            to?: Date;
        }) => Promise<StudySession[]>;
    };
    reminderRepository?: {
        create: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<Reminder>;
        get: (reminderId: string) => Promise<Reminder | null>;
        update: (reminderId: string, updates: Partial<Reminder>) => Promise<Reminder>;
        getByUser: (userId: string, status?: string) => Promise<Reminder[]>;
        delete: (reminderId: string) => Promise<void>;
    };
    notificationService?: {
        schedule: (userId: string, message: string, scheduledFor: Date, channels: string[]) => Promise<void>;
    };
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Create scheduling tools with dependencies
 */
export declare function createSchedulingTools(deps: SchedulingToolsDependencies): ToolDefinition[];
//# sourceMappingURL=scheduling-tools.d.ts.map
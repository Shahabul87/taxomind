/**
 * @sam-ai/agentic - Notification Tools
 * Tools for notifications, progress tracking, and user communication
 */
import type { ToolDefinition } from '../tool-registry/types';
import { type Notification } from './types';
/**
 * Dependencies for notification tools
 */
export interface NotificationToolsDependencies {
    notificationRepository?: {
        create: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<Notification>;
        get: (notificationId: string) => Promise<Notification | null>;
        update: (notificationId: string, updates: Partial<Notification>) => Promise<Notification>;
        getByUser: (userId: string, options?: {
            status?: string;
            limit?: number;
        }) => Promise<Notification[]>;
        markRead: (notificationId: string) => Promise<Notification>;
        markAllRead: (userId: string) => Promise<number>;
    };
    progressRepository?: {
        getStudyMetrics: (userId: string, startDate: Date, endDate: Date) => Promise<{
            studyTime: number;
            lessonsCompleted: number;
            assessmentsTaken: number;
            averageScore: number;
            streakDays: number;
            masteryProgress: number;
        }>;
        getGoalProgress: (userId: string) => Promise<Array<{
            id: string;
            title: string;
            progress: number;
            status: string;
        }>>;
    };
    deliveryService?: {
        sendPush: (userId: string, title: string, body: string) => Promise<boolean>;
        sendEmail: (userId: string, title: string, body: string) => Promise<boolean>;
        sendSMS: (userId: string, message: string) => Promise<boolean>;
    };
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Create notification tools with dependencies
 */
export declare function createNotificationTools(deps: NotificationToolsDependencies): ToolDefinition[];
//# sourceMappingURL=notification-tools.d.ts.map
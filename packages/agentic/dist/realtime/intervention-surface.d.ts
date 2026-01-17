/**
 * @sam-ai/agentic - Intervention Surface Manager
 * Manages UI surfaces for displaying interventions, check-ins, and notifications
 */
import type { InterventionSurfaceManager, InterventionDisplayConfig, InterventionUIState, InterventionQueue, SAMWebSocketEvent, SAMEventType, RealtimeLogger } from './types';
/**
 * Default display configs by event type
 */
export declare const DEFAULT_DISPLAY_CONFIGS: Record<SAMEventType, Partial<InterventionDisplayConfig>>;
export interface SurfaceManagerConfig {
    /** Maximum visible interventions at once */
    maxVisible: number;
    /** Maximum queue size */
    maxQueueSize: number;
    /** Default display duration for timed interventions (ms) */
    defaultDuration: number;
    /** Enable sound effects */
    enableSound: boolean;
    /** Enable haptic feedback (mobile) */
    enableHaptics: boolean;
    /** Auto-acknowledge viewed interventions */
    autoAcknowledge: boolean;
}
export declare const DEFAULT_SURFACE_MANAGER_CONFIG: SurfaceManagerConfig;
export declare class InterventionSurfaceManagerImpl implements InterventionSurfaceManager {
    private readonly config;
    private readonly logger;
    private items;
    private visibleItems;
    private dismissTimers;
    private listeners;
    constructor(options?: {
        config?: Partial<SurfaceManagerConfig>;
        logger?: RealtimeLogger;
    });
    queue(event: SAMWebSocketEvent, config?: Partial<InterventionDisplayConfig>): void;
    private isDisplayableEvent;
    private removeLowestPriority;
    private processQueue;
    private show;
    dismiss(eventId: string, reason?: string): void;
    dismissAll(): void;
    markInteracted(eventId: string, interactionType: 'click' | 'dismiss' | 'action'): void;
    getQueue(): InterventionQueue;
    getVisible(): InterventionUIState[];
    getVisibleBySurface(surface: string): InterventionUIState[];
    getItem(eventId: string): InterventionUIState | undefined;
    clearAll(): void;
    clearBySurface(surface: string): void;
    onQueueChange(callback: (queue: InterventionQueue) => void): () => void;
    private notifyListeners;
    private playSound;
    private vibrate;
}
export declare function createInterventionSurfaceManager(options?: {
    config?: Partial<SurfaceManagerConfig>;
    logger?: RealtimeLogger;
}): InterventionSurfaceManagerImpl;
/**
 * Intervention render props for React components
 */
export interface InterventionRenderProps {
    item: InterventionUIState;
    dismiss: () => void;
    interact: (type: 'click' | 'action') => void;
    acknowledge: () => void;
}
/**
 * Surface component props
 */
export interface SurfaceComponentProps {
    interventions: InterventionUIState[];
    onDismiss: (id: string) => void;
    onInteract: (id: string, type: 'click' | 'action') => void;
    maxVisible?: number;
}
/**
 * Toast container props
 */
export interface ToastContainerProps extends SurfaceComponentProps {
    position?: 'top' | 'bottom' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}
/**
 * Modal container props
 */
export interface ModalContainerProps extends SurfaceComponentProps {
    backdrop?: boolean;
    closeOnBackdrop?: boolean;
}
/**
 * Sidebar container props
 */
export interface SidebarContainerProps extends SurfaceComponentProps {
    side?: 'left' | 'right';
    width?: number | string;
}
/**
 * Banner container props
 */
export interface BannerContainerProps extends SurfaceComponentProps {
    position?: 'top' | 'bottom';
    sticky?: boolean;
}
//# sourceMappingURL=intervention-surface.d.ts.map
/**
 * @sam-ai/agentic - Intervention Surface Manager
 * Manages UI surfaces for displaying interventions, check-ins, and notifications
 */

import type {
  InterventionSurfaceManager,
  InterventionDisplayConfig,
  InterventionUIState,
  InterventionQueue,
  SAMWebSocketEvent,
  SAMEventType,
  RealtimeLogger,
} from './types';
import {
  InterventionSurface,
  SAMEventType as SAMEventTypeConst,
} from './types';

// ============================================================================
// DEFAULT DISPLAY CONFIGURATIONS
// ============================================================================

/**
 * Default display configs by event type
 */
export const DEFAULT_DISPLAY_CONFIGS: Record<SAMEventType, Partial<InterventionDisplayConfig>> = {
  // Proactive events
  intervention: {
    surface: InterventionSurface.MODAL,
    position: 'center',
    dismissible: true,
    blocking: false,
    priority: 80,
    animation: 'fade',
  },
  checkin: {
    surface: InterventionSurface.SIDEBAR,
    position: 'right',
    dismissible: true,
    blocking: false,
    priority: 70,
    animation: 'slide',
  },
  recommendation: {
    surface: InterventionSurface.TOAST,
    position: 'bottom-right',
    duration: 10000,
    dismissible: true,
    blocking: false,
    priority: 40,
    animation: 'slide',
  },
  step_completed: {
    surface: InterventionSurface.TOAST,
    position: 'top',
    duration: 5000,
    dismissible: true,
    blocking: false,
    priority: 50,
    animation: 'bounce',
    sound: true,
  },
  goal_progress: {
    surface: InterventionSurface.TOAST,
    position: 'bottom-right',
    duration: 8000,
    dismissible: true,
    blocking: false,
    priority: 45,
    animation: 'slide',
  },
  nudge: {
    surface: InterventionSurface.FLOATING,
    position: 'bottom-right',
    duration: 6000,
    dismissible: true,
    blocking: false,
    priority: 30,
    animation: 'fade',
  },
  celebration: {
    surface: InterventionSurface.MODAL,
    position: 'center',
    duration: 5000,
    dismissible: true,
    blocking: true,
    priority: 90,
    animation: 'bounce',
    sound: true,
  },
  // System events
  presence_update: {
    surface: InterventionSurface.TOAST,
    position: 'top',
    duration: 3000,
    dismissible: true,
    blocking: false,
    priority: 20,
    animation: 'fade',
  },
  session_sync: {
    surface: InterventionSurface.BANNER,
    position: 'top',
    dismissible: true,
    blocking: false,
    priority: 60,
    animation: 'slide',
  },
  // Client events (typically not displayed)
  activity: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  heartbeat: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  acknowledge: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  dismiss: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  respond: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  subscribe: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  unsubscribe: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0,
  },
  // System events
  connected: {
    surface: InterventionSurface.TOAST,
    position: 'bottom',
    duration: 2000,
    dismissible: true,
    blocking: false,
    priority: 10,
    animation: 'fade',
  },
  disconnected: {
    surface: InterventionSurface.BANNER,
    position: 'top',
    dismissible: false,
    blocking: false,
    priority: 95,
    animation: 'slide',
  },
  error: {
    surface: InterventionSurface.TOAST,
    position: 'top',
    duration: 8000,
    dismissible: true,
    blocking: false,
    priority: 85,
    animation: 'slide',
  },
  reconnecting: {
    surface: InterventionSurface.BANNER,
    position: 'top',
    dismissible: false,
    blocking: false,
    priority: 90,
    animation: 'fade',
  },
};

// ============================================================================
// INTERVENTION SURFACE MANAGER CONFIG
// ============================================================================

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

export const DEFAULT_SURFACE_MANAGER_CONFIG: SurfaceManagerConfig = {
  maxVisible: 3,
  maxQueueSize: 20,
  defaultDuration: 5000,
  enableSound: true,
  enableHaptics: true,
  autoAcknowledge: true,
};

// ============================================================================
// INTERVENTION SURFACE MANAGER
// ============================================================================

export class InterventionSurfaceManagerImpl implements InterventionSurfaceManager {
  private readonly config: SurfaceManagerConfig;
  private readonly logger: RealtimeLogger;

  private items: Map<string, InterventionUIState> = new Map();
  private visibleItems: Set<string> = new Set();
  private dismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private listeners: Set<(queue: InterventionQueue) => void> = new Set();

  constructor(options?: {
    config?: Partial<SurfaceManagerConfig>;
    logger?: RealtimeLogger;
  }) {
    this.config = { ...DEFAULT_SURFACE_MANAGER_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }

  // ---------------------------------------------------------------------------
  // Queue Management
  // ---------------------------------------------------------------------------

  queue(event: SAMWebSocketEvent, config?: Partial<InterventionDisplayConfig>): void {
    // Skip non-displayable events
    if (!this.isDisplayableEvent(event.type as SAMEventType)) {
      return;
    }

    // Check queue limit
    if (this.items.size >= this.config.maxQueueSize) {
      // Remove lowest priority non-visible item
      this.removeLowestPriority();
    }

    const defaultConfig = DEFAULT_DISPLAY_CONFIGS[event.type as SAMEventType] ?? {};
    const displayConfig: InterventionDisplayConfig = {
      surface: config?.surface ?? defaultConfig.surface ?? InterventionSurface.TOAST,
      position: config?.position ?? defaultConfig.position ?? 'bottom-right',
      duration: config?.duration ?? defaultConfig.duration,
      dismissible: config?.dismissible ?? defaultConfig.dismissible ?? true,
      blocking: config?.blocking ?? defaultConfig.blocking ?? false,
      priority: config?.priority ?? defaultConfig.priority ?? 50,
      animation: config?.animation ?? defaultConfig.animation ?? 'fade',
      sound: config?.sound ?? defaultConfig.sound ?? false,
      vibrate: config?.vibrate ?? defaultConfig.vibrate ?? false,
    };

    const state: InterventionUIState = {
      id: event.eventId,
      event,
      displayConfig,
      visible: false,
      createdAt: new Date(),
    };

    this.items.set(state.id, state);

    this.logger.debug('Intervention queued', {
      id: state.id,
      type: event.type,
      surface: displayConfig.surface,
      priority: displayConfig.priority,
    });

    // Try to display immediately
    this.processQueue();
  }

  private isDisplayableEvent(type: SAMEventType): boolean {
    // Events that should be displayed
    const displayableTypes: SAMEventType[] = [
      SAMEventTypeConst.INTERVENTION,
      SAMEventTypeConst.CHECKIN,
      SAMEventTypeConst.RECOMMENDATION,
      SAMEventTypeConst.STEP_COMPLETED,
      SAMEventTypeConst.GOAL_PROGRESS,
      SAMEventTypeConst.NUDGE,
      SAMEventTypeConst.CELEBRATION,
      SAMEventTypeConst.SESSION_SYNC,
      SAMEventTypeConst.CONNECTED,
      SAMEventTypeConst.DISCONNECTED,
      SAMEventTypeConst.ERROR,
      SAMEventTypeConst.RECONNECTING,
    ];

    return displayableTypes.includes(type);
  }

  private removeLowestPriority(): void {
    let lowestItem: InterventionUIState | null = null;

    for (const [_, item] of this.items) {
      if (this.visibleItems.has(item.id)) continue; // Skip visible items

      if (!lowestItem || item.displayConfig.priority < lowestItem.displayConfig.priority) {
        lowestItem = item;
      }
    }

    if (lowestItem) {
      this.items.delete(lowestItem.id);
      this.logger.debug('Removed low priority item from queue', {
        id: lowestItem.id,
        priority: lowestItem.displayConfig.priority,
      });
    }
  }

  private processQueue(): void {
    if (this.visibleItems.size >= this.config.maxVisible) {
      return;
    }

    // Get pending items sorted by priority
    const pending = Array.from(this.items.values())
      .filter((item) => !item.visible)
      .sort((a, b) => b.displayConfig.priority - a.displayConfig.priority);

    const availableSlots = this.config.maxVisible - this.visibleItems.size;

    for (let i = 0; i < Math.min(availableSlots, pending.length); i++) {
      this.show(pending[i].id);
    }
  }

  private show(id: string): void {
    const item = this.items.get(id);
    if (!item || item.visible) return;

    item.visible = true;
    item.displayedAt = new Date();
    this.visibleItems.add(id);

    // Set auto-dismiss timer if duration specified
    if (item.displayConfig.duration) {
      const timer = setTimeout(() => {
        this.dismiss(id, 'timeout');
      }, item.displayConfig.duration);
      this.dismissTimers.set(id, timer);
    }

    // Play sound if enabled
    if (item.displayConfig.sound && this.config.enableSound) {
      this.playSound(item.event.type as SAMEventType);
    }

    // Vibrate if enabled (mobile)
    if (item.displayConfig.vibrate && this.config.enableHaptics) {
      this.vibrate();
    }

    this.notifyListeners();

    this.logger.debug('Intervention shown', {
      id,
      type: item.event.type,
      surface: item.displayConfig.surface,
    });
  }

  // ---------------------------------------------------------------------------
  // Dismiss
  // ---------------------------------------------------------------------------

  dismiss(eventId: string, reason?: string): void {
    const item = this.items.get(eventId);
    if (!item) return;

    // Clear any auto-dismiss timer
    const timer = this.dismissTimers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(eventId);
    }

    item.visible = false;
    item.dismissedAt = new Date();
    item.interactionType = reason === 'timeout' ? 'timeout' : 'dismiss';

    this.visibleItems.delete(eventId);
    this.items.delete(eventId);

    this.notifyListeners();

    // Process queue to show next items
    this.processQueue();

    this.logger.debug('Intervention dismissed', {
      id: eventId,
      reason,
    });
  }

  dismissAll(): void {
    for (const id of this.visibleItems) {
      this.dismiss(id, 'replaced');
    }
  }

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  markInteracted(eventId: string, interactionType: 'click' | 'dismiss' | 'action'): void {
    const item = this.items.get(eventId);
    if (!item) return;

    item.interactedAt = new Date();
    item.interactionType = interactionType;

    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  getQueue(): InterventionQueue {
    const items = Array.from(this.items.values());
    const priorityOrder = items
      .sort((a, b) => b.displayConfig.priority - a.displayConfig.priority)
      .map((item) => item.id);

    return {
      items,
      maxVisible: this.config.maxVisible,
      currentlyVisible: Array.from(this.visibleItems),
      priorityOrder,
    };
  }

  getVisible(): InterventionUIState[] {
    return Array.from(this.visibleItems)
      .map((id) => this.items.get(id))
      .filter((item): item is InterventionUIState => item !== undefined);
  }

  getVisibleBySurface(surface: string): InterventionUIState[] {
    return this.getVisible().filter((item) => item.displayConfig.surface === surface);
  }

  getItem(eventId: string): InterventionUIState | undefined {
    return this.items.get(eventId);
  }

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  clearAll(): void {
    // Clear all timers
    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer);
    }
    this.dismissTimers.clear();

    this.items.clear();
    this.visibleItems.clear();

    this.notifyListeners();

    this.logger.info('All interventions cleared');
  }

  clearBySurface(surface: string): void {
    const toRemove: string[] = [];

    for (const [id, item] of this.items) {
      if (item.displayConfig.surface === surface) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.dismiss(id, 'replaced');
    }
  }

  // ---------------------------------------------------------------------------
  // Listeners
  // ---------------------------------------------------------------------------

  onQueueChange(callback: (queue: InterventionQueue) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const queue = this.getQueue();
    for (const listener of this.listeners) {
      try {
        listener(queue);
      } catch (error) {
        this.logger.error('Error in queue listener', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Audio/Haptics
  // ---------------------------------------------------------------------------

  private playSound(eventType: SAMEventType): void {
    // Sound implementation depends on environment
    // In browser, could use Web Audio API or Audio element
    if (typeof window === 'undefined') return;

    try {
      // Map event types to sounds
      const soundMap: Partial<Record<SAMEventType, string>> = {
        celebration: '/sounds/celebration.mp3',
        step_completed: '/sounds/complete.mp3',
        intervention: '/sounds/notification.mp3',
        checkin: '/sounds/gentle.mp3',
      };

      const soundUrl = soundMap[eventType];
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Audio autoplay may be blocked
        });
      }
    } catch {
      // Ignore audio errors
    }
  }

  private vibrate(): void {
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    try {
      navigator.vibrate(100);
    } catch {
      // Ignore vibration errors
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createInterventionSurfaceManager(options?: {
  config?: Partial<SurfaceManagerConfig>;
  logger?: RealtimeLogger;
}): InterventionSurfaceManagerImpl {
  return new InterventionSurfaceManagerImpl(options);
}

// ============================================================================
// REACT HOOK HELPERS (Types for UI integration)
// ============================================================================

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

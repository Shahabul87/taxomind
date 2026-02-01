/**
 * Intervention Service
 *
 * Manages proactive interventions: behavior monitoring, pattern detection,
 * check-in scheduling, and multi-session plan tracking.
 */

import {
  MultiSessionPlanTracker,
  CheckInScheduler,
  BehaviorMonitor,
  createMultiSessionPlanTracker,
  createCheckInScheduler,
  createBehaviorMonitor,
  type Intervention,
  type TriggeredCheckIn,
  type BehaviorMonitorConfig,
  type CheckInSchedulerConfig,
  NotificationChannel,
} from '@sam-ai/agentic';

import { getTaxomindContext, getProactiveStores } from '../taxomind-context';
import type { AgenticLogger, AgenticUserContext } from './types';

// ============================================================================
// SERVICE
// ============================================================================

export class InterventionService {
  private planTracker?: MultiSessionPlanTracker;
  private checkInScheduler?: CheckInScheduler;
  private behaviorMonitor?: BehaviorMonitor;

  constructor(
    private readonly userId: string,
    private readonly logger: AgenticLogger,
    private readonly usePrismaStores: boolean,
  ) {}

  /** Initialize proactive intervention components */
  initialize(): void {
    let behaviorConfig: BehaviorMonitorConfig = { logger: this.logger };
    let checkInConfig: CheckInSchedulerConfig = {
      logger: this.logger,
      defaultChannel: NotificationChannel.IN_APP,
    };

    if (this.usePrismaStores) {
      try {
        const proactiveStores = getProactiveStores();

        behaviorConfig = {
          eventStore: proactiveStores.behaviorEvent,
          patternStore: proactiveStores.pattern,
          interventionStore: proactiveStores.intervention,
          logger: this.logger,
        };
        checkInConfig = {
          store: proactiveStores.checkIn,
          logger: this.logger,
          defaultChannel: NotificationChannel.IN_APP,
        };
      } catch (error) {
        this.logger.warn('Failed to initialize Prisma proactive stores, falling back to in-memory', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const learningPlanStore = this.usePrismaStores
      ? getTaxomindContext().stores.learningPlan
      : undefined;

    this.planTracker = createMultiSessionPlanTracker({
      store: learningPlanStore,
      logger: this.logger,
    });
    this.checkInScheduler = createCheckInScheduler(checkInConfig);
    this.behaviorMonitor = createBehaviorMonitor(behaviorConfig);

    this.logger.debug('Proactive Interventions initialized', {
      usePrismaStores: this.usePrismaStores,
    });
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  async checkForInterventions(
    _context: AgenticUserContext,
  ): Promise<Intervention[]> {
    if (!this.behaviorMonitor) {
      throw new Error('Proactive Interventions not enabled');
    }

    const patterns = await this.behaviorMonitor.detectPatterns(this.userId);
    const suggestions = await this.behaviorMonitor.suggestInterventions(patterns);
    const pending = await this.behaviorMonitor.getPendingInterventions(this.userId);
    const pendingTypes = new Set(pending.map((intervention) => intervention.type));

    const created: Intervention[] = [];

    for (const suggestion of suggestions) {
      if (pendingTypes.has(suggestion.type)) continue;
      const intervention = await this.behaviorMonitor.createIntervention(this.userId, {
        type: suggestion.type,
        priority: suggestion.priority,
        message: suggestion.message,
        suggestedActions: suggestion.suggestedActions,
        timing: suggestion.timing,
        executedAt: suggestion.executedAt,
        result: suggestion.result,
      });
      created.push(intervention);
    }

    const interventions = created.length > 0 ? created : pending;

    if (interventions.length > 0) {
      this.logger.info('Interventions triggered', {
        count: interventions.length,
        types: interventions.map((i) => i.type),
      });
    }

    return interventions;
  }

  async getScheduledCheckIns(): Promise<TriggeredCheckIn[]> {
    if (!this.checkInScheduler) {
      throw new Error('Proactive Interventions not enabled');
    }

    return this.checkInScheduler.evaluateTriggers(this.userId, { userId: this.userId });
  }

  async updatePlanProgress(
    planId: string,
    completedActivities: string[],
    actualMinutes: number,
  ): Promise<void> {
    if (!this.planTracker) {
      throw new Error('Proactive Interventions not enabled');
    }

    await this.planTracker.trackProgress(planId, {
      planId,
      date: new Date(),
      completedActivities,
      actualMinutes,
    });

    this.logger.info('Plan progress updated', {
      planId,
      completedCount: completedActivities.length,
    });
  }

  // --------------------------------------------------------------------------
  // Capability checks
  // --------------------------------------------------------------------------

  isEnabled(): boolean {
    return !!this.behaviorMonitor;
  }
}

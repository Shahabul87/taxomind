/**
 * @sam-ai/agentic - Plan Builder Engine
 * Builds executable learning plans from goal decompositions
 */
import { PlanStatus, StepStatus, StepType, SubGoalType, } from './types';
const DEFAULT_OPTIONS = {
    dailyMinutes: 60,
    generateSchedule: true,
    includeCheckpoints: true,
    includeFallbacks: true,
    maxDaysAhead: 90,
};
// ============================================================================
// PLAN BUILDER ENGINE
// ============================================================================
export class PlanBuilder {
    logger;
    defaultOptions;
    constructor(config = {}) {
        this.logger = config.logger ?? console;
        this.defaultOptions = { ...DEFAULT_OPTIONS, ...config.defaultOptions };
    }
    /**
     * Build an execution plan from a goal decomposition
     */
    async createPlan(goal, decomposition, options) {
        const startTime = Date.now();
        const mergedOptions = { ...this.defaultOptions, ...options };
        this.logger.debug?.(`[PlanBuilder] Building plan for goal: ${goal.title}`);
        try {
            // Convert sub-goals to plan steps in topological order
            const orderedSubGoals = this.topologicalSort(decomposition);
            const steps = this.createSteps(orderedSubGoals, goal);
            // Generate schedule if requested
            const schedule = mergedOptions.generateSchedule
                ? this.generateSchedule(steps, goal, mergedOptions)
                : undefined;
            // Generate checkpoints
            const checkpoints = mergedOptions.includeCheckpoints
                ? this.generateCheckpoints(steps, decomposition)
                : [];
            // Generate fallback strategies
            const fallbackStrategies = mergedOptions.includeFallbacks
                ? this.generateFallbackStrategies()
                : [];
            const plan = {
                id: this.generatePlanId(),
                goalId: goal.id,
                userId: goal.userId,
                startDate: schedule?.sessions[0]?.date,
                targetDate: goal.targetDate,
                steps,
                schedule,
                checkpoints,
                fallbackStrategies,
                overallProgress: 0,
                status: PlanStatus.DRAFT,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.logger.debug?.(`[PlanBuilder] Built plan with ${steps.length} steps in ${Date.now() - startTime}ms`);
            return plan;
        }
        catch (error) {
            this.logger.error?.(`[PlanBuilder] Plan creation failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Optimize an existing plan based on constraints
     */
    optimizePlan(plan, constraints) {
        this.logger.debug?.(`[PlanBuilder] Optimizing plan with constraints`);
        let optimizedPlan = { ...plan };
        // Apply time constraints
        if (constraints.maxTotalMinutes) {
            optimizedPlan = this.applyTimeConstraint(optimizedPlan, constraints.maxTotalMinutes);
        }
        // Apply deadline constraint
        if (constraints.deadline) {
            optimizedPlan = this.applyDeadlineConstraint(optimizedPlan, constraints.deadline);
        }
        // Apply daily limit
        if (constraints.maxDailyMinutes && optimizedPlan.schedule) {
            optimizedPlan = this.applyDailyLimit(optimizedPlan, constraints.maxDailyMinutes);
        }
        optimizedPlan.updatedAt = new Date();
        return optimizedPlan;
    }
    /**
     * Adapt a plan based on feedback and progress
     */
    adaptPlan(plan, adaptation) {
        this.logger.debug?.(`[PlanBuilder] Adapting plan based on ${adaptation.type}`);
        const adaptedPlan = { ...plan, steps: [...plan.steps] };
        switch (adaptation.type) {
            case 'difficulty_increase':
                this.increaseDifficulty(adaptedPlan, adaptation.targetStepIds);
                break;
            case 'difficulty_decrease':
                this.decreaseDifficulty(adaptedPlan, adaptation.targetStepIds);
                break;
            case 'add_support':
                this.addSupportSteps(adaptedPlan, adaptation.targetStepIds);
                break;
            case 'skip_ahead':
                if (adaptation.targetStepIds) {
                    this.skipSteps(adaptedPlan, adaptation.targetStepIds);
                }
                break;
            case 'reschedule':
                if (adaptation.newSchedule) {
                    adaptedPlan.schedule = adaptation.newSchedule;
                }
                break;
        }
        adaptedPlan.updatedAt = new Date();
        return adaptedPlan;
    }
    /**
     * Calculate plan progress
     */
    calculateProgress(plan) {
        const totalSteps = plan.steps.length;
        const completedSteps = plan.steps.filter((s) => s.status === StepStatus.COMPLETED).length;
        const failedSteps = plan.steps.filter((s) => s.status === StepStatus.FAILED).length;
        const skippedSteps = plan.steps.filter((s) => s.status === StepStatus.SKIPPED).length;
        const inProgressSteps = plan.steps.filter((s) => s.status === StepStatus.IN_PROGRESS).length;
        const totalEstimatedMinutes = plan.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
        const completedMinutes = plan.steps
            .filter((s) => s.status === StepStatus.COMPLETED)
            .reduce((sum, s) => sum + (s.actualMinutes ?? s.estimatedMinutes), 0);
        const remainingMinutes = plan.steps
            .filter((s) => s.status === StepStatus.PENDING || s.status === StepStatus.IN_PROGRESS)
            .reduce((sum, s) => sum + s.estimatedMinutes, 0);
        // Find achieved checkpoints
        const achievedCheckpoints = plan.checkpoints.filter((c) => c.achieved).length;
        return {
            overallPercentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
            stepStats: {
                total: totalSteps,
                completed: completedSteps,
                failed: failedSteps,
                skipped: skippedSteps,
                inProgress: inProgressSteps,
                pending: totalSteps - completedSteps - failedSteps - skippedSteps - inProgressSteps,
            },
            timeStats: {
                totalEstimated: totalEstimatedMinutes,
                completed: completedMinutes,
                remaining: remainingMinutes,
            },
            checkpointStats: {
                total: plan.checkpoints.length,
                achieved: achievedCheckpoints,
            },
            currentStep: plan.steps.find((s) => s.status === StepStatus.IN_PROGRESS),
            nextStep: plan.steps.find((s) => s.status === StepStatus.PENDING),
        };
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    topologicalSort(decomposition) {
        const { subGoals, dependencies } = decomposition;
        const result = [];
        const visited = new Set();
        const temp = new Set();
        const subGoalMap = new Map(subGoals.map((sg) => [sg.id, sg]));
        const visit = (id) => {
            if (temp.has(id)) {
                throw new Error(`Circular dependency detected involving ${id}`);
            }
            if (visited.has(id))
                return;
            temp.add(id);
            // Visit all prerequisites first
            const subGoal = subGoalMap.get(id);
            if (subGoal) {
                for (const prereqId of subGoal.prerequisites) {
                    if (subGoalMap.has(prereqId)) {
                        visit(prereqId);
                    }
                }
                visited.add(id);
                temp.delete(id);
                result.push(subGoal);
            }
        };
        // Visit all nodes
        for (const node of dependencies.nodes) {
            if (!visited.has(node)) {
                visit(node);
            }
        }
        return result;
    }
    createSteps(orderedSubGoals, goal) {
        const steps = [];
        for (let i = 0; i < orderedSubGoals.length; i++) {
            const subGoal = orderedSubGoals[i];
            const stepType = this.mapSubGoalTypeToStepType(subGoal.type);
            const step = {
                id: this.generateStepId(),
                planId: '', // Will be set when plan is created
                subGoalId: subGoal.id,
                type: stepType,
                title: subGoal.title,
                description: subGoal.description,
                order: i,
                status: StepStatus.PENDING,
                estimatedMinutes: subGoal.estimatedMinutes,
                retryCount: 0,
                maxRetries: 3,
                inputs: this.createStepInputs(subGoal, goal),
                executionContext: this.createExecutionContext(goal),
            };
            steps.push(step);
        }
        return steps;
    }
    mapSubGoalTypeToStepType(type) {
        const mapping = {
            [SubGoalType.LEARN]: StepType.READ_CONTENT,
            [SubGoalType.PRACTICE]: StepType.PRACTICE_PROBLEM,
            [SubGoalType.ASSESS]: StepType.TAKE_QUIZ,
            [SubGoalType.REVIEW]: StepType.SPACED_REVIEW,
            [SubGoalType.REFLECT]: StepType.REFLECT,
            [SubGoalType.CREATE]: StepType.PROJECT_WORK,
        };
        return mapping[type] ?? StepType.READ_CONTENT;
    }
    createStepInputs(_subGoal, goal) {
        const inputs = [];
        // Add content reference if applicable
        if (goal.context.sectionId) {
            inputs.push({
                name: 'sectionId',
                type: 'content',
                value: goal.context.sectionId,
                required: false,
            });
        }
        if (goal.context.chapterId) {
            inputs.push({
                name: 'chapterId',
                type: 'content',
                value: goal.context.chapterId,
                required: false,
            });
        }
        if (goal.context.courseId) {
            inputs.push({
                name: 'courseId',
                type: 'content',
                value: goal.context.courseId,
                required: false,
            });
        }
        return inputs;
    }
    createExecutionContext(goal) {
        return {
            courseId: goal.context.courseId,
            chapterId: goal.context.chapterId,
            sectionId: goal.context.sectionId,
        };
    }
    generateSchedule(steps, _goal, options) {
        const sessions = [];
        let currentDate = new Date();
        let stepIndex = 0;
        let daysScheduled = 0;
        while (stepIndex < steps.length && daysScheduled < (options.maxDaysAhead ?? 90)) {
            // Skip excluded days
            const dayOfWeek = currentDate.getDay();
            if (options.excludeDays?.includes(dayOfWeek)) {
                currentDate = this.addDays(currentDate, 1);
                daysScheduled++;
                continue;
            }
            // Collect steps for this day
            const daySteps = [];
            let dayMinutes = 0;
            while (stepIndex < steps.length && dayMinutes + steps[stepIndex].estimatedMinutes <= options.dailyMinutes) {
                daySteps.push(steps[stepIndex].id);
                dayMinutes += steps[stepIndex].estimatedMinutes;
                stepIndex++;
            }
            // If we couldn't fit any steps, force at least one
            if (daySteps.length === 0 && stepIndex < steps.length) {
                daySteps.push(steps[stepIndex].id);
                dayMinutes = steps[stepIndex].estimatedMinutes;
                stepIndex++;
            }
            if (daySteps.length > 0) {
                sessions.push({
                    date: new Date(currentDate),
                    steps: daySteps,
                    estimatedMinutes: dayMinutes,
                    completed: false,
                });
            }
            currentDate = this.addDays(currentDate, 1);
            daysScheduled++;
        }
        return {
            dailyMinutes: options.dailyMinutes,
            preferredTimes: options.preferredTimes,
            excludeDays: options.excludeDays,
            sessions,
        };
    }
    generateCheckpoints(steps, _decomposition) {
        const checkpoints = [];
        const totalSteps = steps.length;
        // Add milestone checkpoints at key intervals
        const milestoneIndices = [
            Math.floor(totalSteps * 0.25),
            Math.floor(totalSteps * 0.5),
            Math.floor(totalSteps * 0.75),
            totalSteps - 1,
        ].filter((v, i, a) => a.indexOf(v) === i && v >= 0);
        for (let i = 0; i < milestoneIndices.length; i++) {
            const stepIndex = milestoneIndices[i];
            const step = steps[stepIndex];
            const percentage = Math.round(((stepIndex + 1) / totalSteps) * 100);
            checkpoints.push({
                id: this.generateCheckpointId(),
                planId: '', // Will be set when plan is created
                stepId: step.id,
                name: `${percentage}% Complete`,
                description: `Reached ${percentage}% of the learning plan`,
                type: 'milestone',
                achieved: false,
            });
        }
        // Add assessment checkpoints
        const assessmentSteps = steps.filter((s) => s.type === StepType.TAKE_QUIZ || s.type === StepType.COMPLETE_EXERCISE);
        for (const step of assessmentSteps) {
            checkpoints.push({
                id: this.generateCheckpointId(),
                planId: '',
                stepId: step.id,
                name: `Assessment: ${step.title}`,
                type: 'assessment',
                achieved: false,
            });
        }
        return checkpoints;
    }
    generateFallbackStrategies() {
        return [
            {
                trigger: { type: 'step_failed', threshold: 2 },
                action: { type: 'simplify', parameters: { reduceComplexity: true } },
                priority: 1,
            },
            {
                trigger: { type: 'stuck_too_long', threshold: 15 }, // 15 minutes
                action: { type: 'add_support', parameters: { addHints: true } },
                priority: 2,
            },
            {
                trigger: { type: 'low_engagement', threshold: 0.3 },
                action: { type: 'replan', parameters: { adjustDifficulty: 'decrease' } },
                priority: 3,
            },
            {
                trigger: { type: 'mastery_not_improving', threshold: 5 }, // 5 attempts
                action: { type: 'escalate', parameters: { seekHelp: true } },
                priority: 4,
            },
        ];
    }
    applyTimeConstraint(plan, maxMinutes) {
        let totalMinutes = plan.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
        if (totalMinutes <= maxMinutes)
            return plan;
        // Reduce time by prioritizing essential steps
        const prioritizedSteps = [...plan.steps].sort((a, b) => {
            // Keep assessments and core learning, reduce practice and review
            const priority = {
                [StepType.READ_CONTENT]: 1,
                [StepType.TAKE_QUIZ]: 2,
                [StepType.PRACTICE_PROBLEM]: 3,
                [StepType.COMPLETE_EXERCISE]: 3,
                [StepType.SOCRATIC_DIALOGUE]: 4,
                [StepType.SPACED_REVIEW]: 5,
                [StepType.REFLECT]: 6,
                [StepType.CREATE_SUMMARY]: 6,
                [StepType.WATCH_VIDEO]: 2,
                [StepType.PEER_DISCUSSION]: 7,
                [StepType.PROJECT_WORK]: 4,
                [StepType.RESEARCH]: 5,
            };
            return (priority[a.type] ?? 5) - (priority[b.type] ?? 5);
        });
        // Keep steps until we hit the limit
        const keptSteps = [];
        let runningTotal = 0;
        for (const step of prioritizedSteps) {
            if (runningTotal + step.estimatedMinutes <= maxMinutes) {
                keptSteps.push(step);
                runningTotal += step.estimatedMinutes;
            }
        }
        // Re-order by original order
        keptSteps.sort((a, b) => a.order - b.order);
        return { ...plan, steps: keptSteps };
    }
    applyDeadlineConstraint(plan, deadline) {
        if (!plan.schedule)
            return plan;
        const filteredSessions = plan.schedule.sessions.filter((s) => s.date <= deadline);
        return {
            ...plan,
            targetDate: deadline,
            schedule: { ...plan.schedule, sessions: filteredSessions },
        };
    }
    applyDailyLimit(plan, maxDailyMinutes) {
        if (!plan.schedule)
            return plan;
        const newSchedule = { ...plan.schedule, dailyMinutes: maxDailyMinutes };
        // Redistribute sessions to respect the new daily limit
        const allStepIds = plan.schedule.sessions.flatMap((s) => s.steps);
        const stepMap = new Map(plan.steps.map((s) => [s.id, s]));
        const newSessions = [];
        let currentDate = plan.schedule.sessions[0]?.date ?? new Date();
        let currentSession = {
            date: currentDate,
            steps: [],
            estimatedMinutes: 0,
            completed: false,
        };
        for (const stepId of allStepIds) {
            const step = stepMap.get(stepId);
            if (!step)
                continue;
            if (currentSession.estimatedMinutes + step.estimatedMinutes > maxDailyMinutes) {
                if (currentSession.steps.length > 0) {
                    newSessions.push(currentSession);
                }
                currentDate = this.addDays(currentDate, 1);
                currentSession = {
                    date: currentDate,
                    steps: [stepId],
                    estimatedMinutes: step.estimatedMinutes,
                    completed: false,
                };
            }
            else {
                currentSession.steps.push(stepId);
                currentSession.estimatedMinutes += step.estimatedMinutes;
            }
        }
        if (currentSession.steps.length > 0) {
            newSessions.push(currentSession);
        }
        return { ...plan, schedule: { ...newSchedule, sessions: newSessions } };
    }
    increaseDifficulty(plan, stepIds) {
        const targetSteps = stepIds
            ? plan.steps.filter((s) => stepIds.includes(s.id))
            : plan.steps;
        // Add more challenging variations to practice steps
        for (const step of targetSteps) {
            if (step.type === StepType.PRACTICE_PROBLEM) {
                step.metadata = { ...step.metadata, difficulty: 'increased' };
            }
        }
    }
    decreaseDifficulty(plan, stepIds) {
        const targetSteps = stepIds
            ? plan.steps.filter((s) => stepIds.includes(s.id))
            : plan.steps;
        for (const step of targetSteps) {
            step.metadata = { ...step.metadata, difficulty: 'decreased' };
            // Increase time allocation for difficult content
            step.estimatedMinutes = Math.ceil(step.estimatedMinutes * 1.2);
        }
    }
    addSupportSteps(plan, stepIds) {
        const targetSteps = stepIds
            ? plan.steps.filter((s) => stepIds.includes(s.id))
            : plan.steps.filter((s) => s.status === StepStatus.FAILED);
        for (const step of targetSteps) {
            const stepIndex = plan.steps.findIndex((s) => s.id === step.id);
            if (stepIndex === -1)
                continue;
            // Insert a support step before the difficult step
            const supportStep = {
                id: this.generateStepId(),
                planId: plan.id,
                type: StepType.SOCRATIC_DIALOGUE,
                title: `Extra Support: ${step.title}`,
                description: `Additional explanation and practice for ${step.title}`,
                order: step.order - 0.5,
                status: StepStatus.PENDING,
                estimatedMinutes: 15,
                retryCount: 0,
                maxRetries: 1,
                metadata: { supportFor: step.id },
            };
            plan.steps.splice(stepIndex, 0, supportStep);
        }
        // Re-order steps
        plan.steps.sort((a, b) => a.order - b.order);
        plan.steps.forEach((s, i) => (s.order = i));
    }
    skipSteps(plan, stepIds) {
        for (const stepId of stepIds) {
            const step = plan.steps.find((s) => s.id === stepId);
            if (step && step.status === StepStatus.PENDING) {
                step.status = StepStatus.SKIPPED;
            }
        }
    }
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    generatePlanId() {
        return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    generateStepId() {
        return `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    generateCheckpointId() {
        return `cp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createPlanBuilder(config) {
    return new PlanBuilder(config);
}
//# sourceMappingURL=plan-builder.js.map
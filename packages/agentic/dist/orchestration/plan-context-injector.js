/**
 * @sam-ai/agentic - Plan Context Injector
 * Formats plan context for LLM prompt injection
 */
// ============================================================================
// PLAN CONTEXT INJECTOR
// ============================================================================
export class PlanContextInjector {
    config;
    logger;
    constructor(config = {}) {
        this.config = {
            logger: config.logger ?? this.createDefaultLogger(),
            maxObjectives: config.maxObjectives ?? 5,
            maxPreviousResults: config.maxPreviousResults ?? 3,
            includeMemoryContext: config.includeMemoryContext ?? true,
            includeGamification: config.includeGamification ?? false,
            templateFormat: config.templateFormat ?? 'markdown',
        };
        this.logger = this.config.logger;
    }
    /**
     * Create plan context injection for LLM prompt
     */
    createInjection(context) {
        this.logger.debug('Creating plan context injection', {
            userId: context.userId,
            hasGoal: !!context.activeGoal,
            hasPlan: !!context.activePlan,
            hasStep: !!context.currentStep,
        });
        const systemPromptAdditions = this.buildSystemPromptAdditions(context);
        const messagePrefix = this.buildMessagePrefix(context);
        const messageSuffix = this.buildMessageSuffix(context);
        const structuredContext = this.buildStructuredContext(context);
        return {
            systemPromptAdditions,
            messagePrefix,
            messageSuffix,
            structuredContext,
        };
    }
    /**
     * Format context as a single string for system prompt
     */
    formatForSystemPrompt(context) {
        const injection = this.createInjection(context);
        return injection.systemPromptAdditions.join('\n\n');
    }
    /**
     * Format context as structured data
     */
    formatAsStructuredData(context) {
        return this.buildStructuredContext(context);
    }
    /**
     * Build the complete prompt with context
     */
    buildCompletePrompt(context, userMessage, systemPrompt) {
        const injection = this.createInjection(context);
        // Build enhanced system prompt
        const enhancedSystemPrompt = [
            systemPrompt ?? '',
            ...injection.systemPromptAdditions,
        ].filter(Boolean).join('\n\n');
        // Build enhanced user message
        const enhancedUserMessage = [
            injection.messagePrefix,
            userMessage,
            injection.messageSuffix,
        ].filter(Boolean).join('\n\n');
        return {
            systemPrompt: enhancedSystemPrompt,
            userMessage: enhancedUserMessage,
            structuredContext: injection.structuredContext,
        };
    }
    // ============================================================================
    // PRIVATE BUILDER METHODS
    // ============================================================================
    buildSystemPromptAdditions(context) {
        const additions = [];
        // Add learning plan context
        if (context.activePlan && context.currentStep) {
            additions.push(this.formatPlanContext(context));
        }
        // Add step objectives
        if (context.stepObjectives.length > 0) {
            additions.push(this.formatStepObjectives(context.stepObjectives));
        }
        // Add memory context
        if (this.config.includeMemoryContext) {
            const memoryPrompt = this.formatMemoryContext(context);
            if (memoryPrompt) {
                additions.push(memoryPrompt);
            }
        }
        // Add available tools
        if (context.allowedTools.length > 0) {
            additions.push(this.formatAvailableTools(context));
        }
        // Add pending interventions
        if (context.pendingInterventions.length > 0) {
            additions.push(this.formatInterventions(context));
        }
        return additions;
    }
    buildMessagePrefix(context) {
        if (!context.currentStep) {
            return null;
        }
        const step = context.currentStep;
        return this.formatTemplate('prefix', {
            stepTitle: step.title,
            stepType: step.type,
            progress: this.calculateProgress(context),
        });
    }
    buildMessageSuffix(context) {
        if (context.stepObjectives.length === 0) {
            return null;
        }
        return this.formatTemplate('suffix', {
            objectives: context.stepObjectives.slice(0, this.config.maxObjectives),
        });
    }
    buildStructuredContext(context) {
        return {
            goalSummary: context.activeGoal
                ? `${context.activeGoal.title}: ${context.activeGoal.description ?? ''}`
                : null,
            stepDetails: context.currentStep
                ? this.buildStepDetails(context.currentStep)
                : null,
            progressSummary: this.buildProgressSummary(context),
            availableActions: this.getAvailableActions(context),
            constraints: this.getConstraints(context),
        };
    }
    buildStepDetails(step) {
        // Get objectives from metadata if available
        const successCriteria = step.metadata?.successCriteria || [];
        return {
            title: step.title,
            type: step.type,
            description: step.description ?? null,
            objectives: successCriteria,
            estimatedMinutes: step.estimatedMinutes,
            currentProgress: 0, // Would be calculated from evaluation
        };
    }
    buildProgressSummary(context) {
        if (!context.activePlan) {
            return 'No active learning plan.';
        }
        const plan = context.activePlan;
        const totalSteps = plan.steps.length;
        const completedSteps = plan.steps.filter(s => s.status === 'completed').length;
        const progress = Math.round((completedSteps / totalSteps) * 100);
        return `Progress: ${completedSteps}/${totalSteps} steps completed (${progress}%)`;
    }
    getAvailableActions(context) {
        const actions = [];
        // Base actions always available
        actions.push('ask questions', 'request clarification', 'get examples');
        // Step-type specific actions
        if (context.currentStep) {
            const stepActions = this.getStepTypeActions(context.currentStep.type);
            actions.push(...stepActions);
        }
        // Tool-based actions
        for (const tool of context.allowedTools) {
            actions.push(tool.name);
        }
        return actions;
    }
    getStepTypeActions(stepType) {
        const actionMap = {
            read_content: ['summarize content', 'explain concept', 'provide examples'],
            watch_video: ['summarize video', 'ask about section', 'note key points'],
            complete_exercise: ['check solution', 'get hints', 'show answer'],
            take_quiz: ['submit answer', 'request feedback', 'review explanation'],
            reflect: ['guided reflection', 'connect concepts', 'identify gaps'],
            practice_problem: ['check solution', 'get hints', 'show steps'],
            socratic_dialogue: ['ask questions', 'explore reasoning', 'challenge assumptions'],
            spaced_review: ['test recall', 'highlight key points', 'create summary'],
            create_summary: ['organize notes', 'highlight key points', 'create outline'],
            peer_discussion: ['share perspective', 'ask clarifying questions'],
            project_work: ['validate approach', 'suggest improvements', 'debug code'],
            research: ['explore sources', 'verify information', 'synthesize findings'],
        };
        return actionMap[stepType] || [];
    }
    getConstraints(context) {
        const constraints = [];
        // Step-specific constraints
        if (context.currentStep) {
            const step = context.currentStep;
            if (step.type === 'take_quiz') {
                constraints.push('Do not reveal answers directly');
                constraints.push('Guide toward understanding rather than giving solutions');
            }
            if (step.type === 'practice_problem' || step.type === 'complete_exercise') {
                constraints.push('Provide hints before solutions');
                constraints.push('Encourage multiple attempts');
            }
        }
        // Memory-based constraints
        if (context.memoryContext.strugglingConcepts.length > 0) {
            constraints.push(`Be patient with: ${context.memoryContext.strugglingConcepts.slice(0, 3).join(', ')}`);
        }
        return constraints;
    }
    // ============================================================================
    // FORMATTING METHODS
    // ============================================================================
    formatPlanContext(context) {
        const { activePlan, currentStep, activeGoal } = context;
        if (!activePlan || !currentStep) {
            return '';
        }
        const template = this.getTemplate('planContext');
        return template
            .replace('{{goalTitle}}', activeGoal?.title ?? 'Learning Goal')
            .replace('{{planTitle}}', `Plan for Goal: ${activeGoal?.title ?? 'Unknown'}`)
            .replace('{{currentStep}}', currentStep.title)
            .replace('{{stepType}}', currentStep.type)
            .replace('{{progress}}', this.calculateProgress(context));
    }
    formatStepObjectives(objectives) {
        const limitedObjectives = objectives.slice(0, this.config.maxObjectives);
        const template = this.getTemplate('objectives');
        const objectivesList = limitedObjectives
            .map((obj, i) => `${i + 1}. ${obj}`)
            .join('\n');
        return template.replace('{{objectives}}', objectivesList);
    }
    formatMemoryContext(context) {
        const { memoryContext } = context;
        const parts = [];
        if (memoryContext.masteredConcepts.length > 0) {
            parts.push(`Mastered: ${memoryContext.masteredConcepts.slice(0, 5).join(', ')}`);
        }
        if (memoryContext.strugglingConcepts.length > 0) {
            parts.push(`Needs work: ${memoryContext.strugglingConcepts.slice(0, 5).join(', ')}`);
        }
        if (memoryContext.learningStyle) {
            parts.push(`Learning style: ${memoryContext.learningStyle}`);
        }
        if (parts.length === 0) {
            return null;
        }
        return this.getTemplate('memory').replace('{{memoryContext}}', parts.join('\n'));
    }
    formatAvailableTools(context) {
        const toolList = context.allowedTools
            .map(t => `- ${t.name}: ${t.description}`)
            .join('\n');
        return this.getTemplate('tools').replace('{{tools}}', toolList);
    }
    formatInterventions(context) {
        const interventions = context.pendingInterventions
            .slice(0, 3)
            .map(i => `- [${i.priority}] ${i.message}`)
            .join('\n');
        return this.getTemplate('interventions').replace('{{interventions}}', interventions);
    }
    formatTemplate(type, data) {
        switch (type) {
            case 'prefix':
                return `[Current Step: ${data.stepTitle} (${data.stepType}) - Progress: ${data.progress}]`;
            case 'suffix':
                const objectives = data.objectives;
                if (objectives.length === 0)
                    return '';
                return `\n\n[Objectives for this step: ${objectives.join('; ')}]`;
            default:
                return '';
        }
    }
    // ============================================================================
    // TEMPLATE METHODS
    // ============================================================================
    getTemplate(type) {
        const templates = {
            markdown: {
                planContext: `## Current Learning Context
**Goal:** {{goalTitle}}
**Plan:** {{planTitle}}
**Current Step:** {{currentStep}} ({{stepType}})
**Progress:** {{progress}}`,
                objectives: `## Step Objectives
{{objectives}}`,
                memory: `## Learner Context
{{memoryContext}}`,
                tools: `## Available Tools
{{tools}}`,
                interventions: `## Pending Interventions
{{interventions}}`,
            },
            xml: {
                planContext: `<learning-context>
  <goal>{{goalTitle}}</goal>
  <plan>{{planTitle}}</plan>
  <current-step type="{{stepType}}">{{currentStep}}</current-step>
  <progress>{{progress}}</progress>
</learning-context>`,
                objectives: `<step-objectives>
{{objectives}}
</step-objectives>`,
                memory: `<learner-context>
{{memoryContext}}
</learner-context>`,
                tools: `<available-tools>
{{tools}}
</available-tools>`,
                interventions: `<interventions>
{{interventions}}
</interventions>`,
            },
            json: {
                planContext: `{"learningContext":{"goal":"{{goalTitle}}","plan":"{{planTitle}}","currentStep":"{{currentStep}}","stepType":"{{stepType}}","progress":"{{progress}}"}}`,
                objectives: `{"objectives":[{{objectives}}]}`,
                memory: `{"learnerContext":{{memoryContext}}}`,
                tools: `{"tools":[{{tools}}]}`,
                interventions: `{"interventions":[{{interventions}}]}`,
            },
        };
        return templates[this.config.templateFormat]?.[type] ?? templates.markdown[type] ?? '';
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    calculateProgress(context) {
        if (!context.activePlan) {
            return '0%';
        }
        const plan = context.activePlan;
        const total = plan.steps.length;
        const completed = plan.steps.filter(s => s.status === 'completed').length;
        return `${Math.round((completed / total) * 100)}%`;
    }
    createDefaultLogger() {
        return {
            debug: (_message, _data) => { },
            info: (_message, _data) => { },
            warn: (message, data) => {
                console.warn(`[PlanContextInjector] ${message}`, data);
            },
            error: (message, error, data) => {
                console.error(`[PlanContextInjector] ${message}`, error, data);
            },
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createPlanContextInjector(config) {
    return new PlanContextInjector(config);
}
//# sourceMappingURL=plan-context-injector.js.map
/**
 * @sam-ai/agentic - Tutoring Loop Controller
 * Main orchestrator for plan-driven tutoring sessions
 * Prepares context before LLM calls and evaluates progress after responses
 */
// ============================================================================
// TUTORING LOOP CONTROLLER
// ============================================================================
export class TutoringLoopController {
    config;
    logger;
    constructor(config) {
        this.config = {
            ...config,
            stepCompletionThreshold: config.stepCompletionThreshold ?? 0.8,
            autoAdvance: config.autoAdvance ?? true,
            maxStepRetries: config.maxStepRetries ?? 3,
            sessionTimeoutMinutes: config.sessionTimeoutMinutes ?? 60,
            logger: config.logger ?? this.createDefaultLogger(),
            criterionEvaluator: config.criterionEvaluator,
        };
        this.logger = this.config.logger;
    }
    /**
     * Prepare complete tutoring context for an LLM call
     */
    async prepareContext(userId, sessionId, _message, options = {}) {
        const startTime = Date.now();
        this.logger.debug('Preparing tutoring context', { userId, sessionId });
        // Get or create session
        const session = await this.config.sessionStore.getOrCreate(userId, options.planId);
        // Fetch active goal and plan
        const [activeGoal, activePlan] = await Promise.all([
            this.getActiveGoal(userId, options.goalId),
            this.getActivePlan(userId, options.planId),
        ]);
        // Get current step from plan
        const currentStep = activePlan
            ? this.getCurrentStep(activePlan)
            : null;
        // Get step objectives
        const stepObjectives = currentStep
            ? this.extractStepObjectives(currentStep)
            : [];
        // Get allowed tools for this step
        const allowedTools = await this.getAllowedTools(currentStep);
        // Build memory context
        const memoryContext = await this.buildMemoryContext(userId, options.sessionContext);
        // Get pending interventions
        const pendingInterventions = await this.getPendingInterventions(userId, sessionId);
        // Get previous step results
        const previousStepResults = activePlan
            ? this.getPreviousStepResults(activePlan)
            : [];
        // Build session metadata
        const sessionMetadata = this.buildSessionMetadata(session);
        const context = {
            userId,
            sessionId: session.id,
            activeGoal,
            activePlan,
            currentStep,
            stepObjectives,
            allowedTools,
            memoryContext,
            pendingInterventions,
            previousStepResults,
            sessionMetadata,
        };
        this.logger.debug('Context prepared', {
            userId,
            hasGoal: !!activeGoal,
            hasPlan: !!activePlan,
            hasStep: !!currentStep,
            toolCount: allowedTools.length,
            prepTimeMs: Date.now() - startTime,
        });
        return context;
    }
    /**
     * Evaluate whether the current step can be advanced
     */
    async evaluateProgress(context, response, userMessage) {
        const startTime = Date.now();
        this.logger.debug('Evaluating step progress', {
            userId: context.userId,
            stepId: context.currentStep?.id,
        });
        if (!context.currentStep) {
            return this.createEmptyEvaluation();
        }
        const step = context.currentStep;
        const evaluatedCriteria = [];
        const pendingCriteria = [];
        // Evaluate success criteria (stored in metadata if available)
        const successCriteria = step.metadata?.successCriteria || [];
        for (const criterion of successCriteria) {
            const evaluation = await this.evaluateCriterion(criterion, context, response, userMessage);
            if (evaluation.met) {
                evaluatedCriteria.push(evaluation);
            }
            else {
                pendingCriteria.push(criterion);
            }
        }
        // Calculate progress
        const totalCriteria = successCriteria.length;
        const metCriteria = evaluatedCriteria.filter(c => c.met).length;
        const progressPercent = totalCriteria > 0
            ? Math.round((metCriteria / totalCriteria) * 100)
            : 0;
        // Determine confidence
        const avgConfidence = evaluatedCriteria.length > 0
            ? evaluatedCriteria.reduce((sum, c) => sum + c.confidence, 0) / evaluatedCriteria.length
            : 0;
        // Check if step is complete
        const stepComplete = pendingCriteria.length === 0 &&
            avgConfidence >= this.config.stepCompletionThreshold;
        // Generate recommendations
        const recommendations = this.generateRecommendations(context, evaluatedCriteria, pendingCriteria, progressPercent);
        // Determine if we should advance
        const shouldAdvance = stepComplete && this.config.autoAdvance;
        const recommendedNextStepId = shouldAdvance
            ? this.getNextStepId(context.activePlan, step.id)
            : null;
        const evaluation = {
            stepComplete,
            confidence: avgConfidence,
            evaluatedCriteria,
            pendingCriteria,
            progressPercent,
            recommendations,
            shouldAdvance,
            recommendedNextStepId,
        };
        this.logger.debug('Evaluation complete', {
            stepId: step.id,
            stepComplete,
            progressPercent,
            evaluationTimeMs: Date.now() - startTime,
        });
        return evaluation;
    }
    /**
     * Advance to the next step in the plan
     */
    async advanceStep(planId, evaluation, options = {}) {
        this.logger.debug('Advancing step', { planId, shouldAdvance: evaluation.shouldAdvance });
        const plan = await this.config.planStore.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        const currentStep = this.getCurrentStep(plan);
        const transitionType = this.determineTransitionType(evaluation, options);
        // Get the next step
        const nextStepId = options.targetStepId || evaluation.recommendedNextStepId;
        const nextStep = nextStepId
            ? plan.steps.find(s => s.id === nextStepId) ?? null
            : null;
        // Update plan state
        const updatedPlanState = await this.updatePlanState(plan, currentStep, nextStep, evaluation, transitionType);
        // Check if plan is complete
        const planComplete = this.isPlanComplete(plan, nextStep);
        // Generate celebration if milestone reached
        const celebration = this.generateCelebration(currentStep, nextStep, planComplete);
        // Generate transition message
        const transitionMessage = this.generateTransitionMessage(transitionType, currentStep, nextStep, planComplete);
        const transition = {
            previousStep: currentStep,
            currentStep: nextStep,
            transitionType,
            updatedPlanState,
            transitionMessage,
            planComplete,
            celebration,
        };
        this.logger.info('Step transition complete', {
            planId,
            transitionType,
            planComplete,
            previousStepId: currentStep?.id,
            currentStepId: nextStep?.id,
        });
        return transition;
    }
    /**
     * Plan tool usage based on the current tutoring context
     */
    async planToolUsage(context, userMessage) {
        const startTime = Date.now();
        this.logger.debug('Planning tool usage', {
            userId: context.userId,
            stepId: context.currentStep?.id,
        });
        const plannedTools = [];
        let stepContext = null;
        if (context.currentStep) {
            stepContext = {
                stepId: context.currentStep.id,
                stepType: context.currentStep.type,
                objectives: context.stepObjectives,
                allowedTools: context.allowedTools.map(t => t.id),
            };
            // Analyze message to determine which tools might be needed
            const toolRecommendations = await this.analyzeToolNeeds(context, userMessage);
            for (const rec of toolRecommendations) {
                const tool = context.allowedTools.find(t => t.id === rec.toolId);
                if (tool) {
                    plannedTools.push({
                        toolId: tool.id,
                        toolName: tool.name,
                        input: rec.suggestedInput,
                        priority: rec.priority,
                        requiresConfirmation: tool.confirmationType !== 'none',
                        reasoning: rec.reasoning,
                    });
                }
            }
        }
        // Sort by priority
        plannedTools.sort((a, b) => b.priority - a.priority);
        const plan = {
            tools: plannedTools,
            reasoning: this.generateToolPlanReasoning(plannedTools, context),
            confidence: this.calculateToolPlanConfidence(plannedTools),
            requiresConfirmation: plannedTools.some(t => t.requiresConfirmation),
            stepContext,
        };
        this.logger.debug('Tool plan created', {
            toolCount: plannedTools.length,
            requiresConfirmation: plan.requiresConfirmation,
            planTimeMs: Date.now() - startTime,
        });
        return plan;
    }
    /**
     * Process the complete tutoring loop
     */
    async processLoop(userId, sessionId, userMessage, llmResponse, options = {}) {
        const loopStartTime = Date.now();
        // Prepare context
        const contextStartTime = Date.now();
        const context = await this.prepareContext(userId, sessionId, userMessage, {
            planId: options.planId,
            goalId: options.goalId,
            sessionContext: options.sessionContext,
        });
        const contextPrepTime = Date.now() - contextStartTime;
        // Plan tool usage
        const toolPlanStartTime = Date.now();
        const toolPlan = await this.planToolUsage(context, userMessage);
        const toolPlanningTime = Date.now() - toolPlanStartTime;
        // Evaluate progress
        const evalStartTime = Date.now();
        const evaluation = await this.evaluateProgress(context, llmResponse, userMessage);
        const evaluationTime = Date.now() - evalStartTime;
        // Advance step if needed
        let transition = null;
        if (evaluation.shouldAdvance && context.activePlan) {
            transition = await this.advanceStep(context.activePlan.id, evaluation);
        }
        // Get pending confirmations
        const pendingConfirmations = await this.config.confirmationStore.getByUser(userId, { status: ['pending'] });
        // Update session
        await this.config.sessionStore.update(context.sessionId, {
            messageCount: context.sessionMetadata.messageCount + 1,
            metadata: { ...context.sessionMetadata, lastActiveAt: new Date().toISOString() },
        });
        const metadata = {
            processingTime: Date.now() - loopStartTime,
            contextPrepTime,
            evaluationTime,
            toolPlanningTime,
            stepAdvanced: !!transition,
            planCompleted: transition?.planComplete ?? false,
            interventionsTriggered: context.pendingInterventions.length,
        };
        return {
            response: llmResponse,
            modifiedResponse: null, // Can be enhanced with step context
            context,
            evaluation,
            transition,
            toolPlan,
            pendingConfirmations,
            metadata,
        };
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    async getActiveGoal(userId, goalId) {
        if (goalId) {
            return this.config.goalStore.get(goalId);
        }
        const goals = await this.config.goalStore.getByUser(userId, {
            status: ['active'],
            limit: 1,
        });
        return goals[0] ?? null;
    }
    async getActivePlan(userId, planId) {
        if (planId) {
            return this.config.planStore.get(planId);
        }
        const plans = await this.config.planStore.getByUser(userId, {
            status: ['active'],
            limit: 1,
        });
        return plans[0] ?? null;
    }
    getCurrentStep(plan) {
        // Find the first step that is not completed
        return plan.steps.find(s => s.status === 'pending' || s.status === 'in_progress') ?? null;
    }
    extractStepObjectives(step) {
        const objectives = [];
        if (step.description) {
            objectives.push(step.description);
        }
        // Get success criteria from metadata if available
        const successCriteria = step.metadata?.successCriteria;
        if (successCriteria) {
            objectives.push(...successCriteria);
        }
        return objectives;
    }
    async getAllowedTools(step) {
        // Get allowed tools from step metadata if available
        const allowedToolIds = step?.metadata?.allowedTools || [];
        if (allowedToolIds.length === 0) {
            // Return default set of safe tools
            return this.config.toolStore.list({
                enabled: true,
                category: 'content',
                limit: 10,
            });
        }
        const tools = [];
        for (const toolId of allowedToolIds) {
            const tool = await this.config.toolStore.get(toolId);
            if (tool && tool.enabled) {
                tools.push(tool);
            }
        }
        return tools;
    }
    async buildMemoryContext(_userId, sessionContext) {
        const insights = sessionContext?.insights;
        return {
            recentTopics: sessionContext?.currentState?.recentConcepts || [],
            strugglingConcepts: insights?.strugglingConcepts || [],
            masteredConcepts: insights?.masteredConcepts || [],
            sessionSummary: null, // Can be populated from memory system
            knowledgeSnippets: [],
            learningStyle: sessionContext?.preferences?.learningStyle || null,
            currentMasteryLevel: null,
        };
    }
    async getPendingInterventions(_userId, _sessionId) {
        // This would typically query an intervention system
        // For now, return empty array
        return [];
    }
    getPreviousStepResults(plan) {
        const results = [];
        for (const step of plan.steps) {
            if (step.status === 'completed' || step.status === 'failed') {
                results.push({
                    stepId: step.id,
                    success: step.status === 'completed',
                    outputs: step.outputs || [],
                    completedAt: step.completedAt ?? new Date(),
                    duration: step.actualMinutes ?? step.estimatedMinutes,
                });
            }
        }
        return results;
    }
    buildSessionMetadata(session) {
        const now = new Date();
        const startedAt = session.startedAt;
        const totalMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);
        return {
            startedAt,
            lastActiveAt: session.endedAt ?? now,
            messageCount: session.messageCount,
            stepsCompletedThisSession: session.stepsCompleted.length,
            totalSessionTime: totalMinutes,
        };
    }
    /**
     * Evaluate a single criterion for step completion
     * Uses a combination of heuristic matching and LLM evaluation
     */
    async evaluateCriterion(criterion, context, response, userMessage) {
        const lowerCriterion = criterion.toLowerCase();
        const lowerResponse = response.toLowerCase();
        const lowerMessage = userMessage.toLowerCase();
        // First, try heuristic evaluation for common criterion types
        const heuristicResult = this.evaluateCriterionHeuristically(criterion, lowerCriterion, lowerResponse, lowerMessage, context);
        if (heuristicResult !== null) {
            this.logger.debug('Criterion evaluated heuristically', {
                criterion,
                met: heuristicResult.met,
                confidence: heuristicResult.confidence,
            });
            return heuristicResult;
        }
        // If we have an AI adapter, use it for complex evaluation
        if (this.config.criterionEvaluator && context.currentStep) {
            try {
                const aiResult = await this.config.criterionEvaluator.evaluateCriterion({
                    criterion,
                    userMessage,
                    assistantResponse: response,
                    stepContext: {
                        stepTitle: context.currentStep.title,
                        stepType: context.currentStep.type,
                        objectives: context.stepObjectives,
                    },
                    memoryContext: {
                        masteredConcepts: context.memoryContext.masteredConcepts,
                        strugglingConcepts: context.memoryContext.strugglingConcepts,
                    },
                });
                this.logger.debug('Criterion evaluated by AI', {
                    criterion,
                    met: aiResult.met,
                    confidence: aiResult.confidence,
                });
                return {
                    criterion,
                    met: aiResult.met,
                    evidence: aiResult.evidence,
                    confidence: aiResult.confidence,
                };
            }
            catch (error) {
                this.logger.warn('AI criterion evaluation failed, falling back to heuristics', { error });
            }
        }
        // Fallback: semantic similarity check
        return this.evaluateCriterionSemantically(criterion, response, userMessage, context);
    }
    /**
     * Heuristic evaluation for common criterion types
     */
    evaluateCriterionHeuristically(criterion, lowerCriterion, lowerResponse, lowerMessage, context) {
        // Time-based criteria
        if (lowerCriterion.includes('time spent') || lowerCriterion.includes('duration')) {
            const sessionTime = context.sessionMetadata.totalSessionTime;
            const requiredTime = this.extractTimeRequirement(lowerCriterion);
            if (requiredTime > 0) {
                const met = sessionTime >= requiredTime;
                return {
                    criterion,
                    met,
                    evidence: `Session time: ${sessionTime} minutes (required: ${requiredTime} minutes)`,
                    confidence: 1.0,
                };
            }
        }
        // Message count criteria
        if (lowerCriterion.includes('message') || lowerCriterion.includes('interaction')) {
            const messageCount = context.sessionMetadata.messageCount;
            const requiredCount = this.extractNumberRequirement(lowerCriterion);
            if (requiredCount > 0) {
                const met = messageCount >= requiredCount;
                return {
                    criterion,
                    met,
                    evidence: `Message count: ${messageCount} (required: ${requiredCount})`,
                    confidence: 1.0,
                };
            }
        }
        // Quiz/test score criteria
        if (lowerCriterion.includes('quiz') || lowerCriterion.includes('test') || lowerCriterion.includes('score')) {
            // Check if response mentions a score
            const scoreMatch = lowerResponse.match(/(\d+)\s*(?:\/|out of)\s*(\d+)|score[:\s]+(\d+)%?/i);
            if (scoreMatch) {
                const score = scoreMatch[1] && scoreMatch[2]
                    ? (parseInt(scoreMatch[1]) / parseInt(scoreMatch[2])) * 100
                    : parseInt(scoreMatch[3] || '0');
                const requiredScore = this.extractScoreRequirement(lowerCriterion);
                const met = score >= requiredScore;
                return {
                    criterion,
                    met,
                    evidence: `Score: ${score.toFixed(0)}% (required: ${requiredScore}%)`,
                    confidence: 0.9,
                };
            }
        }
        // Completion criteria
        if (lowerCriterion.includes('complete') || lowerCriterion.includes('finish')) {
            // Check for completion indicators in response
            const completionIndicators = [
                'completed', 'finished', 'done', 'accomplished',
                'successfully', 'well done', 'great job', 'excellent'
            ];
            const hasCompletionIndicator = completionIndicators.some(ind => lowerResponse.includes(ind));
            if (hasCompletionIndicator) {
                return {
                    criterion,
                    met: true,
                    evidence: 'Response indicates completion',
                    confidence: 0.75,
                };
            }
        }
        // Understanding demonstration
        if (lowerCriterion.includes('understand') || lowerCriterion.includes('demonstrate') || lowerCriterion.includes('explain')) {
            // Check if user provided an explanation
            const explanationIndicators = [
                'because', 'therefore', 'this means', 'in other words',
                'for example', 'specifically', 'essentially'
            ];
            const hasExplanation = explanationIndicators.some(ind => lowerMessage.includes(ind));
            // Check if response confirms understanding
            const confirmationIndicators = [
                'correct', 'exactly', 'that\'s right', 'well explained',
                'good understanding', 'you\'ve got it', 'precisely'
            ];
            const hasConfirmation = confirmationIndicators.some(ind => lowerResponse.includes(ind));
            if (hasExplanation && hasConfirmation) {
                return {
                    criterion,
                    met: true,
                    evidence: 'User demonstrated understanding with explanation confirmed by assistant',
                    confidence: 0.8,
                };
            }
            if (hasExplanation || hasConfirmation) {
                return {
                    criterion,
                    met: false,
                    evidence: hasExplanation
                        ? 'User provided explanation but awaiting confirmation'
                        : 'Partial understanding indicators detected',
                    confidence: 0.5,
                };
            }
        }
        // Practice/exercise criteria
        if (lowerCriterion.includes('practice') || lowerCriterion.includes('exercise')) {
            // Check if practice was completed
            const practiceIndicators = [
                'solved', 'answered', 'attempted', 'worked through',
                'practiced', 'tried', 'completed the exercise'
            ];
            const hasPractice = practiceIndicators.some(ind => lowerMessage.includes(ind) || lowerResponse.includes(ind));
            if (hasPractice) {
                return {
                    criterion,
                    met: true,
                    evidence: 'Practice/exercise completed',
                    confidence: 0.7,
                };
            }
        }
        // Question asking criteria
        if (lowerCriterion.includes('ask') && lowerCriterion.includes('question')) {
            const isQuestion = lowerMessage.includes('?') ||
                lowerMessage.startsWith('what') ||
                lowerMessage.startsWith('how') ||
                lowerMessage.startsWith('why') ||
                lowerMessage.startsWith('can you');
            if (isQuestion) {
                return {
                    criterion,
                    met: true,
                    evidence: 'User asked a question',
                    confidence: 0.9,
                };
            }
        }
        return null; // No heuristic match, use AI or semantic evaluation
    }
    /**
     * Semantic similarity-based criterion evaluation
     */
    evaluateCriterionSemantically(criterion, response, userMessage, _context) {
        // Simple keyword overlap scoring
        const criterionWords = this.extractKeywords(criterion);
        const responseWords = this.extractKeywords(response);
        const messageWords = this.extractKeywords(userMessage);
        const allContextWords = [...responseWords, ...messageWords];
        const matchCount = criterionWords.filter(word => allContextWords.some(contextWord => contextWord.includes(word) || word.includes(contextWord))).length;
        const similarity = criterionWords.length > 0
            ? matchCount / criterionWords.length
            : 0;
        // Threshold for considering criterion met
        const met = similarity >= 0.5;
        const confidence = Math.min(similarity + 0.2, 0.7); // Cap confidence for semantic eval
        return {
            criterion,
            met,
            evidence: met
                ? `Semantic match: ${matchCount}/${criterionWords.length} keywords found in context`
                : `Insufficient semantic match: ${matchCount}/${criterionWords.length} keywords`,
            confidence,
        };
    }
    /**
     * Extract keywords from text for semantic matching
     */
    extractKeywords(text) {
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'must', 'shall',
            'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
            'from', 'up', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again',
            'further', 'then', 'once', 'here', 'there', 'when', 'where',
            'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
            'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
            'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
            'as', 'until', 'while', 'this', 'that', 'these', 'those', 'it'
        ]);
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
    }
    /**
     * Extract time requirement from criterion text (in minutes)
     */
    extractTimeRequirement(criterion) {
        const hourMatch = criterion.match(/(\d+)\s*hour/);
        const minuteMatch = criterion.match(/(\d+)\s*min/);
        let minutes = 0;
        if (hourMatch)
            minutes += parseInt(hourMatch[1]) * 60;
        if (minuteMatch)
            minutes += parseInt(minuteMatch[1]);
        return minutes || 15; // Default to 15 minutes if no specific time found
    }
    /**
     * Extract number requirement from criterion text
     */
    extractNumberRequirement(criterion) {
        const match = criterion.match(/(\d+)/);
        return match ? parseInt(match[1]) : 3; // Default to 3 if no number found
    }
    /**
     * Extract score requirement from criterion text (as percentage)
     */
    extractScoreRequirement(criterion) {
        const percentMatch = criterion.match(/(\d+)\s*%/);
        if (percentMatch)
            return parseInt(percentMatch[1]);
        const fractionMatch = criterion.match(/(\d+)\s*(?:\/|out of)\s*(\d+)/);
        if (fractionMatch) {
            return (parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])) * 100;
        }
        return 70; // Default to 70% if no specific score found
    }
    generateRecommendations(_context, _evaluatedCriteria, pendingCriteria, progressPercent) {
        const recommendations = [];
        if (progressPercent >= 80) {
            recommendations.push({
                type: 'continue',
                reason: 'Good progress, continue with current approach',
                priority: 1,
            });
        }
        else if (progressPercent >= 50) {
            recommendations.push({
                type: 'practice',
                reason: 'Some practice exercises may help solidify understanding',
                priority: 2,
            });
        }
        else if (pendingCriteria.length > 2) {
            recommendations.push({
                type: 'simplify',
                reason: 'Consider breaking down the topic into smaller parts',
                priority: 3,
            });
        }
        return recommendations;
    }
    getNextStepId(plan, currentStepId) {
        if (!plan)
            return null;
        const currentIndex = plan.steps.findIndex(s => s.id === currentStepId);
        if (currentIndex === -1 || currentIndex >= plan.steps.length - 1) {
            return null;
        }
        return plan.steps[currentIndex + 1].id;
    }
    determineTransitionType(evaluation, options) {
        if (options.skip)
            return 'skip';
        if (options.retry)
            return 'retry';
        if (options.rollback)
            return 'rollback';
        if (options.targetStepId)
            return 'jump';
        if (evaluation.stepComplete)
            return 'advance';
        return 'advance';
    }
    async updatePlanState(plan, currentStep, nextStep, _evaluation, transitionType) {
        const now = new Date();
        // Update current step status
        if (currentStep) {
            const stepIndex = plan.steps.findIndex(s => s.id === currentStep.id);
            if (stepIndex !== -1) {
                await this.config.planStore.updateStep(plan.id, currentStep.id, {
                    status: transitionType === 'advance' ? 'completed' : plan.steps[stepIndex].status,
                    completedAt: transitionType === 'advance' ? now : undefined,
                });
            }
        }
        // Update next step status
        if (nextStep) {
            await this.config.planStore.updateStep(plan.id, nextStep.id, {
                status: 'in_progress',
                startedAt: now,
            });
        }
        // Load current state or create new one
        const existingState = await this.config.planStore.loadState(plan.id);
        // Calculate completed steps
        const completedStepIds = plan.steps
            .filter(s => s.status === 'completed')
            .map(s => s.id);
        const failedStepIds = plan.steps
            .filter(s => s.status === 'failed')
            .map(s => s.id);
        const skippedStepIds = plan.steps
            .filter(s => s.status === 'skipped')
            .map(s => s.id);
        const newState = {
            planId: plan.id,
            goalId: plan.goalId,
            userId: plan.userId,
            currentStepId: nextStep?.id ?? null,
            currentStepProgress: 0,
            completedSteps: completedStepIds,
            failedSteps: failedStepIds,
            skippedSteps: skippedStepIds,
            startedAt: existingState?.startedAt ?? now,
            lastActiveAt: now,
            totalActiveTime: existingState?.totalActiveTime ?? 0,
            context: existingState?.context ?? {
                recentTopics: [],
                strugglingConcepts: [],
                masteredConcepts: [],
            },
            checkpointData: existingState?.checkpointData ?? {},
            sessionCount: existingState?.sessionCount ?? 1,
        };
        // Save new state
        await this.config.planStore.saveState(newState);
        return newState;
    }
    isPlanComplete(plan, nextStep) {
        if (nextStep)
            return false;
        return plan.steps.every(s => s.status === 'completed' || s.status === 'skipped');
    }
    generateCelebration(currentStep, nextStep, planComplete) {
        if (planComplete) {
            return {
                type: 'goal_complete',
                title: 'Goal Achieved! 🎉',
                message: 'Congratulations! You have completed all steps in your learning plan.',
                xpEarned: 100,
            };
        }
        if (currentStep && !nextStep) {
            return {
                type: 'step_complete',
                title: 'Step Complete! ✨',
                message: `Great work completing: ${currentStep.title}`,
                xpEarned: 25,
            };
        }
        return null;
    }
    generateTransitionMessage(transitionType, currentStep, nextStep, planComplete) {
        if (planComplete) {
            return 'Congratulations! You have completed your learning plan.';
        }
        switch (transitionType) {
            case 'advance':
                return nextStep
                    ? `Moving on to: ${nextStep.title}`
                    : 'All steps completed!';
            case 'skip':
                return currentStep
                    ? `Skipped: ${currentStep.title}`
                    : 'Step skipped.';
            case 'retry':
                return currentStep
                    ? `Retrying: ${currentStep.title}`
                    : 'Retrying step.';
            case 'rollback':
                return nextStep
                    ? `Going back to: ${nextStep.title}`
                    : 'Rolling back.';
            case 'jump':
                return nextStep
                    ? `Jumping to: ${nextStep.title}`
                    : 'Jumping to step.';
            default:
                return 'Continuing with your learning plan.';
        }
    }
    /**
     * Analyze user message to determine which tools might be needed
     */
    async analyzeToolNeeds(context, userMessage) {
        const recommendations = [];
        const lowerMessage = userMessage.toLowerCase();
        // Analyze message for tool-triggering patterns
        for (const tool of context.allowedTools) {
            const toolMatch = this.matchToolToMessage(tool, lowerMessage, context);
            if (toolMatch) {
                recommendations.push(toolMatch);
            }
        }
        // Sort by priority (highest first)
        recommendations.sort((a, b) => b.priority - a.priority);
        // Limit to top 3 most relevant tools
        return recommendations.slice(0, 3);
    }
    /**
     * Match a tool to the user message to determine if it should be recommended
     */
    matchToolToMessage(tool, lowerMessage, context) {
        // Define tool-triggering patterns
        const toolPatterns = {
            // Content tools
            'search': {
                patterns: ['find', 'search', 'look for', 'where is', 'locate'],
                priority: 7,
            },
            'explain': {
                patterns: ['explain', 'what is', 'what does', 'how does', 'tell me about'],
                priority: 8,
            },
            'quiz': {
                patterns: ['quiz', 'test', 'practice questions', 'try a quiz', 'test me'],
                priority: 8,
            },
            'example': {
                patterns: ['example', 'show me', 'demonstrate', 'sample'],
                priority: 6,
            },
            'summarize': {
                patterns: ['summarize', 'summary', 'brief', 'recap', 'overview'],
                priority: 5,
            },
            // Progress tools
            'progress': {
                patterns: ['progress', 'how am i doing', 'my status', 'track'],
                priority: 6,
            },
            'goal': {
                patterns: ['goal', 'objective', 'target', 'what should i learn'],
                priority: 7,
            },
            // Learning tools
            'flashcard': {
                patterns: ['flashcard', 'flash card', 'memorize', 'remember'],
                priority: 6,
            },
            'hint': {
                patterns: ['hint', 'help me', 'stuck', 'clue', 'guide'],
                priority: 7,
            },
            'simplify': {
                patterns: ['simplify', 'easier', 'simpler', 'break down', 'step by step'],
                priority: 8,
            },
        };
        // Check if tool name matches any known pattern category
        const toolNameLower = tool.name.toLowerCase();
        for (const [category, config] of Object.entries(toolPatterns)) {
            // Check if tool matches this category
            if (toolNameLower.includes(category) || tool.category === category) {
                // Check if message matches any pattern
                const matchedPattern = config.patterns.find(pattern => lowerMessage.includes(pattern));
                if (matchedPattern) {
                    return {
                        toolId: tool.id,
                        suggestedInput: this.buildToolInput(tool, lowerMessage, context),
                        priority: config.priority,
                        reasoning: `User message contains "${matchedPattern}" which suggests ${tool.name} tool`,
                    };
                }
            }
        }
        // Generic matching based on tool description
        if (tool.description) {
            const descKeywords = this.extractKeywords(tool.description);
            const messageKeywords = this.extractKeywords(lowerMessage);
            const overlap = descKeywords.filter(kw => messageKeywords.includes(kw)).length;
            if (overlap >= 2) {
                return {
                    toolId: tool.id,
                    suggestedInput: this.buildToolInput(tool, lowerMessage, context),
                    priority: Math.min(overlap + 2, 6),
                    reasoning: `Tool description matches ${overlap} keywords in user message`,
                };
            }
        }
        return null;
    }
    /**
     * Build suggested input for a tool based on context
     */
    buildToolInput(_tool, userMessage, context) {
        const input = {};
        // Add common context-based fields that most tools might need
        input.userId = context.userId;
        input.sessionId = context.sessionId;
        // Extract topic from current step or message
        if (context.currentStep) {
            input.topic = context.currentStep.title;
            input.stepId = context.currentStep.id;
        }
        else {
            input.topic = this.extractMainTopic(userMessage);
        }
        // Add the query/question
        input.query = userMessage;
        // Try to extract courseId from plan checkpoint data
        if (context.activePlan?.checkpointData) {
            const courseId = context.activePlan.checkpointData.courseId;
            if (courseId) {
                input.courseId = courseId;
            }
        }
        return input;
    }
    /**
     * Extract the main topic from user message
     */
    extractMainTopic(message) {
        // Remove common question words and extract the subject
        const cleaned = message
            .replace(/^(what|how|why|can you|could you|please|help me|tell me|explain)\s+(is|are|does|do|the|about|with|to|understand)?\s*/i, '')
            .replace(/\?$/, '')
            .trim();
        // Take first meaningful phrase (up to 50 chars)
        const words = cleaned.split(/\s+/).slice(0, 8);
        return words.join(' ').substring(0, 50);
    }
    generateToolPlanReasoning(tools, _context) {
        if (tools.length === 0) {
            return 'No tools needed for this interaction.';
        }
        const toolNames = tools.map(t => t.toolName).join(', ');
        return `Planned to use: ${toolNames}. ${tools[0]?.reasoning ?? ''}`;
    }
    calculateToolPlanConfidence(tools) {
        if (tools.length === 0)
            return 1.0;
        // Average priority as confidence indicator
        const avgPriority = tools.reduce((sum, t) => sum + t.priority, 0) / tools.length;
        return Math.min(avgPriority / 10, 1.0);
    }
    createEmptyEvaluation() {
        return {
            stepComplete: false,
            confidence: 0,
            evaluatedCriteria: [],
            pendingCriteria: [],
            progressPercent: 0,
            recommendations: [],
            shouldAdvance: false,
            recommendedNextStepId: null,
        };
    }
    createDefaultLogger() {
        return {
            debug: (_message, _data) => { },
            info: (_message, _data) => { },
            warn: (message, data) => {
                console.warn(`[TutoringLoop] ${message}`, data);
            },
            error: (message, error, data) => {
                console.error(`[TutoringLoop] ${message}`, error, data);
            },
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createTutoringLoopController(config) {
    return new TutoringLoopController(config);
}
//# sourceMappingURL=tutoring-loop-controller.js.map
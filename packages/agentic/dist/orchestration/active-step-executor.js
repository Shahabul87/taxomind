/**
 * @sam-ai/agentic - Active Step Executor
 * Wires StepExecutor to runtime with tool binding and real-time execution
 */
// ============================================================================
// ACTIVE STEP EXECUTOR
// ============================================================================
export class ActiveStepExecutor {
    config;
    logger;
    pendingConfirmations = new Map();
    constructor(config) {
        this.config = {
            ...config,
            defaultTimeoutMs: config.defaultTimeoutMs ?? 30000,
            maxConcurrentTools: config.maxConcurrentTools ?? 3,
            requireConfirmation: config.requireConfirmation ?? true,
            confirmationExpiryMs: config.confirmationExpiryMs ?? 300000, // 5 minutes
            logger: config.logger ?? this.createDefaultLogger(),
        };
        this.logger = this.config.logger;
    }
    /**
     * Execute a step with its associated tools
     */
    async executeStep(step, context, toolPlan) {
        const startedAt = new Date();
        this.logger.info('Executing step', {
            stepId: step.id,
            stepType: step.type,
            toolCount: toolPlan.tools.length,
        });
        const toolResults = [];
        const errors = [];
        const artifacts = [];
        // Execute tools based on plan
        if (toolPlan.tools.length > 0) {
            const results = await this.executeToolPlan(toolPlan, context);
            toolResults.push(...results.summaries);
            errors.push(...results.errors);
            artifacts.push(...results.artifacts);
        }
        // Determine overall status
        const hasErrors = errors.some(e => !e.recoverable);
        const hasPendingConfirmations = toolResults.some(r => r.status === 'pending_confirmation');
        let status;
        if (hasErrors) {
            status = 'failed';
        }
        else if (hasPendingConfirmations) {
            status = 'blocked';
        }
        else {
            status = 'completed';
        }
        const completedAt = new Date();
        const duration = completedAt.getTime() - startedAt.getTime();
        // Calculate time efficiency based on estimated vs actual duration
        const estimatedMs = step.estimatedMinutes * 60 * 1000;
        const timeEfficiency = estimatedMs > 0 ? estimatedMs / duration : 1;
        const metrics = {
            engagement: 1, // Would be calculated from user interaction patterns
            comprehension: errors.length === 0 ? 1 : 0.5, // Based on error rate
            timeEfficiency: Math.min(timeEfficiency, 2), // Cap at 2x efficiency
            ...this.calculateAdditionalMetrics(toolResults),
        };
        const output = {
            message: this.generateOutputMessage(step, status, toolResults),
            data: this.aggregateToolOutputs(toolResults),
            artifacts,
        };
        const result = {
            stepId: step.id,
            status,
            output,
            metrics,
            toolResults,
            errors,
            startedAt,
            completedAt,
        };
        this.logger.info('Step execution complete', {
            stepId: step.id,
            status,
            duration,
            toolsExecuted: toolResults.length,
            errorsCount: errors.length,
        });
        return result;
    }
    /**
     * Execute a tool plan with confirmation handling
     */
    async executeToolPlan(toolPlan, context) {
        const summaries = [];
        const errors = [];
        const artifacts = [];
        // Separate tools that need confirmation
        const { needsConfirmation, canExecute } = this.categorizeTools(toolPlan.tools, context);
        // Execute tools that don't need confirmation
        const immediateResults = await this.executeToolsBatch(canExecute, context);
        summaries.push(...immediateResults.summaries);
        errors.push(...immediateResults.errors);
        artifacts.push(...immediateResults.artifacts);
        // Request confirmation for remaining tools
        for (const tool of needsConfirmation) {
            const confirmationResult = await this.requestToolConfirmation(tool, context);
            summaries.push(confirmationResult);
        }
        return { summaries, errors, artifacts };
    }
    /**
     * Execute a single tool
     */
    async executeTool(tool, context) {
        const startTime = Date.now();
        this.logger.debug('Executing tool', {
            toolId: tool.toolId,
            toolName: tool.toolName,
        });
        try {
            // Get tool definition
            const toolDef = await this.config.toolStore.get(tool.toolId);
            if (!toolDef) {
                return {
                    toolId: tool.toolId,
                    toolName: tool.toolName,
                    status: 'failed',
                    error: `Tool not found: ${tool.toolId}`,
                    duration: Date.now() - startTime,
                };
            }
            // Check if tool is enabled
            if (!toolDef.enabled) {
                return {
                    toolId: tool.toolId,
                    toolName: tool.toolName,
                    status: 'skipped',
                    error: 'Tool is disabled',
                    duration: Date.now() - startTime,
                };
            }
            // Validate input
            const validatedInput = await this.validateToolInput(toolDef, tool.input);
            // Build execution context
            const execContext = {
                userId: context.userId,
                sessionId: context.sessionId,
                requestId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                grantedPermissions: toolDef.requiredPermissions,
                userConfirmed: !tool.requiresConfirmation,
                previousCalls: [],
            };
            // Execute with timeout
            const result = await this.executeWithTimeout(toolDef.handler(validatedInput, execContext), toolDef.timeoutMs ?? this.config.defaultTimeoutMs);
            return {
                toolId: tool.toolId,
                toolName: tool.toolName,
                status: result.success ? 'success' : 'failed',
                result,
                error: result.error?.message,
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Tool execution failed', error, {
                toolId: tool.toolId,
            });
            return {
                toolId: tool.toolId,
                toolName: tool.toolName,
                status: 'failed',
                error: errorMessage,
                duration: Date.now() - startTime,
            };
        }
    }
    /**
     * Handle confirmation response for a pending tool execution
     */
    async handleConfirmation(confirmationId, response, context) {
        const pending = this.pendingConfirmations.get(confirmationId);
        if (!pending) {
            this.logger.warn('Confirmation not found', { confirmationId });
            return null;
        }
        // Update confirmation in store
        await this.config.confirmationStore.respond(confirmationId, response);
        // Remove from pending
        this.pendingConfirmations.delete(confirmationId);
        if (!response.approved) {
            return {
                toolId: pending.tool.toolId,
                toolName: pending.tool.toolName,
                status: 'skipped',
                error: response.rejectionReason ?? 'User declined',
                duration: 0,
                confirmationId,
            };
        }
        // Execute the tool with possibly modified input
        const toolToExecute = {
            ...pending.tool,
            input: response.modifiedInput ?? pending.tool.input,
            requiresConfirmation: false, // Already confirmed
        };
        return this.executeTool(toolToExecute, context);
    }
    /**
     * Get all pending confirmations for a user
     */
    async getPendingConfirmations(userId) {
        return this.config.confirmationStore.getByUser(userId, {
            status: ['pending'],
        });
    }
    /**
     * Cancel a pending confirmation
     */
    async cancelConfirmation(confirmationId) {
        const pending = this.pendingConfirmations.get(confirmationId);
        if (!pending) {
            return false;
        }
        await this.config.confirmationStore.update(confirmationId, {
            status: 'expired',
        });
        this.pendingConfirmations.delete(confirmationId);
        return true;
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    categorizeTools(tools, _context) {
        const needsConfirmation = [];
        const canExecute = [];
        for (const tool of tools) {
            if (tool.requiresConfirmation && this.config.requireConfirmation) {
                needsConfirmation.push(tool);
            }
            else {
                canExecute.push(tool);
            }
        }
        return { needsConfirmation, canExecute };
    }
    async executeToolsBatch(tools, context) {
        const summaries = [];
        const errors = [];
        const artifacts = [];
        // Execute in batches based on max concurrency
        const batches = this.chunkArray(tools, this.config.maxConcurrentTools);
        for (const batch of batches) {
            const batchResults = await Promise.all(batch.map(tool => this.executeTool(tool, context)));
            for (const result of batchResults) {
                summaries.push(result);
                if (result.status === 'failed' && result.error) {
                    errors.push({
                        code: 'TOOL_EXECUTION_ERROR',
                        message: result.error,
                        toolId: result.toolId,
                        recoverable: true,
                    });
                }
                // Extract artifacts from successful results
                if (result.status === 'success' && result.result?.output) {
                    const extractedArtifacts = this.extractArtifacts(result.toolId, result.result.output);
                    artifacts.push(...extractedArtifacts);
                }
            }
        }
        return { summaries, errors, artifacts };
    }
    async requestToolConfirmation(tool, context) {
        const expiresAt = new Date(Date.now() + this.config.confirmationExpiryMs);
        const request = await this.config.confirmationStore.create({
            userId: context.userId,
            sessionId: context.sessionId,
            toolId: tool.toolId,
            toolName: tool.toolName,
            toolDescription: tool.reasoning,
            plannedInput: tool.input,
            reasoning: tool.reasoning,
            riskLevel: this.assessRiskLevel(tool),
            stepId: context.currentStep?.id ?? null,
            stepTitle: context.currentStep?.title ?? null,
            status: 'pending',
            expiresAt,
            respondedAt: null,
            approvedBy: null,
            rejectionReason: null,
        });
        // Store pending confirmation
        this.pendingConfirmations.set(request.id, {
            request,
            tool,
            context,
            createdAt: new Date(),
        });
        this.logger.info('Confirmation requested', {
            confirmationId: request.id,
            toolId: tool.toolId,
        });
        return {
            toolId: tool.toolId,
            toolName: tool.toolName,
            status: 'pending_confirmation',
            duration: 0,
            confirmationId: request.id,
        };
    }
    async validateToolInput(toolDef, input) {
        try {
            return toolDef.inputSchema.parse(input);
        }
        catch (error) {
            throw new Error(`Invalid tool input: ${error instanceof Error ? error.message : 'validation failed'}`);
        }
    }
    async executeWithTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)),
        ]);
    }
    assessRiskLevel(tool) {
        // Simple risk assessment based on priority and confirmation requirement
        if (!tool.requiresConfirmation)
            return 'safe';
        if (tool.priority >= 8)
            return 'low';
        if (tool.priority >= 5)
            return 'medium';
        if (tool.priority >= 3)
            return 'high';
        return 'critical';
    }
    extractArtifacts(toolId, output) {
        const artifacts = [];
        if (typeof output === 'object' && output !== null) {
            const outputObj = output;
            // Check for artifact-like properties
            if (outputObj.content && outputObj.type) {
                artifacts.push({
                    id: `artifact-${toolId}-${Date.now()}`,
                    type: outputObj.type || 'content',
                    title: outputObj.title || 'Generated Content',
                    content: outputObj.content,
                    metadata: outputObj.metadata,
                });
            }
        }
        return artifacts;
    }
    calculateAdditionalMetrics(results) {
        const successCount = results.filter(r => r.status === 'success').length;
        const successRate = results.length > 0 ? successCount / results.length : 1;
        // Calculate mastery gain based on success rate
        return {
            masteryGain: successRate * 0.1, // Small mastery gain per step
        };
    }
    generateOutputMessage(step, status, results) {
        const successCount = results.filter(r => r.status === 'success').length;
        switch (status) {
            case 'completed':
                return `Step "${step.title}" completed successfully. ${successCount} tools executed.`;
            case 'failed':
                return `Step "${step.title}" failed. Please check the errors and try again.`;
            case 'blocked':
                return `Step "${step.title}" is waiting for confirmation to proceed.`;
            default:
                return `Step "${step.title}" status: ${status}`;
        }
    }
    aggregateToolOutputs(results) {
        const aggregated = {};
        for (const result of results) {
            if (result.status === 'success' && result.result?.output) {
                aggregated[result.toolId] = result.result.output;
            }
        }
        return aggregated;
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    createDefaultLogger() {
        return {
            debug: (_message, _data) => { },
            info: (_message, _data) => { },
            warn: (message, data) => {
                console.warn(`[ActiveStepExecutor] ${message}`, data);
            },
            error: (message, error, data) => {
                console.error(`[ActiveStepExecutor] ${message}`, error, data);
            },
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createActiveStepExecutor(config) {
    return new ActiveStepExecutor(config);
}
//# sourceMappingURL=active-step-executor.js.map
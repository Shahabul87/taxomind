/**
 * @sam-ai/agentic - Confirmation Gate
 * User confirmation handling for high-impact tool usage
 */
// ============================================================================
// CONFIRMATION GATE
// ============================================================================
export class ConfirmationGate {
    config;
    logger;
    constructor(config) {
        this.config = {
            ...config,
            defaultExpiryMs: config.defaultExpiryMs ?? 300000, // 5 minutes
            autoApproveForSafe: config.autoApproveForSafe ?? true,
            maxPendingPerUser: config.maxPendingPerUser ?? 10,
            logger: config.logger ?? this.createDefaultLogger(),
            onConfirmationRequired: config.onConfirmationRequired ?? (() => { }),
        };
        this.logger = this.config.logger;
    }
    /**
     * Check if a tool requires confirmation
     */
    requiresConfirmation(tool) {
        if (this.config.autoApproveForSafe && tool.confirmationType === 'none') {
            return false;
        }
        return tool.confirmationType !== 'none';
    }
    /**
     * Get the confirmation type for a tool
     */
    getConfirmationType(tool) {
        return tool.confirmationType;
    }
    /**
     * Request confirmation for a tool execution
     */
    async requestConfirmation(userId, sessionId, tool, input, options = {}) {
        this.logger.info('Requesting confirmation', {
            userId,
            toolId: tool.id,
            confirmationType: tool.confirmationType,
        });
        // Check if user has too many pending confirmations
        const pending = await this.config.confirmationStore.getByUser(userId, {
            status: ['pending'],
        });
        if (pending.length >= this.config.maxPendingPerUser) {
            // Expire oldest pending
            const oldest = pending.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
            await this.expireConfirmation(oldest.id);
        }
        // Calculate risk level
        const riskLevel = this.assessRiskLevel(tool, input);
        // Calculate expiry
        const expiryMs = options.expiryMs ?? this.config.defaultExpiryMs;
        const expiresAt = new Date(Date.now() + expiryMs);
        // Create confirmation request
        const request = await this.config.confirmationStore.create({
            userId,
            sessionId,
            toolId: tool.id,
            toolName: tool.name,
            toolDescription: tool.description,
            plannedInput: input,
            reasoning: options.reasoning ?? this.generateReasoning(tool, input),
            riskLevel,
            stepId: options.stepId ?? null,
            stepTitle: options.stepTitle ?? null,
            status: 'pending',
            expiresAt,
            respondedAt: null,
            approvedBy: null,
            rejectionReason: null,
        });
        // Notify
        this.config.onConfirmationRequired(request);
        this.logger.debug('Confirmation created', {
            confirmationId: request.id,
            riskLevel,
            expiresAt,
        });
        return request;
    }
    /**
     * Respond to a confirmation request
     */
    async respond(confirmationId, response) {
        this.logger.info('Processing confirmation response', {
            confirmationId,
            approved: response.approved,
        });
        const request = await this.config.confirmationStore.get(confirmationId);
        if (!request) {
            throw new Error(`Confirmation not found: ${confirmationId}`);
        }
        if (request.status !== 'pending') {
            throw new Error(`Confirmation already processed: ${request.status}`);
        }
        // Check expiry
        if (new Date() > request.expiresAt) {
            await this.expireConfirmation(confirmationId);
            throw new Error('Confirmation has expired');
        }
        // Update the request
        const updatedRequest = await this.config.confirmationStore.respond(confirmationId, response);
        this.logger.info('Confirmation processed', {
            confirmationId,
            status: updatedRequest.status,
        });
        return updatedRequest;
    }
    /**
     * Approve a confirmation request
     */
    async approve(confirmationId, _approvedBy, modifiedInput) {
        return this.respond(confirmationId, {
            requestId: confirmationId,
            approved: true,
            modifiedInput,
        });
    }
    /**
     * Reject a confirmation request
     */
    async reject(confirmationId, reason) {
        return this.respond(confirmationId, {
            requestId: confirmationId,
            approved: false,
            rejectionReason: reason,
        });
    }
    /**
     * Get pending confirmations for a user
     */
    async getPendingConfirmations(userId) {
        const pending = await this.config.confirmationStore.getByUser(userId, {
            status: ['pending'],
        });
        // Filter out expired
        const now = new Date();
        const valid = [];
        const expired = [];
        for (const request of pending) {
            if (now > request.expiresAt) {
                expired.push(request.id);
            }
            else {
                valid.push(request);
            }
        }
        // Expire old ones in background
        if (expired.length > 0) {
            Promise.all(expired.map(id => this.expireConfirmation(id))).catch(err => {
                this.logger.error('Failed to expire confirmations', err);
            });
        }
        return valid;
    }
    /**
     * Expire a confirmation request
     */
    async expireConfirmation(confirmationId) {
        await this.config.confirmationStore.update(confirmationId, {
            status: 'expired',
        });
        this.logger.debug('Confirmation expired', { confirmationId });
    }
    /**
     * Expire all old confirmations
     */
    async expireOldConfirmations(maxAgeMinutes) {
        const minutes = maxAgeMinutes ?? Math.round(this.config.defaultExpiryMs / 60000);
        return this.config.confirmationStore.expireOld(minutes);
    }
    /**
     * Check if a confirmation is still valid
     */
    async isValid(confirmationId) {
        const request = await this.config.confirmationStore.get(confirmationId);
        if (!request) {
            return false;
        }
        if (request.status !== 'pending') {
            return false;
        }
        if (new Date() > request.expiresAt) {
            await this.expireConfirmation(confirmationId);
            return false;
        }
        return true;
    }
    /**
     * Get confirmation request by ID
     */
    async getConfirmation(confirmationId) {
        return this.config.confirmationStore.get(confirmationId);
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    assessRiskLevel(tool, _input) {
        // Map confirmation type to risk level
        const riskMap = {
            none: 'safe',
            implicit: 'low',
            explicit: 'medium',
            critical: 'critical',
        };
        return riskMap[tool.confirmationType] ?? 'medium';
    }
    generateReasoning(tool, _input) {
        switch (tool.confirmationType) {
            case 'critical':
                return `This action (${tool.name}) requires explicit confirmation as it may have significant impact.`;
            case 'explicit':
                return `Please confirm you want to proceed with ${tool.name}.`;
            case 'implicit':
                return `Proceeding with ${tool.name}. Cancel if this is not intended.`;
            default:
                return `Tool ${tool.name} execution planned.`;
        }
    }
    createDefaultLogger() {
        return {
            debug: (_message, _data) => { },
            info: (_message, _data) => { },
            warn: (message, data) => {
                console.warn(`[ConfirmationGate] ${message}`, data);
            },
            error: (message, error, data) => {
                console.error(`[ConfirmationGate] ${message}`, error, data);
            },
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createConfirmationGate(config) {
    return new ConfirmationGate(config);
}
//# sourceMappingURL=confirmation-gate.js.map
/**
 * @sam-ai/agentic - Confirmation Manager
 * Handles user confirmations for tool execution with different severity levels
 */
import { ConfirmationType as ConfirmationTypeEnum } from './types';
// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================
const DEFAULT_TEMPLATES = {
    implicit: {
        title: 'Proceeding with action',
        messageTemplate: 'SAM AI will {{action}} using the {{toolName}} tool.',
        defaultSeverity: 'low',
    },
    explicit: {
        title: 'Confirmation required',
        messageTemplate: 'SAM AI wants to {{action}}. Do you want to proceed?',
        defaultSeverity: 'medium',
    },
    critical: {
        title: 'Critical action - Confirmation required',
        messageTemplate: 'SAM AI is requesting to {{action}}. This action may have significant effects.',
        defaultSeverity: 'critical',
    },
};
// ============================================================================
// CONFIRMATION MANAGER
// ============================================================================
/**
 * ConfirmationManager handles user confirmations for tool execution
 * with different severity levels and timeout handling.
 */
export class ConfirmationManager {
    store;
    logger;
    defaultTimeoutSeconds;
    onConfirmationRequested;
    onConfirmationResolved;
    pendingWaits;
    constructor(config) {
        this.store = config.confirmationStore;
        this.logger = config.logger ?? console;
        this.defaultTimeoutSeconds = config.defaultTimeoutSeconds ?? 300; // 5 minutes default
        this.onConfirmationRequested = config.onConfirmationRequested;
        this.onConfirmationResolved = config.onConfirmationResolved;
        this.pendingWaits = new Map();
    }
    // ==========================================================================
    // CONFIRMATION CHECKING
    // ==========================================================================
    /**
     * Check if a tool requires confirmation
     */
    requiresConfirmation(tool) {
        return tool.confirmationType !== ConfirmationTypeEnum.NONE;
    }
    /**
     * Check if a confirmation type requires explicit user action
     */
    requiresExplicitConfirmation(type) {
        return type === ConfirmationTypeEnum.EXPLICIT || type === ConfirmationTypeEnum.CRITICAL;
    }
    /**
     * Get the severity level for a confirmation type
     */
    getSeverityForType(type) {
        switch (type) {
            case ConfirmationTypeEnum.IMPLICIT:
                return 'low';
            case ConfirmationTypeEnum.EXPLICIT:
                return 'medium';
            case ConfirmationTypeEnum.CRITICAL:
                return 'critical';
            default:
                return 'low';
        }
    }
    // ==========================================================================
    // CONFIRMATION REQUEST MANAGEMENT
    // ==========================================================================
    /**
     * Create a confirmation request for a tool invocation
     */
    async createConfirmationRequest(invocation, tool, options) {
        const template = tool.confirmationType !== ConfirmationTypeEnum.NONE
            ? DEFAULT_TEMPLATES[tool.confirmationType]
            : DEFAULT_TEMPLATES.explicit;
        const title = options?.title ?? template.title;
        const message = options?.message ?? this.formatMessage(template.messageTemplate, tool, invocation);
        const severity = options?.severity ?? template.defaultSeverity;
        const timeoutSeconds = options?.timeoutSeconds ?? this.defaultTimeoutSeconds;
        const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);
        const request = await this.store.create({
            invocationId: invocation.id,
            toolId: tool.id,
            toolName: tool.name,
            userId: invocation.userId,
            title,
            message,
            details: options?.details ?? this.generateDefaultDetails(tool, invocation),
            type: tool.confirmationType,
            severity,
            confirmText: options?.confirmText ?? 'Confirm',
            cancelText: options?.cancelText ?? 'Cancel',
            timeout: timeoutSeconds,
            status: 'pending',
            expiresAt,
        });
        this.logger.info(`Confirmation request created: ${request.id}`, {
            invocationId: invocation.id,
            toolId: tool.id,
            type: tool.confirmationType,
        });
        // Notify listeners
        if (this.onConfirmationRequested) {
            try {
                await this.onConfirmationRequested(request);
            }
            catch (error) {
                this.logger.error('Error in onConfirmationRequested callback', { error });
            }
        }
        return request;
    }
    /**
     * Get a confirmation request by ID
     */
    async getRequest(requestId) {
        return this.store.get(requestId);
    }
    /**
     * Get confirmation request for an invocation
     */
    async getRequestByInvocation(invocationId) {
        return this.store.getByInvocation(invocationId);
    }
    /**
     * Get pending confirmation requests for a user
     */
    async getPendingRequests(userId) {
        return this.store.getPending(userId);
    }
    // ==========================================================================
    // CONFIRMATION RESPONSE HANDLING
    // ==========================================================================
    /**
     * Respond to a confirmation request
     */
    async respond(requestId, confirmed) {
        const request = await this.store.respond(requestId, confirmed);
        this.logger.info(`Confirmation ${confirmed ? 'granted' : 'denied'}: ${requestId}`, {
            invocationId: request.invocationId,
            toolId: request.toolId,
        });
        // Notify listeners
        if (this.onConfirmationResolved) {
            try {
                await this.onConfirmationResolved(request, confirmed);
            }
            catch (error) {
                this.logger.error('Error in onConfirmationResolved callback', { error });
            }
        }
        // Resolve any pending waits
        const pendingWait = this.pendingWaits.get(requestId);
        if (pendingWait) {
            if (pendingWait.timeoutId) {
                clearTimeout(pendingWait.timeoutId);
            }
            pendingWait.resolve({
                confirmed,
                request,
                timedOut: false,
            });
            this.pendingWaits.delete(requestId);
        }
        return request;
    }
    /**
     * Confirm a request (shorthand for respond(id, true))
     */
    async confirm(requestId) {
        return this.respond(requestId, true);
    }
    /**
     * Deny a request (shorthand for respond(id, false))
     */
    async deny(requestId) {
        return this.respond(requestId, false);
    }
    /**
     * Auto-confirm an implicit confirmation
     */
    async autoConfirmImplicit(invocation, tool) {
        if (tool.confirmationType !== ConfirmationTypeEnum.IMPLICIT) {
            return null;
        }
        // Create and immediately confirm implicit confirmations
        const request = await this.createConfirmationRequest(invocation, tool);
        return this.confirm(request.id);
    }
    // ==========================================================================
    // WAITING FOR CONFIRMATION
    // ==========================================================================
    /**
     * Wait for a confirmation response with timeout
     */
    async waitForConfirmation(requestId, timeoutMs) {
        const request = await this.store.get(requestId);
        if (!request) {
            throw new Error(`Confirmation request not found: ${requestId}`);
        }
        // Already resolved
        if (request.status !== 'pending') {
            return {
                confirmed: request.status === 'confirmed',
                request,
                timedOut: request.status === 'expired',
            };
        }
        // Calculate timeout
        const effectiveTimeout = timeoutMs ??
            (request.timeout ? request.timeout * 1000 : this.defaultTimeoutSeconds * 1000);
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                const pendingWait = this.pendingWaits.get(requestId);
                if (pendingWait) {
                    this.pendingWaits.delete(requestId);
                    // Mark as expired in store
                    this.store.respond(requestId, false).catch((error) => {
                        this.logger.error('Error expiring confirmation', { error, requestId });
                    });
                    resolve({
                        confirmed: false,
                        request: { ...request, status: 'expired' },
                        timedOut: true,
                    });
                }
            }, effectiveTimeout);
            this.pendingWaits.set(requestId, { resolve, timeoutId });
        });
    }
    /**
     * Wait for confirmation on an invocation
     */
    async waitForInvocationConfirmation(invocationId, timeoutMs) {
        const request = await this.store.getByInvocation(invocationId);
        if (!request) {
            return null;
        }
        return this.waitForConfirmation(request.id, timeoutMs);
    }
    // ==========================================================================
    // BATCH OPERATIONS
    // ==========================================================================
    /**
     * Confirm all pending requests for a user
     */
    async confirmAllPending(userId) {
        const pending = await this.store.getPending(userId);
        const results = [];
        for (const request of pending) {
            const confirmed = await this.confirm(request.id);
            results.push(confirmed);
        }
        return results;
    }
    /**
     * Deny all pending requests for a user
     */
    async denyAllPending(userId) {
        const pending = await this.store.getPending(userId);
        const results = [];
        for (const request of pending) {
            const denied = await this.deny(request.id);
            results.push(denied);
        }
        return results;
    }
    /**
     * Cancel pending waits for a user (without resolving them)
     */
    cancelPendingWaits(userId) {
        for (const [requestId, wait] of this.pendingWaits.entries()) {
            if (wait.timeoutId) {
                clearTimeout(wait.timeoutId);
            }
            // If userId is provided, we'd need to check - but for simplicity, cancel all
            if (!userId) {
                this.pendingWaits.delete(requestId);
            }
        }
    }
    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================
    /**
     * Format a message template with tool and invocation data
     */
    formatMessage(template, tool, invocation) {
        return template
            .replace('{{action}}', this.generateActionDescription(tool, invocation))
            .replace('{{toolName}}', tool.name)
            .replace('{{toolId}}', tool.id);
    }
    /**
     * Generate an action description from tool and input
     */
    generateActionDescription(tool, _invocation) {
        // Generate a human-readable action description
        return tool.description.toLowerCase();
    }
    /**
     * Generate default details for a confirmation request
     */
    generateDefaultDetails(tool, invocation) {
        const details = [
            {
                label: 'Tool',
                value: tool.name,
                type: 'text',
            },
            {
                label: 'Category',
                value: tool.category,
                type: 'text',
            },
        ];
        // Add input preview if available
        if (invocation.input && typeof invocation.input === 'object') {
            const inputStr = JSON.stringify(invocation.input, null, 2);
            if (inputStr.length <= 1000) {
                details.push({
                    label: 'Input',
                    value: inputStr,
                    type: 'json',
                });
            }
        }
        // Add warning for critical actions
        if (tool.confirmationType === ConfirmationTypeEnum.CRITICAL) {
            details.push({
                label: 'Warning',
                value: 'This action may have significant or irreversible effects.',
                type: 'warning',
            });
        }
        return details;
    }
    /**
     * Check if a request has expired
     */
    isExpired(request) {
        if (request.status === 'expired') {
            return true;
        }
        if (request.expiresAt && request.expiresAt < new Date()) {
            return true;
        }
        return false;
    }
    /**
     * Get remaining time for a confirmation request (in seconds)
     */
    getRemainingTime(request) {
        if (!request.expiresAt || request.status !== 'pending') {
            return 0;
        }
        const remaining = request.expiresAt.getTime() - Date.now();
        return Math.max(0, Math.floor(remaining / 1000));
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new ConfirmationManager instance
 */
export function createConfirmationManager(config) {
    return new ConfirmationManager(config);
}
//# sourceMappingURL=confirmation-manager.js.map
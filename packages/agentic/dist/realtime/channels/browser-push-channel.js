/**
 * @sam-ai/agentic - Browser Push Delivery Channel
 * Delivers notifications via Web Push API for browser notifications
 */
// ============================================================================
// NOTIFICATION PAYLOAD BUILDERS
// ============================================================================
function buildNotificationPayload(event) {
    const eventType = event.type;
    const payload = event.payload;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    switch (eventType) {
        case 'intervention':
            return {
                title: '🎓 SAM AI',
                body: payload.message || 'You have an important learning update',
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `intervention-${event.eventId}`,
                requireInteraction: true,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                },
                actions: [
                    { action: 'open', title: 'Open SAM' },
                    { action: 'dismiss', title: 'Later' },
                ],
            };
        case 'checkin':
            return {
                title: '👋 SAM Check-In',
                body: payload.message || 'How is your learning going?',
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `checkin-${event.eventId}`,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                },
                actions: [
                    { action: 'respond', title: 'Respond' },
                    { action: 'snooze', title: 'Snooze' },
                ],
            };
        case 'nudge': {
            const nudgePayload = payload;
            return {
                title: getNudgeIcon(nudgePayload.type || 'reminder') + ' ' + getNudgeTitle(nudgePayload.type || 'reminder'),
                body: nudgePayload.message || 'SAM has a suggestion for you',
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `nudge-${nudgePayload.type || 'reminder'}-${event.eventId}`,
                renotify: nudgePayload.type === 'streak_alert',
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                    nudgeType: nudgePayload.type,
                },
            };
        }
        case 'goal_progress': {
            const goalPayload = payload;
            return {
                title: '📈 Goal Progress',
                body: `${goalPayload.progress || 0}% complete: ${goalPayload.goalTitle || 'Your Goal'}`,
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `goal-progress-${event.eventId}`,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                },
            };
        }
        case 'step_completed': {
            const stepPayload = payload;
            return {
                title: '✅ Step Completed!',
                body: stepPayload.nextStepTitle
                    ? `Up next: ${stepPayload.nextStepTitle}`
                    : `Great job completing: ${stepPayload.stepTitle || 'this step'}`,
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `step-completed-${event.eventId}`,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                },
            };
        }
        case 'celebration': {
            const celebrationPayload = payload;
            return {
                title: '🎉 ' + (celebrationPayload.title || 'Congratulations!'),
                body: celebrationPayload.message || 'You achieved something great!',
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `celebration-${celebrationPayload.type || 'achievement'}-${event.eventId}`,
                vibrate: [200, 100, 200],
                requireInteraction: true,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                    celebrationType: celebrationPayload.type,
                },
                actions: [
                    { action: 'celebrate', title: '🎉 Celebrate!' },
                    { action: 'share', title: 'Share' },
                ],
            };
        }
        case 'recommendation': {
            const recPayload = payload;
            return {
                title: '💡 Recommended for You',
                body: recPayload.title || recPayload.description || 'Check out this learning recommendation',
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `recommendation-${event.eventId}`,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                },
            };
        }
        default:
            return {
                title: '🔔 SAM AI',
                body: 'You have a new notification',
                icon: '/icons/sam-icon-192.png',
                badge: '/icons/sam-badge-72.png',
                tag: `notification-${event.eventId}`,
                data: {
                    url: `${appUrl}/dashboard`,
                    eventId: event.eventId,
                    type: eventType,
                },
            };
    }
}
function getNudgeIcon(type) {
    const icons = {
        reminder: '⏰',
        encouragement: '💪',
        tip: '💡',
        streak_alert: '🔥',
        break_suggestion: '☕',
        study_prompt: '📚',
        achievement: '🏆',
    };
    return icons[type] || '💡';
}
function getNudgeTitle(type) {
    const titles = {
        reminder: 'Reminder',
        encouragement: 'Keep Going!',
        tip: 'Learning Tip',
        streak_alert: 'Streak Alert!',
        break_suggestion: 'Break Time',
        study_prompt: 'Time to Learn',
        achievement: 'Achievement',
    };
    return titles[type] || 'SAM Notification';
}
function getUrgency(event) {
    const eventType = event.type;
    switch (eventType) {
        case 'intervention':
        case 'celebration':
            return 'high';
        case 'checkin':
        case 'step_completed':
            return 'normal';
        case 'nudge':
        case 'recommendation':
            return 'low';
        case 'goal_progress':
            return 'very-low';
        default:
            return 'normal';
    }
}
// ============================================================================
// BROWSER PUSH CHANNEL IMPLEMENTATION
// ============================================================================
export class BrowserPushChannel {
    channel = 'push_notification';
    config;
    logger;
    constructor(config) {
        this.config = config;
        this.logger = config.logger ?? console;
    }
    async canDeliver(userId) {
        // Check if push channel is enabled
        if (this.config.enabled === false) {
            return false;
        }
        // Check if user has a valid subscription
        const subscription = await this.config.getUserSubscription(userId);
        if (!subscription) {
            return false;
        }
        // Check if subscription is expired
        if (subscription.expirationTime && subscription.expirationTime < Date.now()) {
            this.logger.debug('Push subscription expired', { userId });
            return false;
        }
        return true;
    }
    async deliver(userId, event) {
        const subscription = await this.config.getUserSubscription(userId);
        if (!subscription) {
            return false;
        }
        const notification = buildNotificationPayload(event);
        const payload = JSON.stringify(notification);
        const urgency = getUrgency(event);
        try {
            const result = await this.config.pushService.sendNotification(subscription, payload, {
                vapidDetails: {
                    subject: this.config.vapidSubject,
                    publicKey: this.config.vapidPublicKey,
                    privateKey: this.config.vapidPrivateKey,
                },
                ttl: this.config.ttl ?? 86400,
                urgency,
                topic: notification.tag,
            });
            if (result.statusCode >= 200 && result.statusCode < 300) {
                this.logger.info('Push notification sent', {
                    userId,
                    eventType: event.type,
                    eventId: event.eventId,
                    statusCode: result.statusCode,
                });
                return true;
            }
            // Handle specific error codes
            if (result.statusCode === 404 || result.statusCode === 410) {
                // Subscription no longer valid
                this.logger.warn('Push subscription no longer valid', {
                    userId,
                    statusCode: result.statusCode,
                });
                // Could trigger subscription cleanup here
            }
            this.logger.error('Push notification failed', {
                userId,
                eventType: event.type,
                statusCode: result.statusCode,
                body: result.body,
            });
            return false;
        }
        catch (error) {
            this.logger.error('Failed to send push notification', {
                userId,
                eventType: event.type,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createBrowserPushChannel(config) {
    return new BrowserPushChannel(config);
}
//# sourceMappingURL=browser-push-channel.js.map
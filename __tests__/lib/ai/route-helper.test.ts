/**
 * Tests for AI route helper
 * Source: lib/ai/route-helper.ts
 */

jest.mock('@/lib/ai/enterprise-client', () => {
  class AIAccessDeniedError extends Error {
    public readonly enforcement: Record<string, unknown>;
    constructor(result: Record<string, unknown>) {
      super((result.reason as string) ?? 'AI access denied');
      this.name = 'AIAccessDeniedError';
      this.enforcement = result;
    }
  }

  class AIMaintenanceModeError extends Error {
    public readonly maintenanceMessage: string | null;
    constructor(message: string | null) {
      super(message ?? 'AI service is currently in maintenance mode. Please try again later.');
      this.name = 'AIMaintenanceModeError';
      this.maintenanceMessage = message;
    }
  }

  return {
    AIAccessDeniedError,
    AIMaintenanceModeError,
  };
});

import { handleAIAccessError } from '@/lib/ai/route-helper';
import { AIAccessDeniedError, AIMaintenanceModeError } from '@/lib/ai/enterprise-client';

describe('handleAIAccessError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 429 for AIAccessDeniedError (rate limit)', async () => {
    const enforcement = {
      reason: 'Rate limit exceeded',
      upgradeRequired: true,
      suggestedTier: 'pro',
      remainingDaily: 0,
      remainingMonthly: 5,
      maintenanceMode: false,
    };
    const error = new AIAccessDeniedError(enforcement);

    const response = handleAIAccessError(error);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);

    const body = await response!.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AI_ACCESS_DENIED');
    expect(body.error.message).toBe('Rate limit exceeded');
    expect(body.upgradeRequired).toBe(true);
    expect(body.suggestedTier).toBe('pro');
    expect(body.remainingDaily).toBe(0);
    expect(body.remainingMonthly).toBe(5);
  });

  it('should return 503 for AIAccessDeniedError in maintenance mode', async () => {
    const enforcement = {
      reason: 'System maintenance',
      upgradeRequired: false,
      maintenanceMode: true,
    };
    const error = new AIAccessDeniedError(enforcement);

    const response = handleAIAccessError(error);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(503);
  });

  it('should return 503 for AIMaintenanceModeError', async () => {
    const error = new AIMaintenanceModeError('AI is down for maintenance');

    const response = handleAIAccessError(error);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(503);

    const body = await response!.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AI_MAINTENANCE_MODE');
    expect(body.error.message).toBe('AI is down for maintenance');
    expect(body.maintenanceMode).toBe(true);
  });

  it('should return 503 with default message for AIMaintenanceModeError with null', async () => {
    const error = new AIMaintenanceModeError(null);

    const response = handleAIAccessError(error);

    expect(response).not.toBeNull();
    const body = await response!.json();
    expect(body.error.message).toBe(
      'AI service is currently in maintenance mode. Please try again later.'
    );
  });

  it('should return null for non-AI errors', () => {
    const error = new Error('Some other error');

    const response = handleAIAccessError(error);

    expect(response).toBeNull();
  });

  it('should return null for string errors', () => {
    const response = handleAIAccessError('string error');

    expect(response).toBeNull();
  });

  it('should return null for null/undefined', () => {
    expect(handleAIAccessError(null)).toBeNull();
    expect(handleAIAccessError(undefined)).toBeNull();
  });

  it('should include enforcement details in response for denied error', async () => {
    const enforcement = {
      reason: 'Free tier limit reached',
      upgradeRequired: true,
      suggestedTier: 'enterprise',
      remainingDaily: 0,
      remainingMonthly: 0,
      maintenanceMode: false,
    };
    const error = new AIAccessDeniedError(enforcement);

    const response = handleAIAccessError(error);
    const body = await response!.json();

    expect(body.upgradeRequired).toBe(true);
    expect(body.suggestedTier).toBe('enterprise');
    expect(body.remainingDaily).toBe(0);
    expect(body.remainingMonthly).toBe(0);
  });
});

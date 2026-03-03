/**
 * Tests for Admin AI Settings Route - app/api/admin/ai-settings/route.ts
 *
 * Covers: GET (fetch settings + provider status), PUT (update settings with validation)
 */

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/sam/providers/ai-registry', () => ({
  AI_PROVIDERS: {
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude models',
      models: ['claude-3-opus'],
      defaultModel: 'claude-3-opus',
      capabilities: ['chat'],
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'DeepSeek models',
      models: ['deepseek-chat'],
      defaultModel: 'deepseek-chat',
      capabilities: ['chat'],
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT models',
      models: ['gpt-4'],
      defaultModel: 'gpt-4',
      capabilities: ['chat'],
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      description: 'Gemini models',
      models: ['gemini-pro'],
      defaultModel: 'gemini-pro',
      capabilities: ['chat'],
    },
    mistral: {
      id: 'mistral',
      name: 'Mistral',
      description: 'Mistral models',
      models: ['mistral-large'],
      defaultModel: 'mistral-large',
      capabilities: ['chat'],
    },
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  invalidateAllAICaches: jest.fn(),
  refreshPlatformSettingsCache: jest.fn(),
}));

jest.mock('@/lib/ai/platform-settings-cache', () => ({
  PLATFORM_AI_DEFAULTS: {
    defaultProvider: 'deepseek',
    fallbackProvider: 'anthropic',
    anthropicEnabled: true,
    deepseekEnabled: true,
    openaiEnabled: false,
    geminiEnabled: false,
    mistralEnabled: false,
    freeMonthlyLimit: 50,
    starterMonthlyLimit: 200,
    proMonthlyLimit: 1000,
    enterpriseMonthlyLimit: 5000,
    freeDailyChatLimit: 10,
    starterDailyChatLimit: 50,
    proDailyChatLimit: 200,
    enterpriseDailyChatLimit: 1000,
    allowUserProviderSelection: false,
    allowUserModelSelection: false,
    maintenanceMode: false,
    maintenanceMessage: null,
    defaultAnthropicModel: 'claude-3-opus',
    defaultDeepseekModel: 'deepseek-chat',
    defaultOpenaiModel: 'gpt-4',
    defaultGeminiModel: 'gemini-pro',
    defaultMistralModel: 'mistral-large',
  },
}));

// @/lib/db, @/lib/logger are globally mocked

import { GET, PUT } from '@/app/api/admin/ai-settings/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { invalidateAllAICaches, refreshPlatformSettingsCache } from '@/lib/sam/ai-provider';

const mockAdminAuth = adminAuth as jest.Mock;

function createPutRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/admin/ai-settings', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// =========================================================================
// GET /api/admin/ai-settings
// =========================================================================
describe('GET /api/admin/ai-settings', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (db.platformAISettings.findUnique as jest.Mock).mockResolvedValue({
      id: 'default',
      defaultProvider: 'deepseek',
      anthropicEnabled: true,
      deepseekEnabled: true,
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for non-admin users', async () => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('returns settings and providers for admin', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.settings).toBeDefined();
    expect(body.providers).toBeDefined();
    expect(body.providerStatus).toBeDefined();
    expect(body.tableExists).toBe(true);
  });

  it('creates default settings when none exist', async () => {
    (db.platformAISettings.findUnique as jest.Mock).mockResolvedValue(null);
    (db.platformAISettings.create as jest.Mock).mockResolvedValue({
      id: 'default',
      defaultProvider: 'deepseek',
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(db.platformAISettings.create).toHaveBeenCalled();
  });

  it('falls back to defaults when table does not exist', async () => {
    (db.platformAISettings.findUnique as jest.Mock).mockRejectedValue(
      new Error('relation "PlatformAISettings" does not exist in the current database')
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tableExists).toBe(false);
    expect(body.message).toContain('Database table not found');
  });

  it('returns provider configuration status from env', async () => {
    const res = await GET();
    const body = await res.json();

    // ANTHROPIC_API_KEY and OPENAI_API_KEY are set in jest.setup.js env
    expect(body.providerStatus.anthropic.configured).toBe(true);
    expect(body.providerStatus.openai.configured).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    mockAdminAuth.mockRejectedValue(new Error('Auth service down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
  });
});

// =========================================================================
// PUT /api/admin/ai-settings
// =========================================================================
describe('PUT /api/admin/ai-settings', () => {
  beforeEach(() => {
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (db.platformAISettings.upsert as jest.Mock).mockResolvedValue({
      id: 'default',
      defaultProvider: 'anthropic',
      lastUpdatedBy: 'admin-1',
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAdminAuth.mockResolvedValue(null);

    const res = await PUT(createPutRequest({ defaultProvider: 'anthropic' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('updates settings successfully', async () => {
    const res = await PUT(
      createPutRequest({ defaultProvider: 'anthropic', maintenanceMode: false })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.platformAISettings.upsert).toHaveBeenCalled();
  });

  it('invalidates caches after update', async () => {
    await PUT(createPutRequest({ defaultProvider: 'anthropic' }));

    expect(invalidateAllAICaches).toHaveBeenCalled();
    expect(refreshPlatformSettingsCache).toHaveBeenCalled();
  });

  it('returns 400 for invalid provider', async () => {
    const res = await PUT(createPutRequest({ defaultProvider: 'invalid-provider' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid monthly limit (negative)', async () => {
    const res = await PUT(createPutRequest({ freeMonthlyLimit: -5 }));
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid alert threshold (>1)', async () => {
    const res = await PUT(createPutRequest({ alertThreshold: 1.5 }));
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  it('returns 503 when table does not exist', async () => {
    (db.platformAISettings.upsert as jest.Mock).mockRejectedValue(
      new Error('relation "PlatformAISettings" does not exist in the current database')
    );

    const res = await PUT(createPutRequest({ defaultProvider: 'anthropic' }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.code).toBe('TABLE_NOT_FOUND');
  });

  it('returns 500 on unexpected database error', async () => {
    (db.platformAISettings.upsert as jest.Mock).mockRejectedValue(
      new Error('Connection refused')
    );

    const res = await PUT(createPutRequest({ defaultProvider: 'anthropic' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
  });
});

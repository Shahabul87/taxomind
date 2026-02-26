/**
 * Tests for Settings AI Preferences Route - app/api/settings/ai-preferences/route.ts
 */

jest.mock('@/lib/sam/providers/ai-registry', () => {
  const AI_PROVIDERS = {
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      models: ['claude-sonnet-4-5-20250929'],
      defaultModel: 'claude-sonnet-4-5-20250929',
      isImplemented: true,
      envKeyName: 'ANTHROPIC_API_KEY',
      isConfigured: jest.fn(() => true),
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      models: ['deepseek-chat'],
      defaultModel: 'deepseek-chat',
      isImplemented: true,
      envKeyName: 'DEEPSEEK_API_KEY',
      isConfigured: jest.fn(() => true),
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4o'],
      defaultModel: 'gpt-4o',
      isImplemented: true,
      envKeyName: 'OPENAI_API_KEY',
      isConfigured: jest.fn(() => true),
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      models: ['gemini-pro'],
      defaultModel: 'gemini-pro',
      isImplemented: true,
      envKeyName: 'GEMINI_API_KEY',
      isConfigured: jest.fn(() => true),
    },
    mistral: {
      id: 'mistral',
      name: 'Mistral',
      models: ['mistral-large'],
      defaultModel: 'mistral-large',
      isImplemented: true,
      envKeyName: 'MISTRAL_API_KEY',
      isConfigured: jest.fn(() => true),
    },
  };

  return {
    AI_PROVIDERS,
    isProviderAvailable: jest.fn(() => true),
  };
});

jest.mock('@/lib/sam/ai-provider', () => ({
  invalidateUserPreferenceCache: jest.fn(),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => Promise.resolve(null)),
}));

import { GET, PUT } from '@/app/api/settings/ai-preferences/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { invalidateUserPreferenceCache } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const mockCurrentUser = currentUser as jest.Mock;
const mockInvalidate = invalidateUserPreferenceCache as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;

if (!(db as Record<string, unknown>).userAIPreferences) {
  (db as Record<string, unknown>).userAIPreferences = {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).platformAISettings) {
  (db as Record<string, unknown>).platformAISettings = {
    findFirst: jest.fn(),
  };
}

const mockPrefs = (db as Record<string, any>).userAIPreferences;
const mockPlatform = (db as Record<string, any>).platformAISettings;

function getReq() {
  return new NextRequest('http://localhost:3000/api/settings/ai-preferences', { method: 'GET' });
}

function putReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/settings/ai-preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Settings ai-preferences route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockPlatform.findFirst.mockResolvedValue({
      defaultAnthropicModel: 'claude-sonnet-4-5-20250929',
      defaultDeepseekModel: 'deepseek-chat',
      defaultOpenaiModel: 'gpt-4o',
      defaultGeminiModel: 'gemini-pro',
      defaultMistralModel: 'mistral-large',
    });

    mockPrefs.findUnique.mockResolvedValue(null);
    mockPrefs.update.mockResolvedValue({
      preferredGlobalProvider: null,
      preferredChatProvider: 'openai',
      preferredCourseProvider: null,
      preferredAnalysisProvider: null,
      preferredCodeProvider: null,
      preferredSkillRoadmapProvider: null,
      anthropicModel: 'claude-sonnet-4-5-20250929',
      deepseekModel: 'deepseek-chat',
      openaiModel: 'gpt-4o',
      geminiModel: 'gemini-pro',
      mistralModel: 'mistral-large',
      chatModel: null,
      courseModel: null,
      analysisModel: null,
      codeModel: null,
      skillRoadmapModel: null,
    });
    mockPrefs.create.mockResolvedValue({
      preferredGlobalProvider: null,
      preferredChatProvider: 'openai',
      preferredCourseProvider: null,
      preferredAnalysisProvider: null,
      preferredCodeProvider: null,
      preferredSkillRoadmapProvider: null,
      anthropicModel: 'claude-sonnet-4-5-20250929',
      deepseekModel: 'deepseek-chat',
      openaiModel: 'gpt-4o',
      geminiModel: 'gemini-pro',
      mistralModel: 'mistral-large',
      chatModel: null,
      courseModel: null,
      analysisModel: null,
      codeModel: null,
      skillRoadmapModel: null,
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns defaults when preferences do not exist', async () => {
    mockPrefs.findUnique.mockResolvedValue(null);

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.preferredChatProvider).toBeNull();
    expect(body.openaiModel).toBe('gpt-4o');
  });

  it('PUT returns 400 for invalid provider value', async () => {
    const res = await PUT(putReq({ preferredChatProvider: 'invalid-provider' }));
    expect(res.status).toBe(400);
  });

  it('PUT updates existing preferences', async () => {
    mockPrefs.findUnique.mockResolvedValue({ userId: 'user-1' });

    const res = await PUT(putReq({
      preferredChatProvider: 'openai',
      openaiModel: 'gpt-4o',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrefs.update).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalledWith('user-1');
  });

  it('PUT creates new preferences when none exist', async () => {
    mockPrefs.findUnique.mockResolvedValue(null);

    const res = await PUT(putReq({
      preferredChatProvider: 'openai',
      openaiModel: 'gpt-4o',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrefs.create).toHaveBeenCalled();
  });
});

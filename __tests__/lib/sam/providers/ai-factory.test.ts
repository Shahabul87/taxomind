jest.mock('@/lib/sam/providers/ai-registry', () => ({
  AI_PROVIDERS: {},
  getProvider: jest.fn(),
  isProviderAvailable: jest.fn(),
}));

import {
  createAIAdapter,
  getModelForProvider,
  getUserModelPreferences,
} from '@/lib/sam/providers/ai-factory';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getProvider } from '@/lib/sam/providers/ai-registry';

const mockGetProvider = getProvider as jest.Mock;

describe('lib/sam/providers/ai-factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';
    process.env.DEEPSEEK_API_KEY = 'deepseek-key';
    process.env.OPENAI_API_KEY = 'openai-key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reads user model preferences from DB', async () => {
    (db.userAIPreferences.findUnique as jest.Mock).mockResolvedValue({
      anthropicModel: 'claude-sonnet',
      deepseekModel: 'deepseek-chat',
      openaiModel: 'gpt-4o',
      geminiModel: null,
      mistralModel: null,
    });

    const prefs = await getUserModelPreferences('user-1');

    expect(prefs?.anthropicModel).toBe('claude-sonnet');
    expect(db.userAIPreferences.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
  });

  it('returns null and logs warning when preferences query fails', async () => {
    (db.userAIPreferences.findUnique as jest.Mock).mockRejectedValue(new Error('db error'));

    const prefs = await getUserModelPreferences('user-1');

    expect(prefs).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('maps model from user preferences for each provider', () => {
    const prefs = {
      anthropicModel: 'claude',
      deepseekModel: 'deepseek',
      openaiModel: 'gpt',
      geminiModel: 'gemini',
      mistralModel: 'mistral',
    };

    expect(getModelForProvider('anthropic', prefs)).toBe('claude');
    expect(getModelForProvider('deepseek', prefs)).toBe('deepseek');
    expect(getModelForProvider('openai', prefs)).toBe('gpt');
    expect(getModelForProvider('gemini', prefs)).toBe('gemini');
    expect(getModelForProvider('mistral', prefs)).toBe('mistral');
    expect(getModelForProvider('openai', null)).toBeUndefined();
  });

  it('throws INVALID_PROVIDER when provider is unknown', () => {
    mockGetProvider.mockReturnValue(undefined);

    expect(() => createAIAdapter('unknown' as any)).toThrow('Invalid provider');
    expect(() => createAIAdapter('unknown' as any)).toThrow(expect.objectContaining({ code: 'INVALID_PROVIDER' }));
  });

  it('throws NOT_CONFIGURED when provider is not configured', () => {
    mockGetProvider.mockReturnValue({
      name: 'Anthropic Claude',
      envKeyName: 'ANTHROPIC_API_KEY',
      defaultModel: 'claude',
      isConfigured: () => false,
    });

    expect(() => createAIAdapter('anthropic')).toThrow(expect.objectContaining({ code: 'NOT_CONFIGURED' }));
  });

  it('creates anthropic adapter with defaults', () => {
    mockGetProvider.mockReturnValue({
      name: 'Anthropic Claude',
      envKeyName: 'ANTHROPIC_API_KEY',
      defaultModel: 'claude-default',
      isConfigured: () => true,
    });

    const adapter = createAIAdapter('anthropic');

    expect(adapter).toMatchObject({
      name: 'anthropic',
      apiKey: 'anthropic-key',
      model: 'claude-default',
      timeout: 60000,
      maxRetries: 2,
    });
  });

  it('creates deepseek/openai adapters with overrides', () => {
    mockGetProvider
      .mockReturnValueOnce({
        name: 'DeepSeek',
        envKeyName: 'DEEPSEEK_API_KEY',
        defaultModel: 'deepseek-default',
        isConfigured: () => true,
      })
      .mockReturnValueOnce({
        name: 'OpenAI GPT',
        envKeyName: 'OPENAI_API_KEY',
        defaultModel: 'gpt-default',
        isConfigured: () => true,
      });

    const deepseek = createAIAdapter('deepseek', { model: 'deepseek-reasoner', timeout: 120000, maxRetries: 3 });
    const openai = createAIAdapter('openai', { model: 'gpt-4o-mini', timeout: 30000, maxRetries: 1 });

    expect(deepseek).toMatchObject({
      name: 'deepseek',
      apiKey: 'deepseek-key',
      model: 'deepseek-reasoner',
      timeout: 120000,
      maxRetries: 3,
    });
    expect(openai).toMatchObject({
      name: 'openai',
      apiKey: 'openai-key',
      model: 'gpt-4o-mini',
      timeout: 30000,
      maxRetries: 1,
    });
  });

  it('throws NOT_IMPLEMENTED for gemini and mistral', () => {
    mockGetProvider
      .mockReturnValueOnce({
        name: 'Google Gemini',
        envKeyName: 'GOOGLE_AI_API_KEY',
        defaultModel: 'gemini-pro',
        isConfigured: () => true,
      })
      .mockReturnValueOnce({
        name: 'Mistral',
        envKeyName: 'MISTRAL_API_KEY',
        defaultModel: 'mistral-large',
        isConfigured: () => true,
      });

    expect(() => createAIAdapter('gemini')).toThrow(expect.objectContaining({ code: 'NOT_IMPLEMENTED' }));
    expect(() => createAIAdapter('mistral')).toThrow(expect.objectContaining({ code: 'NOT_IMPLEMENTED' }));
  });
});

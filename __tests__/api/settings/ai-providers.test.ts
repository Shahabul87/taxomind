/**
 * Tests for Settings AI Providers Route - app/api/settings/ai-providers/route.ts
 */

jest.mock('@/lib/sam/providers/ai-registry', () => ({
  getAllProviders: jest.fn(),
}));

import { GET } from '@/app/api/settings/ai-providers/route';
import { currentUser } from '@/lib/auth';
import { getAllProviders } from '@/lib/sam/providers/ai-registry';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetAllProviders = getAllProviders as jest.Mock;

describe('Settings ai-providers route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetAllProviders.mockReturnValue([
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI provider',
        models: ['gpt-4o'],
        defaultModel: 'gpt-4o',
        capabilities: ['chat', 'analysis'],
        isConfigured: jest.fn(() => true),
      },
    ]);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns provider list for authenticated users', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.providers).toHaveLength(1);
    expect(body.providers[0].id).toBe('openai');
    expect(body.providers[0].isConfigured).toBe(true);
  });

  it('returns 500 when provider discovery fails', async () => {
    mockGetAllProviders.mockImplementation(() => {
      throw new Error('registry failed');
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});

import { GET, POST } from '@/app/api/groups/[groupId]/resources/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  const dbRecord = db as Record<string, Record<string, jest.Mock> | undefined>;
  if (!dbRecord[modelName]) {
    dbRecord[modelName] = {} as Record<string, jest.Mock>;
  }
  for (const method of methods) {
    if (!(dbRecord[modelName] as Record<string, jest.Mock>)[method]) {
      (dbRecord[modelName] as Record<string, jest.Mock>)[method] = jest.fn();
    }
  }
  return dbRecord[modelName] as Record<string, jest.Mock>;
}

const groupResource = ensureModel('groupResource', ['create', 'findMany']);

function props(groupId = 'group-1') {
  return { params: Promise.resolve({ groupId }) };
}

describe('/api/groups/[groupId]/resources route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupResource.create.mockResolvedValue({ id: 'resource-1', title: 'Doc' });
    groupResource.findMany.mockResolvedValue([{ id: 'resource-1', title: 'Doc' }]);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/groups/group-1/resources', {
      method: 'POST',
      body: JSON.stringify({ title: 'Doc', type: 'LINK' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never, props());
    expect(res.status).toBe(401);
  });

  it('POST creates group resource', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/resources', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Doc',
        description: 'desc',
        type: 'LINK',
        url: 'https://example.com',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('resource-1');
    expect(groupResource.create).toHaveBeenCalled();
  });

  it('GET returns group resources', async () => {
    const res = await GET(new Request('http://localhost:3000/api/groups/group-1/resources') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(groupResource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: 'group-1' },
      })
    );
  });

  it('GET returns 500 on query failure', async () => {
    groupResource.findMany.mockRejectedValueOnce(new Error('db fail'));

    const res = await GET(new Request('http://localhost:3000/api/groups/group-1/resources') as never, props());
    expect(res.status).toBe(500);
  });
});

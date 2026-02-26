import { DELETE, PATCH } from '@/app/api/bills/[billId]/route';
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

const bill = ensureModel('bill', ['update', 'delete']);

function params(billId = 'bill-1') {
  return { params: Promise.resolve({ billId }) };
}

describe('/api/bills/[billId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    bill.update.mockResolvedValue({ id: 'bill-1', title: 'Updated' });
    bill.delete.mockResolvedValue({ id: 'bill-1' });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/bills/bill-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, params());
    expect(res.status).toBe(401);
  });

  it('PATCH updates bill', async () => {
    const req = new Request('http://localhost:3000/api/bills/bill-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated', amount: 1300 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('bill-1');
    expect(bill.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'bill-1', userId: 'user-1' } })
    );
  });

  it('DELETE removes bill and returns success', async () => {
    const req = new Request('http://localhost:3000/api/bills/bill-1', { method: 'DELETE' });
    const res = await DELETE(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(bill.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'bill-1', userId: 'user-1' } })
    );
  });

  it('DELETE returns 500 on db failure', async () => {
    bill.delete.mockRejectedValueOnce(new Error('db down'));

    const req = new Request('http://localhost:3000/api/bills/bill-1', { method: 'DELETE' });
    const res = await DELETE(req, params());

    expect(res.status).toBe(500);
  });
});
